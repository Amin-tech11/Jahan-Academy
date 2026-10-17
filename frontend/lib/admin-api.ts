import { trackAdminActivity } from "./admin-activity.ts";
import { requestReauthentication } from "./admin-reauth.ts";
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
let stopActivity: (() => void) | undefined;
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
  stopActivity?.(); stopActivity = undefined;
}
export function acceptAdminSession(data: RecordData) {
  accessToken = String(data.accessToken ?? "");
  if (data.mfaEnrollmentRequired) { stopActivity?.(); stopActivity = undefined; }
  if (typeof window !== "undefined" && accessToken && !data.mfaEnrollmentRequired && !stopActivity)
    stopActivity = trackAdminActivity(window, async () => {
      try { await adminRequest("/auth/activity", "POST", {}); }
      catch (error) {
        if (error instanceof AdminError && error.status === 401) {
          try { await restoreAdminSession(); await adminRequest("/auth/activity", "POST", {}); }
          catch { clearAdminSession(); window.dispatchEvent(new Event("admin-session-expired")); }
        }
      }
    });
}
export async function adminRequest(
  path: string,
  method = "GET",
  body?: unknown,
  version?: number,
  signal?: AbortSignal,
  retried = false,
  reauthToken?: string,
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
      ...(reauthToken ? { "X-Reauth-Token": reauthToken } : {}),
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
    return adminRequest(path, method, body, version, signal, true, reauthToken);
  }
  if (response.status === 403 && payload.error?.code === "REAUTH_REQUIRED" && !reauthToken) {
    const token = await requestReauthentication({ method, path });
    return adminRequest(path, method, body, version, signal, retried, token);
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "نشست معتبر نیست؛ دوباره وارد شوید.",
      403: "برای این عملیات مجوز ندارید.",
      409: "اطلاعات تغییر کرده یا عملیات با وضعیت فعلی سازگار نیست.",
      412: "این رکورد هم‌زمان تغییر کرده است. فرم را ببندید و دوباره باز کنید.",
      429: "تعداد درخواست‌ها زیاد است؛ کمی بعد تلاش کنید.",
      502: "ارتباط با سرور برقرار نشد. اتصال API را بررسی کنید.",
      503: "سرویس موردنیاز موقتاً در دسترس نیست؛ کمی بعد تلاش کنید.",
    };
    const codes: Record<string, string> = {
      REAUTH_REQUIRED: "تأیید هویت منقضی شده است؛ عملیات را دوباره انجام دهید.",
      REAUTH_UNAVAILABLE: "تأیید هویت موقتاً در دسترس نیست؛ کمی بعد تلاش کنید.",
      PASSWORD_LENGTH: "رمز جدید باید بین ۱۵ و ۱۲۸ کاراکتر باشد.",
      PASSWORD_COMMON_OR_COMPROMISED: "این رمز رایج است؛ یک عبارت منحصربه‌فرد انتخاب کنید.",
      PASSWORD_POLICY_UNAVAILABLE: "بررسی امنیت رمز موقتاً در دسترس نیست؛ کمی بعد تلاش کنید.",
      AUTH_LIMITER_UNAVAILABLE: "ورود موقتاً در دسترس نیست؛ کمی بعد تلاش کنید.",
      MFA_REQUIRED: "کد اپ احراز هویت یا یکی از کدهای بازیابی را وارد کنید.",
      MFA_INVALID: "کد احراز هویت معتبر نیست یا قبلاً مصرف شده است.",
      MFA_ENROLLMENT_REQUIRED: "پیش از دسترسی به پنل، ورود دومرحله‌ای را فعال کنید.",
      MFA_REQUIRED_FOR_STAFF: "ورود دومرحله‌ای برای حساب‌های پنل الزامی است و غیرفعال نمی‌شود.",
      EMAIL_SERVICE_UNAVAILABLE: "بازیابی ایمیلی فعلاً فعال نیست. با مدیر سایت تماس بگیرید.",
      INVALID_CREDENTIALS: "نام کاربری یا رمز عبور صحیح نیست.",
    };
    const details = payload.error?.fieldErrors
      ? Object.entries(payload.error.fieldErrors)
          .map(
            ([field, values]) =>
              `${field}: ${Array.isArray(values) ? values.map((value) => codes[String(value)] ?? value).join("، ") : values}`,
          )
          .join(" · ")
      : "";
    throw new AdminError(
      response.status,
      (codes[String(payload.error?.code)] ?? messages[response.status] ??
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
