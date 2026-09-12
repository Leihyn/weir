export const weirAbi = [
  { type: "function", name: "nextId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function", name: "endowments", stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" }, { name: "agent", type: "address" },
      { name: "asset", type: "address" }, { name: "principal", type: "uint256" },
      { name: "lastIndex", type: "uint256" }, { name: "minPayout", type: "uint256" },
      { name: "totalPaid", type: "uint256" }, { name: "withheld", type: "uint256" },
      { name: "minInterval", type: "uint64" }, { name: "lastHarvest", type: "uint64" },
      { name: "active", type: "bool" },
    ],
  },
  { type: "function", name: "accrued", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "harvestable", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "idsOfOwner", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256[]" }] },
  { type: "function", name: "idsOfAgent", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256[]" }] },
  { type: "function", name: "solvency", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ name: "committed", type: "uint256" }, { name: "held", type: "uint256" }] },
  {
    type: "function", name: "open", stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" }, { name: "amount", type: "uint256" },
      { name: "agent", type: "address" }, { name: "minPayout", type: "uint256" },
      { name: "minInterval", type: "uint64" },
    ],
    outputs: [{ type: "uint256" }],
  },
  { type: "function", name: "harvest", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "topUp", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "uint256" }], outputs: [] },
  { type: "function", name: "close", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
  { type: "function", name: "setAgent", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [] },
  { type: "function", name: "setRule", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint64" }], outputs: [] },
  {
    type: "event", name: "Harvested",
    inputs: [
      { name: "id", type: "uint256", indexed: true }, { name: "agent", type: "address", indexed: true },
      { name: "asset", type: "address", indexed: false }, { name: "amount", type: "uint256", indexed: false },
      { name: "fromIndex", type: "uint256", indexed: false }, { name: "toIndex", type: "uint256", indexed: false },
      { name: "totalPaid", type: "uint256", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

export const aavePoolAbi = [
  { type: "function", name: "getReserveNormalizedIncome", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getReserveData", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bytes" }] },
] as const;
