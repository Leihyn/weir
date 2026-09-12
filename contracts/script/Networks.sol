// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Verified live 12 Sep 2026 by direct eth_call against each network.
library Networks {
    struct Config {
        address aavePool;
        address uniRouter;
        address usdc;
        address weth;
        address aaveFaucet; // zero on mainnet
        string name;
    }

    function base() internal pure returns (Config memory) {
        return Config({
            // POOL_REVISION() == 11
            aavePool: 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5,
            uniRouter: 0x2626664c2603336E57B271c5C0b26F421741e481,
            usdc: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,
            weth: 0x4200000000000000000000000000000000000006,
            aaveFaucet: address(0),
            name: "base"
        });
    }

    function baseSepolia() internal pure returns (Config memory) {
        return Config({
            // POOL_REVISION() == 10, USDC index 1.243961, WETH supply APY 19.05%
            aavePool: 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27,
            uniRouter: 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4,
            usdc: 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f,
            weth: 0x4200000000000000000000000000000000000006,
            // permissionless: mint(address token, address to, uint256 amount)
            aaveFaucet: 0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc,
            name: "base-sepolia"
        });
    }

    function forChain(uint256 chainId) internal pure returns (Config memory) {
        if (chainId == 8453) return base();
        if (chainId == 84532) return baseSepolia();
        revert("Networks: unsupported chain");
    }
}
