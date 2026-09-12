// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Weir} from "../src/Weir.sol";
import {IPool} from "../src/interfaces/IAaveV3.sol";

contract Deploy is Script {
    // Aave v3 Pool, Base mainnet. Verified live: POOL_REVISION() == 11.
    address constant AAVE_POOL_BASE = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5;

    function run() external returns (Weir weir) {
        address poolAddr = vm.envOr("AAVE_POOL", AAVE_POOL_BASE);
        vm.startBroadcast();
        weir = new Weir(IPool(poolAddr));
        vm.stopBroadcast();
        console2.log("Weir deployed at:", address(weir));
        console2.log("Aave pool:       ", poolAddr);
    }
}
