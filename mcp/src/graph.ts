/**
 * Reads Weir state from The Graph. Every figure an agent acts on comes from the
 * subgraph; the chain is only used as a fallback when no subgraph is configured,
 * so the agent's view of its own solvency is a single indexed query rather than
 * a fan-out of eth_calls.
 */
export const SUBGRAPH_URL = process.env.WEIR_SUBGRAPH_URL ?? "";

export type GqlEndowment = {
  id: string;
  owner: string;
  agent: string;
  asset: string;
  principal: string;
  minPayout: string;
  minInterval: string;
  openIndex: string;
  lastIndex: string;
  totalPaid: string;
  harvestCount: number;
  active: boolean;
  openedAt: string;
};

export type GqlHarvest = {
  id: string;
  amount: string;
  timestamp: string;
  tx: string;
  caller: string;
  fromIndex: string;
  toIndex: string;
};

export async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!SUBGRAPH_URL) throw new Error("WEIR_SUBGRAPH_URL is not set");
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`subgraph HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  if (!json.data) throw new Error("subgraph returned no data");
  return json.data;
}

export async function endowmentsForAgent(agent: string) {
  const d = await gql<{ endowments: GqlEndowment[] }>(
    `query($agent: Bytes!) {
       endowments(where: { agent: $agent }, orderBy: openedAt, orderDirection: desc) {
         id owner agent asset principal minPayout minInterval openIndex lastIndex
         totalPaid harvestCount active openedAt
       }
     }`,
    { agent: agent.toLowerCase() }
  );
  return d.endowments;
}

export async function harvestsForAgent(agent: string, limit = 50) {
  const d = await gql<{ harvests: GqlHarvest[] }>(
    `query($agent: Bytes!, $limit: Int!) {
       harvests(where: { agent: $agent }, orderBy: timestamp, orderDirection: desc, first: $limit) {
         id amount timestamp tx caller fromIndex toIndex
       }
     }`,
    { agent: agent.toLowerCase(), limit }
  );
  return d.harvests;
}
