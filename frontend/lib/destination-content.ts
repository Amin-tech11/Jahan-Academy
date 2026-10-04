type Localized = { fa: string; en: string };
const text = (fa: string, en: string): Localized => ({ fa, en });

export type Destination = {
  slug: string;
  name: Localized;
  tagline: Localized;
  academics: Localized;
  life: Localized;
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
    language: text("انگلیسی", "English"), currency: "GBP", cities: text("لندن، دورهام، کاردیف", "London, Durham, Cardiff"),
    image: "/destinations/united-kingdom.png", imageLabel: text("چشم‌اندازی از بریتانیا", "Explore the United Kingdom"), source: "https://study-uk.britishcouncil.org/", sourceName: "Study UK · British Council",
  },
  {
    slug: "italy", name: text("ایتالیا", "Italy"), tagline: text("جایی که دانش و خلاقیت به هم می‌رسند", "Where knowledge meets creativity"),
    academics: text("برای شناخت آموزش عالی ایتالیا، دانشگاه‌ها و مسیرهای هنر و طراحی را در کنار یکدیگر بررسی کنید. زبان تدریس و شیوه پذیرش هر رشته ممکن است متفاوت باشد.", "Explore Italy’s universities alongside its art and design study routes. Teaching languages and admission processes vary by course."),
    life: text("تحصیل در ایتالیا فرصتی است تا زندگی روزمره را در کنار هنر، تاریخ و فرهنگ شهرهای دانشگاهی تجربه کنید. بازدید از فضاهای فرهنگی و آشنایی با محیط شهر می‌تواند بخشی از اوقات فراغت شما باشد. برای اقامت، خوابگاه‌ها و اقامتگاه‌های دانشگاهی را در کنار اجاره خصوصی بررسی کنید؛ بسیاری از دانشگاه‌ها دفتر خدمات مسکن دارند. شرایط دریافت اتاق متفاوت است و ممکن است وضعیت مالی و شایستگی تحصیلی در آن نقش داشته باشد.", "Studying in Italy places everyday life alongside the art, history and culture of its university cities. Exploring cultural spaces and getting to know the city can become part of your time away from studying. For housing, compare university residences with private rentals; many universities have accommodation offices. Room allocation has its own conditions and may take financial circumstances and academic merit into account."),
    language: text("ایتالیایی / انگلیسی، بسته به دوره", "Italian / English, by course"), currency: "EUR", cities: text("میلان، تورین، رم", "Milan, Turin, Rome"),
    image: "/destinations/italy.png", imageLabel: text("ایتالیا؛ فرهنگ، هنر و تحصیل", "Explore Italy"), source: "https://studyinitaly.esteri.it/", sourceName: "Study in Italy",
  },
  {
    slug: "netherlands", name: text("هلند", "Netherlands"), tagline: text("نگاهی بین‌المللی به آیندهٔ شما", "An international outlook for your future"),
    academics: text("هلند امکان بررسی دوره‌های انگلیسی‌زبان و مسیرهای پژوهشی و کاربردی را فراهم می‌کند. تفاوت نوع دانشگاه و شیوه یادگیری را هنگام انتخاب دوره در نظر بگیرید.", "Explore English-taught programmes and research or applied study routes in the Netherlands. Consider institution type and learning approach when choosing a course."),
    life: text("در هلند، بخش زیادی از زندگی دانشجویی در خود شهر و بیرون از پردیس جریان دارد. انجمن‌های علمی، ورزشی و بین‌المللی مانند ESN فرصت آشنایی با دانشجویان دیگر و شرکت در برنامه‌های جمعی را فراهم می‌کنند. دوچرخه برای مسیرهای کوتاه و قطار برای سفر بین شهرها از گزینه‌های کاربردی‌اند. موزه‌ها، کانال‌ها و فضاهای طبیعی هم انتخاب‌هایی برای اوقات فراغت هستند. به‌دلیل کمبود مسکن دانشجویی، پیدا کردن محل اقامت را به روزهای آخر موکول نکنید.", "In the Netherlands, much of student life takes place in the city rather than on a separate campus. Academic, sports and international associations such as ESN bring students together. Cycling works well for short journeys, while trains connect city centres. Museums, canals and natural spaces offer ways to spend your free time. Student housing is in short supply, so start arranging accommodation well before your arrival."),
    language: text("هلندی / انگلیسی، بسته به دوره", "Dutch / English, by course"), currency: "EUR", cities: text("دلفت، آیندهوون، روتردام", "Delft, Eindhoven, Rotterdam"),
    image: "/destinations/netherlands.png", imageLabel: text("چشم‌انداز هلند", "Explore the Netherlands"), source: "https://www.studyinnl.org/", sourceName: "Study in NL · Nuffic",
  },
  {
    slug: "australia", name: text("استرالیا", "Australia"), tagline: text("افق‌های تازه، تجربه‌های ماندگار", "New horizons, lasting experiences"),
    academics: text("برای تحصیل در استرالیا، دوره و دانشگاه را در کنار شهر محل تحصیل مقایسه کنید. پیش‌نیازها، تقویم آموزشی و امکانات دانشجویان بین‌المللی را از مرجع رسمی دانشگاه بخوانید.", "Compare courses and institutions alongside your preferred Australian city. Check prerequisites, academic calendars and international student support with the university."),
    life: text("زندگی دانشجویی در استرالیا معمولاً با برنامه‌های آشنایی آغاز می‌شود؛ فرصتی برای شناخت پردیس، مسیر رفت‌وآمد و دیدار با دانشجویان محلی و بین‌المللی. باشگاه‌های ورزشی، گروه‌های فرهنگی و انجمن‌های سرگرمی به شما کمک می‌کنند جمع مورد علاقه‌تان را پیدا کنید. در طول ترم هم ممکن است برنامه‌هایی مانند شب فیلم، گفت‌وگوی زبان و جشنواره‌های فرهنگی برگزار شود. برای آگاهی از فعالیت‌ها و خدمات پشتیبانی، تقویم رویدادها و وب‌سایت دانشگاه خود را دنبال کنید.", "Student life in Australia often begins with orientation: a chance to explore campus, learn your commute and meet local and international students. Sports clubs, cultural groups and hobby societies help you find people with shared interests. During the term, providers may organise film nights, language conversations and multicultural events. Follow your institution’s event calendar and website to discover activities and the support available to help you settle in."),
    language: text("انگلیسی", "English"), currency: "AUD", cities: text("کانبرا، آدلاید، پرت", "Canberra, Adelaide, Perth"),
    image: "/universities/australian-national-university.jpg", imageLabel: text("دانشگاه ملی استرالیا، کانبرا", "Australian National University, Canberra"), source: "https://www.studyaustralia.gov.au/", sourceName: "Study Australia",
  },
  {
    slug: "sweden", name: text("سوئد", "Sweden"), tagline: text("برای پرسیدن، ساختن و متفاوت فکر کردن", "Space to question, create and think differently"),
    academics: text("در بررسی دانشگاه‌های سوئد، از محتوای دوره و زمینه‌های پژوهشی شروع کنید. زبان تدریس، پیش‌نیازهای رشته و زمان درخواست را برای گزینه‌های خود جداگانه بررسی کنید.", "Start exploring Swedish universities through course content and research areas. Check the teaching language, prerequisites and application schedule for each option."),
    life: text("در سوئد، آشنایی با زندگی روزمره اغلب با «فیکا» همراه می‌شود؛ زمانی برای نوشیدن قهوه یا چای و گفت‌وگو با دوستان. علاقه به طبیعت و برنامه‌های فرهنگی هم بخشی از سبک زندگی است و می‌تواند به برنامه‌های جمعی شما تنوع بدهد. ارتباط به زبان انگلیسی در بسیاری از موقعیت‌ها امکان‌پذیر است. آب‌وهوا در شمال و جنوب کشور تفاوت دارد، پس برای پوشاک و فعالیت‌های بیرون از خانه، شرایط شهر محل تحصیل را در نظر بگیرید.", "In Sweden, getting to know everyday life often includes fika: taking time for coffee or tea and conversation with friends. An interest in nature and cultural traditions offers more ways to spend time together. English is widely spoken, which can make everyday communication easier for international students. Weather differs between the north and south, so plan your clothing and outdoor activities around the city where you will study."),
    language: text("سوئدی / انگلیسی، بسته به دوره", "Swedish / English, by course"), currency: "SEK", cities: text("استکهلم، گوتنبرگ", "Stockholm, Gothenburg"),
    image: "/universities/kth-royal-institute-of-technology.jpg", imageLabel: text("مؤسسه سلطنتی فناوری، استکهلم", "KTH Royal Institute of Technology, Stockholm"), source: "https://studyinsweden.se/", sourceName: "Study in Sweden",
  },
  {
    slug: "finland", name: text("فنلاند", "Finland"), tagline: text("فضایی برای یادگیری و کشف توانایی‌ها", "Room to learn and discover your potential"),
    academics: text("دانشگاه‌ها و دانشگاه‌های علوم کاربردی فنلاند را بر اساس هدف تحصیلی خود مقایسه کنید. برای انتخاب مسیر مناسب، محتوای دوره و زبان آموزش را بخوانید.", "Compare Finland’s universities and universities of applied sciences against your study goals. Review course content and teaching languages to find a suitable route."),
    life: text("زندگی دانشجویی در فنلاند ترکیبی از استقلال در یادگیری، همکاری با دیگران و زمانی برای استراحت است. فضای آموزشی غیررسمی و مشارکتی، فرصت گفت‌وگو و تبادل ایده را فراهم می‌کند. انعطاف در برنامه تحصیل می‌تواند به شما کمک کند میان درس و زندگی شخصی تعادل برقرار کنید و زمانی هم برای تجربه طبیعت فنلاند داشته باشید. تجربه روزمره هر دانشجو متفاوت است؛ برنامه‌ای متناسب با حجم درس و علایق خود بسازید.", "Student life in Finland combines independent learning, collaboration and time to unwind. An informal study environment encourages discussion and exchanging ideas. Flexible study options can help you balance academic work with personal interests and leave time to explore Finnish nature. Each student’s routine will be different, so build a schedule that fits your workload while making space for the activities you enjoy."),
    language: text("فنلاندی / سوئدی / انگلیسی، بسته به دوره", "Finnish / Swedish / English, by course"), currency: "EUR", cities: text("هلسینکی، اسپو، تامپره", "Helsinki, Espoo, Tampere"),
    image: "/universities/university-of-helsinki.jpg", imageLabel: text("دانشگاه هلسینکی، فنلاند", "University of Helsinki, Finland"), source: "https://www.studyinfinland.fi/", sourceName: "Study in Finland",
  },
  {
    slug: "denmark", name: text("دانمارک", "Denmark"), tagline: text("یادگیری در کنار زندگی، با نگاهی تازه", "A fresh perspective on learning and living"),
    academics: text("برای شناخت تحصیل در دانمارک، دوره‌ها را از نظر محتوای علمی و روش آموزش مقایسه کنید. زبان تدریس و مدارک لازم باید در صفحه رسمی هر دوره بررسی شوند.", "Compare Danish courses by academic content and teaching approach. Check teaching language and required qualifications on the official course page."),
    life: text("در دانمارک، زندگی دانشجویی با استقلال در کارهای روزمره و حضور در جمع‌های دانشجویی همراه است. اقامت در خوابگاه یا خانه مشترک و رفت‌وآمد با دوچرخه یا حمل‌ونقل عمومی از الگوهای رایج‌اند. خانه‌های دانشجویی در شهرهای بزرگ دانشگاهی میزبان دیدارها و برنامه‌های اجتماعی و فرهنگی هستند. فاصله‌های کوتاه نیز فرصت می‌دهد در کنار کافه‌ها و موسیقی شهر، زمانی برای آرامش در طبیعت یا کنار ساحل داشته باشید.", "In Denmark, student life combines everyday independence with student communities. Living in a residence or shared flat and commuting by bicycle or public transport are common patterns. Student houses in major university cities host social and cultural activities. Short distances also make it possible to combine cafés and music in the city with time in nature or by the coast."),
    language: text("دانمارکی / انگلیسی، بسته به دوره", "Danish / English, by course"), currency: "DKK", cities: text("کپنهاگ، آرهوس، آلبورگ", "Copenhagen, Aarhus, Aalborg"),
    image: "/universities/aarhus-university.jpg", imageLabel: text("دانشگاه آرهوس، دانمارک", "Aarhus University, Denmark"), source: "https://studyindenmark.dk/", sourceName: "Study in Denmark",
  },
  {
    slug: "new-zealand", name: text("نیوزلند", "New Zealand"), tagline: text("فصل جدید شما، در سوی دیگر جهان", "Your next chapter, on the other side of the world"),
    academics: text("برای بررسی تحصیل در نیوزلند، زمینه‌های آموزشی و پژوهشی دانشگاه‌ها را با هدف خود تطبیق دهید. تقویم دوره، شرایط زبان و خدمات دانشجویی را از دانشگاه منتخب بپرسید.", "Match New Zealand universities’ teaching and research areas to your goals. Check course calendars, language requirements and student services with your chosen institution."),
    life: text("در نیوزلند، هفته آشنایی یا «O Week» فرصتی برای شناخت دانشگاه، دیدار با دانشجویان و آگاهی از خدمات پشتیبانی است. گروه‌های فرهنگی، علمی و ورزشی می‌توانند شما را با علایق تازه و دوستان جدید آشنا کنند؛ از آشنایی با فرهنگ مائوری تا فعالیت‌های گروهی و ورزش. برنامه‌های همراهی دانشجویان و فعالیت داوطلبانه نیز راه‌هایی برای ارتباط با جامعه دانشگاهی و محلی، تمرین زبان و یادگیری مهارت‌های تازه هستند.", "In New Zealand, orientation or O Week helps you explore campus, meet other students and learn about support services. Cultural, academic and sports clubs offer ways to discover new interests, make friends and learn about Māori culture. Buddy programmes and volunteering are further ways to connect with university and local communities, practise your English and develop new skills alongside your studies."),
    language: text("انگلیسی", "English"), currency: "NZD", cities: text("اوکلند، داندین، پالمرستون نورث", "Auckland, Dunedin, Palmerston North"),
    image: "/universities/the-university-of-auckland.jpg", imageLabel: text("دانشگاه اوکلند، نیوزلند", "University of Auckland, New Zealand"), source: "https://www.studywithnewzealand.govt.nz/en", sourceName: "Study with New Zealand",
  },
];

export const findDestination = (slug: string) => destinations.find((item) => item.slug === slug);

export function destinationConsultationHref(locale: "fa" | "en", country: string, university?: string) {
  const source = university ? `university:${university}` : `country:${country}`;
  return `/${locale}/consultation?source=${encodeURIComponent(source)}`;
}
