import type { Locale } from "./site-content";

type Localized = Record<Locale, string>;
export type DestinationFaqItem = {
  question: Localized;
  answer: Localized;
  source: { name: string; url: string };
};
const source = (name: string, url: string) => ({ name, url });
const faq = (qFa: string, qEn: string, aFa: string, aEn: string, reference: DestinationFaqItem["source"]): DestinationFaqItem => ({
  question: { fa: qFa, en: qEn }, answer: { fa: aFa, en: aEn }, source: reference,
});
const canadaAdmission = source("EduCanada", "https://www.educanada.ca/study-plan-etudes/university-universite.aspx?lang=eng");
const canadaApplication = source("EduCanada", "https://www.educanada.ca/start-commencez/step-3-etape.aspx?lang=eng");
const canadaPermit = source("IRCC", "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html");
const germanyAdmission = source("Make it in Germany", "https://www.make-it-in-germany.com/en/study-vocational-training/studies-in-germany/requirements");
const germanyVisa = source("Make it in Germany", "https://www.make-it-in-germany.com/en/visa-residence/types/studying");
const ukVisa = source("GOV.UK", "https://www.gov.uk/student-visa");
const ukCourse = source("GOV.UK", "https://www.gov.uk/student-visa/course");
const ukLanguage = source("GOV.UK", "https://www.gov.uk/student-visa/knowledge-of-english");
const italy = source("Universitaly", "https://www.universitaly.it/it/first-steps");
const netherlandsAdmission = source("Study in NL", "https://www.studyinnl.org/plan-your-stay/admission-requirements");
const netherlandsPermit = source("IND", "https://ind.nl/en/residence-permits/study/student-residence-permit-for-university-or-higher-professional-education");
const australia = source("Study Australia", "https://www.studyaustralia.gov.au/en/plan-your-move/visa-application-process");
const australiaHealth = source("Study Australia", "https://www.studyaustralia.gov.au/en/plan-your-move/overseas-student-health-cover-oshc.html");
const swedenAdmission = source("University Admissions", "https://www.universityadmissions.se/en/entry-requirements/");
const swedenPermit = source("Migrationsverket", "https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html");
const finlandAdmission = source("Study in Finland", "https://www.studyinfinland.fi/admissions");
const finlandFunding = source("Study in Finland", "https://www.studyinfinland.fi/funding-your-studies");
const denmarkLanguage = source("Study in Denmark", "https://studyindenmark.dk/study-options/how-to-apply/language-requirements");
const denmarkPermit = source("SIRI · New to Denmark", "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study/Higher-education");
const newZealand = source("Immigration New Zealand", "https://www.immigration.govt.nz/visas/fee-paying-student-visa/");
const newZealandApplication = source("Immigration New Zealand", "https://www.immigration.govt.nz/study/study-visas/visas-for-studying-in-new-zealand/");

