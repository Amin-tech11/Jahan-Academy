"use client";

import { useEffect, useRef, useState } from "react";
import { adminRequest, rowsOf, totalOf, type RecordData } from "../../lib/admin-api";
import { panelSections, superAdminSections, type PanelAccess } from "../../lib/admin-access";

export default function AccessManager() {
  const [staff, setStaff] = useState<RecordData[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<RecordData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    adminRequest(`/admin/staff?page=${page}&limit=20${query ? `&q=${encodeURIComponent(query)}` : ""}`, "GET", undefined, undefined, controller.signal)
      .then(result => { setStaff(rowsOf(result)); setTotal(totalOf(result)); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, query]);
  return <>
    <section className="adm-welcome"><div>
      <span className="adm-eyebrow">ویژه سوپرادمین</span>
      <h2>مدیریت دسترسی اعضای سازمان</h2>
      <p>کاربر را انتخاب کنید، بخش‌های مجاز را علامت بزنید و تغییرات را ذخیره کنید. دسترسی پیش‌فرض کارکنان فقط درخواست‌های مشاوره است.</p>
    </div></section>
    <section className="adm-card">
      <form className="adm-toolbar" onSubmit={e => { e.preventDefault(); setPage(1); setQuery(search); }}>
        <input aria-label="جست‌وجوی کاربر" placeholder="نام یا ایمیل کاربر" value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit">جست‌وجو</button>
      </form>
      {error && <p className="adm-error" role="alert">{error}</p>}
      {loading ? <p role="status">در حال دریافت کاربران…</p> : <div className="adm-table-wrap"><table>
        <thead><tr><th>کاربر</th><th>ایمیل</th><th>وضعیت</th><th>دسترسی‌ها</th></tr></thead>
        <tbody>{staff.map(person => <tr key={String(person.id)}>
          <td>{String(person.firstName)} {String(person.lastName)}</td>
          <td dir="ltr">{String(person.email)}</td>
          <td>{person.active ? "فعال" : "غیرفعال"}</td>
          <td><button className="adm-link" onClick={() => setSelected(person)}>تنظیم دسترسی</button></td>
        </tr>)}</tbody>
      </table>{!staff.length && !error && <p className="adm-empty">کاربری پیدا نشد.</p>}</div>}
      <footer className="adm-pagination">
        <span>{total.toLocaleString("fa-IR")} کاربر</span>
        <button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>قبلی</button>
        <span>صفحه {page.toLocaleString("fa-IR")}</span>
        <button disabled={page * 20 >= total || loading} onClick={() => setPage(page + 1)}>بعدی</button>
      </footer>
    </section>
    {selected && <AccessEditor key={String(selected.id)} person={selected} onClose={() => setSelected(null)} />}
  </>;
}

function AccessEditor({ person, onClose }: { person: RecordData; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const [access, setAccess] = useState<PanelAccess | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const dirty = access && [...checked].sort().join() !== [...access.sections].sort().join();
  useEffect(() => {
    const controller = new AbortController();
    setAccess(null);
    setError("");
    adminRequest(`/admin/staff/${person.id}/panel-access`, "GET", undefined, undefined, controller.signal)
      .then(result => { const data = result.data as PanelAccess; setAccess(data); setChecked(data.sections); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [person.id, reload]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || busy) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  function close() { if (!busy && (!dirty || window.confirm("تغییرات ذخیره نشده‌اند. از فرم خارج می‌شوید؟"))) onClose(); }
  return <dialog ref={dialog} className="adm-dialog" aria-labelledby="access-title" onCancel={e => { e.preventDefault(); close(); }}>
    <header className="adm-dialog-heading"><div><h2 id="access-title">دسترسی‌های {String(person.firstName)} {String(person.lastName)}</h2><p dir="ltr">{String(person.email)}</p></div><button autoFocus onClick={close} disabled={busy} aria-label="بستن">×</button></header>
    {error && <div className="adm-error" role="alert">{error} <button disabled={busy} onClick={() => { if (!dirty || window.confirm("تغییرات ذخیره‌نشده کنار گذاشته و اطلاعات جدید دریافت شود؟")) setReload(reload + 1); }}>دریافت دوباره</button></div>}
    {notice && <p role="status">{notice}</p>}
    {!access ? <p role="status">در حال دریافت دسترسی‌ها…</p> : <>
      <p>{access.isSuperAdmin ? "سوپرادمین همیشه به همه بخش‌ها دسترسی دارد." : "هر بخش فعال، امکان مشاهده و انجام عملیات مجاز آن بخش را می‌دهد. مشاور فقط درخواست‌های ارجاع‌شده به خودش را می‌بیند."}</p>
      <div className="adm-access-grid">{panelSections.map(section => <label key={section.id}>
        <input type="checkbox" checked={access.isSuperAdmin || checked.includes(section.id)} disabled={busy || access.isSuperAdmin || superAdminSections.has(section.id)} onChange={e => { setNotice(""); setChecked(e.target.checked ? [...checked, section.id] : checked.filter(id => id !== section.id)); }} />
        <span>{section.title}<small>{superAdminSections.has(section.id) ? "فقط سوپرادمین" : section.group}</small></span>
      </label>)}</div>
      <footer className="adm-form-footer"><button disabled={busy} onClick={close}>بستن</button><button className="adm-primary" disabled={busy || !dirty || access.isSuperAdmin} onClick={async () => {
        setBusy(true); setError(""); setNotice("");
        try {
          const result = await adminRequest(`/admin/staff/${person.id}/panel-access`, "PUT", { sections: checked }, access.version);
          const data = result.data as PanelAccess;
          setAccess(data); setChecked(data.sections); setNotice("دسترسی‌ها ذخیره و اعمال شدند.");
          window.dispatchEvent(new Event("admin-access-changed"));
        } catch (err) { setError(err instanceof Error ? err.message : "ذخیره انجام نشد."); }
        finally { setBusy(false); }
      }}>{busy ? "در حال ذخیره…" : "ذخیره دسترسی‌ها"}</button></footer>
    </>}
  </dialog>;
}
