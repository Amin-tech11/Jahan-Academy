import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/site-content";

export default async function LocalizedAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect("/admin");
}
