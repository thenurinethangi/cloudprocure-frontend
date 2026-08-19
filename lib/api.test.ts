import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

describe("apiFetch", () => {
  afterEach(() => vi.restoreAllMocks());

  it("turns ProblemDetail responses into a typed ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      title: "Validation failed",
      status: 400,
      detail: "The request contains invalid fields",
      requestId: "request-123",
      validationErrors: { title: "must not be blank" },
    }), { status: 400, headers: { "Content-Type": "application/problem+json" } })));

    await expect(apiFetch("/api/procurement/requests")).rejects.toEqual(expect.objectContaining({
      name: "ApiError",
      requestId: "request-123",
      status: 400,
    }));
  });

  it("does not attach development actor headers in production builds", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_PROFILE", "production");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/orders", { actor: { name: "Demo", email: "demo@example.com", role: "ADMIN" } });

    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.has("X-Actor-Email")).toBe(false);
    vi.unstubAllEnvs();
  });
});
