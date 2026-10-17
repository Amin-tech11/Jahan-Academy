import type { ReactNode } from "react";
import type { Locale } from "@/lib/site-content";
import "@fontsource-variable/vazirmatn";
import "@/app/globals.css";
import "@/app/foundation.css";
import "@/app/accessibility.css";
import "@/app/dropdowns.css";
import "@/app/consultation-heading.css";
import "@/app/shared-consultation.css";
import "@/app/public-responsive.css";
import "@/app/public-hero-brand.css";

export function PublicDocument({ children, locale }: { children: ReactNode; locale: Locale }) {
  return <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}><body>{children}</body></html>;
}
