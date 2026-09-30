import type { Locale } from "@/lib/site-content";

export type HomeUniversity = {
  country: string;
  slug: string;
  name: string;
  location: string;
  summary: Record<Locale, string>;
  image: string;
  logo: string;
};

export const homeUniversities: HomeUniversity[] = [
  {
    "country": "canada",
    "slug": "dalhousie-university",
    "name": "Dalhousie University",
    "location": "Halifax, Nova Scotia, Canada",
    "summary": {
      "fa": "دانشگاه دالهاوزی در هلیفکس آموزش و پژوهش را در رشته‌های متنوع ارائه می‌کند.",
      "en": "Dalhousie is a research university in Halifax offering study across a broad range of disciplines."
    },
    "image": "/universities/dalhousie.jpg",
    "logo": "/universities/dalhousie-logo.jpg"
  },
  {
    "country": "canada",
    "slug": "laval-university",
    "name": "Laval University",
    "location": "Québec City, Québec, Canada",
    "summary": {
      "fa": "دانشگاه لاوال در شهر کبک، دانشگاهی فرانسوی‌زبان با دانشکده‌ها و حوزه‌های پژوهشی متنوع است.",
      "en": "Université Laval is a French-language research university in Québec City with a wide range of faculties."
    },
    "image": "/universities/laval.jpg",
    "logo": "/universities/laval-university-logo.svg"
  },
  {
    "country": "canada",
    "slug": "mcgill-university",
    "name": "McGill University",
    "location": "Montréal, Québec, Canada",
    "summary": {
      "fa": "دانشگاه مک‌گیل در مونترآل برنامه‌های آموزشی و پژوهشی را در رشته‌های گوناگون ارائه می‌کند.",
      "en": "McGill is a Montréal research university with programs across many fields."
    },
    "image": "/universities/mcgill.jpg",
    "logo": "/universities/mcgill-university-logo.svg"
  },
  {
    "country": "germany",
    "slug": "braunschweig-university-of-technology",
    "name": "Braunschweig University of Technology",
    "location": "Braunschweig, Germany",
    "summary": {
      "fa": "دانشگاه فنی براونشوایگ، با نام TU Braunschweig، در مهندسی، علوم طبیعی و پژوهش میان‌رشته‌ای فعالیت دارد.",
      "en": "TU Braunschweig is a technical university with teaching and research in engineering, natural sciences, and related fields."
    },
    "image": "/universities/braunschweig-university-of-technology.jpg",
    "logo": "/universities/braunschweig-university-of-technology-logo.svg"
  },
  {
    "country": "germany",
    "slug": "charite-universitatsmedizin-berlin",
    "name": "Charité – Universitätsmedizin Berlin",
    "location": "Berlin, Germany",
    "summary": {
      "fa": "شاریته دانشکده پزشکی و بیمارستان دانشگاهی برلین است و آموزش پزشکی را با پژوهش و خدمات درمانی پیوند می‌دهد.",
      "en": "Charité combines medical education, research, and university hospital care across its Berlin campuses."
    },
    "image": "/universities/charite-universitatsmedizin-berlin.jpg",
    "logo": "/universities/charite-universitatsmedizin-berlin-logo.svg"
  },
  {
    "country": "germany",
    "slug": "eberhard-karls-university-of-tubingen",
    "name": "Eberhard Karls University of Tübingen",
    "location": "Tübingen, Germany",
    "summary": {
      "fa": "دانشگاه ابرهارد کارلز توبینگن دانشگاهی پژوهشی است که علوم انسانی، علوم طبیعی و پزشکی را در بر می‌گیرد.",
      "en": "The University of Tübingen is a research university spanning the humanities, natural sciences, and medicine."
    },
    "image": "/universities/eberhard-karls-university-of-tubingen.jpg",
    "logo": "/universities/eberhard-karls-university-of-tubingen-logo.svg"
  },
  {
    "country": "australia",
    "slug": "australian-national-university",
    "name": "Australian National University",
    "location": "Canberra, Australian Capital Territory, Australia",
    "summary": {
      "fa": "دانشگاه ملی استرالیا در کانبرا، آموزش و پژوهش را در حوزه‌هایی از علوم و مهندسی تا علوم انسانی ارائه می‌کند.",
      "en": "Based in Canberra, ANU offers teaching and research across science, engineering, humanities, and social sciences."
    },
    "image": "/universities/australian-national-university.jpg",
    "logo": "/universities/australian-national-university-logo.svg"
  },
  {
    "country": "australia",
    "slug": "adelaide-university",
    "name": "Adelaide University",
    "location": "Adelaide, South Australia, Australia",
    "summary": {
      "fa": "دانشگاه آدلاید در سال ۲۰۲۶ از ادغام University of Adelaide و University of South Australia شکل گرفت.",
      "en": "Adelaide University began operating in 2026 after the merger of the University of Adelaide and the University of South Australia."
    },
    "image": "/universities/adelaide-university.jpg",
    "logo": "/universities/adelaide-university-logo.svg"
  },
  {
    "country": "australia",
    "slug": "curtin-university",
    "name": "Curtin University",
    "location": "Perth, Western Australia, Australia",
    "summary": {
      "fa": "دانشگاه کرتین در پرت برنامه‌های آموزشی و پژوهشی متنوعی با پیوند به صنعت ارائه می‌کند.",
      "en": "Curtin is a Perth-based university offering a broad range of teaching and research with industry links."
    },
    "image": "/universities/curtin-university.jpg",
    "logo": "/universities/curtin-university-logo.svg"
  },
  {
    "country": "italy",
    "slug": "catholic-university-of-the-sacred-heart",
    "name": "Catholic University of the Sacred Heart",
    "location": "Milan, Italy",
    "summary": {
      "fa": "دانشگاه کاتولیک قلب مقدس، دانشگاهی خصوصی در میلان است که در رشته‌های گوناگون آموزش و پژوهش دارد.",
      "en": "Università Cattolica del Sacro Cuore is a private university based in Milan with teaching and research across many disciplines."
    },
    "image": "/universities/catholic-university-of-the-sacred-heart.jpg",
    "logo": "/universities/catholic-university-of-the-sacred-heart-logo.svg"
  },
  {
    "country": "italy",
    "slug": "polytechnic-university-of-milan",
    "name": "Polytechnic University of Milan",
    "location": "Milan, Italy",
    "summary": {
      "fa": "پلی‌تکنیک میلان در مهندسی، معماری و طراحی آموزش و پژوهش ارائه می‌کند.",
      "en": "Politecnico di Milano focuses on engineering, architecture, and design."
    },
    "image": "/universities/polytechnic-university-of-milan.jpg",
    "logo": "/universities/polytechnic-university-of-milan-logo.svg"
  },
  {
    "country": "italy",
    "slug": "polytechnic-university-of-turin",
    "name": "Polytechnic University of Turin",
    "location": "Turin, Italy",
    "summary": {
      "fa": "پلی‌تکنیک تورین دانشگاهی فنی با برنامه‌های مهندسی، معماری و طراحی صنعتی است.",
      "en": "Politecnico di Torino is a technical university known for engineering, architecture, and industrial design."
    },
    "image": "/universities/polytechnic-university-of-turin.jpg",
    "logo": "/universities/polytechnic-university-of-turin-logo.svg"
  },
  {
    "country": "denmark",
    "slug": "aalborg-university",
    "name": "Aalborg University",
    "location": "Aalborg, Denmark",
    "summary": {
      "fa": "دانشگاه آلبورگ به رویکرد یادگیری مسئله‌محور و همکاری نزدیک آموزش و پژوهش شناخته می‌شود.",
      "en": "Aalborg University is known for problem-based learning and research-led education."
    },
    "image": "/universities/aalborg-university.jpg",
    "logo": "/universities/aalborg-university-logo.png"
  },
  {
    "country": "denmark",
    "slug": "aarhus-university",
    "name": "Aarhus University",
    "location": "Aarhus, Denmark",
    "summary": {
      "fa": "دانشگاه آرهوس، دانشگاهی پژوهشی با رشته‌های متنوع از هنر و علوم انسانی تا علوم و سلامت است.",
      "en": "Aarhus University is a broad research university spanning arts, sciences, health, and more."
    },
    "image": "/universities/aarhus-university.jpg",
    "logo": "/universities/aarhus-university-logo.svg"
  },
  {
    "country": "denmark",
    "slug": "technical-university-of-denmark",
    "name": "Technical University of Denmark",
    "location": "Kongens Lyngby, Denmark",
    "summary": {
      "fa": "دانشگاه فنی دانمارک یا DTU بر مهندسی، فناوری و پژوهش کاربردی تمرکز دارد.",
      "en": "DTU focuses on engineering, technology, and applied research at its Lyngby campus."
    },
    "image": "/universities/technical-university-of-denmark.jpg",
    "logo": "/universities/technical-university-of-denmark-logo.svg"
  },
  {
    "country": "united-kingdom",
    "slug": "cardiff-university",
    "name": "Cardiff University",
    "location": "Cardiff, Wales, United Kingdom",
    "summary": {
      "fa": "دانشگاه کاردیف در پایتخت ولز، آموزش و پژوهش را در رشته‌های گسترده ارائه می‌کند.",
      "en": "Cardiff University is a research university in the Welsh capital with a broad range of subjects."
    },
    "image": "/universities/cardiff-university.jpg",
    "logo": "/universities/cardiff-university-logo.png"
  },
  {
    "country": "united-kingdom",
    "slug": "durham-university",
    "name": "Durham University",
    "location": "Durham, England, United Kingdom",
    "summary": {
      "fa": "دانشگاه دورهام، دانشگاهی پژوهشی با ساختار کالج‌محور در شهر تاریخی دورهام است.",
      "en": "Durham is a collegiate research university in the historic city of Durham."
    },
    "image": "/universities/durham-university.jpg",
    "logo": "/universities/durham-university-logo.png"
  },
  {
    "country": "united-kingdom",
    "slug": "imperial-college-london",
    "name": "Imperial College London",
    "location": "London, England, United Kingdom",
    "summary": {
      "fa": "امپریال کالج لندن بر علوم، مهندسی، پزشکی و کسب‌وکار تمرکز دارد.",
      "en": "Imperial College London focuses on science, engineering, medicine, and business."
    },
    "image": "/universities/imperial-college-london.jpg",
    "logo": "/universities/imperial-college-london-logo.png"
  },
  {
    "country": "finland",
    "slug": "aalto-university",
    "name": "Aalto University",
    "location": "Espoo, Finland",
    "summary": {
      "fa": "دانشگاه آلتو در اسپو، فناوری، کسب‌وکار، هنر و طراحی را در آموزش و پژوهش کنار هم قرار می‌دهد.",
      "en": "Aalto University brings together technology, business, arts, and design in Espoo."
    },
    "image": "/universities/aalto-university.jpg",
    "logo": "/universities/aalto-university-logo.svg"
  },
  {
    "country": "finland",
    "slug": "tampere-university",
    "name": "Tampere University",
    "location": "Tampere, Finland",
    "summary": {
      "fa": "دانشگاه تامپره رشته‌هایی از فناوری و علوم تا سلامت و جامعه را پوشش می‌دهد.",
      "en": "Tampere University spans technology, health, social sciences, and other fields."
    },
    "image": "/universities/tampere-university.jpg",
    "logo": "/universities/tampere-university-logo.svg"
  },
  {
    "country": "finland",
    "slug": "university-of-helsinki",
    "name": "University of Helsinki",
    "location": "Helsinki, Finland",
    "summary": {
      "fa": "دانشگاه هلسینکی، دانشگاهی پژوهشی با مجموعه گسترده‌ای از دانشکده‌ها و برنامه‌های تحصیلی است.",
      "en": "The University of Helsinki is a broad research university with programs across many disciplines."
    },
    "image": "/universities/university-of-helsinki.jpg",
    "logo": "/universities/university-of-helsinki-logo.svg"
  },
  {
    "country": "netherlands",
    "slug": "delft-university-of-technology",
    "name": "Delft University of Technology",
    "location": "Delft, Netherlands",
    "summary": {
      "fa": "دانشگاه صنعتی دلفت بر مهندسی، فناوری و طراحی برای حل مسائل جامعه تمرکز دارد.",
      "en": "TU Delft focuses on engineering, technology, and design."
    },
    "image": "/universities/delft-university-of-technology.jpg",
    "logo": "/universities/delft-university-of-technology-logo.svg"
  },
  {
    "country": "netherlands",
    "slug": "eindhoven-university-of-technology",
    "name": "Eindhoven University of Technology",
    "location": "Eindhoven, Netherlands",
    "summary": {
      "fa": "دانشگاه صنعتی آیندهوون آموزش و پژوهش فناوری را با همکاری صنعت دنبال می‌کند.",
      "en": "TU/e is a technology-focused university in Eindhoven with close industry collaboration."
    },
    "image": "/universities/eindhoven-university-of-technology.jpg",
    "logo": "/universities/eindhoven-university-of-technology-logo.svg"
  },
  {
    "country": "netherlands",
    "slug": "erasmus-university-rotterdam",
    "name": "Erasmus University Rotterdam",
    "location": "Rotterdam, Netherlands",
    "summary": {
      "fa": "دانشگاه اراسموس روتردام در اقتصاد، مدیریت، علوم اجتماعی و سلامت فعالیت دارد.",
      "en": "Erasmus University Rotterdam teaches and researches economics, management, social sciences, and health."
    },
    "image": "/universities/erasmus-university-rotterdam.jpg",
    "logo": "/universities/erasmus-university-rotterdam-logo.png"
  },
  {
    "country": "new-zealand",
    "slug": "massey-university",
    "name": "Massey University",
    "location": "Palmerston North, New Zealand",
    "summary": {
      "fa": "دانشگاه مسی علاوه بر پردیس پالمرستون نورث، در آوکلند و ولینگتون نیز حضور دارد.",
      "en": "Massey University has campuses in Palmerston North, Auckland, and Wellington."
    },
    "image": "/universities/massey-university.jpg",
    "logo": "/universities/massey-university-logo.png"
  },
  {
    "country": "new-zealand",
    "slug": "the-university-of-auckland",
    "name": "The University of Auckland",
    "location": "Auckland, New Zealand",
    "summary": {
      "fa": "دانشگاه آوکلند، دانشگاهی پژوهشی با رشته‌های متنوع در بزرگ‌ترین شهر نیوزلند است.",
      "en": "The University of Auckland is a broad research university in New Zealand's largest city."
    },
    "image": "/universities/the-university-of-auckland.jpg",
    "logo": "/universities/the-university-of-auckland-logo.png"
  },
  {
    "country": "new-zealand",
    "slug": "university-of-otago",
    "name": "University of Otago",
    "location": "Dunedin, New Zealand",
    "summary": {
      "fa": "دانشگاه اوتاگو در داندین، آموزش و پژوهش را در حوزه‌های گسترده از سلامت تا علوم انسانی ارائه می‌کند.",
      "en": "Based in Dunedin, the University of Otago offers study and research across health, sciences, humanities, and more."
    },
    "image": "/universities/university-of-otago.jpg",
    "logo": "/universities/university-of-otago-logo.png"
  },
  {
    "country": "sweden",
    "slug": "chalmers-university-of-technology",
    "name": "Chalmers University of Technology",
    "location": "Gothenburg, Sweden",
    "summary": {
      "fa": "دانشگاه فناوری چالمرز در گوتنبرگ بر مهندسی، علوم و پژوهش کاربردی تمرکز دارد.",
      "en": "Chalmers is a Gothenburg university focused on engineering, science, and applied research."
    },
    "image": "/universities/chalmers-university-of-technology.jpg",
    "logo": "/universities/chalmers-university-of-technology-logo.png"
  },
  {
    "country": "sweden",
    "slug": "kth-royal-institute-of-technology",
    "name": "KTH Royal Institute of Technology",
    "location": "Stockholm, Sweden",
    "summary": {
      "fa": "مؤسسه سلطنتی فناوری KTH در استکهلم برنامه‌های مهندسی و فناوری ارائه می‌کند.",
      "en": "KTH is a Stockholm-based university for engineering and technology."
    },
    "image": "/universities/kth-royal-institute-of-technology.jpg",
    "logo": "/universities/kth-royal-institute-of-technology-logo.png"
  },
  {
    "country": "sweden",
    "slug": "karolinska-institute",
    "name": "Karolinska Institute",
    "location": "Solna, Stockholm, Sweden",
    "summary": {
      "fa": "مؤسسه کارولینسکا در حوزه علوم پزشکی و سلامت آموزش و پژوهش انجام می‌دهد.",
      "en": "Karolinska Institutet specializes in medical and health sciences education and research."
    },
    "image": "/universities/karolinska-institute.jpg",
    "logo": "/universities/karolinska-institute-logo.png"
  }
];
