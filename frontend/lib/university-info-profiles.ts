import type { UniversityInfo, UniversityOffering } from "./university-info-model";
import type { Locale } from "./site-content";
import factsData from "./university-info-facts.json" with { type: "json" };
import statisticsData from "./university-info-statistics.json" with { type: "json" };

type Copy = Record<Locale, string>;
const copy = (fa: string, en: string): Copy => ({ fa, en });
type Facts = { foundedYear: number; city: Copy; address: string; kind: string; dli?: string };
type Statistics = { year: string; source: string; basis: Copy; rows: (string | number)[][]; total?: number; method?: string; supportingSources?: string[] };
const facts: Record<string, Facts> = factsData;
const statistics: Record<string, Statistics> = statisticsData;
const institutionTypes: Record<string, Copy> = {
  public: copy("دانشگاه عمومی", "Public university"),
  private: copy("دانشگاه خصوصی", "Private university"),
  foundation: copy("دانشگاه با اداره بنیاد مستقل", "Independent foundation university"),
};

// Shares describe the source population, not academic quality or admission odds.
// Keep three largest named fields and aggregate the remainder without re-ranking Other.
export function universityDisciplineData(slug: string): Pick<UniversityInfo, "topDisciplines" | "disciplineSource"> {
  const data = Object.hasOwn(statistics, slug) ? statistics[slug] : undefined;
  if (!data) return {};
  const rows = data.rows.map(([fa, en, count]) => ({ name: copy(String(fa), String(en)), count: Number(count) }));
  const total = data.total ?? rows.reduce((sum, row) => sum + row.count, 0);
  if (!(total > 0) || rows.some((row) => !Number.isFinite(row.count) || row.count < 0)) return {};
  const ranked = rows.filter((row) => row.name.en !== "Other").sort((a, b) => b.count - a.count);
  const selected = ranked.slice(0, 3);
  const other = rows.filter((row) => !selected.includes(row)).reduce((sum, row) => sum + row.count, 0);
  if (other > 0) selected.push({ name: copy("سایر", "Other"), count: other });
  return {
    topDisciplines: selected.map((row) => ({ name: row.name, percentage: Math.round(row.count / total * 1000) / 10 })),
    disciplineSource: { year: data.year, basis: data.basis, url: data.source, supportingUrls: data.supportingSources },
  };
}
const fields = {
  science: copy("علوم طبیعی", "Natural sciences"), engineering: copy("مهندسی و فناوری", "Engineering and technology"),
  arts: copy("هنر و علوم انسانی", "Arts and humanities"), health: copy("پزشکی و علوم سلامت", "Medicine and health sciences"),
  business: copy("مدیریت و اقتصاد", "Business and economics"), social: copy("علوم اجتماعی", "Social sciences"),
  design: copy("معماری و طراحی", "Architecture and design"), computing: copy("علوم کامپیوتر", "Computer science"),
  law: copy("حقوق", "Law"), agriculture: copy("کشاورزی و علوم زیستی", "Agriculture and life sciences"),
};

type Profile = {
  name: string;
  website: string;
  source: string;
  campus: Copy;
  focus: Copy;
  fields: (keyof typeof fields)[];
  address?: string;
  photo?: Copy;
};

