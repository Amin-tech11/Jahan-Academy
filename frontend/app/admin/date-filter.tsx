"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { addDays, calendarLabel, calendarParts, dateKey, fromKey, monthDays, monthStart, todayKey, type Calendar } from "../../lib/admin-calendar";

export default function DateFilter({ label, value, onChange, min, max, calendar, onCalendarChange }: {
  calendar: Calendar; onCalendarChange: (calendar: Calendar) => void;
  label: string; value: string; onChange: (value: string) => void; min?: string; max?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [cursor, setCursor] = useState("2026-01-01");
  const [focusDay, setFocusDay] = useState("");
  const [yearStart, setYearStart] = useState(1400);
  const [today, setToday] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const parts = calendarParts(fromKey(cursor), calendar);
  const number = (value: number) => value.toLocaleString(calendar === "persian" ? "fa-IR" : "en-US", { useGrouping: false });
  const disabled = (key: string) => Boolean((min && key < min) || (max && key > max));
  const days = monthDays(calendar, parts.year, parts.month);
  const activeDay = days.some((day) => dateKey(day) === focusDay) && !disabled(focusDay)
    ? focusDay : days.map(dateKey).find((key) => !disabled(key));
  function close() { setOpen(false); trigger.current?.focus(); }
  function show() {
    const current = todayKey();
    const target = value || (min && current < min ? min : max && current > max ? max : current);
    setToday(current); setCursor(target); setFocusDay(target); setView("days"); setOpen(true);
  }
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!trigger.current || !popup.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const { width, height } = popup.current.getBoundingClientRect();
      const below = rect.bottom + 8;
      const top = below + height <= window.innerHeight - 12 ? below
        : rect.top - height - 8 >= 12 ? rect.top - height - 8 : Math.max(12, window.innerHeight - height - 12);
      setPosition({ top, left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, view]);
  useEffect(() => {
    if (open && view === "days") popup.current?.querySelector<HTMLButtonElement>(activeDay ? `[data-day="${activeDay}"]` : '[aria-label="انتخاب ماه"]')?.focus();
    if (open && view !== "days") {
      const selected = popup.current?.querySelector<HTMLButtonElement>('.adm-calendar-options button[aria-pressed="true"]');
      (selected ?? popup.current?.querySelector<HTMLButtonElement>('.adm-calendar-options button'))?.focus();
    }
  }, [open, view, activeDay, calendar]);
  function move(amount: number) {
    if (view === "years") { setYearStart((year) => Math.max(1, year + amount * 12)); return; }
    setCursor(dateKey(monthStart(calendar, parts.year + (view === "months" ? amount : 0), parts.month + (view === "days" ? amount : 0))));
  }
  function navigateDay(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: Date;
    if (event.key in step) next = addDays(fromKey(key), step[event.key]);
    else if (event.key === "PageUp" || event.key === "PageDown") {
      const current = calendarParts(fromKey(key), calendar);
      next = monthStart(calendar, current.year, current.month + (event.key === "PageUp" ? -1 : 1));
    } else return;
    event.preventDefault();
    const nextKey = dateKey(next);
    if (!disabled(nextKey)) { setCursor(nextKey); setFocusDay(nextKey); }
  }
  return <div className="adm-date-filter" ref={root} onBlur={(event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }} onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); close(); } }}>
    <span id={`${id}-label`} className="adm-date-label">{label}</span>
    <button ref={trigger} type="button" className="adm-date-trigger" aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${id}-dialog` : undefined} onClick={() => open ? close() : show()}>
      <span id={`${id}-value`}>{value ? calendarLabel(fromKey(value), calendar) : "انتخاب تاریخ"}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m3 0h2m3 0h1M7 18h2m3 0h2"/></svg>
    </button>
    {open && <div ref={popup} className="adm-calendar" style={position} id={`${id}-dialog`} role="dialog" aria-label={`انتخاب ${label}`}>
      <div className="adm-calendar-tabs" role="group" aria-label="نوع تقویم">
        {(["persian", "gregory"] as const).map((mode) => <button type="button" key={mode} aria-pressed={calendar === mode} onClick={() => {
          onCalendarChange(mode); setView("days"); setFocusDay(cursor);
        }}>{mode === "persian" ? "شمسی" : "میلادی"}</button>)}
      </div>
      <div className="adm-calendar-heading" dir="ltr">
        <button type="button" aria-label={view === "years" ? "۱۲ سال قبل" : view === "months" ? "سال قبل" : "ماه قبل"} onClick={() => move(-1)}>‹</button>
        {view === "years" ? <strong aria-live="polite">{number(yearStart)} – {number(yearStart + 11)}</strong> : <>
          <button type="button" aria-label="انتخاب ماه" onClick={() => setView(view === "months" ? "days" : "months")}>{new Intl.DateTimeFormat(calendar === "persian" ? "fa-IR" : "en-US", { calendar, timeZone: "UTC", month: "long" }).format(fromKey(cursor))}</button>
          <button type="button" aria-label="انتخاب سال" onClick={() => { setYearStart(parts.year - 5); setView("years"); }}>{number(parts.year)}</button>
        </>}
        <button type="button" aria-label={view === "years" ? "۱۲ سال بعد" : view === "months" ? "سال بعد" : "ماه بعد"} onClick={() => move(1)}>›</button>
      </div>
      {view === "days" ? <>
        <div className="adm-calendar-week" dir="ltr" aria-hidden="true">{(calendar === "persian" ? ["ش", "ی", "د", "س", "چ", "پ", "ج"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((day) => <span key={day}>{day}</span>)}</div>
        <div className="adm-calendar-days" dir="ltr" role="group" aria-label="روزهای ماه">
          {days.map((date) => {
            const key = dateKey(date);
            const day = calendarParts(date, calendar);
            return <button type="button" key={key} data-day={key} tabIndex={key === activeDay ? 0 : -1} disabled={disabled(key)} aria-label={calendarLabel(date, calendar)} aria-pressed={key === value} aria-current={key === today ? "date" : undefined} className={day.month !== parts.month ? "is-other-month" : undefined} onKeyDown={(event) => navigateDay(event, key)} onClick={() => { onChange(key); close(); }}>{number(day.day)}</button>;
          })}
        </div>
      </> : <div className="adm-calendar-options" dir="ltr">
        {Array.from({ length: 12 }, (_, index) => view === "years" ? yearStart + index : index + 1).map((item) => <button type="button" key={item} aria-pressed={item === (view === "years" ? parts.year : parts.month)} onClick={() => {
          const date = monthStart(calendar, view === "years" ? item : parts.year, view === "months" ? item : parts.month);
          setCursor(dateKey(date)); setFocusDay(dateKey(date)); setView(view === "years" ? "months" : "days");
        }}>{view === "years" ? number(item) : new Intl.DateTimeFormat(calendar === "persian" ? "fa-IR" : "en-US", { calendar, timeZone: "UTC", month: "long" }).format(monthStart(calendar, parts.year, item))}</button>)}
      </div>}
      <div className="adm-calendar-footer"><button type="button" onClick={() => { onChange(""); close(); }}>پاک کردن</button><button type="button" onClick={close}>بستن</button></div>
    </div>}
  </div>;
}
