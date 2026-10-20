"use client";

import { useEffect, useState } from "react";
import { adminRequest } from "../../lib/admin-api";
import styles from "./analytics-dashboard.module.css";

type Totals = { activeUsers: number; newUsers: number; sessions: number; views: number; engagementRate: number };
type Day = Totals & { date: string };
type Overview = {
  status: "ready" | "not_configured"; propertyId: string; rangeDays: 7 | 28 | 90;
  fetchedAt: string | null; timeZone: string | null; cached: boolean;
  totals: Totals | null; previous: Totals | null; daily: Day[];
  channels: { name: string; sessions: number }[]; devices: { name: string; sessions: number }[];
  pages: { path: string; views: number }[]; limitations: string[];
};
type Realtime = { status: "ready" | "not_configured"; propertyId: string; activeUsers: number | null; fetchedAt: string | null };
type TrendMetric = "views" | "sessions" | "activeUsers";
const number = (value: number) => value.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
const stamp = (value: string | null) => value ? new Date(value).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" }) : "—";
const dayLabel = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString("fa-IR", { month: "short", day: "numeric", timeZone: "UTC" });
const metricLabels = { views: "بازدید صفحه", sessions: "نشست", activeUsers: "کاربر فعال" };
const deviceLabels: Record<string, string> = { desktop: "دسکتاپ", mobile: "موبایل", tablet: "تبلت", "(not set)": "نامشخص" };
const definitions: Record<keyof Totals, string> = {
  activeUsers: "کاربران فعال یکتای کل بازه طبق GA4؛ از جمع کاربران روزانه محاسبه نمی‌شود.",
  newUsers: "کاربرانی که نخستین بازدید یا استفادهٔ آن‌ها در این بازه ثبت شده است.",
  sessions: "تعداد نشست‌های ثبت‌شده در GA4.",
  views: "تعداد مشاهدهٔ صفحات؛ بازدیدهای تکراری هم محاسبه می‌شوند.",
  engagementRate: "سهم نشست‌های تعاملی از کل نشست‌ها، طبق تعریف GA4.",
};

function change(current: number, previous: number, rate: boolean) {
  if (current === previous) return "بدون تغییر";
  if (rate) return `${number(Math.abs(current - previous) * 100)} واحد درصد ${current > previous ? "افزایش" : "کاهش"}`;
  if (!previous) return "مقدار بازهٔ قبل صفر است؛ درصد تغییر قابل محاسبه نیست";
  return `${number(Math.abs((current - previous) / previous) * 100)}٪ ${current > previous ? "افزایش" : "کاهش"}`;
}

function Segments({ title, rows, devices = false }: { title: string; rows: { name: string; sessions: number }[]; devices?: boolean }) {
  const max = Math.max(1, ...rows.map(row => row.sessions));
  return <section className={styles.card} aria-label={title}><h2>{title}</h2><p className={styles.muted}>تعداد نشست</p>
    {!rows.length ? <p className={styles.empty}>داده‌ای در این بازه ثبت نشده است.</p> : <ul className={styles.segments}>{rows.map(row => <li key={row.name}>
      <div><span dir="auto">{devices ? deviceLabels[row.name] ?? row.name : row.name}</span><b>{number(row.sessions)}</b></div>
      <div className={styles.track} aria-hidden="true"><span style={{ width: `${row.sessions / max * 100}%` }} /></div>
    </li>)}</ul>}
  </section>;
}

