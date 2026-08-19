"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DemoActor } from "@/lib/api";

const actors: DemoActor[] = [
  { name: "Riya Requester", email: "requester@cloudprocure.local", role: "REQUESTER" },
  { name: "Aiden Approver", email: "approver@cloudprocure.local", role: "APPROVER" },
  { name: "Priya Procurement", email: "procurement@cloudprocure.local", role: "PROCUREMENT_OFFICER" },
  { name: "Amara Admin", email: "admin@cloudprocure.local", role: "ADMIN" },
];

type ActorContextValue = { actor?: DemoActor; actors: DemoActor[]; select: (email: string) => void };
const ActorContext = createContext<ActorContextValue | undefined>(undefined);

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const [actor, setActor] = useState<DemoActor>(actors[0]);
  const value = useMemo(() => ({ actor, actors, select: (email: string) => {
    const selected = actors.find((candidate) => candidate.email === email);
    if (selected) setActor(selected);
  } }), [actor]);
  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>;
}

export function useActor() {
  const value = useContext(ActorContext);
  if (!value) throw new Error("useActor must be used inside ActorProvider");
  return value;
}
