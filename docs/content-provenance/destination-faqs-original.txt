import type { Locale } from "./site-content";

type Localized = Record<Locale, string>;
export type DestinationFaqItem = {
  question: Localized;
  answer: Localized;
  source: { name: string; url: string };
  verification?: { name: string; url: string };
};
const faq = (country: string, qFa: string, qEn: string, aFa: string, aEn: string): DestinationFaqItem => ({
  question: { fa: qFa, en: qEn }, answer: { fa: aFa, en: aEn },
  source: { name: "GO2TR", url: `https://go2tr.com/${country}/study` },
});

// Selected topics from GO2TR study-page FAQs, reviewed 2026-10-05.
// Original concise paraphrases and English translations, not verbatim reproduction.
// Estimates are attributed to GO2TR; individual programme conditions still apply.
export const destinationFaqs: Record<string, readonly DestinationFaqItem[]> = {
  "canada": [
    faq("canada", "آیا بورسیه می‌تواند هزینه تحصیل کانادا را پوشش دهد؟", "Can scholarships cover Canadian study costs?", "آموزش کاملاً رایگان عمومی نیست؛ بورسیه و فاند می‌توانند هزینه‌ها را کاهش دهند.", "Universal free study is unavailable; scholarships and funding can reduce costs."),
    faq("canada", "دانشجو در کانادا امکان اشتغال دارد؟", "Can students take jobs in Canada?", "کار پاره‌وقت ممکن است؛ باید شرایط مجوز تحصیل و کار خود را رعایت کنید.", "Part-time employment is possible, subject to your study and work permissions."),
    faq("canada", "کانادا چه فرصت‌هایی برای دانشجو فراهم می‌کند؟", "What opportunities does Canada offer students?", "آموزش معتبر، کار دانشجویی و مسیرهای پس از فارغ‌التحصیلی از مزیت‌های مطرح‌شده‌اند.", "Highlighted benefits include quality education, student employment and post-graduation pathways."),
    faq("canada", "بورسیه کانادایی ممکن است مشمول مالیات شود؟", "Could Canadian scholarships be taxable?", "بله؛ GO2TR وضعیت مالیاتی را وابسته به استان و مبلغ کمک‌هزینه می‌داند.", "Possibly. GO2TR relates taxation to the province and funding amount."),
    faq("canada", "برای پذیرش کانادا چه معدلی مناسب است؟", "What grades support admission in Canada?", "GO2TR معدل ۱۴ تا ۱۵ را معمول می‌داند؛ دانشگاه و رشته ممکن است نمره بالاتری بخواهند.", "GO2TR suggests 14–15/20 as common; institutions and programmes may require more."),
  ],
  "germany": [
    faq("germany", "معدل مورد انتظار دانشگاه‌های آلمان چقدر است؟", "What grades do German universities expect?", "GO2TR حدود ۱۴ تا ۱۵ و برای دانشگاه‌های رقابتی ۱۶ به بالا را مطرح می‌کند؛ معیار ثابت نیست.", "GO2TR mentions roughly 14–15/20, or 16+ for competitive institutions; requirements vary."),
    faq("germany", "کدام شهرهای آلمان برای دانشجو محبوب‌اند؟", "Which German cities are popular with students?", "برلین، مونیخ، هامبورگ و کلن به‌دلیل دانشگاه‌ها و فرصت‌های شغلی معرفی شده‌اند.", "Berlin, Munich, Hamburg and Cologne are highlighted for universities and employment opportunities."),
    faq("germany", "سن بالاتر مانع ورود به کارشناسی آلمان است؟", "Does older age prevent German undergraduate admission?", "سقف سنی رسمی مشخصی ذکر نشده؛ مسیر تحصیلی منطقی و هدف روشن اهمیت دارند.", "No fixed official upper age is stated; a coherent study plan matters."),
    faq("germany", "مدرک دانشگاه آزاد برای آلمان قابل استفاده است؟", "Are Azad University degrees accepted?", "بله، پس از ارزیابی و تأیید مدرک می‌توان اقدام کرد.", "Yes, if assessed and recognised."),
    faq("germany", "با نمرات پایین چگونه شانس پذیرش آلمان را بهتر کنم؟", "How can lower grades be offset in Germany?", "انتخاب دانشگاه مناسب، تقویت رزومه و دوره‌های آمادگی از راهکارهای پیشنهادی GO2TR هستند.", "GO2TR suggests suitable institutions, stronger credentials and preparatory study."),
  ],
  "united-kingdom": [
    faq("uk", "ارشد در انگلستان معمولاً چند سال طول می‌کشد؟", "How long does a UK master's usually take?", "GO2TR طول دوره را یک تا دو سال ذکر می‌کند.", "GO2TR gives a typical duration of one to two years."),
    faq("uk", "بدون دیپلم بین‌المللی چه مسیری برای ورود به دانشگاه هست؟", "What entry routes exist without an international diploma?", "مسیرهایی مانند GCSE، سپس A-level یا دوره فاندیشن در منبع مطرح شده‌اند.", "The source discusses routes involving GCSEs, followed by A-levels or foundation study."),
    faq("uk", "برای اپلای انگلستان از چه مرحله‌ای شروع کنم؟", "How should I begin a UK study application?", "دانشگاه را انتخاب کنید؛ مدارک، پذیرش، ویزا، بودجه و برنامه سفر را به‌ترتیب آماده کنید.", "Choose an institution, then arrange documents, admission, visa, funding and travel."),
    faq("uk", "لندن چه مزیتی برای ادامه تحصیل دارد؟", "What makes London attractive for study?", "دانشگاه‌های شناخته‌شده، شبکه‌سازی حرفه‌ای و فضای چندفرهنگی از مزیت‌های آن هستند.", "Recognised universities, professional networking and a multicultural environment are highlighted."),
    faq("uk", "بورسیه کامل در انگلستان امکان‌پذیر است؟", "Is full funding possible in the UK?", "بله؛ بورسیه‌های فول‌فاند می‌توانند هزینه تحصیل را پوشش دهند، در صورت احراز شرایط.", "Yes. Fully funded scholarships can cover study costs when eligibility conditions are met."),
  ],
  "italy": [
    faq("italy", "درخواست تحصیل در ایتالیا را چگونه شروع کنم؟", "How do I start an Italian study application?", "دوره مناسب انتخاب کنید و سوابق نمرات و مدرک زبان را برای دانشگاه بفرستید.", "Choose a suitable course and submit academic records and language evidence."),
    faq("italy", "چرا ایتالیا بین متقاضیان تحصیل محبوب است؟", "Why do applicants choose Italy?", "هزینه مناسب، اعتبار علمی، بورسیه‌های متنوع و عضویت در شنگن از دلایل معرفی‌شده‌اند.", "Highlighted reasons include affordability, academic reputation, scholarships and Schengen membership."),
    faq("italy", "دانشجوی غیراروپایی می‌تواند هزینه تحصیل را با بورسیه پوشش دهد؟", "Can non-European students fund study through scholarships?", "بله؛ دریافت بورسیه مناسب می‌تواند هزینه تحصیل را پوشش دهد.", "Yes. A suitable scholarship can cover study costs."),
    faq("italy", "کار پاره‌وقت دانشجویی در ایتالیا چه سقفی دارد؟", "What is Italy's student part-time work limit?", "GO2TR حداکثر ۲۰ ساعت در هفته را برای کار دانشجویی ذکر می‌کند.", "GO2TR states a student employment limit of 20 hours weekly."),
    faq("italy", "بورسیه‌های ایتالیا بر چه اساسی اعطا می‌شوند؟", "How are Italian scholarships awarded?", "ارزیابی می‌تواند بر پایه شایستگی تحصیلی یا نیاز مالی متقاضی باشد.", "Assessment may depend on academic merit or the applicant's financial need."),
  ],
  "netherlands": [
    faq("netherland", "GO2TR شهریه دانشگاه‌های هلند را چقدر برآورد می‌کند؟", "What Dutch tuition estimates does GO2TR give?", "سالانه برای کارشناسی ۶ تا ۱۵ هزار یورو و ارشد ۸ تا ۲۰ هزار یورو؛ مبلغ دانشگاه را بررسی کنید.", "Annual estimates: €6,000–15,000 for bachelor's and €8,000–20,000 for master's; check actual tuition."),
    faq("netherland", "برای ورود به دانشگاه هلند آزمون سراسری لازم است؟", "Is a national entrance exam required in the Netherlands?", "معمولاً خیر؛ بعضی رشته‌ها مصاحبه یا نمونه‌کار می‌خواهند.", "Usually not; some programmes request interviews or portfolios."),
    faq("netherland", "یادگیری و انتخاب واحد در دانشگاه‌های هلند چگونه است؟", "How do learning and electives work in Dutch universities?", "آموزش فعال و پروژه‌محور است؛ در کنار دروس الزامی، واحدهای انتخابی هم ارائه می‌شوند.", "Active, project-based learning combines required courses with elective options."),
    faq("netherland", "دوره انگلیسی‌زبان در هلند پیدا می‌شود؟", "Are English-taught courses available in the Netherlands?", "بله؛ به‌ویژه در مقاطع ارشد و دکتری، برنامه‌های انگلیسی متعددی وجود دارند.", "Yes; numerous English-taught programmes are available, particularly at master's and doctoral levels."),
    faq("netherland", "آیا دانشگاه‌های هلند سقف سنی مشخصی دارند؟", "Is there an upper age limit?", "سقف عمومی مشخصی ذکر نشده؛ برای تحصیلات تکمیلی، سوابق بررسی می‌شوند.", "No general limit is stated; postgraduate applications consider previous experience."),
  ],
  "australia": [
    faq("australia", "برآورد شهریه سالانه استرالیا در GO2TR چقدر است؟", "What annual Australian tuition range does GO2TR report?", "بسته به رشته، حدود ۲۴ هزار تا ۹۴٬۰۱۶ دلار استرالیا؛ شهریه دقیق را از دانشگاه بگیرید.", "Approximately AUD 24,000–94,016 depending on the subject; obtain exact tuition from the institution."),
    faq("australia", "برای پذیرش استرالیا چگونه زبانم را اثبات کنم؟", "How can I demonstrate English?", "آیلتس و تافل از آزمون‌های مطرح‌شده‌اند.", "IELTS and TOEFL are mentioned."),
    faq("australia", "وقفه تحصیلی در پرونده استرالیا یعنی چه؟", "What does a study gap mean in an Australian application?", "فاصله آخرین تحصیل تا درخواست جدید است؛ ممکن است توضیح و مدارک کاری بخواهند.", "It is the interval since previous study; explanations and employment evidence may be requested."),
    faq("australia", "GO2TR چه نمره آیلتسی را برای استرالیا مطرح می‌کند؟", "What IELTS scores does GO2TR suggest for Australia?", "معمولاً ۶٫۵ و برای بعضی دوره‌های ارشد یا دکتری ۷؛ شرط واقعی هر دوره متفاوت است.", "Typically 6.5, or 7 for some postgraduate courses; actual programme requirements vary."),
    faq("australia", "دانشگاه‌های استرالیا چه مزیت‌هایی دارند؟", "What benefits do Australian universities offer?", "اعتبار بین‌المللی، امکانات پژوهشی و فرصت‌های شغلی پس از تحصیل از مزیت‌های معرفی‌شده‌اند.", "International recognition, research facilities and post-study employment opportunities are highlighted."),
  ],
  "sweden": [
    faq("sweden", "دانشگاه‌های سوئد به چه زبان‌هایی آموزش می‌دهند؟", "Which teaching languages are available in Sweden?", "دوره‌ها به انگلیسی یا سوئدی ارائه می‌شوند.", "Courses are offered in English or Swedish."),
    faq("sweden", "GO2TR هزینه دانشگاه در سوئد را چقدر اعلام می‌کند؟", "What Swedish tuition estimates does GO2TR report?", "۸۰ هزار تا ۲۹۵ هزار کرون، بسته به دوره و دانشگاه؛ دکتری بدون شهریه معرفی شده است.", "SEK 80,000–295,000 depending on programme and institution; doctoral study is described as tuition-free."),
    faq("sweden", "پس از فارغ‌التحصیلی سوئد می‌توان برای یافتن شغل ماند؟", "Can graduates stay in Sweden to seek work?", "GO2TR فرصت ۱۲ماهه جست‌وجوی کار و سپس تغییر اقامت در صورت احراز شرایط را مطرح می‌کند.", "GO2TR describes a 12-month job-search opportunity, followed by a residence change if eligible."),
  ],
  "finland": [
    faq("finland", "چه مدارکی برای پرونده تحصیلی فنلاند آماده کنم؟", "Which documents should I prepare for Finnish study?", "ترجمه سوابق تحصیلی، مدرک زبان، گذرنامه، انگیزه‌نامه و مدارک مالی در منبع ذکر شده‌اند.", "The source lists translated academic records, language evidence, passport, motivation letter and financial documents."),
    faq("finland", "طول کارشناسی در فنلاند چقدر است؟", "How long is a Finnish bachelor's programme?", "GO2TR مدت سه‌ونیم تا چهارونیم سال را ذکر می‌کند؛ دوره انتخابی را بررسی کنید.", "GO2TR gives 3.5–4.5 years; check your chosen programme."),
    faq("finland", "شهریه سالانه فنلاند طبق GO2TR چقدر است؟", "What annual Finnish tuition does GO2TR estimate?", "حدود ۹ تا ۲۰ هزار یورو؛ مبلغ نهایی به دانشگاه و دوره بستگی دارد.", "Approximately €9,000–20,000; the final amount depends on the institution and course."),
    faq("finland", "برای دوره انگلیسی فنلاند چه نمره زبانی مطرح است؟", "What English scores are suggested for Finnish courses?", "GO2TR آیلتس ۶ تا ۶٫۵ یا تافل ۸۰ تا ۹۰ را ذکر می‌کند؛ بعضی دانشگاه‌ها معافیت دارند.", "GO2TR mentions IELTS 6–6.5 or TOEFL 80–90; some institutions offer exemptions."),
    faq("finland", "چه حوزه‌هایی در فنلاند برای تحصیل پیشنهاد شده‌اند؟", "Which fields are highlighted?", "فناوری اطلاعات، مهندسی، علم داده، مدیریت، آموزش و محیط‌زیست.", "IT, engineering, data science, management, education and environment."),
  ],
  "denmark": [
    { ...faq("denmark", "اجازه کار دانشجویی دانمارک چگونه تعیین می‌شود؟", "How is Danish student work permission determined?", "کار به شرایط مجوز اقامت بستگی دارد؛ برای دوره‌های دولتیِ تأییدشده، سقف معمول ۹۰ ساعت در ماه از سپتامبر تا مه و تمام‌وقت در تابستان است.", "Permission depends on residence conditions. State-approved programmes normally allow 90 hours monthly September–May and full-time summer work."), verification: { name: "SIRI", url: "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study/Higher-education" } },
    faq("denmark", "GO2TR کدام دانشگاه‌های دانمارک را پیشنهاد می‌کند؟", "Which Danish universities does GO2TR highlight?", "کپنهاگ، آلبورگ و آرهوس از دانشگاه‌های معرفی‌شده هستند.", "Copenhagen, Aalborg and Aarhus are among the highlighted universities."),
    faq("denmark", "برآورد ماهانه هزینه زندگی دانشجو در دانمارک چیست؟", "What monthly Danish student living costs are estimated?", "GO2TR حدود ۵٬۵۹۳ تا ۸٬۹۴۹ کرون را ذکر می‌کند؛ هزینه واقعی به شهر و شیوه زندگی وابسته است.", "GO2TR estimates DKK 5,593–8,949; actual costs depend on city and lifestyle."),
  ],
  "new-zealand": [
    faq("newzealand", "پس از تحصیل نیوزلند چه مسیر کاری وجود دارد؟", "What work route is available after New Zealand study?", "برای واجدان شرایط، ویزای کار پس از تحصیل یک تا سه ساله مطرح است؛ اقامت دائم خودکار نیست.", "Eligible graduates may obtain one-to-three-year post-study work visas; permanent residence is not automatic."),
    faq("newzealand", "دانشجوی نیوزلند در طول ترم چقدر می‌تواند کار کند؟", "How much can New Zealand students work during term?", "واجدان شرایط تا ۲۵ ساعت هفتگی؛ بعضی تعطیلات تمام‌وقت و برای دکتری معمولاً بدون سقف ساعتی.", "Eligible students: up to 25 hours weekly, full-time in some holidays; doctoral students generally have no hourly limit."),
    faq("newzealand", "خانواده دانشجو می‌تواند به نیوزلند همراه او بیاید؟", "Can family accompany students?", "همسر و فرزندان زیر ۱۸ سال، در صورت احراز شرایط.", "Partners and under-18 children, if eligible."),
    faq("newzealand", "کدام مقطع نیوزلند فرصت بورسیه بیشتری دارد؟", "Which level offers more scholarships?", "فرصت‌های مختلفی وجود دارد؛ GO2TR دکتری را مناسب‌تر می‌داند.", "GO2TR highlights doctoral study among available funding opportunities."),
    faq("newzealand", "چه زمانی درخواست ویزای تحصیلی نیوزلند را آماده کنم؟", "When should I prepare a New Zealand student visa application?", "پیشنهاد GO2TR اقدام دست‌کم سه ماه پیش از شروع دوره است.", "Apply at least three months before study."),
  ],
};