// Panel-owned editorial content. Sources reviewed 2026-10-04.
// Statistical populations and years are recorded separately; never infer eligibility from a slug.
export const universityProfiles: Record<string, Profile> = {
  "dalhousie-university": {
    name: "دانشگاه دالهاوزی", website: "https://www.dal.ca/", source: "https://www.dal.ca/about/campus-locations.html",
    campus: copy("پردیس‌های شهری دالهاوزی در هلیفکس قرار دارند و پردیس کشاورزی آن در منطقه ترورو است؛ فضای ساحلی هلیفکس بخشی از تجربه زندگی دانشجویی این دانشگاه است.", "Dalhousie's urban campuses are in Halifax, with an Agricultural Campus in the Truro area. Halifax's coastal setting shapes the experience of living and studying here."),
    focus: copy("آموزش و پژوهش در حوزه‌های علوم، سلامت، مهندسی و کشاورزی در محیط‌های دانشگاهی متفاوت دنبال می‌شود.", "Teaching and research span science, health, engineering and agriculture across distinct campus settings."),
    fields: ["science", "health", "engineering", "agriculture"], address: "6299 South Street, Halifax, Nova Scotia, Canada",
  },
  "laval-university": {
    name: "دانشگاه لاوال", website: "https://www.ulaval.ca/en", source: "https://www.ulaval.ca/en/about-us/",
    campus: copy("لاوال در شهر کبک قرار دارد. فضای سبز پردیس و محیط فرانسوی‌زبان آن، یادگیری دانشگاهی را با زندگی فرهنگی این شهر پیوند می‌دهند.", "Laval is based in Québec City. Its green campus and French-speaking environment connect university study with the city's cultural life."),
    focus: copy("این دانشگاه پژوهش‌محور حوزه‌های متنوعی از علوم و مهندسی تا علوم انسانی و سلامت را در بر می‌گیرد؛ زبان آموزش هر مسیر تحصیلی باید جداگانه بررسی شود.", "This research university spans science, engineering, humanities and health. Check the teaching language for each study pathway."),
    fields: ["science", "engineering", "arts", "health"], address: "2325 rue de l’Université, Québec City, Québec, Canada",
  },
  "mcgill-university": {
    name: "دانشگاه مک‌گیل", website: "https://www.mcgill.ca/", source: "https://www.mcgill.ca/about/",
    campus: copy("مک‌گیل در مونترآل، محیطی دانشگاهی در دل یک شهر چندفرهنگی دارد. پردیس مرکزی با ساختمان‌های تاریخی و فضاهای مطالعه، با زندگی شهری مونترآل در ارتباط است.", "McGill offers a university setting in multicultural Montréal. Its downtown campus connects historic buildings and study spaces with the life of the city."),
    focus: copy("آموزش و پژوهش در علوم، پزشکی، مهندسی و علوم انسانی از بخش‌های هویت علمی مک‌گیل هستند.", "Science, medicine, engineering and the humanities form part of McGill's broad teaching and research community."),
    fields: ["science", "health", "engineering", "arts"], address: "845 Sherbrooke Street West, Montréal, Québec, Canada",
  },
  "braunschweig-university-of-technology": {
    name: "دانشگاه فنی براونشوایگ", website: "https://www.tu-braunschweig.de/en", source: "https://www.tu-braunschweig.de/en/tu-braunschweig/our-profile/the-history-of-the-tu-braunschweig",
    campus: copy("این دانشگاه در شهر براونشوایگ قرار دارد و ریشه آن به کالج کارولینوم در سال ۱۷۴۵ می‌رسد. ساختمان‌های آموزشی دانشگاه در بافت شهر گسترده‌اند.", "Based in Braunschweig, the university traces its roots to the Collegium Carolinum of 1745. Its teaching buildings form part of the urban fabric."),
    focus: copy("سنت آموزش فنی در این دانشگاه با علوم طبیعی و علوم انسانی همراه است و زمینه‌ای برای نگاه میان‌رشته‌ای ایجاد می‌کند.", "Its tradition of technical education sits alongside natural sciences and humanities, providing a setting for interdisciplinary learning."),
    fields: ["engineering", "science", "computing", "arts"],
  },
  "charite-universitatsmedizin-berlin": {
    name: "دانشگاه پزشکی شاریته برلین", website: "https://www.charite.de/en/", source: "https://www.charite.de/en/charite/campuses",
    campus: copy("شاریته مجموعه‌ای دانشگاهی و بیمارستانی در برلین است. پردیس‌های میته، ویرشو، بنجامین فرانکلین و برلین بوخ، محیط‌های متفاوت آموزش، درمان و پژوهش را تشکیل می‌دهند.", "Charité is a university medical institution in Berlin. Mitte, Virchow, Benjamin Franklin and Berlin Buch provide distinct settings for education, patient care and research."),
    focus: copy("تمرکز این مجموعه بر پزشکی و علوم سلامت است؛ ارتباط میان محیط دانشگاه و بیمارستان بخش اصلی هویت آن محسوب می‌شود.", "Medicine and health sciences are central to Charité, with close connections between academic and hospital environments."),
    fields: ["health", "science"],
  },
  "eberhard-karls-university-of-tubingen": {
    name: "دانشگاه توبینگن", website: "https://uni-tuebingen.de/en/", source: "https://uni-tuebingen.de/en/university/profile/",
    campus: copy("دانشگاه توبینگن در شهری تاریخی کنار رود نکار قرار دارد. زندگی دانشگاهی با بافت قدیمی شهر و فضاهای آموزشی و پژوهشی آن پیوند خورده است.", "The University of Tübingen is set in a historic town on the Neckar. University life connects the old town with its teaching and research spaces."),
    focus: copy("علوم انسانی، علوم طبیعی و پزشکی در کنار پژوهش میان‌رشته‌ای، تنوع علمی این دانشگاه را شکل می‌دهند.", "Humanities, natural sciences and medicine, together with interdisciplinary research, shape the university's academic breadth."),
    fields: ["arts", "science", "health", "social"],
  },
  "australian-national-university": {
    name: "دانشگاه ملی استرالیا", website: "https://www.anu.edu.au/", source: "https://www.anu.edu.au/about/campuses-facilities/acton-campus",
    campus: copy("پردیس اکتون در مرکز کانبرا و نزدیک نهادهای فرهنگی و ملی استرالیا قرار دارد. درختان، فضای باز، کتابخانه‌ها و اقامتگاه‌ها بخشی از محیط روزمره آن هستند.", "The Acton campus is in central Canberra, close to Australia's national and cultural institutions. Trees, open spaces, libraries and residences are part of its everyday environment."),
    focus: copy("علوم، مهندسی، علوم انسانی و علوم اجتماعی، محیط متنوعی برای آموزش و پژوهش در پایتخت استرالیا ایجاد کرده‌اند.", "Science, engineering, humanities and social sciences contribute to a varied teaching and research environment in Australia's capital."),
    fields: ["science", "engineering", "arts", "social"],
  },
  "adelaide-university": {
    name: "دانشگاه آدلاید", website: "https://adelaide.edu.au/", source: "https://adelaide.edu.au/life-at-adelaide/campuses/",
    campus: copy("دانشگاه آدلاید پردیس‌های شهری و منطقه‌ای در استرالیای جنوبی دارد. پردیس شهر آدلاید در امتداد نورث تراس، ساختمان‌های تاریخی را با فضاهای آموزشی معاصر و مراکز فرهنگی پیوند می‌دهد.", "Adelaide University has metropolitan and regional campuses across South Australia. Its City Campus on North Terrace connects historic buildings, contemporary learning spaces and cultural venues."),
    focus: copy("حوزه‌های علمی دانشگاه از مدیریت و حقوق تا هنر، آموزش، مهندسی، سلامت و علوم گسترده‌اند. محل ارائه آموزش میان پردیس‌ها متفاوت است.", "Academic areas extend from business and law to arts, education, engineering, health and science. Teaching locations vary between campuses."),
    fields: ["engineering", "health", "business", "science"],
  },
  "curtin-university": {
    name: "دانشگاه کرتین", website: "https://www.curtin.edu.au/", source: "https://www.curtin.edu.au/about/campus-locations/perth/",
    campus: copy("پردیس اصلی کرتین در بنتلی، نزدیک مرکز شهر پرت قرار دارد. باغ‌ها و فضاهای باز، ساختمان‌های قدیمی‌تر را به بناهای آموزشی جدید متصل می‌کنند.", "Curtin's main campus is in Bentley, near central Perth. Gardens and open spaces connect older buildings with newer teaching facilities."),
    focus: copy("علوم سلامت، مدیریت، علوم انسانی و حوزه‌های مهندسی و فناوری بخشی از محیط آموزشی متنوع کرتین هستند.", "Health sciences, business, humanities, engineering and technology contribute to Curtin's varied academic environment."),
    fields: ["health", "business", "engineering", "arts"],
  },
  "catholic-university-of-the-sacred-heart": {
    name: "دانشگاه کاتولیک قلب مقدس", website: "https://international.unicatt.it/", source: "https://international.unicatt.it/ucscinternational-about-the-university",
    campus: copy("دانشگاه کاتولیک قلب مقدس در شهرهایی مانند میلان، رم، برشا، پیاچنزا و کرمونا حضور دارد. تجربه زندگی و محل کلاس‌ها به پردیس انتخابی وابسته است.", "The Catholic University of the Sacred Heart has locations including Milan, Rome, Brescia, Piacenza and Cremona. Student life and teaching locations depend on the selected campus."),
    focus: copy("این دانشگاه چندرشته‌ای، زمینه‌هایی مانند اقتصاد، علوم انسانی، حقوق و علوم سلامت را در محیط‌های شهری مختلف گرد هم می‌آورد.", "This multidisciplinary university brings together economics, humanities, law and health sciences across different urban settings."),
    fields: ["business", "arts", "law", "health"],
  },
  "polytechnic-university-of-milan": {
    name: "دانشگاه پلی‌تکنیک میلان", website: "https://www.polimi.it/en", source: "https://www.polimi.it/en/the-politecnico/politecnico-di-milano-history/the-current-structure/",
    campus: copy("پردیس‌های لئوناردو و بوویزا از مراکز اصلی پلی‌تکنیک میلان هستند. بوویزا با تبدیل فضاهای صنعتی به محیط‌های دانشگاهی، بخشی از هویت معاصر دانشگاه را شکل می‌دهد.", "Leonardo and Bovisa are key campuses of Politecnico di Milano. Bovisa's transformation of industrial spaces into academic facilities forms part of the university's contemporary identity."),
    focus: copy("مهندسی، معماری و طراحی سه محور اصلی آموزش این دانشگاه هستند و در فضاهای آموزشی و کارگاهی دنبال می‌شوند.", "Engineering, architecture and design are the university's core academic areas, supported by teaching and studio environments."),
    fields: ["engineering", "design", "computing"],
  },
  "polytechnic-university-of-turin": {
    name: "دانشگاه پلی‌تکنیک تورین", website: "https://www.polito.it/en", source: "https://www.polito.it/en/polito/about-us/polito-campuses/torino",
    campus: copy("پردیس مهندسی در کورسو دوکا دلی آبروتزی و مجموعه چیتادلا پلی‌تکنیکا قرار دارد؛ قلعه والنتینو نیز با آموزش معماری و طراحی دانشگاه مرتبط است.", "Engineering is based around Corso Duca degli Abruzzi and the Cittadella Politecnica. Valentino Castle is associated with the university's architecture and design community."),
    focus: copy("مهندسی، معماری و طراحی در شهری با پیشینه صنعتی، زمینه اصلی هویت آموزشی پلی‌تکنیک تورین را می‌سازند.", "Engineering, architecture and design in a city with an industrial heritage shape Politecnico di Torino's academic identity."),
    fields: ["engineering", "design", "computing"],
  },
  "aalborg-university": {
    name: "دانشگاه آلبورگ", website: "https://www.en.aau.dk/", source: "https://www.en.aau.dk/about-aau/profile/pbl",
    campus: copy("دانشگاه آلبورگ در دانمارک، فعالیت گروهی و کار روی مسئله را در تجربه تحصیل برجسته می‌کند. پروژه‌ها به دانشجویان فرصت بررسی مسائل واقعی را می‌دهند.", "Aalborg University in Denmark emphasizes teamwork and problem-based learning. Projects give students a setting to investigate real-world questions."),
    focus: copy("رویکرد مسئله‌محور دانشگاه، دانش نظری را با پروژه‌های گروهی و ارتباط با مسائل جامعه و محیط کار ترکیب می‌کند.", "The university's problem-based approach combines academic knowledge with group projects and questions from society and working life."),
    fields: ["engineering", "science", "social", "health"],
  },
  "aarhus-university": {
    name: "دانشگاه آرهوس", website: "https://www.au.dk/en", source: "https://www.au.dk/om",
    campus: copy("پارک دانشگاهی آرهوس و فضاهای دانشگاهی اطراف آن، محیطی پیوسته میان شهر و دانشگاه می‌سازند. دانشگاه از سال ۱۹۲۸ در این شهر فعالیت دارد.", "Aarhus's University Park and surrounding university areas connect the city with academic life. The university has been based here since 1928."),
    focus: copy("هنر و علوم انسانی، علوم، سلامت و علوم اجتماعی در کنار یکدیگر محیطی چندرشته‌ای برای تحصیل و پژوهش فراهم می‌کنند.", "Arts and humanities, science, health and social sciences create a multidisciplinary environment for study and research."),
    fields: ["arts", "science", "health", "social"],
  },
  "technical-university-of-denmark": {
    name: "دانشگاه فنی دانمارک", website: "https://www.dtu.dk/english", source: "https://www.dtu.dk/english/education/student-guide/dtu-campusses/dtu-lyngby-campus",
    campus: copy("پردیس لینگبی در شمال کپنهاگ قرار دارد و ساختمان‌های آموزشی، آزمایشگاه‌ها و فضاهای سبز را کنار هم قرار می‌دهد.", "The Lyngby campus north of Copenhagen brings teaching buildings, laboratories and green spaces together."),
    focus: copy("مهندسی و فناوری محور اصلی DTU هستند؛ زمینه‌هایی مانند محیط‌زیست، سلامت، فناوری اطلاعات و توسعه محصول به فعالیت علمی آن تنوع می‌دهند.", "Engineering and technology are central to DTU, with areas such as the environment, health, information technology and product development adding breadth."),
    fields: ["engineering", "computing", "science", "health"],
  },
  "cardiff-university": {
    name: "دانشگاه کاردیف", website: "https://www.cardiff.ac.uk/", source: "https://www.cardiff.ac.uk/study/student-life/campuses",
    campus: copy("دانشگاه کاردیف در پایتخت ولز قرار دارد. پردیس‌های کاتیز پارک و هیث پارک محیط‌های متفاوتی برای زندگی دانشگاهی و آموزش مرتبط با سلامت ایجاد می‌کنند.", "Cardiff University is based in the Welsh capital. Cathays Park and Heath Park provide distinct settings for university life and health-related education."),
    focus: copy("حوزه‌های علوم انسانی و اجتماعی، علوم و مهندسی و آموزش سلامت، هویت چندرشته‌ای دانشگاه را شکل می‌دهند.", "Humanities and social sciences, science and engineering, and health education contribute to the university's multidisciplinary identity."),
    fields: ["arts", "social", "engineering", "health"],
  },
  "durham-university": {
    name: "دانشگاه دورهام", website: "https://www.durham.ac.uk/", source: "https://www.durham.ac.uk/about-us/",
    campus: copy("دانشگاه دورهام در شهری تاریخی قرار دارد و ساختار کالجی آن بخشی از زندگی اجتماعی دانشجویان است. جامعه کالج در کنار دانشکده، به تجربه دانشگاهی شکل می‌دهد.", "Durham University is set in a historic city, with a collegiate structure that shapes students' social lives. The college community complements the academic department."),
    focus: copy("علوم، علوم انسانی و علوم اجتماعی در کنار زمینه‌های مدیریت، محیط پژوهشی و آموزشی متنوعی فراهم می‌کنند.", "Science, humanities and social sciences, alongside business, provide a varied teaching and research environment."),
    fields: ["science", "arts", "social", "business"],
  },
  "imperial-college-london": {
    name: "امپریال کالج لندن", website: "https://www.imperial.ac.uk/", source: "https://www.imperial.ac.uk/visit/campuses/south-kensington/",
    campus: copy("پردیس ساوت کنزینگتون در محله‌ای فرهنگی در لندن قرار دارد. دانشگاه در وایت سیتی نیز فضایی برای پژوهش و همکاری با جامعه و صنعت دارد.", "The South Kensington campus sits in a cultural district of London. White City adds a setting for research and collaboration with industry and the community."),
    focus: copy("علوم، مهندسی، پزشکی و مدیریت، زمینه‌های اصلی آموزش و پژوهش امپریال هستند.", "Science, engineering, medicine and business are Imperial's main teaching and research areas."),
    fields: ["science", "engineering", "health", "business"],
  },
  "aalto-university": {
    name: "دانشگاه آلتو", website: "https://www.aalto.fi/en", source: "https://www.aalto.fi/en/study-at-aalto/studying-at-the-aalto-campus",
    campus: copy("پردیس اوتانیمی در اسپو، معماری فنلاندی، فضاهای دانشجویی و محیط‌های نوآوری را در کنار هم قرار می‌دهد و از طریق مترو به هلسینکی متصل است.", "Otaniemi in Espoo brings together Finnish architecture, student spaces and innovation environments, with a metro connection to Helsinki."),
    focus: copy("فناوری، مدیریت و هنر و طراحی در آلتو به یکدیگر نزدیک‌اند و زمینه‌ای برای همکاری میان حوزه‌های متفاوت ایجاد می‌کنند.", "Technology, business, and arts and design meet at Aalto, creating opportunities to connect different academic perspectives."),
    fields: ["engineering", "business", "design", "computing"],
  },
  "tampere-university": {
    name: "دانشگاه تامپره", website: "https://www.tuni.fi/en", source: "https://www.tuni.fi/en/tau/campuses",
    campus: copy("دانشگاه تامپره در پردیس‌های مرکز شهر، هروانتا و کاوپی فعالیت دارد. کاوپی به محیط بیمارستانی نزدیک است و هر پردیس ویژگی علمی و روزمره خود را دارد.", "Tampere University operates at the City centre, Hervanta and Kauppi campuses. Kauppi is close to the hospital environment, and each campus has its own academic and everyday setting."),
    focus: copy("فناوری، سلامت و جامعه سه زمینه اصلی پیوند آموزش و پژوهش در دانشگاه تامپره هستند.", "Technology, health and society are central themes connecting teaching and research at Tampere University."),
    fields: ["engineering", "health", "social", "computing"],
  },
  "university-of-helsinki": {
    name: "دانشگاه هلسینکی", website: "https://www.helsinki.fi/en", source: "https://www.helsinki.fi/en/about-us/visit-us/campuses",
    campus: copy("چهار پردیس مرکز شهر، کومپولا، میلاهتی و ویکی در نقاط مختلف هلسینکی قرار دارند. هر پردیس محیط آموزشی و پژوهشی خاص خود را دارد.", "The City Centre, Kumpula, Meilahti and Viikki campuses are located in different parts of Helsinki, each with its own teaching and research setting."),
    focus: copy("علوم انسانی، علوم طبیعی، پزشکی و علوم زیستی در این دانشگاه پژوهش‌محور در کنار یکدیگر قرار گرفته‌اند.", "Humanities, natural sciences, medicine and life sciences sit alongside one another at this research university."),
    fields: ["arts", "science", "health", "agriculture"], address: "Fabianinkatu 33, Helsinki, Finland",
  },
  "delft-university-of-technology": {
    name: "دانشگاه فنی دلفت", website: "https://www.tudelft.nl/en/", source: "https://www.tudelft.nl/en/",
    campus: copy("دانشگاه فنی دلفت در شهر دلفت هلند قرار دارد. فضای پردیس، ساختمان‌های آموزشی و پژوهشی را با مسیرهای پیاده و محوطه‌های باز به یکدیگر پیوند می‌دهد.", "Delft University of Technology is based in Delft, the Netherlands. Its campus connects teaching and research buildings through pedestrian routes and open spaces."),
    focus: copy("مهندسی، فناوری، معماری و طراحی محور هویت علمی این دانشگاه هستند و مسائل فنی را از نگاه‌های متفاوت بررسی می‌کنند.", "Engineering, technology, architecture and design form the university's academic identity, approaching technical questions from different perspectives."),
    fields: ["engineering", "design", "computing", "science"],
  },
  "eindhoven-university-of-technology": {
    name: "دانشگاه فنی آیندهوون", website: "https://www.tue.nl/en/", source: "https://research.tue.nl/en/",
    campus: copy("دانشگاه فنی آیندهوون در شهر آیندهوون هلند قرار دارد؛ محیط دانشگاهی آن بر آموزش و پژوهش در فناوری و مهندسی متمرکز است.", "Eindhoven University of Technology is located in Eindhoven, the Netherlands, with an academic environment centered on technology and engineering."),
    focus: copy("علوم کاربردی، مهندسی، علوم کامپیوتر و طراحی از حوزه‌های علمی دانشگاه هستند. پرتال پژوهش دانشگاه امکان آشنایی با گروه‌ها و فعالیت‌های علمی را فراهم می‌کند.", "Applied sciences, engineering, computer science and design are among its academic fields. The research portal introduces its groups and scholarly activities."),
    fields: ["engineering", "computing", "science", "design"],
  },
  "erasmus-university-rotterdam": {
    name: "دانشگاه اراسموس روتردام", website: "https://www.eur.nl/en", source: "https://www.eur.nl/en/campus/locations/campus-woudestein",
    campus: copy("وودشتاین پردیس اصلی اراسموس در روتردام است. فضاهای مطالعه، محل‌های غذاخوری و فعالیت‌های دانشجویی در کنار ارتباط با حمل‌ونقل شهری قرار دارند.", "Woudestein is Erasmus University's main campus in Rotterdam. Study spaces, places to eat and student activities sit alongside connections to urban transport."),
    focus: copy("اقتصاد، مدیریت، علوم اجتماعی و سلامت از حوزه‌هایی هستند که آموزش و پژوهش دانشگاه را به مسائل جامعه پیوند می‌دهند.", "Economics, business, social sciences and health connect the university's teaching and research with questions facing society."),
    fields: ["business", "social", "health", "law"],
  },
  "massey-university": {
    name: "دانشگاه مسی", website: "https://www.massey.ac.nz/", source: "https://www.massey.ac.nz/about/contact-us/",
    campus: copy("دانشگاه مسی در پالمرستون نورث، اوکلند و ولینگتون حضور دارد. پردیس ماناواتو در پالمرستون نورث یکی از محیط‌های اصلی زندگی و آموزش دانشگاه است.", "Massey has a presence in Palmerston North, Auckland and Wellington. The Manawatū campus in Palmerston North is a key setting for university life and teaching."),
    focus: copy("حوزه‌هایی مانند کشاورزی و علوم زیستی، مدیریت، طراحی و علوم اجتماعی، تنوع آموزشی مسی را نشان می‌دهند؛ پردیس مرتبط با رشته انتخابی را بررسی کنید.", "Agriculture and life sciences, business, design and social sciences reflect Massey's academic variety. Check the campus associated with your chosen field."),
    fields: ["agriculture", "business", "design", "social"],
  },
  "the-university-of-auckland": {
    name: "دانشگاه اوکلند", website: "https://www.auckland.ac.nz/en.html", source: "https://www.auckland.ac.nz/en/on-campus/our-campuses/campus-locations0/city-campus.html",
    campus: copy("پردیس شهری دانشگاه اوکلند نزدیک آلبرت پارک قرار دارد و به فضاهای فرهنگی، فروشگاه‌ها و حمل‌ونقل مرکز شهر دسترسی دارد. ساختمان تاریخی برج ساعت بخشی از هویت آن است.", "The University of Auckland's City Campus is close to Albert Park and central-city cultural venues, shops and transport. Its historic ClockTower is part of the campus identity."),
    focus: copy("علوم، مهندسی، مدیریت و علوم سلامت بخشی از محیط چندرشته‌ای دانشگاه هستند؛ برخی فعالیت‌های آموزشی در پردیس‌های دیگر انجام می‌شوند.", "Science, engineering, business and health form part of the university's multidisciplinary environment. Some teaching takes place at other campuses."),
    fields: ["science", "engineering", "business", "health"],
  },
  "university-of-otago": {
    name: "دانشگاه اوتاگو", website: "https://www.otago.ac.nz/", source: "https://www.otago.ac.nz/life/campus",
    campus: copy("پردیس اصلی اوتاگو در داندین، ساختمان‌های تاریخی و مدرن را در کنار فضای سبز و رود لیث گرد هم می‌آورد. کتابخانه‌ها و کافه‌ها بخشی از زندگی روزانه پردیس هستند.", "Otago's main campus in Dunedin brings historic and modern buildings together with green spaces and the Leith River. Libraries and cafés form part of everyday campus life."),
    focus: copy("علوم سلامت، علوم، علوم انسانی و مدیریت در محیطی دانشگاهی با ارتباط نزدیک با شهر دانشجویی داندین ارائه می‌شوند.", "Health sciences, sciences, humanities and business are set within a university environment closely connected to the student city of Dunedin."),
    fields: ["health", "science", "arts", "business"],
  },
  "chalmers-university-of-technology": {
    name: "دانشگاه فناوری چالمرز", website: "https://www.chalmers.se/en/", source: "https://www.chalmers.se/en/about-chalmers/chalmers-campuses/",
    campus: copy("چالمرز در گوتنبرگ قرار دارد. پردیس یوهانبرگ فضاهای آموزشی، کتابخانه و فعالیت‌های دانشجویی را در کنار هم قرار می‌دهد؛ دانشگاه در لیندهولمن نیز فعالیت دارد.", "Chalmers is based in Gothenburg. Johanneberg brings teaching spaces, the library and student activities together, while the university also has a presence at Lindholmen."),
    focus: copy("مهندسی، علوم طبیعی، فناوری و معماری در مرکز فعالیت‌های علمی این دانشگاه قرار دارند.", "Engineering, natural sciences, technology and architecture are central to the university's academic activities."),
    fields: ["engineering", "science", "computing", "design"],
  },
  "kth-royal-institute-of-technology": {
    name: "مؤسسه سلطنتی فناوری KTH", website: "https://www.kth.se/en", source: "https://www.kth.se/en/om/kontakt/campus",
    campus: copy("KTH در استکهلم فعالیت دارد؛ پردیس اصلی در محدوده والهالاواگن و آلبانو با فضاهای آموزشی، کتابخانه و محیط شهری پیوند خورده است. محل تحصیل می‌تواند میان پردیس‌ها متفاوت باشد.", "KTH is based in Stockholm. Its main campus around Valhallavägen and Albano connects teaching spaces and the library with the city. Study locations can vary between campuses."),
    focus: copy("مهندسی، علوم کامپیوتر، علوم طبیعی و معماری زمینه‌های اصلی آموزش و پژوهش فنی در KTH هستند.", "Engineering, computer science, natural sciences and architecture are central to technical education and research at KTH."),
    fields: ["engineering", "computing", "science", "design"],
  },
  "karolinska-institute": {
    name: "مؤسسه کارولینسکا", website: "https://ki.se/en", source: "https://education.ki.se/student-at-ki/campus-information",
    campus: copy("کارولینسکا دو پردیس اصلی در سولنا و فلمینگزبرگ دارد. کتابخانه‌ها، اتاق‌های مطالعه و ارتباط میان محیط دانشگاه و مراکز درمانی، تجربه روزمره دانشجویان را شکل می‌دهند.", "Karolinska has two main campuses in Solna and Flemingsberg. Libraries, study rooms and connections between academic and healthcare environments shape the student experience."),
    focus: copy("پزشکی، سلامت و پژوهش زیست‌پزشکی محور اصلی این دانشگاه هستند و آموزش را به پرسش‌های مرتبط با سلامت انسان پیوند می‌دهند.", "Medicine, health and biomedical research are central to this university, linking education with questions about human health."),
    fields: ["health", "science"],
  },
  "university-of-toronto": {
    name: "دانشگاه تورنتو", website: "https://www.utoronto.ca/", source: "https://www.utoronto.ca/university-life/campuses",
    campus: copy("دانشگاه تورنتو سه پردیس سنت جورج، میسیساگا و اسکاربرو در منطقه تورنتوی بزرگ دارد. هر پردیس تجربه زندگی و محیط آموزشی متفاوتی ارائه می‌کند.", "The University of Toronto has three campuses in the Greater Toronto Area: St. George, Mississauga and Scarborough. Each offers a distinct living and learning environment."),
    focus: copy("علوم، علوم انسانی، مهندسی و سلامت در یک مجموعه پژوهشی گسترده قرار دارند. انتخاب پردیس بخشی از انتخاب مسیر تحصیلی در این دانشگاه است.", "Science, humanities, engineering and health sit within a broad research community. Campus choice is part of choosing a study pathway here."),
    fields: ["science", "arts", "engineering", "health"], photo: copy("یونیورسیتی کالج در پردیس سنت جورج تورنتو", "University College at Toronto's St. George campus"),
  },
  "technical-university-of-munich": {
    name: "دانشگاه فنی مونیخ", website: "https://www.tum.de/en/", source: "https://www.tum.de/en/about-tum/locations",
    campus: copy("TUM از مرکز مونیخ تا گارشینگ و وایهن‌اشتفان گسترده است. گارشینگ محیط اصلی علوم و مهندسی و وایهن‌اشتفان یکی از مراکز علوم زیستی دانشگاه است.", "TUM extends from central Munich to Garching and Weihenstephan. Garching is a major science and engineering setting, while Weihenstephan focuses on life sciences."),
    focus: copy("آموزش فنی، علوم طبیعی، علوم زیستی و مدیریت در پردیس‌های تخصصی دانشگاه به یکدیگر متصل می‌شوند.", "Technical education, natural sciences, life sciences and management connect across the university's specialized campuses."),
    fields: ["engineering", "science", "agriculture", "business"], photo: copy("ساختمان ریاضی و علوم کامپیوتر TUM در گارشینگ", "TUM mathematics and computer science building in Garching"),
  },
  "university-of-bologna": {
    name: "دانشگاه بولونیا", website: "https://www.unibo.it/en", source: "https://www.unibo.it/en/university/organisation-and-campuses/organisations-and-campuses",
    campus: copy("دانشگاه بولونیا ساختاری چندپردیسی در بولونیا، چزنا، فورلی، راونا و ریمینی دارد. هر شهر، محیط علمی و فرهنگی متفاوتی برای دانشجویان فراهم می‌کند.", "The University of Bologna has a multicampus structure in Bologna, Cesena, Forlì, Ravenna and Rimini. Each city provides a distinct academic and cultural setting."),
    focus: copy("علوم انسانی، حقوق، علوم و مهندسی در این مجموعه چندرشته‌ای حضور دارند. محل ارائه آموزش باید همراه با مسیر تحصیلی انتخاب شود.", "Humanities, law, sciences and engineering are part of this multidisciplinary university. The teaching location should be considered alongside the chosen study pathway."),
    fields: ["arts", "law", "science", "engineering"], photo: copy("حیاط کاخ پوجی در بولونیا", "Palazzo Poggi courtyard in Bologna"),
  },
};

