import type { Locale } from "./site-content";

export const universityCountries = [
  { id: "usa", fa: "آمریکا", en: "United States", university: { fa: "مؤسسه فناوری ماساچوست", en: "Massachusetts Institute of Technology" }, url: "https://www.mit.edu/" },
  { id: "canada", fa: "کانادا", en: "Canada", university: { fa: "دانشگاه تورنتو", en: "University of Toronto" }, url: "https://www.utoronto.ca/" },
  { id: "uk", fa: "بریتانیا", en: "United Kingdom", university: { fa: "دانشگاه آکسفورد", en: "University of Oxford" }, url: "https://www.ox.ac.uk/" },
  { id: "france", fa: "فرانسه", en: "France", university: { fa: "دانشگاه سوربن", en: "Sorbonne University" }, url: "https://www.sorbonne-universite.fr/en" },
  { id: "germany", fa: "آلمان", en: "Germany", university: { fa: "دانشگاه فنی مونیخ", en: "Technical University of Munich" }, url: "https://www.tum.de/en/" },
  { id: "austria", fa: "اتریش", en: "Austria", university: { fa: "دانشگاه وین", en: "University of Vienna" }, url: "https://www.univie.ac.at/en/" },
  { id: "italy", fa: "ایتالیا", en: "Italy", university: { fa: "دانشگاه بولونیا", en: "University of Bologna" }, url: "https://www.unibo.it/en" },
  { id: "china", fa: "چین", en: "China", university: { fa: "دانشگاه پکن", en: "Peking University" }, url: "https://english.pku.edu.cn/" },
  { id: "hungary", fa: "مجارستان", en: "Hungary", university: { fa: "دانشگاه سگد", en: "University of Szeged" }, url: "https://u-szeged.hu/english" },
  { id: "turkey", fa: "ترکیه", en: "Türkiye", university: { fa: "دانشگاه فنی خاورمیانه", en: "Middle East Technical University" }, url: "https://www.metu.edu.tr/" },
  { id: "cyprus", fa: "قبرس", en: "Cyprus", university: { fa: "دانشگاه قبرس", en: "University of Cyprus" }, url: "https://www.ucy.ac.cy/" },
  { id: "australia", fa: "استرالیا", en: "Australia", university: { fa: "دانشگاه ملبورن", en: "University of Melbourne" }, url: "https://www.unimelb.edu.au/" },
  { id: "belgium", fa: "بلژیک", en: "Belgium", university: { fa: "دانشگاه لوون", en: "KU Leuven" }, url: "https://www.kuleuven.be/english/" },
  { id: "brazil", fa: "برزیل", en: "Brazil", university: { fa: "دانشگاه سائوپائولو", en: "University of São Paulo" }, url: "https://www5.usp.br/" },
  { id: "chile", fa: "شیلی", en: "Chile", university: { fa: "دانشگاه شیلی", en: "University of Chile" }, url: "https://uchile.cl/" },
  { id: "croatia", fa: "کرواسی", en: "Croatia", university: { fa: "دانشگاه زاگرب", en: "University of Zagreb" }, url: "https://www.unizg.hr/homepage/" },
  { id: "argentina", fa: "آرژانتین", en: "Argentina", university: { fa: "دانشگاه بوئنوس آیرس", en: "University of Buenos Aires" }, url: "https://www.uba.ar/" },
];

