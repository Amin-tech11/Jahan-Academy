import Image from "next/image";
import Link from "next/link";
import { ConsultationFreeText } from "./consultation-form-heading";
import { SiteShell } from "@/components/site-shell";
import { brandContent } from "@/lib/brand-content";
import type { Locale } from "@/lib/site-content";
import styles from "./about-page.module.css";

const copy = {
  fa: {
    label: "درباره جهان آکادمی", home: "خانه", eyebrow: "هر مسیر بزرگ، با یک انتخاب شروع می‌شود",
    title: "جهانی از فرصت،", accent: "همراهی برای آیندهٔ شما.",
    subtitle: "ما کنار شما هستیم تا مسیر تحصیل در خارج از کشور را روشن‌تر ببینید و قدم بعدی را آگاهانه بردارید.",
    cta: "درخواست مشاوره رایگان", storyLink: "با جهان آکادمی آشنا شوید", imageAlt: "نمایی الهام‌بخش از مسیر ورود به محوطهٔ دانشگاه",
    imageCaption: "آینده، از یک قدم آگاهانه آغاز می‌شود", storyLabel: "داستان ما", storyTitle: "فراتر از یک مقصد؛\nدر کنار یک رؤیا.",
    quote: "باور داریم مسیر هر فرد، به اندازهٔ رؤیای او منحصربه‌فرد است.",
    nav: ["داستان ما", "مأموریت و چشم‌انداز", "ارزش‌های ما", "مسیر همراهی", "پرسش‌های شما"],
    purpose: "آنچه ما را پیش می‌برد", purposeTitle: "نگاه ما به فردای شما", valuesLabel: "اصولی که به آن‌ها پایبندیم", valuesIntro: "اعتماد از انتخاب‌های کوچک و رفتارهای هر روز ساخته می‌شود. این اصول، مبنای گفت‌وگوی ما با شما هستند.",
    journeyLabel: "از شناخت تا انتخاب", journeyTitle: "مسیر را با هم روشن می‌کنیم", journeyIntro: "نقطهٔ شروع، شناخت شماست؛ نه انتخاب یک کشور از روی نقشه.",
    steps: [
      { title: "شنیدن داستان شما", text: "دربارهٔ هدف، پیشینهٔ تحصیلی، سطح زبان و دغدغه‌هایتان گفت‌وگو می‌کنیم." },
      { title: "روشن‌کردن گزینه‌ها", text: "مقصدها و مسیرهای مرتبط را با توجه به بودجه، زمان و اولویت‌های شما بررسی می‌کنیم." },
      { title: "آمادگی برای قدم بعد", text: "نیازهای مسیر و گام‌های پیش رو را مشخص می‌کنیم تا بدانید از کجا شروع کنید." },
    ],
    faqLabel: "پیش از شروع", faqTitle: "بیشتر با ما آشنا شوید", contact: "ارتباط با جهان آکادمی", endTitle: "آیندهٔ شما، ارزش یک گفت‌وگو را دارد.", endText: "از هدف‌ها و پرسش‌هایتان بگویید. اولین قدم را با یک درخواست مشاوره رایگان بردارید.", endNote: "بدون نیاز به ساخت حساب کاربری", skip: "رفتن به محتوای اصلی",
  },
  en: {
    label: "About Jahan Academy", home: "Home", eyebrow: "Every great journey begins with a choice",
    title: "A world of opportunity.", accent: "A partner for your future.",
    subtitle: "We are here to help you understand your study-abroad options and take an informed next step.",
    cta: "Request free consultation", storyLink: "Get to know Jahan Academy", imageAlt: "An inspiring view of a path leading into a university campus",
    imageCaption: "The future starts with an informed step", storyLabel: "Our story", storyTitle: "Beyond a destination.\nBeside your ambition.",
    quote: "We believe every journey is as individual as the ambition behind it.",
    nav: ["Our story", "Mission & vision", "Our values", "Your journey", "Your questions"],
    purpose: "What moves us forward", purposeTitle: "Our perspective on your future", valuesLabel: "The principles behind our work", valuesIntro: "Trust grows through everyday choices and actions. These principles guide every conversation we have with you.",
    journeyLabel: "From understanding to choice", journeyTitle: "Finding clarity, together", journeyIntro: "Our starting point is understanding you, before choosing a country on a map.",
    steps: [
      { title: "Listen to your story", text: "We discuss your goals, academic background, language level, and concerns." },
      { title: "Explore your options", text: "We review relevant destinations and pathways in light of your budget, timing, and priorities." },
      { title: "Prepare your next step", text: "We clarify what the journey involves and the steps ahead so you know where to begin." },
    ],
    faqLabel: "Before you begin", faqTitle: "Get to know us better", contact: "Contact Jahan Academy", endTitle: "Your future deserves a conversation.", endText: "Tell us about your goals and questions. Take the first step with a free consultation request.", endNote: "No account needed", skip: "Skip to main content",
  },
};

function Icon({ kind }: { kind: number }) {
  const paths = [
    <path key="shield" d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6" />,
    <path key="book" d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" />,
    <path key="heart" d="M12 20S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12Z" />,
    <path key="chat" d="M20 11a8 8 0 0 1-8 8H4l1-5a8 8 0 1 1 15-3ZM8 10h8m-8 4h5" />,
    <path key="growth" d="M5 20V10m7 10V4m7 16v-7M3 6l6-3m7 4 5-4" />,
    <g key="globe"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></g>,
  ];
  return <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind % paths.length]}</svg>;
}

