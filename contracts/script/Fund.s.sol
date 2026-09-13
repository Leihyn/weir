// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";
import {Networks} from "./Networks.sol";

interface IAaveFaucet {
    function mint(address token, address to, uint256 amount) external returns (uint256);
}

interface IWETH {
    function deposit() external payable;
}

/// @notice Testnet only. Mints test USDC from Aave's permissionless faucet and wraps
///         a little ETH, so a demo endowment can be funded without anyone sending money.
contract Fund is Script {
    function run() external {
        Networks.Config memory cfg = Networks.forChain(block.chainid);
        require(cfg.aaveFaucet != address(0), "Fund: no faucet on this network (mainnet?)");

        uint256 usdcAmount = vm.envOr("USDC_AMOUNT", uint256(250_000e6));
        uint256 wrapAmount = vm.envOr("WRAP_WEI", uint256(0.002 ether));

        vm.startBroadcast();
        // msg.sender read BEFORE startBroadcast is forge's default script sender, not the
        // signer. Minting to it sends the tokens to an address you do not control, and the
        // script still reports success. Read the real broadcaster instead.
        (, address me,) = vm.readCallers();
        IAaveFaucet(cfg.aaveFaucet).mint(cfg.usdc, me, usdcAmount);
        if (wrapAmount > 0) IWETH(cfg.weth).deposit{value: wrapAmount}();
        vm.stopBroadcast();

        console2.log("network    :", cfg.name);
        console2.log("USDC minted:", IERC20(cfg.usdc).balanceOf(me));
        console2.log("WETH held  :", IERC20(cfg.weth).balanceOf(me));
    }
}
