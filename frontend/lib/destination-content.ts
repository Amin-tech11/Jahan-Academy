type Localized = { fa: string; en: string };
const text = (fa: string, en: string): Localized => ({ fa, en });

export type Destination = {
  slug: string;
  name: Localized;
  tagline: Localized;
  academics: Localized;
  life: Localized;
  planning: { summary: Localized; tuition: Localized; living: Localized; arrival: Localized; funding: Localized };
  language: Localized;
  currency: string;
  cities: Localized;
  image: string;
  imageLabel: Localized;
  source: string;
  sourceName: string;
};

export const destinations: Destination[] = [
  {
    slug: "canada", name: text("کانادا", "Canada"),
    tagline: text("فصل تازه‌ای از یادگیری، در سرزمین فرصت‌ها", "A new chapter of learning, a world of possibilities"),
    academics: text("از دانشگاه‌های پژوهشی تا کالج‌های کاربردی، مسیرهای گوناگونی برای ادامه تحصیل در کانادا وجود دارد. زبان تدریس، محتوای دوره و امکانات پژوهشی را در وب‌سایت هر دانشگاه بررسی کنید.", "From research universities to applied colleges, Canada offers different routes through higher education. Compare the teaching language, course content and research facilities on each institution’s website."),
    life: text("زندگی دانشجویی در کانادا می‌تواند از یک جمع کوچک در خوابگاه شروع شود؛ جایی که آشنایی با هم‌دانشگاهی‌ها و دسترسی به کلاس و کتابخانه آسان‌تر است. برخی اقامتگاه‌ها اتاق مشترک، آشپزخانه و برنامه غذایی دارند. زندگی بیرون از دانشگاه استقلال بیشتری می‌دهد، اما خرید وسایل، پخت‌وپز و هزینه‌های رفت‌وآمد هم به برنامه روزانه اضافه می‌شود. انجمن دانشجویی دانشگاه می‌تواند برای شناخت گزینه‌های مسکن راهنمای خوبی باشد.", "In Canada, a campus residence can be a starting point for friendships, with classes and the library close by. Some residences offer shared rooms, kitchens and optional meal plans. Living off campus brings more independence, alongside responsibilities such as furnishing a room, cooking and commuting. Your university’s student association can help you explore housing options and settle into everyday student life."),
    planning: {
      summary: text("بودجه کانادا را به دلار کانادا و متناسب با شهر و دانشگاه تنظیم کنید. زمان پرداخت خوابگاه، پوشش بیمه و خدمات همراه اجاره می‌تواند مبلغ موردنیاز شروع ترم را تغییر دهد.", "Plan in Canadian dollars around your city and institution. Residence payment schedules, health coverage and what rent includes can change how much you need at the start of term."),
      tuition: text("شهریه دقیق دوره و هزینه کتاب و لوازم را از دانشگاه بگیرید؛ رقم یک رشته را به همه دوره‌ها تعمیم ندهید.", "Confirm your programme’s tuition and book or equipment costs with the institution; fees differ between courses."),
      living: text("اجاره، خوراک، رفت‌وآمد، تلفن و اینترنت را جدا ثبت کنید و خدماتی را که خوابگاه پوشش می‌دهد دوباره حساب نکنید.", "Separate rent, food, transport, phone and internet, without counting services already included in residence fees twice."),
      arrival: text("برای خوابگاه ممکن است پرداخت سالانه لازم باشد؛ بیمه دانشجویی را نیز متناسب با استان و پوشش دانشگاه بررسی کنید.", "Some residences require annual payment. Check student health insurance against provincial coverage and your institution’s plan."),
      funding: text("پیش از انتخاب نهایی، گزینه‌های بورسیه و مهلتشان را بررسی کنید و فقط کمک‌هزینه تأییدشده را وارد بودجه کنید.", "Explore scholarship options and deadlines before deciding, and include only confirmed awards in your budget."),
    },
    language: text("انگلیسی / فرانسوی", "English / French"), currency: "CAD",
    cities: text("تورنتو، مونترآل، هلیفکس", "Toronto, Montréal, Halifax"),
    image: "/destinations/canada.png", imageLabel: text("چشم‌انداز تورنتو، کانادا", "Toronto skyline, Canada"),
    source: "https://www.educanada.ca/", sourceName: "EduCanada",
  },
  {
    slug: "germany", name: text("آلمان", "Germany"),
    tagline: text("ایده‌های بزرگ، از اینجا آغاز می‌شوند", "Where your next big idea begins"),
    academics: text("دانشگاه‌های پژوهشی و دانشگاه‌های علوم کاربردی، دو مسیر مهم آموزش عالی در آلمان هستند. تناسب مدرک قبلی و زبان موردنیاز هر دوره را پیش از انتخاب بررسی کنید.", "Research universities and universities of applied sciences offer distinct study routes in Germany. Check how your prior qualification and language skills match each course."),
    life: text("در آلمان، زندگی در خوابگاه یا آپارتمان اشتراکی موسوم به «WG» از گزینه‌های رایج دانشجویی است. هم‌خانه شدن فرصتی برای پیدا کردن دوست، تمرین زبان و تقسیم کارهای روزمره فراهم می‌کند. مسکن معمولاً همراه با پذیرش دانشگاه تضمین نمی‌شود، بنابراین جست‌وجو را زود شروع کنید و از دفتر بین‌الملل دانشگاه کمک بگیرید. در کنار درس، می‌توانید زمانی برای ورزش، دیدار دوستان در کافه‌ها و گشت‌وگذار در پارک‌های شهر در نظر بگیرید.", "In Germany, student residences and shared flats, known as WGs, are common housing choices. Sharing a home creates opportunities to make friends, practise the language and share everyday responsibilities. Accommodation is generally not automatic with university admission, so start looking early and ask the international office for guidance. Alongside your studies, make room for sports, meeting friends in cafés and exploring the city’s parks."),
    planning: {
      summary: text("در آلمان، شهریه و سهم خدمات ترمی دو هزینه متفاوت‌اند. برآورد DAAD برای زندگی حدود ۹۰۰ تا ۱۲۰۰ یورو در ماه است؛ اجاره و شهر انتخابی نقش مهمی دارند.", "In Germany, tuition and semester contributions are separate. DAAD estimates living costs at roughly EUR 900–1,200 monthly, with rent and location making a substantial difference."),
      tuition: text("بسیاری از دوره‌های دولتی شهریه ندارند، اما استثناهای ایالتی، دانشگاهی و رشته‌ای وجود دارد؛ مبلغ دوره خود را بررسی کنید.", "Many public programmes have no tuition, but state, institution and programme exceptions apply; check your own course."),
      living: text("سهم ترمی، بیمه، خوراک و حمل‌ونقل را کنار اجاره بنویسید؛ پوشش بلیت حمل‌ونقل در سهم ترمی یکسان نیست.", "Budget for semester contributions, insurance, food and transport alongside rent; transport-ticket coverage varies."),
      arrival: text("هزینه منابع درسی و مخارج شروع اقامت را جدا کنید؛ بودجه واقعی زندگی با مبلغ اثبات تمکن الزاماً برابر نیست.", "Keep study materials and arrival costs separate; actual spending and proof-of-funds requirements are not necessarily equal."),
      funding: text("بورسیه‌ها را زود بررسی کنید و پوشش همه مخارج زندگی را به درآمد احتمالی کار دانشجویی وابسته نکنید.", "Research scholarships early; do not depend on prospective student work to cover all living expenses."),
    },
    language: text("آلمانی / انگلیسی، بسته به دوره", "German / English, by course"), currency: "EUR",
    cities: text("برلین، براونشوایگ، توبینگن", "Berlin, Braunschweig, Tübingen"),
    image: "/destinations/germany.png", imageLabel: text("آلمان، مقصدی برای یادگیری و پژوهش", "Discover Germany"),
    source: "https://www.study-in-germany.com/en/", sourceName: "Study in Germany · DAAD",
  },
  {
    slug: "united-kingdom", name: text("انگلستان", "United Kingdom"),
    tagline: text("سنت دانشگاهی، نگاه رو به آینده", "Academic tradition, a forward-looking future"),
    academics: text("دانشگاه‌های بریتانیا مسیرهای متنوعی در علوم، هنر و پژوهش دارند. ساختار دوره، روش ارزیابی و شرایط ورود را برای هر دانشگاه جداگانه مقایسه کنید.", "UK universities offer varied pathways in science, the arts and research. Compare course structure, assessment methods and entry requirements at each institution."),
    life: text("زندگی دانشجویی در بریتانیا با انجمن‌ها، رویدادهای دانشگاهی و فعالیت‌های فرهنگی پیوند دارد. عضویت در گروه‌های مورد علاقه‌تان راهی برای پیدا کردن دوست و تجربه فعالیت‌های تازه است. موزه‌ها، گالری‌ها، موسیقی و تئاتر هم بخشی از انتخاب‌های اوقات فراغت‌اند؛ برخی مجموعه‌ها ورود رایگان یا تخفیف دانشجویی دارند. اتحادیه دانشجویان و تیم‌های پشتیبانی دانشگاه نیز می‌توانند برای مسائل روزمره، سازگاری با محیط و شناخت خدمات دانشگاه راهنمایتان باشند.", "Student life in the UK combines societies, university events and cultural activities. Joining a group around your interests is a way to meet people and try something new. Museums, galleries, music and theatre offer options for time away from studying, with some venues offering free admission or student discounts. Students’ unions and university support teams can also help with everyday concerns, settling in and finding campus services."),
    planning: {
      summary: text("برای بریتانیا، مدت دوره را همراه با شهریه مقایسه کنید. Study UK زندگی یک دانشجوی بدون همراه را حدود ۱۳۰۰ تا ۱۴۰۰ پوند در لندن و ۹۰۰ تا ۱۳۰۰ پوند در سایر مناطق، در ماه برآورد می‌کند.", "For the UK, compare course duration as well as tuition. Study UK estimates monthly living costs for an unaccompanied student at GBP 1,300–1,400 in London and GBP 900–1,300 elsewhere."),
      tuition: text("شهریه به مقطع و رشته وابسته است؛ دوره‌های آزمایشگاهی و بالینی ممکن است هزینه بیشتری داشته باشند.", "Tuition depends on level and subject; laboratory and clinical programmes may cost more."),
      living: text("در مقایسه خوابگاه و اتاق خصوصی، شمول قبوض، وعده غذایی و هزینه رفت‌وآمد را بررسی کنید.", "Compare halls and private rooms by checking included bills, meals and commuting costs."),
      arrival: text("هزینه درخواست ویزا، خدمات درمانی مهاجرتی و سفر را جدا از شهریه و اجاره برآورد کنید.", "Allow separately for the visa application, immigration health surcharge and travel."),
      funding: text("تخفیف‌های دانشجویی و بورسیه‌ها را بررسی کنید؛ بودجه کل را برای تمام ماه‌های دوره ببندید.", "Explore student discounts and scholarships, and budget for every month of the course."),
    },
    language: text("انگلیسی", "English"), currency: "GBP", cities: text("لندن، دورهام، کاردیف", "London, Durham, Cardiff"),
    image: "/destinations/united-kingdom.png", imageLabel: text("چشم‌اندازی از بریتانیا", "Explore the United Kingdom"), source: "https://study-uk.britishcouncil.org/", sourceName: "Study UK · British Council",
  },
  {
    slug: "italy", name: text("ایتالیا", "Italy"), tagline: text("جایی که دانش و خلاقیت به هم می‌رسند", "Where knowledge meets creativity"),
    academics: text("برای شناخت آموزش عالی ایتالیا، دانشگاه‌ها و مسیرهای هنر و طراحی را در کنار یکدیگر بررسی کنید. زبان تدریس و شیوه پذیرش هر رشته ممکن است متفاوت باشد.", "Explore Italy’s universities alongside its art and design study routes. Teaching languages and admission processes vary by course."),
    life: text("تحصیل در ایتالیا فرصتی است تا زندگی روزمره را در کنار هنر، تاریخ و فرهنگ شهرهای دانشگاهی تجربه کنید. بازدید از فضاهای فرهنگی و آشنایی با محیط شهر می‌تواند بخشی از اوقات فراغت شما باشد. برای اقامت، خوابگاه‌ها و اقامتگاه‌های دانشگاهی را در کنار اجاره خصوصی بررسی کنید؛ بسیاری از دانشگاه‌ها دفتر خدمات مسکن دارند. شرایط دریافت اتاق متفاوت است و ممکن است وضعیت مالی و شایستگی تحصیلی در آن نقش داشته باشد.", "Studying in Italy places everyday life alongside the art, history and culture of its university cities. Exploring cultural spaces and getting to know the city can become part of your time away from studying. For housing, compare university residences with private rentals; many universities have accommodation offices. Room allocation has its own conditions and may take financial circumstances and academic merit into account."),
    planning: {
      summary: text("در ایتالیا، بودجه را برای دانشگاه و شهر مشخص تهیه کنید. شهریه، شرایط کاهش هزینه و حمایت‌های منطقه‌ای یکسان نیست؛ اجاره هم سهم مهمی از مخارج روزمره دارد.", "In Italy, budget for a specific university and city. Tuition reductions and regional support differ, while rent is a major everyday expense."),
      tuition: text("جدول شهریه، اقساط و شرایط معافیت را بخوانید؛ بعضی دانشگاه‌ها، مانند بولونیا، مدارک وضعیت مالی را بررسی می‌کنند.", "Check fee schedules, instalments and exemptions; some universities, such as Bologna, assess financial documentation."),
      living: text("اجاره و قبوض را جدا مقایسه کنید و خوراک، منابع درسی و حمل‌ونقل را به برآورد شهر اضافه کنید.", "Compare rent and utilities separately, then add food, study materials and local transport."),
      arrival: text("مهلت ارائه مدارک مالی و پرداخت اقساط را در تقویم ثبت کنید؛ تأخیر ممکن است هزینه اضافی داشته باشد.", "Track financial-document and instalment deadlines; late payment can incur extra charges."),
      funding: text("کمک‌هزینه، خوابگاه و خدمات غذایی منطقه‌ای را با شرایط همان فراخوان بررسی کنید؛ دریافت آن‌ها تضمین‌شده نیست.", "Check regional grants, housing and meal support against the relevant call; awards are not guaranteed."),
    },
    language: text("ایتالیایی / انگلیسی، بسته به دوره", "Italian / English, by course"), currency: "EUR", cities: text("میلان، تورین، رم", "Milan, Turin, Rome"),
    image: "/destinations/italy.png", imageLabel: text("ایتالیا؛ فرهنگ، هنر و تحصیل", "Explore Italy"), source: "https://studyinitaly.esteri.it/", sourceName: "Study in Italy",
  },
  {
    slug: "netherlands", name: text("هلند", "Netherlands"), tagline: text("نگاهی بین‌المللی به آیندهٔ شما", "An international outlook for your future"),
    academics: text("هلند امکان بررسی دوره‌های انگلیسی‌زبان و مسیرهای پژوهشی و کاربردی را فراهم می‌کند. تفاوت نوع دانشگاه و شیوه یادگیری را هنگام انتخاب دوره در نظر بگیرید.", "Explore English-taught programmes and research or applied study routes in the Netherlands. Consider institution type and learning approach when choosing a course."),
    life: text("در هلند، بخش زیادی از زندگی دانشجویی در خود شهر و بیرون از پردیس جریان دارد. انجمن‌های علمی، ورزشی و بین‌المللی مانند ESN فرصت آشنایی با دانشجویان دیگر و شرکت در برنامه‌های جمعی را فراهم می‌کنند. دوچرخه برای مسیرهای کوتاه و قطار برای سفر بین شهرها از گزینه‌های کاربردی‌اند. موزه‌ها، کانال‌ها و فضاهای طبیعی هم انتخاب‌هایی برای اوقات فراغت هستند. به‌دلیل کمبود مسکن دانشجویی، پیدا کردن محل اقامت را به روزهای آخر موکول نکنید.", "In the Netherlands, much of student life takes place in the city rather than on a separate campus. Academic, sports and international associations such as ESN bring students together. Cycling works well for short journeys, while trains connect city centres. Museums, canals and natural spaces offer ways to spend your free time. Student housing is in short supply, so start arranging accommodation well before your arrival."),
    planning: {
      summary: text("برای هلند، Study in NL مخارج زندگی را حدود ۱۰۰۰ تا ۱۵۰۰ یورو در ماه برآورد می‌کند. شهریه را جدا محاسبه کنید؛ شهر و نوع اتاق روی بودجه ماهانه اثر زیادی دارند.", "Study in NL estimates living expenses at around EUR 1,000–1,500 per month. Budget separately for tuition; location and room type strongly affect monthly spending."),
      tuition: text("شهریه دانشجویان خارج از اتحادیه و منطقه اقتصادی اروپا معمولاً متفاوت است؛ رقم دقیق را از صفحه دوره بگیرید.", "Non-EU/EEA tuition usually differs; use the exact fee listed for your programme."),
      living: text("اجاره، خوراک، بیمه و رفت‌وآمد را تفکیک کنید؛ برای مسیرهای کوتاه، هزینه دوچرخه را با حمل‌ونقل عمومی مقایسه کنید.", "Separate rent, food, insurance and travel; compare cycling with public transport for short journeys."),
      arrival: text("برخی مؤسسات هزینه بررسی درخواست دارند؛ آن را همراه با مخارج اولیه مسکن در بودجه شروع تحصیل لحاظ کنید.", "Some institutions charge application handling fees; include these alongside initial housing expenses."),
      funding: text("مبلغ و مدت بورسیه را دقیق بخوانید؛ برای نمونه، NL Scholarship کل شهریه را پوشش نمی‌دهد.", "Check each scholarship’s amount and duration; the NL Scholarship, for example, does not cover full tuition."),
    },
    language: text("هلندی / انگلیسی، بسته به دوره", "Dutch / English, by course"), currency: "EUR", cities: text("دلفت، آیندهوون، روتردام", "Delft, Eindhoven, Rotterdam"),
    image: "/destinations/netherlands.png", imageLabel: text("چشم‌انداز هلند", "Explore the Netherlands"), source: "https://www.studyinnl.org/", sourceName: "Study in NL · Nuffic",
  },
  {
    slug: "australia", name: text("استرالیا", "Australia"), tagline: text("افق‌های تازه، تجربه‌های ماندگار", "New horizons, lasting experiences"),
    academics: text("برای تحصیل در استرالیا، دوره و دانشگاه را در کنار شهر محل تحصیل مقایسه کنید. پیش‌نیازها، تقویم آموزشی و امکانات دانشجویان بین‌المللی را از مرجع رسمی دانشگاه بخوانید.", "Compare courses and institutions alongside your preferred Australian city. Check prerequisites, academic calendars and international student support with the university."),
    life: text("زندگی دانشجویی در استرالیا معمولاً با برنامه‌های آشنایی آغاز می‌شود؛ فرصتی برای شناخت پردیس، مسیر رفت‌وآمد و دیدار با دانشجویان محلی و بین‌المللی. باشگاه‌های ورزشی، گروه‌های فرهنگی و انجمن‌های سرگرمی به شما کمک می‌کنند جمع مورد علاقه‌تان را پیدا کنید. در طول ترم هم ممکن است برنامه‌هایی مانند شب فیلم، گفت‌وگوی زبان و جشنواره‌های فرهنگی برگزار شود. برای آگاهی از فعالیت‌ها و خدمات پشتیبانی، تقویم رویدادها و وب‌سایت دانشگاه خود را دنبال کنید.", "Student life in Australia often begins with orientation: a chance to explore campus, learn your commute and meet local and international students. Sports clubs, cultural groups and hobby societies help you find people with shared interests. During the term, providers may organise film nights, language conversations and multicultural events. Follow your institution’s event calendar and website to discover activities and the support available to help you settle in."),
    planning: {
      summary: text("در استرالیا، بودجه را به دلار استرالیا و براساس شهر، محل اقامت و سطح تحصیل بسازید. ابزار رسمی هزینه زندگی برای مقایسه سبک‌های مختلف اقامت و رفت‌وآمد مفید است.", "Budget in Australian dollars for your city, accommodation and study level. The official living-cost calculator helps compare housing and transport choices."),
      tuition: text("شهریه را با دانشگاه تأیید کنید؛ تجهیزات، منابع آموزشی یا لباس کار بعضی دوره‌ها ممکن است جداگانه محاسبه شوند.", "Confirm tuition with your provider; some courses have extra equipment, material or workwear costs."),
      living: text("در اجاره، شمول آب، برق و اینترنت را بررسی کنید؛ اقامتگاه دانشگاهی و خانه اشتراکی را با هزینه نهایی مقایسه کنید.", "Check whether rent includes utilities and internet; compare university housing and shared rentals by total cost."),
      arrival: text("ودیعه مسکن و بیمه درمانی دانشجویان خارجی، OSHC، را از ابتدا در برنامه پرداخت بگنجانید.", "Include the housing bond and Overseas Student Health Cover (OSHC) in your initial payment plan."),
      funding: text("بودجه را براساس هزینه واقعی شهر تنظیم کنید؛ حداقل مالی ویزا ممکن است تمام مخارج زندگی را پوشش ندهد.", "Use actual local expenses for your budget; the visa financial minimum may not cover your living costs."),
    },
    language: text("انگلیسی", "English"), currency: "AUD", cities: text("کانبرا، آدلاید، پرت", "Canberra, Adelaide, Perth"),
    image: "/universities/australian-national-university.jpg", imageLabel: text("دانشگاه ملی استرالیا، کانبرا", "Australian National University, Canberra"), source: "https://www.studyaustralia.gov.au/", sourceName: "Study Australia",
  },
  {
    slug: "sweden", name: text("سوئد", "Sweden"), tagline: text("برای پرسیدن، ساختن و متفاوت فکر کردن", "Space to question, create and think differently"),
    academics: text("در بررسی دانشگاه‌های سوئد، از محتوای دوره و زمینه‌های پژوهشی شروع کنید. زبان تدریس، پیش‌نیازهای رشته و زمان درخواست را برای گزینه‌های خود جداگانه بررسی کنید.", "Start exploring Swedish universities through course content and research areas. Check the teaching language, prerequisites and application schedule for each option."),
    life: text("در سوئد، آشنایی با زندگی روزمره اغلب با «فیکا» همراه می‌شود؛ زمانی برای نوشیدن قهوه یا چای و گفت‌وگو با دوستان. علاقه به طبیعت و برنامه‌های فرهنگی هم بخشی از سبک زندگی است و می‌تواند به برنامه‌های جمعی شما تنوع بدهد. ارتباط به زبان انگلیسی در بسیاری از موقعیت‌ها امکان‌پذیر است. آب‌وهوا در شمال و جنوب کشور تفاوت دارد، پس برای پوشاک و فعالیت‌های بیرون از خانه، شرایط شهر محل تحصیل را در نظر بگیرید.", "In Sweden, getting to know everyday life often includes fika: taking time for coffee or tea and conversation with friends. An interest in nature and cultural traditions offers more ways to spend time together. English is widely spoken, which can make everyday communication easier for international students. Weather differs between the north and south, so plan your clothing and outdoor activities around the city where you will study."),
    planning: {
      summary: text("در سوئد، بودجه را به کرون سوئد و بر پایه اجاره واقعی تهیه کنید. نمونه‌های دانشجویی KTH نشان می‌دهند نوع مسکن و سبک زندگی تفاوت زیادی ایجاد می‌کنند و یک بودجه ثابت برای همه مناسب نیست.", "In Sweden, budget in SEK using actual housing costs. KTH’s student examples show substantial differences by accommodation and lifestyle, rather than one budget that fits everyone."),
      tuition: text("وضعیت پرداخت شهریه و هزینه درخواست را با توجه به تابعیت و معافیت‌های احتمالی در University Admissions بررسی کنید.", "Check tuition and application-fee liability, including nationality and possible exemptions, through University Admissions."),
      living: text("اجاره، خوراک، رفت‌وآمد و بیمه را جدا بنویسید و مشخص کنید آب، گرمایش و اینترنت داخل اجاره هستند یا نه.", "Itemise rent, food, transport and insurance, checking whether utilities and internet are included."),
      arrival: text("برای ودیعه، وسایل خانه و اقامت موقت احتمالی پول کنار بگذارید و زود وارد صف مسکن شوید.", "Set aside funds for deposits, household items and possible temporary housing; join housing queues early."),
      funding: text("آشپزی در خانه، خرید دست‌دوم و تخفیف‌های دانشجویی می‌توانند هزینه را کم کنند؛ مقداری ذخیره برای مخارج پیش‌بینی‌نشده نگه دارید.", "Home cooking, second-hand shopping and student discounts can lower costs; retain a buffer for unexpected expenses."),
    },
    language: text("سوئدی / انگلیسی، بسته به دوره", "Swedish / English, by course"), currency: "SEK", cities: text("استکهلم، گوتنبرگ", "Stockholm, Gothenburg"),
    image: "/universities/kth-royal-institute-of-technology.jpg", imageLabel: text("مؤسسه سلطنتی فناوری، استکهلم", "KTH Royal Institute of Technology, Stockholm"), source: "https://studyinsweden.se/", sourceName: "Study in Sweden",
  },
  {
    slug: "finland", name: text("فنلاند", "Finland"), tagline: text("فضایی برای یادگیری و کشف توانایی‌ها", "Room to learn and discover your potential"),
    academics: text("دانشگاه‌ها و دانشگاه‌های علوم کاربردی فنلاند را بر اساس هدف تحصیلی خود مقایسه کنید. برای انتخاب مسیر مناسب، محتوای دوره و زبان آموزش را بخوانید.", "Compare Finland’s universities and universities of applied sciences against your study goals. Review course content and teaching languages to find a suitable route."),
    life: text("زندگی دانشجویی در فنلاند ترکیبی از استقلال در یادگیری، همکاری با دیگران و زمانی برای استراحت است. فضای آموزشی غیررسمی و مشارکتی، فرصت گفت‌وگو و تبادل ایده را فراهم می‌کند. انعطاف در برنامه تحصیل می‌تواند به شما کمک کند میان درس و زندگی شخصی تعادل برقرار کنید و زمانی هم برای تجربه طبیعت فنلاند داشته باشید. تجربه روزمره هر دانشجو متفاوت است؛ برنامه‌ای متناسب با حجم درس و علایق خود بسازید.", "Student life in Finland combines independent learning, collaboration and time to unwind. An informal study environment encourages discussion and exchanging ideas. Flexible study options can help you balance academic work with personal interests and leave time to explore Finnish nature. Each student’s routine will be different, so build a schedule that fits your workload while making space for the activities you enjoy."),
    planning: {
      summary: text("راهنمای رسمی فنلاند برای زندگی حدود ۹۰۰ تا ۱۲۰۰ یورو در ماه پیشنهاد می‌کند. شهریه جداست و بورسیه‌های دانشگاهی معمولاً برای کاهش شهریه‌اند، نه پرداخت همه مخارج زندگی.", "Finland’s official guide suggests about EUR 900–1,200 monthly for living costs. Tuition is separate, and university scholarships usually reduce tuition rather than cover everyday expenses."),
      tuition: text("دوره‌های انگلیسی کارشناسی و ارشد معمولاً برای دانشجویان خارج اتحادیه اروپا، منطقه اقتصادی اروپا و سوئیس شهریه دارند؛ معافیت‌ها را بررسی کنید.", "English-taught bachelor’s and master’s programmes usually charge non-EU/EEA/Swiss students tuition, subject to exemptions."),
      living: text("اجاره، خوراک و رفت‌وآمد را با هزینه‌های احتمالی اتحادیه دانشجویی و خدمات سلامت در یک جدول قرار دهید.", "Combine rent, food and transport with any applicable student-union and healthcare fees."),
      arrival: text("هزینه درخواست، بیمه و مخارج شروع اقامت را جداگانه بررسی کنید؛ همه مبالغ در شهریه دانشگاه گنجانده نمی‌شوند.", "Check application fees, insurance and arrival expenses separately; tuition does not include every cost."),
      funding: text("برای کل دوره تأمین مالی داشته باشید؛ پیدا کردن کار پاره‌وقت قطعی نیست و نباید پایه اصلی بودجه باشد.", "Arrange funding for the full study period; part-time employment is uncertain and should not underpin your budget."),
    },
    language: text("فنلاندی / سوئدی / انگلیسی، بسته به دوره", "Finnish / Swedish / English, by course"), currency: "EUR", cities: text("هلسینکی، اسپو، تامپره", "Helsinki, Espoo, Tampere"),
    image: "/universities/university-of-helsinki.jpg", imageLabel: text("دانشگاه هلسینکی، فنلاند", "University of Helsinki, Finland"), source: "https://www.studyinfinland.fi/", sourceName: "Study in Finland",
  },
  {
    slug: "denmark", name: text("دانمارک", "Denmark"), tagline: text("یادگیری در کنار زندگی، با نگاهی تازه", "A fresh perspective on learning and living"),
    academics: text("برای شناخت تحصیل در دانمارک، دوره‌ها را از نظر محتوای علمی و روش آموزش مقایسه کنید. زبان تدریس و مدارک لازم باید در صفحه رسمی هر دوره بررسی شوند.", "Compare Danish courses by academic content and teaching approach. Check teaching language and required qualifications on the official course page."),
    life: text("در دانمارک، زندگی دانشجویی با استقلال در کارهای روزمره و حضور در جمع‌های دانشجویی همراه است. اقامت در خوابگاه یا خانه مشترک و رفت‌وآمد با دوچرخه یا حمل‌ونقل عمومی از الگوهای رایج‌اند. خانه‌های دانشجویی در شهرهای بزرگ دانشگاهی میزبان دیدارها و برنامه‌های اجتماعی و فرهنگی هستند. فاصله‌های کوتاه نیز فرصت می‌دهد در کنار کافه‌ها و موسیقی شهر، زمانی برای آرامش در طبیعت یا کنار ساحل داشته باشید.", "In Denmark, student life combines everyday independence with student communities. Living in a residence or shared flat and commuting by bicycle or public transport are common patterns. Student houses in major university cities host social and cultural activities. Short distances also make it possible to combine cafés and music in the city with time in nature or by the coast."),
    planning: {
      summary: text("بودجه زندگی در دانمارک را به کرون دانمارک تنظیم کنید. راهنمای رسمی، اجاره را حدود ۳۰۰۰ تا ۶۵۰۰ کرون در ماه برآورد می‌کند؛ خوراک، رفت‌وآمد و سایر هزینه‌ها به آن اضافه می‌شوند.", "Plan Danish living costs in DKK. The official guide gives approximate monthly rent of DKK 3,000–6,500, with food, transport and other expenses added separately."),
      tuition: text("برای دانشجویان مشمول شهریه، راهنمای رسمی بازه سالانه ۴۵۰۰۰ تا ۱۲۰۰۰۰ کرون ذکر می‌کند؛ مبلغ دانشگاه ملاک نهایی است.", "For fee-paying students, the official guide lists DKK 45,000–120,000 annually; confirm your institution’s actual fee."),
      living: text("خوراک، بیمه، کتاب، تلفن و حمل‌ونقل را جدا ثبت کنید؛ بررسی کنید قبوض در اجاره گنجانده شده‌اند یا نه.", "Itemise food, insurance, books, phone and transport, and check which utilities rent includes."),
      arrival: text("پول اجاره، ودیعه و وسایل اولیه هفته‌های نخست را پیش از رسیدن آماده کنید؛ انتقال وجه هم ممکن است کارمزد داشته باشد.", "Prepare funds for initial rent, deposits and household items; transfers may also incur fees."),
      funding: text("دوچرخه‌سواری و غذا پختن در خانه را در برنامه صرفه‌جویی بگنجانید و کمک‌هزینه‌ها را مطابق شرایط دانشگاه بررسی کنید.", "Consider cycling and home cooking to reduce costs, and check funding against your institution’s conditions."),
    },
    language: text("دانمارکی / انگلیسی، بسته به دوره", "Danish / English, by course"), currency: "DKK", cities: text("کپنهاگ، آرهوس، آلبورگ", "Copenhagen, Aarhus, Aalborg"),
    image: "/universities/aarhus-university.jpg", imageLabel: text("دانشگاه آرهوس، دانمارک", "Aarhus University, Denmark"), source: "https://studyindenmark.dk/", sourceName: "Study in Denmark",
  },
  {
    slug: "new-zealand", name: text("نیوزلند", "New Zealand"), tagline: text("فصل جدید شما، در سوی دیگر جهان", "Your next chapter, on the other side of the world"),
    academics: text("برای بررسی تحصیل در نیوزلند، زمینه‌های آموزشی و پژوهشی دانشگاه‌ها را با هدف خود تطبیق دهید. تقویم دوره، شرایط زبان و خدمات دانشجویی را از دانشگاه منتخب بپرسید.", "Match New Zealand universities’ teaching and research areas to your goals. Check course calendars, language requirements and student services with your chosen institution."),
    life: text("در نیوزلند، هفته آشنایی یا «O Week» فرصتی برای شناخت دانشگاه، دیدار با دانشجویان و آگاهی از خدمات پشتیبانی است. گروه‌های فرهنگی، علمی و ورزشی می‌توانند شما را با علایق تازه و دوستان جدید آشنا کنند؛ از آشنایی با فرهنگ مائوری تا فعالیت‌های گروهی و ورزش. برنامه‌های همراهی دانشجویان و فعالیت داوطلبانه نیز راه‌هایی برای ارتباط با جامعه دانشگاهی و محلی، تمرین زبان و یادگیری مهارت‌های تازه هستند.", "In New Zealand, orientation or O Week helps you explore campus, meet other students and learn about support services. Cultural, academic and sports clubs offer ways to discover new interests, make friends and learn about Māori culture. Buddy programmes and volunteering are further ways to connect with university and local communities, practise your English and develop new skills alongside your studies."),
    planning: {
      summary: text("در نیوزلند، شهریه به نوع و طول دوره وابسته است و بسیاری از هزینه‌های روزمره هفتگی اعلام می‌شوند. همه ارقام را به دلار نیوزلند و با دوره زمانی یکسان مقایسه کنید.", "In New Zealand, tuition depends on course type and duration, while many everyday costs are quoted weekly. Compare figures in NZD over matching time periods."),
      tuition: text("شهریه کل دوره و شرایط پرداخت یا بازپرداخت را از مؤسسه بگیرید؛ هزینه یک سال همیشه هزینه کل مدرک نیست.", "Confirm full-course tuition and payment or refund terms; one year’s fee is not necessarily the total degree cost."),
      living: text("اجاره، خرید مواد غذایی، برق، اینترنت و رفت‌وآمد را تفکیک کنید؛ در خوابگاه، شمول غذا و قبوض را بپرسید.", "Separate rent, groceries, power, internet and transport; ask whether halls include meals and utilities."),
      arrival: text("ودیعه، سفر و مخارج استقرار را از هزینه ماهانه جدا کنید و نرخ‌های هفتگی را برای کل مدت اقامت جمع بزنید.", "Separate deposits, travel and settling-in costs from recurring spending; total weekly rates across your full stay."),
      funding: text("بودجه ماهانه را با منابع مالی قطعی هماهنگ کنید؛ خدمات انجمن دانشجویی و تخفیف‌ها می‌توانند به مدیریت مخارج کمک کنند.", "Match monthly spending to confirmed funding; student-association services and discounts can help manage costs."),
    },
    language: text("انگلیسی", "English"), currency: "NZD", cities: text("اوکلند، داندین، پالمرستون نورث", "Auckland, Dunedin, Palmerston North"),
    image: "/universities/the-university-of-auckland.jpg", imageLabel: text("دانشگاه اوکلند، نیوزلند", "University of Auckland, New Zealand"), source: "https://www.studywithnewzealand.govt.nz/en", sourceName: "Study with New Zealand",
  },
];

export const findDestination = (slug: string) => destinations.find((item) => item.slug === slug);

export function destinationConsultationHref(locale: "fa" | "en", country: string, university?: string) {
  const source = university ? `university:${university}` : `country:${country}`;
  return `/${locale}/consultation?source=${encodeURIComponent(source)}`;
}
