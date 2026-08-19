"use client";

import Link from "next/link";
import { ActivityTable } from "@/components/activity-table";
import { useActor } from "@/components/actor-context";
import { EmptyState, ErrorState, LoadingState, Money, PageHeader, StatCard, StatusBadge, date } from "@/components/ui";
import { deriveDashboardMetrics } from "@/lib/dashboard";
import { useResource } from "@/lib/use-resource";
import type { ActivityEvent, PageResponse, PurchaseOrder, PurchaseRequest, Supplier } from "@/lib/types";

export default function DashboardPage() {
  const { actor } = useActor();
  const requests = useResource<PageResponse<PurchaseRequest>>("/api/procurement/requests?size=100&sort=createdAt,desc");
  const suppliers = useResource<PageResponse<Supplier>>("/api/suppliers?size=100&status=ACTIVE&sort=createdAt,desc");
  const orders = useResource<PageResponse<PurchaseOrder>>("/api/orders?size=100&sort=createdAt,desc");
  const activity = useResource<ActivityEvent[]>("/api/procurement/activity?limit=8");
  const resources = [requests, suppliers, orders, activity];
  if (resources.some((resource) => resource.loading)) return <LoadingState rows={8}/>;
  const failed = resources.find((resource) => resource.error);
  if (failed?.error) return <ErrorState error={failed.error} retry={() => resources.forEach((resource) => void resource.reload())}/>;

  const requestRows = requests.data?.content ?? [];
  const orderRows = orders.data?.content ?? [];
  const metrics = deriveDashboardMetrics(requestRows.map((item) => item.status), orderRows.map((item) => item.status));
  const firstName = actor?.name.split(" ")[0] ?? "there";
  return <>
    <PageHeader eyebrow="Operations overview" title={`Good day, ${firstName}`} description="Review procurement demand, approval queues and fulfilment progress from live operational data." action={{ label: "New request", href: "/requests/new" }}/>
    <section className="stats-grid">
      <StatCard label="Open requests" value={metrics.openRequests} detail="Across active lifecycle stages"/>
      <StatCard label="Pending approvals" value={metrics.pendingApprovals} detail="Submitted for review" tone="amber"/>
      <StatCard label="Active orders" value={metrics.activeOrders} detail="Not closed or cancelled" tone="blue"/>
      <StatCard label="Awaiting receipt" value={metrics.awaitingReceipt} detail={`${suppliers.data?.totalElements ?? 0} active suppliers`} tone="violet"/>
    </section>
    <section className="two-panels">
      <DashboardTable title="Recent requests" href="/requests" empty="No purchase requests" rows={requestRows.slice(0, 5).map((item) => <tr key={item.id}><td><Link className="cell-title row-link" href={`/requests/${item.id}`}>{item.title}</Link><span className="cell-meta">{item.requestNumber} · {date(item.createdAt)}</span></td><td><StatusBadge value={item.status}/></td><td><Money amount={item.estimatedTotal} currency={item.currency}/></td></tr>)}/>
      <DashboardTable title="Recent orders" href="/orders" empty="No purchase orders" rows={orderRows.slice(0, 5).map((item) => <tr key={item.id}><td><Link className="cell-title row-link" href={`/orders/${item.id}`}>{item.poNumber}</Link><span className="cell-meta">{item.supplierNameSnapshot}</span></td><td><StatusBadge value={item.status}/></td><td><Money amount={item.totalAmount} currency={item.currency}/></td></tr>)}/>
    </section>
    <section className="panel"><div className="panel-header"><h2>Latest activity</h2><Link href="/activity">Open audit trail</Link></div>{!activity.data?.length ? <EmptyState title="No activity recorded" detail="Lifecycle actions will be shown here as they occur."/> : <ActivityTable events={activity.data} compact/>}</section>
  </>;
}

function DashboardTable({ title, href, empty, rows }: { title: string; href: string; empty: string; rows: React.ReactNode[] }) {
  return <div className="panel"><div className="panel-header"><h2>{title}</h2><Link href={href}>View all</Link></div>{rows.length === 0 ? <EmptyState title={empty} detail="Operational records will appear here as they are created."/> : <div className="table-wrap"><table><thead><tr><th>Record</th><th>Status</th><th>Value</th></tr></thead><tbody>{rows}</tbody></table></div>}</div>;
}
