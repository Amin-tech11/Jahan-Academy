import type { Locale } from "./site-content";

type SeoCopy = { title?: string; description: string };
// Search snippets are edited separately from visible headings and introductory copy.
export const seoCopy: Record<string, Partial<Record<Locale, SeoCopy>>> = {
  "": {
    fa: { description: "با جهان آکادمی مقصد و دانشگاه مناسب خود را پیدا کنید؛ خدمات مشاوره تحصیلی، بررسی مدارک و راهنمای برنامه‌ریزی برای پذیرش و تحصیل در خارج." },
    en: { description: "Explore study destinations and universities with Jahan Academy. Get advice on course choices, application documents and planning your study abroad journey." },
  },
  "/consultation": {
    fa: { description: "برای انتخاب کشور، دانشگاه و مسیر پذیرش با مشاوران جهان آکادمی گفت‌وگو کنید؛ با ثبت اطلاعات تحصیلی و هدف خود، درخواست مشاوره را شروع کنید." },
    en: { description: "Discuss your study goals, destination choices and application plans with Jahan Academy. Share your academic background to request a consultation." },
  },
  "/privacy": {
    fa: { description: "سیاست حریم خصوصی جهان آکادمی را بخوانید؛ با نحوه استفاده از اطلاعات فرم‌ها، نگهداری داده‌ها و راه ارتباط برای درخواست‌های حریم خصوصی آشنا شوید." },
    en: { description: "Read Jahan Academy's privacy policy to understand how form details are used, how personal data is handled and how to contact us about privacy requests." },
  },
  "/universities": {
    fa: { description: "دانشگاه‌های مقصدهای تحصیلی را بررسی و مقایسه کنید؛ با جست‌وجوی نام دانشگاه و مشاهده معرفی هر مرکز، گزینه‌های مناسب برای ادامه تحصیل را بشناسید." },
    en: { description: "Browse universities across study destinations, search by name and explore individual profiles to compare institutions for your international study plans." },
  },
  "/about": {
    en: { description: "Meet Jahan Academy and learn how our team supports students with destination choices, university applications and planning an international study journey." },
  },
  "/universities/dalhousie-university": {
    en: { description: "Explore Dalhousie University in Halifax, Canada: discover its academic profile, student life and key information to help plan your university application." },
  },
  "/universities/charite-universitatsmedizin-berlin": {
    en: { description: "Explore Charité in Berlin, Germany: learn about its medical education, research profile and student environment as you consider your study options." },
  },
  "/universities/australian-national-university": {
    en: { description: "Explore the Australian National University in Canberra: discover its academic profile, research and student life to help plan your study in Australia." },
  },
  "/services/education-consultation": {
    fa: { description: "با مشاوره مسیر تحصیلی جهان آکادمی، هدف، سوابق، بودجه و زمان اقدام خود را بررسی کنید؛ با مدارک موردنیاز جلسه و روند انتخاب گام بعدی آشنا شوید." },
    en: { description: "Review your study goals, academic background, budget and timeline with Jahan Academy. Learn what to prepare for a consultation and how to plan your next step." },
  },
  "/services/document-review": {
    fa: { description: "با خدمت بررسی مدارک جهان آکادمی آشنا شوید؛ رزومه، انگیزه‌نامه و مدارک پرونده را با الزامات مقصد مقایسه کنید و محدوده بازبینی و روند کار را بشناسید." },
    en: { description: "Explore Jahan Academy's document review service for CVs, statements of purpose and application files. Learn what to prepare and how the review process works." },
  },
  "/universities/adelaide-university": {
    fa: { description: "دانشگاه آدلاید در استرالیای جنوبی را بشناسید؛ معرفی پردیس‌های شهری و منطقه‌ای، حوزه‌های آموزشی و فضای زندگی دانشجویی برای بررسی گزینه تحصیل." },
    en: { description: "Explore Adelaide University in South Australia: discover its metropolitan and regional campuses, academic areas and student life as you compare study options." },
  },
  "/universities/catholic-university-of-the-sacred-heart": {
    en: { description: "Discover the Catholic University of the Sacred Heart in Italy: explore its campuses, academic areas and student settings to compare your study options." },
  },
  "/universities/chalmers-university-of-technology": {
    en: { description: "Explore Chalmers University of Technology in Gothenburg: discover its campus environment and focus on engineering, science, technology and architecture." },
  },
  "/universities/delft-university-of-technology": {
    en: { description: "Discover Delft University of Technology in the Netherlands: explore its academic profile, campus facilities and student environment as you plan your studies." },
  },
  "/universities/durham-university": {
    en: { description: "Explore Durham University in the United Kingdom: learn about its academic profile, campus setting and student life to help compare your university options." },
  },
  "/universities/karolinska-institute": {
    fa: { description: "مؤسسه کارولینسکا در سوئد را بشناسید؛ معرفی پردیس‌های سولنا و فلمینگزبرگ، آموزش پزشکی و سلامت، پژوهش زیست‌پزشکی و محیط زندگی دانشجویی." },
    en: { description: "Explore Karolinska Institutet in Sweden: discover its Solna and Flemingsberg campuses, medical and health education, biomedical research and student life." },
  },
  "/universities/kth-royal-institute-of-technology": {
    fa: { description: "با مؤسسه سلطنتی فناوری KTH در استکهلم آشنا شوید؛ محیط پردیس، زندگی دانشجویی و حوزه‌های مهندسی، کامپیوتر، علوم طبیعی و معماری را بررسی کنید." },
    en: { description: "Discover KTH Royal Institute of Technology in Stockholm: explore campus life and academic focus on engineering, computing, natural sciences and architecture." },
  },
  "/universities/polytechnic-university-of-milan": {
    en: { description: "Explore Politecnico di Milano in Italy: discover the Leonardo and Bovisa campuses and its academic focus on engineering, architecture and design." },
  },
  "/universities/polytechnic-university-of-turin": {
    en: { description: "Discover Politecnico di Torino in Italy: explore its engineering, architecture and design profile, campus settings and student life in Turin." },
  },
  "/universities/tampere-university": {
    en: { description: "Explore Tampere University in Finland: discover its academic profile, campus environment and student life to help compare your international study options." },
  },
  "/universities/the-university-of-auckland": {
    fa: { description: "دانشگاه اوکلند در نیوزیلند را بشناسید؛ معرفی پردیس شهری نزدیک آلبرت پارک، حوزه‌های علوم، مهندسی، مدیریت و سلامت و فضای زندگی دانشجویی." },
    en: { description: "Explore the University of Auckland in New Zealand: discover its City Campus near Albert Park, academic areas and student life as you compare study options." },
  },
  "/universities/university-of-otago": {
    en: { description: "Discover the University of Otago in Dunedin, New Zealand: explore its campus, student life and academic areas spanning health, science, humanities and business." },
  },
};

