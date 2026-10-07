import type { HomeUniversity } from "./home-universities";
import type { Locale, UniversityShowcase } from "./site-content";

export type UniversityPhoto = { src: string; caption: Record<Locale, string> };
export type UniversityFeature = { title: Record<Locale, string>; text: Record<Locale, string>; url: string };
export type UniversityOffering = UniversityFeature & {
  icon: "permit" | "internship" | "work" | "offer" | "home";
  status: Record<Locale, string>;
};
export type UniversityDiscipline = { name: Record<Locale, string>; percentage: number };
export type UniversityDisciplineSource = {
  year: string;
  basis: Record<Locale, string>;
  url: string;
  supportingUrls?: string[];
};
export type UniversityOverviewPoint = { title: Record<Locale, string>; text: Record<Locale, string>; sourceUrl: string };
export type UniversityInfo = UniversityShowcase & {
  englishName: string;
  location: Record<Locale, string>;
  logo?: string;
  photos: UniversityPhoto[];
  about: Record<Locale, string>;
  features: UniversityFeature[];
  offerings?: UniversityOffering[];
  address?: string;
  shortAddress?: string;
  coordinates?: { latitude: number; longitude: number };
  dli?: string;
  topDisciplines?: UniversityDiscipline[];
  disciplineSource?: UniversityDisciplineSource;
  academicFields?: Record<Locale, string>[];
  whyChoose?: UniversityOverviewPoint[];
  notes?: UniversityOverviewPoint[];
  sources: { label: string; url: string }[];
};

const identityCountries: Record<string, { code: string; flag: string }> = {
  Canada: { code: "CA", flag: "canada" },
  Australia: { code: "AU", flag: "australia" },
  "United Kingdom": { code: "GB", flag: "united-kingdom" },
  Germany: { code: "DE", flag: "germany" },
  Italy: { code: "IT", flag: "italy" },
  Denmark: { code: "DK", flag: "denmark" },
  Sweden: { code: "SE", flag: "sweden" },
  Finland: { code: "FI", flag: "finland" },
  "New Zealand": { code: "NZ", flag: "new-zealand" },
  Netherlands: { code: "NL", flag: "netherlands" },
};

export function universityIdentityLocation(university: UniversityInfo) {
  const country = Object.hasOwn(identityCountries, university.country.en) ? identityCountries[university.country.en] : undefined;
  const segments = university.location.en.split(",").map((part) => part.trim());
  if (country && segments.at(-1) === university.country.en) segments[segments.length - 1] = country.code;
  return {
    label: segments.join(", "),
    flag: country ? `/destinations/flags/${country.flag}.svg` : undefined,
    address: university.shortAddress || university.address,
  };
}

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

