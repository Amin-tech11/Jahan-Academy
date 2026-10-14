import type { BlogPost } from "./blog-content";
import type { Localized } from "./site-content";

export type BlogGuide = BlogPost & { sections: Localized<Array<{ title: string; body: string }>>; sources: Array<{ title: string; url: string }> };
export const blogGuides: BlogGuide[] = [
  {
    slug: "germany-study-residence-guide",
    type: "guide",
    date: "2026-10-14",
    title: { fa: "راهنمای تحصیل و اقامت آلمان", en: "Germany study and residence guide" },
    excerpt: { fa: "هزینه دانشگاه، تمکن مالی، کار دانشجویی و فرصت‌های پس از فارغ‌التحصیلی؛ هفت نکته برای برنامه‌ریزی تحصیل در آلمان.", en: "University costs, financial evidence, student work and opportunities after graduation: seven steps to planning your studies in Germany." },
    sections: {
      fa: [
        { title: "آلمان برای تحصیل؛ چه چیزهایی باید بدانید؟", body: "انتخاب مقصد فقط به شهریه وابسته نیست. این راهنمای هفت‌بخشی، بر اساس تصاویر جهان آکادمی، هزینه دانشگاه، بودجه زندگی و مسیر بعد از تحصیل را کنار هم قرار می‌دهد تا تصمیم را با شرایط خودتان بسنجید." },
        { title: "تحصیل رایگان، به معنی بدون هزینه نیست", body: "در بسیاری از دوره‌های کارشناسی و کارشناسی ارشد دانشگاه‌های دولتی شهریه دریافت نمی‌شود؛ اما سهم خدمات دانشجویی هر ترم (Semester Contribution) جداست. دانشگاه‌های خصوصی و بعضی دوره‌ها یا دانشگاه‌های دولتی شهریه دارند. هزینه رشته و دانشگاه هدف را جداگانه بررسی کنید." },
        { title: "هزینه دانشگاه و استثناهای شهریه", body: "بازه راهنمای سهم هر ترم حدود ۷۰ تا ۴۳۰ یورو است و مبلغ دقیق را دانشگاه اعلام می‌کند. در بادن‌وورتمبرگ، بسیاری از دانشجویان خارج از اتحادیه اروپا با شهریه ۱٬۵۰۰ یورو در هر ترم روبه‌رو هستند؛ معافیت‌ها و نوع دوره مهم‌اند. برخی دانشگاه‌های بایرن نیز برای دانشجویان خارج از EU/EEA شهریه تعیین می‌کنند." },
        { title: "تمکن مالی ویزای تحصیلی در سال ۲۰۲۶", body: "برای مسیر تحصیل با پذیرش، حداقل تمکن اعلام‌شده سال ۲۰۲۶ معادل ۱۱٬۹۰۴ یورو برای یک سال، یا ۹۹۲ یورو در ماه است. حساب مسدودشده (Sperrkonto) یکی از روش‌های اثبات است. این پول برای زندگی است، نه شهریه؛ آن را دوباره روی همان بودجه زندگی جمع نزنید. شرایط و مبلغ روز را پیش از درخواست از مرجع رسمی ویزا بررسی کنید." },
        { title: "کار در حین تحصیل", body: "برای دانشجویان مشمول مقررات اقامت تحصیلی، امکان کار تا ۱۴۰ روز کامل یا ۲۸۰ نیم‌روز در سال، یا تا ۲۰ ساعت در هفته پیش‌بینی شده است. این‌ها سهمیه‌های قابل جمع نیستند؛ شرایط مجوز و نوع کار را بررسی کنید. درآمد احتمالی کار دانشجویی را تنها پشتوانه مالی برنامه تحصیل قرار ندهید." },
        { title: "بعد از فارغ‌التحصیلی", body: "پس از اتمام موفق تحصیل در آلمان، در صورت احراز شرایط می‌توان برای اقامت جست‌وجوی کار تخصصی تا ۱۸ ماه اقدام کرد. یافتن شغل واجد شرایط می‌تواند مسیر درخواست اقامت کاری یا EU Blue Card را باز کند؛ تبدیل اقامت خودکار نیست و شرایط مجوز جدید باید احراز شود." },
        { title: "از کجا شروع کنید؟", body: "ابتدا بودجه دانشگاه، زندگی، بیمه، سفر و هزینه‌های اولیه را بنویسید و امکان ارائه تمکن را بسنجید. سپس رشته‌ها، زبان تدریس، مدارک و مهلت‌های دانشگاه‌های هدف را بررسی کنید. برای ارزیابی اولیه رایگان، شرایط خود را از طریق فرم مشاوره جهان آکادمی ارسال کنید." }
      ],
      en: [
        { title: "Germany for study: what should you know?", body: "Tuition is only one part of choosing a destination. Based on Jahan Academy’s seven-part series, this guide brings university costs, living budgets and post-study plans together so you can assess the route against your circumstances." },
        { title: "Tuition-free does not mean cost-free", body: "Many Bachelor’s and Master’s courses at public universities do not charge tuition. A semester contribution is separate. Private institutions and some public programmes or universities charge fees, so check your chosen course individually." },
        { title: "University costs and tuition exceptions", body: "Semester contributions are roughly €70–430; your university sets the actual amount. Many non-EU students in Baden-Württemberg pay €1,500 tuition per semester, subject to exemptions and course type. Some Bavarian institutions also charge non-EU/EEA students tuition." },
        { title: "Financial evidence for a study visa in 2026", body: "For studying with admission, the stated 2026 minimum is €11,904 for a year, equivalent to €992 monthly. A blocked account (Sperrkonto) is one proof option. This funds living costs, not tuition; do not count it twice in the same living budget. Confirm current requirements with the visa authority before applying." },
        { title: "Working during your studies", body: "Students covered by study-residence rules may work up to 140 full or 280 half days annually, or up to 20 hours weekly. These are not cumulative allowances: check your permit and employment category. Do not rely solely on prospective student earnings to fund your studies." },
        { title: "After graduation", body: "Eligible graduates of German institutions can apply for up to 18 months to seek skilled employment. A qualifying job may enable an application for a skilled-worker permit or EU Blue Card. Conversion is not automatic; the new permit’s conditions must be met." },
        { title: "Where to begin", body: "Plan university and living costs, insurance, travel and initial expenses, and check how you will demonstrate your funds. Then review courses, teaching languages, documents and university deadlines. Send your circumstances through Jahan Academy’s consultation form for a free initial assessment." }
      ]
    },
    sources: [
      { title: "DAAD — Costs of education and living", url: "https://www.daad.de/en/studying-in-germany/living-in-germany/finances/" },
      { title: "German Federal Government — Visa for studying", url: "https://www.make-it-in-germany.com/en/visa-residence/types/studying" }
    ]
  },
  {
    slug: "netherlands-study-residence-guide",
    type: "guide",
    date: "2026-10-13",
    title: { fa: "راهنمای تحصیل و اقامت هلند", en: "Netherlands study and residence guide" },
    excerpt: { fa: "از انتخاب دانشگاه پژوهش‌محور یا علوم کاربردی تا پذیرش، تمکن مالی و مسیر ویزا و اقامت تحصیلی هلند.", en: "Choosing a research or applied sciences university, applying, proving financial resources and preparing for student residence." },
    sections: {
      fa: [
        { title: "برای تحصیل در هلند، فقط پذیرش کافی نیست", body: "پیش از اپلای، سه موضوع را کنار هم بررسی کنید: نوع دانشگاه، بودجه و تمکن مالی، و مسیر ویزا و اقامت. پذیرش تحصیلی به‌تنهایی به معنی صدور اجازه اقامت نیست. این راهنما بر اساس مجموعه پنج‌قسمتی جهان آکادمی، مراحل اصلی تصمیم‌گیری را مرور می‌کند." },
        { title: "دانشگاه‌های WO و HBO و مسیر پذیرش", body: "دانشگاه‌های پژوهش‌محور (WO) بر آموزش آکادمیک و پژوهش تمرکز دارند؛ دانشگاه‌های علوم کاربردی (HBO) بر آموزش حرفه‌ای و عملی تأکید می‌کنند. برنامه‌های انگلیسی‌زبان هم وجود دارند، اما شرایط زبان، مدارک و مهلت هر رشته متفاوت است. ثبت درخواست برای بسیاری از برنامه‌ها از طریق Studielink انجام می‌شود؛ دستورالعمل دانشگاه و صفحه همان برنامه را بررسی کنید و شرایط یک دانشگاه را به همه دانشگاه‌ها تعمیم ندهید." },
        { title: "تمکن مالی؛ مبلغ و روش‌های اثبات در سال ۲۰۲۶", body: "مبلغ ماهانه study norm برای دانشگاه و آموزش عالی حرفه‌ای در سال ۲۰۲۶ برابر ۱٬۱۳۰٫۷۷ یورو است؛ برای ۱۲ ماه، ۱۳٬۵۶۹٫۲۴ یورو. شهریه جدا از این مبلغ است و این رقم، برآورد کامل هزینه زندگی شخصی شما نیست. روش‌های اثبات می‌تواند شامل حساب شخصی، واریز به حساب مؤسسه آموزشی، بورسیه یا حمایت مالی شخص یا شرکت باشد. مدارک و روش قابل قبول را با دانشگاه هماهنگ کنید. مبلغ هر سال تغییر می‌کند؛ پیش از اقدام، رقم مربوط به سال درخواست را در IND بررسی کنید." },
        { title: "مسیر ویزا و اقامت تحصیلی", body: "برای متقاضیانی که به اجازه اقامت تحصیلی نیاز دارند، ابتدا پذیرش و شرایط دانشگاه بررسی می‌شود. مؤسسه آموزشیِ دارای تأییدیه اسپانسر IND، درخواست اقامت را ارائه می‌کند. مدارک هویتی، مالی و سایر مدارک لازم را پیش از ارسال پرونده آماده کنید. نیاز به ویزای ورود MVV به تابعیت و شرایط فرد بستگی دارد؛ در صورت نیاز، مؤسسه درخواست MVV و اقامت را هم‌زمان ثبت می‌کند. پس از تأیید، مراحل دریافت ویزا، سفر و تحویل کارت اقامت را طبق دستورالعمل رسمی انجام دهید. تصمیم نهایی با مراجع رسمی هلند است." },
        { title: "آیا هلند انتخاب مناسبی برای شماست؟", body: "انتخاب مناسب به سوابق تحصیلی، بودجه، توان ارائه تمکن و هدف تحصیلی و شغلی شما بستگی دارد. نوع آموزش WO یا HBO را با مسیر آینده خود هماهنگ کنید و علاوه بر شهریه، هزینه مسکن، بیمه، سفر و مراحل اداری را در نظر بگیرید. برای ارزیابی اولیه رایگان، اطلاعات و شرایط خود را از طریق فرم مشاوره جهان آکادمی ارسال کنید." }
      ],
      en: [
        { title: "Admission is only one part of studying in the Netherlands", body: "Before applying, consider the institution type, your budget and financial evidence, and the visa and residence process together. Admission alone does not grant a residence permit. This guide follows Jahan Academy’s five-part series to help you plan your next steps." },
        { title: "WO, HBO and university applications", body: "Research universities (WO) focus on academic education and research. Universities of applied sciences (HBO) emphasise professional and practical education. English-taught programmes are available, but each programme sets its own language, document and deadline requirements. Many applications begin through Studielink; follow the institution’s instructions and the specific programme page. Do not assume one university’s conditions apply everywhere." },
        { title: "Financial resources: the 2026 study norm", body: "The 2026 study norm for university or higher professional education is €1,130.77 per month, or €13,569.24 for 12 months. Tuition is additional, and this figure is not a complete personal living-cost estimate. Evidence may include your own bank account, a deposit with the institution, a scholarship, or financial support from a person or company. Confirm acceptable documents and arrangements with your institution. The amount changes annually; check the IND figure for your application year before proceeding." },
        { title: "The student visa and residence process", body: "If you need a student residence permit, first meet the institution’s admission requirements. An educational institution recognised by the IND as a sponsor submits the residence application. Prepare identity, financial and other required documents before submission. Whether you need an MVV entry visa depends on nationality and circumstances; where required, the institution applies for the MVV and residence permit together. After approval, follow official instructions for the visa, travel and collecting your residence document. Dutch authorities make the final decision." },
        { title: "Is the Netherlands right for you?", body: "Your academic background, budget, financial evidence and study and career goals should guide the decision. Match WO or HBO education to your future plans, and budget for housing, insurance, travel and administrative costs as well as tuition. Submit your circumstances through Jahan Academy’s consultation form for a free initial assessment." }
      ]
    },
    sources: [
      { title: "Study in NL — Dutch education", url: "https://www.studyinnl.org/dutch-education/bachelors" },
      { title: "Study in NL — How to apply", url: "https://www.studyinnl.org/plan-your-stay/how-to-apply" },
      { title: "IND — Required amounts", url: "https://ind.nl/en/required-amounts-income-requirements" },
      { title: "IND — Income requirements for study", url: "https://ind.nl/en/income-requirements-study" },
      { title: "IND — Student residence permit", url: "https://ind.nl/en/residence-permits/study/student-residence-permit-for-university-or-higher-professional-education" }
    ]
  },
  {
    "slug": "uk-study-visa-guide",
    "type": "guide",
    "date": "2026-10-12",
    "title": {
      "fa": "راهنمای تحصیل و ویزای انگلستان",
      "en": "UK study and Student visa guide"
    },
    "excerpt": {
      "fa": "از تعیین مقطع، رشته و بودجه تا پذیرش، CAS، تمکن مالی و بررسی شرایط همراه.",
      "en": "From choosing your degree, subject and budget to admission, CAS, financial evidence and dependants."
    },
    "sections": {
      "fa": [
        {
          "title": "تحصیل و ویزای انگلستان؛ مسیر را از کجا شروع کنیم؟",
          "body": "ابتدا هدف تحصیلی، زمان شروع دوره و شرایط خود را مشخص کنید. الزامات پذیرش دانشگاه و درخواست ویزای Student دو مرحله مرتبط با شرایط جداگانه هستند."
        },
        {
          "title": "گام اول: مقطع، رشته و بودجه",
          "body": "پیش از انتخاب دانشگاه، مقطع، رشته و بودجه خود را تعیین کنید. سپس دانشگاه‌هایی را بررسی کنید که شرایط پذیرش و زبان آن‌ها با سوابق شما هم‌خوانی دارد. شهریه، زندگی، ویزا و هزینه خدمات درمانی را در بودجه لحاظ کنید."
        },
        {
          "title": "ابتدا پذیرش دانشگاه، سپس درخواست ویزا",
          "body": "ابتدا برای دوره مناسب درخواست پذیرش بدهید. پس از تکمیل شرایط دانشگاه و دریافت Confirmation of Acceptance for Studies یا CAS، می‌توانید برای ویزای Student اقدام کنید. مدارک موردنیاز، به‌ویژه مدارک مالی، را از قبل آماده کنید و الزامات زبان و مدارک تکمیلی را از منابع رسمی بررسی کنید."
        },
        {
          "title": "تمکن مالی و مدت نگهداری وجه",
          "body": "در صورت الزام به ارائه تمکن، باید شهریه پرداخت‌نشده درج‌شده در CAS و هزینه زندگی موردنیاز را پوشش دهید. میزان هزینه زندگی برای لندن و خارج از لندن متفاوت است. در حالت معمول، وجه باید ۲۸ روز متوالی نگهداری شده باشد و پایان این دوره بیش از ۳۱ روز پیش از تاریخ درخواست نباشد. مبلغ جاری و استثناهای پرونده را در GOV.UK بررسی کنید."
        },
        {
          "title": "آیا همسر یا فرزند می‌تواند همراه شود؟",
          "body": "امکان همراه برای همه دانشجویان وجود ندارد. معمولاً دانشجوی دارای حمایت مالی دولتی برای دوره بیش از شش ماه، یا دانشجوی تمام‌وقت دوره تحصیلات تکمیلی حداقل نه‌ماهه می‌تواند مشمول باشد؛ برای دوره‌های جدید تحصیلات تکمیلی، دکتری یا مدرک عالی پژوهش‌محور شرط مهمی است. نوع دوره، زمان شروع، رابطه خانوادگی و تمکن جداگانه همراه باید دقیق بررسی شوند."
        }
      ],
      "en": [
        {
          "title": "Studying in the UK: where to start",
          "body": "This guide follows Jahan Academy’s five-part series. Clarify your study goal, start date and circumstances. University admission and the Student visa are connected stages with separate requirements."
        },
        {
          "title": "First decide your degree, subject and budget",
          "body": "Choose your qualification level, subject and budget before shortlisting universities. Match entry and language requirements to your background. Include tuition, living expenses, visa fees and the immigration health surcharge."
        },
        {
          "title": "University admission before the visa application",
          "body": "Apply for an appropriate course first. After meeting the institution’s conditions and receiving a Confirmation of Acceptance for Studies (CAS), prepare your Student visa application. Arrange financial evidence early and check official language and supporting-document requirements."
        },
        {
          "title": "Financial evidence and the holding period",
          "body": "Where financial evidence is required, cover unpaid tuition shown on the CAS and the required living costs. London and outside-London amounts differ. Funds normally need to be held for 28 consecutive days, ending no more than 31 days before application. Check current figures and exemptions on GOV.UK."
        },
        {
          "title": "Can your partner or children accompany you?",
          "body": "Not every student can bring dependants. Eligible categories generally include government-sponsored students on courses longer than six months, or full-time postgraduate students on courses of at least nine months. New postgraduate courses must meet the doctorate or research-based higher-degree condition. Check course type, start date, family relationship and separate maintenance requirements."
        }
      ]
    },
    "sources": [
      {
        "title": "GOV.UK — Student visa",
        "url": "https://www.gov.uk/student-visa"
      },
      {
        "title": "GOV.UK — Money you need",
        "url": "https://www.gov.uk/student-visa/money"
      },
      {
        "title": "GOV.UK — Your partner and children",
        "url": "https://www.gov.uk/student-visa/family-members"
      }
    ]
  },
  {
    "slug": "italy-study-guide",
    "type": "guide",
    "date": "2026-10-12",
    "title": {
      "fa": "راهنمای جامع تحصیل در ایتالیا",
      "en": "Studying in Italy: a practical guide"
    },
    "excerpt": {
      "fa": "مقاطع و رشته‌ها، زبان برنامه، بورسیه‌ها، هزینه‌ها و مراحل انتخاب مسیر تحصیلی.",
      "en": "Degrees and subjects, teaching language, scholarships, costs and planning your application."
    },
    "sections": {
      "fa": [
        {
          "title": "راهنمای تحصیل در ایتالیا؛ تصویر کلی",
          "body": "این راهنما برای متقاضیان کارشناسی و کارشناسی ارشد تنظیم شده است. پیش از تصمیم‌گیری، برنامه رسمی دانشگاه، الزامات پذیرش و مسیر ویزا را بررسی کنید. شرایط و ظرفیت دانشگاه‌ها یکسان نیستند."
        },
        {
          "title": "مقاطع و رشته‌ها",
          "body": "رشته‌هایی مانند معماری و طراحی، مهندسی، هنر و میراث فرهنگی، اقتصاد و مدیریت و علوم انسانی از گزینه‌های مطرح برای بررسی هستند. علاقه، سوابق تحصیلی و هدف شغلی را مبنای انتخاب بگذارید؛ ارائه هر رشته و ظرفیت آن به دانشگاه و سال پذیرش وابسته است."
        },
        {
          "title": "زبان تحصیل و شرایط برنامه",
          "body": "برخی برنامه‌ها به انگلیسی و برخی به ایتالیایی ارائه می‌شوند. زبان و سطح مدرک موردنیاز را صفحه رسمی همان برنامه تعیین می‌کند. پیش از اقدام، مدارک تحصیلی، ترجمه‌ها، آزمون احتمالی، مدرک زبان و مهلت ارسال را بررسی کنید."
        },
        {
          "title": "بورسیه و هزینه‌ها",
          "body": "مسیرهای قابل بررسی شامل بورسیه دولتی، حمایت‌های منطقه‌ای موسوم به DSU و بورسیه دانشگاهی هستند. دریافت حمایت مالی تضمینی نیست و شرایط هر فراخوان متفاوت است. علاوه بر شهریه، هزینه اقامت، خوراک، بیمه و رفت‌وآمد را برآورد کنید. مدارک مالی و خانوادگی، مهلت‌ها و شرایط واجدصلاحیت‌بودن را از مرجع اعطاکننده بخوانید."
        },
        {
          "title": "مسیر اقدام و چک‌لیست تصمیم",
          "body": "چهار موضوع را کنار هم بررسی کنید: مقطع و رشته، زبان برنامه، بودجه و هزینه‌ها، و هدف پس از تحصیل. دانشگاه و برنامه را انتخاب کنید، درخواست پذیرش و در صورت نیاز پیش‌ثبت‌نام Universitaly را انجام دهید، سپس الزامات ویزا را پیگیری کنید. تأیید دانشگاه یا پیش‌ثبت‌نام به‌تنهایی به معنای صدور ویزا نیست؛ منابع رسمی و مهلت‌ها را ذخیره کنید."
        }
      ],
      "en": [
        {
          "title": "Studying in Italy: the overview",
          "body": "This guide brings together the supplied five-part series for bachelor’s and master’s applicants. Review the official programme, admission requirements and visa route before deciding. Requirements and capacity vary across institutions."
        },
        {
          "title": "Degrees and subjects",
          "body": "Architecture and design, engineering, art and cultural heritage, economics and management, and humanities are examples to explore. Use your interests, academic background and career goals to choose. Availability and places depend on the institution and intake."
        },
        {
          "title": "Teaching language and programme requirements",
          "body": "Programmes may be taught in English or Italian. The official programme page sets the required language and evidence. Check academic documents, translations, possible entrance tests, language certificates and application deadlines before applying."
        },
        {
          "title": "Scholarships and costs",
          "body": "Explore government scholarships, regional student support often called DSU, and university awards. Funding is not guaranteed; each call has its own criteria. Budget for tuition, accommodation, food, insurance and transport. Consult the awarding body for financial and household documents, deadlines and eligibility."
        },
        {
          "title": "Application route and decision checklist",
          "body": "Compare degree and subject, teaching language, total budget and post-study goals together. Select your programme, apply for admission and complete Universitaly pre-enrolment where required, then follow the visa process. University acceptance or pre-enrolment does not itself guarantee a visa. Save official sources and deadlines."
        }
      ]
    },
    "sources": [
      {
        "title": "Universitaly — First steps",
        "url": "https://www.universitaly.it/first-steps"
      },
      {
        "title": "Study in Italy — Scholarships",
        "url": "https://studyinitaly.esteri.it/"
      },
      {
        "title": "Universitaly — International students",
        "url": "https://www.universitaly.it/studenti-stranieri"
      }
    ]
  },
  {
    "slug": "austria-study-guide",
    "type": "guide",
    "date": "2026-10-12",
    "title": {
      "fa": "راهنمای تحصیل در اتریش؛ از کارشناسی تا دکتری",
      "en": "Studying in Austria: bachelor’s to doctorate"
    },
    "excerpt": {
      "fa": "پذیرش کارشناسی، کارشناسی ارشد و دکتری، زبان آلمانی و دوره‌های آمادگی با پذیرش مشروط.",
      "en": "Bachelor’s, master’s and doctoral admission, German language and conditional preparation programmes."
    },
    "sections": {
      "fa": [
        {
          "title": "مسیرهای تحصیل در اتریش",
          "body": "اتریش مسیرهای متفاوتی برای کارشناسی، کارشناسی ارشد، دکتری و دوره‌های آمادگی دارد. شرایط پذیرش، زبان و مدارک هر مقطع را جداگانه بررسی کنید و برای ارزیابی اولیه، سوابق تحصیلی و وضعیت زبان خود را آماده داشته باشید."
        },
        {
          "title": "کارشناسی؛ زبان و اعتبار مدرک",
          "body": "بسیاری از برنامه‌های کارشناسی به آلمانی ارائه می‌شوند. اعتبار مدرک دبیرستان و شرایط پذیرش باید برای هر دانشگاه و رشته بررسی شود. ممکن است آزمون ورودی یا امتحانات تکمیلی لازم باشد. برای یادگیری زبان و آماده‌سازی مدارک، زودتر برنامه‌ریزی کنید."
        },
        {
          "title": "کارشناسی ارشد؛ تناسب سوابق و برنامه",
          "body": "برنامه‌های آلمانی‌زبان و انگلیسی‌زبان وجود دارند. زبان موردنیاز را خود برنامه تعیین می‌کند. مدرک کارشناسی مرتبط، محتوای دروس قبلی و دیگر معیارهای برنامه در بررسی پذیرش مؤثرند. مهلت متقاضیان خارج از اتحادیه اروپا ممکن است متفاوت یا زودتر باشد؛ صفحه رسمی رشته را پیش از انتخاب بررسی کنید."
        },
        {
          "title": "دکتری؛ پژوهش، استاد راهنما و تأمین مالی",
          "body": "پذیرش دکتری ممکن است نیازمند موضوع پژوهشی و هماهنگی با استاد راهنما باشد. رزومه علمی، طرح پژوهش و سوابق مرتبط اهمیت دارند. تأمین مالی به فرصت مشخص، گروه پژوهشی و شرایط دانشگاه وابسته است و از پذیرش تحصیلی به‌تنهایی نتیجه نمی‌شود. ساختار پذیرش و فرایند یافتن استاد را از دانشگاه مقصد بپرسید."
        },
        {
          "title": "زبان آلمانی و پذیرش مشروط",
          "body": "در برخی مسیرها، دانشگاه پذیرش را به گذراندن امتحانات تکمیلی مشروط می‌کند. شرکت در دوره آمادگی رسمی معمولاً به نامه پذیرش دارای این شروط نیاز دارد؛ برای دوره‌های آلمانی‌زبان، حداقل A2 می‌تواند شرط ورود به مسیر آمادگی باشد. مدت، شهریه و شرایط سنی را برای همان دوره بررسی کنید؛ شرایط یک دوره را به همه برنامه‌های اتریش تعمیم ندهید. هزینه زندگی و سایر مخارج نیز جداگانه محاسبه می‌شوند."
        }
      ],
      "en": [
        {
          "title": "Study routes in Austria",
          "body": "Austria offers bachelor’s, master’s, doctoral and preparation pathways. This guide follows the five supplied images. Check admission, language and document requirements separately for each qualification, and prepare your academic and language background for an initial assessment."
        },
        {
          "title": "Bachelor’s: language and qualifications",
          "body": "Many bachelor’s programmes are taught in German. Each institution assesses school qualifications and subject-specific entry conditions. Entrance or supplementary examinations may be required. Plan early for language study and document preparation."
        },
        {
          "title": "Master’s: matching your academic background",
          "body": "German- and English-taught programmes are available. Each programme sets its language requirements. A relevant bachelor’s degree, prior course content and other programme criteria affect admission. Deadlines for applicants outside the EU may differ or be earlier; check the official programme page."
        },
        {
          "title": "Doctorate: research, supervision and funding",
          "body": "Doctoral admission may require a research topic and coordination with a supervisor. Academic experience, a proposal and relevant research records matter. Funding depends on a specific opportunity, research group and institution; admission alone does not secure it. Check the university’s admission and supervision process."
        },
        {
          "title": "German and conditional preparation",
          "body": "Some admission decisions prescribe supplementary examinations. Official preparation courses generally require an admission letter specifying these conditions; at least A2 German may be required for entry to the German preparation route. Check the actual course duration, fee and age criteria. Do not generalise one course’s criteria to every Austrian programme. Budget separately for living and other costs."
        }
      ]
    },
    "sources": [
      {
        "title": "Study in Austria — Admission",
        "url": "https://studyinaustria.at/en/plan-your-studies/application-and-admission"
      },
      {
        "title": "OeAD — University preparation programmes",
        "url": "https://oead.at/en/to-austria/university-preparation-programmes"
      },
      {
        "title": "University of Vienna — Preparation programme",
        "url": "https://studieren.univie.ac.at/en/applying-for-a-programme/vwu"
      }
    ]
  }
];