const countryDescriptions: Record<string, Record<Locale, string>> = {
  canada: {
    fa: "راهنمای تحصیل در کانادا؛ دانشگاه‌ها، زبان دوره‌ها، هزینه زندگی و شهریه، مدارک پذیرش و مسیر مجوز تحصیل را برای برنامه‌ریزی و انتخاب مقصد بررسی کنید.",
    en: "Plan your studies in Canada: explore universities, English and French programmes, tuition, living costs and the documents needed for your study pathway.",
  },
  germany: {
    fa: "برای تحصیل در آلمان، دانشگاه‌های پژوهشی و علوم کاربردی، زبان دوره، شهریه و سهم ترمی، هزینه زندگی و مراحل پذیرش و اقامت تحصیلی را بررسی کنید.",
    en: "Explore study in Germany: compare research and applied sciences universities, course languages, tuition, semester contributions and student living costs.",
  },
  "united-kingdom": {
    fa: "تحصیل در بریتانیا را با بررسی ساختار دوره‌ها، دانشگاه‌ها، شهریه و هزینه زندگی آغاز کنید؛ راهنمای پذیرش، مدارک و برنامه‌ریزی سفر تحصیلی را بخوانید.",
    en: "Explore study in the United Kingdom: compare universities, course structures, tuition and living costs, then review admission and student visa planning.",
  },
  italy: {
    fa: "راهنمای تحصیل در ایتالیا؛ با دانشگاه‌ها، زبان دوره‌ها، شهریه، هزینه زندگی دانشجویی و مراحل آماده‌سازی مدارک پذیرش و ویزای تحصیلی آشنا شوید.",
    en: "Discover study options in Italy, from universities and course languages to tuition and student living costs, with guidance on admission and visa planning.",
  },
  netherlands: {
    fa: "برای تحصیل در هلند، دانشگاه‌ها، زبان آموزش، هزینه دوره و زندگی دانشجویی را مقایسه کنید و با مدارک پذیرش و مسیر اقامت تحصیلی آشنا شوید.",
    en: "Plan your studies in the Netherlands: explore universities, course languages, tuition, student housing and the steps involved in admission and residence.",
  },
  australia: {
    fa: "راهنمای تحصیل در استرالیا؛ دانشگاه‌ها، شهریه، بودجه زندگی و فضای دانشجویی را بشناسید و مراحل پذیرش و آماده‌سازی مدارک ویزای تحصیلی را بررسی کنید.",
    en: "Explore study in Australia: discover universities and student life, compare tuition and living costs, and review admission documents and visa planning.",
  },
  sweden: {
    fa: "تحصیل در سوئد را با شناخت دانشگاه‌ها و زبان دوره‌ها برنامه‌ریزی کنید؛ شهریه، زندگی دانشجویی و مدارک لازم برای پذیرش و اقامت تحصیلی را بررسی کنید.",
    en: "Discover study in Sweden: explore universities, course languages and student life, then review tuition, living costs and admission and residence planning.",
  },
  finland: {
    fa: "برای تحصیل در فنلاند، گزینه‌های دانشگاهی، زبان دوره‌ها و زندگی دانشجویی را بشناسید؛ هزینه‌ها و مراحل پذیرش و اقامت را پیش از انتخاب بررسی کنید.",
    en: "Explore study in Finland: learn about university options, course languages and student life, with guidance on costs, admission and residence planning.",
  },
  denmark: {
    fa: "راهنمای تحصیل در دانمارک؛ دانشگاه‌ها، زبان آموزش و زندگی دانشجویی را بررسی کنید و برای هزینه‌های تحصیل، مدارک پذیرش و اقامت برنامه‌ریزی کنید.",
    en: "Plan your studies in Denmark: explore universities, teaching languages and student life, and review study costs, application documents and residence steps.",
  },
  "new-zealand": {
    fa: "برای تحصیل در نیوزیلند، دانشگاه‌ها، محیط دانشجویی، شهریه و هزینه زندگی را بشناسید؛ مدارک پذیرش و مراحل برنامه‌ریزی ویزای تحصیلی را بررسی کنید.",
    en: "Discover study in New Zealand: explore universities and student life, compare tuition and living costs, and plan your admission documents and student visa.",
  },
};

