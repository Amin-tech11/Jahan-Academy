import type { Locale } from "@/lib/site-content";

const details = {
  "education-consultation": {
    fa: {
      audience: "اگر میان کشورها، مقاطع یا زمان اقدام مردد هستید، بررسی سوابق و محدودیت‌ها نقطه شروع انتخاب مسیر است.",
      prepare: ["آخرین مدرک، رشته، معدل و سوابق مرتبط را آماده کنید.", "سطح زبان، بودجه تقریبی، مقصدهای مدنظر و زمان شروع را مشخص کنید."],
      steps: ["طرح هدف و پرسش‌های شما", "بررسی سوابق، بودجه و شرایط مسیرها", "مرور گزینه‌ها و گام بعدی"],
      scope: "موضوع جلسه، تناسب گزینه‌ها با شرایط شما و اطلاعاتی است که برای تصمیم بعدی نیاز دارید. پرسش‌های باقی‌مانده و مدارکی را که باید بررسی شوند، در پایان گفت‌وگو مرور کنید.",
      terms: "درخواست مشاوره اولیه رایگان است. برای خدمات تکمیلی، درباره دامنه کار، هزینه، مسئول پیگیری و زمان‌بندی پیش از توافق سؤال کنید. تصمیم پذیرش و ویزا با مرجع مربوط است.",
    },
    en: {
      audience: "If you are comparing countries, study levels or application timelines, begin by reviewing your background and constraints.",
      prepare: ["Prepare your latest qualification, subject, grades and relevant experience.", "Identify your language level, approximate budget, preferred destinations and intended start date."],
      steps: ["Discuss your goals and questions", "Review your background, budget and pathway requirements", "Compare options and the next step"],
      scope: "The conversation focuses on how options fit your circumstances and what you need to make the next decision. Review outstanding questions and documents requiring further checks before the conversation ends.",
      terms: "The initial consultation request is free. Before agreeing to further services, ask about scope, fees, the person handling your case and timing. Admission and visa decisions remain with the relevant authorities.",
    },
  },
  "document-review": {
    fa: {
      audience: "اگر دانشگاه یا دوره هدف را انتخاب کرده‌اید و می‌خواهید مدارک پرونده را منظم و مطابق فهرست همان مقصد آماده کنید، از بررسی الزامات شروع کنید.",
      prepare: ["فهرست رسمی مدارک، مهلت درخواست و الزامات دانشگاه یا رشته را آماده کنید.", "نسخه فعلی رزومه، انگیزه‌نامه و مدارکی را که نیاز به بازبینی دارند مشخص کنید."],
      steps: ["مقایسه مدارک با الزامات مقصد", "بررسی کامل‌بودن، ساختار و سازگاری اطلاعات", "مرور موارد نیازمند اصلاح و آماده‌سازی نسخه بعد"],
      scope: "رزومه تحصیلی، انگیزه‌نامه و مدارک پرونده موضوع این خدمت‌اند. نوع و تعداد مدارک، نیاز به نگارش یا ویرایش و محدوده بازبینی را پیش از شروع مشخص کنید؛ اطلاعات باید با سوابق واقعی شما سازگار باشند.",
      terms: "برای اعلام هزینه و زمان‌بندی، ابتدا نوع مدارک و حجم کار را مطرح کنید. درباره تعداد مراحل بازبینی و نسخه تحویلی پیش از توافق سؤال کنید. الزامات رسمی دانشگاه و مرجع ویزا مبنای پرونده‌اند.",
    },
    en: {
      audience: "If you have selected a programme or institution and need to organise your application documents, begin with that destination’s requirements.",
      prepare: ["Prepare the official document checklist, application deadline and programme requirements.", "Identify your current CV, statement of purpose and other documents needing review."],
      steps: ["Compare documents with destination requirements", "Review completeness, structure and consistency", "Discuss corrections and preparation of the next version"],
      scope: "This service concerns academic CVs, statements of purpose and application documents. Agree which documents need writing or editing and the scope of review before work begins; all information must reflect your actual background.",
      terms: "Describe the documents and workload before requesting fees and timing. Ask about review stages and the final deliverable before agreeing. Official university and visa-authority requirements govern the application.",
    },
  },
} as const;

export function ServiceDetailContent({ slug, locale }: { slug: string; locale: Locale }) {
  if (slug !== "education-consultation" && slug !== "document-review") return null;
  const content = details[slug][locale];
  const titles = locale === "fa"
    ? ["این خدمت برای چه کسانی مناسب است؟", "برای شروع چه آماده کنید؟", "روند بررسی", "موضوع و خروجی بررسی", "هزینه و شرایط همکاری"]
    : ["Who this is for", "What to prepare", "Review process", "Scope and outcome", "Fees and working arrangements"];
  return <section className="section"><div className="shell prose">
    <h2>{titles[0]}</h2><p>{content.audience}</p>
    <h2>{titles[1]}</h2><ul>{content.prepare.map(item => <li key={item}>{item}</li>)}</ul>
    <h2>{titles[2]}</h2><ol>{content.steps.map(item => <li key={item}>{item}</li>)}</ol>
    <h2>{titles[3]}</h2><p>{content.scope}</p>
    <h2>{titles[4]}</h2><p>{content.terms}</p>
  </div></section>;
}
