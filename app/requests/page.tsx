"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useActor } from "@/components/actor-context";
import { EmptyState, ErrorState, LoadingState, Modal, Money, StatusBadge, date } from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/api";
import { createPurchaseRequestSchema } from "@/lib/contracts";
import { useResource } from "@/lib/use-resource";
import type { Department, PageResponse, PurchaseRequest } from "@/lib/types";

const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ORDERED", "COMPLETED", "CANCELLED"];

export default function RequestsPage() {
  const router = useRouter();
  const { actor } = useActor();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt,desc");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<unknown>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const departments = useResource<Department[]>("/api/procurement/departments");
  const path = useMemo(() => `/api/procurement/requests?size=50&sort=${sort}${status ? `&status=${status}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`, [status, search, sort]);
  const { data, error, loading, reload } = useResource<PageResponse<PurchaseRequest>>(path);

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = createPurchaseRequestSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setSubmitting(true); setFormError(undefined); setFieldErrors({});
    try {
      const request = await apiFetch<PurchaseRequest>("/api/procurement/requests", { method: "POST", actor, body: parsed.data });
      setOpen(false);
      router.push(`/requests/${request.id}`);
    } catch (reason) {
      setFormError(reason);
      if (reason instanceof ApiError && reason.validationErrors) setFieldErrors(reason.validationErrors);
    } finally { setSubmitting(false); }
  }

  return <>
    <header className="page-header"><div><span className="eyebrow">Demand management</span><h1>Purchase requests</h1><p>Create, review and progress purchasing demand through its governed lifecycle.</p></div><button className="button primary" onClick={() => setOpen(true)}>+ Create request</button></header>
    <section className="panel"><div className="filters"><input aria-label="Search requests" placeholder="Search title or request number" value={search} onChange={(event) => setSearch(event.target.value)}/><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Sort requests" value={sort} onChange={(event) => setSort(event.target.value)}><option value="createdAt,desc">Newest first</option><option value="createdAt,asc">Oldest first</option><option value="neededByDate,asc">Needed soonest</option></select><span className="filter-count">{data?.totalElements ?? 0} records</span></div>
      {loading ? <LoadingState/> : error ? <ErrorState error={error} retry={reload}/> : !data?.content.length ? <EmptyState title="No requests found" detail="Adjust the filters or create a purchase request."/> : <div className="table-wrap"><table><thead><tr><th>Request</th><th>Requester</th><th>Needed by</th><th>Status</th><th>Estimated total</th></tr></thead><tbody>{data.content.map((item) => <tr key={item.id}><td><Link className="cell-title row-link" href={`/requests/${item.id}`}>{item.title}</Link><span className="cell-meta">{item.requestNumber} · {item.costCenterCode}</span></td><td>{item.requesterName}<span className="cell-meta">{item.requesterEmail}</span></td><td>{date(item.neededByDate)}</td><td><StatusBadge value={item.status}/></td><td><Money amount={item.estimatedTotal} currency={item.currency}/></td></tr>)}</tbody></table></div>}
    </section>
    <Modal open={open} onClose={() => setOpen(false)} title="Create purchase request" description="Start with the request details. Line items can be added after the draft is created." size="large">
      <form onSubmit={createRequest}><input type="hidden" name="currency" value="USD"/><div className="panel-body">{Boolean(formError) && <ErrorState error={formError}/>}<div className="form-grid">
        <Field label="Title" name="title" error={fieldErrors.title} placeholder="e.g. Developer workstations"/>
        <label className="field">Department<select name="departmentId" defaultValue=""><option value="" disabled>Select department</option>{departments.data?.filter((item) => item.active).map((department) => <option key={department.id} value={department.id}>{department.code} — {department.name}</option>)}</select>{fieldErrors.departmentId && <span className="field-error">{fieldErrors.departmentId}</span>}</label>
        <Field label="Cost center" name="costCenterCode" error={fieldErrors.costCenterCode} placeholder="CC-100"/>
        <Field label="Needed by" name="neededByDate" type="date" error={fieldErrors.neededByDate}/>
        <Field label="Business justification" name="businessJustification" error={fieldErrors.businessJustification} className="full" placeholder="Explain the operational need"/>
        <label className="field full">Description<textarea name="description" placeholder="Optional context for reviewers"/></label>
      </div></div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button primary" disabled={submitting || departments.loading}>{submitting ? "Creating…" : "Create draft"}</button></div></form>
    </Modal>
  </>;
}

function Field({ label, name, error, className = "", ...props }: { label: string; name: string; error?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`field ${className}`}>{label}<input name={name} {...props}/>{error && <span className="field-error">{error}</span>}</label>;
}
