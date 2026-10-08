import type { BlogPost } from "./blog-content";
import type { Localized } from "./site-content";

export type BlogGuide = BlogPost & { sections: Localized<Array<{ title: string; body: string }>> };
export const blogGuides: BlogGuide[] = [
  { slug: "application-document-checklist", type: "guide", date: "2026-09-17", title: { fa: "راهنمای آماده‌سازی مدارک اپلای", en: "Organizing your application documents" }, excerpt: { fa: "از سوابق تحصیلی تا رزومه؛ مدارک خود را قدم‌به‌قدم مرتب کنید.", en: "Organize your academic records and CV, one step at a time." }, sections: {
    fa: [{ title: "فهرست اختصاصی خود را بسازید", body: "صفحه پذیرش دانشگاه و رشته انتخابی را بخوانید و مدارک، قالب فایل و زمان ارسال را در یک فهرست ثبت کنید. الزامات دانشگاه‌ها یکسان نیستند." }, { title: "سوابق را مرتب کنید", body: "مدرک تحصیلی، ریزنمرات، سوابق کاری و دستاوردهای مرتبط را در پوشه‌های جدا نگه دارید. پیش از ترجمه، نوع ترجمه موردقبول دانشگاه را بررسی کنید." }, { title: "نسخه نهایی را بازبینی کنید", body: "نام، تاریخ‌ها و اطلاعات تماس را میان همه مدارک تطبیق دهید. رزومه و انگیزه‌نامه باید بازتاب سوابق واقعی شما باشند. نسخه ارسالی و تأیید دریافت را نگه دارید." }],
    en: [{ title: "Build a specific checklist", body: "Read the admissions page for your chosen institution and subject. Record required documents, file formats and submission dates; requirements differ between universities." }, { title: "Organize your records", body: "Keep qualifications, transcripts, work history and relevant achievements in separate folders. Check the institution’s translation requirements before ordering translations." }, { title: "Review the final files", body: "Match names, dates and contact details across documents. Your CV and statement should reflect your actual experience. Keep the submitted version and receipt." }],
  } },
  { slug: "study-destination-checklist", type: "guide", date: "2026-09-16", title: { fa: "راهنمای مقایسه مقصدهای تحصیلی", en: "Comparing study destinations" }, excerpt: { fa: "هدف، زبان، هزینه و سبک زندگی را در یک چارچوب روشن مقایسه کنید.", en: "Compare your goals, language needs, costs and lifestyle in a clear framework." }, sections: {
    fa: [{ title: "اولویت‌ها را مشخص کنید", body: "رشته، مقطع، زبان تدریس و هدف خود از ادامه تحصیل را بنویسید. مشخص کنید کدام معیار برای شما ضروری و کدام قابل مذاکره است." }, { title: "گزینه‌ها را با منابع رسمی بسنجید", body: "اطلاعات هر دانشگاه را از صفحه رسمی همان رشته بررسی کنید. شرایط پذیرش، پشتیبانی دانشجویان و محیط شهر را کنار هم قرار دهید و تاریخ بررسی اطلاعات را ثبت کنید." }, { title: "پرسش‌های باز را برای مشاوره نگه دارید", body: "برای موارد مبهم، پرسش مشخص بنویسید. یک رتبه یا تجربه شخصی به‌تنهایی برای انتخاب کافی نیست؛ تناسب گزینه با شرایط شما اهمیت دارد." }],
    en: [{ title: "Set your priorities", body: "Write down your subject, qualification level, teaching language and study goals. Distinguish essential criteria from preferences." }, { title: "Use official sources", body: "Check each subject on the institution’s own website. Compare admissions requirements, student support and the city environment, and record when you checked the information." }, { title: "Bring open questions to consultation", body: "Write specific questions for unclear points. A ranking or personal anecdote alone is insufficient; consider how each option fits your circumstances." }],
  } },
  { slug: "consultation-roadmap", type: "guide", date: "2026-09-15", title: { fa: "راهنمای شروع مسیر مشاوره", en: "Starting your consultation journey" }, excerpt: { fa: "چگونه اهداف و پرسش‌های خود را برای یک گفت‌وگوی مفید آماده کنیم؟", en: "Prepare your goals and questions for a useful conversation." }, sections: {
    fa: [{ title: "تصویر اولیه از شرایط خود تهیه کنید", body: "سوابق تحصیلی، وضعیت زبان و زمان موردنظر خود را به‌اختصار ثبت کنید. لازم نیست پیش از جلسه همه پاسخ‌ها را بدانید." }, { title: "پرسش‌های اصلی را بنویسید", body: "درباره گزینه‌های متناسب با سوابق، مدارک موردنیاز و مراحل بعد سؤال کنید. هر محدودیتی که بر تصمیم شما اثر دارد را مطرح کنید." }, { title: "گام بعدی را روشن کنید", body: "در پایان گفت‌وگو، اقدامات بعدی و اطلاعاتی که باید بررسی شوند را مرور کنید. نتیجه پذیرش و ویزا به تصمیم نهادهای مربوط وابسته است و قابل تضمین نیست." }],
    en: [{ title: "Summarize your circumstances", body: "Briefly record your academic history, language background and preferred timeline. You do not need every answer before the session." }, { title: "Write your key questions", body: "Ask about options that fit your background, required documents and next steps. Explain constraints that affect your decision." }, { title: "Clarify the next step", body: "Review next actions and facts that need checking at the end of the conversation. Admission and visa outcomes depend on the relevant institutions and cannot be guaranteed." }],
  } },
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
