export type ApiEnvelope<T> = { data: T };

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

type ApiFailure = {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  timeoutMs?: number;
  next?: { revalidate?: number | false; tags?: string[] };
};

export function apiBaseUrl(isServer = typeof window === "undefined") {
  if (isServer) {
    const internal = process.env.API_INTERNAL_URL ?? process.env.JAHAN_API_BASE_URL;
    if (internal) {
      const origin = internal.replace(/\/+$/, "");
      return `${origin}${origin.endsWith("/api/v1") ? "" : "/api/v1"}`;
    }
  }
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1").replace(/\/+$/, "");
}

export function apiUrl(
  path: string,
  query?: ApiRequestOptions["query"],
  baseUrl = apiBaseUrl(),
) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new TypeError("API path must be a single-root relative path.");
  }
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) params.set(key, String(value));
  });
  return `${baseUrl}${path}${params.size ? `?${params}` : ""}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { query, body, timeoutMs = 10000, headers, signal, ...rest } = options;
  const timeout = AbortSignal.timeout(timeoutMs);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const response = await fetch(apiUrl(path, query), {
    ...rest,
    signal: requestSignal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) return undefined as T;
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = payload as ApiFailure | null;
    throw new ApiError(
      response.status,
      failure?.error?.code ?? "REQUEST_FAILED",
      failure?.error?.message ?? `Request failed (${response.status}).`,
      failure?.error?.fieldErrors,
    );
  }
  return payload as T;
}
