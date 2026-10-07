import type { Locale, Localized } from "./site-content.ts";

export type Region = "all" | "europe" | "americas" | "oceania";
export const regionLabels: Record<Region, Localized<string>> = {
  all: { fa: "همه مقصدها", en: "All destinations" },
  europe: { fa: "اروپا", en: "Europe" },
  americas: { fa: "آمریکای شمالی", en: "North America" },
  oceania: { fa: "اقیانوسیه", en: "Oceania" },
};

export type DestinationOverview = {
  slug: string;
  name: Localized<string>;
  region: Exclude<Region, "all">;
  image: string;
  imageAlt: Localized<string>;
  capital: Localized<string>;
  language: Localized<string>;
  intro: Localized<string>;
  aliases?: string;
};

export const destinationOverviews: DestinationOverview[] = [
  {
    slug: "germany", name: { fa: "آلمان", en: "Germany" }, region: "europe",
    image: "/destinations/germany.png", imageAlt: { fa: "نمایی از آلمان", en: "A view of Germany" },
    capital: { fa: "برلین", en: "Berlin" }, language: { fa: "آلمانی", en: "German" },
    intro: { fa: "از انتخاب شهر دانشگاهی تا آشنایی با زبان و فضای زندگی؛ مسیر شناخت آلمان را از اینجا شروع کنید.", en: "Start exploring Germany, from university cities to the language and everyday life." },
  },
  {
    slug: "canada", name: { fa: "کانادا", en: "Canada" }, region: "americas",
    image: "/destinations/canada.png", imageAlt: { fa: "نمایی از کانادا", en: "A view of Canada" },
    capital: { fa: "اتاوا", en: "Ottawa" }, language: { fa: "انگلیسی و فرانسوی", en: "English and French" },
    intro: { fa: "با شهرها و فضای چندزبانه کانادا آشنا شوید و پرسش‌های مهم برای انتخاب مقصد خود را بشناسید.", en: "Explore Canada's cities and multilingual setting, and the questions to consider for your destination." },
  },
  {
    slug: "united-kingdom", name: { fa: "انگلستان", en: "United Kingdom" }, region: "europe", aliases: "بریتانیا انگلیس UK Britain England",
    image: "/destinations/united-kingdom.png", imageAlt: { fa: "نمایی از انگلستان", en: "A view of England" },
    capital: { fa: "لندن", en: "London" }, language: { fa: "انگلیسی", en: "English" },
    intro: { fa: "شهرهای دانشگاهی و زندگی در محیط انگلیسی‌زبان را بشناسید و برای بررسی مسیر تحصیلی خود آماده شوید.", en: "Get to know university cities and life in an English-speaking setting before exploring your study path." },
  },
  {
    slug: "italy", name: { fa: "ایتالیا", en: "Italy" }, region: "europe",
    image: "/destinations/italy-twilight.png", imageAlt: { fa: "کانال بزرگ ونیز و کلیسای سانتا ماریا دلا سالوته در غروب آبی", en: "Venice Grand Canal and Santa Maria della Salute at blue hour" },
    capital: { fa: "رم", en: "Rome" }, language: { fa: "ایتالیایی", en: "Italian" },
    intro: { fa: "تاریخ، فرهنگ و شهرهای دانشگاهی ایتالیا را کنار اولویت‌های تحصیلی و سبک زندگی خود قرار دهید.", en: "Consider Italy's history, culture and university cities alongside your academic and lifestyle priorities." },
  },
  {
    slug: "netherlands", name: { fa: "هلند", en: "Netherlands" }, region: "europe",
    image: "/destinations/netherlands.png", imageAlt: { fa: "نمایی از هلند", en: "A view of the Netherlands" },
    capital: { fa: "آمستردام", en: "Amsterdam" }, language: { fa: "هلندی", en: "Dutch" },
    intro: { fa: "با شهرها و محیط زندگی در هلند آشنا شوید؛ زبان روزمره، محل اقامت و سبک زندگی را در کنار هم بشناسید.", en: "Explore life in the Netherlands, considering everyday language, accommodation and lifestyle together." },
  },
  {
    slug: "australia", name: { fa: "استرالیا", en: "Australia" }, region: "oceania",
    image: "/destinations/australia-twilight.png", imageAlt: { fa: "نمای شهر و ساحل استرالیا", en: "City waterfront in australia" },
    capital: { fa: "کانبرا", en: "Canberra" }, language: { fa: "انگلیسی", en: "English" },
    intro: { fa: "برای شناخت استرالیا، تفاوت شهرها، فاصله از خانواده و سبک زندگی موردعلاقه‌تان را هم در نظر بگیرید.", en: "Explore Australia with your preferred city, distance from home and everyday lifestyle in mind." },
  },
  {
    slug: "sweden", name: { fa: "سوئد", en: "Sweden" }, region: "europe",
    image: "/destinations/sweden-twilight.png", imageAlt: { fa: "نمای شهر و ساحل سوئد", en: "City waterfront in sweden" },
    capital: { fa: "استکهلم", en: "Stockholm" }, language: { fa: "سوئدی", en: "Swedish" },
    intro: { fa: "نقطه شروعی برای آشنایی با سوئد؛ از محیط دانشگاهی تا آب‌وهوا و زندگی در شمال اروپا.", en: "A starting point for exploring Sweden, from university settings to climate and life in northern Europe." },
  },
  {
    slug: "finland", name: { fa: "فنلاند", en: "Finland" }, region: "europe",
    image: "/destinations/finland-twilight.png", imageAlt: { fa: "نمای شهر و ساحل فنلاند", en: "City waterfront in finland" },
    capital: { fa: "هلسینکی", en: "Helsinki" }, language: { fa: "فنلاندی و سوئدی", en: "Finnish and Swedish" },
    intro: { fa: "با فضای تحصیل و زندگی در فنلاند آشنا شوید و زبان، شهر و هدف تحصیلی را مبنای بررسی قرار دهید.", en: "Discover Finland and use your language preferences, city and academic goals to guide further research." },
  },
  {
    slug: "denmark", name: { fa: "دانمارک", en: "Denmark" }, region: "europe",
    image: "/destinations/denmark-twilight.png", imageAlt: { fa: "نمای شهر و ساحل دانمارک", en: "City waterfront in denmark" },
    capital: { fa: "کپنهاگ", en: "Copenhagen" }, language: { fa: "دانمارکی", en: "Danish" },
    intro: { fa: "دانمارک را با توجه به شهرهای دانشگاهی، زبان زندگی روزمره و انتظارات شخصی خود بیشتر بشناسید.", en: "Get to know Denmark through its university cities, everyday language and your own expectations." },
  },
  {
    slug: "new-zealand", name: { fa: "نیوزلند", en: "New Zealand" }, region: "oceania", aliases: "نیوزیلند زلاند نو NZ",
    image: "/destinations/new-zealand-twilight.png", imageAlt: { fa: "نمای شهر و ساحل نیوزلند", en: "City waterfront in new-zealand" },
    capital: { fa: "ولینگتون", en: "Wellington" }, language: { fa: "انگلیسی و مائوری", en: "English and Māori" },
    intro: { fa: "آشنایی با نیوزلند را با شناخت شهرها، محیط طبیعی و فاصله جغرافیایی آن آغاز کنید.", en: "Begin exploring New Zealand through its cities, natural surroundings and geographic distance." },
  },
];

export function normalizeDestinationSearch(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en").replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/[آأإ]/g, "ا").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[\s\u200c-]+/g, "").trim();
}

export function filterDestinations(query: string, region: Region): DestinationOverview[] {
  const term = normalizeDestinationSearch(query);
  return destinationOverviews.filter((item) => (region === "all" || item.region === region)
    && normalizeDestinationSearch(`${item.name.fa} ${item.name.en} ${item.slug} ${item.aliases ?? ""}`).includes(term));
}

export function destinationCount(count: number, locale: Locale) {
  return new Intl.NumberFormat(locale).format(count);
}
