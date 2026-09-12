// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2, Vm} from "forge-std/Test.sol";
import {Weir} from "../src/Weir.sol";
import {IPool, IAToken} from "../src/interfaces/IAaveV3.sol";
import {ISwapRouter02} from "../src/interfaces/IUniswapV3.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

/// @dev Runs against live Aave v3 on Base. No mocks: the index that drives every
///      assertion is the real one the protocol is using right now.
contract WeirForkTest is Test {
    address constant AAVE_POOL = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant UNI_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;

    Weir weir;
    IPool pool = IPool(AAVE_POOL);

    address owner = makeAddr("owner");
    address agent = makeAddr("agent");
    address stranger = makeAddr("stranger");

    uint256 constant PRINCIPAL = 10_000e6; // 10k USDC

    /// @dev Pinned so the suite is deterministic, cacheable and reproducible by a
    ///      reviewer. Override with FORK_BLOCK=0 to run against the chain tip.
    uint256 constant FORK_BLOCK = 51206766;

    function setUp() public {
        uint256 blockNumber = vm.envOr("FORK_BLOCK", FORK_BLOCK);
        if (blockNumber == 0) {
            vm.createSelectFork(vm.rpcUrl("base"));
        } else {
            vm.createSelectFork(vm.rpcUrl("base"), blockNumber);
        }
        weir = new Weir(pool, ISwapRouter02(UNI_ROUTER), USDC);
        deal(USDC, owner, PRINCIPAL * 2);
    }

    function _open(uint256 floor, uint64 interval) internal returns (uint256 id) {
        vm.startPrank(owner);
        IERC20(USDC).approve(address(weir), type(uint256).max);
        id = weir.open(USDC, PRINCIPAL, agent, floor, interval);
        vm.stopPrank();
    }

    /// THE invariant: the agent is paid the yield and the principal is untouched.
    function test_principalExactlyPreservedAcrossHarvest() public {
        uint256 id = _open(0, 0);
        address aUSDC = pool.getReserveAToken(USDC);

        assertEq(weir.accrued(id), 0, "fresh endowment has no accrual");
        assertApproxEqAbs(IAToken(aUSDC).balanceOf(address(weir)), PRINCIPAL, 1, "supplied 1:1");

        vm.warp(block.timestamp + 30 days);

        uint256 expected = weir.accrued(id);
        assertGt(expected, 0, "index must have advanced");

        uint256 paid = weir.harvest(id);

        assertEq(paid, expected, "paid exactly the accrual");
        assertEq(IERC20(USDC).balanceOf(agent), paid, "agent received it");
        // The whole point: principal is back to exactly P, in asset terms.
        assertApproxEqAbs(IAToken(aUSDC).balanceOf(address(weir)), PRINCIPAL, 2, "principal preserved");
        assertEq(weir.committedPrincipal(USDC), PRINCIPAL, "accounting unchanged");

        console2.log("30d accrual on 10,000 USDC (6dp):", paid);
    }

    /// Harvest is permissionless, and a stranger calling it cannot profit.
    function test_permissionlessHarvestCannotBeRedirected() public {
        uint256 id = _open(0, 0);
        vm.warp(block.timestamp + 7 days);

        uint256 expected = weir.accrued(id);
        uint256 strangerBefore = IERC20(USDC).balanceOf(stranger);

        vm.prank(stranger);
        uint256 paid = weir.harvest(id);

        assertEq(paid, expected);
        assertEq(IERC20(USDC).balanceOf(agent), paid, "funds went to the agent");
        assertEq(IERC20(USDC).balanceOf(stranger), strangerBefore, "caller gained nothing");
    }

    /// The agent can never drain principal: repeated harvesting converges, never digs in.
    function test_repeatedHarvestNeverTouchesPrincipal() public {
        uint256 id = _open(0, 0);
        address aUSDC = pool.getReserveAToken(USDC);

        for (uint256 i = 0; i < 12; i++) {
            vm.warp(block.timestamp + 30 days);
            weir.harvest(id);
            uint256 bal = IAToken(aUSDC).balanceOf(address(weir));
            assertGe(bal, PRINCIPAL, "principal must never dip below P");
            assertLe(bal - PRINCIPAL, 128, "surplus stays bounded dust");
        }
        assertGt(IERC20(USDC).balanceOf(agent), 0, "a year of yield was paid out");
        console2.log("12 monthly harvests, total paid to agent:", IERC20(USDC).balanceOf(agent));
    }

    /// Solvency: committed principal is always covered by aTokens actually held.
    function test_solvencyHoldsWithMultipleEndowments() public {
        _open(0, 0);
        vm.warp(block.timestamp + 10 days);
        uint256 id2 = _open(0, 0); // opens at a later, higher index

        vm.warp(block.timestamp + 10 days);
        weir.harvest(id2);

        (uint256 committed, uint256 held) = weir.solvency(USDC);
        assertGe(held, committed, "never insolvent");
        assertEq(committed, PRINCIPAL * 2, "both principals committed");
    }

    function test_floorBlocksDustHarvest() public {
        uint256 id = _open(1_000e6, 0); // absurd floor
        vm.warp(block.timestamp + 1 days);
        vm.expectRevert();
        weir.harvest(id);
        // accrual is not lost, it keeps accumulating because lastIndex did not advance
        uint256 a1 = weir.accrued(id);
        vm.warp(block.timestamp + 1 days);
        assertGt(weir.accrued(id), a1, "accrual continues after a blocked harvest");
    }

    function test_intervalRateLimits() public {
        uint256 id = _open(0, 7 days);
        vm.warp(block.timestamp + 1 days);
        vm.expectRevert();
        weir.harvest(id);
        vm.warp(block.timestamp + 7 days);
        weir.harvest(id);
    }

    function test_closeReturnsPrincipalToOwnerAndYieldToAgent() public {
        uint256 id = _open(0, 0);
        vm.warp(block.timestamp + 60 days);

        uint256 pending = weir.accrued(id);
        uint256 ownerBefore = IERC20(USDC).balanceOf(owner);

        vm.prank(owner);
        weir.close(id);

        assertEq(IERC20(USDC).balanceOf(owner) - ownerBefore, PRINCIPAL, "owner got 100% of principal");
        assertEq(IERC20(USDC).balanceOf(agent), pending, "agent got the earned yield");
        assertEq(weir.committedPrincipal(USDC), 0);
    }

    function test_onlyOwnerCanCloseOrRetarget() public {
        uint256 id = _open(0, 0);
        vm.prank(stranger);
        vm.expectRevert();
        weir.close(id);
        vm.prank(agent);
        vm.expectRevert();
        weir.setAgent(id, stranger);
    }

    /// Regression: Aave's round-half-up burn used to leak a unit of principal per
    /// harvest. Hammer it across several endowments and assert solvency never breaks.
    function test_solvencyNeverLeaksAcrossManyHarvests() public {
        uint256 id1 = _open(0, 0);
        uint256 id2 = _open(0, 0);
        address aUSDC = pool.getReserveAToken(USDC);

        for (uint256 i = 0; i < 24; i++) {
            vm.warp(block.timestamp + 15 days);
            weir.harvest(id1);
            weir.harvest(id2);
            (uint256 committed, uint256 held) = weir.solvency(USDC);
            assertGe(held, committed, "principal leaked into yield");
        }

        // both owners must still be able to get all of their principal back
        uint256 ownerBefore = IERC20(USDC).balanceOf(owner);
        vm.startPrank(owner);
        weir.close(id1);
        weir.close(id2);
        vm.stopPrank();
        assertEq(IERC20(USDC).balanceOf(owner) - ownerBefore, PRINCIPAL * 2, "full principal returned");
        assertEq(IAToken(aUSDC).balanceOf(address(weir)), 0, "nothing stranded");
    }

    // ------------------------------------------------------ WETH swap path

    function _openWeth(uint256 amount) internal returns (uint256 id) {
        deal(WETH, owner, amount);
        vm.startPrank(owner);
        IERC20(WETH).approve(address(weir), amount);
        id = weir.open(WETH, amount, agent, 0, 0);
        vm.stopPrank();
    }

    /// A WETH endowment pays its agent in USDC: held in one asset, spent in another.
    function test_wethEndowmentPaysAgentInUsdc() public {
        uint256 id = _openWeth(10 ether);
        vm.warp(block.timestamp + 180 days);

        uint256 accruedWeth = weir.accrued(id);
        assertGt(accruedWeth, 0, "WETH reserve must have accrued");

        uint256 out = weir.harvestAndSwap(id, 500, 0);

        assertGt(out, 0, "agent received USDC");
        assertEq(IERC20(USDC).balanceOf(agent), out, "USDC landed with the agent, not the caller");
        assertEq(IERC20(WETH).balanceOf(address(weir)), 0, "no WETH left dangling in the contract");
        console2.log("180d WETH accrual (wei):", accruedWeth);
        console2.log("USDC paid to agent (6dp):", out);
    }

    /// minOut=0 from a hostile caller must not disable slippage protection: the
    /// oracle floor is a floor, so the caller can raise it but never lower it.
    function test_oracleFloorIsEnforcedEvenWhenCallerPassesZero() public {
        uint256 id = _openWeth(10 ether);
        vm.warp(block.timestamp + 180 days);

        uint256 amountIn = weir.accrued(id);

        vm.recordLogs();
        vm.prank(stranger);
        uint256 out = weir.harvestAndSwap(id, 500, 0);

        // recover the floor the contract computed from its own event
        Vm.Log[] memory logs = vm.getRecordedLogs();
        uint256 floorOut;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("HarvestedAndSwapped(uint256,address,address,uint256,address,uint256,uint256,uint256,uint256)")) {
                (,,, floorOut,,) = abi.decode(logs[i].data, (address, uint256, address, uint256, uint256, uint256));
            }
        }
        assertGt(floorOut, 0, "contract computed a non-zero oracle floor");
        assertGe(out, floorOut, "executed output respected the oracle floor");
        assertEq(IERC20(USDC).balanceOf(stranger), 0, "hostile caller gained nothing");
        assertGt(amountIn, 0);
    }

    /// A sandwich attempt: shove the pool price, then the floor must reject the swap.
    /// @dev Touches a large number of Uniswap tick slots, so it needs an RPC that
    ///      will serve them. Free public endpoints rate-limit it; set BASE_RPC_URL
    ///      to a private endpoint to run it.
    function test_sandwichAttemptRevertsAgainstOracleFloor() public {
        uint256 id = _openWeth(10 ether);
        vm.warp(block.timestamp + 180 days);

        // attacker dumps size into WETH->USDC to crater the executed price
        deal(WETH, stranger, 600 ether);
        vm.startPrank(stranger);
        IERC20(WETH).approve(UNI_ROUTER, type(uint256).max);
        ISwapRouter02(UNI_ROUTER).exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: WETH, tokenOut: USDC, fee: 500, recipient: stranger,
                amountIn: 600 ether, amountOutMinimum: 0, sqrtPriceLimitX96: 0
            })
        );
        // now try to harvest into the wrecked price
        vm.expectRevert();
        weir.harvestAndSwap(id, 500, 0);
        vm.stopPrank();
    }

    function test_harvestAndSwapRejectsMatchingAsset() public {
        uint256 id = _open(0, 0);
        vm.warp(block.timestamp + 30 days);
        vm.expectRevert();
        weir.harvestAndSwap(id, 500, 0);
    }
}
