export type DashboardMetrics = {
  openRequests: number;
  pendingApprovals: number;
  activeOrders: number;
  awaitingReceipt: number;
};

const openRequestStatuses = new Set(["DRAFT", "SUBMITTED", "APPROVED", "ORDERED"]);
const inactiveOrderStatuses = new Set(["CLOSED", "CANCELLED"]);
const receiptQueueStatuses = new Set(["ACKNOWLEDGED", "PARTIALLY_RECEIVED"]);

export function deriveDashboardMetrics(requestStatuses: string[], orderStatuses: string[]): DashboardMetrics {
  return {
    openRequests: requestStatuses.filter((status) => openRequestStatuses.has(status)).length,
    pendingApprovals: requestStatuses.filter((status) => status === "SUBMITTED").length,
    activeOrders: orderStatuses.filter((status) => !inactiveOrderStatuses.has(status)).length,
    awaitingReceipt: orderStatuses.filter((status) => receiptQueueStatuses.has(status)).length,
  };
}