const countryGuidance: Record<string, string> = {
  Canada: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html",
  Germany: "https://www.make-it-in-germany.com/en/visa-residence/types/studying",
  Australia: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
  Italy: "https://www.universitaly.it/it/studenti-stranieri",
  Denmark: "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study/Higher-education",
  "United Kingdom": "https://www.gov.uk/student-visa",
  Finland: "https://migri.fi/en/studying-in-finland",
  Netherlands: "https://ind.nl/en/residence-permits/study/student-residence-permit-for-university-or-higher-professional-education",
  "New Zealand": "https://www.immigration.govt.nz/study/",
  Sweden: "https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html",
};

const historyNotes: Record<string, Copy> = {
  "adelaide-university": copy("دانشگاه جدید آدلاید در ۲۰۲۴ تأسیس شد و فعالیت آموزشی آن در ژانویه ۲۰۲۶ آغاز شد. آمار دانشگاه آدلاید قدیم و دانشگاه استرالیای جنوبی، آمار این مؤسسه جدید محسوب نمی‌شود.", "The new Adelaide University was established in 2024 and began teaching in January 2026. Statistics for the former University of Adelaide and University of South Australia do not describe this new institution."),
  "curtin-university": copy("سال ۱۹۶۶ به تأسیس مؤسسه فناوری استرالیای غربی (WAIT) اشاره دارد؛ این مؤسسه در ۱۹۸۷ به دانشگاه کرتین تبدیل شد.", "The 1966 foundation date refers to the Western Australian Institute of Technology (WAIT); it became Curtin University in 1987."),
  "charite-universitatsmedizin-berlin": copy("ریشه شاریته به بیمارستان تأسیس‌شده در ۱۷۱۰ می‌رسد. ساختار مشترک کنونی پزشکی دانشگاه آزاد برلین و هومبولت در ۲۰۰۳ شکل گرفت.", "Charité traces its origins to the hospital founded in 1710. Its current joint medical-faculty structure for Freie Universität Berlin and Humboldt-Universität dates to 2003."),
  "massey-university": copy("ریشه مؤسسه به کالج کشاورزی مسی در ۱۹۲۷ می‌رسد؛ مسی در ۱۹۶۴ به دانشگاه تبدیل شد.", "The institution traces its roots to Massey Agricultural College in 1927; Massey became a university in 1964."),
  "erasmus-university-rotterdam": copy("سال ۱۹۱۳ به تأسیس مدرسه بازرگانی پیشین اشاره دارد؛ دانشگاه اراسموس با ساختار کنونی در ۱۹۷۳ شکل گرفت.", "The 1913 date marks the founding of its predecessor business school; Erasmus University in its present form dates to 1973."),
  "tampere-university": copy("دانشگاه کنونی تامپره در ۲۰۱۹ از ادغام دانشگاه تامپره و دانشگاه فناوری تامپره ایجاد شد.", "The current Tampere University was formed in 2019 through the merger of the University of Tampere and Tampere University of Technology."),
};

