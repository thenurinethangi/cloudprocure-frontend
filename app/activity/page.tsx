"use client";

import { useMemo, useState } from "react";
import { ActivityTable } from "@/components/activity-table";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import type { ActivityEvent } from "@/lib/types";

export default function ActivityPage() {
  const activity = useResource<ActivityEvent[]>("/api/procurement/activity?limit=100");
  const [search, setSearch] = useState("");
  const [service, setService] = useState("");
  const services = [...new Set((activity.data ?? []).map((event) => event.service))];
  const rows = useMemo(() => (activity.data ?? []).filter((event) => (!service || event.service === service) && (!search || `${event.summary} ${event.actor} ${event.eventType} ${event.entityType}`.toLowerCase().includes(search.toLowerCase()))), [activity.data, search, service]);
  return <>
    <PageHeader eyebrow="Audit visibility" title="Activity" description="A reverse-chronological operational trail published independently by each service."/>
    <section className="panel"><div className="filters"><input aria-label="Search activity" placeholder="Search action or actor" value={search} onChange={(event) => setSearch(event.target.value)}/><select aria-label="Filter by service" value={service} onChange={(event) => setService(event.target.value)}><option value="">All services</option>{services.map((value) => <option key={value} value={value}>{value.replace("-service", "")}</option>)}</select><span className="filter-count">{rows.length} events</span></div>{activity.loading ? <LoadingState/> : activity.error ? <ErrorState error={activity.error} retry={activity.reload}/> : !rows.length ? <EmptyState title="No matching activity" detail="New procurement actions will appear here automatically."/> : <ActivityTable events={rows}/>}</section>
  </>;
}
