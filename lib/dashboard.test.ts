import { describe, expect, it } from "vitest";
import { deriveDashboardMetrics } from "./dashboard";

describe("dashboard metrics", () => {
  it("derives operational counts from real lifecycle statuses", () => {
    const result = deriveDashboardMetrics(
      ["DRAFT", "SUBMITTED", "APPROVED", "ORDERED", "COMPLETED", "CANCELLED"],
      ["CREATED", "ISSUED", "ACKNOWLEDGED", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED", "CANCELLED"],
    );
    expect(result).toEqual({ openRequests: 4, pendingApprovals: 1, activeOrders: 5, awaitingReceipt: 2 });
  });
});
