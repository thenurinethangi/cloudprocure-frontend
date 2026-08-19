"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Money,
  PageHeader,
  StatCard,
  StatusBadge,
  date,
} from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import type { PageResponse, PurchaseOrder } from "@/lib/types";
export default function OrdersPage() {
  const [status, setStatus] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const path = useMemo(
    () =>
      `/api/orders?size=100&sort=createdAt,desc${status ? `&status=${status}` : ""}${poNumber ? `&poNumber=${encodeURIComponent(poNumber)}` : ""}`,
    [status, poNumber],
  );
  const { data, error, loading, reload } =
    useResource<PageResponse<PurchaseOrder>>(path);
  return (
    <>
      <PageHeader
        eyebrow="Fulfilment"
        title="Purchase orders"
        description="Track order issuance, supplier acknowledgment, goods receipt and procurement synchronization."
      />
      {data && <section className="stats-grid">
        <StatCard label="Active orders" value={data.content.filter((order) => !["CLOSED", "CANCELLED"].includes(order.status)).length} detail="Currently in fulfilment"/>
        <StatCard label="Awaiting acknowledgement" value={data.content.filter((order) => order.status === "ISSUED").length} detail="Issued to suppliers" tone="amber"/>
        <StatCard label="Receiving" value={data.content.filter((order) => ["ACKNOWLEDGED", "PARTIALLY_RECEIVED"].includes(order.status)).length} detail="Ready for goods receipt" tone="blue"/>
        <StatCard label="Pending synchronization" value={data.content.filter((order) => order.procurementSyncStatus === "PENDING").length} detail="Automatic retry queue" tone="violet"/>
      </section>}
      <section className="panel">
        <div className="filters">
          <input
            placeholder="PO number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {[
              "CREATED",
              "ISSUED",
              "ACKNOWLEDGED",
              "PARTIALLY_RECEIVED",
              "RECEIVED",
              "CLOSED",
              "CANCELLED",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} retry={reload} />
        ) : !data?.content.length ? (
          <EmptyState
            title="No purchase orders"
            detail="Approve a request, assign a supplier, then create its purchase order."
            action={{ label: "View requests", href: "/requests" }}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Supplier</th>
                  <th>Expected</th>
                  <th>Status</th>
                  <th>Sync</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link className="cell-title" href={`/orders/${o.id}`}>
                        {o.poNumber}
                      </Link>
                      <span className="cell-meta">
                        Created {date(o.createdAt)}
                      </span>
                    </td>
                    <td>
                      {o.supplierNameSnapshot}
                      <span className="cell-meta">
                        {o.supplierCodeSnapshot}
                      </span>
                    </td>
                    <td>{date(o.expectedDeliveryDate)}</td>
                    <td>
                      <StatusBadge value={o.status} />
                    </td>
                    <td>
                      <StatusBadge value={o.procurementSyncStatus} />
                    </td>
                    <td>
                      <Money amount={o.totalAmount} currency={o.currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
