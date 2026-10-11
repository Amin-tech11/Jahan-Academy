import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/site-content";
import styles from "./site-footer.module.css";

export function SiteFooter({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  const path = (route: string) => `/${locale}${route}`;
  return <footer className={`site-footer ${styles.footer}`}>
    <div className={`shell ${styles.inner}`}>
      <div className={styles.content}>
        <h2>{fa ? "جهان آکادمی؛ همراه مسیر تحصیلی بین‌المللی شما" : "Jahan Academy — your international study partner"}</h2>
        <div className={styles.columns}>
          <address className={styles.details}>
            <h3>{fa ? "راه‌های ارتباط با ما" : "Contact details"}</h3>
            <a className={styles.contactLink} href="https://t.me/jahanacademy11" target="_blank" rel="noopener noreferrer">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m21 3-4 18-6-5-4 3v-6L3 10l18-7ZM7 13 21 3M11 16l10-13" /></svg>
              <span>{fa ? "کانال تلگرام" : "Telegram channel"}<span className={styles.detailValue} dir="ltr">@jahanacademy11</span></span>
            </a>
            <div className={styles.contactLink}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 3 4 1 1 5-3 2c2 3 3 4 6 6l2-3 5 1 1 4c-1 3-4 3-7 2C8 19 5 16 3 10 2 7 2 4 5 3Z" /></svg>
              <span>{fa ? "شماره تماس در واتس‌اپ و تلگرام" : "Contact number on WhatsApp and Telegram"}<a className={styles.detailValue} href="tel:+989196017164" dir="ltr">+98 919 601 7164</a>
              </span>
            </div>
            <div className={styles.contactLink}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              <span>{fa ? "نشانی دفتر" : "Office address"}<span className={styles.detailValue}>{fa ? "تهران، بلوار میرداماد، بعد از خیابان نلسون ماندلا، پلاک ۳۸۶، طبقه ۳، واحد ۳" : "Unit 3, Floor 3, No. 386, Mirdamad Boulevard, past Nelson Mandela Street, Tehran, Iran"}</span></span>
            </div>
          </address>
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
          </div>
        </div>
      </div>
      <div className={styles.identity}>
        <Link className={styles.logo} href={path("")} aria-label={fa ? "جهان آکادمی، صفحه اصلی" : "Jahan Academy, home"}>
          <Image src="/brand/jahan-academy-official.png" alt="" width={180} height={64} sizes="180px" />
        </Link>
        <nav className={styles.socials} aria-label={fa ? "شبکه‌های اجتماعی جهان آکادمی" : "Jahan Academy social media"}>
          <a href="https://t.me/jahanacademy11" target="_blank" rel="noopener noreferrer" aria-label={fa ? "کانال تلگرام جهان آکادمی" : "Jahan Academy Telegram channel"} title={fa ? "کانال تلگرام" : "Telegram channel"}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m21 3-4 18-6-5-4 3v-6L3 10l18-7ZM7 13 21 3M11 16l10-13" /></svg>
          </a>
          <a href="https://www.instagram.com/jahanacademi/" target="_blank" rel="noopener noreferrer" aria-label={fa ? "اینستاگرام جهان آکادمی" : "Jahan Academy Instagram"} title={fa ? "اینستاگرام" : "Instagram"}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
          </a>
          <a href="https://wa.me/989196017164" target="_blank" rel="noopener noreferrer" aria-label={fa ? "واتس‌اپ جهان آکادمی" : "Jahan Academy WhatsApp"} title={fa ? "واتس‌اپ" : "WhatsApp"}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17 3 21l4-1a9 9 0 1 0-3-3Z" /><path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 2c-1 2-3 2-5 1-3-2-5-4-6-7 0-1 1-2 2-3Z" /></svg>
          </a>
        </nav>
      </div>
    </div>
  </footer>;
}
