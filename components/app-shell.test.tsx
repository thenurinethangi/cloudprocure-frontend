import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActorProvider } from "./actor-context";
import { AppShell } from "./app-shell";

describe("AppShell", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("shows the full procurement workspace navigation", () => {
    render(<ActorProvider><AppShell><p>Page</p></AppShell></ActorProvider>);
    expect(screen.getByRole("link", { name: "ProcureFlow dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Enterprise Procurement")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Purchase Requests" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Suppliers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Purchase Orders" })).toBeInTheDocument();
  });

  it("never presents the demo actor control in production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_PROFILE", "production");
    render(<ActorProvider><AppShell><p>Page</p></AppShell></ActorProvider>);
    expect(screen.queryByLabelText("Demo actor")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Active user")).not.toBeInTheDocument();
  });

  it("integrates local personas as an active user control without demo wording", () => {
    render(<ActorProvider><AppShell><p>Page</p></AppShell></ActorProvider>);
    expect(screen.getByLabelText("Active user")).toBeInTheDocument();
    expect(screen.queryByText(/academic baseline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/demo actor/i)).not.toBeInTheDocument();
    expect(screen.queryByText("CloudProcure")).not.toBeInTheDocument();
  });
});
