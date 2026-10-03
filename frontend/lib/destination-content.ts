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
    life: text("از فضای چندفرهنگی مونترآل تا ساحل هلیفکس؛ شهر محل تحصیل بخش مهمی از تجربه شماست. مسکن، رفت‌وآمد و آب‌وهوای شهر را کنار انتخاب دانشگاه بررسی کنید.", "From multicultural Montréal to coastal Halifax, your city shapes your experience. Consider housing, transport and the local climate alongside your university choice."),
    language: text("انگلیسی / فرانسوی", "English / French"), currency: "CAD",
    cities: text("تورنتو، مونترآل، هلیفکس", "Toronto, Montréal, Halifax"),
    image: "/destinations/canada.png", imageLabel: text("چشم‌انداز تورنتو، کانادا", "Toronto skyline, Canada"),
    source: "https://www.educanada.ca/", sourceName: "EduCanada",
  },
  {
    slug: "germany", name: text("آلمان", "Germany"),
    tagline: text("ایده‌های بزرگ، از اینجا آغاز می‌شوند", "Where your next big idea begins"),
    academics: text("دانشگاه‌های پژوهشی و دانشگاه‌های علوم کاربردی، دو مسیر مهم آموزش عالی در آلمان هستند. تناسب مدرک قبلی و زبان موردنیاز هر دوره را پیش از انتخاب بررسی کنید.", "Research universities and universities of applied sciences offer distinct study routes in Germany. Check how your prior qualification and language skills match each course."),
    life: text("برلین، براونشوایگ و توبینگن تجربه‌های متفاوتی از زندگی دانشجویی دارند. یادگیری آلمانی می‌تواند ارتباطات روزمره و آشنایی با جامعه محلی را آسان‌تر کند.", "Berlin, Braunschweig and Tübingen offer different student experiences. Learning German can make everyday communication and connections with the local community easier."),
    language: text("آلمانی / انگلیسی، بسته به دوره", "German / English, by course"), currency: "EUR",
    cities: text("برلین، براونشوایگ، توبینگن", "Berlin, Braunschweig, Tübingen"),
    image: "/destinations/germany.png", imageLabel: text("آلمان، مقصدی برای یادگیری و پژوهش", "Discover Germany"),
    source: "https://www.study-in-germany.com/en/", sourceName: "Study in Germany · DAAD",
  },
  {
    slug: "united-kingdom", name: text("انگلستان", "United Kingdom"),
    tagline: text("سنت دانشگاهی، نگاه رو به آینده", "Academic tradition, a forward-looking future"),
    academics: text("دانشگاه‌های بریتانیا مسیرهای متنوعی در علوم، هنر و پژوهش دارند. ساختار دوره، روش ارزیابی و شرایط ورود را برای هر دانشگاه جداگانه مقایسه کنید.", "UK universities offer varied pathways in science, the arts and research. Compare course structure, assessment methods and entry requirements at each institution."),
    life: text("لندن، دورهام و کاردیف از نظر اندازه و سبک زندگی متفاوت‌اند. موقعیت پردیس و دسترسی به مسکن و حمل‌ونقل را در برنامه‌ریزی خود در نظر بگیرید.", "London, Durham and Cardiff differ in scale and pace. Include campus location, housing and transport in your planning."),
    language: text("انگلیسی", "English"), currency: "GBP", cities: text("لندن، دورهام، کاردیف", "London, Durham, Cardiff"),
    image: "/destinations/united-kingdom.png", imageLabel: text("چشم‌اندازی از بریتانیا", "Explore the United Kingdom"), source: "https://study-uk.britishcouncil.org/", sourceName: "Study UK · British Council",
  },
  {
    slug: "italy", name: text("ایتالیا", "Italy"), tagline: text("جایی که دانش و خلاقیت به هم می‌رسند", "Where knowledge meets creativity"),
    academics: text("برای شناخت آموزش عالی ایتالیا، دانشگاه‌ها و مسیرهای هنر و طراحی را در کنار یکدیگر بررسی کنید. زبان تدریس و شیوه پذیرش هر رشته ممکن است متفاوت باشد.", "Explore Italy’s universities alongside its art and design study routes. Teaching languages and admission processes vary by course."),
    life: text("میلان و تورین دو نقطه شروع برای شناخت زندگی دانشجویی ایتالیا هستند. هنگام مقایسه شهرها، فاصله محل زندگی تا پردیس و فرصت یادگیری زبان ایتالیایی را در نظر بگیرید.", "Milan and Turin are two starting points for exploring student life in Italy. Consider commuting distance and opportunities to learn Italian when comparing cities."),
    language: text("ایتالیایی / انگلیسی، بسته به دوره", "Italian / English, by course"), currency: "EUR", cities: text("میلان، تورین، رم", "Milan, Turin, Rome"),
    image: "/destinations/italy.png", imageLabel: text("ایتالیا؛ فرهنگ، هنر و تحصیل", "Explore Italy"), source: "https://studyinitaly.esteri.it/", sourceName: "Study in Italy",
  },
  {
    slug: "netherlands", name: text("هلند", "Netherlands"), tagline: text("نگاهی بین‌المللی به آیندهٔ شما", "An international outlook for your future"),
    academics: text("هلند امکان بررسی دوره‌های انگلیسی‌زبان و مسیرهای پژوهشی و کاربردی را فراهم می‌کند. تفاوت نوع دانشگاه و شیوه یادگیری را هنگام انتخاب دوره در نظر بگیرید.", "Explore English-taught programmes and research or applied study routes in the Netherlands. Consider institution type and learning approach when choosing a course."),
    life: text("دلفت، آیندهوون و روتردام محیط‌های متفاوتی برای تحصیل دارند. پیدا کردن مسکن نیاز به برنامه‌ریزی زودهنگام دارد؛ پیش از سفر گزینه‌های اقامت را بررسی کنید.", "Delft, Eindhoven and Rotterdam offer different study environments. Housing needs early planning: investigate accommodation before you travel."),
    language: text("هلندی / انگلیسی، بسته به دوره", "Dutch / English, by course"), currency: "EUR", cities: text("دلفت، آیندهوون، روتردام", "Delft, Eindhoven, Rotterdam"),
    image: "/destinations/netherlands.png", imageLabel: text("چشم‌انداز هلند", "Explore the Netherlands"), source: "https://www.studyinnl.org/", sourceName: "Study in NL · Nuffic",
  },
  {
    slug: "australia", name: text("استرالیا", "Australia"), tagline: text("افق‌های تازه، تجربه‌های ماندگار", "New horizons, lasting experiences"),
    academics: text("برای تحصیل در استرالیا، دوره و دانشگاه را در کنار شهر محل تحصیل مقایسه کنید. پیش‌نیازها، تقویم آموزشی و امکانات دانشجویان بین‌المللی را از مرجع رسمی دانشگاه بخوانید.", "Compare courses and institutions alongside your preferred Australian city. Check prerequisites, academic calendars and international student support with the university."),
    life: text("کانبرا، آدلاید و پرت انتخاب‌هایی متفاوت از نظر فاصله، آب‌وهوا و سبک زندگی‌اند. برنامه مسکن و رفت‌وآمد خود را متناسب با شهر تنظیم کنید.", "Canberra, Adelaide and Perth differ in distance, climate and lifestyle. Plan accommodation and transport around your chosen city."),
    language: text("انگلیسی", "English"), currency: "AUD", cities: text("کانبرا، آدلاید، پرت", "Canberra, Adelaide, Perth"),
    image: "/universities/australian-national-university.jpg", imageLabel: text("دانشگاه ملی استرالیا، کانبرا", "Australian National University, Canberra"), source: "https://www.studyaustralia.gov.au/", sourceName: "Study Australia",
  },
  {
    slug: "sweden", name: text("سوئد", "Sweden"), tagline: text("برای پرسیدن، ساختن و متفاوت فکر کردن", "Space to question, create and think differently"),
    academics: text("در بررسی دانشگاه‌های سوئد، از محتوای دوره و زمینه‌های پژوهشی شروع کنید. زبان تدریس، پیش‌نیازهای رشته و زمان درخواست را برای گزینه‌های خود جداگانه بررسی کنید.", "Start exploring Swedish universities through course content and research areas. Check the teaching language, prerequisites and application schedule for each option."),
    life: text("استکهلم و گوتنبرگ دو شهر دانشگاهی برای شروع جست‌وجو هستند. ساعات روشنایی فصلی، حمل‌ونقل و دسترسی به مسکن دانشجویی را در تصمیم خود لحاظ کنید.", "Stockholm and Gothenburg are two university cities to explore. Consider seasonal daylight, transport and access to student accommodation."),
    language: text("سوئدی / انگلیسی، بسته به دوره", "Swedish / English, by course"), currency: "SEK", cities: text("استکهلم، گوتنبرگ", "Stockholm, Gothenburg"),
    image: "/universities/kth-royal-institute-of-technology.jpg", imageLabel: text("مؤسسه سلطنتی فناوری، استکهلم", "KTH Royal Institute of Technology, Stockholm"), source: "https://studyinsweden.se/", sourceName: "Study in Sweden",
  },
  {
    slug: "finland", name: text("فنلاند", "Finland"), tagline: text("فضایی برای یادگیری و کشف توانایی‌ها", "Room to learn and discover your potential"),
    academics: text("دانشگاه‌ها و دانشگاه‌های علوم کاربردی فنلاند را بر اساس هدف تحصیلی خود مقایسه کنید. برای انتخاب مسیر مناسب، محتوای دوره و زبان آموزش را بخوانید.", "Compare Finland’s universities and universities of applied sciences against your study goals. Review course content and teaching languages to find a suitable route."),
    life: text("هلسینکی، اسپو و تامپره نقاط شروع مناسبی برای شناخت محیط‌های دانشگاهی‌اند. برای زمستان، مسکن و رفت‌وآمد روزانه از پیش برنامه‌ریزی کنید.", "Helsinki, Espoo and Tampere are starting points for exploring university settings. Plan ahead for winter, housing and your daily commute."),
    language: text("فنلاندی / سوئدی / انگلیسی، بسته به دوره", "Finnish / Swedish / English, by course"), currency: "EUR", cities: text("هلسینکی، اسپو، تامپره", "Helsinki, Espoo, Tampere"),
    image: "/universities/university-of-helsinki.jpg", imageLabel: text("دانشگاه هلسینکی، فنلاند", "University of Helsinki, Finland"), source: "https://www.studyinfinland.fi/", sourceName: "Study in Finland",
  },
  {
    slug: "denmark", name: text("دانمارک", "Denmark"), tagline: text("یادگیری در کنار زندگی، با نگاهی تازه", "A fresh perspective on learning and living"),
    academics: text("برای شناخت تحصیل در دانمارک، دوره‌ها را از نظر محتوای علمی و روش آموزش مقایسه کنید. زبان تدریس و مدارک لازم باید در صفحه رسمی هر دوره بررسی شوند.", "Compare Danish courses by academic content and teaching approach. Check teaching language and required qualifications on the official course page."),
    life: text("کپنهاگ، آرهوس و آلبورگ تجربه‌های شهری متفاوتی دارند. هزینه مسکن و امکان رفت‌وآمد با دوچرخه یا حمل‌ونقل عمومی را در برنامه خود بگنجانید.", "Copenhagen, Aarhus and Aalborg offer different urban experiences. Include housing and cycling or public transport in your planning."),
    language: text("دانمارکی / انگلیسی، بسته به دوره", "Danish / English, by course"), currency: "DKK", cities: text("کپنهاگ، آرهوس، آلبورگ", "Copenhagen, Aarhus, Aalborg"),
    image: "/universities/aarhus-university.jpg", imageLabel: text("دانشگاه آرهوس، دانمارک", "Aarhus University, Denmark"), source: "https://studyindenmark.dk/", sourceName: "Study in Denmark",
  },
  {
    slug: "new-zealand", name: text("نیوزلند", "New Zealand"), tagline: text("فصل جدید شما، در سوی دیگر جهان", "Your next chapter, on the other side of the world"),
    academics: text("برای بررسی تحصیل در نیوزلند، زمینه‌های آموزشی و پژوهشی دانشگاه‌ها را با هدف خود تطبیق دهید. تقویم دوره، شرایط زبان و خدمات دانشجویی را از دانشگاه منتخب بپرسید.", "Match New Zealand universities’ teaching and research areas to your goals. Check course calendars, language requirements and student services with your chosen institution."),
    life: text("اوکلند، داندین و پالمرستون نورث محیط‌های گوناگونی برای زندگی دانشجویی دارند. فاصله سفر، شرایط اقامت و دسترسی به پردیس را پیش از انتخاب در نظر بگیرید.", "Auckland, Dunedin and Palmerston North offer varied student settings. Consider travel distance, accommodation and campus access before choosing."),
    language: text("انگلیسی", "English"), currency: "NZD", cities: text("اوکلند، داندین، پالمرستون نورث", "Auckland, Dunedin, Palmerston North"),
    image: "/universities/the-university-of-auckland.jpg", imageLabel: text("دانشگاه اوکلند، نیوزلند", "University of Auckland, New Zealand"), source: "https://www.studywithnewzealand.govt.nz/en", sourceName: "Study with New Zealand",
  },
];

export const findDestination = (slug: string) => destinations.find((item) => item.slug === slug);

export function destinationConsultationHref(locale: "fa" | "en", country: string, university?: string) {
  const source = university ? `university:${university}` : `country:${country}`;
  return `/${locale}/consultation?source=${encodeURIComponent(source)}`;
}
