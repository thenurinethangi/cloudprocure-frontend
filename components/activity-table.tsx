import { StatusBadge, date } from "@/components/ui";
import type { ActivityEvent } from "@/lib/types";

export function ActivityTable({ events, compact = false }: { events: ActivityEvent[]; compact?: boolean }) {
  return <div className="table-wrap activity-table-wrap"><table className="activity-table" aria-label="Procurement activity">
    <thead><tr><th>Event</th>{!compact && <th>Actor</th>}<th>Context</th>{!compact && <th>When</th>}<th>Status</th></tr></thead>
    <tbody>{events.map((event) => <tr key={event.id}>
      <td><span className="cell-title activity-summary"><span className="activity-dot" aria-hidden="true"/>{event.summary}</span>{compact && <span className="cell-meta">{event.actor} · {date(event.occurredAt)}</span>}</td>
      {!compact && <td className="activity-actor">{event.actor}</td>}
      <td><span className="activity-service">{event.service.replace("-service", "")}</span><span className="cell-meta">{event.entityType.replaceAll("_", " ")} · <span title={event.entityId}>{event.entityId.slice(0, 8)}</span></span></td>
      {!compact && <td className="activity-date">{date(event.occurredAt)}</td>}
      <td className="activity-status"><StatusBadge value={event.eventType}/></td>
    </tr>)}</tbody>
  </table></div>;
}
