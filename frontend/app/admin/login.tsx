"use client";

import { useState, type FormEvent } from "react";
import {
  acceptAdminSession,
  adminRequest,
  type RecordData,
} from "../../lib/admin-api";

export default function AdminLogin({
  onLogin,
}: {
  onLogin: (user: RecordData) => void;
}) {
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        const result = await adminRequest("/auth/login", "POST", {
          username: String(data.get("username") ?? "").trim(),
          password: data.get("password"),
        });
        const session = result.data as RecordData;
        acceptAdminSession(session);
        onLogin(session.user as RecordData);
      } else if (mode === "reset") {
        await adminRequest("/auth/password-resets", "POST", {
          token: data.get("token"),
          newPassword: data.get("password"),
        });
        setNotice("رمز جدید ذخیره شد. اکنون وارد شوید.");
        setMode("login");
      } else {
        await adminRequest("/auth/password-reset-requests", "POST", {
          email: data.get("email"),
        });
        setNotice(
          "اگر حساب واجد شرایط باشد، لینک بازیابی به ایمیل ارسال می‌شود.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ورود انجام نشد. دوباره تلاش کنید.",
      );
    } finally {
      setBusy(false);
    }
  }
  function switchMode(next: string) {
    setMode(next);
    setError("");
    setNotice("");
    setVisible(false);
  }
  return (
    <main className="adm-sky-login">
      <div className="adm-sky-wordmark" aria-hidden="true">
        JAHAN ACADEMY
      </div>
      <div className="adm-entry-card">
        <section className="adm-entry-brand" aria-label="جهان آکادمی">
          <span className="adm-entry-overline">یک جهان فرصت، یک مسیر روشن</span>
          <div className="adm-entry-logo">
            <img
              src="/brand/jahan-academy-official.png"
              alt="لوگوی جهان آکادمی"
            />
          </div>
          <div className="adm-entry-brand-copy">
            <h1>پنل مدیریت جهان آکادمی</h1>
            <p>
              فضای یکپارچه تیم برای همراهی، مشاوره
              <br />و ساختن آینده‌ای فراتر از مرزها
            </p>
          </div>
          <span className="adm-entry-brand-footer">
            <span /> همراه شما، از تصمیم تا مقصد
          </span>
        </section>
        <section className="adm-entry-form" aria-labelledby="adm-login-title">
          <div className="adm-entry-heading">
            <span className="adm-entry-kicker">خوش آمدید</span>
            <h2 id="adm-login-title">
              {mode === "login"
                ? "ورود به سامانه"
                : mode === "reset"
                  ? "تعیین رمز جدید"
                  : "بازیابی رمز عبور"}
            </h2>
            <p>
              {mode === "login"
                ? "نام کاربری و رمز عبور خود را برای ورود وارد کنید."
                : "بازیابی دسترسی از طریق ایمیل حساب انجام می‌شود."}
            </p>
          </div>
          {error && (
            <div className="adm-error" id="adm-login-error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="adm-success" role="status">
              {notice}
            </div>
          )}
          <form onSubmit={submit} aria-busy={busy}>
            {mode === "login" && (
              <label htmlFor="adm-username">
                <span>
                  نام کاربری <b aria-hidden="true">*</b>
                </span>
                <input
                  id="adm-username"
                  name="username"
                  type="text"
                  dir="ltr"
                  required
                  maxLength={320}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-describedby={error ? "adm-login-error" : undefined}
                />
              </label>
            )}
            {mode === "forgot" && (
              <label htmlFor="adm-recovery-email">
                <span>
                  ایمیل حساب <b aria-hidden="true">*</b>
                </span>
                <input
                  id="adm-recovery-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  required
                  autoComplete="email"
                />
              </label>
            )}
            {mode === "reset" && (
              <label htmlFor="adm-reset-token">
                <span>
                  توکن لینک بازیابی <b aria-hidden="true">*</b>
                </span>
                <input
                  id="adm-reset-token"
                  name="token"
                  dir="ltr"
                  minLength={32}
                  required
                />
              </label>
            )}
            {mode !== "forgot" && (
              <div className="adm-password-field">
                <label htmlFor="adm-password">
                  <span>
                    رمز عبور <b aria-hidden="true">*</b>
                  </span>
                </label>
                <div className="adm-password-input">
                  <input
                    id="adm-password"
                    name="password"
                    type={visible ? "text" : "password"}
                    dir="ltr"
                    required
                    minLength={mode === "reset" ? 12 : 1}
                    maxLength={128}
                    autoComplete={
                      mode === "reset" ? "new-password" : "current-password"
                    }
                  />
                  <button
                    type="button"
                    aria-label={
                      visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                    }
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      {visible && <path d="m4 3 16 18" />}
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <button type="submit" className="adm-entry-submit" disabled={busy}>
              {busy
                ? "در حال بررسی…"
                : mode === "login"
                  ? "ورود به پنل"
                  : mode === "reset"
                    ? "ذخیره رمز جدید"
                    : "ارسال لینک بازیابی"}
            </button>
          </form>
          <div className="adm-entry-links">
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "forgot" : "login")}
            >
              {mode === "login"
                ? "رمز عبور را فراموش کرده‌اید؟"
                : "بازگشت به ورود"}
            </button>
            {mode === "forgot" && (
              <button type="button" onClick={() => switchMode("reset")}>
                لینک بازیابی را دریافت کرده‌ام
              </button>
            )}
          </div>
          <p className="adm-entry-footnote">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" />
              <path d="m8 12 3 3 5-6" />
            </svg>
            دسترسی ویژه اعضای تیم جهان آکادمی
          </p>
        </section>
      </div>
      <p className="adm-sky-footer">
        JAHAN ACADEMY <span>·</span> جهان، نزدیک‌تر از همیشه
      </p>
    </main>
  );
}
