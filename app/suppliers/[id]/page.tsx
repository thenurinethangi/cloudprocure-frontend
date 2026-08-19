"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useActor } from "@/components/actor-context";
import { EmptyState, ErrorState, LoadingState, Modal, Money, StatusBadge } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import type { CatalogItem, PageResponse, Supplier } from "@/lib/types";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { actor } = useActor();
  const supplier = useResource<Supplier>(id ? `/api/suppliers/${id}` : null);
  const catalog = useResource<PageResponse<CatalogItem>>(id ? `/api/suppliers/${id}/catalog-items?size=100&sort=name,asc` : null);
  const [dialog, setDialog] = useState<"edit" | "catalog" | null>(null);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function addCatalog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(undefined);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await apiFetch(`/api/suppliers/${id}/catalog-items`, { method: "POST", actor, body: { ...form, price: Number(form.price), attributes: {}, active: true } });
      setDialog(null); setNotice("Catalog item added."); await catalog.reload();
    } catch (reason) { setError(reason); } finally { setBusy(false); }
  }

  async function updateSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supplier.data) return; setBusy(true); setError(undefined);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await apiFetch(`/api/suppliers/${id}`, { method: "PUT", actor, body: { name: form.name, legalName: form.legalName, registrationNumber: form.registrationNumber, status: form.status, rating: Number(form.rating), categories: String(form.categories).split(",").map((value) => value.trim()).filter(Boolean), contacts: supplier.data.contacts ?? [], address: supplier.data.address ?? null, notes: form.notes } });
      setDialog(null); setNotice("Supplier profile updated."); await supplier.reload();
    } catch (reason) { setError(reason); } finally { setBusy(false); }
  }

  if (supplier.loading) return <LoadingState/>;
  if (supplier.error || !supplier.data) return <ErrorState error={supplier.error ?? new Error("Supplier not found")} retry={supplier.reload}/>;
  const data = supplier.data;
  return <>
    <header className="page-header"><div><span className="eyebrow">{data.code}</span><h1>{data.name}</h1><p>{data.legalName || "Supplier directory profile and catalog management."}</p></div><div className="actions"><button className="button secondary" onClick={() => setDialog("edit")}>Edit profile</button><button className="button primary" onClick={() => setDialog("catalog")}>+ Catalog item</button></div></header>
    {notice && <div className="alert success">{notice}</div>}{Boolean(error) && <ErrorState error={error}/>}<div className="split"><div><section className="panel"><div className="panel-header"><h2>Catalog items</h2><span className="panel-count">{catalog.data?.totalElements ?? 0} offerings</span></div>{catalog.loading ? <LoadingState/> : catalog.error ? <ErrorState error={catalog.error} retry={catalog.reload}/> : !catalog.data?.content.length ? <EmptyState title="No catalog items" detail="Add the first product or service offered by this supplier."/> : <div className="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Unit</th><th>Availability</th><th>Price</th></tr></thead><tbody>{catalog.data.content.map((item) => <tr key={item.id}><td><span className="cell-title">{item.name}</span><span className="cell-meta">{item.sku}</span></td><td>{item.category}</td><td>{item.unit}</td><td><StatusBadge value={item.active ? "ACTIVE" : "INACTIVE"}/></td><td><Money amount={item.price} currency={item.currency}/></td></tr>)}</tbody></table></div>}</section></div><aside><section className="panel panel-body"><div className="section-heading"><h3>Supplier profile</h3><StatusBadge value={data.status}/></div><div className="detail-list"><div className="detail-row"><span>Rating</span><strong>{data.rating === undefined ? "—" : `${data.rating.toFixed(1)} / 5`}</strong></div><div className="detail-row"><span>Registration</span><span>{data.registrationNumber || "—"}</span></div><div className="detail-row"><span>Categories</span><span>{data.categories.join(", ")}</span></div></div></section>{Boolean(data.contacts?.length) && <section className="panel panel-body"><h3>Contacts</h3><div className="detail-list">{data.contacts?.map((contact, index) => <div className="detail-row" key={`${contact.email}-${index}`}><span><strong className="cell-title">{contact.name}</strong><span className="cell-meta">{contact.jobTitle || "Supplier contact"}</span></span><span>{contact.email || contact.phone || "—"}</span></div>)}</div></section>}</aside></div>
    <Modal open={dialog === "catalog"} onClose={() => setDialog(null)} title="Add catalog item" description={`Create a priced offering for ${data.name}.`}><form onSubmit={addCatalog}><div className="panel-body"><div className="form-grid"><Input label="SKU" name="sku" required/><Input label="Name" name="name" required/><Input label="Category" name="category" defaultValue="General" required/><Input label="Unit" name="unit" defaultValue="each" required/><Input label="Price" name="price" type="number" min="0" step="0.01" required/><Input label="Currency" name="currency" defaultValue="USD" maxLength={3} required/><label className="field full">Description<textarea name="description"/></label></div></div><ModalActions busy={busy} onCancel={() => setDialog(null)} label="Add item"/></form></Modal>
    <Modal open={dialog === "edit"} onClose={() => setDialog(null)} title="Edit supplier profile" description="Update commercial and classification details." size="large"><form onSubmit={updateSupplier}><div className="panel-body"><div className="form-grid"><Input label="Trading name" name="name" defaultValue={data.name} required/><Input label="Legal name" name="legalName" defaultValue={data.legalName}/><Input label="Registration number" name="registrationNumber" defaultValue={data.registrationNumber}/><label className="field">Status<select name="status" defaultValue={data.status}><option>ACTIVE</option><option>INACTIVE</option><option>SUSPENDED</option></select></label><Input label="Rating" name="rating" type="number" min="0" max="5" step="0.1" defaultValue={data.rating ?? 0}/><Input label="Categories" name="categories" defaultValue={data.categories.join(", ")} required/><label className="field full">Notes<textarea name="notes" defaultValue={data.notes}/></label></div></div><ModalActions busy={busy} onCancel={() => setDialog(null)} label="Save changes"/></form></Modal>
  </>;
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) { return <label className="field">{label}<input {...props}/></label>; }
function ModalActions({ busy, onCancel, label }: { busy: boolean; onCancel: () => void; label: string }) { return <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel}>Cancel</button><button className="button primary" disabled={busy}>{busy ? "Saving…" : label}</button></div>; }
