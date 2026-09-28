export const SUPPORTED_LOCALES = ["fa", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type Localized<T> = Record<Locale, T>;
export const isLocale = (value: string): value is Locale => SUPPORTED_LOCALES.includes(value as Locale);

export type CountryGuide = {
  slug: string;
  title: Localized<string>;
  summary: Localized<string>;
  facts: Localized<Array<{ label: string; value: string }>>;
  sections: Localized<Array<{ title: string; body: string }>>;
};
export type UniversityShowcase = {
  slug: string;
  name: Localized<string>;
  summary: Localized<string>;
  country: Localized<string>;
  city?: Localized<string>;
  institutionType?: Localized<string>;
  foundedYear?: number;
  websiteUrl?: string;
};

export const siteCopy: Localized<{
  brandTagline: string; nav: Array<{ href: string; label: string }>; consultation: string;
  heroEyebrow: string; heroTitle: string; heroText: string; explore: string; trustTitle: string;
  trustText: string; servicesTitle: string; destinationsTitle: string; universitiesTitle: string;
  articlesTitle: string; faqTitle: string; footerText: string; viewDetails: string; latest: string;
  readMore: string; browseAll: string; consultationTitle: string; consultationText: string;
  privacyNotice: string; submit: string; sending: string; thankYou: string; trackingCode: string;
  duplicate: string; formError: string;
}> = {
  fa: {
    brandTagline: "تحصیل، رشد، تعلق",
    nav: [{ href: "/countries", label: "مقصدها" }, { href: "/services", label: "خدمات" }, { href: "/universities", label: "دانشگاه‌ها" }, { href: "/articles", label: "مقالات" }, { href: "/about", label: "درباره ما" }],
      consultation: "درخواست مشاوره رایگان", heroEyebrow: "برای قدم بعدی آماده‌اید؟",
      heroTitle: "فراتر از مرزها، به سوی آینده‌ای روشن",
      heroText: "از اولین پرسش تا انتخاب مقصد و آماده‌سازی مسیر اپلای، با مشاوره تخصصی و راهنمایی متناسب با شرایطتان در کنار شما هستیم.",
    explore: "مشاهده مقصدها", trustTitle: "شفاف، همراه و متعهد به مسیر شما",
    trustText: "پیش از هر تصمیم، شرایط و گزینه‌های شما را با گفت‌وگویی تخصصی بررسی می‌کنیم تا مسیر مناسب‌تری بسازید.",
    servicesTitle: "خدمات ما", destinationsTitle: "مقصدهای پرطرفدار", universitiesTitle: "دانشگاه‌های منتخب", articlesTitle: "راهنما و خبر", faqTitle: "پرسش‌های پرتکرار", footerText: "همراه شما برای ساختن مسیر تحصیلی بین‌المللی.",
    viewDetails: "مشاهده جزئیات", latest: "آخرین مطالب", readMore: "ادامه مطلب", browseAll: "مشاهده همه",
    consultationTitle: "درخواست مشاوره رایگان", consultationText: "چند اطلاعات کوتاه ثبت کنید؛ تیم ما درخواست شما را بررسی می‌کند و برای ادامه مسیر با شما در تماس خواهد بود.",
    privacyNotice: "با ثبت درخواست، با سیاست حریم خصوصی و تماس تیم جهان آکادمی موافقم.", submit: "ثبت درخواست", sending: "در حال ثبت…", thankYou: "درخواست شما با موفقیت دریافت شد.", trackingCode: "کد پیگیری", duplicate: "درخواست مشابهی پیش‌تر ثبت شده است؛ این کد را برای پیگیری نگه دارید.", formError: "ثبت درخواست ممکن نشد. لطفاً دوباره تلاش کنید.",
  },
  en: {
    brandTagline: "Study · Grow · Belong",
    nav: [{ href: "/countries", label: "Destinations" }, { href: "/services", label: "Services" }, { href: "/universities", label: "Universities" }, { href: "/articles", label: "Articles" }, { href: "/about", label: "About" }],
      consultation: "Request a free consultation", heroEyebrow: "Ready for your next step?",
      heroTitle: "Beyond borders, toward a brighter future",
      heroText: "From your first question to choosing a destination and preparing your application, we offer expert consultation and guidance tailored to your circumstances.",
    explore: "Explore destinations", trustTitle: "Clear guidance, thoughtful support",
    trustText: "Before any decision, we review your situation and options with you so the next step feels considered and achievable.",
    servicesTitle: "How we can help", destinationsTitle: "Popular destinations", universitiesTitle: "Selected university showcases", articlesTitle: "Guides and news", faqTitle: "Frequently asked questions", footerText: "A thoughtful partner for your international academic path.",
    viewDetails: "View details", latest: "Latest updates", readMore: "Read more", browseAll: "Browse all",
    consultationTitle: "Request a free consultation", consultationText: "Share a few details. Our team will review your request and contact you about an appropriate next step.",
    privacyNotice: "I agree to the privacy policy and to being contacted by Jahan Academy.", submit: "Submit request", sending: "Submitting…", thankYou: "Your request has been received.", trackingCode: "Tracking code", duplicate: "A similar request was already recorded. Keep this code for follow-up.", formError: "We could not submit your request. Please try again.",
  },
};

export const services = [
  { slug: "education-consultation", icon: "◌", title: { fa: "مشاوره مسیر تحصیلی", en: "Academic pathway consultation" }, summary: { fa: "بررسی هدف، پیشینه و اولویت‌های شما برای روشن‌شدن قدم بعدی.", en: "A practical review of your goals, background, and priorities." } },
  { slug: "admission-guidance", icon: "□", title: { fa: "راهنمایی پذیرش", en: "Admission guidance" }, summary: { fa: "همراهی تخصصی برای آماده‌سازی مسیر اپلای و تصمیم‌گیری آگاهانه.", en: "Expert guidance for shaping an informed application journey." } },
  { slug: "document-review", icon: "⌁", title: { fa: "بررسی مدارک", en: "Document review" }, summary: { fa: "شناخت مدارک موردنیاز و آماده‌سازی منظم برای مرحله بعد.", en: "Understand and organize the documents needed for your next step." } },
];

export const countryGuides: CountryGuide[] = [
  { slug: "canada", title: { fa: "تحصیل در کانادا", en: "Study in Canada" }, summary: { fa: "راهنمایی مقدماتی برای شناخت مسیرهای تحصیل در کانادا و آماده‌سازی گفت‌وگوی مشاوره.", en: "An introductory guide to understanding study pathways in Canada before your consultation." }, facts: { fa: [{ label: "نوع راهنما", value: "آشنایی اولیه" }, { label: "گام بعدی", value: "مشاوره تخصصی" }], en: [{ label: "Guide type", value: "Initial orientation" }, { label: "Next step", value: "Expert consultation" }] }, sections: { fa: [{ title: "از کجا شروع کنیم؟", body: "هدف تحصیلی، زمان اقدام، پیشینه تحصیلی و اولویت‌های شخصی، نقطه شروع یک مسیر دقیق هستند." }, { title: "برای مشاوره چه آماده کنیم؟", body: "اطلاعات پایه درباره آخرین مدرک، وضعیت زبان، بودجه تقریبی و زمان مدنظر، گفت‌وگو را مؤثرتر می‌کند." }], en: [{ title: "Where to begin", body: "Your academic goal, intended timeline, background, and personal priorities form the starting point for a considered path." }, { title: "What to prepare", body: "Basic details about your education, language position, approximate budget, and timing make the consultation more useful." }] } },
  { slug: "germany", title: { fa: "تحصیل در آلمان", en: "Study in Germany" }, summary: { fa: "شناخت اولیه مسیرهای تحصیل در آلمان پیش از دریافت مشاوره.", en: "A first look at studying in Germany before an expert consultation." }, facts: { fa: [{ label: "نوع راهنما", value: "آشنایی اولیه" }], en: [{ label: "Guide type", value: "Initial orientation" }] }, sections: { fa: [{ title: "مسیر مناسب شما", body: "هر مسیر بر اساس سوابق، هدف و زمان‌بندی شما بررسی می‌شود؛ یک پاسخ یکسان برای همه وجود ندارد." }], en: [{ title: "A route that fits you", body: "Each route should be considered against your background, objective, and timeline; there is no one answer for everyone." }] } },
  { slug: "italy", title: { fa: "تحصیل در ایتالیا", en: "Study in Italy" }, summary: { fa: "نقطه شروعی برای آشنایی با تحصیل در ایتالیا و پرسش‌های مهم پیش از اقدام.", en: "A starting point for understanding study in Italy and the questions to bring to a consultation." }, facts: { fa: [{ label: "نوع راهنما", value: "آشنایی اولیه" }], en: [{ label: "Guide type", value: "Initial orientation" }] }, sections: { fa: [{ title: "تصمیم آگاهانه", body: "شرایط فردی و هدف تحصیلی شما مهم‌تر از مقایسه‌های عمومی هستند." }], en: [{ title: "An informed decision", body: "Your own circumstances and academic goals matter more than broad comparisons." }] } },
];

export const fixtureUniversities: UniversityShowcase[] = [
  { slug: "university-of-toronto", name: { fa: "دانشگاه تورنتو", en: "University of Toronto" }, summary: { fa: "یک نمونه دانشگاهی برای آشنایی با نحوه ارائه اطلاعات عمومی و معتبر.", en: "A showcase example of approved, high-level university information." }, country: { fa: "کانادا", en: "Canada" }, city: { fa: "تورنتو", en: "Toronto" }, institutionType: { fa: "دانشگاه عمومی", en: "Public university" }, foundedYear: 1827, websiteUrl: "https://www.utoronto.ca/" },
  { slug: "technical-university-of-munich", name: { fa: "دانشگاه فنی مونیخ", en: "Technical University of Munich" }, summary: { fa: "یک معرفی کوتاه برای ایجاد زمینه پیش از گفت‌وگوی تخصصی با مشاور.", en: "A concise introduction that gives context before an expert conversation." }, country: { fa: "آلمان", en: "Germany" }, city: { fa: "مونیخ", en: "Munich" }, institutionType: { fa: "دانشگاه عمومی", en: "Public university" }, foundedYear: 1868, websiteUrl: "https://www.tum.de/" },
  { slug: "university-of-bologna", name: { fa: "دانشگاه بولونیا", en: "University of Bologna" }, summary: { fa: "نمونه‌ای از معرفی دانشگاه بدون ورود به اطلاعات Program یا شرایط عملیاتی.", en: "An example of a university introduction without Program or operational information." }, country: { fa: "ایتالیا", en: "Italy" }, city: { fa: "بولونیا", en: "Bologna" }, institutionType: { fa: "دانشگاه عمومی", en: "Public university" }, foundedYear: 1088, websiteUrl: "https://www.unibo.it/" },
];

export const articles = [
  { slug: "prepare-for-consultation", type: "article", title: { fa: "پیش از جلسه مشاوره چه چیزهایی آماده کنیم؟", en: "What to prepare before a consultation" }, excerpt: { fa: "چند اطلاعات ساده که گفت‌وگوی شما با مشاور را دقیق‌تر می‌کند.", en: "A few simple details that make your conversation with a consultant more useful." }, date: "2026-09-22" },
  { slug: "choosing-a-study-destination", type: "article", title: { fa: "چگونه مقصد تحصیلی را آگاهانه‌تر انتخاب کنیم؟", en: "How to choose a study destination more thoughtfully" }, excerpt: { fa: "به‌جای مقایسه‌های شتاب‌زده، پرسش‌های درست را از خودتان بپرسید.", en: "Ask better questions before relying on broad comparisons." }, date: "2026-09-20" },
  { slug: "jahan-academy-launch", type: "news", title: { fa: "رونمایی از تجربه جدید جهان آکادمی", en: "Introducing the new Jahan Academy experience" }, excerpt: { fa: "تمرکز ما بر محتوای روشن و مشاوره‌ای قابل‌اعتماد است.", en: "Our focus is clearer guidance and a more trustworthy consultation journey." }, date: "2026-09-18" },
] as const;

export const faqItems: Localized<Array<{ question: string; answer: string }>> = {
  fa: [{ question: "آیا برای ثبت درخواست مشاوره باید حساب کاربری بسازم؟", answer: "خیر. در نسخه فعلی، ثبت درخواست مشاوره بدون ساخت حساب کاربری انجام می‌شود." }, { question: "پس از ثبت درخواست چه اتفاقی می‌افتد؟", answer: "درخواست شما ثبت می‌شود و تیم جهان آکادمی برای بررسی مرحله بعد با شما تماس می‌گیرد." }, { question: "آیا اطلاعات Programها در سایت نمایش داده می‌شود؟", answer: "خیر. سایت عمومی برای آشنایی و دریافت مشاوره طراحی شده است؛ اطلاعات عملیاتی فقط در اختیار تیم داخلی قرار دارد." }],
  en: [{ question: "Do I need an account to request a consultation?", answer: "No. You can submit a consultation request without creating a public account in this release." }, { question: "What happens after I submit?", answer: "Your request is recorded and the Jahan Academy team will contact you about the next step." }, { question: "Does the website show Program information?", answer: "No. The public site is designed for orientation and consultation; operational information remains internal." }],
};
