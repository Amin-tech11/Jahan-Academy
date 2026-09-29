import type { Locale, Localized } from "./site-content";

export type HomeCopy = {
  heroServiceLink: string;
  startTitle: string;
  startText: string;
  steps: Array<{ number: string; title: string; text: string }>;
  destinationEyebrow: string;
  destinationText: string;
  serviceEyebrow: string;
  serviceText: string;
  universityEyebrow: string;
  universityText: string;
  universityNote: string;
  trustEyebrow: string;
  trustValues: Array<{ number: string; title: string; text: string }>;
  processEyebrow: string;
  processTitle: string;
  processText: string;
  articleEyebrow: string;
  articleText: string;
  faqEyebrow: string;
  faqText: string;
  closingTitle: string;
  closingText: string;
  sectionLink: string;
  destinationLabel: string;
  serviceLabel: string;
  universityLabel: string;
  articleLabel: string;
};

export const homeContent: Localized<HomeCopy> = {
  fa: {
    heroServiceLink: "آشنایی با خدمات",
    startTitle: "مسیر شما از یک گفت‌وگوی خوب شروع می‌شود",
    startText: "هدف و شرایط خود را با ما در میان بگذارید؛ تیم جهان آکادمی قدم بعدی را با شما بررسی می‌کند.",
    steps: [
      { number: "01", title: "هدفتان را بگویید", text: "مقصد، زمان و دغدغه‌های خود را در یک فرم کوتاه ثبت کنید." },
      { number: "02", title: "شرایط بررسی می‌شود", text: "درخواست به تیم داخلی می‌رسد تا گفت‌وگو با زمینهٔ بهتری آغاز شود." },
      { number: "03", title: "با شما تماس می‌گیریم", text: "برای روشن‌شدن گزینه‌ها و قدم مناسب بعدی با شما همراه می‌شویم." },
    ],
    destinationEyebrow: "DESTINATIONS / مقصدها",
    destinationText: "راهنماهای مقدماتی برای شناخت مقصدهای تحصیلی؛ تصمیم دقیق‌تر با بررسی شرایط شخصی شما شکل می‌گیرد.",
    serviceEyebrow: "OUR SERVICES / خدمات ما",
    serviceText: "از گفت‌وگوی اولیه تا آماده‌سازی مسیر اقدام، خدمات ما برای تصمیم‌گیری آگاهانه طراحی شده‌اند.",
    universityEyebrow: "UNIVERSITY SHOWCASES / دانشگاه‌ها",
    universityText: "معرفی‌های کوتاه و عمومی برای آشنایی اولیه با چند دانشگاه؛ بررسی گزینهٔ مناسب در مشاوره انجام می‌شود.",
    universityNote: "نمایش این دانشگاه‌ها به معنی همکاری یا تضمین پذیرش نیست.",
    trustEyebrow: "WHY JAHAN / رویکرد ما",
    trustValues: [
      { number: "01", title: "گفت‌وگوی متناسب با شما", text: "ابتدا هدف، پیشینه و اولویت‌های شما را می‌شنویم؛ مسیر هر فرد می‌تواند متفاوت باشد." },
      { number: "02", title: "اطلاعات روشن و قابل بررسی", text: "محتوای عمومی برای آشنایی است و پرسش‌های دقیق در گفت‌وگو با مشاور بررسی می‌شوند." },
      { number: "03", title: "همراهی در قدم بعدی", text: "پس از ثبت درخواست، یک کد پیگیری دریافت می‌کنید و تیم ما برای ادامهٔ گفت‌وگو تماس می‌گیرد." },
    ],
    processEyebrow: "THE JOURNEY / مسیر همکاری",
    processTitle: "از سؤال‌های امروز تا تصمیم‌های فردا",
    processText: "پیش از انتخاب دانشگاه یا برنامهٔ تحصیلی، یک تصویر روشن از هدف، زمان‌بندی و محدودیت‌های خود بسازید.",
    articleEyebrow: "INSIGHTS / راهنماها",
    articleText: "مطالبی برای بهتر پرسیدن، بهتر سنجیدن و آماده‌تر شدن پیش از مشاوره.",
    faqEyebrow: "FAQ / پرسش‌های پرتکرار",
    faqText: "چند پاسخ کوتاه به پرسش‌هایی که معمولاً پیش از ثبت درخواست مطرح می‌شوند.",
    closingTitle: "برای قدم اول آماده‌اید؟",
    closingText: "با یک درخواست کوتاه شروع کنید. تیم ما شرایط شما را بررسی می‌کند و برای ادامهٔ مسیر با شما تماس می‌گیرد.",
    sectionLink: "مشاهده همه",
    destinationLabel: "راهنمای مقصد",
    serviceLabel: "خدمت ما",
    universityLabel: "معرفی دانشگاه",
    articleLabel: "مطلب خواندنی",
  },
  en: {
    heroServiceLink: "Explore our services",
    startTitle: "Your journey starts with a useful conversation",
    startText: "Tell us about your goals and circumstances. Our team will help you consider the next step.",
    steps: [
      { number: "01", title: "Share your goal", text: "Tell us your destination, timing, and questions in a short form." },
      { number: "02", title: "We review your context", text: "Your request reaches our team so the conversation begins with a clearer picture." },
      { number: "03", title: "We get in touch", text: "We help clarify your options and a considered next step." },
    ],
    destinationEyebrow: "DESTINATIONS",
    destinationText: "Introductory guides to study destinations. Better decisions begin with your individual circumstances.",
    serviceEyebrow: "OUR SERVICES",
    serviceText: "From the first conversation to preparing your next action, our services support informed decisions.",
    universityEyebrow: "UNIVERSITY SHOWCASES",
    universityText: "Concise public introductions to selected universities. We discuss individual fit during consultation.",
    universityNote: "A university appearing here does not imply partnership or guarantee admission.",
    trustEyebrow: "WHY JAHAN",
    trustValues: [
      { number: "01", title: "A conversation about you", text: "We begin with your goals, background, and priorities because every path is different." },
      { number: "02", title: "Clear, reviewable information", text: "Public content helps you get oriented; detailed questions are discussed with a consultant." },
      { number: "03", title: "Support for the next step", text: "After submitting, you receive a tracking code and our team contacts you to continue." },
    ],
    processEyebrow: "THE JOURNEY",
    processTitle: "From today's questions to tomorrow's decisions",
    processText: "Before choosing a university or academic route, build a clearer picture of your goals, timing, and constraints.",
    articleEyebrow: "INSIGHTS",
    articleText: "Useful reading to ask better questions and arrive better prepared for a consultation.",
    faqEyebrow: "FREQUENTLY ASKED QUESTIONS",
    faqText: "Short answers to questions people often ask before submitting a request.",
    closingTitle: "Ready to take the first step?",
    closingText: "Begin with a short request. Our team will review your circumstances and contact you about what comes next.",
    sectionLink: "View all",
    destinationLabel: "Destination guide",
    serviceLabel: "Our service",
    universityLabel: "University showcase",
    articleLabel: "Guide and insight",
  },
};

export function getHomeContent(locale: Locale): HomeCopy {
  return homeContent[locale];
}
