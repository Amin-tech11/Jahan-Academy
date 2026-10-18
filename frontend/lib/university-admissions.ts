import type { Locale } from "./site-content";

type Copy = Record<Locale, string>;
const copy = (fa: string, en: string): Copy => ({ fa, en });
export type AdmissionRow = {
  kind: "entry" | "language" | "documents" | "deadline" | "cost";
  text: Copy;
  sources: { label: Copy; url: string }[];
};
export type AdmissionProgramme = { id: string; title: Copy; scope: Copy; rows: AdmissionRow[] };
export type UniversityAdmissions = { reviewedAt: string; programmes: AdmissionProgramme[] };
const source = (fa: string, en: string, url: string) => ({ label: copy(fa, en), url });

const mcgill = {
  undergraduate: source("شرایط دیپلم بین‌المللی", "International high-school requirements", "https://www.mcgill.ca/undergraduate-admissions/apply/requirements/international/other"),
  pathway: source("مسیر درخواست علوم کامپیوتر", "Computer Science application route", "https://www.cs.mcgill.ca/undergrad/future/applying/"),
  language: source("زبان کارشناسی", "Undergraduate English requirements", "https://www.mcgill.ca/undergraduate-admissions/apply/english-proficiency"),
  apply: source("درخواست و هزینه کارشناسی", "Undergraduate application and fee", "https://www.mcgill.ca/undergraduate-admissions/apply"),
  masters: source("شرایط کارشناسی ارشد", "MSc admission requirements", "https://www.cs.mcgill.ca/graduate/future/mscadmission/"),
  documents: source("مدارک کارشناسی ارشد", "Graduate application documents", "https://www.cs.mcgill.ca/graduate/future/applying/"),
  deadline: source("مهلت دانشکده کامپیوتر", "Computer Science deadlines", "https://www.cs.mcgill.ca/graduate/future/deadline/"),
  fees: source("هزینه درخواست تحصیلات تکمیلی", "Graduate application fees", "https://www.mcgill.ca/gradapplicants/how-apply/application-support"),
  tuition: source("جدول شهریه دانشگاه", "University tuition tables", "https://www.mcgill.ca/student-accounts/tuition-fees/tuition-and-fees-tables-and-rates"),
};
const dal = {
  undergraduate: source("شرایط BCS", "BCS requirements", "https://www.dal.ca/study/programs/undergraduate/computer-science-bcs.html"),
  language: source("زبان کارشناسی", "Undergraduate English requirements", "https://www.dal.ca/admissions/how-to-apply/undergraduate-admissions/international-applicants/english-language-requirements.html"),
  apply: source("مراحل درخواست کارشناسی", "Undergraduate application steps", "https://www.dal.ca/admissions/how-to-apply/undergraduate-admissions.html"),
  deadline: source("تقویم پذیرش ۲۰۲۷", "2027 admissions dates", "https://www.dal.ca/admissions/dates-and-deadlines.html"),
  masters: source("برنامه پژوهشی MCSc", "MCSc research programme", "https://www.dal.ca/study/programs/graduate-professional/computer-science-mcsc.html"),
  graduate: source("راهنمای پذیرش دانشکده", "Faculty graduate application guide", "https://www.dal.ca/faculty/computerscience/graduate-programs/grad-handbook/how-to-apply.html"),
  graduateLanguage: source("زبان تحصیلات تکمیلی", "Graduate English requirements", "https://www.dal.ca/faculty/gradstudies/apply-graduate-studies/admission-requirements/english-requirements.html"),
  tuition: source("محاسبه شهریه و هزینه‌ها", "Tuition and fee calculator", "https://www.dal.ca/admissions/money_matters/tuition_payments/fee_calculator.html"),
};

