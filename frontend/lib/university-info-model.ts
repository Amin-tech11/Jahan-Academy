import type { HomeUniversity } from "./home-universities";
import type { Locale, UniversityShowcase } from "./site-content";

export type UniversityPhoto = { src: string; caption: Record<Locale, string> };
export type UniversityFeature = { title: Record<Locale, string>; text: Record<Locale, string>; url: string };
export type UniversityInfo = UniversityShowcase & {
  englishName: string;
  location: Record<Locale, string>;
  logo?: string;
  photos: UniversityPhoto[];
  about: Record<Locale, string>;
  features: UniversityFeature[];
  address?: string;
  dli?: string;
  sources: { label: string; url: string }[];
};

// Public content URLs must never become executable links.
export function safeUniversityUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function universityInfoPath(locale: Locale, slug: string) {
  return `/${locale}/universities/${encodeURIComponent(slug)}`;
}

export function fromCatalog(university: HomeUniversity, country: Record<Locale, string>): UniversityInfo {
  return {
    slug: university.slug,
    name: { fa: university.name, en: university.name },
    englishName: university.name,
    summary: university.summary,
    about: university.summary,
    country,
    location: { fa: university.location, en: university.location },
    logo: university.logo,
    photos: [{ src: university.image, caption: { fa: `پردیس ${university.name}`, en: `${university.name} campus` } }],
    features: [],
    sources: [],
  };
}

export function fromPublicUniversity(university: UniversityShowcase): UniversityInfo {
  const websiteUrl = safeUniversityUrl(university.websiteUrl);
  return {
    ...university,
    websiteUrl,
    englishName: university.name.en,
    location: {
      fa: [university.city?.fa, university.country.fa].filter(Boolean).join("، "),
      en: [university.city?.en, university.country.en].filter(Boolean).join(", "),
    },
    about: university.summary,
    photos: [],
    features: [],
    sources: websiteUrl ? [{ label: new URL(websiteUrl).hostname, url: websiteUrl }] : [],
  };
}

export const westernUniversity: UniversityInfo = {
  slug: "western-university",
  name: { fa: "دانشگاه وسترن", en: "Western University" },
  englishName: "Western University",
  country: { fa: "کانادا", en: "Canada" },
  city: { fa: "لندن، انتاریو", en: "London, Ontario" },
  location: { fa: "لندن، انتاریو، کانادا", en: "London, Ontario, Canada" },
  institutionType: { fa: "دانشگاه دولتی", en: "Public university" },
  foundedYear: 1878,
  dli: "O19375892122",
  address: "1151 Richmond Street, London, Ontario, Canada",
  websiteUrl: "https://www.uwo.ca/",
  logo: "/university-info/western-logo.png",
  summary: {
    fa: "آموزش و پژوهش در قلب یک پردیس سرسبز؛ آشنایی با دانشگاه وسترن در شهر لندنِ کانادا.",
    en: "Discover Western: a research university set in a green campus in London, Ontario.",
  },
  about: {
    fa: "دانشگاه وسترن در سال ۱۸۷۸ در لندنِ انتاریو تأسیس شد. پردیس این دانشگاه در کنار رودخانه تیمز، ترکیبی از ساختمان‌های تاریخی، فضاهای آموزشی معاصر و محوطه‌های سبز است. زندگی در وسترن با کتابخانه‌ها، اقامتگاه‌های دانشجویی و فعالیت‌های اجتماعی درون پردیس پیوند دارد.",
    en: "Founded in 1878 in London, Ontario, Western brings teaching and research together on a campus beside the Thames River. Historic buildings sit alongside contemporary learning spaces and green courtyards. Libraries, residences and campus activities form part of everyday university life.",
  },
  photos: [
    { src: "/university-info/western-campus.webp", caption: { fa: "پاییز در پردیس وسترن", en: "Autumn on Western's campus" } },
    { src: "/university-info/western-gardens.webp", caption: { fa: "باغ‌ها و فضای سبز پردیس", en: "Gardens and campus green spaces" } },
    { src: "/university-info/western-students.webp", caption: { fa: "زندگی دانشجویی در وسترن", en: "Student life at Western" } },
    { src: "/university-info/western-ivey.webp", caption: { fa: "ساختمان آیوی در پردیس وسترن", en: "The Ivey building at Western" } },
  ],
  features: [
    { title: { fa: "پردیس سبز و معماری تاریخی", en: "A green, historic campus" }, text: { fa: "محوطه‌های باز و ساختمان‌های تاریخی و مدرن در کنار یکدیگر قرار دارند.", en: "Open green spaces connect historic and modern university buildings." }, url: "https://www.uwo.ca/about/visit/index.html" },
    { title: { fa: "اقامتگاه‌های دانشجویی", en: "Campus residences" }, text: { fa: "گزینه‌های مختلف اقامت در پردیس؛ جزئیات هر ساختمان در وب‌سایت رسمی دانشگاه قابل بررسی است.", en: "Explore different residence buildings and living arrangements on Western's official website." }, url: "https://residence.uwo.ca/buildings" },
    { title: { fa: "کتابخانه‌ها و فضاهای مطالعه", en: "Libraries and study spaces" }, text: { fa: "کتابخانه‌های دانشگاه فضایی برای مطالعه و دسترسی به منابع پژوهشی فراهم می‌کنند.", en: "University libraries provide places to study and access research collections." }, url: "https://www.lib.uwo.ca/contact/libraries/index.html" },
  ],
  sources: [
    { label: "Western University", url: "https://www.uwo.ca/about/visit/index.html" },
    { label: "ApplyBoard", url: "https://www.applyboard.com/schools/western-university" },
  ],
};
