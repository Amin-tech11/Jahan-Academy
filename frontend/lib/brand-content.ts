import type { Localized } from "./site-content";

type BrandContent = {
  intro: string;
  whyTitle: string;
  whyText: string;
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
  valuesTitle: string;
  values: Array<{ title: string; text: string }>;
  faqIntro: string;
  faqs: Array<{ question: string; answer: string }>;
};

export const brandContent: Localized<BrandContent> = {
  fa: {
    intro: "جهان آکادمی برای کسانی شکل گرفته است که می‌خواهند مسیر تحصیل و رشد حرفه‌ای خود را در جهانی بزرگ‌تر آغاز کنند. ما کمک می‌کنیم انتخاب‌ها را روشن‌تر ببینید و با شناخت بیشتری قدم بردارید.",
    whyTitle: "چرا جهان آکادمی؟",
    whyText: "با شناخت هدف، شرایط و دغدغه‌های هر فرد شروع می‌کنیم. به‌جای یک پاسخ یکسان برای همه، گزینه‌ها و محدودیت‌ها را روشن می‌کنیم تا تصمیم نهایی بر پایهٔ شناخت و آمادگی باشد.",
    missionTitle: "مأموریت ما",
    missionText: "مأموریت ما روشن‌کردن مسیر است: شناخت مخاطب، کمک به آمادگی او و همراهی در انتخاب قدم بعدی. مقصد زمانی معنا پیدا می‌کند که با هدف و شرایط فرد تناسب داشته باشد.",
    visionTitle: "چشم‌انداز ما",
    visionText: "چشم‌انداز ما جهانی است که در آن هیچ‌کس با ابهام به سوی آینده قدم نگذارد و فرصت رشد و تجربه را فراتر از مرزها ببیند.",
    valuesTitle: "ارزش‌های ما",
    values: [
      { title: "شفافیت و صداقت", text: "گزینه‌ها و محدودیت‌ها را روشن و بدون وعدهٔ اضافه بیان می‌کنیم." },
      { title: "تخصص", text: "برای هر پیشنهاد به دانش و بررسی دقیق تکیه می‌کنیم، نه حدس و کلی‌گویی." },
      { title: "انسان‌محوری", text: "هدف، شرایط و اولویت‌های هر فرد را در مرکز گفت‌وگو قرار می‌دهیم." },
      { title: "همراهی", text: "برای روشن‌شدن گام بعدی، پاسخ‌گو و در کنار مخاطب می‌مانیم." },
      { title: "رشد", text: "انتخاب امروز را در پیوند با مسیر یادگیری و آیندهٔ فرد می‌بینیم." },
      { title: "نگاه جهانی", text: "فرصت‌ها را با نگاهی باز و فراتر از یک مقصد بررسی می‌کنیم." },
    ],
    faqIntro: "پاسخ‌هایی برای شناخت رویکرد جهان آکادمی و آماده‌شدن برای نخستین گفت‌وگو.",
    faqs: [
      { question: "جهان آکادمی چه رویکردی دارد؟", answer: "از شناخت هدف و شرایط شما شروع می‌کنیم، گزینه‌های ممکن را روشن می‌کنیم و برای انتخاب آگاهانهٔ قدم بعدی همراهتان هستیم." },
      { question: "چرا بررسی شرایط فردی پیش از انتخاب مقصد مهم است؟", answer: "پیشینهٔ تحصیلی، سطح زبان، بودجه، زمان‌بندی و هدف هر فرد متفاوت است. بررسی این عوامل کمک می‌کند گزینه‌ها را متناسب با وضعیت خود بسنجید." },
      { question: "آیا یک مقصد مشخص را به همه پیشنهاد می‌کنید؟", answer: "خیر. انتخاب مقصد به هدف، شرایط و اولویت‌های شما بستگی دارد. در گفت‌وگو، مزایا و محدودیت‌های گزینه‌های مرتبط را بررسی می‌کنیم." },
      { question: "برای شروع گفت‌وگو چه اطلاعاتی آماده کنم؟", answer: "هدف تحصیلی یا حرفه‌ای، سوابق تحصیلی، وضعیت زبان، بودجهٔ تقریبی و زمان مدنظرتان را آماده کنید تا گفت‌وگو دقیق‌تر باشد." },
      { question: "آیا برای ثبت درخواست مشاوره باید حساب کاربری بسازم؟", answer: "خیر. می‌توانید بدون ساخت حساب کاربری درخواست مشاوره ثبت کنید." },
      { question: "پس از ثبت درخواست چه اتفاقی می‌افتد؟", answer: "درخواست شما ثبت می‌شود، کد پیگیری دریافت می‌کنید و تیم جهان آکادمی برای ادامهٔ گفت‌وگو با شما تماس می‌گیرد." },
    ],
  },
  en: {
    intro: "Jahan Academy is for people ready to begin studying and growing professionally in a wider world. We help you see your choices more clearly and take the next step with a better understanding of your path.",
    whyTitle: "Why Jahan Academy?",
    whyText: "We begin with each person's goals, circumstances, and concerns. Rather than offering the same answer to everyone, we clarify options and constraints so decisions rest on understanding and preparation.",
    missionTitle: "Our mission",
    missionText: "Our mission is to make the path clearer: understand each person, help them prepare, and support their next decision. A destination matters when it fits the person's goals and circumstances.",
    visionTitle: "Our vision",
    visionText: "We envision a world where no one steps into the future without clarity and where opportunities to learn and grow extend beyond borders.",
    valuesTitle: "Our values",
    values: [
      { title: "Honesty and clarity", text: "We explain options and constraints openly, without making excessive promises." },
      { title: "Expertise", text: "We ground recommendations in knowledge and careful review, not guesses or broad claims." },
      { title: "People first", text: "We put each person's goals, circumstances, and priorities at the center of the conversation." },
      { title: "Support", text: "We stay responsive while helping people understand their next step." },
      { title: "Growth", text: "We consider how today's choice connects to learning and long-term development." },
      { title: "Global perspective", text: "We explore opportunities with an open view beyond a single destination." },
    ],
    faqIntro: "Answers to help you understand our approach and prepare for your first conversation.",
    faqs: [
      { question: "What is Jahan Academy's approach?", answer: "We begin with your goals and circumstances, clarify the available options, and support an informed next step." },
      { question: "Why review my circumstances before choosing a destination?", answer: "Academic background, language level, budget, timing, and goals differ from person to person. Reviewing them helps you weigh options that fit your situation." },
      { question: "Do you recommend the same destination to everyone?", answer: "No. A destination depends on your goals, circumstances, and priorities. We discuss the benefits and constraints of relevant options with you." },
      { question: "What should I prepare for the first conversation?", answer: "Bring your study or career goals, academic background, language position, approximate budget, and intended timeline so the conversation can be more useful." },
      { question: "Do I need an account to request a consultation?", answer: "No. You can submit a consultation request without creating an account." },
      { question: "What happens after I submit a request?", answer: "Your request is recorded, you receive a tracking code, and the Jahan Academy team contacts you to continue the conversation." },
    ],
  },
};