export function universityMapEmbedUrl(university: UniversityInfo) {
  const point = university.coordinates;
  const validPoint = point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
  const query = encodeURIComponent(validPoint ? `${point.latitude},${point.longitude}` : `${university.englishName}, ${university.address || university.location.en}`);
  return `https://maps.google.com/maps?q=${query}&t=m&z=16&hl=en&output=embed`;
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
  // Percentages supplied in the user's Western reference image; retain their rounding.
  topDisciplines: [
    { name: { fa: "علوم", en: "Sciences" }, percentage: 34 },
    { name: { fa: "هنر", en: "Arts" }, percentage: 25 },
    { name: { fa: "مهندسی و فناوری", en: "Engineering and Technology" }, percentage: 14 },
    { name: { fa: "سایر", en: "Other" }, percentage: 26 },
  ],
  address: "1151 Richmond Street, London, Ontario, Canada",
  shortAddress: "1151 Richmond Street, London",
  // Verified against the Western University place marker in Google Maps.
  coordinates: { latitude: 43.0095971, longitude: -81.2737336 },
  websiteUrl: "https://www.uwo.ca/",
  logo: "/university-info/western-logo.png",
  whyChoose: [
    { title: { fa: "پردیسی برای یادگیری و زندگی", en: "A campus for learning and living" }, text: { fa: "فضاهای سبز و ترکیب معماری تاریخی و مدرن، در کنار کتابخانه‌ها و ساختمان‌های آموزشی، محیط متنوعی برای روزهای دانشجویی فراهم می‌کنند.", en: "Green spaces, historic and modern architecture, libraries and teaching buildings create a varied setting for everyday student life." }, sourceUrl: "https://www.uwo.ca/about/visit/index.html" },
    { title: { fa: "زندگی در جامعهٔ خوابگاهی", en: "A residential community" }, text: { fa: "اقامتگاه‌های داخل پردیس با چیدمان‌های مختلف، فرصت آشنایی با دانشجویان دیگر و مشارکت در فعالیت‌های جمعی را فراهم می‌کنند.", en: "On-campus residences offer different layouts and opportunities to meet other students and take part in community activities." }, sourceUrl: "https://residence.uwo.ca/buildings" },
    { title: { fa: "تنوع زمینه‌های تحصیل", en: "A range of academic interests" }, text: { fa: "حوزه‌هایی مانند علوم، مهندسی، هنر و علوم اجتماعی امکان بررسی مسیرهای تحصیلی متناسب با علاقه و پیشینهٔ شما را فراهم می‌کنند.", en: "Fields including science, engineering, arts and social sciences offer academic paths to explore around your interests and background." }, sourceUrl: "https://welcome.uwo.ca/what-can-i-study/undergraduate-programs/index.html" },
    { title: { fa: "پیوند یادگیری با تجربه", en: "Learning through experience" }, text: { fa: "بسته به رشته، فرصت‌هایی مانند کارآموزی، کوآپ و تجربه‌های عملی به دانشجویان کمک می‌کنند آموخته‌های خود را در محیط واقعی به کار بگیرند.", en: "Depending on the field of study, internships, co-op and practical placements help students apply their learning in real settings." }, sourceUrl: "https://experience.uwo.ca/students/workexperience.html" },
  ],
  notes: [
    { title: { fa: "شرایط پذیرش و مدارک", en: "Admission requirements and documents" }, text: { fa: "شرایط پذیرش به سابقهٔ تحصیلی و رشتهٔ انتخابی بستگی دارد. پیش‌نیازها، الزامات زبان انگلیسی و مدارک تکمیلی را برای مسیر درخواست خود بررسی کنید.", en: "Admission requirements depend on your educational background and chosen field. Check the prerequisites, English-language requirements and supplementary documents for your application route." }, sourceUrl: "https://welcome.uwo.ca/next-steps/requirements/index.html" },
    { title: { fa: "مهلت‌ها و درخواست خوابگاه", en: "Residence applications and deadlines" }, text: { fa: "درخواست خوابگاه مراحل و مهلت‌های جداگانه دارد. تضمین اقامت سال اول به احراز شرایط و انجام مراحل در موعد مقرر وابسته است.", en: "Residence has its own application steps and deadlines. The first-year residence guarantee depends on meeting the eligibility criteria and completing the required steps on time." }, sourceUrl: "https://residence.uwo.ca/applying/key_steps" },
  ],
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
  offerings: [
    {
      icon: "permit", title: { fa: "مجوز کار پس از تحصیل", en: "Post-Graduation Work Permit" },
      status: { fa: "با احراز شرایط", en: "Subject to eligibility" },
      text: { fa: "فارغ‌التحصیلان واجد شرایط می‌توانند برای مجوز کار پس از تحصیل (PGWP) اقدام کنند. امکان دریافت این مجوز به دورهٔ تحصیلی و رعایت الزامات ادارهٔ مهاجرت کانادا، از جمله شرایط تحصیل و زبان، بستگی دارد و خودکار نیست.", en: "Eligible graduates may apply for a post-graduation work permit (PGWP). Eligibility depends on the study program and meeting IRCC requirements, including study and language requirements; the permit is not automatic." },
      url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html",
    },
    {
      icon: "internship", title: { fa: "کوآپ و کارآموزی", en: "Co-op / Internship Participation" },
      status: { fa: "بسته به رشته", en: "Program dependent" },
      text: { fa: "کوآپ، کارآموزی و دوره‌های عملی، یادگیری دانشگاهی را با تجربهٔ محیط کار ترکیب می‌کنند. وسترن این فرصت‌ها را در رشته‌های مختلف ارائه می‌دهد؛ شیوهٔ شرکت، مدت و شرایط هر فرصت به دانشکده و دورهٔ تحصیلی بستگی دارد.", en: "Co-op, internships and practicums combine academic learning with workplace experience. Western offers these opportunities across different fields; participation, duration and requirements depend on the faculty and study program." },
      url: "https://experience.uwo.ca/students/workexperience.html",
    },
    {
      icon: "work", title: { fa: "کار هنگام تحصیل", en: "Work While Studying" },
      status: { fa: "با احراز شرایط", en: "Subject to eligibility" },
      text: { fa: "دانشجویان بین‌المللی در صورت احراز شرایط می‌توانند هنگام تحصیل خارج از پردیس کار کنند. پیش از شروع کار، شرایط مجوز تحصیل، وضعیت ثبت‌نام و محدودیت ساعات کار را در راهنمای رسمی ادارهٔ مهاجرت کانادا بررسی کنید.", en: "International students who meet the requirements may work off campus while studying. Before starting work, check your study permit conditions, enrolment status and working-hour limits in the official IRCC guidance." },
      url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/work-off-campus.html",
    },
    {
      icon: "offer", title: { fa: "نامهٔ پذیرش مشروط", en: "Conditional Offer Letter" },
      status: { fa: "ارائه می‌شود", en: "Available" },
      text: { fa: "پذیرش اولیه ممکن است مشروط به تکمیل شرایط ذکرشده در نامهٔ پذیرش باشد. برای نهایی شدن پذیرش، باید مدارک نهایی و سایر الزامات مشخص‌شده در پورتال پذیرش وسترن را در مهلت مقرر ارائه کنید.", en: "An initial offer may be conditional on meeting the requirements stated in your offer. To finalize admission, submit your final documents and meet the conditions shown in Western’s offer portal by the specified deadline." },
      url: "https://welcome.uwo.ca/next-steps/accept-offer/meet-your-admission-conditions.html",
    },
    {
      icon: "home", title: { fa: "اقامتگاه‌های دانشجویی", en: "Accommodations" },
      status: { fa: "ارائه می‌شود", en: "Available" },
      text: { fa: "وسترن اقامتگاه‌های دانشجویی با چیدمان‌های مختلف در پردیس دارد. درخواست خوابگاه مراحل و مهلت‌های جداگانه دارد؛ تضمین اقامت سال اول به احراز شرایط و تکمیل مراحل در موعد مقرر وابسته است.", en: "Western offers on-campus residences with different living arrangements. Residence has separate application steps and deadlines; the first-year guarantee depends on eligibility and completing the required steps on time." },
      url: "https://residence.uwo.ca/applying/key_steps",
    },
  ],
  sources: [
    { label: "Western University", url: "https://www.uwo.ca/about/visit/index.html" },
    { label: "ApplyBoard", url: "https://www.applyboard.com/schools/western-university" },
  ],
};
