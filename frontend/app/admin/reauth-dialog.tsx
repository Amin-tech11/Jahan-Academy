"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminRequest } from "@/lib/admin-api";
import { setReauthHandler, type ReauthOperation } from "@/lib/admin-reauth";

type Challenge = { operation: ReauthOperation; resolve: (token: string) => void; reject: (error: Error) => void };
export default function ReauthDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<Challenge | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function cancel() {
    pending.current?.reject(new Error("عملیات لغو شد؛ تغییری ثبت نشد."));
    pending.current = null; setChallenge(null); setError("");
    dialog.current?.close();
  }
  useEffect(() => {
    const dispose = setReauthHandler(operation => new Promise((resolve, reject) => {
      if (pending.current) { reject(new Error("ابتدا تأیید هویت باز را تکمیل کنید.")); return; }
      const next = { operation, resolve, reject }; pending.current = next; setChallenge(next);
    }));
    return () => { dispose(); pending.current?.reject(new Error("صفحه بسته شد.")); pending.current = null; };
  }, []);
  useEffect(() => { if (challenge) dialog.current?.showModal(); }, [challenge]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!challenge || busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await adminRequest("/auth/reauthenticate", "POST", {
        ...challenge.operation, password: String(data.get("password")), code: String(data.get("code")).trim(),
      });
      const token = String((response.data as { token: string }).token);
      pending.current = null; setChallenge(null); dialog.current?.close(); challenge.resolve(token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تأیید انجام نشد."); }
    finally { setBusy(false); }
  }
  return challenge && <dialog ref={dialog} className="adm-mfa-dialog" aria-labelledby="reauth-title" onCancel={event => { event.preventDefault(); if (!busy) cancel(); }}>
    <h2 id="reauth-title">تأیید هویت برای عملیات حساس</h2>
    <p>برای ثبت این تغییر، رمز فعلی و کد اپ احراز هویت یا یک کد بازیابی را وارد کنید.</p>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={submit} aria-busy={busy}>
      <label>رمز فعلی<input name="password" type="password" autoComplete="current-password" required /></label>
      <label>کد احراز هویت یا بازیابی<input name="code" autoComplete="one-time-code" minLength={6} maxLength={64} required /></label>
      <button type="submit" disabled={busy}>{busy ? "در حال بررسی…" : "تأیید و ادامه"}</button>
      <button type="button" disabled={busy} onClick={cancel}>لغو عملیات</button>
    </form>
  </dialog>;
}
