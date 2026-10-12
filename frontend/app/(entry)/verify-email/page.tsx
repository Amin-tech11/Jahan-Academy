import type { Metadata } from "next";
import { AccountRecovery } from "@/components/account-recovery";
export const metadata: Metadata = { title: "تأیید ایمیل | Jahan Academy", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <AccountRecovery verification />; }