export const universityContent = {
  fa: {
    title: "راهنمای دانشگاه‌های جهان",
    intro: "انتخاب دانشگاه از شناخت هدف شما شروع می‌شود: چه رشته‌ای می‌خواهید بخوانید، در چه مقطعی ادامه دهید و چه محیطی برای یادگیری شما مناسب است؟ در جهان آکادمی، این راهنما نقطه شروعی برای بررسی دانشگاه‌ها، مقایسه گزینه‌ها و آماده‌کردن پرسش‌های شما پیش از ارزیابی تحصیلی است.",
    navigation: "در این راهنما",
    sections: ["انواع دانشگاه", "رتبه‌بندی‌ها", "دانشگاه های برتر", "معیارهای انتخاب", "کالج و دانشگاه", "پرسش‌های متداول"],
    types: [
      { title: "دولتی و عمومی", text: "این دانشگاه‌ها با پشتیبانی بخش عمومی فعالیت می‌کنند. هنگام بررسی شهریه، وضعیت دانشجوی بین‌المللی و مقررات همان دانشگاه را در نظر بگیرید؛ عنوان دولتی به‌تنهایی به معنی تحصیل رایگان نیست." },
      { title: "خصوصی", text: "مدیریت و تأمین مالی این مؤسسات مستقل از ساختار دانشگاه‌های دولتی است. هزینه اعلام‌شده، کمک‌هزینه قابل دریافت و اعتبار مؤسسه را کنار هم بررسی کنید." },
      { title: "پژوهش‌محور", text: "فعالیت پژوهشی بخش مهمی از مأموریت این دانشگاه‌هاست. برای انتخاب مسیر پژوهشی، موضوع کار گروه‌ها، استاد راهنما و امکانات مورد نیاز خود را بررسی کنید. پژوهش‌محور بودن با دولتی یا خصوصی بودن قابل جمع است." },
    ],
    rankingIntro: "رتبه دانشگاه یکی از ابزارهای مقایسه است. برای تفسیر آن، نام نظام رتبه‌بندی، سال انتشار و تفاوت رتبه کلی با رتبه رشته را بررسی کنید. جایگاه دانشگاه در یک جدول، به‌تنهایی تناسب آن با هدف تحصیلی شما را مشخص نمی‌کند.",
    rankings: [
      { title: "QS", text: "مقایسه دانشگاه‌ها با توجه به اعتبار علمی، اشتغال‌پذیری و جنبه‌های تجربه دانشجویی و بین‌المللی." },
      { title: "Times Higher Education", text: "ارزیابی محیط آموزش، محیط و کیفیت پژوهش، نگاه بین‌المللی و ارتباط با صنعت." },
      { title: "ShanghaiRanking / ARWU", text: "تمرکز بر عملکرد پژوهشی، پژوهشگران پراستناد، انتشارات علمی و جوایز دانشگاهی." },
    ],
    rankingLink: "مشاهده منبع رسمی",
    countriesIntro: "برای شروع بررسی هر مقصد، یک دانشگاه و پیوند وب‌سایت رسمی آن معرفی شده است. از بخش پذیرش دانشگاه، رشته مورد نظر، زبان تدریس، مدارک، شهریه و زمان‌بندی درخواست را دنبال کنید.",
    officialSite: "وب‌سایت رسمی دانشگاه",
    criteria: [
      { title: "هدف و محتوای آموزشی", text: "رشته و برنامه درسی را با هدف آینده خود هماهنگ کنید." },
      { title: "بودجه واقعی", text: "شهریه و هزینه‌های زندگی را با هم بسنجید." },
      { title: "آمادگی و زمان‌بندی", text: "برای زبان، مدارک و درخواست پذیرش برنامه‌ریزی کنید." },
      { title: "محیط زندگی و یادگیری", text: "شهر، امکانات و خدمات دانشجویی را بررسی کنید." },
    ],
    collegeIntro: "نام کالج و دانشگاه در همه کشورها معنای یکسانی ندارد. برای نمونه، در آمریکا کالج و دانشگاه هر دو می‌توانند آموزش کارشناسی ارائه کنند، در حالی که دانشگاه معمولاً برنامه‌های تحصیلات تکمیلی هم دارد. برای انتخاب، مدرک نهایی و اعتبار دوره را بررسی کنید.",
    comparisonLabels: ["موضوع بررسی", "کالج", "دانشگاه"],
    comparison: [
      ["برنامه آموزشی", "مدرک و مسیر دوره را از مؤسسه بپرسید.", "رشته و مقطع ارائه‌شده را از دانشکده بررسی کنید."],
      ["ادامه تحصیل", "شرایط انتقال یا ورود به مقطع بعد را بررسی کنید.", "پیش‌نیازهای پذیرش در مقطع بعد را بررسی کنید."],
      ["انتخاب نهایی", "عنوان مؤسسه را کنار اعتبار و محتوای دوره بسنجید.", "رتبه دانشگاه را کنار تناسب رشته با هدف خود بسنجید."],
    ],
    faq: [
      { question: "بررسی دانشگاه‌ها را از کجا شروع کنم؟", answer: "ابتدا رشته، مقطع، زبان و بودجه خود را مشخص کنید؛ سپس چند گزینه را در وب‌سایت رسمی دانشگاه‌ها بررسی و پرسش‌های باقی‌مانده را برای ارزیابی تحصیلی آماده کنید." },
      { question: "آیا رتبه بالاتر همیشه انتخاب بهتری است؟", answer: "رتبه را در کنار محتوای رشته، هزینه، شرایط ورود و هدف خود قرار دهید. هنگام مقایسه دو رتبه، سال انتشار و نظام رتبه‌بندی باید یکسان باشند." },
      { question: "شرایط پذیرش را از کجا پیدا کنم؟", answer: "بخش پذیرش و صفحه رشته در وب‌سایت رسمی دانشگاه را بخوانید. اگر نکته‌ای مبهم بود، پرسش خود را با واحد پذیرش همان مؤسسه مطرح کنید." },
      { question: "برای جلسه ارزیابی چه چیزهایی آماده کنم؟", answer: "سوابق تحصیلی، وضعیت زبان، رشته و مقطع مورد نظر، بودجه تقریبی و فهرست دانشگاه‌هایی را که بررسی کرده‌اید آماده کنید تا گفت‌وگو مشخص و کاربردی باشد." },
    ],
    closingTitle: "فهرستتان را به یک مسیر شخصی تبدیل کنید",
    closingText: "اگر چند دانشگاه را بررسی کرده‌اید و در انتخاب قدم بعدی تردید دارید، اطلاعاتتان را در فرم ارزیابی ثبت کنید تا درباره اولویت‌ها و مسیر مناسب شما گفت‌وگو کنیم.",
  },
  en: {
    title: "A guide to universities worldwide",
    intro: "Choosing a university starts with your goals: what you want to study, which degree you want to pursue and where you learn best. This Jahan Academy guide helps you explore institutions, compare options and prepare questions for an academic assessment.",
    navigation: "In this guide",
    sections: ["University types", "Rankings", "Top universities", "Selection criteria", "College and university", "Frequently asked questions"],
    types: [
      { title: "Public institutions", text: "These institutions receive public support. Check the rules and international student fees of each university; public status alone does not imply free tuition." },
      { title: "Private institutions", text: "Their governance and funding differ from public institutions. Consider published costs, available financial aid and institutional recognition together." },
      { title: "Research universities", text: "Research is central to their mission. Explore research groups, potential supervisors and the facilities your work needs. Research universities can be public or private." },
    ],
    rankingIntro: "A ranking is one comparison tool. Check its publisher, edition and whether it ranks the whole institution or a particular subject. A position in a table does not establish whether a university fits your study goals.",
    rankings: [
      { title: "QS", text: "Compares academic reputation, employability and aspects of student experience and international opportunities." },
      { title: "Times Higher Education", text: "Evaluates teaching, research environment and quality, international outlook and industry links." },
      { title: "ShanghaiRanking / ARWU", text: "Focuses on research performance, highly cited researchers, scientific publications and academic awards." },
    ],
    rankingLink: "Visit the official source",
    countriesIntro: "Each destination includes a university and its official website as a starting point. Use its admissions pages to explore your subject, teaching language, documents, fees and application timetable.",
    officialSite: "Official university website",
    criteria: [
      { title: "Goals and curriculum", text: "What would you like to do after graduation? Compare the curriculum, assessment methods and further study routes with that goal." },
      { title: "A realistic budget", text: "Record tuition, housing, travel and insurance for each option. Include financial aid in your plan once its terms and your award are confirmed." },
      { title: "Preparation and timing", text: "Allow time for documents, translations, language preparation and applications. Keep a personal checklist of remaining tasks and each institution's published dates." },
      { title: "Living and learning", text: "Consider the city, institution size, support services, accommodation options and contact with teaching staff alongside your preferences." },
    ],
    collegeIntro: "The terms college and university differ across education systems. In the United States, both can offer undergraduate education, while universities typically also offer graduate programmes. Check the qualification awarded and the recognition of the course.",
    comparisonLabels: ["What to check", "College", "University"],
    comparison: [
      ["Course", "Ask the institution about the qualification and study route.", "Check the subject and degree level with the faculty."],
      ["Further study", "Check transfer and progression arrangements.", "Check the entry requirements for the next degree."],
      ["Final decision", "Consider recognition and curriculum alongside the institution's title.", "Consider subject fit alongside the institution's ranking."],
    ],
    faq: [
      { question: "Where should I start?", answer: "Define your subject, degree level, language and budget. Research a few options on official university websites and prepare any remaining questions for an academic assessment." },
      { question: "Is a higher rank always a better choice?", answer: "Consider curriculum, costs, entry requirements and your goals together. Compare rankings from the same publisher and edition." },
      { question: "Where can I find admission requirements?", answer: "Read the official admissions and subject pages. Ask the institution's admissions team to clarify anything that is unclear." },
      { question: "What should I prepare for an assessment?", answer: "Bring your academic background, language status, preferred subject and degree, approximate budget and a list of institutions you have researched." },
    ],
    closingTitle: "Turn your shortlist into a personal path",
    closingText: "If you have explored several universities and need help choosing the next step, submit the assessment form so we can discuss your priorities and study path.",
  },
} satisfies Record<Locale, unknown>;

export const universityRankingSources = [
  "https://www.topuniversities.com/world-university-rankings",
  "https://www.timeshighereducation.com/world-university-rankings",
  "https://www.shanghairanking.com/rankings/arwu/2025",
];
