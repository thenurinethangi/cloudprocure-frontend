export function canIssueOrder(status: string): boolean {
  return status === "CREATED";
}

export function canAcknowledgeOrder(status: string): boolean {
  return status === "ISSUED";
}

export function canReceiveOrder(status: string): boolean {
  return status === "ACKNOWLEDGED" || status === "PARTIALLY_RECEIVED";
}

export function canCloseOrder(status: string): boolean {
  return status === "RECEIVED";
}

export function canCancelOrder(status: string): boolean {
  return ["CREATED", "ISSUED", "ACKNOWLEDGED"].includes(status);
}
