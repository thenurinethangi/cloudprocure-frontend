import { describe, expect, it } from "vitest";
import {
  canAcknowledgeOrder,
  canCancelOrder,
  canCloseOrder,
  canIssueOrder,
  canReceiveOrder,
} from "./order-workflow";

describe("order workflow controls", () => {
  it("uses the backend CREATED state for initial lifecycle actions", () => {
    expect(canIssueOrder("CREATED")).toBe(true);
    expect(canIssueOrder("DRAFT")).toBe(false);
    expect(canCancelOrder("CREATED")).toBe(true);
  });

  it("shows only transitions accepted by the order aggregate", () => {
    expect(canAcknowledgeOrder("ISSUED")).toBe(true);
    expect(canAcknowledgeOrder("CREATED")).toBe(false);
    expect(canReceiveOrder("ISSUED")).toBe(false);
    expect(canReceiveOrder("ACKNOWLEDGED")).toBe(true);
    expect(canReceiveOrder("PARTIALLY_RECEIVED")).toBe(true);
    expect(canCloseOrder("RECEIVED")).toBe(true);
    expect(canCloseOrder("ACKNOWLEDGED")).toBe(false);
    expect(canCancelOrder("PARTIALLY_RECEIVED")).toBe(false);
  });
});
