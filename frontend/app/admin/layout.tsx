import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";
import "./login.css";

export const metadata: Metadata = {
  title: "مدیریت جهان آکادمی",
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-app" dir="rtl">
      {children}
    </div>
  );
}
