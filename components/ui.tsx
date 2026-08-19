"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ApiError } from "@/lib/api";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: { label: string; href: string } }) {
  return <header className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></div>{action && <Link href={action.href} className="button primary"><span aria-hidden="true">+</span>{action.label}</Link>}</header>;
}

export function StatusBadge({ value }: { value: string }) {
  const tone = ["APPROVED", "ACTIVE", "SYNCED", "CLOSED", "COMPLETED", "RECEIVED"].includes(value) ? "success" : ["REJECTED", "CANCELLED", "INACTIVE", "SUSPENDED"].includes(value) ? "danger" : ["PENDING", "SUBMITTED", "ISSUED", "PARTIALLY_RECEIVED", "ACKNOWLEDGED"].includes(value) ? "warning" : "neutral";
  return <span className={`status ${tone}`}><span className="status-dot"/>{value.replaceAll("_", " ")}</span>;
}

export function StatCard({ label, value, detail, tone = "green" }: { label: string; value: React.ReactNode; detail: string; tone?: "green" | "blue" | "amber" | "violet" }) {
  return <article className={`stat-card ${tone}`}><div className="stat-icon" aria-hidden="true"/><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: { label: string; href: string } }) {
  return <div className="empty-state"><span className="empty-icon" aria-hidden="true">◇</span><h3>{title}</h3><p>{detail}</p>{action && <Link className="button secondary" href={action.href}>{action.label}</Link>}</div>;
}

export function LoadingState({ rows = 5 }: { rows?: number }) { return <div className="skeleton-list" role="status" aria-label="Loading data">{Array.from({ length: rows }, (_, index) => <span key={index}/>)}</div>; }

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const detail = error instanceof Error ? error.message : "The data could not be loaded.";
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  return <div className="alert error" role="alert"><span className="alert-icon">!</span><span><strong>We couldn’t complete that request</strong><small>{detail}{requestId ? ` · Reference ${requestId}` : ""}</small></span>{retry && <button onClick={retry}>Retry</button>}</div>;
}

export function FilterBar({ children }: { children: React.ReactNode }) { return <div className="filter-bar">{children}</div>; }

export type LifecycleStep = { label: string; state: "complete" | "current" | "upcoming"; meta?: string };
export function LifecycleStepper({ steps }: { steps: LifecycleStep[] }) {
  return <ol className="lifecycle" aria-label="Lifecycle progress">{steps.map((step, index) => <li key={`${step.label}-${index}`} className={step.state} aria-current={step.state === "current" ? "step" : undefined}><span className="step-marker">{step.state === "complete" ? "✓" : index + 1}</span><span><strong>{step.label}</strong>{step.meta && <small>{step.meta}</small>}</span></li>)}</ol>;
}

export function Modal({ open, title, description, onClose, children, size = "medium" }: { open: boolean; title: string; description?: string; onClose: () => void; children: React.ReactNode; size?: "small" | "medium" | "large" }) {
  useEffect(() => { if (!open) return; const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener); }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal ${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>×</button></header>{children}</section></div>;
}

export function Money({ amount, currency = "USD" }: { amount: number; currency?: string }) { return <>{new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount ?? 0))}</>; }
export function date(value?: string) { return value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—"; }
