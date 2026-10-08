import type { RecordData } from "./admin-api";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "checkbox" | "select" | "array";
  required?: boolean;
  options?: string[];
  fields?: Field[];
  initial?: unknown;
};
export type Resource = {
  id: string;
  title: string;
  group: string;
  path: string;
  fields: Field[];
  columns: string[];
  statuses?: string[];
  lifecycle?: boolean;
  readOnly?: boolean;
  method?: string;
};
const f = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  required = false,
  options?: string[],
): Field => ({ key, label, type, required, options });
const localized = (fields: Field[]): Field[] =>
  ["fa", "en"].flatMap((locale) =>
    fields.map((field) => ({
      ...field,
      key: `translations.${locale}.${field.key}`,
      label: `${field.label} (${locale === "fa" ? "فارسی" : "English"})`,
    })),
  );
const names = localized([
  f("name", "نام", "text", true),
  f("description", "توضیحات", "textarea"),
]);
const seo = [
  f("seoTitle", "عنوان سئو"),
  f("seoDescription", "توضیح سئو", "textarea"),
];
const slug = f("slug", "نامک انگلیسی", "text", true);
const order = f("displayOrder", "ترتیب نمایش", "number");
const active = { ...f("active", "فعال", "checkbox"), initial: true };
const states = ["draft", "published", "archived"];
export const leadStatuses = [
  "new",
  "contacted",
  "qualified",
  "not_qualified",
  "converted",
  "closed",
];
export const labels: Record<string, string> = {
  fullName: "نام و نام خانوادگی",
  education: "تحصیلات", investmentBudget: "میزان سرمایه", englishProficiency: "مهارت زبان انگلیسی",
  intakeTerm: "ترم شروع", startYear: "سال شروع", desiredCountryText: "مقصد اعلام‌شده",
  sourceUrl: "صفحه ثبت درخواست", locale: "زبان", age: "سن", gender: "جنسیت",
  occupation: "شغل", maritalStatus: "وضعیت تأهل", message: "اطلاعات تکمیلی / ارزیابی",
  investmentRangeCode: "بازه بودجه", investmentCurrency: "ارز بودجه",
  mobileRaw: "شماره واردشده", duplicateCount: "تعداد ثبت تکراری", lastDuplicateAt: "آخرین ثبت تکراری",
  archivedAt: "زمان بایگانی", archiveReason: "دلیل بایگانی",
  archivedByUserId: "بایگانی‌کننده", desiredCountryId: "شناسه مقصد",
  sourceUniversityId: "شناسه دانشگاه مبدأ", sourceProgramId: "شناسه رشته مبدأ",
  syncExternalId: "شناسه نورا", syncAttemptCount: "تعداد تلاش ارسال", syncLastAttemptAt: "آخرین تلاش ارسال",
  syncSyncedAt: "زمان همگام‌سازی", genderSelfDescription: "توضیح جنسیت",
  female: "زن", male: "مرد", single: "مجرد", married: "متأهل", divorced: "جداشده", widowed: "همسر فوت‌شده",
  prefer_not_to_say: "تمایلی به پاسخ ندارم", non_binary: "غیردودویی", self_described: "توصیف شخصی",
  spring: "بهار", summer: "تابستان", fall: "پاییز", winter: "زمستان", unknown: "نامشخص",
  fa: "فارسی", en: "انگلیسی",
  id: "شناسه",
  name: "نام",
  title: "عنوان",
  question: "پرسش",
  email: "ایمیل",
  mobile: "تلفن",
  status: "وضعیت",
  syncStatus: "همگام‌سازی نورا",
  firstName: "نام",
  lastName: "نام خانوادگی",
  reference: "کد پیگیری",
  desiredCountryName: "کشور مقصد",
  assignee: "مشاور",
  createdAt: "تاریخ ثبت",
  requestCreatedAt: "تاریخ ثبت درخواست",
  requestType: "نوع درخواست",
  updatedAt: "آخرین تغییر",
  country: "کشور",
  university: "دانشگاه",
  code: "کد",
  active: "فعال",
  featured: "برگزیده",
  slug: "نامک",
  originalFilename: "نام فایل",
  purpose: "کاربرد",
  uploadStatus: "وضعیت بارگذاری",
  action: "عملیات",
  entityType: "نوع رکورد",
  actorUserId: "کاربر",
  entityId: "رکورد",
  roles: "نقش‌ها",
  version: "نسخه",
  new: "جدید",
  assigned: "ارجاع‌شده",
  contacted: "تماس گرفته‌شده",
  qualified: "واجد شرایط",
  not_qualified: "فاقد شرایط",
  converted: "تبدیل‌شده",
  closed: "بسته‌شده",
  pending: "در انتظار",
  synced: "همگام‌شده",
  failed: "ناموفق",
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "بایگانی",
  disabled: "غیرفعال",
  locked: "قفل‌شده",
  ready: "آماده",
  processing: "در حال بررسی",
  rejected: "ردشده",
  super_admin: "مدیر کل",
  support: "پشتیبان",
  consultant: "مشاور",
  content_editor: "ویراستار",
  contact: "تماس بگیرید",
  exact: "مبلغ دقیق",
  range: "بازه",
  free: "رایگان",
  month: "ماه",
  year: "سال",
  week: "هفته",
};
const tuition = [
  f("tuition.mode", "نوع شهریه", "select", true, ["contact", "exact", "range"]),
  f("tuition.minimumMinor", "حداقل شهریه (واحد خرد)", "number"),
  f("tuition.maximumMinor", "حداکثر شهریه (واحد خرد)", "number"),
  f("tuition.currency", "کد ارز شهریه"),
];
export const resources: Resource[] = [
  {
    id: "leads",
    title: "درخواست‌های مشاوره",
    group: "عملیات",
    path: "/admin/leads",
    method: "PATCH",
    statuses: leadStatuses,
    columns: [
      "reference", "fullName", "mobile", "email", "age", "occupation", "gender",
      "education", "maritalStatus", "investmentBudget", "englishProficiency",
      "requestCreatedAt", "requestType", "status",
    ],
    fields: [
      f("firstName", "نام", "text", true),
      f("lastName", "نام خانوادگی", "text", true),
      f("mobile", "موبایل", "text", true),
      f("email", "ایمیل"),
      f("age", "سن", "number"),
      f("occupation", "شغل"),
      f("gender", "جنسیت", "select", false, ["female", "male", "non_binary", "self_described", "prefer_not_to_say"]),
      f("education", "تحصیلات"),
      f("maritalStatus", "وضعیت تأهل", "select", false, ["single", "married", "divorced", "widowed"]),
      f("assessmentBudget", "میزان سرمایه"),
      f("englishProficiency", "مهارت زبان انگلیسی"),
    ],
  },
  {
    id: "universities",
    title: "دانشگاه‌ها",
    group: "محتوا و کاتالوگ",
    path: "/admin/universities",
    columns: ["name", "country", "status", "featured"],
    statuses: states,
    lifecycle: true,
    fields: [
      slug,
      f("countryId", "شناسه کشور", "text", true),
      f("cityId", "شناسه شهر"),
      f("institutionType", "نوع مؤسسه", "select", false, [
        "public",
        "private",
        "non_profit",
        "other",
      ]),
      f("foundedYear", "سال تأسیس", "number"),
      f("websiteUrl", "وب‌سایت رسمی"),
      f("contactEmail", "ایمیل داخلی"),
      f("contactPhone", "تلفن داخلی"),
      f("featured", "برگزیده صفحه اصلی", "checkbox"),
      ...localized([
        f("name", "نام", "text", true),
        f("shortDescription", "معرفی کوتاه", "textarea"),
        f("body", "توضیحات کامل", "textarea"),
        ...seo,
      ]),
      ...tuition,
      {
        key: "rankings",
        label: "رتبه‌بندی‌ها",
        type: "array",
        fields: [
          f("organization", "سازمان", "text", true),
          f("year", "سال", "number", true),
          f("rank", "رتبه", "number"),
          f("band", "بازه رتبه"),
          f("sourceUrl", "منبع"),
        ],
      },
      {
        key: "media",
        label: "تصاویر",
        type: "array",
        fields: [
          f("mediaAssetId", "شناسه رسانه", "text", true),
          f("role", "کاربرد", "select", true, ["logo", "hero", "gallery"]),
          order,
        ],
      },
    ],
  },
  {
    id: "programs",
    title: "رشته‌های تحصیلی",
    group: "محتوا و کاتالوگ",
    path: "/admin/programs",
    columns: ["title", "university", "status", "updatedAt"],
    statuses: states,
    lifecycle: true,
    fields: [
      slug,
      f("universityId", "شناسه دانشگاه", "text", true),
      f("academicLevelId", "شناسه مقطع", "text", true),
      f("primaryFieldId", "شناسه حوزه اصلی", "text", true),
      {
        key: "fieldIds",
        label: "حوزه‌های تحصیلی",
        type: "array",
        fields: [f("value", "شناسه حوزه", "text", true)],
      },
      f("durationValue", "مدت", "number"),
      f("durationUnit", "واحد مدت", "select", false, ["week", "month", "year"]),
      f("teachingLanguageCode", "کد زبان تدریس"),
      f("officialUrl", "منبع رسمی"),
      f("featured", "برگزیده داخلی", "checkbox"),
      ...localized([
        f("title", "عنوان", "text", true),
        f("shortDescription", "معرفی کوتاه", "textarea"),
        f("body", "توضیحات", "textarea"),
        f("admissionRequirements", "شرایط پذیرش", "textarea"),
        ...seo,
      ]),
      ...tuition,
      f("applicationFee.mode", "نوع هزینه درخواست", "select", true, [
        "contact",
        "free",
        "exact",
      ]),
      f("applicationFee.amountMinor", "هزینه درخواست (واحد خرد)", "number"),
      f("applicationFee.currency", "کد ارز هزینه درخواست"),
      {
        key: "intakes",
        label: "ورودی‌ها",
        type: "array",
        fields: [
          f("intakeId", "شناسه ورودی", "text", true),
          f("year", "سال", "number", true),
          f("applicationDeadline", "مهلت درخواست (YYYY-MM-DD)", "text", true),
          f("status", "وضعیت", "select", true, [
            "planned",
            "open",
            "closed",
            "cancelled",
          ]),
          f("notesFa", "توضیح فارسی", "textarea"),
          f("notesEn", "توضیح انگلیسی", "textarea"),
        ],
      },
      {
        key: "requirements",
        label: "شرایط پذیرش",
        type: "array",
        fields: [
          f("requirementType", "نوع شرط", "text", true),
          f("code", "کد"),
          { ...f("required", "الزامی", "checkbox"), initial: true },
          f("descriptionFa", "توضیح فارسی", "textarea"),
          f("descriptionEn", "توضیح انگلیسی", "textarea"),
          order,
        ],
      },
    ],
  },
  {
    id: "articles",
    title: "اخبار و راهنماها",
    group: "محتوا و کاتالوگ",
    path: "/admin/articles",
    columns: ["title", "articleType", "status", "updatedAt"],
    statuses: [...states, "scheduled"],
    lifecycle: true,
    fields: [
      slug,
      f("articleType", "نوع محتوا", "select", true, [
        "news",
        "article",
        "guide",
      ]),
      f("authorId", "شناسه نویسنده"),
      f("featuredMediaId", "شناسه تصویر"),
      f("featured", "برگزیده", "checkbox"),
      ...localized([
        f("title", "عنوان", "text", true),
        f("excerpt", "چکیده", "textarea"),
        f("body", "متن", "textarea", true),
        ...seo,
      ]),
      ...["categoryIds", "tagIds"].map((key) => ({
        key,
        label: key === "categoryIds" ? "دسته‌بندی‌ها" : "برچسب‌ها",
        type: "array" as const,
        fields: [f("value", "شناسه", "text", true)],
      })),
      f("primaryCategoryId", "شناسه دسته اصلی"),
    ],
  },
  {
    id: "faqs",
    title: "پرسش‌های متداول",
    group: "محتوا و کاتالوگ",
    path: "/admin/faqs",
    columns: ["question", "status", "updatedAt"],
    statuses: states,
    lifecycle: true,
    fields: [
      ...localized([
        f("question", "پرسش", "text", true),
        f("answer", "پاسخ", "textarea", true),
      ]),
      {
        key: "assignments",
        label: "محل نمایش",
        type: "array",
        required: true,
        fields: [
          f("targetType", "نوع صفحه", "select", true, [
            "general",
            "university",
            "program",
            "service",
          ]),
          f("targetId", "شناسه صفحه"),
          order,
        ],
      },
    ],
  },
  ...["categories", "tags", "authors"].map((id, index): Resource => ({
    id,
    title: ["دسته‌بندی‌ها", "برچسب‌ها", "نویسندگان"][index],
    group: "محتوا و کاتالوگ",
    path: `/admin/content/${["category", "tag", "author"][index]}`,
    columns: ["name", "slug", "status"],
    lifecycle: true,
    statuses: states,
    fields: [
      slug,
      order,
      ...localized(
        id === "authors"
          ? [
              f("name", "نام", "text", true),
              f("title", "عنوان"),
              f("biography", "زندگی‌نامه", "textarea"),
            ]
          : [
              f("name", "نام", "text", true),
              f("description", "توضیح", "textarea"),
              ...seo,
            ],
      ),
    ],
  })),
  {
    id: "media",
    title: "کتابخانه رسانه",
    group: "محتوا و کاتالوگ",
    path: "/admin/media",
    columns: ["originalFilename", "purpose", "uploadStatus", "createdAt"],
    method: "PATCH",
    fields: [
      f("altFa", "متن جایگزین فارسی"),
      f("altEn", "متن جایگزین انگلیسی"),
      f("sourceUrl", "منبع"),
      f("attribution", "صاحب اثر"),
    ],
  },
  ...[
    "countries",
    "cities",
    "academic-levels",
    "fields-of-study",
    "intakes",
    "currencies",
  ].map((id, index): Resource => ({
    id,
    title: [
      "کشورها",
      "شهرها",
      "مقاطع تحصیلی",
      "حوزه‌های تحصیلی",
      "ورودی‌ها",
      "ارزها",
    ][index],
    group: "داده‌های مرجع",
    path: `/admin/reference-data/${id}`,
    columns: ["name", "code", "active"],
    fields: [
      ...names,
      order,
      ...(id === "countries"
        ? [
            slug,
            f("iso2", "کد دوحرفی کشور", "text", true),
            f("iso3", "کد سه‌حرفی کشور"),
            f("status", "وضعیت", "select", true, states),
            f("featured", "برگزیده", "checkbox"),
          ]
        : [active]),
      ...(id === "cities"
        ? [slug, f("countryId", "شناسه کشور", "text", true)]
        : []),
      ...(["academic-levels", "fields-of-study", "currencies"].includes(id)
        ? [f("code", "کد", "text", true)]
        : []),
      ...(id === "fields-of-study"
        ? [slug, f("parentId", "شناسه حوزه والد")]
        : []),
      ...(id === "intakes"
        ? [
            f("code", "فصل", "select", true, [
              "spring",
              "summer",
              "fall",
              "winter",
              "unknown",
            ]),
          ]
        : []),
      ...(id === "currencies"
        ? [
            f("symbol", "نماد", "text", true),
            { ...f("decimalPlaces", "تعداد اعشار", "number"), initial: 2 },
            f("numericCode", "کد عددی"),
          ]
        : []),
    ],
  })),
  {
    id: "staff",
    title: "کاربران سازمان",
    group: "مدیریت",
    path: "/admin/staff",
    method: "PATCH",
    columns: ["firstName", "lastName", "email", "roles", "status"],
    statuses: ["active", "disabled", "locked"],
    fields: [
      f("firstName", "نام", "text", true),
      f("lastName", "نام خانوادگی", "text", true),
      f("preferredLocale", "زبان", "select", true, ["fa", "en"]),
      active,
    ],
  },
  {
    id: "audit",
    title: "گزارش رخدادها",
    group: "مدیریت",
    path: "/admin/audit-logs",
    columns: ["action", "entityType", "actorUserId", "createdAt"],
    fields: [],
    readOnly: true,
  },
];
export function getValue(data: RecordData, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === "object"
          ? (value as RecordData)[part]
          : undefined,
      data,
    );
}
export function setValue(
  data: RecordData,
  key: string,
  value: unknown,
): RecordData {
  const result = structuredClone(data);
  const parts = key.split(".");
  let target = result;
  parts.slice(0, -1).forEach((part) => {
    if (!target[part] || typeof target[part] !== "object") target[part] = {};
    target = target[part] as RecordData;
  });
  target[parts.at(-1)!] = value;
  return result;
}
export function formData(fields: Field[], input: RecordData = {}): RecordData {
  let result: RecordData = {};
  for (const field of fields) {
    const raw = getValue(input, field.key);
    let value =
      raw ??
      field.initial ??
      (field.type === "checkbox"
        ? false
        : field.type === "array"
          ? []
          : field.required && field.options
            ? field.options[0]
            : "");
    if (field.type === "array" && Array.isArray(value))
      value = value.map((item) =>
        field.fields?.[0]?.key === "value"
          ? item
          : {
              ...formData(field.fields ?? [], item as RecordData),
              ...(field.key === "requirements"
                ? { value: (item as RecordData).value ?? {} }
                : {}),
            },
      );
    result = setValue(result, field.key, value);
  }
  return result;
}
export function cleanForm(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cleanForm);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== "" && v !== undefined)
        .map(([k, v]) => [k, cleanForm(v)]),
    );
  return value;
}
export function normalizeRecord(input: RecordData): RecordData {
  const result = structuredClone(input);
  for (const [field, relation] of Object.entries({
    countryId: "country",
    cityId: "city",
    universityId: "university",
    academicLevelId: "academicLevel",
    primaryFieldId: "primaryField",
    authorId: "author",
  })) {
    result[field] =
      input[field] ?? (input[relation] as RecordData | undefined)?.id;
  }
  for (const [field, relation] of Object.entries({
    fieldIds: "fields",
    categoryIds: "categories",
    tagIds: "tags",
  })) {
    if (Array.isArray(input[relation]))
      result[field] = (input[relation] as RecordData[]).map((item) => item.id);
  }
  if (Array.isArray(input.intakes))
    result.intakes = (input.intakes as RecordData[]).map((item) => ({
      ...item,
      intakeId: item.intakeId ?? (item.intake as RecordData | undefined)?.id,
    }));
  return result;
}
export function writePayload(
  resource: Resource,
  data: RecordData,
  original: RecordData,
  creating: boolean,
): RecordData {
  const payload = cleanForm(data) as RecordData;
  if (["categories", "tags", "authors"].includes(resource.id)) {
    payload.resource = {
      categories: "category",
      tags: "tag",
      authors: "author",
    }[resource.id];
    if (resource.id === "authors") {
      for (const locale of ["fa", "en"]) {
        const translation = (
          payload.translations as Record<string, RecordData>
        )[locale];
        translation.title ??= null;
        translation.biography ??= null;
      }
    }
    if (resource.id === "authors")
      for (const field of ["userId", "avatarMediaId"])
        if (original[field]) payload[field] = original[field];
  }
  if (!creating && resource.method === "PATCH") {
    for (const field of resource.fields)
      if (!field.required && getValue(data, field.key) === "")
        payload[field.key] = null;
  }
  for (const key of ["tuition", "applicationFee"]) {
    const money = payload[key] as RecordData | undefined;
    if (money?.mode === "contact" || money?.mode === "free")
      payload[key] = { mode: money.mode };
    else if (money?.mode === "exact" && key === "tuition")
      delete money.maximumMinor;
  }
  return payload;
}
