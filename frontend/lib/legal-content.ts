export type LegalDocument = {
  title: string;
  intro: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
  requestLabel: string;
};

export const legalContent: Record<"fa" | "en", Record<"privacy" | "terms", LegalDocument>> = {
  fa: {
    privacy: {
      title: "حریم خصوصی",
      intro: "این سیاست توضیح می‌دهد جهان آکادمی در وب‌سایت و هنگام دریافت درخواست مشاوره و ارزیابی اولیه، چه اطلاعاتی دریافت می‌کند و چگونه از آن استفاده می‌کند.",
      requestLabel: "ثبت درخواست درباره اطلاعات شخصی",
      sections: [
        { title: "اطلاعاتی که دریافت می‌کنیم", paragraphs: ["با توجه به فرم انتخابی، نام و نام خانوادگی، شماره موبایل، ایمیل، شغل، مقصد و زمان موردنظر برای شروع تحصیل و اطلاعاتی مانند سن، جنسیت، وضعیت تأهل و پیام شما دریافت می‌شود. فیلدهای اختیاری را می‌توانید خالی بگذارید. رضایت شما برای استفاده از اطلاعات و تماس درباره درخواست نیز ثبت می‌شود.", "کد پیگیری، زمان ثبت و صفحه مبدأ درخواست برای مدیریت و پیگیری ذخیره می‌شود. سامانه و زیرساخت می‌توانند اطلاعات فنی مانند نشانی IP و گزارش خطا یا دسترسی را برای امنیت و تشخیص ارسال‌های مشکوک ثبت کنند. در پیام فرم، رمز عبور، اطلاعات بانکی یا تصویر مدارک هویتی ارسال نکنید."] },
        { title: "هدف استفاده از اطلاعات", paragraphs: ["اطلاعات فرم برای بررسی شرایط اولیه، پاسخ به درخواست، هماهنگی جلسه و پیگیری همان موضوع استفاده می‌شود. بازه بودجه سالانه و واحد پول، در صورت تکمیل، برای ارزیابی گزینه‌های متناسب با شرایط شما دریافت می‌شود. ثبت فرم به‌تنهایی قرارداد خدمات یا تضمین پذیرش نیست. رضایت به تماس برای پیگیری درخواست به معنای رضایت به پیام‌های تبلیغاتی نامرتبط نیست."] },
        { title: "دسترسی و اشتراک‌گذاری", paragraphs: ["پاسخ‌های فرم عمومی نیستند و دسترسی کارکنان از طریق پنل مدیریت و مجوزهای مربوط انجام می‌شود. ارائه‌دهندگان زیرساخت میزبانی، پایگاه داده و پشتیبان‌گیری در حد نیاز عملیاتی در پردازش داده‌ها نقش دارند.", "ارائه اطلاعات به دانشگاه یا سایر طرف‌های پرونده باید در چارچوب خدمت مشخص و هماهنگی با شما انجام شود. درخواست معتبر مرجع قانونی نیز ممکن است مستلزم ارائه اطلاعات باشد. اطلاعات شخصی شما به عنوان محتوای عمومی سایت منتشر نمی‌شود."] },
        { title: "امنیت و مسئولیت شما", paragraphs: ["سایت از کنترل دسترسی مدیریتی، اعتبارسنجی ورودی‌ها و محدودکردن ارسال‌های مشکوک استفاده می‌کند. ارتباط با سایت اصلی را از طریق HTTPS انجام دهید و کد پیگیری و اطلاعات ورود خود را در اختیار دیگران نگذارید. هیچ سامانه‌ای مصونیت مطلق در برابر خطا یا دسترسی غیرمجاز ندارد؛ در صورت مشاهده مشکل، آن را به تیم اعلام کنید."] },
        { title: "نگهداری و نسخه‌های پشتیبان", paragraphs: ["نگهداری اطلاعات به وضعیت درخواست، ادامه همکاری و الزامات قانونی و عملیاتی وابسته است. می‌توانید درباره ضرورت ادامه نگهداری یا حذف اطلاعات خود درخواست بررسی بدهید. حذف از سامانه فعال و خروج اطلاعات از نسخه‌های پشتیبان ممکن است در زمان‌های متفاوت انجام شود؛ داده‌های پشتیبان برای بازیابی سامانه نگهداری می‌شوند و عمومی نیستند."] },
        { title: "کوکی‌ها و وب‌سایت‌های دیگر", paragraphs: ["بخش ورود از کوکی‌های ضروری برای نشست، احراز هویت و حفاظت درخواست‌ها استفاده می‌کند. مسدودکردن این کوکی‌ها می‌تواند ورود را مختل کند. لینک دانشگاه‌ها و منابع بیرونی تابع سیاست حریم خصوصی همان وب‌سایت‌هاست؛ پیش از ارسال اطلاعات به آن‌ها، سیاستشان را بررسی کنید."] },
        { title: "درخواست دسترسی، اصلاح یا حذف", paragraphs: ["برای پیگیری اطلاعات ثبت‌شده، از مسیر درخواست مشاوره و قسمت پیام، موضوع حریم خصوصی و کد پیگیری قبلی را اعلام کنید؛ یا هنگام تماس تیم، درخواست خود را مطرح کنید. ارسال مدارک حساس در فرم عمومی لازم نیست. پیش از ارائه یا تغییر اطلاعات، هویت درخواست‌کننده بررسی می‌شود. درخواست حذف یا توقف تماس با توجه به تعهدات قانونی و وضعیت پرونده بررسی خواهد شد."] },
        { title: "به‌روزرسانی این سیاست", paragraphs: ["تغییرات این سیاست در همین صفحه منتشر می‌شود. اگر نوع استفاده از داده‌ها تغییر اساسی کند، توضیح مربوط و در صورت نیاز رضایت جداگانه در مسیر دریافت اطلاعات ارائه خواهد شد."] },
      ],
    },
    terms: {
      title: "قوانین استفاده",
      intro: "این شرایط به استفاده از وب‌سایت جهان آکادمی، محتوای آموزشی و ثبت درخواست مشاوره مربوط است. شرایط خدمات تخصصی در توافق جداگانه مشخص می‌شود.",
      requestLabel: "درخواست توضیح درباره خدمات",
      sections: [
        { title: "کاربرد سایت و حدود اطلاعات", paragraphs: ["مطالب مقصدها، دانشگاه‌ها، خبرها و راهنماها برای آشنایی اولیه و کمک به تصمیم‌گیری ارائه می‌شوند. شرایط پذیرش، شهریه، بورسیه و ویزا ممکن است تغییر کنند؛ پیش از اقدام یا پرداخت، اطلاعات نهایی را از دانشگاه یا مرجع رسمی مربوط بررسی کنید. محتوای عمومی جایگزین بررسی اختصاصی پرونده یا نظر مرجع تصمیم‌گیرنده نیست."] },
        { title: "مشاوره اولیه و ارزیابی", paragraphs: ["ثبت درخواست مشاوره اولیه رایگان یا فرم ارزیابی، شروع بررسی و هماهنگی تماس است و به معنای قبول پرونده، رزرو قطعی جلسه یا تعهد به نتیجه نیست. دریافت کد پیگیری، دریافت درخواست را نشان می‌دهد. هزینه و محدوده هر خدمت بعدی باید پیش از آغاز آن جداگانه مشخص و توافق شود."] },
        { title: "اطلاعات صحیح و استفاده مسئولانه", paragraphs: ["اطلاعات متعلق به خودتان و راه ارتباطی صحیح وارد کنید. ارسال اطلاعات دیگران بدون اجازه، جعل هویت یا مدارک، ارسال اسپم و تلاش برای دسترسی غیرمجاز یا اختلال در سایت مجاز نیست. برای متقاضیان زیر سن قانونی، هماهنگی خدمات و توافق‌ها باید با مشارکت ولی یا نماینده قانونی انجام شود."] },
        { title: "قرارداد، هزینه و نتیجه پرونده", paragraphs: ["ثبت فرم عمومی قرارداد خدمات ایجاد نمی‌کند. دامنه خدمات، مسئولیت طرف‌ها، مبلغ و روش پرداخت، زمان‌بندی، انصراف و بازپرداخت در توافق مربوط به همان خدمت تعیین می‌شود؛ عنوان «مشاوره رایگان» به معنای رایگان‌بودن تمام خدمات بعدی نیست.", "تصمیم پذیرش، بورسیه و ویزا در اختیار دانشگاه‌ها و مراجع مربوط است. هیچ محتوای سایت یا گفت‌وگوی اولیه نباید تضمین قطعی این نتایج تلقی شود."] },
        { title: "مالکیت محتوا و منابع بیرونی", paragraphs: ["متن‌ها، طراحی و عناصر متعلق به جهان آکادمی برای مطالعه و استفاده شخصی ارائه شده‌اند. بازنشر تجاری یا استفاده از نشان تجاری نیازمند اجازه صاحب حق است؛ حقوق تصاویر و منابع متعلق به دیگران نیز باید رعایت شود. لینک بیرونی به معنای مالکیت یا کنترل آن سایت توسط جهان آکادمی نیست."] },
        { title: "حریم خصوصی و اطلاعات ورود", paragraphs: ["نحوه دریافت و استفاده از اطلاعات در صفحه حریم خصوصی توضیح داده شده است. کاربر دارای حساب باید اطلاعات ورود خود را محرمانه نگه دارد و دسترسی مشکوک را به تیم گزارش کند. اطلاعات حساس و مدارک کامل را در فرم عمومی ارسال نکنید؛ مسیر دریافت مدارک برای خدمات بعدی باید با تیم هماهنگ شود."] },
        { title: "دسترسی به سایت و رسیدگی به مشکل", paragraphs: ["ممکن است سایت برای نگهداری یا به دلیل مشکل فنی موقتاً در دسترس نباشد. اگر رسید ثبت دریافت نکردید، ثبت موفق را فرض نکنید و وضعیت را پیگیری کنید. برای پرسش یا اعتراض درباره خدمت، از مسیر درخواست مشاوره و قسمت پیام یا گفت‌وگوی جاری با تیم استفاده کنید. این شرایط حقوقی را که طبق قوانین لازم‌الاجرا قابل سلب نیستند، محدود نمی‌کند."] },
        { title: "تغییر شرایط", paragraphs: ["نسخه به‌روز شرایط در همین صفحه منتشر می‌شود. تغییر متن سایت به‌خودی‌خود توافق اختصاصی قبلی را تغییر نمی‌دهد؛ تغییر قرارداد خدمات نیازمند توافق مربوط به همان قرارداد است."] },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy policy",
      intro: "This policy explains what Jahan Academy collects through this website and its consultation and initial assessment forms, and how that information is used.",
      requestLabel: "Submit a personal information request",
      sections: [
        { title: "Information we collect", paragraphs: ["Depending on the form, we collect your name, mobile number, email, occupation, preferred destination and study start date, and details such as age, gender, marital status and your message. Optional fields may be left blank. Your consent to processing and follow-up contact is also recorded.", "A tracking code, submission time and source page are stored for request management. The application and infrastructure may record technical information, including IP addresses and access or error logs, for security and detecting suspicious submissions. Do not include passwords, banking information or identity document images in public form messages."] },
        { title: "Why we use information", paragraphs: ["Form information is used to review your initial circumstances, respond to the request, arrange a consultation and follow up on that subject. If provided, your annual budget range and currency help assess suitable options. A submission alone is neither a service contract nor an admission guarantee. Consent to follow-up contact does not mean consent to unrelated promotional messages."] },
        { title: "Access and sharing", paragraphs: ["Form responses are not public. Staff access them through the administration panel with the relevant permissions. Hosting, database and backup infrastructure providers participate in processing as needed to operate the service.", "Sharing information with universities or other parties involved in a case should take place within a specified service and in coordination with you. A valid request from a competent authority may also require disclosure. Your personal information is not published as public website content."] },
        { title: "Security and your responsibilities", paragraphs: ["The site uses administrative access controls, input validation and controls against suspicious submissions. Use HTTPS to access the main site, and keep tracking codes and login credentials private. No system offers absolute protection against errors or unauthorized access; report any suspected issue to the team."] },
        { title: "Retention and backups", paragraphs: ["Retention depends on the status of your request, ongoing services and legal and operational requirements. You may ask for a review of continued retention or deletion. Removal from the active system and expiry from backups may occur at different times. Backups are retained for recovery and are not public."] },
        { title: "Cookies and external websites", paragraphs: ["The login area uses essential cookies for sessions, authentication and request protection. Blocking these cookies may prevent login. University and other external links are governed by those websites’ privacy policies; review them before submitting information there."] },
        { title: "Access, correction and deletion requests", paragraphs: ["Use the consultation request form’s message field to describe your privacy request and give your previous tracking code, or raise it when our team contacts you. Sensitive documents are not needed in the public form. We verify the requester’s identity before disclosing or changing personal information. Deletion and requests to stop contact are reviewed in light of legal obligations and the status of the case."] },
        { title: "Policy updates", paragraphs: ["Updates appear on this page. If the purposes of processing change materially, the relevant explanation and, where needed, separate consent will be provided at the point where information is collected."] },
      ],
    },
    terms: {
      title: "Terms of use",
      intro: "These terms cover the Jahan Academy website, educational content and consultation requests. Specialist services are governed by a separate agreement.",
      requestLabel: "Ask about our services",
      sections: [
        { title: "Purpose and limits of the content", paragraphs: ["Destination and university information, news and guides support initial research and decision-making. Admissions, tuition, scholarships and visa requirements can change. Check final details with the institution or official authority before taking action or making a payment. Public content does not replace a review of your individual case or a decision by the relevant authority."] },
        { title: "Initial consultations and assessments", paragraphs: ["A free initial consultation or assessment request starts a review and contact arrangement. It does not confirm acceptance of a case, a booked appointment or any particular outcome. A tracking code acknowledges receipt. The cost and scope of subsequent services must be specified and agreed separately before they begin."] },
        { title: "Accurate information and responsible use", paragraphs: ["Provide your own accurate information and contact details. Submitting another person’s information without permission, impersonation, forged documents, spam, unauthorized access and interference with the website are prohibited. Services and agreements for applicants below the legal age require the involvement of a parent or legal representative."] },
        { title: "Contracts, charges and outcomes", paragraphs: ["A public form submission does not create a service contract. Scope, responsibilities, fees, payment arrangements, timing, cancellation and refunds are set out in the agreement for the specific service. A free consultation does not mean that all subsequent services are free.", "Institutions and competent authorities decide admissions, scholarships and visas. Website content and initial discussions must not be interpreted as a guarantee of these outcomes."] },
        { title: "Content rights and external sources", paragraphs: ["Jahan Academy’s text, design and other assets are provided for personal reading and use. Commercial republication or trademark use requires permission from the rights holder; third-party image and source rights must also be respected. An external link does not mean Jahan Academy owns or controls that website."] },
        { title: "Privacy and account credentials", paragraphs: ["The privacy policy explains how information is collected and used. Account holders must keep credentials confidential and report suspected unauthorized access. Do not submit sensitive information or complete documents in public forms; coordinate document submission for subsequent services with the team."] },
        { title: "Availability and resolving issues", paragraphs: ["Maintenance or technical issues may temporarily affect access. If you have not received an acknowledgement, do not assume that submission succeeded; follow up on its status. Use the consultation form’s message field or your existing conversation with the team for service questions or complaints. These terms do not limit rights that cannot be waived under applicable law."] },
        { title: "Changes to these terms", paragraphs: ["Updated terms appear on this page. Changes to website text do not themselves amend an existing individual service agreement; contractual changes require the agreement applicable to that contract."] },
      ],
    },
  },
};
