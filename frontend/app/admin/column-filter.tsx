"use client";

import { useEffect, useRef, useState } from "react";

export default function ColumnFilter({ title, values, selected, onApply, onClose }: {
  title: string; values: string[]; selected?: string[];
  onApply: (values: string[] | undefined) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>(selected ?? values);
  const input = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    input.current?.focus();
    return () => { opener?.focus(); };
  }, []);
  const shown = values.filter(value => value.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <div className="adm-column-overlay" onClick={onClose} onKeyDown={event => { if (event.key === "Escape") onClose(); }}>
    <section ref={menu} className="adm-column-menu" role="dialog" aria-modal="true" aria-label={`فیلتر ${title}`} onClick={event => event.stopPropagation()} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const focusable = menu.current?.querySelectorAll<HTMLElement>('button, input');
      if (!focusable?.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      <div className="adm-column-title"><strong>فیلتر {title}</strong><button aria-label="بستن فیلتر ستون" onClick={onClose}>×</button></div>
      <input ref={input} aria-label="جست‌وجو در مقادیر ستون" placeholder="جست‌وجو در مقادیر…" value={query} onChange={event => setQuery(event.target.value)} />
      <label><input type="checkbox" checked={shown.length > 0 && shown.every(value => draft.includes(value))} onChange={event => setDraft(event.target.checked ? [...new Set([...draft, ...shown])] : draft.filter(value => !shown.includes(value)))} />انتخاب همهٔ مقادیر نمایش‌داده‌شده</label>
      <div className="adm-column-values">{shown.map(value => <label key={value}><input type="checkbox" checked={draft.includes(value)} onChange={event => setDraft(event.target.checked ? [...draft, value] : draft.filter(item => item !== value))} /><span dir="auto">{value}</span></label>)}{!shown.length && <p>مقداری پیدا نشد.</p>}</div>
      <footer><button className="adm-primary" onClick={() => { onApply(draft.length === values.length && values.every(value => draft.includes(value)) ? undefined : draft); onClose(); }}>اعمال فیلتر</button><button onClick={() => { onApply(undefined); onClose(); }}>پاک کردن فیلتر ستون</button><button onClick={onClose}>انصراف</button></footer>
    </section>
  </div>;
}
