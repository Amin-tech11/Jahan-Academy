import { notFound } from "next/navigation";

const content = {
  fa: {
    eyebrow: "زیرساخت پروژه آماده است",
    title: "جهان آکادمی",
    description: "مسیر تحصیلی و شغلی شما، از انتخاب تا اقدام.",
    status: "Frontend، API، PostgreSQL، Redis و Nginx در Docker اجرا می‌شوند.",
  },
  en: {
    eyebrow: "Project infrastructure is ready",
    title: "Jahan Academy",
    description: "Your education and career journey, from discovery to application.",
    status: "Frontend, API, PostgreSQL, Redis, and Nginx are running in Docker.",
  },
} as const;

type Locale = keyof typeof content;

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(locale in content)) {
    notFound();
  }

  const selectedLocale = locale as Locale;
  const copy = content[selectedLocale];

  return (
    <main
      dir={selectedLocale === "fa" ? "rtl" : "ltr"}
      className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16"
    >
      <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm md:p-14">
        <p className="mb-4 text-sm font-semibold text-sky-700">{copy.eyebrow}</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{copy.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{copy.description}</p>
        <div className="mt-10 rounded-2xl bg-slate-100 p-5 text-sm leading-7 text-slate-700">
          {copy.status}
        </div>
      </section>
    </main>
  );
}
