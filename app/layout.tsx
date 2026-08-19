import type { Metadata } from "next";
import { ActorProvider } from "@/components/actor-context";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = { title: "ProcureFlow", description: "Enterprise procurement management" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ActorProvider><AppShell>{children}</AppShell></ActorProvider></body></html>;
}
