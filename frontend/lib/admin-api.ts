export type RecordData = Record<string, unknown>;
export class AdminError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
let accessToken = "";
let refreshPromise: Promise<RecordData> | null = null;
export function restoreAdminSession(): Promise<RecordData> {
  if (!refreshPromise)
    refreshPromise = adminRequest("/auth/refresh", "POST", {})
      .then((result) => {
        acceptAdminSession(result.data as RecordData);
        return result;
      })
      .finally(() => {
        refreshPromise = null;
      });
  return refreshPromise;
}
export function clearAdminSession() {
  accessToken = "";
}
export function acceptAdminSession(data: RecordData) {
  accessToken = String(data.accessToken ?? "");
}
export async function adminRequest(
  path: string,
  method = "GET",
  body?: unknown,
  version?: number,
  signal?: AbortSignal,
  retried = false,
): Promise<RecordData> {
  if (
    !/^\/(admin\/|auth\/|users\/me(?:\/panel-access)?$|reporting\/dashboard)/.test(path) ||
    path.includes("..")
  )
    throw new Error("Invalid admin endpoint");
  const response = await fetch(`/admin/api${path}`, {
    method,
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000),
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(version ? { "If-Match": `"${version}"` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload =
    response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (response.status === 401 && !retried && !path.startsWith("/auth/")) {
    try {
      await restoreAdminSession();
    } catch {
      clearAdminSession();
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event("admin-session-expired"));
      throw new AdminError(401, "نشست منقضی شده است؛ دوباره وارد شوید.");
    }
    return adminRequest(path, method, body, version, signal, true);
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "نشست معتبر نیست؛ دوباره وارد شوید.",
      403: "برای این عملیات مجوز ندارید.",
      409: "اطلاعات تغییر کرده یا عملیات با وضعیت فعلی سازگار نیست.",
      412: "این رکورد هم‌زمان تغییر کرده است. فرم را ببندید و دوباره باز کنید.",
      429: "تعداد درخواست‌ها زیاد است؛ کمی بعد تلاش کنید.",
      502: "ارتباط با سرور برقرار نشد. اتصال API را بررسی کنید.",
    };
    const details = payload.error?.fieldErrors
      ? Object.entries(payload.error.fieldErrors)
          .map(
            ([field, values]) =>
              `${field}: ${Array.isArray(values) ? values.join("، ") : values}`,
          )
          .join(" · ")
      : "";
    throw new AdminError(
      response.status,
      (messages[response.status] ??
        payload.error?.message ??
        "ذخیره یا دریافت اطلاعات انجام نشد.") + (details ? ` ${details}` : ""),
    );
  }
  return payload;
}
export function rowsOf(payload: RecordData): RecordData[] {
  return Array.isArray(payload.data) ? payload.data : [];
}
export function totalOf(payload: RecordData): number {
  return Number(
    (payload.meta as RecordData | undefined)?.total ?? payload.total ?? 0,
  );
}
export function displayValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (Array.isArray(value)) return value.map(displayValue).join("، ");
  if (typeof value === "object") {
    const item = value as RecordData;
    return String(
      item.name ??
        item.title ??
        item.code ??
        ([item.firstName, item.lastName].filter(Boolean).join(" ") || "—"),
    );
  }
  return String(value);
}
