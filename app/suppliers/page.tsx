"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { z } from "zod";
import { useActor } from "@/components/actor-context";
import { EmptyState, ErrorState, LoadingState, Modal, StatusBadge } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import type { PageResponse, Supplier } from "@/lib/types";

const supplierSchema = z.object({ code: z.string().trim().min(2).max(30), name: z.string().trim().min(2).max(200), legalName: z.string().trim().max(200), registrationNumber: z.string().trim().max(100), categories: z.string().trim().min(2), rating: z.coerce.number().min(0).max(5), notes: z.string().trim().max(2000) });

export default function SuppliersPage() {
  const router = useRouter();
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const path = useMemo(() => `/api/suppliers?size=50&sort=createdAt,desc${status ? `&status=${status}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`, [search, status]);
  const suppliers = useResource<PageResponse<Supplier>>(path);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = supplierSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]))); return; }
    setBusy(true); setError(undefined); setErrors({});
    try {
      const data = parsed.data;
      const supplier = await apiFetch<Supplier>("/api/suppliers", { method: "POST", actor, body: { ...data, code: data.code.toUpperCase(), categories: data.categories.split(",").map((value) => value.trim()).filter(Boolean), status: "ACTIVE", contacts: [], address: null } });
      setOpen(false); router.push(`/suppliers/${supplier.id}`);
    } catch (reason) { setError(reason); } finally { setBusy(false); }
  }

  return <>
    <header className="page-header"><div><span className="eyebrow">Supplier management</span><h1>Suppliers</h1><p>Maintain the approved supplier directory, commercial categories and catalog coverage.</p></div><button className="button primary" onClick={() => setOpen(true)}>+ Add supplier</button></header>
    <section className="panel"><div className="filters"><input aria-label="Search suppliers" placeholder="Search name or code" value={search} onChange={(event) => setSearch(event.target.value)}/><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option><option>SUSPENDED</option></select><span className="filter-count">{suppliers.data?.totalElements ?? 0} suppliers</span></div>{suppliers.loading ? <LoadingState/> : suppliers.error ? <ErrorState error={suppliers.error} retry={suppliers.reload}/> : !suppliers.data?.content.length ? <EmptyState title="No suppliers found" detail="Adjust the filters or add an approved supplier."/> : <div className="table-wrap"><table><thead><tr><th>Supplier</th><th>Categories</th><th>Rating</th><th>Status</th></tr></thead><tbody>{suppliers.data.content.map((supplier) => <tr key={supplier.id}><td><Link className="cell-title row-link" href={`/suppliers/${supplier.id}`}>{supplier.name}</Link><span className="cell-meta">{supplier.code} · {supplier.registrationNumber ?? "Registration not recorded"}</span></td><td>{supplier.categories.join(", ")}</td><td>{supplier.rating === undefined ? "—" : `${supplier.rating.toFixed(1)} / 5`}</td><td><StatusBadge value={supplier.status}/></td></tr>)}</tbody></table></div>}</section>
    <Modal open={open} onClose={() => setOpen(false)} title="Add supplier" description="Create a supplier directory record. Catalog items can be added from the supplier profile." size="large"><form onSubmit={create}><div className="panel-body">{Boolean(error) && <ErrorState error={error}/>}<div className="form-grid"><SupplierField label="Supplier code" name="code" error={errors.code}/><SupplierField label="Trading name" name="name" error={errors.name}/><SupplierField label="Legal name" name="legalName" error={errors.legalName}/><SupplierField label="Registration number" name="registrationNumber" error={errors.registrationNumber}/><SupplierField label="Categories" name="categories" defaultValue="Technology" error={errors.categories} placeholder="Technology, Office supplies"/><SupplierField label="Rating" name="rating" type="number" min="0" max="5" step="0.1" defaultValue="3" error={errors.rating}/><label className="field full">Notes<textarea name="notes" placeholder="Optional internal supplier notes"/></label></div></div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button primary" disabled={busy}>{busy ? "Saving…" : "Add supplier"}</button></div></form></Modal>
  </>;
}

function SupplierField({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) { return <label className="field">{label}<input {...props}/>{error && <span className="field-error">{error}</span>}</label>; }
