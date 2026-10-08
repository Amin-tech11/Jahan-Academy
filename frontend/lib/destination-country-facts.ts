type Copy = { fa: string; en: string };
export type CountryFact = { value: Copy; note: Copy; source: string };
export type CountryFacts = { living: CountryFact; tuition: CountryFact; work: CountryFact; stay: CountryFact };
export const countryFactsReviewedAt = "2026-10-07";
const fact = (fa: string, en: string, faNote: string, enNote: string, source: string): CountryFact => ({ value: { fa, en }, note: { fa: faNote, en: enNote }, source });
const daad = "https://www.daad.de/en/studying-in-germany/living-in-germany/finances/";
const germanyVisa = "https://www.make-it-in-germany.com/en/visa-residence/types/studying";
const canadaCosts = "https://www.educanada.ca/programs-programmes/education_cost-cout_education.aspx?lang=eng";
const ukCosts = "https://study-uk.britishcouncil.org/moving-uk/cost-studying";
const italyCosts = "https://education.ec.europa.eu/study-in-europe/country-profiles/italy";
const italyVisa = "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-italy_en";
const australiaCosts = "https://www.studyaustralia.gov.au/en/life-in-australia/living-and-education-costs";
const swedenCosts = "https://education.ec.europa.eu/study-in-europe/country-profiles/sweden";
const finlandCosts = "https://www.studyinfinland.fi/funding-your-studies/fees-and-cost-living";
const denmarkVisa = "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study/Higher-education";
const nzCosts = "https://www.studywithnewzealand.govt.nz/en/plan-with-new-zealand/cost-of-living";