// Original bilingual summaries of the linked official guidance, reviewed 2026-10-05.
// Avoid fixed fees, processing promises and universal requirements where exceptions apply.
export const destinationFaqs: Record<string, readonly DestinationFaqItem[]> = {
  canada: [
    faq("برای تحصیل در کانادا چه زبان‌هایی پذیرفته می‌شوند؟", "Which study languages are available in Canada?", "دوره‌ها می‌توانند انگلیسی یا فرانسوی باشند؛ دانشگاه، مدرک زبان و شرایط پذیرش همان دوره را تعیین می‌کند.", "Courses may use English or French. Each university sets its programme’s language evidence and admission requirements.", canadaAdmission),
    faq("آیا همه دانشگاه‌ها مهلت اپلای یکسانی دارند؟", "Do universities share an application deadline?", "خیر؛ مهلت و مدارک هر دانشگاه متفاوت است. پیش از ارسال درخواست، صفحه پذیرش دوره را بررسی کنید.", "No. Deadlines and documents vary by institution. Check your programme’s admissions page before applying.", canadaApplication),
    faq("نامه پذیرش، همان مجوز تحصیل است؟", "Is an acceptance letter a study permit?", "خیر؛ نامه پذیرش دانشگاه یکی از مدارک درخواست مجوز تحصیل است و به‌تنهایی اجازه تحصیل نمی‌دهد.", "No. The institution’s acceptance letter supports a study-permit application; it does not itself authorise study.", canadaPermit),
    faq("آیا PAL یا TAL برای همه لازم است؟", "Does everyone need a PAL or TAL?", "بیشتر متقاضیان به تأییدیه استانی یا قلمرویی نیاز دارند، اما استثنا وجود دارد؛ برای کبک، الزامات CAQ را هم بررسی کنید.", "Most applicants need provincial or territorial attestation, with exceptions. For Quebec, also check the CAQ requirements.", canadaPermit),
    faq("علاوه بر پذیرش، چه مدارکی آماده کنم؟", "What should I prepare besides acceptance?", "مدارک هویتی و تمکن مالی لازم‌اند؛ معاینه پزشکی، گواهی پلیس یا مدارک تکمیلی ممکن است بسته به پرونده درخواست شوند.", "Prepare identity and financial evidence. Medical exams, police certificates or additional documents may be required depending on your case.", canadaPermit),
  ],
  germany: [
    faq("آیا حتماً باید اشتودیِن‌کولگ بگذرانم؟", "Will I need a Studienkolleg?", "به اعتبار مدرک قبلی بستگی دارد؛ برخی متقاضیان پیش از ورود به دانشگاه به دوره آمادگی و ارزیابی نیاز دارند.", "It depends on your previous qualification. Some applicants need a preparatory course and assessment before university entry.", germanyAdmission),
    faq("تحصیل به انگلیسی در آلمان ممکن است؟", "Can I study in English in Germany?", "بله؛ برای دوره انگلیسی معمولاً اثبات زبان آلمانی لازم نیست، اما شرایط زبان همان دانشگاه ملاک است.", "Yes. English-taught programmes generally do not require German evidence; the institution’s own language requirements apply.", germanyAdmission),
    faq("درخواست را به دانشگاه بدهم یا uni-assist؟", "Should I apply directly or through uni-assist?", "دانشگاه مسیر درخواست را مشخص می‌کند؛ برخی از uni-assist استفاده می‌کنند و برخی درخواست مستقیم می‌پذیرند.", "Follow the university’s application route: some use uni-assist, while others accept direct applications.", germanyAdmission),
    faq("تمکن مالی فقط با حساب مسدودشده ممکن است؟", "Is a blocked account the only funding proof?", "خیر؛ بورسیه یا تعهدنامه رسمی حمایت مالی هم می‌تواند پذیرفته شود؛ شرایط و مبلغ جاری را بررسی کنید.", "No. A scholarship or formal declaration of commitment may also qualify. Check current conditions and amounts.", germanyVisa),
    faq("پذیرش دانشگاه برای ویزای تحصیلی کافی است؟", "Is university admission enough for a study visa?", "خیر؛ علاوه بر پذیرش، تأمین هزینه زندگی و شرایط زبان مطرح‌اند. نیاز به ویزا به تابعیت شما بستگی دارد.", "No. Funding and language conditions also apply. Whether you need an entry visa depends on your nationality.", germanyVisa),
  ],
  "united-kingdom": [
    faq("CAS چیست و چه کسی آن را صادر می‌کند؟", "What is a CAS and who issues it?", "مؤسسه دارای مجوز اسپانسر، تأییدیه پذیرش تحصیلی CAS را صادر می‌کند؛ شماره آن برای درخواست ویزای Student لازم است.", "A licensed student sponsor issues a Confirmation of Acceptance for Studies. Its reference is needed for a Student visa application.", ukCourse),
    faq("آیا اثبات زبان فقط با یک آزمون ممکن است؟", "Is a language test the only proof route?", "خیر؛ روش اثبات انگلیسی به شرایط شما بستگی دارد و در برخی دوره‌های دانشگاهی، خود مؤسسه می‌تواند زبان را ارزیابی کند.", "No. Evidence routes depend on your circumstances; eligible degree-level sponsors may assess your English themselves.", ukLanguage),
    faq("برای ویزا چه هزینه‌هایی را در نظر بگیرم؟", "Which costs should I plan for the visa?", "علاوه بر شهریه و زندگی، هزینه درخواست و معمولاً هزینه خدمات سلامت را در بودجه لحاظ کنید؛ مبالغ جاری را بررسی کنید.", "Budget for tuition, living costs, the application fee and usually the healthcare surcharge. Check current amounts.", ukVisa),
    faq("آیا می‌توانم حین تحصیل کار کنم؟", "Can I work while studying?", "امکان و محدودیت کار به دوره و شرایط ویزا بستگی دارد؛ پیش از شروع کار، مجوزهای ثبت‌شده برای خودتان را بررسی کنید.", "Work permission and limits depend on your course and visa conditions. Check your own permission before starting work.", ukVisa),
    faq("آیا پذیرش از هر مؤسسه‌ای قابل استفاده است؟", "Can admission from any institution support a Student visa?", "برای مسیر Student، باید پیشنهاد دوره از مؤسسه دارای مجوز اسپانسر داشته باشید و سایر شرایط ویزا را هم احراز کنید.", "The Student route requires an offer from a licensed sponsor, alongside the other visa requirements.", ukVisa),
  ],
  italy: [
    faq("می‌توانم در ایتالیا به انگلیسی تحصیل کنم؟", "Can I study in English in Italy?", "بله؛ زبان و مدرک موردنیاز را در صفحه دوره بررسی کنید.", "Yes. Check the programme’s language and evidence requirements.", italy),
    faq("آیا آزمون ورودی لازم است؟", "Will I need an entrance test?", "به دوره بستگی دارد؛ دانشگاه ممکن است مدرک، نمرات، آزمون یا مصاحبه را ارزیابی کند.", "It depends on the course. Institutions may assess qualifications, grades, tests or interviews.", italy),
    faq("پیش‌ثبت‌نام Universitaly را از کجا شروع کنم؟", "How do I start Universitaly pre-enrolment?", "ابتدا با دانشگاه هماهنگ کنید؛ سپس درخواست و مدارک تعیین‌شده را در Universitaly ثبت کنید.", "Contact your university first, then submit its specified application and documents through Universitaly.", italy),
    faq("تأیید پیش‌ثبت‌نام، ویزا را تضمین می‌کند؟", "Does validated pre-enrolment guarantee a visa?", "خیر؛ بررسی و صدور ویزا بر عهده نمایندگی کنسولی است و تصمیمی جداگانه دارد.", "No. The consular authority makes a separate visa decision.", italy),
    faq("بعد از ورود چه کاری باقی می‌ماند؟", "What remains after arrival?", "در صورت نیاز، برای مجوز اقامت اقدام کنید و ثبت‌نام نهایی دانشگاه را طبق راهنمای آن تکمیل کنید.", "Where required, apply for a residence permit and complete the university’s final enrolment steps.", italy),
  ],
  netherlands: [
    faq("معادل‌بودن مدرک من را چه کسی بررسی می‌کند؟", "Who assesses my previous qualification?", "مؤسسه شرایط پذیرش را تعیین می‌کند و می‌تواند از ارزیابی Nuffic کمک بگیرد؛ تصمیم نهایی با مؤسسه است.", "The institution sets admission requirements and may use Nuffic’s assessment. It makes the final admission decision.", netherlandsAdmission),
    faq("چه نمره زبانی برای هلند لازم است؟", "What language score do I need in the Netherlands?", "نمره و آزمون قابل قبول را دانشگاه و دوره مشخص می‌کنند؛ یک حدنصاب مشترک برای همه دوره‌ها وجود ندارد.", "Accepted tests and scores are programme-specific. Check your institution rather than assuming a universal threshold.", netherlandsAdmission),
    faq("اگر هنوز شرایط پذیرش را نداشته باشم چه؟", "What if I do not meet entry requirements yet?", "ممکن است دوره آمادگی به شما پیشنهاد شود؛ امکان و شرایط آن را از دانشگاه بپرسید.", "A preparatory programme may be an option. Ask the institution about availability and eligibility.", netherlandsAdmission),
    faq("درخواست اقامت تحصیلی را چه کسی ارسال می‌کند؟", "Who submits the student residence application?", "در این مسیر، مؤسسه آموزشیِ اسپانسر شناخته‌شده درخواست را برای شما به IND ارائه می‌کند.", "For this route, the recognised sponsoring institution submits your application to IND.", netherlandsPermit),
    faq("برای اقامت، هر نوع دوره‌ای پذیرفته می‌شود؟", "Does any course qualify for this residence route?", "این مسیر به تحصیل تمام‌وقت در دوره معتبر و مؤسسه اسپانسر شناخته‌شده نیاز دارد؛ تمکن مالی هم بررسی می‌شود.", "This route requires full-time accredited study with a recognised sponsor, alongside sufficient financial resources.", netherlandsPermit),
  ],
  australia: [
    faq("نامه پیشنهاد همان CoE است؟", "Is an offer letter the same as a CoE?", "خیر؛ پس از پذیرش پیشنهاد و پرداخت ودیعه، مؤسسه تأیید ثبت‌نام CoE را صادر می‌کند.", "No. After accepting the offer and paying the deposit, the provider issues a Confirmation of Enrolment.", australia),
    faq("آیا مدرک زبان برای ویزا لازم است؟", "Is language evidence needed for the visa?", "ممکن است نتیجه آزمون انگلیسی تأییدشده لازم باشد؛ الزامات پرونده خود را بررسی کنید.", "An approved English-test result may be required. Check the evidence requirements for your case.", australia),
    faq("معیار Genuine Student درباره چیست؟", "What does Genuine Student assess?", "درباره پیشینه، انتخاب دوره و استرالیا، و فایده تحصیل برای آینده خود توضیح می‌دهید.", "You explain your background, course and country choices, and how studying supports your future.", australia),
    faq("OSHC چه نقشی دارد؟", "What is OSHC for?", "بیمه سلامت دانشجویان خارجی است و طبق الزامات ویزا باید پوشش مناسب دوران اقامت داشته باشید.", "It is overseas student health cover. Arrange coverage for your stay under the visa requirements.", australiaHealth),
    faq("تمکن مالی چه هزینه‌هایی را پوشش می‌دهد؟", "What should my funding cover?", "شهریه، زندگی و سفر را لحاظ کنید؛ هزینه واقعی می‌تواند از حداقل تعیین‌شده بیشتر باشد.", "Include tuition, living and travel costs. Actual expenses may exceed the official minimum.", australia),
  ],
  sweden: [
    faq("پذیرش سوئد چه نوع شرایطی دارد؟", "What admission requirements apply in Sweden?", "هم شرایط عمومی مقطع و هم پیش‌نیازهای اختصاصی دوره را باید احراز کنید؛ صفحه همان دوره را بخوانید.", "Meet both the study level’s general requirements and the programme’s specific prerequisites.", swedenAdmission),
    faq("دوره انگلیسی هم اثبات زبان می‌خواهد؟", "Do English-taught courses require English evidence?", "بله؛ شرایط اثبات انگلیسی برای دوره‌های انگلیسی‌زبان اعمال می‌شود و روش قابل قبول را باید بررسی کنید.", "Yes. English-taught programmes have English requirements; check which evidence is accepted.", swedenAdmission),
    faq("شهریه را قبل از درخواست اقامت بپردازم؟", "Must I pay tuition before applying for residence?", "اگر مشمول شهریه هستید، پرداخت موردنیاز پیش از درخواست اقامت لازم است تا پذیرش شما نهایی محسوب شود.", "If tuition applies, the required payment must precede your residence application for admission to count as final.", swedenPermit),
    faq("تمکن مالی برای چه مدتی لازم است؟", "How long must my maintenance funds cover?", "برای کل دوره‌ای که مجوز اقامت درخواست می‌کنید؛ همراهان نیز باید تأمین مالی کافی داشته باشند.", "For the entire requested permit period. Accompanying family members also need sufficient maintenance.", swedenPermit),
    faq("بیمه برای دوره کوتاه‌تر از یک سال چطور است؟", "What insurance is needed for studies under one year?", "بیمه جامع سلامت لازم است؛ اگر دانشگاه پوشش نمی‌دهد، برای بیمه شخصی مطابق الزامات اقدام کنید.", "Comprehensive health insurance is required. Arrange compliant personal coverage if your institution does not provide it.", swedenPermit),
  ],
  finland: [
    faq("درخواست پذیرش فنلاند را کجا ثبت کنم؟", "Where do I apply to study in Finland?", "درگاه رسمی Studyinfo مسیر درخواست مشترک یا جداگانه دوره‌ها را نشان می‌دهد؛ دستورالعمل همان دوره را دنبال کنید.", "The official Studyinfo portal lists joint and separate application routes. Follow your programme’s instructions.", finlandAdmission),
    faq("همه دوره‌ها زمان درخواست یکسان دارند؟", "Do all programmes have the same application dates?", "خیر؛ بازه درخواست و مراحل پذیرش به دوره و نوع درخواست بستگی دارد؛ تاریخ‌های Studyinfo را بررسی کنید.", "No. Dates and procedures vary by programme and application route. Check the Studyinfo listing.", finlandAdmission),
    faq("آیا تحصیل انگلیسی رایگان است؟", "Is English-taught study free?", "دانشجویان خارج از EU، EEA و سوئیس معمولاً برای کارشناسی و ارشد انگلیسی شهریه می‌پردازند؛ استثناها را بررسی کنید.", "Students outside the EU, EEA and Switzerland generally pay tuition for English-taught bachelor’s and master’s programmes; check exemptions.", finlandFunding),
    faq("بورسیه دانشگاه هزینه زندگی را هم می‌دهد؟", "Does a university scholarship cover living costs?", "معمولاً بورسیه‌ها برای شهریه‌اند و رقابتی هستند؛ هزینه زندگی را جداگانه تأمین کنید.", "University scholarships usually target tuition and are competitive. Plan separate funding for living expenses.", finlandFunding),
    faq("چه زمانی برای اقامت تحصیلی اقدام کنم؟", "When should I apply for student residence?", "برای متقاضیان مشمول، پس از پذیرش رسمی نوبت درخواست اقامت است؛ بیمه و محل زندگی را هم برنامه‌ریزی کنید.", "Where required, apply after official admission. Also plan your insurance and accommodation.", finlandAdmission),
  ],
  denmark: [
    faq("حدنصاب زبان انگلیسی در دانمارک یکسان است؟", "Is the English threshold the same everywhere in Denmark?", "خیر؛ سطح و نمره معادل را مؤسسه مشخص می‌کند و بعضی دوره‌ها سطح بالاتری می‌خواهند.", "No. Institutions set equivalent scores, and some programmes require a higher level.", denmarkLanguage),
    faq("هر دوره‌ای برای اقامت تحصیلی مناسب است؟", "Does every programme qualify for student residence?", "شرایط مسیر اقامت را با نوع دوره و وضعیت تأیید مؤسسه تطبیق دهید؛ صرف ثبت‌نام کافی نیست.", "Check the residence route against the programme and institution’s approval status. Enrolment alone is insufficient.", denmarkPermit),
    faq("فرم ST1 را چه کسی شروع می‌کند؟", "Who starts the ST1 application?", "در درخواست آنلاین، مؤسسه بخش اول را تکمیل می‌کند و سپس شما بخش مربوط به خود را ادامه می‌دهید.", "For an online application, the institution completes its part first, then you complete yours.", denmarkPermit),
    faq("آیا صورت‌حساب والدین برای تمکن کافی است؟", "Is a parent’s bank statement enough for maintenance?", "برای اثبات تمکن از دارایی شخصی، حساب باید به نام خودتان و پول قابل دسترس باشد؛ استثناهای مسیر را بررسی کنید.", "For personal-funds evidence, money must be accessible in your own account. Check the route’s exemptions.", denmarkPermit),
    faq("آیا اطلاعات بیومتریک هم لازم است؟", "Are biometrics required?", "برای پرونده اقامت، اطلاعات بیومتریک ثبت می‌شود؛ محل و مهلت مراجعه را در راهنمای درخواست بررسی کنید.", "Residence applications require biometrics. Check the application guidance for where and when to attend.", denmarkPermit),
  ],
  "new-zealand": [
    faq("با پذیرش مشروط می‌توانم درخواست بدهم؟", "Can I apply with a conditional offer?", "از خارج نیوزیلند ممکن است بررسی اولیه انجام شود؛ تأیید نهایی ویزا به پیشنهاد بدون شرط نیاز دارد.", "Offshore applications may receive approval in principle; final visa approval requires an unconditional offer.", newZealand),
    faq("چه کسی آمادگی زبان و تحصیل را بررسی می‌کند؟", "Who checks academic and English readiness?", "مؤسسه آموزشی تأیید می‌کند که توان علمی و انگلیسی لازم برای دوره را دارید.", "Your education provider confirms that your academic and English skills suit the course.", newZealand),
    faq("تمکن مالی شامل چه مواردی است؟", "What funding must I demonstrate?", "شهریه، هزینه زندگی و امکان خروج از کشور را پوشش دهید؛ مدارک جاری را بررسی کنید.", "Show funding for tuition, living costs and leaving the country. Check current evidence requirements.", newZealand),
    faq("بیمه درمان و سفر لازم است؟", "Do I need health and travel insurance?", "معمولاً پوشش مورد قبول مؤسسه لازم است؛ دانشجویان دکتری استثنا دارند. شرایط پرونده را بررسی کنید.", "Provider-approved cover is normally required, with a PhD exception. Check your specific conditions.", newZealand),
    faq("درخواست ویزای Fee Paying Student را کجا بدهم؟", "Where do I apply for a Fee Paying Student Visa?", "درخواست از طریق درگاه آنلاین Immigration New Zealand ثبت می‌شود؛ مدارک را پیش از شروع آماده کنید.", "Apply through Immigration New Zealand’s online portal. Prepare the required evidence before starting.", newZealandApplication),
  ],
};
