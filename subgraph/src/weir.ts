import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  EndowmentOpened, Harvested, ToppedUp, AgentChanged, RuleChanged, EndowmentClosed,
} from "../generated/Weir/Weir";
import { Endowment, Harvest, Agent, Protocol } from "../generated/schema";

const PROTOCOL_ID = "weir";

function protocol(): Protocol {
  let p = Protocol.load(PROTOCOL_ID);
  if (p == null) {
    p = new Protocol(PROTOCOL_ID);
    p.endowmentCount = 0;
    p.activeEndowmentCount = 0;
    p.totalPrincipalCommitted = BigInt.zero();
    p.totalYieldPaid = BigInt.zero();
    p.harvestCount = 0;
  }
  return p as Protocol;
}

function agentOf(addr: Bytes, ts: BigInt): Agent {
  let a = Agent.load(addr.toHexString());
  if (a == null) {
    a = new Agent(addr.toHexString());
    a.totalReceived = BigInt.zero();
    a.endowmentCount = 0;
    a.harvestCount = 0;
    a.firstSeen = ts;
  }
  return a as Agent;
}

export function handleOpened(event: EndowmentOpened): void {
  const e = new Endowment(event.params.id.toString());
  e.owner = event.params.owner;
  e.agent = event.params.agent;
  e.asset = event.params.asset;
  e.principal = event.params.principal;
  e.withheld = BigInt.zero();
  e.minPayout = event.params.minPayout;
  e.minInterval = event.params.minInterval;
  e.openIndex = event.params.index;
  e.lastIndex = event.params.index;
  e.totalPaid = BigInt.zero();
  e.harvestCount = 0;
  e.active = true;
  e.openedAt = event.block.timestamp;
  e.openedTx = event.transaction.hash;
  e.save();

  const a = agentOf(event.params.agent, event.block.timestamp);
  a.endowmentCount = a.endowmentCount + 1;
  a.save();

  const p = protocol();
  p.endowmentCount = p.endowmentCount + 1;
  p.activeEndowmentCount = p.activeEndowmentCount + 1;
  p.totalPrincipalCommitted = p.totalPrincipalCommitted.plus(event.params.principal);
  p.save();
}

export function handleHarvested(event: Harvested): void {
  const eid = event.params.id.toString();
  const h = new Harvest(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  h.endowment = eid;
  h.agent = event.params.agent;
  h.asset = event.params.asset;
  h.amount = event.params.amount;
  h.fromIndex = event.params.fromIndex;
  h.toIndex = event.params.toIndex;
  h.totalPaidAfter = event.params.totalPaid;
  h.timestamp = event.block.timestamp;
  h.block = event.block.number;
  h.tx = event.transaction.hash;
  h.caller = event.transaction.from;
  h.save();

  const e = Endowment.load(eid);
  if (e != null) {
    e.lastIndex = event.params.toIndex;
    e.totalPaid = event.params.totalPaid;
    e.harvestCount = e.harvestCount + 1;
    e.save();
  }

  const a = agentOf(event.params.agent, event.block.timestamp);
  a.totalReceived = a.totalReceived.plus(event.params.amount);
  a.harvestCount = a.harvestCount + 1;
  a.lastPaidAt = event.block.timestamp;
  a.save();

  const p = protocol();
  p.totalYieldPaid = p.totalYieldPaid.plus(event.params.amount);
  p.harvestCount = p.harvestCount + 1;
  p.save();
}

export function handleToppedUp(event: ToppedUp): void {
  const e = Endowment.load(event.params.id.toString());
  if (e == null) return;
  const delta = event.params.newPrincipal.minus(e.principal);
  e.principal = event.params.newPrincipal;
  e.save();

  const p = protocol();
  p.totalPrincipalCommitted = p.totalPrincipalCommitted.plus(delta);
  p.save();
}

export function handleAgentChanged(event: AgentChanged): void {
  const e = Endowment.load(event.params.id.toString());
  if (e == null) return;
  e.agent = event.params.newAgent;
  e.save();

  const a = agentOf(event.params.newAgent, event.block.timestamp);
  a.endowmentCount = a.endowmentCount + 1;
  a.save();
}

export function handleRuleChanged(event: RuleChanged): void {
  const e = Endowment.load(event.params.id.toString());
  if (e == null) return;
  e.minPayout = event.params.minPayout;
  e.minInterval = event.params.minInterval;
  e.save();
}

export function handleClosed(event: EndowmentClosed): void {
  const e = Endowment.load(event.params.id.toString());
  if (e == null) return;
  e.active = false;
  e.closedAt = event.block.timestamp;
  const returned = e.principal;
  e.principal = BigInt.zero();
  e.save();

  const p = protocol();
  p.activeEndowmentCount = p.activeEndowmentCount - 1;
  p.totalPrincipalCommitted = p.totalPrincipalCommitted.minus(returned);
  p.save();
}
