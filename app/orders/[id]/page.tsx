"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useActor } from "@/components/actor-context";
import {
  ErrorState,
  LifecycleStepper,
  LoadingState,
  Money,
  PageHeader,
  StatusBadge,
  date,
} from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { orderLifecycle } from "@/lib/lifecycle";
import { useResource } from "@/lib/use-resource";
import {
  canAcknowledgeOrder,
  canCancelOrder,
  canCloseOrder,
  canIssueOrder,
  canReceiveOrder,
} from "@/lib/order-workflow";
import type { PurchaseOrder } from "@/lib/types";
type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  currency: string;
  originalFileName?: string;
};
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { actor } = useActor();
  const order = useResource<PurchaseOrder>(id ? `/api/orders/${id}` : null);
  const invoices = useResource<Invoice[]>(
    id ? `/api/orders/${id}/invoices` : null,
  );
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [received, setReceived] = useState<Record<string, string>>({});
  const [invoice, setInvoice] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    amount: "",
    currency: "USD",
  });
  async function action(path: string, body?: object) {
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      await apiFetch(`/api/orders/${id}${path}`, {
        method: "POST",
        actor,
        body: body ?? null,
      });
      setNotice("Order updated successfully.");
      await order.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function receipt(e: React.FormEvent) {
    e.preventDefault();
    const items = Object.entries(received)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([purchaseOrderItemId, quantityReceived]) => ({
        purchaseOrderItemId,
        quantityReceived: Number(quantityReceived),
        notes: null,
      }));
    await action("/goods-receipts", { notes: null, items });
    setReceived({});
  }
  async function addInvoice(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch(`/api/orders/${id}/invoices`, {
        method: "POST",
        actor,
        body: { ...invoice, amount: Number(invoice.amount) },
      });
      setInvoice({ ...invoice, invoiceNumber: "", amount: "" });
      setNotice("Invoice recorded.");
      await invoices.reload();
    } catch (reason) {
      setError(reason);
    } finally {
      setBusy(false);
    }
  }
  async function upload(invoiceId: string, file?: File) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    try {
      await apiFetch(`/api/orders/${id}/invoices/${invoiceId}/document`, {
        method: "POST",
        body,
        actor,
      });
      setNotice("Invoice document uploaded.");
      await invoices.reload();
    } catch (reason) {
      setError(reason);
    } finally {
      setBusy(false);
    }
  }
  if (order.loading) return <LoadingState />;
  if (order.error || !order.data)
    return (
      <ErrorState
        error={order.error ?? new Error("Order not found")}
        retry={order.reload}
      />
    );
  const o = order.data;
  return (
    <>
      <PageHeader
        eyebrow={o.poNumber}
        title={o.supplierNameSnapshot}
        description={`Purchase request ${o.purchaseRequestId} · expected ${date(o.expectedDeliveryDate)}`}
      />
      <LifecycleStepper steps={orderLifecycle(o.status)} />
      {o.procurementSyncStatus === "PENDING" && (
        <div className="alert warning">
          <strong>Procurement synchronization pending</strong>
          <span>
            The order is safely persisted. The lightweight reconciliation job
            will retry the idempotent callback.
          </span>
        </div>
      )}
      {notice && <div className="alert success">{notice}</div>}
      {error && <ErrorState error={error} />}
      <div className="split">
        <div>
          <section className="panel">
            <div className="panel-header">
              <h2>Order lines</h2>
              <StatusBadge value={o.status} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Ordered</th>
                    <th>Received</th>
                    <th>Unit price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.id}>
                      <td className="cell-title">{i.description}</td>
                      <td>
                        {i.quantity} {i.unit}
                      </td>
                      <td>
                        {i.receivedQuantity ?? 0} {i.unit}
                      </td>
                      <td>
                        <Money amount={i.unitPrice} currency={o.currency} />
                      </td>
                      <td>
                        <Money amount={i.total} currency={o.currency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {canReceiveOrder(o.status) && (
            <form className="panel panel-body" onSubmit={receipt}>
              <h3>Record goods receipt</h3>
              <p className="cell-meta">
                Enter only quantities physically received. The service prevents
                cumulative over-receipt.
              </p>
              <div className="form-grid">
                {o.items.map((i) => (
                  <label className="field" key={i.id}>
                    <span>
                      {i.description} ({i.quantity - (i.receivedQuantity ?? 0)}{" "}
                      remaining)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={i.quantity - (i.receivedQuantity ?? 0)}
                      step="0.0001"
                      value={received[i.id] ?? ""}
                      onChange={(e) =>
                        setReceived({ ...received, [i.id]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="form-actions">
                <button
                  className="button primary"
                  disabled={
                    busy || !Object.values(received).some((v) => Number(v) > 0)
                  }
                >
                  Record receipt
                </button>
              </div>
            </form>
          )}
          <section className="panel">
            <div className="panel-header">
              <h2>Invoices</h2>
              <span>{invoices.data?.length ?? 0} recorded</span>
            </div>
            {invoices.data?.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.data.map((i) => (
                      <tr key={i.id}>
                        <td className="cell-title">{i.invoiceNumber}</td>
                        <td>{date(i.invoiceDate)}</td>
                        <td>
                          <Money amount={i.amount} currency={i.currency} />
                        </td>
                        <td>
                          {i.originalFileName ? (
                            <a
                              className="button secondary"
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/orders/${id}/invoices/${i.id}/download`}
                            >
                              Download
                            </a>
                          ) : (
                            <label className="button secondary">
                              Upload
                              <input
                                hidden
                                type="file"
                                accept="application/pdf,image/png,image/jpeg"
                                onChange={(e) =>
                                  upload(i.id, e.target.files?.[0])
                                }
                              />
                            </label>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No invoices recorded.</p>
              </div>
            )}
          </section>
          <form className="panel panel-body" onSubmit={addInvoice}>
            <h3>Record invoice</h3>
            <div className="form-grid">
              <label className="field">
                <span>Invoice number</span>
                <input
                  required
                  value={invoice.invoiceNumber}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceNumber: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Invoice date</span>
                <input
                  type="date"
                  required
                  value={invoice.invoiceDate}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceDate: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={invoice.amount}
                  onChange={(e) =>
                    setInvoice({ ...invoice, amount: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Currency</span>
                <input
                  maxLength={3}
                  required
                  value={invoice.currency}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      currency: e.target.value.toUpperCase(),
                    })
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="button primary" disabled={busy}>
                Record invoice
              </button>
            </div>
          </form>
        </div>
        <aside>
          <section className="panel panel-body">
            <h3>Order summary</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span>Status</span>
                <StatusBadge value={o.status} />
              </div>
              <div className="detail-row">
                <span>Sync status</span>
                <StatusBadge value={o.procurementSyncStatus} />
              </div>
              <div className="detail-row">
                <span>Total value</span>
                <strong>
                  <Money amount={o.totalAmount} currency={o.currency} />
                </strong>
              </div>
              <div className="detail-row">
                <span>Created by</span>
                <span>{o.createdBy}</span>
              </div>
            </div>
          </section>
          <section className="panel panel-body">
            <h3>Lifecycle actions</h3>
            <div className="actions">
            {canIssueOrder(o.status) && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => action("/issue")}
                >
                  Issue order
                </button>
              )}
              {canAcknowledgeOrder(o.status) && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => action("/acknowledge")}
                >
                  Acknowledge
                </button>
              )}
              {canCloseOrder(o.status) && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => action("/close")}
                >
                  Close order
                </button>
              )}
            {canCancelOrder(o.status) && (
                <>
                  <input
                    placeholder="Cancellation reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <button
                    className="button danger"
                    disabled={busy || !reason}
                    onClick={() => action("/cancel", { reason })}
                  >
                    Cancel order
                  </button>
                </>
              )}
            </div>
          </section>
          {o.goodsReceipts?.length > 0 && (
            <section className="panel panel-body">
              <h3>Receipt history</h3>
              <div className="timeline">
                {o.goodsReceipts.map((r) => (
                  <div className="timeline-item" key={r.id}>
                    <span className="timeline-dot" />
                    <div>
                      <strong>{r.receiptNumber}</strong>
                      <p>
                        {date(r.receivedAt)} · {r.receivedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
