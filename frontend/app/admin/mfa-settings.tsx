"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminRequest, clearAdminSession, type RecordData } from "@/lib/admin-api";

export function MfaSettings({ required = false }: { required?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [mandatory, setMandatory] = useState(required);
  const [loaded, setLoaded] = useState(false);
  const [secret, setSecret] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const controller = new AbortController();
    adminRequest("/auth/mfa", "GET", undefined, undefined, controller.signal).then(result => {
      setEnabled(Boolean((result.data as RecordData).enabled)); setLoaded(true);
      setMandatory(required || Boolean((result.data as RecordData).required));
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [open, required]);
  function close() {
    dialog.current?.close(); setOpen(false); setSecret(""); setCodes([]); setLoaded(false); setError("");
  }
  function signedOut() { clearAdminSession(); window.dispatchEvent(new Event("admin-session-expired")); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !loaded) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const action = enabled ? "disable" : secret ? "confirm" : "setup";
      const result = await adminRequest(`/auth/mfa/${action}`, "POST", { password: String(data.get("password")), ...(action === "setup" ? {} : { code: String(data.get("code")).trim() }) });
      if (action === "setup") setSecret(String((result.data as RecordData).secret));
      else if (action === "confirm") { setSecret(""); setCodes((result.data as RecordData).recoveryCodes as string[]); }
      else { close(); signedOut(); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "عملیات انجام نشد."); }
    finally { setBusy(false); }
  }
  return <><button type="button" onClick={() => setOpen(true)}>امنیت حساب</button>
    {open && <dialog ref={dialog} className="adm-mfa-dialog" aria-labelledby="mfa-title" onCancel={event => { if (codes.length || busy) event.preventDefault(); else close(); }} onClose={close}>
      <h2 id="mfa-title">ورود دومرحله‌ای</h2>
      {error && <p role="alert">{error}</p>}
      {codes.length ? <><p>ورود دومرحله‌ای فعال شد. این کدهای یک‌بارمصرف فقط همین بار نمایش داده می‌شوند؛ آن‌ها را خارج از این دستگاه ذخیره کنید. همه نشست‌های قبلی بسته شدند.</p><pre dir="ltr">{codes.join("\n")}</pre><button type="button" onClick={() => { close(); signedOut(); }}>کدها را ذخیره کردم؛ ورود دوباره</button></> : <>
        <p>{enabled ? mandatory ? "ورود دومرحله‌ای برای حساب‌های پنل الزامی است و امکان غیرفعال‌سازی ندارد." : "حساب شما ورود دومرحله‌ای دارد. غیرفعال‌سازی به رمز و کد معتبر نیاز دارد و همه نشست‌ها را می‌بندد." : "کلید را در اپ احراز هویت با حساب جهان آکادمی ثبت کنید و کد شش‌رقمی را وارد کنید. ورود دومرحله‌ای برای حساب‌های پنل الزامی است."}</p>
        {secret && <><p>کلید راه‌اندازی (محرمانه):</p><code dir="ltr">{secret}</code><p>پیش از تأیید، کد اپ را وارد کنید. راه‌اندازی بعد از ۱۵ دقیقه منقضی می‌شود.</p></>}
        {!(enabled && mandatory) && <form onSubmit={submit} aria-busy={busy}><label>رمز فعلی<input name="password" type="password" autoComplete="current-password" dir="ltr" required maxLength={128} /></label>
          {(secret || enabled) && <label>کد اپ احراز هویت{enabled ? " یا بازیابی" : ""}<input name="code" autoComplete="one-time-code" dir="ltr" required minLength={6} maxLength={64} /></label>}
          <button type="submit" disabled={busy || !loaded}>{busy ? "در حال بررسی…" : enabled ? "غیرفعال‌سازی و خروج" : secret ? "تأیید و دریافت کدهای بازیابی" : "آغاز فعال‌سازی"}</button>
        </form>}<button type="button" disabled={busy} onClick={close}>بستن</button>
      </>}
    </dialog>}
  </>;
}