// Country-level editorial estimates only; not university fees or a public course catalogue.
export const destinationCountryFacts: Record<string, CountryFacts> = {
  germany: {
    living: fact("۹۰۰ تا ۱٬۲۰۰ یورو در ماه", "€900–1,200 / month", "برآورد زندگی؛ بسته به شهر و مسکن", "Living estimate; varies by city and housing", daad),
    tuition: fact("اغلب دولتی‌ها بدون شهریه", "Often tuition-free at public institutions", "با استثناهای ایالتی؛ هزینه ترم جداست", "State exceptions apply; semester contributions are separate", daad),
    work: fact("تا ۲۰ ساعت در هفته", "Up to 20 hours / week", "یا ۱۴۰ روز کامل / ۲۸۰ نیم‌روز در سال", "Alternatively, 140 full / 280 half days per year", germanyVisa),
    stay: fact("تا ۱۸ ماه", "Up to 18 months", "مجوز جست‌وجوی کار برای واجدان شرایط", "Job-search permit for eligible graduates", germanyVisa),
  },
  canada: {
    living: fact("حداقل حدود ۱٬۹۱۷ دلار کانادا در ماه", "Budget at least about CAD 1,917 / month", "بودجه پیشنهادی رسمی ۲۳٬۰۰۰ دلار در سال؛ شهرها متفاوت‌اند", "Official suggested annual budget: CAD 23,000; cities vary", canadaCosts),
    tuition: fact("میانگین ۴۱٬۷۴۶ دلار کانادا در سال", "Average CAD 41,746 / year", "میانگین کارشناسی بین‌المللی؛ تحصیلات تکمیلی ۲۴٬۰۲۸ دلار", "International undergraduate average; graduate average CAD 24,028", canadaCosts),
    work: fact("تا ۲۴ ساعت در هفته", "Up to 24 hours / week", "کار خارج از محیط آموزشی در زمان تحصیل؛ با مجوز واجد شرایط", "Eligible off-campus work during academic terms", "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/work-off-campus.html"),
    stay: fact("تا ۳ سال", "Up to 3 years", "مجوز کار PGWP؛ مدت بر اساس شرایط و طول تحصیل", "PGWP work permit; length depends on eligibility and study duration", "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/about.html"),
  },
  "united-kingdom": {
    living: fact("۹۰۰ تا ۱٬۴۰۰ پوند در ماه", "£900–1,400 / month", "خارج لندن ۹۰۰–۱٬۳۰۰؛ لندن ۱٬۳۰۰–۱٬۴۰۰ پوند", "Outside London £900–1,300; London £1,300–1,400", ukCosts),
    tuition: fact("۱۱٬۴۰۰ تا ۳۸٬۰۰۰ پوند در سال", "£11,400–38,000 / year", "برآورد عمومی کارشناسی بین‌المللی؛ مقاطع دیگر متفاوت‌اند", "General international undergraduate estimate; other levels differ", ukCosts),
    work: fact("معمولاً تا ۲۰ ساعت در هفته", "Usually up to 20 hours / week", "در زمان تحصیل؛ بر اساس شرایط ویزای دانشجویی", "During terms, subject to Student visa conditions", "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-student"),
    stay: fact("۲ سال؛ از ۲۰۲۷: ۱۸ ماه", "2 years; from 2027: 18 months", "Graduate visa؛ درخواست از ۱ ژانویه ۲۰۲۷؛ دکتری ۳ سال", "Graduate visa applications from 1 January 2027; doctorates: 3 years", "https://www.gov.uk/graduate-visa"),
  },
  italy: {
    living: fact("۷۰۰ تا ۱٬۱۰۰ یورو در ماه", "€700–1,100 / month", "برآورد عمومی؛ شهر و نوع مسکن مؤثر است", "General estimate; city and housing affect costs", italyCosts),
    tuition: fact("۹۰۰ تا ۴٬۰۰۰ یورو در سال", "€900–4,000 / year", "بازه عمومی مؤسسات دولتی؛ خصوصی‌ها بیشتر و درآمد مؤثر است", "Public institution estimate; private fees are higher and income matters", italyCosts),
    work: fact("تا ۲۰ ساعت در هفته", "Up to 20 hours / week", "حداکثر ۱٬۰۴۰ ساعت در سال با مجوز معتبر", "Maximum 1,040 hours per year with a valid permit", italyVisa),
    stay: fact("۱۲ ماه", "12 months", "مجوز جست‌وجوی کار پس از فارغ‌التحصیلی واجد شرایط", "Job-search permit after eligible graduation", italyVisa),
  },
  netherlands: {
    living: fact("۱٬۰۰۰ تا ۱٬۵۰۰ یورو در ماه", "€1,000–1,500 / month", "برآورد عمومی هزینه‌های دانشجویی", "General student living-cost estimate", "https://www.studyinnl.org/finances/daily-student-expenses-and-cost-of-living-in-the-netherlands"),
    tuition: fact("۹٬۰۰۰ تا ۲۰٬۰۰۰ یورو در سال", "€9,000–20,000 / year", "کارشناسی غیراروپایی؛ تحصیلات تکمیلی ۱۲٬۰۰۰–۳۰٬۰۰۰ یورو", "Non-EU/EEA undergraduate; graduate estimate €12,000–30,000", "https://www.studyinnl.org/finances/tuition-fees"),
    work: fact("تا ۱۶ ساعت در هفته", "Up to 16 hours / week", "یا تمام‌وقت در تابستان؛ کارفرما باید مجوز کار بگیرد", "Or full-time June–August; employer needs a work permit", "https://ind.nl/en/residence-permits/study/student-residence-permit-for-university-or-higher-professional-education"),
    stay: fact("۱۲ ماه", "12 months", "مجوز سال جهت‌یابی برای واجدان شرایط", "Orientation-year permit for eligible graduates", "https://ind.nl/en/residence-permits/work/residence-permit-for-orientation-year"),
  },
  australia: {
    living: fact("متناسب با شهر و نوع مسکن", "Depends on city and housing", "برآورد با محاسبه‌گر رسمی؛ حداقل تمکن ویزا، هزینه واقعی نیست", "Use the official calculator; visa funding minimum is not actual living cost", australiaCosts),
    tuition: fact("متغیر بر اساس مقطع و محل تحصیل", "Varies by level and study location", "منبع رسمی بازه سراسری ثابتی اعلام نمی‌کند", "The official source does not publish one fixed national range", australiaCosts),
    work: fact("تا ۴۸ ساعت در هر دو هفته", "Up to 48 hours / fortnight", "در زمان تحصیل؛ با رعایت شرایط ویزا", "During studies, subject to visa conditions", "https://www.studyaustralia.gov.au/en/work-in-australia.html"),
    stay: fact("معمولاً ۲ تا ۳ سال", "Usually 2–3 years", "مجوز موقت فارغ‌التحصیلی؛ مشروط به احراز شرایط", "Temporary Graduate visa; eligibility conditions apply", "https://www.studyaustralia.gov.au/en/plan-your-move/your-guide-to-visas/temporary-graduate-visa-subclass-485"),
  },
  sweden: {
    living: fact("حدود ۱۰٬۶۵۶ کرون سوئد در ماه", "About SEK 10,656 / month", "برآورد عمومی زندگی دانشجویی", "General student living-cost estimate", swedenCosts),
    tuition: fact("میانگین ۱۲۹٬۰۰۰ کرون سوئد در سال", "Average SEK 129,000 / year", "میانگین برای دانشجویان غیراروپایی؛ مبلغ دقیق متفاوت است", "Non-EU/EEA average; actual fees vary", swedenCosts),
    work: fact("معمولاً تا ۱۵ ساعت در هفته", "Usually up to 15 hours / week", "مجوزهای صادرشده از ۱۱ ژوئن ۲۰۲۶؛ استثناها در منبع رسمی", "Permits granted from 11 June 2026; official exceptions apply", "https://www.migrationsverket.se/nyheter/news-archive/2026-05-25-new-rules-for-residence-permits-for-studies-in-higher-education.html"),
    stay: fact("۱۲ ماه؛ دکتری تا ۱۸ ماه", "12 months; doctorates up to 18", "مجوز جست‌وجوی کار برای فارغ‌التحصیل واجد شرایط", "Job-search permit for eligible graduates", "https://www.migrationsverket.se/download/18.2cd2e409193b84c506a35a2a/1781157750292/189011_stud_soka_arbete_en.pdf"),
  },
  finland: {
    living: fact("۹۰۰ تا ۱٬۲۰۰ یورو در ماه", "€900–1,200 / month", "برآورد پیشنهادی شامل مسکن و مخارج روزمره", "Recommended estimate including housing and daily expenses", finlandCosts),
    tuition: fact("۹٬۰۰۰ تا ۲۰٬۰۰۰ یورو در سال", "€9,000–20,000 / year", "برآورد تحصیل انگلیسی‌زبان برای دانشجوی غیراروپایی؛ معافیت‌ها متفاوت‌اند", "English-taught study estimate for non-EU/EEA students; exemptions vary", finlandCosts),
    work: fact("میانگین تا ۳۰ ساعت در هفته", "Average up to 30 hours / week", "میانگین سالانه؛ با مجوز دانشجویی", "Annual average, with a student residence permit", finlandCosts),
    stay: fact("تا ۲۴ ماه", "Up to 24 months", "مجوز جست‌وجوی کار یا راه‌اندازی کسب‌وکار برای واجدان شرایط", "Job-search or business-start permit for eligible graduates", "https://migri.fi/en/residence-permit-to-look-for-work"),
  },
  denmark: {
    living: fact("حدود ۸٬۴۵۰ تا ۱۳٬۷۰۰ کرون دانمارک در ماه", "About DKK 8,450–13,700 / month", "جمع ردیف‌های بودجه رسمی؛ هزینه‌های اضافی جداست", "Sum of the official budget items; extras are separate", "https://studyindenmark.dk/live-in-denmark/bank-budget"),
    tuition: fact("۶٬۰۰۰ تا ۱۶٬۰۰۰ یورو در سال", "€6,000–16,000 / year", "بازه رسمی برای دانشجوی غیراروپایی؛ به یورو اعلام شده", "Official non-EU/EEA estimate, published in euros", "https://studyindenmark.dk/study-options/tuition-fees-scholarships/tuition-fees-and-scholarships/download-pdf"),
    work: fact("تا ۹۰ ساعت در ماه", "Up to 90 hours / month", "سپتامبر تا مه؛ تابستان تمام‌وقت برای تحصیل مورد تأیید دولت", "September–May; full-time summer work for state-approved study", denmarkVisa),
    stay: fact("۶ ماه یا تا ۳ سال", "6 months or up to 3 years", "جست‌وجوی کار؛ بسته به مدرک و تأیید دولتی تحصیل", "Job-search period depends on qualification and state approval", denmarkVisa),
  },
  "new-zealand": {
    living: fact("حدود ۱٬۵۰۰ تا ۲٬۲۵۰ دلار نیوزیلند در ماه", "About NZD 1,500–2,250 / month", "تبدیل برآورد سالانه ۱۸٬۰۰۰–۲۷٬۰۰۰ دلار؛ بسته به شهر", "Annual NZD 18,000–27,000 estimates divided by 12; varies by city", nzCosts),
    tuition: fact("۳۵٬۰۰۰ تا ۵۵٬۰۰۰ دلار نیوزیلند در سال", "NZD 35,000–55,000 / year", "برآورد عمومی کارشناسی؛ برخی زمینه‌ها گران‌ترند؛ ارقام مارس ۲۰۲۵", "General undergraduate estimate; some fields cost more; March 2025 figures", nzCosts),
    work: fact("تا ۲۵ ساعت در هفته", "Up to 25 hours / week", "با شرایط مجاز ویزا؛ ویزاهای قدیمی ممکن است نیاز به تغییر داشته باشند", "Subject to visa conditions; older visas may need a variation", "https://www.immigration.govt.nz/study/once-you-have-a-student-visa/check-or-change-your-student-visa-conditions/"),
    stay: fact("تا ۳ سال", "Up to 3 years", "مجوز کار پس از تحصیل؛ وابسته به مدرک و مدت تحصیل", "Post-Study Work Visa; depends on qualification and study duration", "https://www.immigration.govt.nz/visas/post-study-work-visa/"),
  },
};
