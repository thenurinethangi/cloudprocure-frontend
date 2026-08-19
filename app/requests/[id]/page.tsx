"use client";

import { useParams, useRouter } from "next/navigation";
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
import { requestLifecycle } from "@/lib/lifecycle";
import { useResource } from "@/lib/use-resource";
import type {
  Attachment,
  PageResponse,
  PurchaseOrder,
  PurchaseRequest,
  Supplier,
} from "@/lib/types";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { actor } = useActor();
  const request = useResource<PurchaseRequest>(
    id ? `/api/procurement/requests/${id}` : null,
  );
  const suppliers = useResource<PageResponse<Supplier>>(
    "/api/suppliers?status=ACTIVE&size=100",
  );
  const attachments = useResource<Attachment[]>(
    id ? `/api/procurement/requests/${id}/attachments` : null,
  );
  const [notice, setNotice] = useState("");
  const [mutationError, setMutationError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState({
    description: "",
    category: "General",
    quantity: "1",
    unit: "each",
    estimatedUnitPrice: "0",
    preferredSupplierId: "",
    notes: "",
  });
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [reason, setReason] = useState("");
  const [delivery, setDelivery] = useState("");
  async function mutate(path: string, body?: object) {
    setBusy(true);
    setMutationError(undefined);
    setNotice("");
    try {
      await apiFetch(`/api/procurement/requests/${id}${path}`, {
        method: "POST",
        body: body ?? null,
        actor,
      });
      setNotice("Request updated successfully.");
      await request.reload();
    } catch (e) {
      setMutationError(e);
    } finally {
      setBusy(false);
    }
  }
  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    await mutate("/items", {
      ...item,
      quantity: Number(item.quantity),
      estimatedUnitPrice: Number(item.estimatedUnitPrice),
      preferredSupplierId: item.preferredSupplierId || null,
    });
    setItem({
      ...item,
      description: "",
      quantity: "1",
      estimatedUnitPrice: "0",
      notes: "",
    });
  }
  async function createOrder() {
    setBusy(true);
    try {
      const order = await apiFetch<PurchaseOrder>("/api/orders", {
        method: "POST",
        actor,
        body: {
          purchaseRequestId: id,
          supplierId: request.data?.selectedSupplierId,
          expectedDeliveryDate: delivery,
        },
      });
      router.push(`/orders/${order.id}`);
    } catch (e) {
      setMutationError(e);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    try {
      await apiFetch(`/api/procurement/requests/${id}/attachments`, {
        method: "POST",
        body,
        actor,
      });
      setNotice("Attachment uploaded.");
      await attachments.reload();
    } catch (e) {
      setMutationError(e);
    } finally {
      setBusy(false);
    }
  }
  if (request.loading) return <LoadingState />;
  if (request.error || !request.data)
    return (
      <ErrorState
        error={request.error ?? new Error("Request not found")}
        retry={request.reload}
      />
    );
  const data = request.data;
  return (
    <>
      <PageHeader
        eyebrow={data.requestNumber}
        title={data.title}
        description={`${data.requesterName} · ${data.costCenterCode} · needed ${date(data.neededByDate)}`}
      />
      <LifecycleStepper steps={requestLifecycle(data.status)} />
      {data.status === "APPROVED" && !data.selectedSupplierId && (
        <div className="alert warning">
          <strong>Supplier required</strong>
          <span>
            Select an active supplier before creating a purchase order.
          </span>
        </div>
      )}
      {notice && <div className="alert success">{notice}</div>}
      {mutationError && <ErrorState error={mutationError} />}
      <div className="split">
        <div>
          <section className="panel">
            <div className="panel-header">
              <h2>Line items</h2>
              <StatusBadge value={data.status} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="cell-title">{row.description}</span>
                        <span className="cell-meta">{row.category}</span>
                      </td>
                      <td>
                        {row.quantity} {row.unit}
                      </td>
                      <td>
                        <Money
                          amount={row.estimatedUnitPrice}
                          currency={data.currency}
                        />
                      </td>
                      <td>
                        <Money
                          amount={row.estimatedTotal}
                          currency={data.currency}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {data.status === "DRAFT" && (
            <form className="panel panel-body" onSubmit={addItem}>
              <h3>Add line item</h3>
              <div className="form-grid">
                <label className="field full">
                  <span>Description</span>
                  <input
                    required
                    value={item.description}
                    onChange={(e) =>
                      setItem({ ...item, description: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Category</span>
                  <input
                    required
                    value={item.category}
                    onChange={(e) =>
                      setItem({ ...item, category: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    required
                    value={item.quantity}
                    onChange={(e) =>
                      setItem({ ...item, quantity: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Unit</span>
                  <input
                    required
                    value={item.unit}
                    onChange={(e) => setItem({ ...item, unit: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Estimated unit price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.estimatedUnitPrice}
                    onChange={(e) =>
                      setItem({ ...item, estimatedUnitPrice: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-actions">
                <button disabled={busy} className="button primary">
                  Add item
                </button>
              </div>
            </form>
          )}
          <section className="panel panel-body">
            <h3>Business justification</h3>
            <p>{data.businessJustification}</p>
            {data.description && (
              <p className="cell-meta">{data.description}</p>
            )}
          </section>
        </div>
        <aside>
          <section className="panel panel-body">
            <h3>Request summary</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span>Status</span>
                <StatusBadge value={data.status} />
              </div>
              <div className="detail-row">
                <span>Estimated total</span>
                <strong>
                  <Money
                    amount={data.estimatedTotal}
                    currency={data.currency}
                  />
                </strong>
              </div>
              <div className="detail-row">
                <span>Created</span>
                <span>{date(data.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span>Supplier</span>
                <span>{suppliers.data?.content.find((supplier) => supplier.id === data.selectedSupplierId)?.name ?? "Not selected"}</span>
              </div>
            </div>
          </section>
          <section className="panel panel-body">
            <h3>Workflow actions</h3>
            <div className="actions">
              {data.status === "DRAFT" && (
                <button
                  className="button primary"
                  disabled={busy || !data.items.length}
                  onClick={() => mutate("/submit")}
                >
                  Submit request
                </button>
              )}
              {data.status === "SUBMITTED" && (
                <>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() =>
                      mutate("/approve", { reason: reason || null })
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="button danger"
                    disabled={busy || !reason}
                    onClick={() => mutate("/reject", { reason })}
                  >
                    Reject
                  </button>
                </>
              )}
              {["DRAFT", "SUBMITTED", "APPROVED"].includes(data.status) && (
                <>
                  <input
                    aria-label="Decision reason"
                    placeholder="Reason (required to reject/cancel)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <button
                    className="button secondary"
                    disabled={busy || !reason}
                    onClick={() => mutate("/cancel", { reason })}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </section>
          {data.status === "APPROVED" && (
            <section className="panel panel-body">
              <h3>Convert to purchase order</h3>
              <label className="field">
                <span>Supplier</span>
                <select
                  value={selectedSupplier || data.selectedSupplierId || ""}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Select supplier</option>
                  {suppliers.data?.content.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedSupplier &&
                selectedSupplier !== data.selectedSupplierId && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      mutate("/supplier", { supplierId: selectedSupplier })
                    }
                  >
                    Assign supplier
                  </button>
                )}
              <label className="field">
                <span>Expected delivery</span>
                <input
                  type="date"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                />
              </label>
              <button
                className="button primary"
                disabled={busy || !data.selectedSupplierId || !delivery}
                onClick={createOrder}
              >
                Create order
              </button>
            </section>
          )}
          {data.approvalDecisions.length > 0 && (
            <section className="panel panel-body">
              <h3>Decision history</h3>
              <div className="timeline">
                {data.approvalDecisions.map((decision) => (
                  <div className="timeline-item" key={decision.id}>
                    <span className="timeline-dot" />
                    <div>
                      <strong>{decision.decision}</strong>
                      <p>{decision.approverName} · {date(decision.decidedAt)}</p>
                      {decision.reason && <span className="cell-meta">{decision.reason}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="panel panel-body">
            <h3>Attachments</h3>
            {Boolean(attachments.error) && <ErrorState error={attachments.error} retry={attachments.reload} />}
            {attachments.data?.map((attachment) => (
              <div className="detail-row" key={attachment.id}>
                <span>
                  <strong className="cell-title">{attachment.originalFileName}</strong>
                  <span className="cell-meta">
                    {(attachment.sizeBytes / 1024).toFixed(1)} KiB · {attachment.uploadedBy} · {date(attachment.uploadedAt)}
                  </span>
                </span>
                <a
                  className="button secondary"
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/procurement/requests/${id}/attachments/${attachment.id}/download`}
                >
                  Download
                </a>
              </div>
            ))}
            <label className="button secondary">
              Upload file
              <input
                hidden
                type="file"
                accept="application/pdf,image/png,image/jpeg,text/plain"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <p className="cell-meta">PDF, PNG, JPEG or text · maximum 10 MiB</p>
          </section>
        </aside>
      </div>
    </>
  );
}
