"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type SyntheticEvent } from "react";
import type { Locale } from "@/lib/site-content";
import "./public-form-feedback.css";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Present existing native/custom validation beside fields without retaining form data. */
export function usePublicFormFeedback(locale: Locale) {
  const prefix = useId();
  const form = useRef<HTMLFormElement>(null);
  const frame = useRef<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  useEffect(() => {
    setReady(true);
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); frame.current = null; };
  }, []);
  const focus = (name: string) => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const element = form.current?.elements.namedItem(name);
      if (!(element instanceof HTMLElement)) return;
      const target = element.closest(".site-select")?.querySelector<HTMLElement>('button[role="combobox"]') ?? element;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "center", behavior: "instant" });
      const viewport = window.visualViewport;
      let top = viewport?.offsetTop ?? 0;
      let bottom = top + (viewport?.height ?? window.innerHeight);
      const site = target.closest(".site");
      const bars = new Set<HTMLElement>();
      site?.querySelectorAll<HTMLElement>("nav, .site-header").forEach(nav => {
        for (let parent: HTMLElement | null = nav; parent && parent !== site; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (["sticky", "fixed"].includes(style.position) && style.top !== "auto") { bars.add(parent); break; }
        }
      });
      [...bars].map(bar => bar.getBoundingClientRect()).sort((a, b) => a.top - b.top).forEach(box => {
        if (box.width && box.height && box.top <= top + 16 && box.bottom > top) top = box.bottom;
      });
      const action = document.querySelector<HTMLElement>('[data-mobile-consultation-visible="true"]');
      if (action) bottom = Math.min(bottom, action.getBoundingClientRect().top);
      const box = target.getBoundingClientRect();
      if (box.top < top + 8 || box.bottom > bottom - 8) {
        const position = top + 8 + Math.max(0, (bottom - top - 16 - box.height) / 2);
        window.scrollBy({ top: box.top - position, behavior: "instant" });
      }
    });
  };
  const mark = (name: string, message: string) => {
    setErrors(current => ({ ...current, [name]: message }));
    focus(name);
  };
  const invalid = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target as Control;
    if (!target.name || !target.validity) return;
    event.preventDefault();
    let message = t("مقدار این فیلد معتبر نیست.", "Enter a valid value.");
    if (target.validity.customError) message = target.validationMessage;
    else if (target.validity.valueMissing) message = t("این فیلد را تکمیل کنید.", "Complete this field.");
    else if (target.validity.typeMismatch && target.type === "email") message = t("ایمیل معتبر وارد کنید.", "Enter a valid email address.");
    else if (target.validity.rangeUnderflow && target instanceof HTMLInputElement) message = t(`حداقل مقدار ${target.min} است.`, `The minimum value is ${target.min}.`);
    else if (target.validity.rangeOverflow && target instanceof HTMLInputElement) message = t(`حداکثر مقدار ${target.max} است.`, `The maximum value is ${target.max}.`);
    mark(target.name, message);
  };
  const clear = (event: SyntheticEvent<HTMLFormElement>) => {
    const name = (event.target as Control).name;
    if (!name) return;
    setErrors(current => {
      if (!(name in current)) return current;
      const next = { ...current }; delete next[name]; return next;
    });
  };
  const id = (name: string) => `public-field-error-${prefix}-${name}`;
  const serverErrors = (fields?: Record<string, string[]>) => {
    const entries = Object.entries(fields ?? {}).flatMap(([name, messages]) => {
      if (!form.current || !Array.isArray(messages) || !messages.some(value => typeof value === "string" && value.trim())) return [];
      const field = form.current.elements.namedItem(name) ? name
        : ["firstName", "lastName"].includes(name) && form.current.elements.namedItem("fullName") ? "fullName" : null;
      return field ? [[field, t("مقدار واردشده معتبر نیست.", "Please check this value.")] as const] : [];
    });
    if (!entries.length) return;
    setErrors(current => ({ ...current, ...Object.fromEntries(entries) }));
    focus(entries[0][0]);
  };
  return {
    formProps: { ref: form, onInvalidCapture: invalid, onInputCapture: clear, onChangeCapture: clear },
    ready,
    mark,
    serverErrors,
    fieldProps: (name: string) => ({ "aria-invalid": errors[name] ? true as const : undefined, "aria-describedby": errors[name] ? id(name) : undefined }),
    message: (name: string) => errors[name] ? <span className="public-field-error" id={id(name)}>{errors[name]}</span> : null,
  };
}
