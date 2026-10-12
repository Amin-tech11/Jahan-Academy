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
  const { query, body, headers, signal, timeoutMs: configuredTimeout, ...rest } = options;
  const consultation = path === "/consultation-requests" && options.method?.toUpperCase() === "POST";
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Accept")) requestHeaders.set("Accept", "application/json");
  if (body !== undefined && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  const retryable = consultation && Boolean(requestHeaders.get("Idempotency-Key"));
  const timeoutMs = configuredTimeout ?? (consultation ? 30000 : 10000);
  const serialized = body === undefined ? undefined : JSON.stringify(body);
  const fa = body !== null && typeof body === "object" && "locale" in body && body.locale === "fa";
  for (let attempt = 0; ; attempt += 1) {
    const timeout = AbortSignal.timeout(timeoutMs);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(apiUrl(path, query), {
        ...rest,
        signal: requestSignal,
        headers: Object.fromEntries(requestHeaders),
        ...(serialized !== undefined ? { body: serialized } : {}),
      });

      if (response.status === 204 && !consultation) return undefined as T;
      // Read errors (including a timeout after response headers) must not become a null success.
      const responseText = await response.text();
      let payload: unknown = null;
      try { payload = JSON.parse(responseText); } catch { /* HTTP error pages may not be JSON. */ }
      if (!response.ok) {
        const failure = payload as ApiFailure | null;
        throw new ApiError(
          response.status,
          failure?.error?.code ?? "REQUEST_FAILED",
          failure?.error?.message ?? `Request failed (${response.status}).`,
          failure?.error?.fieldErrors,
        );
      }
      if (consultation && !(payload && typeof payload === "object" && "data" in payload &&
        payload.data && typeof payload.data === "object" && "reference" in payload.data &&
        typeof payload.data.reference === "string" && payload.data.reference.length > 0)) {
        throw new TypeError("Consultation response is missing its receipt.");
      }
      return payload as T;
    } catch (error) {
      if (signal?.aborted) throw error;
      const transportFailure = error instanceof TypeError ||
        (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name));
      // Only this endpoint's keyed POST is safe to replay; never retry arbitrary writes.
      if (retryable && transportFailure && attempt === 0) continue;
      if (consultation && transportFailure) {
        throw new ApiError(0, "SUBMISSION_UNCONFIRMED", fa
          ? "تأیید ثبت درخواست دریافت نشد. لطفاً با همین اطلاعات دوباره تلاش کنید؛ از ثبت تکراری جلوگیری می‌شود."
          : "We could not confirm your submission. Retry with the same details; duplicate submissions are prevented.");
      }
      throw error;
    }
  }
}
