import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/site-content";
import styles from "./site-footer.module.css";

export function SiteFooter({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  const path = (route: string) => `/${locale}${route}`;
  const links = [
    ["/about", fa ? "درباره جهان آکادمی" : "About Jahan Academy"],
    ["/services", fa ? "خدمات جهان آکادمی" : "Our services"],
    ["/countries", fa ? "مقصدهای تحصیلی" : "Study destinations"],
    ["/universities", fa ? "دانشگاه‌ها" : "Universities"],
    ["/articles", fa ? "مجله‌ها" : "Magazine"],
    ["/privacy", fa ? "حریم خصوصی" : "Privacy policy"],
  ];
  return <footer className={`site-footer ${styles.footer}`}>
    <div className={`shell ${styles.inner}`}>
      <div className={styles.content}>
        <h2>{fa ? "جهان آکادمی؛ همراه مسیر تحصیلی بین‌المللی شما" : "Jahan Academy — your international study partner"}</h2>
        <p className={styles.description}>{fa
          ? "از شناخت مقصد و انتخاب دانشگاه تا آماده‌سازی مدارک و پیگیری مسیر تحصیل، با تصمیم‌های آگاهانه پیش بروید."
          : "Explore destinations, choose a university and prepare your next steps with informed decisions and thoughtful guidance."}</p>
        <div className={styles.columns}>
          <nav className={styles.navigation} aria-label={fa ? "دسترسی سریع در فوتر" : "Footer quick links"}>
            <h3>{fa ? "دسترسی سریع" : "Explore"}</h3>
            <ul>{links.map(([route, label]) => <li key={route}><Link href={path(route)}>{label}</Link></li>)}</ul>
          </nav>
          <div className={styles.contact}>
            <h3>{fa ? "همراه شما در قدم بعدی" : "Plan your next step"}</h3>
            <Link className={styles.contactLink} href={path("/free-consultation?source=footer")}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-6 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M7 9h10M7 13h6" /></svg>
              <span>{fa ? "درخواست مشاوره تخصصی رایگان" : "Request a free initial consultation"}</span>
            </Link>
            <Link className={styles.contactLink} href={path("/consultation?source=footer")}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4H5v17h14V4h-3M9 2h6v4H9zM8 11h8M8 15h5" /></svg>
              <span>{fa ? "تکمیل فرم ارزیابی اولیه" : "Complete your initial assessment"}</span>
            </Link>
            <p className={styles.contactNote}>{fa ? "درخواست خود را ثبت کنید تا تیم جهان آکادمی برای بررسی شرایط و هماهنگی مشاوره با شما تماس بگیرد." : "Submit your request so our team can review your circumstances and contact you to arrange a consultation."}</p>
          </div>
        </div>
      </div>
      <div className={styles.identity}>
        <Link className={styles.logo} href={path("")} aria-label={fa ? "جهان آکادمی، صفحه اصلی" : "Jahan Academy, home"}>
          <Image src="/brand/jahan-academy-official.png" alt="" width={180} height={64} sizes="180px" />
        </Link>
        <p className={styles.tagline}>{fa ? "آینده‌ای روشن، با انتخابی آگاهانه" : "A brighter future begins with informed choices"}</p>
        <Link className={styles.action} href={path("/free-consultation?source=footer-brand")}>{fa ? "شروع گفت‌وگو" : "Start a conversation"}<span aria-hidden="true">{fa ? "↖" : "↗"}</span></Link>
      </div>
    </div>
  </footer>;
}
