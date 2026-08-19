import { describe, expect, it } from "vitest";
import { orderLifecycle, requestLifecycle } from "./lifecycle";

describe("procurement lifecycle presentation", () => {
  it("marks the current request stage and prior stages complete", () => {
    expect(requestLifecycle("APPROVED").map((step) => step.state)).toEqual([
      "complete", "complete", "current", "upcoming", "upcoming",
    ]);
  });

  it("marks a partially received order as the receiving stage", () => {
    const receiving = orderLifecycle("PARTIALLY_RECEIVED").find((step) => step.label === "Receiving");
    expect(receiving?.state).toBe("current");
  });
});
