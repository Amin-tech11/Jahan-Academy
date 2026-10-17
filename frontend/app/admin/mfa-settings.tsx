"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminRequest, clearAdminSession, type RecordData } from "@/lib/admin-api";
import QRCode from "qrcode";

export function MfaSettings({ required = false }: { required?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [mandatory, setMandatory] = useState(required);
  const [loaded, setLoaded] = useState(false);
  const [secret, setSecret] = useState("");
  const [setupUri, setSetupUri] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setQrImage("");
    if (setupUri) {
      // Encode locally: the enrollment secret never goes to a third-party QR service.
      QRCode.toDataURL(setupUri, { width: 256, margin: 4, errorCorrectionLevel: "M" })
        .then(image => { if (!cancelled) setQrImage(image); })
        .catch(() => { if (!cancelled) setError("ساخت QR انجام نشد؛ از راهنمای ورود دستی زیر استفاده کنید."); });
    }
    return () => { cancelled = true; };
  }, [setupUri]);
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
    dialog.current?.close(); setOpen(false); setSecret(""); setSetupUri(""); setQrImage(""); setCodes([]); setLoaded(false); setError("");
  }
  function signedOut() { clearAdminSession(); window.dispatchEvent(new Event("admin-session-expired")); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !loaded) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const action = enabled ? "disable" : secret ? "confirm" : "setup";
      const result = await adminRequest(`/auth/mfa/${action}`, "POST", { password: String(data.get("password")), ...(action === "setup" ? {} : { code: String(data.get("code")).trim() }) });
      if (action === "setup") {
        const setup = result.data as RecordData;
        setSecret(String(setup.secret));
        setSetupUri(String(setup.otpauthUri));
      }
      else if (action === "confirm") { setSecret(""); setSetupUri(""); setCodes((result.data as RecordData).recoveryCodes as string[]); }
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
        {secret && <section className="adm-mfa-enrollment" aria-label="افزودن حساب به اپ احراز هویت">
          <p>در SafeAuth گزینهٔ اسکن QR را بزنید و کد تصویری زیر را اسکن کنید. تنظیمات لازم همراه QR وارد می‌شوند.</p>
          {qrImage ? <img className="adm-mfa-qr" src={qrImage} alt="QR محرمانهٔ راه‌اندازی ورود دومرحله‌ای" width={256} height={256} /> : <p role="status">در حال ساخت QR…</p>}
          <details><summary>راهنمای ورود دستی در SafeAuth</summary>
            <p>در Enter manually، برای Account Name نام «Jahan Academy» را وارد کنید؛ متن زیر را دقیقاً در Private Key بگذارید. Category فقط دسته‌بندی است و Notes می‌تواند خالی بماند.</p>
            <p>کلید راه‌اندازی محرمانه:</p><code dir="ltr">{secret}</code>
            <button type="button" onClick={() => { void navigator.clipboard.writeText(secret).catch(() => setError("کپی انجام نشد؛ کلید را از متن بالا کپی کنید.")); }}>کپی کلید راه‌اندازی</button>
            <p>TOTP · SHA1 · 6 digits · 30 seconds</p>
          </details>
          <p>کلید حروفی بالا رمز یک‌بارمصرف نیست. فقط کد ۶رقمیِ حسابی که همین الان در اپ اضافه کردید را در فیلد زیر وارد کنید.</p>
          <p>راه‌اندازی بعد از ۱۵ دقیقه منقضی می‌شود. بستن پنجره و آغاز مجدد، کلید قبلی را جایگزین می‌کند.</p>
        </section>}
        {!(enabled && mandatory) && <form onSubmit={submit} aria-busy={busy}><label>رمز فعلی<input name="password" type="password" autoComplete="current-password" dir="ltr" required /></label>
          {(secret || enabled) && <label>کد اپ احراز هویت{enabled ? " یا بازیابی" : ""}<input name="code" autoComplete="one-time-code" inputMode={enabled ? "text" : "numeric"} pattern={enabled ? undefined : "[0-9]{6}"} dir="ltr" required minLength={6} maxLength={enabled ? 64 : 6} /></label>}
          <button type="submit" disabled={busy || !loaded}>{busy ? "در حال بررسی…" : enabled ? "غیرفعال‌سازی و خروج" : secret ? "تأیید و دریافت کدهای بازیابی" : "آغاز فعال‌سازی"}</button>
        </form>}<button type="button" disabled={busy} onClick={close}>بستن</button>
      </>}
    </dialog>}
  </>;
}