export function AboutPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const brand = brandContent[locale];
  const anchors = ["story", "purpose", "values", "journey", "questions"];
  const consultation = `/${locale}/consultation?source=about`;
  const number = (n: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(n);
  return <SiteShell locale={locale}>
    <a className={styles.skip} href="#about-main">{c.skip}</a>
    <main className={styles.page} id="about-main">
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label={locale === "fa" ? "مسیر صفحه" : "Breadcrumb"}><Link href={`/${locale}`}>{c.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{c.label}</span></nav>
        <section className={styles.hero} aria-labelledby="about-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><span className={styles.dot} />{c.label}</span>
            <h1 id="about-title">{c.title}<br /><em>{c.accent}</em></h1>
            <p>{c.subtitle}</p>
            <div className={styles.actions}><Link className={styles.primary} href={consultation}><span><ConsultationFreeText text={c.cta} locale={locale} /></span><span aria-hidden="true">{locale === "fa" ? "↖" : "↗"}</span></Link><a className={styles.storyLink} href="#story">{c.storyLink}<span aria-hidden="true">↓</span></a></div>
            <div className={styles.heroFoot}><span aria-hidden="true">✧</span>{c.eyebrow}</div>
          </div>
          <figure className={styles.heroImage}>
            <Image src="/home-hero-documentary.png" alt={c.imageAlt} fill sizes="(max-width: 800px) 100vw, 50vw" preload />
            <div className={styles.imageWord} aria-hidden="true">BEYOND<br />BORDERS.</div>
            <figcaption><span aria-hidden="true">↗</span><span>{c.imageCaption}<small>JAHAN ACADEMY</small></span></figcaption>
          </figure>
        </section>
        <nav className={styles.sectionNav} aria-label={locale === "fa" ? "بخش‌های درباره ما" : "About page sections"}>{c.nav.map((label, i) => <a href={`#${anchors[i]}`} key={label}><span>{number(i + 1)}</span>{label}</a>)}</nav>
        <section id="story" className={styles.story} aria-labelledby="story-title">
          <div><span className={styles.eyebrow}>{c.storyLabel}</span><h2 id="story-title">{c.storyTitle}</h2><p className={styles.quote}>{c.quote}</p></div>
          <div className={styles.prose}><p>{brand.intro}</p><h3>{brand.whyTitle}</h3><p>{brand.whyText}</p><Link className={styles.inlineLink} href={`/${locale}/services`}>{locale === "fa" ? "آشنایی با خدمات ما" : "Explore our services"}<span aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></Link></div>
        </section>
      </div>
      <section id="purpose" className={styles.purpose} aria-labelledby="purpose-title"><div className={styles.container}>
        <div className={styles.purposeHeader}><div><span className={styles.eyebrow}>{c.purpose}</span><h2 id="purpose-title">{c.purposeTitle}</h2></div><span className={styles.compass} aria-hidden="true">✳</span></div>
        <div className={styles.purposeGrid}>{[{ title: brand.missionTitle, text: brand.missionText }, { title: brand.visionTitle, text: brand.visionText }].map((item, i) => <article key={item.title}><span className={styles.purposeNumber}>{number(i + 1)}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </div></section>
      <div className={styles.container}>
        <section id="values" className={styles.section} aria-labelledby="values-title"><div className={styles.sectionHeader}><div><span className={styles.eyebrow}>{c.valuesLabel}</span><h2 id="values-title">{brand.valuesTitle}</h2></div><p>{c.valuesIntro}</p></div>
          <div className={styles.valuesGrid}>{brand.values.map((value, i) => <article className={styles.valueCard} key={value.title}><div className={styles.valueTop}><span className={styles.icon}><Icon kind={i} /></span><span className={styles.cardNumber}>{number(i + 1)}</span></div><h3>{value.title}</h3><p>{value.text}</p></article>)}</div>
        </section>
        <section id="journey" className={styles.journey} aria-labelledby="journey-title"><span className={styles.eyebrow}>{c.journeyLabel}</span><h2 id="journey-title">{c.journeyTitle}</h2><p className={styles.journeyIntro}>{c.journeyIntro}</p><ol className={styles.steps}>{c.steps.map((step, i) => <li key={step.title}><span>{number(i + 1)}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol></section>
        <section id="questions" className={styles.faq} aria-labelledby="faq-title"><div><span className={styles.eyebrow}>{c.faqLabel}</span><h2 id="faq-title">{c.faqTitle}</h2><p>{brand.faqIntro}</p><Link href={`/${locale}/contact`} className={styles.inlineLink}>{c.contact}<span aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></Link></div><div className={styles.questions}>{brand.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true" className={styles.plus}>+</span></summary><p>{faq.answer}</p></details>)}</div></section>
        <section className={styles.cta}><span className={styles.ctaMark} aria-hidden="true">✧</span><div><h2>{c.endTitle}</h2><p><ConsultationFreeText text={c.endText} locale={locale} /></p></div><div className={styles.ctaAction}><Link className={styles.primary} href={consultation}><span><ConsultationFreeText text={c.cta} locale={locale} /></span><span aria-hidden="true">{locale === "fa" ? "↖" : "↗"}</span></Link><small>{c.endNote}</small></div></section>
      </div>
    </main>
  </SiteShell>;
}
