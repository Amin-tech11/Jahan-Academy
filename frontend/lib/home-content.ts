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
  trustSubtitle: string;
  trustText: string;
  trustCta: string;
  trustImageCaption: string;
  trustValues: Array<{ number: string; title: string; text: string }>;
  processTitle: string;
  processSteps: Array<{ number: string; title: string; text: string }>;
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
      { number: "02", title: "شرایط بررسی می‌شود", text: "درخواست به تیم داخلی می‌رسد تا گفت‌وگو با زمینه بهتری آغاز شود." },
      { number: "03", title: "با شما تماس می‌گیریم", text: "برای روشن‌شدن گزینه‌ها و قدم مناسب بعدی با شما همراه می‌شویم." },
    ],
    destinationEyebrow: "DESTINATIONS / مقصدها",
    destinationText: "راهنماهای مقدماتی برای شناخت مقصدهای تحصیلی؛ تصمیم دقیق‌تر با بررسی شرایط شخصی شما شکل می‌گیرد.",
    serviceEyebrow: "OUR SERVICES / خدمات ما",
    serviceText: "از گفت‌وگوی اولیه تا آماده‌سازی مسیر اقدام، خدمات ما برای تصمیم‌گیری آگاهانه طراحی شده‌اند.",
    universityEyebrow: "UNIVERSITY SHOWCASES / دانشگاه‌ها",
    universityText: "معرفی‌های کوتاه و عمومی برای آشنایی اولیه با چند دانشگاه؛ بررسی گزینه مناسب در مشاوره انجام می‌شود.",
    universityNote: "نمایش این دانشگاه‌ها به معنی همکاری یا تضمین پذیرش نیست.",
    trustSubtitle: "با اطمینان، در مسیر یک آینده بین‌المللی",
    trustText: "ما در جهان آکادمی، با تکیه بر تجربه، صداقت و شناخت عمیق از نظام آموزش بین‌المللی، در کنار شما هستیم تا بهترین مسیر را برای ادامه تحصیل پیدا کنید.",
    trustCta: "دریافت مشاوره رایگان",
    trustImageCaption: "آینده\nاز اینجا\nشروع می‌شود",
    trustValues: [
      { number: "01", title: "شفافیت و صداقت", text: "اطلاعات دقیق، مشاوره واقع‌گرایانه و احترام به تصمیم‌های شما، اصول همیشگی ماست." },
      { number: "02", title: "تخصص با نگاه انسانی", text: "تیم مشاوران باتجربه ما، با درک شرایط شما، راهکارهای شخصی‌سازی‌شده ارائه می‌دهد." },
      { number: "03", title: "همراهی در مسیر رشد", text: "تنها در مسیر اپلای نیستید؛ ما در تمام مراحل کنار شما خواهیم بود." },
    ],
    processTitle: "مسیر همراهی شما با جهان آکادمی",
    processSteps: [
      { number: "01", title: "ثبت درخواست مشاوره", text: "با تکمیل فرم مشاوره، هدف تحصیلی و شرایط اولیه خود را با ما در میان بگذارید." },
      { number: "02", title: "برگزاری جلسه مشاوره", text: "در یک گفت‌وگوی تخصصی، اهداف، سوابق و پرسش‌های شما را بررسی می‌کنیم تا مسیر روشن‌تری پیش رو داشته باشید." },
      { number: "03", title: "توافق و عقد قرارداد", text: "پس از مشخص‌شدن مسیر، خدمات، تعهدات و شرایط همکاری را شفاف توضیح می‌دهیم و قرارداد را تنظیم می‌کنیم." },
      { number: "04", title: "ارائه چک‌لیست مدارک", text: "فهرست مدارک موردنیاز برای پرونده تحصیلی را در اختیارتان قرار می‌دهیم و برای آماده‌سازی آن‌ها راهنمایی‌تان می‌کنیم." },
      { number: "05", title: "انتخاب دانشگاه و رشته", text: "با توجه به سوابق تحصیلی، سطح زبان، بودجه و اولویت‌های شما، دانشگاه‌ها و رشته‌های مناسب را بررسی و انتخاب می‌کنیم." },
      { number: "06", title: "نگارش مدارک اپلای", text: "رزومه، انگیزه‌نامه و توصیه‌نامه‌ها را متناسب با سوابق واقعی شما و الزامات دانشگاه آماده و ویرایش می‌کنیم." },
      { number: "07", title: "ثبت درخواست پذیرش", text: "پرونده و مدارک آماده‌شده را بررسی می‌کنیم و درخواست پذیرش را برای دانشگاه‌های انتخاب‌شده ثبت می‌کنیم." },
      { number: "08", title: "پیگیری درخواست دانشگاه", text: "وضعیت بررسی پرونده را پیگیری می‌کنیم و در صورت نیاز به مدارک یا توضیحات تکمیلی، شما را در جریان می‌گذاریم." },
      { number: "09", title: "دریافت نتیجه دانشگاه", text: "نتیجه دانشگاه را با شما مرور می‌کنیم و شرایط اعلام‌شده و اقدامات بعدی را توضیح می‌دهیم." },
      { number: "10", title: "چک‌لیست مدارک و جلسه ویزا", text: "در جلسه راهنمایی ویزا، مراحل اقدام و فهرست مدارک موردنیاز را متناسب با مقصد و شرایط شما بررسی می‌کنیم." },
      { number: "11", title: "دریافت و بررسی مدارک ویزا", text: "مدارک آماده‌شده شما را دریافت و بررسی می‌کنیم تا موارد ناقص یا نیازمند اصلاح پیش از ثبت درخواست مشخص شوند." },
      { number: "12", title: "ثبت درخواست ویزا و انگشت‌نگاری", text: "برای ثبت درخواست ویزا و هماهنگی مراحل انگشت‌نگاری، مطابق فرایند کشور مقصد، همراه و راهنمای شما هستیم." },
      { number: "13", title: "پیگیری و دریافت نتیجه ویزا", text: "وضعیت درخواست ویزا را پیگیری می‌کنیم و پس از اعلام نتیجه، آن را همراه با راهنمایی درباره گام بعدی با شما در میان می‌گذاریم." },
    ],
    articleEyebrow: "INSIGHTS / راهنماها",
    articleText: "مطالبی برای بهتر پرسیدن، بهتر سنجیدن و آماده‌تر شدن پیش از مشاوره.",
    faqEyebrow: "FAQ / پرسش‌های پرتکرار",
    faqText: "پاسخ‌هایی برای شناخت رویکرد ما و آماده‌شدن برای نخستین گفت‌وگو.",
    closingTitle: "برای قدم اول آماده‌اید؟",
    closingText: "با یک درخواست کوتاه شروع کنید. تیم ما شرایط شما را بررسی می‌کند و برای ادامه مسیر با شما تماس می‌گیرد.",
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
    trustSubtitle: "Move confidently toward an international future",
    trustText: "At Jahan Academy, experience, honesty and a deep understanding of international education guide how we help you find the right path for your further studies.",
    trustCta: "Get a free consultation",
    trustImageCaption: "A Brighter\nTomorrow\nTogether",
    trustValues: [
      { number: "01", title: "Honesty and clarity", text: "Accurate information, realistic advice and respect for your decisions are at the heart of our work." },
      { number: "02", title: "Expertise with a human view", text: "Our experienced advisors understand your circumstances and offer guidance tailored to you." },
      { number: "03", title: "Support for growth", text: "You are not alone in the application process. We are here to support you at every stage." },
    ],
    processTitle: "Your journey with Jahan Academy",
    processSteps: [
      { number: "01", title: "Request a consultation", text: "Complete the consultation form to share your study goals and initial circumstances with our team." },
      { number: "02", title: "Meet your advisor", text: "We discuss your goals, background, and questions in a dedicated consultation to help clarify your path." },
      { number: "03", title: "Agree on the partnership", text: "Once the approach is clear, we explain the services, responsibilities, and terms of our collaboration and prepare the agreement." },
      { number: "04", title: "Receive your document checklist", text: "We provide a checklist for your academic application and guide you through preparing the required documents." },
      { number: "05", title: "Choose universities and programs", text: "We review suitable universities and programs based on your academic background, language level, budget, and priorities." },
      { number: "06", title: "Prepare application documents", text: "We prepare and edit your CV, statement of purpose, and recommendation letters using your actual background and university requirements." },
      { number: "07", title: "Submit university applications", text: "We review the completed application and documents, then submit them to the universities you have selected." },
      { number: "08", title: "Follow up with universities", text: "We track your application and keep you informed if a university requests additional documents or clarification." },
      { number: "09", title: "Review university decisions", text: "We review the university decision with you and explain any conditions and the next steps." },
      { number: "10", title: "Plan your visa application", text: "In a visa guidance session, we review the process and document checklist for your destination and circumstances." },
      { number: "11", title: "Review your visa documents", text: "We receive and review your prepared documents to identify missing items or corrections before submission." },
      { number: "12", title: "Apply for a visa and biometrics", text: "We guide you through the visa application and biometric appointment process required by your destination." },
      { number: "13", title: "Receive your visa decision", text: "We follow the status of your visa application and share the decision with guidance on your next step." },
    ],
    articleEyebrow: "INSIGHTS",
    articleText: "Useful reading to ask better questions and arrive better prepared for a consultation.",
    faqEyebrow: "FREQUENTLY ASKED QUESTIONS",
    faqText: "Answers to help you understand our approach and prepare for your first conversation.",
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
