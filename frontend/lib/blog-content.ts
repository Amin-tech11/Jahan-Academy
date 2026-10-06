import type { Locale, Localized } from "./site-content";

export type BlogPost = {
  slug: string;
  type: "article" | "news" | "guide";
  title: Localized<string>;
  excerpt: Localized<string>;
  date: string;
};
export type BlogFilter = "all" | BlogPost["type"];
export type BlogSort = "newest" | "oldest";

export function normalizeSearch(value: string) {
  return value.normalize("NFKC").replace(/ي/g, "ی").replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[\u200c\u200d\s]+/g, " ").trim().toLocaleLowerCase();
}

export function selectBlogPosts(posts: readonly BlogPost[], locale: Locale, options: {
  type?: BlogFilter; sort?: BlogSort; query?: string; now?: number;
} = {}) {
  const query = normalizeSearch(options.query ?? "");
  const now = options.now ?? Date.now();
  return posts.filter((post) => {
    const published = Date.parse(post.date);
    return Number.isFinite(published) && published <= now
      && (!options.type || options.type === "all" || post.type === options.type)
      && (!query || normalizeSearch(`${post.title[locale]} ${post.excerpt[locale]}`).includes(query));
  }).sort((a, b) => (options.sort === "oldest" ? 1 : -1) * (Date.parse(a.date) - Date.parse(b.date)) || a.slug.localeCompare(b.slug));
}

export function blogDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(date));
}

export function blogHref(post: BlogPost, locale: Locale) {
  return `/${locale}/${post.type === "news" ? "news" : post.type === "guide" ? "guides" : "articles"}/${encodeURIComponent(post.slug)}`;
}

export const blogCopy = {
  fa: {
    title: "مجله جهان آکادمی", eyebrow: "بخوانید، آگاه شوید، قدم بعدی را بردارید",
    intro: "مقالات، راهنماها و تازه‌های جهان آکادمی؛ همراه شما در مسیر یک انتخاب آگاهانه.",
    home: "صفحه اصلی", featured: "برای شروع بخوانید", latest: "تازه‌ترین مطالب", all: "همه مطالب",
    article: "مقالات", news: "اخبار", guide: "راهنماها", search: "جست‌وجو در مطالب", placeholder: "درباره چه موضوعی می‌خواهید بخوانید؟",
    sort: "ترتیب انتشار", newest: "جدیدترین", oldest: "قدیمی‌ترین", results: "مطلب", read: "مطالعه مطلب",
    empty: "مطلبی با این مشخصات پیدا نشد", emptyHint: "عبارت دیگری جست‌وجو کنید یا فیلترها را پاک کنید.",
    reset: "نمایش همه مطالب", published: "تاریخ انتشار", guides: "از آگاهی تا انتخاب", guideText: "مسیر تحصیلی هر فرد متفاوت است. با شناخت شرایط خود، پرسش‌های دقیق‌تری بپرسید.",
    consultation: "دریافت مشاوره", note: "مطالب این پیش‌نمایش، محتوای نمونهٔ سایت هستند.",
    previous: "صفحه قبل", next: "صفحه بعد", page: "صفحه", of: "از", archive: "مقالات، اخبار و راهنماها", back: "بازگشت به مجله",
    faq: "پرسش‌های متداول", help: "مشاوره مسیر تحصیلی",
  },
  en: {
    title: "The Jahan Journal", eyebrow: "Read. Discover. Take your next step.",
    intro: "Articles, guides and updates from Jahan Academy, for a more informed academic journey.",
    home: "Home", featured: "Start your reading here", latest: "Latest stories", all: "All stories",
    article: "Articles", news: "News", guide: "Guides", search: "Search stories", placeholder: "What would you like to read about?",
    sort: "Publication order", newest: "Newest first", oldest: "Oldest first", results: "stories", read: "Read story",
    empty: "No matching stories", emptyHint: "Try another search or clear the filters.",
    reset: "Show all stories", published: "Published", guides: "From discovery to decision", guideText: "Every academic journey is different. Understand your circumstances and ask better questions.",
    consultation: "Request a consultation", note: "This preview uses the website’s sample editorial content.",
    previous: "Previous", next: "Next", page: "Page", of: "of", archive: "Articles, news and guides", back: "Back to the journal",
    faq: "Frequently asked questions", help: "Academic pathway consultation",
  },
} as const;

export function blogImage(post: BlogPost) {
  if (post.slug === "prepare-for-consultation") return "/home-trust-consultation.png";
  if (post.slug === "choosing-a-study-destination") return "/universities/aalborg-university.jpg";
  return "/home-hero-campus-v2.png";
}