export const blogFaq = {
  fa: [
    { question: "تفاوت مقاله، خبر و راهنما چیست؟", answer: "مقاله یک موضوع را توضیح می‌دهد، خبر رویداد را معرفی می‌کند و راهنما مراحل یا معیارهای یک تصمیم را قدم‌به‌قدم مرور می‌کند." },
    { question: "مطالب با چه ترتیبی نمایش داده می‌شوند؟", answer: "ترتیب پیش‌فرض بر اساس تاریخ انتشار، از جدیدترین به قدیمی‌ترین است. در آرشیو می‌توانید ترتیب را تغییر دهید و نوع مطلب را انتخاب کنید." },
    { question: "چطور مطلب موردنظر را پیدا کنم؟", answer: "در کادر جست‌وجو، بخشی از عنوان یا موضوع را بنویسید و از فیلتر مقالات، اخبار یا راهنماها استفاده کنید." },
    { question: "آیا این مطالب جایگزین بررسی شرایط فردی هستند؟", answer: "مطالب برای آشنایی اولیه هستند. شرایط دانشگاه‌ها و مسیر هر فرد متفاوت است؛ اطلاعات مرتبط را از منابع رسمی بررسی کنید و پرسش‌های اختصاصی خود را در مشاوره مطرح کنید." },
  ],
  en: [
    { question: "How do articles, news and guides differ?", answer: "Articles explain a topic, news introduces an event, and guides walk through steps or decision criteria." },
    { question: "How are stories ordered?", answer: "The archive defaults to publication date, newest first. You can change the order and filter by story type." },
    { question: "How can I find a specific story?", answer: "Search for part of a title or topic and use the article, news or guide filters." },
    { question: "Do these stories replace an individual assessment?", answer: "They offer initial orientation. Requirements and individual circumstances differ; verify relevant facts with official sources and discuss your specific questions in consultation." },
  ],
};
