// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {Weir} from "../src/Weir.sol";
import {IPool} from "../src/interfaces/IAaveV3.sol";
import {ISwapRouter02} from "../src/interfaces/IUniswapV3.sol";
import {MockERC20, MockAavePool, MockAToken, MockOracle, MockAddressesProvider, MockRouter} from "./mocks/Mocks.sol";

/// @dev Offline, deterministic, no RPC. Complements the fork suite: the fork tests
///      prove Weir works against the real protocol, these prove the arithmetic holds
///      across the whole input space including cases the real chain will not produce
///      on demand.
contract WeirUnitTest is Test {
    uint256 constant RAY = 1e27;

    MockERC20 usdc;
    MockERC20 weth;
    MockAavePool pool;
    MockAToken aUsdc;
    MockAToken aWeth;
    MockOracle oracle;
    MockRouter router;
    Weir weir;

    address owner = makeAddr("owner");
    address agent = makeAddr("agent");
    address stranger = makeAddr("stranger");

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        oracle = new MockOracle();
        MockAddressesProvider provider = new MockAddressesProvider(address(oracle));
        pool = new MockAavePool(address(provider));
        aUsdc = new MockAToken(pool, address(usdc));
        aWeth = new MockAToken(pool, address(weth));
        pool.registerAToken(address(usdc), address(aUsdc));
        pool.registerAToken(address(weth), address(aWeth));
        pool.setIndex(address(usdc), RAY);
        pool.setIndex(address(weth), RAY);
        oracle.setPrice(address(usdc), 1e8);
        oracle.setPrice(address(weth), 2500e8);
        router = new MockRouter(oracle);
        weir = new Weir(IPool(address(pool)), ISwapRouter02(address(router)), address(usdc));
    }

    function _open(uint256 amount) internal returns (uint256 id) {
        usdc.mint(owner, amount);
        vm.startPrank(owner);
        usdc.approve(address(weir), amount);
        id = weir.open(address(usdc), amount, agent, 0, 0);
        vm.stopPrank();
    }

    function _grow(address asset, uint256 bps) internal {
        uint256 i = pool.getReserveNormalizedIncome(asset);
        pool.setIndex(asset, i + (i * bps) / 10_000);
    }

    // ------------------------------------------------------------------ fuzz

    /// The core invariant, across the input space: principal never dips below P.
    function testFuzz_principalNeverDipsBelowCommitted(uint96 principal, uint16 growthBps) public {
        principal = uint96(bound(principal, 1e6, 1e15)); // 1 USDC .. 1e9 USDC
        growthBps = uint16(bound(growthBps, 1, 5_000)); // up to +50%

        uint256 id = _open(principal);
        _grow(address(usdc), growthBps);

        uint256 before = aUsdc.balanceOf(address(weir));
        assertGe(before, principal, "pre-harvest balance covers principal");

        uint256 releasable = weir.accrued(id);
        if (releasable == 0) return; // growth rounded to nothing at this size

        weir.harvest(id);

        assertGe(aUsdc.balanceOf(address(weir)), principal, "principal intact");
        assertEq(usdc.balanceOf(agent), releasable, "agent paid exactly the releasable amount");
        assertEq(weir.committedPrincipal(address(usdc)), principal, "accounting unchanged");
    }

    /// accrued() must equal the documented formula, less the rounding reserve.
    function testFuzz_accruedMatchesFormula(uint96 principal, uint32 growthBps) public {
        principal = uint96(bound(principal, 1e6, 1e15));
        growthBps = uint32(bound(growthBps, 1, 100_000));

        uint256 id = _open(principal);
        uint256 i0 = pool.getReserveNormalizedIncome(address(usdc));
        _grow(address(usdc), growthBps);
        uint256 i1 = pool.getReserveNormalizedIncome(address(usdc));

        uint256 gross = (uint256(principal) * (i1 - i0)) / i0;
        uint256 reserve = i1 / RAY + 1;
        uint256 expected = gross > reserve ? gross - reserve : 0;

        assertEq(weir.accrued(id), expected, "accrued matches P*(i1-i0)/i0 minus reserve");
    }

    /// Many harvests at many growth rates must never make the contract insolvent.
    function testFuzz_solvencyAcrossManyHarvests(uint16 growthBps, uint8 rounds) public {
        growthBps = uint16(bound(growthBps, 1, 500));
        rounds = uint8(bound(rounds, 1, 40));

        uint256 id1 = _open(10_000e6);
        uint256 id2 = _open(250e6);

        for (uint256 i = 0; i < rounds; i++) {
            _grow(address(usdc), growthBps);
            if (weir.accrued(id1) > 0) weir.harvest(id1);
            if (weir.accrued(id2) > 0) weir.harvest(id2);
            (uint256 committed, uint256 held) = weir.solvency(address(usdc));
            assertGe(held, committed, "insolvent");
        }

        // both owners must still get all principal back
        uint256 before = usdc.balanceOf(owner);
        vm.startPrank(owner);
        weir.close(id1);
        weir.close(id2);
        vm.stopPrank();
        assertEq(usdc.balanceOf(owner) - before, 10_250e6, "full principal returned");
    }

    // ---------------------------------------------------------------- swap path

    /// The deterministic sandwich test: the router fills 10% below oracle, the
    /// contract's 1% floor must reject it even though the caller passed minOut = 0.
    function test_oracleFloorRejectsBadFill() public {
        uint256 id = _openWeth(10 ether);
        _grow(address(weth), 200); // +2%

        router.setFillBps(9_000); // deliver 90% of oracle-implied
        vm.prank(stranger);
        vm.expectRevert(bytes("Too little received"));
        weir.harvestAndSwap(id, 500, 0);
    }

    /// A fill inside tolerance goes through and the agent is paid in USDC.
    function test_swapWithinTolerancePaysAgentInUsdc() public {
        uint256 id = _openWeth(10 ether);
        _grow(address(weth), 200);

        uint256 amountIn = weir.accrued(id);
        router.setFillBps(9_950); // 0.5% slippage, inside the 1% floor

        vm.prank(stranger);
        uint256 out = weir.harvestAndSwap(id, 500, 0);

        assertGt(out, 0);
        assertEq(usdc.balanceOf(agent), out, "USDC went to the agent");
        assertEq(usdc.balanceOf(stranger), 0, "caller gained nothing");
        // 2500 USD per WETH, 0.5% haircut
        assertApproxEqRel(out, (amountIn * 2500 * 995) / (1e12 * 1000), 1e15);
    }

    /// A caller may raise the guard above the oracle floor, and it binds.
    function test_callerCanRaiseButNotLowerTheFloor() public {
        uint256 id = _openWeth(10 ether);
        _grow(address(weth), 200);
        router.setFillBps(9_950);

        uint256 amountIn = weir.accrued(id);
        uint256 oracleOut = (amountIn * 2500) / 1e12;

        vm.expectRevert(bytes("Too little received"));
        weir.harvestAndSwap(id, 500, oracleOut); // demanding full oracle price binds
    }

    function _openWeth(uint256 amount) internal returns (uint256 id) {
        weth.mint(owner, amount);
        vm.startPrank(owner);
        weth.approve(address(weir), amount);
        id = weir.open(address(weth), amount, agent, 0, 0);
        vm.stopPrank();
    }

    // ------------------------------------------------------------ token safety

    /// A token that returns false instead of reverting must not be silently accepted.
    function test_falseReturningTokenIsRejected() public {
        uint256 id = _open(1_000e6);
        _grow(address(usdc), 100);
        usdc.setReturnsFalse(true);
        vm.expectRevert(abi.encodeWithSignature("TokenCallFailed(address)", address(usdc)));
        weir.harvest(id);
    }

    // ------------------------------------------------------------------ rules

    function test_zeroGrowthHarvestReverts() public {
        uint256 id = _open(1_000e6);
        vm.expectRevert(abi.encodeWithSignature("NothingAccrued()"));
        weir.harvest(id);
    }

    function test_topUpSettlesAgentFirst() public {
        uint256 id = _open(1_000e6);
        _grow(address(usdc), 100);
        uint256 pending = weir.accrued(id);
        assertGt(pending, 0);

        usdc.mint(owner, 500e6);
        vm.startPrank(owner);
        usdc.approve(address(weir), 500e6);
        weir.topUp(id, 500e6);
        vm.stopPrank();

        assertEq(usdc.balanceOf(agent), pending, "agent settled before principal grew");
        assertEq(weir.committedPrincipal(address(usdc)), 1_500e6);
    }

    function test_closePaysWithheldReserveToAgent() public {
        uint256 id = _open(10_000e6);
        for (uint256 i = 0; i < 20; i++) {
            _grow(address(usdc), 50);
            weir.harvest(id);
        }
        uint256 agentBefore = usdc.balanceOf(agent);
        uint256 ownerBefore = usdc.balanceOf(owner);

        vm.prank(owner);
        weir.close(id);

        assertEq(usdc.balanceOf(owner) - ownerBefore, 10_000e6, "owner got exactly principal");
        assertGt(usdc.balanceOf(agent), agentBefore, "withheld reserve went to the agent");
        assertEq(weir.committedPrincipal(address(usdc)), 0, "principal fully released");

        // Weir claims exactly principal + withheld. Anything the pool holds ABOVE
        // that is not claimable by design: there is no sweep, so a donated aToken or
        // a rounding surplus stays put. It is bounded by the number of harvests, and
        // the mock's own +1 funding buffer accounts for it here.
        uint256 stranded = aUsdc.balanceOf(address(weir));
        assertLe(stranded, 64, "stranded surplus stays bounded dust");
        console2.log("stranded dust after 20 harvests + close (6dp):", stranded);
    }
}