function DailyChart({ rows }: { rows: Day[] }) {
  const [metric, setMetric] = useState<TrendMetric>("views");
  const max = Math.max(1, ...rows.map(row => row[metric]));
  const width = 800, height = 180, bar = rows.length ? width / rows.length : 1;
  return <section className={`${styles.card} ${styles.trend}`}>
    <div className={styles.sectionHead}><h2>روند روزانه</h2><label>شاخص نمودار <select value={metric} onChange={event => setMetric(event.target.value as TrendMetric)}>
      {Object.entries(metricLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select></label></div>
    {!rows.length ? <p className={styles.empty}>برای این بازه دادهٔ روزانه‌ای ثبت نشده است.</p> : <>
      <div className={styles.chart} role="img" aria-label={`نمودار ${metricLabels[metric]} در ${number(rows.length)} روز دارای داده؛ مقادیر دقیق در جدول زیر نمودار در دسترس است.`}>
        <div className={styles.scale}><span>{number(max)}</span><span>۰</span></div>
        <div className={styles.plot} dir="ltr"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {[0, .5, 1].map(level => <line key={level} x1="0" x2={width} y1={height * level} y2={height * level} stroke="#e5eaf1" />)}
          {rows.map((row, index) => <rect key={row.date} x={index * bar + bar * .15} y={height - row[metric] / max * height} width={bar * .7} height={row[metric] / max * height} rx="2" fill="#17477e"><title>{`${dayLabel(row.date)}: ${number(row[metric])}`}</title></rect>)}
        </svg><div className={styles.axis}><span>{dayLabel(rows[0].date)}</span><span>{dayLabel(rows[Math.floor(rows.length / 2)].date)}</span><span>{dayLabel(rows[rows.length - 1].date)}</span></div></div>
      </div>
      <p className={styles.muted}>هر ستون یک روز دارای داده در منطقهٔ زمانی Property است. کاربران روزانه ممکن است بین روزها تکرار شوند.</p>
      <details className={styles.detail}><summary>مشاهدهٔ داده‌های روزانه</summary><div className={styles.tableWrap}><table><caption className={styles.srOnly}>گزارش روزانهٔ Google Analytics</caption><thead><tr><th>روز</th><th>کاربر فعال</th><th>نشست</th><th>بازدید</th></tr></thead><tbody>{rows.map(row => <tr key={row.date}><th scope="row"><time dateTime={row.date}>{dayLabel(row.date)}</time></th><td>{number(row.activeUsers)}</td><td>{number(row.sessions)}</td><td>{number(row.views)}</td></tr>)}</tbody></table></div></details>
    </>}
  </section>;
}

export default function AnalyticsDashboard() {
  const [days, setDays] = useState<7 | 28 | 90>(28);
  const [refresh, setRefresh] = useState(0);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [realtime, setRealtime] = useState<Realtime | null>(null);
  const [error, setError] = useState("");
  const [liveError, setLiveError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    setOverview(null);
    const load = async () => {
      if (pending || controller.signal.aborted) return;
      pending = true; setBusy(true); setError("");
      try {
        const result = await adminRequest(`/reporting/analytics?days=${days}`, "GET", undefined, undefined, controller.signal);
        if (!controller.signal.aborted) setOverview(result as unknown as Overview);
      } catch (cause) {
        if (!controller.signal.aborted) { setOverview(null); setError(cause instanceof Error ? cause.message : "گزارش دریافت نشد."); }
      } finally { pending = false; if (!controller.signal.aborted) setBusy(false); }
    };
    void load();
    const poll = () => { if (!document.hidden) void load(); };
    const timer = window.setInterval(poll, 300000);
    window.addEventListener("focus", poll);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", poll); };
  }, [days, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending || controller.signal.aborted) return;
      pending = true; setLiveError("");
      try {
        const result = await adminRequest("/reporting/analytics/realtime", "GET", undefined, undefined, controller.signal);
        if (!controller.signal.aborted) setRealtime(result as unknown as Realtime);
      } catch (cause) {
        if (!controller.signal.aborted) { setRealtime(null); setLiveError(cause instanceof Error ? cause.message : "گزارش زنده دریافت نشد."); }
      } finally { pending = false; }
    };
    void load();
    const poll = () => { if (!document.hidden) void load(); };
    const timer = window.setInterval(poll, 60000);
    window.addEventListener("focus", poll);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", poll); };
  }, [refresh]);

  return <div className={styles.dashboard} data-analytics-dashboard>
    <header className={styles.header}><div><h1>آمار بازدید سایت</h1><p>Google Analytics 4 · Property <span dir="ltr">{overview?.propertyId ?? realtime?.propertyId ?? "558971968"}</span></p></div>
      <div className={styles.controls}><label>بازهٔ گزارش <select value={days} onChange={event => setDays(Number(event.target.value) as 7 | 28 | 90)}><option value="7">۷ روز کامل</option><option value="28">۲۸ روز کامل</option><option value="90">۹۰ روز کامل</option></select></label>
        <button type="button" disabled={busy} onClick={() => setRefresh(value => value + 1)}>به‌روزرسانی</button>
      </div>
    </header>
    {error && <div className={styles.error} role="alert">{error}<button type="button" disabled={busy} onClick={() => setRefresh(value => value + 1)}>تلاش دوباره</button></div>}
    {busy && !overview && <p role="status" className={styles.empty}>در حال دریافت گزارش Google Analytics…</p>}
    {overview?.status === "not_configured" && <section className={`${styles.card} ${styles.setup}`}>
      <h2>اتصال Google Analytics هنوز فعال نشده است</h2>
      <p>برای نمایش دادهٔ واقعی، مدیر سرور باید اتصال حساب سرویس اختصاصی را تکمیل کند.</p>
      <ol><li>Google Analytics Data API را در پروژهٔ Google Cloud فعال کنید.</li><li>ایمیل حساب سرویس را با نقش Viewer به Property {overview.propertyId} اضافه کنید.</li><li>کلید JSON را فقط در تنظیمات خصوصی بک‌اند قرار دهید و اتصال گزارش‌گیری را فعال کنید.</li></ol>
      <p className={styles.muted}>پس از تنظیم اتصال، «به‌روزرسانی» را بزنید.</p>
    </section>}
    {overview?.status === "ready" && overview.totals && overview.previous && <>
      <div className={styles.sourceLine}><span>{number(days)} روز کامل تا دیروز، در مقایسه با {number(days)} روز پیش از آن</span><span>منطقهٔ زمانی: <b dir="ltr">{overview.timeZone ?? "طبق تنظیمات GA4"}</b></span><span>دریافت گزارش: <time dateTime={overview.fetchedAt ?? undefined}>{stamp(overview.fetchedAt)}</time></span></div>
      <div className={styles.metrics}>{([
        ["activeUsers", "کاربران فعال"], ["newUsers", "کاربران جدید"], ["sessions", "نشست‌ها"], ["views", "بازدید صفحات"], ["engagementRate", "نرخ تعامل"],
      ] as const).map(([key, label]) => <section className={styles.metric} key={key}><h2><abbr title={definitions[key]}>{label}</abbr></h2><strong>{key === "engagementRate" ? `${number(overview.totals![key] * 100)}٪` : number(overview.totals![key])}</strong><p>{change(overview.totals![key], overview.previous![key], key === "engagementRate")}</p></section>)}
        <section className={`${styles.metric} ${styles.live}`}><h2><span className={styles.dot} aria-hidden="true" />فعال در ۳۰ دقیقهٔ اخیر</h2><strong>{realtime?.status === "ready" && realtime.activeUsers !== null ? number(realtime.activeUsers) : "—"}</strong><p>{liveError || (realtime?.status === "ready" ? `دریافت: ${stamp(realtime.fetchedAt)}` : "در انتظار گزارش زنده")}</p></section>
      </div>
      {!!overview.limitations.length && <p className={styles.notice} role="status">گوگل برای بخشی از این گزارش محدودیت حریم خصوصی، گروه‌بندی «سایر» یا نمونه‌گیری اعلام کرده است؛ مقادیر ممکن است همهٔ جزئیات دادهٔ خام را نشان ندهند.</p>}
      <DailyChart rows={overview.daily} />
      <div className={styles.columns}><Segments title="۱۰ کانال ورودی برتر" rows={overview.channels} /><Segments title="دستگاه‌های کاربران" rows={overview.devices} devices /></div>
      <section className={styles.card}><h2>۱۰ صفحهٔ پربازدید</h2>{!overview.pages.length ? <p className={styles.empty}>بازدید صفحه‌ای در این بازه ثبت نشده است.</p> : <div className={styles.tableWrap}><table><caption className={styles.srOnly}>صفحات پربازدید بر اساس تعداد مشاهده</caption><thead><tr><th scope="col">مسیر صفحه</th><th scope="col">بازدید</th></tr></thead><tbody>{overview.pages.map(page => <tr key={page.path}><td dir="ltr">{page.path}</td><td>{number(page.views)}</td></tr>)}</tbody></table></div>}</section>
      <p className={styles.muted}>گزارش تاریخی هر ۵ دقیقه و آمار ۳۰ دقیقهٔ اخیر هر دقیقه بررسی می‌شود. زمان دریافت کنار هر گزارش درج شده است. داده‌های GA4 ممکن است با تأخیر پردازش شوند؛ این اعداد نشان‌دهندهٔ فعالیت اندازه‌گیری‌شده‌اند.</p>
    </>}
  </div>;
}
