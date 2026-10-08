"use client";

import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";

type Option = { value: string; text: string; disabled: boolean };
function textOf(children: ReactNode): string {
  return Children.toArray(children).map(child => isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : String(child)).join("");
}
function optionsOf(children: ReactNode, disabled = false): Option[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return [];
    if (child.type === "option") return [{ value: String(child.props.value ?? textOf(child.props.children)), text: textOf(child.props.children), disabled: disabled || Boolean(child.props.disabled) }];
    return optionsOf(child.props.children, disabled || Boolean(child.props.disabled));
  });
}

/** A shared listbox UI; a native select retains FormData and required-field validation. */
export default function SiteSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { children, id: suppliedId, className, style, onChange, onInvalid, ...nativeProps } = props;
  const generatedId = useId();
  const id = suppliedId ?? `select-${generatedId}`;
  const options = optionsOf(children);
  const [internal, setInternal] = useState(String(props.defaultValue ?? options.find(option => !option.disabled)?.value ?? ""));
  const value = props.value === undefined ? internal : String(props.value);
  const selected = options.findIndex(option => option.value === value);
  const initialActive = selected >= 0 && !options[selected].disabled ? selected : options.findIndex(option => !option.disabled);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selected);
  const [invalid, setInvalid] = useState(false);
  const [label, setLabel] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 280, direction: "rtl" });
  const trigger = useRef<HTMLButtonElement>(null);
  const native = useRef<HTMLSelectElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  useEffect(() => {
    const button = trigger.current;
    const wrappingLabel = button?.closest("label") ?? (suppliedId ? [...document.querySelectorAll("label")].find(item => item.htmlFor === suppliedId) : null);
    if (wrappingLabel) {
      const clone = wrappingLabel.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".site-select").forEach(item => item.remove());
      setLabel(clone.textContent?.trim() ?? "");
    }
    const form = native.current?.form;
    if (button) setPosition(current => ({ ...current, direction: getComputedStyle(button).direction }));
    const reset = () => { setTimeout(() => { setInternal(native.current?.value ?? ""); setInvalid(false); setOpen(false); }, 0); };
    form?.addEventListener("reset", reset);
    return () => { form?.removeEventListener("reset", reset); };
  }, [suppliedId, props.name]);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const button = trigger.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const height = Math.min(280, options.length * 44 + 12, Math.max(80, below >= 180 || below >= above ? below : above));
      const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 16);
      setPosition({ top: below >= 180 || below >= above ? rect.bottom + 6 : Math.max(8, rect.top - height - 6), left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), width, maxHeight: height, direction: getComputedStyle(button).direction });
    };
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !list.current?.contains(event.target as Node)) setOpen(false); };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); document.removeEventListener("pointerdown", outside); };
  }, [open, options.length]);
  useEffect(() => { if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, open, id]);
  useEffect(() => { if (props.disabled) setOpen(false); }, [props.disabled]);
  function choose(index: number) {
    if (options[index]?.disabled || !native.current || !options[index]) return;
    native.current.value = options[index].value;
    native.current.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
    trigger.current?.focus();
  }
  function move(delta: number) {
    const enabled = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
    const current = enabled.indexOf(active);
    setActive(enabled[Math.max(0, Math.min(enabled.length - 1, current + delta))] ?? -1);
  }
  return <span className="site-select" style={style}>
    <button ref={trigger} id={id} type="button" role="combobox" className={["site-select__trigger", className].filter(Boolean).join(" ")} disabled={props.disabled} tabIndex={props.tabIndex}
      aria-label={props["aria-label"] ?? (label || undefined)} aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]}
      aria-expanded={open} aria-controls={`${id}-list`} aria-haspopup="listbox" aria-required={props.required}
      aria-invalid={invalid || props["aria-invalid"]} aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
      onBlur={() => setOpen(false)} onClick={() => { setActive(initialActive); setOpen(!open); }}
      onKeyDown={event => {
        if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); if (!open) { setOpen(true); setActive(initialActive); } else move(event.key === "ArrowDown" ? 1 : -1); }
        else if (event.key === "Home" || event.key === "End") { event.preventDefault(); setOpen(true); setActive(event.key === "Home" ? options.findIndex(option => !option.disabled) : options.findLastIndex(option => !option.disabled)); }
        else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (open) choose(active); else { setOpen(true); setActive(initialActive); } }
        else if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
        else if (event.key === "Tab") setOpen(false);
        else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const now = Date.now(); search.current = { text: now - search.current.time > 700 ? event.key : search.current.text + event.key, time: now };
          const match = options.findIndex(option => !option.disabled && option.text.toLocaleLowerCase().startsWith(search.current.text.toLocaleLowerCase()));
          if (match >= 0) { event.preventDefault(); setOpen(true); setActive(match); }
        }
      }}><span>{options[selected]?.text ?? "—"}</span><svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true"><path d="M0 0h10L5 6z" fill="currentColor" /></svg></button>
    <select {...nativeProps} ref={native} id={`${id}-native`} className="site-select__native" tabIndex={-1} aria-hidden="true" onChange={event => { setInternal(event.target.value); setInvalid(false); onChange?.(event); }} onInvalid={event => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); onInvalid?.(event); }}>{children}</select>
    {invalid && <span className="site-select__error" role="alert">{position.direction === "ltr" ? "Please select an option." : "لطفاً یک گزینه انتخاب کنید."}</span>}
    {open && createPortal(<div ref={list} id={`${id}-list`} className="site-select__list" role="listbox" aria-label={props["aria-label"] ?? (label || undefined)} dir={position.direction === "ltr" ? "ltr" : "rtl"} style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }} onMouseDown={event => event.preventDefault()}>
      {options.map((option, index) => <div key={`${option.value}-${index}`} id={`${id}-option-${index}`} role="option" aria-selected={index === selected} aria-disabled={option.disabled} data-active={index === active} onPointerMove={() => { if (!option.disabled) setActive(index); }} onClick={event => { event.preventDefault(); event.stopPropagation(); choose(index); }}><span>{option.text}</span>{index === selected && <span aria-hidden="true">✓</span>}</div>)}
    </div>, document.body)}
  </span>;
}