export function enrichUniversityInfo(base: UniversityInfo): UniversityInfo {
  const profile = Object.hasOwn(universityProfiles, base.slug) ? universityProfiles[base.slug] : undefined;
  if (!profile) return base;
  const details = facts[base.slug];
  const guidance = Object.hasOwn(countryGuidance, base.country.en) ? countryGuidance[base.country.en] : undefined;
  const admission = copy("پیش‌نیازها، زبان آموزش و مدارک لازم را در صفحه پذیرش رشته انتخابی بررسی کنید. هر شرطی که در نامه پذیرش درج شده باید در مهلت تعیین‌شده تکمیل شود.", "Check prerequisites, teaching language and required documents on the admissions page for your chosen field. Any conditions stated in an offer must be met by the specified deadline.");
  const housing = copy("محل کلاس‌ها را پیش از انتخاب محل اقامت مشخص کنید. گزینه‌های مسکن، ظرفیت، شرایط درخواست و مهلت‌ها را از راهنمای رسمی دانشگاه بررسی کنید؛ پذیرش تحصیلی به‌تنهایی تضمین محل اقامت نیست.", "Confirm your teaching location before choosing where to live. Check the university's official guidance for housing options, capacity, application requirements and deadlines; academic admission alone does not guarantee accommodation.");
  const offerings: UniversityOffering[] = [
    ...(guidance ? [{ icon: "permit" as const, title: copy("اقامت و مسیر پس از تحصیل", "Residence and post-study guidance"), status: copy("بررسی شرایط", "Check eligibility"),
      text: copy(`برای برنامه‌ریزی اقامت پس از تحصیل در ${base.country.fa}، راهنمای مرجع رسمی این کشور را بررسی کنید. تابعیت، نوع مجوز و مسیر تحصیلی در انتخاب راه مناسب اهمیت دارند.`, `For planning your stay after study in ${base.country.en}, consult the country's official guidance. Nationality, permit type and study pathway matter when identifying the appropriate route.`), url: guidance }] : []),
    { icon: "internship", title: copy("کوآپ و کارآموزی", "Co-op / Internship Participation"), status: copy("بسته به رشته", "Program dependent"), text: copy(`امکان کارآموزی، پروژه عملی یا کوآپ در ${profile.name} را برای رشته انتخابی خود بررسی کنید. وجود این فرصت‌ها، نحوه انتخاب و احتساب واحد به مقررات همان دوره وابسته است.`, `Check internship, practical project or co-op options for your chosen field at ${base.englishName}. Availability, selection and academic credit depend on the specific course regulations.`), url: profile.website },
    ...(guidance ? [{ icon: "work" as const, title: copy("کار هنگام تحصیل", "Work While Studying"), status: copy("بررسی شرایط", "Check eligibility"), text: copy(`پیش از شروع کار در ${base.country.fa}، شرایط مجوز اقامت و محدودیت‌های مرتبط با وضعیت دانشجویی خود را در راهنمای رسمی بررسی کنید. این اطلاعات برای همه تابعیت‌ها و انواع مجوز یکسان نیست.`, `Before starting work in ${base.country.en}, check the official guidance for your residence status and any student-related restrictions. Requirements differ by nationality and permit type.`), url: guidance }] : []),
    { icon: "offer", title: copy("شرایط نامه پذیرش", "Offer conditions"), status: copy("طبق نامه پذیرش", "Offer specific"), text: admission, url: profile.website },
    { icon: "home", title: copy("اقامتگاه‌های دانشجویی", "Accommodations"), status: copy("بررسی ظرفیت", "Check availability"), text: housing, url: profile.source },
  ];
  return {
    ...base,
    name: { ...base.name, fa: profile.name },
    websiteUrl: profile.website,
    ...(profile.photo ? {
      logo: `/university-info/${base.slug}-logo.png`,
      photos: [{ src: `/university-info/${base.slug}.jpg`, caption: profile.photo }],
    } : {}),
    summary: profile.campus,
    about: copy(`${profile.campus.fa} ${profile.focus.fa}`, `${profile.campus.en} ${profile.focus.en}`),
    city: details.city,
    address: details.address,
    foundedYear: details.foundedYear,
    institutionType: institutionTypes[details.kind],
    dli: details.dli,
    ...universityDisciplineData(base.slug),
    academicFields: profile.fields.map((field) => fields[field]),
    whyChoose: [
      { title: copy("محیط دانشگاه", "University setting"), text: profile.campus, sourceUrl: profile.source },
      { title: copy("هویت علمی", "Academic identity"), text: profile.focus, sourceUrl: profile.website },
    ],
    notes: [
      ...(historyNotes[base.slug] ? [{ title: copy("پیشینه مؤسسه", "Institutional history"), text: historyNotes[base.slug], sourceUrl: profile.website }] : []),
      { title: copy("پذیرش و زبان آموزش", "Admissions and teaching language"), text: admission, sourceUrl: profile.website },
      { title: copy("انتخاب محل اقامت", "Choosing accommodation"), text: housing, sourceUrl: profile.source },
    ],
    features: [
      { title: copy("فضای پردیس", "Campus setting"), text: copy(`برای آشنایی با محیط ${profile.name}، محل دانشکده و مسیر رفت‌وآمد خود را در نقشه دانشگاه پیدا کنید.`, `Explore ${base.englishName}'s campus information to locate your department and plan your daily journey.`), url: profile.source },
      { title: copy("برنامه‌ریزی زندگی دانشجویی", "Planning student life"), text: copy("فاصله محل اقامت تا کلاس‌ها، دسترسی به حمل‌ونقل و مهلت درخواست مسکن را پیش از ورود بررسی کنید.", "Before arrival, consider the journey between accommodation and classes, transport connections and housing application deadlines."), url: profile.website },
      { title: copy("مطالعه و پژوهش", "Study and research"), text: copy("از راهنمای دانشجویان دانشگاه برای یافتن منابع آموزشی، فضاهای مطالعه و مسیر ارتباط با دانشکده استفاده کنید.", "Use the university's student guidance to find learning resources, study spaces and ways to contact your department."), url: profile.website },
    ],
    offerings,
    sources: [{ label: base.englishName, url: profile.website }, { label: "Campus and university profile", url: profile.source }, ...(guidance ? [{ label: "Official student guidance", url: guidance }] : [])],
  };
}
