RPC_BASE ?= https://mainnet.base.org

build:      ; forge build
test:       ; forge test -vv
fork-test:  ; forge test --match-contract WeirForkTest -vv
fmt:        ; forge fmt
gas:        ; forge test --gas-report

# Deploy. Supply a signer yourself; no key is ever stored in this repo.
#   make deploy ACCOUNT=weir-deployer       (uses a cast keystore account)
#   make deploy LEDGER=1                    (uses a hardware wallet)
deploy:
	forge script script/Deploy.s.sol:Deploy \
	  --rpc-url $(RPC_BASE) --broadcast --verify \
	  $(if $(ACCOUNT),--account $(ACCOUNT),) $(if $(LEDGER),--ledger,) -vvv

.PHONY: build test fork-test fmt gas deploy
