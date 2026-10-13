import type { Locale } from "./site-content";

type Localized = Record<Locale, string>;
export type DestinationFaqItem = {
  question: Localized;
  answer: Localized;
  verification?: { name: string; url: string };
};
const faq = (qFa: string, qEn: string, aFa: string, aEn: string): DestinationFaqItem => ({
  question: { fa: qFa, en: qEn }, answer: { fa: aFa, en: aEn },
});

// Country FAQs. Research provenance is retained in docs/content-provenance.
// Estimates vary by institution and programme.
export const destinationFaqs: Record<string, readonly DestinationFaqItem[]> = {
  "canada": [
    faq("آیا بورسیه می‌تواند هزینه تحصیل کانادا را پوشش دهد؟", "Can scholarships cover Canadian study costs?", "آموزش کاملاً رایگان عمومی نیست؛ بورسیه و فاند می‌توانند هزینه‌ها را کاهش دهند.", "Universal free study is unavailable; scholarships and funding can reduce costs."),
    faq("دانشجو در کانادا امکان اشتغال دارد؟", "Can students take jobs in Canada?", "کار پاره‌وقت ممکن است؛ باید شرایط مجوز تحصیل و کار خود را رعایت کنید.", "Part-time employment is possible, subject to your study and work permissions."),
    faq("کانادا چه فرصت‌هایی برای دانشجو فراهم می‌کند؟", "What opportunities does Canada offer students?", "آموزش معتبر، کار دانشجویی و مسیرهای پس از فارغ‌التحصیلی از مزیت‌های مطرح‌شده‌اند.", "Highlighted benefits include quality education, student employment and post-graduation pathways."),
    faq("بورسیه کانادایی ممکن است مشمول مالیات شود؟", "Could Canadian scholarships be taxable?", "وضعیت مالیاتی بورسیه به شرایط کمک‌هزینه و مقررات مربوط بستگی دارد.", "Tax treatment depends on the scholarship conditions and applicable rules."),
    faq("برای پذیرش کانادا چه معدلی مناسب است؟", "What grades support admission in Canada?", "در برآورد اولیه، معدل ۱۴ تا ۱۵ مطرح است؛ دانشگاه و رشته ممکن است نمره بالاتری بخواهند.", "An indicative range is 14–15/20; institutions and programmes may require more."),
  ],
  "germany": [
    faq("معدل مورد انتظار دانشگاه‌های آلمان چقدر است؟", "What grades do German universities expect?", "حدود ۱۴ تا ۱۵ و برای دانشگاه‌های رقابتی ۱۶ به بالا به‌عنوان برآورد اولیه مطرح است؛ معیار ثابت نیست.", "Indicative grades are roughly 14–15/20, or 16+ for competitive institutions; requirements vary."),
    faq("کدام شهرهای آلمان برای دانشجو محبوب‌اند؟", "Which German cities are popular with students?", "برلین، مونیخ، هامبورگ و کلن به‌دلیل دانشگاه‌ها و فرصت‌های شغلی معرفی شده‌اند.", "Berlin, Munich, Hamburg and Cologne are highlighted for universities and employment opportunities."),
    faq("سن بالاتر مانع ورود به کارشناسی آلمان است؟", "Does older age prevent German undergraduate admission?", "سقف سنی رسمی مشخصی ذکر نشده؛ مسیر تحصیلی منطقی و هدف روشن اهمیت دارند.", "No fixed official upper age is stated; a coherent study plan matters."),
    faq("مدرک دانشگاه آزاد برای آلمان قابل استفاده است؟", "Are Azad University degrees accepted?", "بله، پس از ارزیابی و تأیید مدرک می‌توان اقدام کرد.", "Yes, if assessed and recognised."),
    faq("با نمرات پایین چگونه شانس پذیرش آلمان را بهتر کنم؟", "How can lower grades be offset in Germany?", "انتخاب دانشگاه مناسب، تقویت رزومه و دوره‌های آمادگی از راهکارهای قابل بررسی هستند.", "Consider suitable institutions, stronger credentials and preparatory study."),
  ],
  "united-kingdom": [
    faq("ارشد در انگلستان معمولاً چند سال طول می‌کشد؟", "How long does a UK master's usually take?", "طول دوره معمولاً یک تا دو سال است؛ مدت دقیق را در صفحه رشته بررسی کنید.", "Typical duration is one to two years; check the specific programme."),
    faq("بدون دیپلم بین‌المللی چه مسیری برای ورود به دانشگاه هست؟", "What entry routes exist without an international diploma?", "مسیرهایی مانند GCSE، سپس A-level یا دوره فاندیشن در منبع مطرح شده‌اند.", "The source discusses routes involving GCSEs, followed by A-levels or foundation study."),
    faq("برای اپلای انگلستان از چه مرحله‌ای شروع کنم؟", "How should I begin a UK study application?", "دانشگاه را انتخاب کنید؛ مدارک، پذیرش، ویزا، بودجه و برنامه سفر را به‌ترتیب آماده کنید.", "Choose an institution, then arrange documents, admission, visa, funding and travel."),
    faq("لندن چه مزیتی برای ادامه تحصیل دارد؟", "What makes London attractive for study?", "دانشگاه‌های شناخته‌شده، شبکه‌سازی حرفه‌ای و فضای چندفرهنگی از مزیت‌های آن هستند.", "Recognised universities, professional networking and a multicultural environment are highlighted."),
    faq("بورسیه کامل در انگلستان امکان‌پذیر است؟", "Is full funding possible in the UK?", "بله؛ بورسیه‌های فول‌فاند می‌توانند هزینه تحصیل را پوشش دهند، در صورت احراز شرایط.", "Yes. Fully funded scholarships can cover study costs when eligibility conditions are met."),
  ],
  "italy": [
    faq("درخواست تحصیل در ایتالیا را چگونه شروع کنم؟", "How do I start an Italian study application?", "دوره مناسب انتخاب کنید و سوابق نمرات و مدرک زبان را برای دانشگاه بفرستید.", "Choose a suitable course and submit academic records and language evidence."),
    faq("چرا ایتالیا بین متقاضیان تحصیل محبوب است؟", "Why do applicants choose Italy?", "هزینه مناسب، اعتبار علمی، بورسیه‌های متنوع و عضویت در شنگن از دلایل معرفی‌شده‌اند.", "Highlighted reasons include affordability, academic reputation, scholarships and Schengen membership."),
    faq("دانشجوی غیراروپایی می‌تواند هزینه تحصیل را با بورسیه پوشش دهد؟", "Can non-European students fund study through scholarships?", "بله؛ دریافت بورسیه مناسب می‌تواند هزینه تحصیل را پوشش دهد.", "Yes. A suitable scholarship can cover study costs."),
    faq("کار پاره‌وقت دانشجویی در ایتالیا چه سقفی دارد؟", "What is Italy's student part-time work limit?", "سقف مطرح‌شده برای کار دانشجویی ۲۰ ساعت در هفته است؛ شرایط مجوز خود را بررسی کنید.", "The stated student employment limit is 20 hours weekly; check your permit conditions."),
    faq("بورسیه‌های ایتالیا بر چه اساسی اعطا می‌شوند؟", "How are Italian scholarships awarded?", "ارزیابی می‌تواند بر پایه شایستگی تحصیلی یا نیاز مالی متقاضی باشد.", "Assessment may depend on academic merit or the applicant's financial need."),
  ],
  "netherlands": [
    faq("برآورد شهریه دانشگاه‌های هلند چقدر است؟", "What are the estimated Dutch tuition fees?", "سالانه برای کارشناسی ۶ تا ۱۵ هزار یورو و ارشد ۸ تا ۲۰ هزار یورو؛ مبلغ دانشگاه را بررسی کنید.", "Annual estimates: €6,000–15,000 for bachelor's and €8,000–20,000 for master's; check actual tuition."),
    faq("برای ورود به دانشگاه هلند آزمون سراسری لازم است؟", "Is a national entrance exam required in the Netherlands?", "معمولاً خیر؛ بعضی رشته‌ها مصاحبه یا نمونه‌کار می‌خواهند.", "Usually not; some programmes request interviews or portfolios."),
    faq("یادگیری و انتخاب واحد در دانشگاه‌های هلند چگونه است؟", "How do learning and electives work in Dutch universities?", "آموزش فعال و پروژه‌محور است؛ در کنار دروس الزامی، واحدهای انتخابی هم ارائه می‌شوند.", "Active, project-based learning combines required courses with elective options."),
    faq("دوره انگلیسی‌زبان در هلند پیدا می‌شود؟", "Are English-taught courses available in the Netherlands?", "بله؛ به‌ویژه در مقاطع ارشد و دکتری، برنامه‌های انگلیسی متعددی وجود دارند.", "Yes; numerous English-taught programmes are available, particularly at master's and doctoral levels."),
    faq("آیا دانشگاه‌های هلند سقف سنی مشخصی دارند؟", "Is there an upper age limit?", "سقف عمومی مشخصی ذکر نشده؛ برای تحصیلات تکمیلی، سوابق بررسی می‌شوند.", "No general limit is stated; postgraduate applications consider previous experience."),
  ],
  "australia": [
    faq("برآورد شهریه سالانه استرالیا چقدر است؟", "What is the estimated annual Australian tuition range?", "بسته به رشته، حدود ۲۴ هزار تا ۹۴٬۰۱۶ دلار استرالیا؛ شهریه دقیق را از دانشگاه بگیرید.", "Approximately AUD 24,000–94,016 depending on the subject; obtain exact tuition from the institution."),
    faq("برای پذیرش استرالیا چگونه زبانم را اثبات کنم؟", "How can I demonstrate English?", "آیلتس و تافل از آزمون‌های مطرح‌شده‌اند.", "IELTS and TOEFL are mentioned."),
    faq("وقفه تحصیلی در پرونده استرالیا یعنی چه؟", "What does a study gap mean in an Australian application?", "فاصله آخرین تحصیل تا درخواست جدید است؛ ممکن است توضیح و مدارک کاری بخواهند.", "It is the interval since previous study; explanations and employment evidence may be requested."),
    faq("برای تحصیل در استرالیا چه نمره آیلتسی مطرح است؟", "What IELTS scores are typically requested in Australia?", "معمولاً ۶٫۵ و برای بعضی دوره‌های ارشد یا دکتری ۷؛ شرط واقعی هر دوره متفاوت است.", "Typically 6.5, or 7 for some postgraduate courses; actual programme requirements vary."),
    faq("دانشگاه‌های استرالیا چه مزیت‌هایی دارند؟", "What benefits do Australian universities offer?", "اعتبار بین‌المللی، امکانات پژوهشی و فرصت‌های شغلی پس از تحصیل از مزیت‌های معرفی‌شده‌اند.", "International recognition, research facilities and post-study employment opportunities are highlighted."),
  ],
  "sweden": [
    faq("دانشگاه‌های سوئد به چه زبان‌هایی آموزش می‌دهند؟", "Which teaching languages are available in Sweden?", "دوره‌ها به انگلیسی یا سوئدی ارائه می‌شوند.", "Courses are offered in English or Swedish."),
    faq("برآورد هزینه دانشگاه در سوئد چقدر است؟", "What are the estimated Swedish tuition fees?", "۸۰ هزار تا ۲۹۵ هزار کرون، بسته به دوره و دانشگاه؛ دکتری بدون شهریه معرفی شده است.", "SEK 80,000–295,000 depending on programme and institution; doctoral study is described as tuition-free."),
    faq("پس از فارغ‌التحصیلی سوئد می‌توان برای یافتن شغل ماند؟", "Can graduates stay in Sweden to seek work?", "فرصت ۱۲ماهه جست‌وجوی کار و سپس تغییر اقامت، مشروط به احراز شرایط مربوط، مطرح است.", "A 12-month job-search opportunity may be available, followed by a residence change if eligible."),
  ],
  "finland": [
    faq("چه مدارکی برای پرونده تحصیلی فنلاند آماده کنم؟", "Which documents should I prepare for Finnish study?", "ترجمه سوابق تحصیلی، مدرک زبان، گذرنامه، انگیزه‌نامه و مدارک مالی در منبع ذکر شده‌اند.", "The source lists translated academic records, language evidence, passport, motivation letter and financial documents."),
    faq("طول کارشناسی در فنلاند چقدر است؟", "How long is a Finnish bachelor's programme?", "مدت سه‌ونیم تا چهارونیم سال مطرح است؛ دوره انتخابی را بررسی کنید.", "An indicative duration is 3.5–4.5 years; check your chosen programme."),
    faq("برآورد شهریه سالانه فنلاند چقدر است؟", "What are the estimated annual Finnish tuition fees?", "حدود ۹ تا ۲۰ هزار یورو؛ مبلغ نهایی به دانشگاه و دوره بستگی دارد.", "Approximately €9,000–20,000; the final amount depends on the institution and course."),
    faq("برای دوره انگلیسی فنلاند چه نمره زبانی مطرح است؟", "What English scores are suggested for Finnish courses?", "آیلتس ۶ تا ۶٫۵ یا تافل ۸۰ تا ۹۰ مطرح است؛ بعضی دانشگاه‌ها معافیت دارند.", "Indicative scores are IELTS 6–6.5 or TOEFL 80–90; some institutions offer exemptions."),
    faq("چه حوزه‌هایی در فنلاند برای تحصیل پیشنهاد شده‌اند؟", "Which fields are highlighted?", "فناوری اطلاعات، مهندسی، علم داده، مدیریت، آموزش و محیط‌زیست.", "IT, engineering, data science, management, education and environment."),
  ],
  "denmark": [
    { ...faq("اجازه کار دانشجویی دانمارک چگونه تعیین می‌شود؟", "How is Danish student work permission determined?", "کار به شرایط مجوز اقامت بستگی دارد؛ برای دوره‌های دولتیِ تأییدشده، سقف معمول ۹۰ ساعت در ماه از سپتامبر تا مه و تمام‌وقت در تابستان است.", "Permission depends on residence conditions. State-approved programmes normally allow 90 hours monthly September–May and full-time summer work."), verification: { name: "SIRI", url: "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study/Higher-education" } },
    faq("کدام دانشگاه‌های دانمارک را می‌توان بررسی کرد؟", "Which Danish universities can students consider?", "کپنهاگ، آلبورگ و آرهوس از دانشگاه‌های معرفی‌شده هستند.", "Copenhagen, Aalborg and Aarhus are among the highlighted universities."),
    faq("برآورد ماهانه هزینه زندگی دانشجو در دانمارک چیست؟", "What monthly Danish student living costs are estimated?", "برآورد اولیه حدود ۵٬۵۹۳ تا ۸٬۹۴۹ کرون است؛ هزینه واقعی به شهر و شیوه زندگی وابسته است.", "An indicative estimate is DKK 5,593–8,949; actual costs depend on city and lifestyle."),
  ],
  "new-zealand": [
    faq("پس از تحصیل نیوزلند چه مسیر کاری وجود دارد؟", "What work route is available after New Zealand study?", "برای واجدان شرایط، ویزای کار پس از تحصیل یک تا سه ساله مطرح است؛ اقامت دائم خودکار نیست.", "Eligible graduates may obtain one-to-three-year post-study work visas; permanent residence is not automatic."),
    faq("دانشجوی نیوزلند در طول ترم چقدر می‌تواند کار کند؟", "How much can New Zealand students work during term?", "واجدان شرایط تا ۲۵ ساعت هفتگی؛ بعضی تعطیلات تمام‌وقت و برای دکتری معمولاً بدون سقف ساعتی.", "Eligible students: up to 25 hours weekly, full-time in some holidays; doctoral students generally have no hourly limit."),
    faq("خانواده دانشجو می‌تواند به نیوزلند همراه او بیاید؟", "Can family accompany students?", "همسر و فرزندان زیر ۱۸ سال، در صورت احراز شرایط.", "Partners and under-18 children, if eligible."),
    faq("کدام مقطع نیوزلند فرصت بورسیه بیشتری دارد؟", "Which level offers more scholarships?", "فرصت‌های مختلفی وجود دارد؛ فرصت‌های تأمین مالی دوره‌های دکتری را نیز بررسی کنید.", "Doctoral study is among the funding opportunities to explore."),
    faq("چه زمانی درخواست ویزای تحصیلی نیوزلند را آماده کنم؟", "When should I prepare a New Zealand student visa application?", "برای برنامه‌ریزی اولیه، اقدام دست‌کم سه ماه پیش از شروع دوره پیشنهاد می‌شود.", "Apply at least three months before study."),
  ],
};
