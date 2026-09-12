// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Weir} from "../src/Weir.sol";
import {IPool} from "../src/interfaces/IAaveV3.sol";
import {ISwapRouter02} from "../src/interfaces/IUniswapV3.sol";

contract Deploy is Script {
    // Base mainnet. Aave pool verified live: POOL_REVISION() == 11.
    address constant AAVE_POOL_BASE = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5;
    address constant UNI_ROUTER_BASE = 0x2626664c2603336E57B271c5C0b26F421741e481;
    address constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external returns (Weir weir) {
        address poolAddr = vm.envOr("AAVE_POOL", AAVE_POOL_BASE);
        address routerAddr = vm.envOr("UNI_ROUTER", UNI_ROUTER_BASE);
        address payout = vm.envOr("PAYOUT_TOKEN", USDC_BASE);

        vm.startBroadcast();
        weir = new Weir(IPool(poolAddr), ISwapRouter02(routerAddr), payout);
        vm.stopBroadcast();

        console2.log("Weir deployed at:", address(weir));
        console2.log("Aave pool:       ", poolAddr);
        console2.log("Uniswap router:  ", routerAddr);
        console2.log("Payout token:    ", payout);
    }
}
