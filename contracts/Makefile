RPC_BASE ?= https://mainnet.base.org
# fork tests need --threads 1: concurrent requests trigger TLS BadRecordMac
export BASE_RPC_URL ?= https://base.drpc.org

build:      ; forge build
test:       ; forge test --threads 1 -vv
fork-test:  ; forge test --match-contract WeirForkTest --threads 1 -vv
fmt:        ; forge fmt
gas:        ; forge test --threads 1 --gas-report

# Deploy. Supply a signer yourself; no key is ever stored in this repo.
#   make deploy ACCOUNT=weir-deployer       (uses a cast keystore account)
#   make deploy LEDGER=1                    (uses a hardware wallet)
deploy:
	forge script script/Deploy.s.sol:Deploy \
	  --rpc-url $(RPC_BASE) --broadcast --verify \
	  $(if $(ACCOUNT),--account $(ACCOUNT),) $(if $(LEDGER),--ledger,) -vvv

.PHONY: build test fork-test fmt gas deploy
