"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { adminRequest } from "@/lib/admin-api";
import { newPasswordError, passwordPolicyHint } from "@/lib/password-policy";

export function AccountRecovery({ verification = false }: { verification?: boolean }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href);
    const value = new URLSearchParams(url.hash.slice(1)).get("token") ?? url.searchParams.get("token") ?? "";
    setToken(value);
    // Keep tokens out of address bar, referrers and subsequent navigation.
    window.history.replaceState(null, "", url.pathname);
    if (value.length < 32 || value.length > 256) setError("لینک معتبر نیست. یک لینک جدید درخواست کنید.");
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || complete) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (!verification && newPasswordError(password)) { setError(newPasswordError(password)); return; }
    if (!verification && password !== data.get("confirmation")) { setError("تکرار رمز با رمز جدید یکسان نیست."); return; }
    setBusy(true); setError("");
    try {
      await adminRequest(verification ? "/auth/email-verifications" : "/auth/password-resets", "POST", verification ? { token } : { token, newPassword: password });
      setToken(""); setComplete(true);
    } catch (err) { setError(err instanceof Error ? err.message : "عملیات انجام نشد؛ دوباره تلاش کنید."); }
    finally { setBusy(false); }
  }
  return <main className="recovery-page" dir="rtl"><h1>{verification ? "تأیید ایمیل" : "تعیین رمز عبور جدید"}</h1>
    {error && <p role="alert">{error}</p>}
    {complete ? <p role="status">{verification ? "ایمیل تأیید شد. اکنون می‌توانید وارد شوید." : "رمز جدید ثبت شد و نشست‌های قبلی بسته شدند. اکنون وارد شوید."}</p> : <form onSubmit={submit} aria-busy={busy}>
      {!verification && <><p>{passwordPolicyHint}</p><label>رمز جدید<input name="password" type="password" dir="ltr" autoComplete="new-password" required /></label><label>تکرار رمز جدید<input name="confirmation" type="password" dir="ltr" autoComplete="new-password" required /></label></>}
      <button type="submit" className="button button-primary" disabled={busy || token.length < 32 || token.length > 256}>{busy ? "در حال بررسی…" : verification ? "تأیید ایمیل" : "ثبت رمز جدید"}</button>
    </form>}
    <Link href="/admin">بازگشت به ورود</Link>
  </main>;
}
