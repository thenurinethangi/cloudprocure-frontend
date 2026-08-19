import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityTable } from "./activity-table";
import type { ActivityEvent } from "@/lib/types";

const event: ActivityEvent = {
  id: "activity-1",
  service: "order-service",
  eventType: "GOODS_RECEIPT_RECORDED",
  entityType: "PURCHASE_ORDER",
  entityId: "1716f781-1111-4111-8111-111111111111",
  actor: "requester@cloudprocure.local",
  summary: "Goods receipt recorded",
  metadata: {},
  occurredAt: "2026-08-19T10:00:00Z",
};

describe("ActivityTable", () => {
  it("keeps event details in distinct compact table columns", () => {
    render(<ActivityTable events={[event]}/>);

    const table = screen.getByRole("table", { name: "Procurement activity" });
    expect(within(table).getByRole("columnheader", { name: "Event" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Actor" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Context" })).toBeInTheDocument();
    const cells = within(within(table).getAllByRole("row")[1]).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Goods receipt recorded");
    expect(cells[1]).toHaveTextContent("requester@cloudprocure.local");
    expect(within(table).getByText("order")).toBeInTheDocument();
    expect(within(table).getByText("1716f781")).toBeInTheDocument();
  });
});
