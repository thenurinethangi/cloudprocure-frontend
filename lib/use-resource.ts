"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";

export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(Boolean(path));

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(undefined);
    try { setData(await apiFetch<T>(path, { cache: "no-store" })); }
    catch (reason) { setError(reason); }
    finally { setLoading(false); }
  }, [path]);

  useEffect(() => {
    // API data is intentionally synchronized with the requested resource path.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}
