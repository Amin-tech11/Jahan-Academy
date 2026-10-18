import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import ReauthDialog from "./reauth-dialog";
import "@fontsource-variable/vazirmatn";
import "../globals.css";
import "../accessibility.css";
import "../dropdowns.css";
import "./admin.css";
import "./login.css";

export const metadata: Metadata = {
  title: "مدیریت جهان آکادمی",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await headers(); // Request-specific script nonces; private pages must never be prerendered.
  return (
    <html lang="fa" dir="rtl"><body><div className="admin-app" dir="rtl">
      {children}<ReauthDialog />
    </div></body></html>
  );
}