export function getSeoCopy(locale: Locale, path: string): SeoCopy | undefined {
  const country = path.startsWith("/countries/") ? countryDescriptions[path.slice("/countries/".length)] : undefined;
  return country ? { description: country[locale] } : seoCopy[path]?.[locale];
}

// Describe the public page's actual scope; avoid dates and unsupported rankings.
const titles: Record<string, Record<Locale, string>> = {
  "": {
    fa: "مشاوره تحصیل در خارج و پذیرش دانشگاه | جهان آکادمی",
    en: "Study Abroad Advice & Applications | Jahan Academy",
  },
  "/about": {
    fa: "درباره جهان آکادمی؛ مشاوره تحصیل در خارج",
    en: "About Jahan Academy | Study Abroad Guidance",
  },
  "/countries": {
    fa: "مقایسه کشورها برای تحصیل در خارج | جهان آکادمی",
    en: "Compare Study Abroad Destinations | Jahan Academy",
  },
  "/universities": {
    fa: "معرفی دانشگاه‌های خارج از کشور | جهان آکادمی",
    en: "Explore Universities Abroad | Jahan Academy",
  },
  "/services": {
    fa: "خدمات اپلای و مشاوره تحصیلی | جهان آکادمی",
    en: "Study Abroad & Application Services | Jahan Academy",
  },
  "/services/education-consultation": {
    fa: "مشاوره تحصیل در خارج؛ انتخاب مسیر | جهان آکادمی",
    en: "Study Abroad Consultation | Jahan Academy",
  },
  "/services/document-review": {
    fa: "بررسی رزومه و انگیزه‌نامه اپلای | جهان آکادمی",
    en: "CV & Statement of Purpose Review | Jahan Academy",
  },
  "/consultation": {
    fa: "فرم ارزیابی تحصیلی برای اپلای | جهان آکادمی",
    en: "Study Abroad Assessment Form | Jahan Academy",
  },
  "/free-consultation": {
    fa: "درخواست مشاوره رایگان تحصیل در خارج | جهان آکادمی",
    en: "Free Study Abroad Consultation | Jahan Academy",
  },
  "/articles": {
    fa: "راهنماهای تحصیل در خارج | مجله جهان آکادمی",
    en: "Study Abroad Guides | Jahan Academy Journal",
  },
  "/privacy": {
    fa: "سیاست حریم خصوصی | جهان آکادمی",
    en: "Privacy Policy | Jahan Academy",
  },
  "/guides/germany-study-residence-guide": {
    fa: "تحصیل در آلمان؛ شهریه، تمکن و اقامت | جهان آکادمی",
    en: "Study in Germany: Tuition & Residence Guide | Jahan Academy",
  },
  "/guides/netherlands-study-residence-guide": {
    fa: "تحصیل در هلند؛ پذیرش و اقامت دانشجویی | جهان آکادمی",
    en: "Study in the Netherlands: Admission & Residence | Jahan Academy",
  },
  "/guides/uk-study-visa-guide": {
    fa: "ویزای تحصیلی انگلستان؛ پذیرش و تمکن مالی | جهان آکادمی",
    en: "UK Study & Student Visa Guide | Jahan Academy",
  },
  "/guides/italy-study-guide": {
    fa: "تحصیل در ایتالیا؛ رشته‌ها، هزینه‌ها و بورسیه | جهان آکادمی",
    en: "Study in Italy: Courses, Costs & Scholarships | Jahan Academy",
  },
  "/guides/austria-study-guide": {
    fa: "تحصیل در اتریش؛ مقاطع و شرایط پذیرش | جهان آکادمی",
    en: "Study in Austria: Degrees & Admission Guide | Jahan Academy",
  },
};

export function pageTitle(locale: Locale, path: string, fallback: string): string {
  return titles[path]?.[locale] ?? fallback;
}

export function countryTitle(locale: Locale, name: string): string {
  if (locale === "fa") return `تحصیل در ${name}؛ دانشگاه‌ها و هزینه‌ها | جهان آکادمی`;
  const country = name === "Netherlands" ? "the Netherlands" : name === "United Kingdom" ? "the UK" : name;
  return `Study in ${country}: Universities & Costs | Jahan Academy`;
}

export function universityTitle(locale: Locale, name: string, slug: string): string {
  const computerScience = slug === "mcgill-university" || slug === "dalhousie-university";
  return locale === "fa"
    ? `${name}؛ ${computerScience ? "پذیرش علوم کامپیوتر" : "معرفی و رشته‌ها"} | جهان آکادمی`
    : `${name}: ${computerScience ? "Computer Science Admissions" : "Profile"} | Jahan Academy`;
}
