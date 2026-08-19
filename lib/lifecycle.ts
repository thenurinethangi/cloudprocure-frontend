import type { LifecycleStep } from "@/components/ui";

const requestStages = [
  { label: "Draft", meta: "Request prepared" },
  { label: "Submitted", meta: "Sent for review" },
  { label: "Approved", meta: "Approval recorded" },
  { label: "Ordered", meta: "Order created" },
  { label: "Completed", meta: "Procurement complete" },
];

const orderStages = [
  { label: "Created", meta: "Order prepared" },
  { label: "Issued", meta: "Sent to supplier" },
  { label: "Acknowledged", meta: "Supplier confirmed" },
  { label: "Receiving", meta: "Goods being received" },
  { label: "Received", meta: "Delivery complete" },
  { label: "Closed", meta: "Order closed" },
];

function buildLifecycle(
  stages: Array<{ label: string; meta: string }>,
  currentIndex: number,
  terminalState?: "cancelled" | "rejected",
): LifecycleStep[] {
  return stages.map((stage, index) => ({
    ...stage,
    state: terminalState && index === currentIndex
      ? "current"
      : index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

export function requestLifecycle(status: string): LifecycleStep[] {
  const statusIndexes: Record<string, number> = {
    DRAFT: 0,
    SUBMITTED: 1,
    APPROVED: 2,
    ORDERED: 3,
    COMPLETED: 4,
    REJECTED: 1,
    CANCELLED: 0,
  };
  return buildLifecycle(requestStages, statusIndexes[status] ?? 0, status === "REJECTED" ? "rejected" : status === "CANCELLED" ? "cancelled" : undefined);
}

export function orderLifecycle(status: string): LifecycleStep[] {
  const statusIndexes: Record<string, number> = {
    CREATED: 0,
    ISSUED: 1,
    ACKNOWLEDGED: 2,
    PARTIALLY_RECEIVED: 3,
    RECEIVED: 4,
    CLOSED: 5,
    CANCELLED: 0,
  };
  return buildLifecycle(orderStages, statusIndexes[status] ?? 0, status === "CANCELLED" ? "cancelled" : undefined);
}
