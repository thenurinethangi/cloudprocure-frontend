"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState, Money, PageHeader, StatusBadge } from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import type { CatalogItem, PageResponse, Supplier } from "@/lib/types";

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const path = useMemo(() => `/api/catalog-items?size=100&sort=name,asc${search ? `&search=${encodeURIComponent(search)}` : ""}${active ? `&active=${active}` : ""}`, [search, active]);
  const catalog = useResource<PageResponse<CatalogItem>>(path);
  const suppliers = useResource<PageResponse<Supplier>>("/api/suppliers?size=100&sort=name,asc");
  const supplierById = new Map(suppliers.data?.content.map((supplier) => [supplier.id, supplier]));
  const error = catalog.error ?? suppliers.error;
  return <>
    <PageHeader eyebrow="Sourcing intelligence" title="Catalog" description="Browse supplier offerings and current price snapshots across procurement categories."/>
    <section className="panel"><div className="filters"><input aria-label="Search catalog" placeholder="Search item or SKU" value={search} onChange={(event) => setSearch(event.target.value)}/><select aria-label="Filter availability" value={active} onChange={(event) => setActive(event.target.value)}><option value="">All availability</option><option value="true">Active</option><option value="false">Inactive</option></select><span className="filter-count">{catalog.data?.totalElements ?? 0} items</span></div>{catalog.loading || suppliers.loading ? <LoadingState/> : error ? <ErrorState error={error} retry={() => { void catalog.reload(); void suppliers.reload(); }}/> : !catalog.data?.content.length ? <EmptyState title="No catalog items" detail="Catalog entries are managed from each supplier profile."/> : <div className="table-wrap"><table><thead><tr><th>Offering</th><th>Supplier</th><th>Category</th><th>Availability</th><th>Price</th></tr></thead><tbody>{catalog.data.content.map((item) => { const supplier = supplierById.get(item.supplierId); return <tr key={item.id}><td><span className="cell-title">{item.name}</span><span className="cell-meta">{item.sku} · {item.unit}</span></td><td>{supplier ? <Link className="row-link" href={`/suppliers/${supplier.id}`}>{supplier.name}<span className="cell-meta">{supplier.code}</span></Link> : <span className="cell-meta">Supplier unavailable</span>}</td><td>{item.category}</td><td><StatusBadge value={item.active ? "ACTIVE" : "INACTIVE"}/></td><td><Money amount={item.price} currency={item.currency}/></td></tr>; })}</tbody></table></div>}</section>
  </>;
}
