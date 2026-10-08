import Link from "next/link";
import SiteSelect from "./site-select";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

function buttonClass(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return ["ui-button", `ui-button--${variant}`, `ui-button--${size}`, className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClass(variant, size, className)} type={type} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({
  className,
  ...props
}: ComponentPropsWithoutRef<"article">) {
  return <article className={["ui-card", className].filter(Boolean).join(" ")} {...props} />;
}

export function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="ui-field" data-invalid={error ? "true" : undefined}>
      <label className="ui-field__label" htmlFor={id}>
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && <p className="ui-field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="ui-field__error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

export function Input(props: ComponentPropsWithoutRef<"input">) {
  return <input className={["ui-input", props.className].filter(Boolean).join(" ")} {...props} />;
}

export function Select(props: ComponentPropsWithoutRef<"select">) {
  return <SiteSelect {...props} className={["ui-input", "ui-select", props.className].filter(Boolean).join(" ")} />;
}

export function Textarea(props: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={["ui-input", "ui-textarea", props.className].filter(Boolean).join(" ")} {...props} />;
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: ReactNode;
}) {
  return <div className={`ui-alert ui-alert--${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}
