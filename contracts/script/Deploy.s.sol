// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Weir} from "../src/Weir.sol";
import {IPool} from "../src/interfaces/IAaveV3.sol";
import {ISwapRouter02} from "../src/interfaces/IUniswapV3.sol";
import {Networks} from "./Networks.sol";

contract Deploy is Script {
    function run() external returns (Weir weir) {
        Networks.Config memory cfg = Networks.forChain(block.chainid);

        vm.startBroadcast();
        weir = new Weir(IPool(cfg.aavePool), ISwapRouter02(cfg.uniRouter), cfg.usdc);
        vm.stopBroadcast();

        console2.log("network        :", cfg.name);
        console2.log("Weir           :", address(weir));
        console2.log("Aave pool      :", cfg.aavePool);
        console2.log("Uniswap router :", cfg.uniRouter);
        console2.log("payout token   :", cfg.usdc);
    }
}
