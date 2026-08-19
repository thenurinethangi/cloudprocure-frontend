export type DemoActor = {
  name: string;
  email: string;
  role: "REQUESTER" | "APPROVER" | "PROCUREMENT_OFFICER" | "ADMIN";
};

export type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  requestId?: string;
  validationErrors?: Record<string, string>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly requestId?: string;
  readonly validationErrors?: Record<string, string>;

  constructor(problem: ProblemDetail, fallbackStatus: number) {
    super(problem.detail ?? problem.title ?? "The request could not be completed");
    this.name = "ApiError";
    this.status = problem.status ?? fallbackStatus;
    this.requestId = problem.requestId;
    this.validationErrors = problem.validationErrors;
  }
}

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  actor?: DemoActor;
  body?: BodyInit | object | null;
};

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T = void>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { actor, body, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  let requestBody = body as BodyInit | null | undefined;

  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  if (actor && process.env.NEXT_PUBLIC_APP_PROFILE !== "production") {
    headers.set("X-Actor-Name", actor.name);
    headers.set("X-Actor-Email", actor.email);
    headers.set("X-Actor-Role", actor.role);
  }

  const response = await fetch(apiUrl(path), {
    ...requestOptions,
    body: requestBody,
    headers,
  });

  if (!response.ok) {
    let problem: ProblemDetail = { status: response.status, title: response.statusText };
    try {
      problem = { ...problem, ...(await response.json() as ProblemDetail) };
    } catch {
      // Non-JSON upstream failures retain the HTTP status and status text.
    }
    problem.requestId ??= response.headers.get("X-Request-ID") ?? undefined;
    throw new ApiError(problem, response.status);
  }

  if (response.status === 204 || response.headers.get("Content-Length") === "0") {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("json")) {
    return await response.json() as T;
  }
  return await response.blob() as T;
}
