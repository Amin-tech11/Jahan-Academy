import { PreparedImage as Image } from "@/components/prepared-image";
import type { Locale } from "@/lib/site-content";
import { socialLinks } from "@/lib/social-links";
import styles from "./home-social-banners.module.css";

const banners = [
  { key: "whatsapp", fa: "گفت‌وگو با جهان آکادمی در واتس‌اپ", en: "Chat with Jahan Academy on WhatsApp" },
  { key: "telegram", fa: "کانال تلگرام جهان آکادمی", en: "Join Jahan Academy on Telegram" },
  { key: "instagram", fa: "صفحه اینستاگرام جهان آکادمی", en: "Follow Jahan Academy on Instagram" },
] as const;

export function HomeSocialBanners({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  return <section id="home-social" className={styles.section} aria-label={fa ? "ارتباط با جهان آکادمی در شبکه‌های اجتماعی" : "Connect with Jahan Academy on social media"}>
    <div className={`shell ${styles.grid}`}>
      {banners.map(banner => <a key={banner.key} className={styles.banner} href={socialLinks[banner.key]} target="_blank" rel="noopener noreferrer"
        aria-label={`${fa ? banner.fa : banner.en} — ${fa ? "بازشدن در تب جدید" : "opens in a new tab"}`}>
        <Image src={`/social/${banner.key}-en-v3.webp`} alt={banner.en} lang="en" width={1254} height={1254}
          sizes="(max-width: 599px) calc(100vw - 32px), (max-width: 1199px) calc((100vw - 80px) / 3), 384px" />
      </a>)}
    </div>
  </section>;
}