export const universityAdmissions: Record<string, UniversityAdmissions> = {
  "mcgill-university": {
    reviewedAt: "2026-10-18",
    programmes: [
      {
        id: "bsc-computer-science",
        title: copy("کارشناسی علوم کامپیوتر — B.Sc.", "Computer Science — BSc"),
        scope: copy("مسیر دانشکده علوم؛ متقاضی دیپلم خارج از کانادا و آمریکا، در گروه Other international high schools.", "Faculty of Science route for applicants in the Other international high schools category, outside Canada and the US."),
        rows: [
          { kind: "entry", text: copy("گروه Physical, Earth, Math & Computer Sciences را انتخاب کنید. ریاضی پیش‌حسابان و معمولاً دو درس از زیست، شیمی یا فیزیک در سال‌های پایانی دبیرستان لازم است. ارزیابی مدرک به نظام آموزشی وابسته است.", "Apply to the Physical, Earth, Math & Computer Sciences group. Senior-level pre-calculus and normally two of biology, chemistry or physics are required; credential assessment depends on your school system."), sources: [mcgill.pathway, mcgill.undergraduate] },
          { kind: "language", text: copy("در صورت نداشتن معافیت زبان: IELTS Academic با نمره کل حداقل ۶٫۵ و هر مهارت حداقل ۶٫۰؛ سایر آزمون‌های پذیرفته‌شده در مرجع زبان آمده‌اند.", "Unless exempt: IELTS Academic overall 6.5 or higher, with each component at least 6.0. Consult the language page for other accepted tests."), sources: [mcgill.language] },
          { kind: "documents", text: copy("ریز‌نمرات دبیرستان، نتایج موجود سال آخر و مدرک زبان در صورت نیاز؛ تطبیق مدرک ایرانی با مسیر پذیرش را از دانشگاه تأیید کنید.", "Prepare high-school transcripts, available final-year results and any required language evidence. Confirm how your Iranian credential is assessed with admissions."), sources: [mcgill.undergraduate] },
          { kind: "deadline", text: copy("برای این گروه دیپلم، مهلت منتشرشده درخواست ۱۵ ژانویه و مدارک ۱ مارس است. این دو تاریخ متفاوت‌اند؛ سال ورودی و فهرست مدارک پرونده را در سامانه تأیید کنید.", "For this school-background category, the published application deadline is January 15; supporting documents are due March 1. Confirm the entry year and your individual checklist in the portal."), sources: [mcgill.undergraduate] },
          { kind: "cost", text: copy("هزینه درخواست منتشرشده ۱۴۰٫۱۶ دلار کاناداست و بازپرداخت نمی‌شود؛ این مبلغ شهریه نیست. شهریه را در جدول مربوط به B.Sc.، وضعیت دانشجو و سال ورود بررسی کنید.", "The published non-refundable application fee is CAD 140.16, separate from tuition. Use the BSc tuition table matching your student status and entry year."), sources: [mcgill.apply, mcgill.tuition] },
        ],
      },
      {
        id: "msc-computer-science-thesis",
        title: copy("کارشناسی ارشد علوم کامپیوتر — M.Sc. با پایان‌نامه", "Computer Science — MSc Thesis"),
        scope: copy("مسیر پژوهشی برای متقاضی بین‌المللی؛ برنامه‌ریزی برای ورودی پاییز.", "Research route for international applicants planning a Fall start."),
        rows: [
          { kind: "entry", text: copy("مدرک معادل کارشناسی مک‌گیل و معمولاً CGPA حداقل ۳٫۲ از ۴؛ زمینه قوی علوم کامپیوتر شامل دروس پایه و پیشرفته، حسابان، جبر خطی و ریاضیات گسسته لازم است. حداقل‌ها تضمین پذیرش نیستند.", "A McGill-equivalent bachelor's degree and normally CGPA of at least 3.2/4.0, with strong core and advanced CS, calculus, linear algebra and discrete mathematics preparation. Meeting these requirements does not guarantee admission."), sources: [mcgill.masters] },
          { kind: "language", text: copy("در صورت نیاز به آزمون، حداقل IELTS Academic برابر ۶٫۵ است؛ شرط TOEFL و معافیت‌ها را در صفحه اختصاصی همین دانشکده بررسی کنید، نه فقط حداقل عمومی دانشگاه.", "If testing is required, IELTS Academic minimum 6.5. Check this department's TOEFL thresholds and exemption rules rather than relying only on university-wide minima."), sources: [mcgill.masters, mcgill.documents] },
          { kind: "documents", text: copy("ریز‌نمرات و ترجمه لازم، رزومه، دو توصیه‌نامه ارسالی توسط معرف‌ها و مدارک زبان؛ علایق پژوهشی را در انگیزه‌نامه توضیح دهید و دست‌کم سه استاد پیشنهادی معرفی کنید.", "Prepare transcripts with required translations, a CV, two referee-submitted recommendations and language evidence. Explain research interests in your statement and identify at least three proposed supervisors."), sources: [mcgill.documents] },
          { kind: "deadline", text: copy("مهلت منتشرشده متقاضی بین‌المللی برای پاییز، ۱۵ دسامبر است و مدارک نیز باید کامل باشند. مهلت عمومی دانشگاه را جایگزین مهلت زودتر دانشکده نکنید؛ سال پرونده را در سامانه بررسی کنید.", "The published international Fall deadline is December 15, with a complete file. Use the earlier department deadline rather than McGill's general dates; confirm the application year in the portal."), sources: [mcgill.deadline] },
          { kind: "cost", text: copy("هزینه درخواست غیرقابل‌استرداد و وابسته به ترم است؛ مبلغ تابستان را به پاییز تعمیم ندهید. مبلغ ترم انتخابی را در سامانه و شهریه مسیر پایان‌نامه را در جدول دانشگاه بررسی کنید.", "The non-refundable application fee is term-specific; a published Summer fee is not a Fall quote. Confirm your term's fee in the portal and consult thesis-program tuition tables."), sources: [mcgill.fees, mcgill.tuition] },
        ],
      },
    ],
  },
  "dalhousie-university": {
    reviewedAt: "2026-10-18",
    programmes: [
      {
        id: "bachelor-computer-science",
        title: copy("کارشناسی علوم کامپیوتر — BCS", "Bachelor of Computer Science — BCS"),
        scope: copy("متقاضی بین‌المللی از دبیرستان؛ برنامه‌ریزی برای سپتامبر ۲۰۲۷.", "International high-school applicants planning September 2027 entry."),
        rows: [
          { kind: "entry", text: copy("انگلیسی و ریاضی دانشگاه‌محور سال آخر و سه درس موردقبول دیگر لازم‌اند؛ پیش‌حسابان توصیه می‌شود. حداقل میانگین اعلامی ۷۰٪ است؛ معادل‌سازی نمره و پیش‌نیازها به مدرک شما بستگی دارد و پذیرش تضمین نمی‌شود.", "Final-year academic English, academic mathematics and three other accepted university-preparation subjects are required; pre-calculus is recommended. Published minimum overall average: 70%. Credential equivalencies vary and admission is competitive."), sources: [dal.undergraduate] },
          { kind: "language", text: copy("در صورت نداشتن معافیت، حداقل IELTS برابر ۶٫۵ در کل و ۶٫۰ در هر مهارت است. شرایط معافیت و مسیرهای زبان را در صفحه کارشناسی بررسی کنید.", "Unless exempt, IELTS minimum overall 6.5, with no component below 6.0. Consult the undergraduate language page for exemption and pathway options."), sources: [dal.language] },
          { kind: "documents", text: copy("درخواست آنلاین، پرداخت هزینه پرونده و ارسال کارنامه و مدارک تحصیلی طبق دستورالعمل دانشگاه؛ مدارک تکمیلی و نتیجه نهایی را بر اساس چک‌لیست و نامه پذیرش ارسال کنید.", "Submit the online application, pay its fee and send academic records as directed. Follow your checklist and offer letter for additional documents and final results."), sources: [dal.apply] },
          { kind: "deadline", text: copy("برای سپتامبر ۲۰۲۷، BCS در فهرست مهلت‌های زودهنگام رشته‌های خاص نیست؛ بررسی درخواست به ظرفیت وابسته است. ۱۵ فوریه ۲۰۲۷ مهلت بورسیه ورودی است، نه مهلت عمومی BCS؛ زود اقدام کنید.", "For September 2027, BCS is outside the listed early-deadline programmes; applications depend on space. February 15, 2027 is the entrance-award deadline, not a universal BCS application cutoff. Apply early."), sources: [dal.deadline] },
          { kind: "cost", text: copy("هزینه پرونده را هنگام ثبت درخواست بررسی کنید؛ این هزینه از شهریه جداست. در محاسبه‌گر، کارشناسی علوم کامپیوتر، وضعیت بین‌المللی و بار درسی خود را انتخاب و هزینه‌های جانبی را هم بررسی کنید.", "Confirm the application fee when applying; it is separate from tuition. In the fee calculator, select undergraduate Computer Science, international status and your course load, including additional fees."), sources: [dal.apply, dal.tuition] },
        ],
      },
      {
        id: "master-computer-science-thesis",
        title: copy("کارشناسی ارشد علوم کامپیوتر — MCSc پژوهشی", "Master of Computer Science — MCSc Thesis"),
        scope: copy("متقاضی بین‌المللی؛ شروع سپتامبر یا ژانویه، با پایان‌نامه؛ متفاوت از MACS کاربردی.", "International applicants; September or January start, thesis route, distinct from the applied MACS degree."),
        rows: [
          { kind: "entry", text: copy("صفحه برنامه، کارشناسی چهارساله علوم کامپیوتر و حداقل A− را ذکر می‌کند؛ معادل‌سازی مدرک و تناسب زمینه پژوهشی را با دانشکده بررسی کنید.", "The programme page specifies a four-year CS degree and at least A−. Confirm credential equivalency and research fit with the faculty."), sources: [dal.masters] },
          { kind: "language", text: copy("در صورت نیاز به مدرک زبان، حداقل IELTS Academic برابر ۷ است. حداقل زبان کارشناسی را برای این مقطع استفاده نکنید؛ آزمون‌های دیگر و معافیت‌ها در راهنمای تحصیلات تکمیلی آمده‌اند.", "If language proof is required, IELTS Academic minimum 7. Do not use the undergraduate threshold for this degree; see graduate guidance for other tests and exemptions."), sources: [dal.graduateLanguage] },
          { kind: "documents", text: copy("ریز‌نمرات همه مؤسسات پس از دبیرستان، رزومه، پروپوزال پژوهشی، دو توصیه‌نامه و مدرک زبان در صورت نیاز. تمام اجزای پرونده باید تا مهلت مربوط برسند.", "Prepare all post-secondary transcripts, a CV, research proposal, two references and any required language evidence. All parts of the file must arrive by the relevant deadline."), sources: [dal.graduate] },
          { kind: "deadline", text: copy("مهلت‌های منتشرشده بین‌المللی: ۱ آوریل برای شروع سپتامبر و ۱ اوت برای ژانویه. سال ورودی و بازبودن پذیرش را در سامانه تأیید کنید؛ برای بررسی فاند زودتر اقدام کنید.", "Published international deadlines: April 1 for September, August 1 for January. Confirm your intake year and availability in the portal; apply earlier for funding consideration."), sources: [dal.masters] },
          { kind: "cost", text: copy("راهنمای دانشکده هزینه درخواست را ۱۱۵ دلار کانادا اعلام می‌کند. شهریه و هزینه بین‌المللی مسیر پایان‌نامه جداست؛ برآورد ترمی را در محاسبه‌گر و پیشنهاد فاند را جداگانه بررسی کنید.", "The faculty guide lists a CAD 115 application fee. Thesis tuition and international fees are separate; check the term-by-term calculator and any funding offer independently."), sources: [dal.graduate, dal.tuition] },
        ],
      },
    ],
  },
};
