RPC_BASE          ?= https://mainnet.base.org
RPC_BASE_SEPOLIA  ?= https://sepolia.base.org
# fork tests need --threads 1: concurrent requests trigger TLS BadRecordMac
export BASE_RPC_URL ?= https://base.drpc.org

build:       ; forge build
test:        ; forge test --threads 1 -vv
unit:        ; forge test --match-contract WeirUnitTest -vv
fork-test:   ; forge test --match-contract WeirForkTest --threads 1 -vv
fmt:         ; forge fmt
gas:         ; forge test --threads 1 --gas-report

# Supply a signer yourself; no key is stored in this repo.
#   make deploy-sepolia ACCOUNT=weir-deployer
SIGNER = $(if $(ACCOUNT),--account $(ACCOUNT),)$(if $(LEDGER),--ledger,)

deploy-sepolia:
	forge script script/Deploy.s.sol:Deploy --rpc-url $(RPC_BASE_SEPOLIA) --broadcast --verify $(SIGNER) -vvv

deploy-mainnet:
	forge script script/Deploy.s.sol:Deploy --rpc-url $(RPC_BASE) --broadcast --verify $(SIGNER) -vvv

# Mint test USDC from Aave's permissionless faucet and wrap a little ETH.
fund-sepolia:
	forge script script/Fund.s.sol:Fund --rpc-url $(RPC_BASE_SEPOLIA) --broadcast $(SIGNER) -vvv

.PHONY: build test unit fork-test fmt gas deploy-sepolia deploy-mainnet fund-sepolia
