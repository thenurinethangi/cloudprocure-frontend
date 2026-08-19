"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActor } from "./actor-context";

const navigation = [
  ["Dashboard", "/", "grid"],
  ["Purchase Requests", "/requests", "request"],
  ["Suppliers", "/suppliers", "users"],
  ["Catalog", "/catalog", "catalog"],
  ["Purchase Orders", "/orders", "order"],
  ["Activity", "/activity", "activity"],
] as const;

const sectionNames: Record<string, string> = {
  requests: "Purchase Requests", suppliers: "Supplier Management", catalog: "Catalog",
  orders: "Purchase Orders", activity: "Activity & Audit",
};

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    request: <><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5M10 13h6M10 17h6"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    catalog: <><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 3v18M8 8h12M12 12h4M12 16h4"/></>,
    order: <><path d="M6 3h12l2 4-2 4H6L4 7z"/><path d="M6 11v10h12V11M9 15h6"/></>,
    activity: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { actor, actors, select } = useActor();
  const isProduction = process.env.NEXT_PUBLIC_APP_PROFILE === "production";
  const segment = pathname.split("/").filter(Boolean)[0];
  const context = segment ? sectionNames[segment] ?? "Enterprise Procurement" : "Executive Dashboard";
  const initials = actor?.name.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "PF";

  return <div className="app-frame">
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="ProcureFlow dashboard">
        <span className="brand-mark"><span/></span><span><b>ProcureFlow</b><small>Enterprise Procurement</small></span>
      </Link>
      <span className="nav-section">Workspace</span>
      <nav aria-label="Primary navigation">
        {navigation.map(([label, href, icon]) => <Link key={href} href={href}
          className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "nav-link active" : "nav-link"}>
          <span className="nav-icon"><NavIcon name={icon}/></span><span>{label}</span>
        </Link>)}
      </nav>
      <div className="sidebar-footer"><span className="system-dot"/><span><strong>System online</strong><small>All services available</small></span></div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="topbar-context"><span>Workspace</span><strong>{context}</strong></div>
        <div className="topbar-actions">
          <span className="topbar-date">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date())}</span>
          {!isProduction && <label className="actor-control"><span className="avatar">{initials}</span>
            <span className="actor-copy"><small>Active user</small><select aria-label="Active user" value={actor?.email} onChange={(event) => select(event.target.value)}>
              {actors.map((item) => <option value={item.email} key={item.email}>{item.name} · {item.role.replaceAll("_", " ")}</option>)}
            </select></span>
          </label>}
          {isProduction && <span className="environment-pill">Production</span>}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  </div>;
}
