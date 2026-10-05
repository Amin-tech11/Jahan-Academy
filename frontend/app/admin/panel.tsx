"use client";

import Login from "./login";
import DateFilter from "./date-filter";
import { dateRangeParams, type Calendar } from "../../lib/admin-calendar";
import AccessManager from "./access-manager";
import { visibleSections, type PanelAccess } from "../../lib/admin-access";
import { startLiveRefresh } from "../../lib/admin-live";
import { leadCell, leadEditData, leadEditPayload, newLeadIds } from "../../lib/admin-leads";
import { canChangeLeadStatus, saveLeadChanges } from "../../lib/admin-lead-status";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  acceptAdminSession,
  AdminError,
  adminRequest,
  clearAdminSession,
  restoreAdminSession,
  displayValue,
  rowsOf,
  totalOf,
  type RecordData,
} from "../../lib/admin-api";
import {
  formData,
  getValue,
  labels,
  leadStatuses,
  resources,
  setValue,
  normalizeRecord,
  writePayload,
  type Field,
  type Resource,
} from "../../lib/admin-resources";

function Badge({ value }: { value: unknown }) {
  const text = displayValue(value);
  return (
    <span className={`adm-badge adm-${text}`}>{labels[text] ?? text}</span>
  );
}
function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div className="adm-error" role="alert">
      {message}
    </div>
  ) : null;
}
function describe(error: unknown) {
  return error instanceof Error
    ? error.message
    : "عملیات انجام نشد؛ دوباره تلاش کنید.";
}
function Fields({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: RecordData;
  onChange: (value: RecordData) => void;
}) {
  return (
    <div className="adm-fields">
      {fields.map((field) => {
        const current = getValue(value, field.key);
        const change = (next: unknown) =>
          onChange(setValue(value, field.key, next));
        if (field.type === "array") {
          const items = Array.isArray(current) ? current : [];
          const scalar = field.fields?.[0]?.key === "value";
          return (
            <fieldset className="adm-array" key={field.key}>
              <legend>{field.label}</legend>
              {items.map((item, index) => (
                <div className="adm-array-item" key={index}>
                  <Fields
                    fields={field.fields ?? []}
                    value={scalar ? { value: item } : (item as RecordData)}
                    onChange={(next) =>
                      change(
                        items.map((old, i) =>
                          i === index ? (scalar ? next.value : next) : old,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="adm-link"
                    onClick={() => change(items.filter((_, i) => i !== index))}
                  >
                    حذف ردیف {index + 1}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  change([...items, scalar ? "" : formData(field.fields ?? [])])
                }
              >
                + افزودن {field.label}
              </button>
            </fieldset>
          );
        }
        return (
          <label
            className={field.type === "textarea" ? "adm-wide" : ""}
            key={field.key}
          >
            <span>
              {field.label}
              {field.required && " *"}
            </span>
            {field.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={Boolean(current)}
                onChange={(e) => change(e.target.checked)}
              />
            ) : field.type === "select" ? (
              <select
                required={field.required}
                value={String(current ?? "")}
                onChange={(e) => change(e.target.value)}
              >
                {!field.required && <option value="">انتخاب نشده</option>}
                {field.options?.map((option) => (
                  <option value={option} key={option}>
                    {labels[option] ?? option}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                required={field.required}
                rows={4}
                value={String(current ?? "")}
                onChange={(e) => change(e.target.value)}
              />
            ) : (
              <input
                type={
                  field.type === "number"
                    ? "number"
                    : field.key.toLowerCase().includes("email")
                      ? "email"
                      : "text"
                }
                step={field.type === "number" ? "any" : undefined}
                required={field.required}
                dir={
                  field.key.includes(".en.") ||
                  field.key.endsWith("Id") ||
                  field.key.includes("Url")
                    ? "ltr"
                    : undefined
                }
                value={String(current ?? "")}
                onChange={(e) =>
                  change(
                    field.type === "number" && e.target.value !== ""
                      ? Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function Dashboard({ navigate }: { navigate: (key: string) => void }) {
  const [data, setData] = useState<RecordData | null>(null);
  const [error, setError] = useState("");
  const [dates, setDates] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const reportRequest = useRef(0);
  const load = useCallback(async () => {
    const requestId = ++reportRequest.current;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const query = new URLSearchParams(
        Object.entries(dates).filter(([, value]) => value),
      );
      const result = await adminRequest(`/reporting/dashboard?${query}`);
      if (requestId === reportRequest.current) setData(result);
    } catch (err) {
      if (requestId === reportRequest.current) setError(describe(err));
    } finally {
      if (requestId === reportRequest.current) setLoading(false);
    }
  }, [dates]);
  useEffect(() => {
    void load();
  }, [load]);
  const statuses = (data?.leadStatuses ?? []) as RecordData[];
  const sync = (data?.syncStatuses ?? []) as RecordData[];
  return (
    <>
      <section className="adm-welcome">
        <div>
          <span className="adm-eyebrow">نمای کلی فعالیت‌ها</span>
          <h2>هر درخواست، آغاز یک فرصت.</h2>
          <p>وضعیت تیم و مسیر درخواست‌های مشاوره را یک‌جا دنبال کنید.</p>
        </div>
        <button onClick={() => navigate("leads")}>مشاهده درخواست‌ها ←</button>
      </section>
      <div className="adm-toolbar">
        <label>
          از تاریخ
          <input
            type="date"
            value={dates.from}
            onChange={(e) => setDates({ ...dates, from: e.target.value })}
          />
        </label>
        <label>
          تا تاریخ
          <input
            type="date"
            value={dates.to}
            onChange={(e) => setDates({ ...dates, to: e.target.value })}
          />
        </label>
        <button onClick={load}>تازه‌سازی</button>
        <small>گزارش محلی موقت · مرجع نهایی گزارش‌ها: نورا ERP</small>
      </div>
      <ErrorBox message={error} />
      {loading && <p role="status">در حال دریافت گزارش…</p>}
      <div className="adm-stats">
        {[
          ["کل درخواست‌ها", data?.totalLeads, "در بازه انتخاب‌شده"],
          ["تبدیل‌شده", data?.convertedLeads, "نتیجه پیگیری تیم"],
          [
            "نرخ تبدیل",
            data ? `${(Number(data.conversionRate) * 100).toFixed(1)}٪` : null,
            "از کل درخواست‌ها",
          ],
          [
            "خطای همگام‌سازی",
            sync.find((item) => item.status === "failed")?.count ??
              (data ? 0 : null),
            "نیازمند بررسی",
          ],
        ].map(([title, count, hint]) => (
          <article className="adm-stat" key={String(title)}>
            <span>{String(title)}</span>
            <strong>
              {count == null
                ? "—"
                : typeof count === "number"
                  ? count.toLocaleString("fa-IR")
                  : String(count)}
            </strong>
            <small>{String(hint)}</small>
          </article>
        ))}
      </div>
      <div className="adm-dashboard-grid">
        <section className="adm-card">
          <h3>مسیر درخواست‌های مشاوره</h3>
          <p>توزیع درخواست‌ها بر اساس آخرین وضعیت</p>
          {statuses.length ? (
            statuses.map((item) => (
              <div className="adm-progress" key={String(item.status)}>
                <span>
                  {labels[String(item.status)] ?? String(item.status)}
                </span>
                <div>
                  <i
                    style={{
                      width: `${Number(data?.totalLeads) ? (Number(item.count) / Number(data?.totalLeads)) * 100 : 0}%`,
                    }}
                  />
                </div>
                <b>{Number(item.count).toLocaleString("fa-IR")}</b>
              </div>
            ))
          ) : (
            <div className="adm-empty">
              {data
                ? "هنوز درخواستی ثبت نشده است."
                : "برای نمایش نمودار، گزارش باید دریافت شود."}
            </div>
          )}
        </section>
        <section className="adm-card">
          <h3>همگام‌سازی با نورا</h3>
          <p>وضعیت ارسال مستقل از وضعیت مشاوره است.</p>
          {sync.map((item) => (
            <div className="adm-sync" key={String(item.status)}>
              <Badge value={item.status} />
              <b>{Number(item.count).toLocaleString("fa-IR")}</b>
            </div>
          ))}
          {!data && <div className="adm-empty">اطلاعات در دسترس نیست.</div>}
          <button onClick={() => navigate("leads")}>بررسی درخواست‌ها ←</button>
        </section>
        <section className="adm-card adm-wide">
          <h3>عملکرد مشاوران</h3>
          <div className="adm-table-wrap">
            <table aria-label="جدول درخواست‌های مشاوره و ارزیابی">
              <thead>
                <tr>
                  <th>مشاور</th>
                  <th>ارجاع‌شده</th>
                  <th>تبدیل‌شده</th>
                  <th>نرخ تبدیل</th>
                </tr>
              </thead>
              <tbody>
                {((data?.consultants ?? []) as RecordData[]).map((item) => (
                  <tr key={String(item.consultantId)}>
                    <td>{displayValue(item.name)}</td>
                    <td>{displayValue(item.assignedLeads)}</td>
                    <td>{displayValue(item.convertedLeads)}</td>
                    <td>{(Number(item.conversionRate) * 100).toFixed(1)}٪</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!((data?.consultants ?? []) as unknown[]).length && (
            <p className="adm-empty">داده‌ای برای نمایش موجود نیست.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Editor({
  resource,
  item,
  onClose,
  onSaved,
}: {
  resource: Resource;
  item: RecordData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [source, setSource] = useState<RecordData>(item ?? {});
  const [data, setData] = useState<RecordData>({});
  const [dirty, setDirty] = useState(false);
  const [leadStatus, setLeadStatus] = useState(String(item?.status ?? ""));
  const statusDirty = resource.id === "leads" && leadStatus !== String(source.status ?? "");
  const hasChanges = dirty || statusDirty;
  const [busy, setBusy] = useState(Boolean(item));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const creating = !item;
  const [loaded, setLoaded] = useState(false);
  const fields: Field[] =
    resource.id === "staff" && creating
      ? [
          ...resource.fields.filter((field) => field.key !== "active"),
          { key: "email", label: "ایمیل", required: true },
          {
            key: "roleCodes",
            label: "نقش‌ها",
            type: "array",
            required: true,
            fields: [
              {
                key: "value",
                label: "نقش",
                type: "select",
                required: true,
                options: [
                  "super_admin",
                  "content_editor",
                  "support",
                  "consultant",
                ],
              },
            ],
          },
        ]
      : resource.id === "leads" ? resource.fields.flatMap((field): Field[] => {
          if (field.key === "assessmentBudget" && source.investmentRangeCode) return [
            { key: "investmentRangeCode", label: "بازه میزان سرمایه", required: true },
            { key: "investmentCurrency", label: "ارز سرمایه", required: true },
          ];
          if (field.key === "gender" && (data.gender ?? source.gender) === "self_described") return [field, { key: "genderSelfDescription", label: "توضیح جنسیت", required: true }];
          return [field];
        }) : resource.fields;
  useEffect(() => {
    dialog.current?.showModal();
    let alive = true;
    const load = async () => {
      try {
        let next = item ?? {};
        if (item && !resource.readOnly)
          next = (await adminRequest(`${resource.path}/${item.id}`))
            .data as RecordData;
        if (!alive) return;
        const normalized = normalizeRecord(resource.id === "leads" ? leadEditData(next) : next);
        setSource(next);
        setLeadStatus(String(next.status ?? ""));
        setData({
          ...formData(fields, normalized),
          ...(resource.id === "leads" && next.investmentRangeCode ? {
            investmentRangeCode: next.investmentRangeCode,
            investmentCurrency: next.investmentCurrency,
          } : {}),
          ...(resource.id === "leads" && next.gender === "self_described" ? {
            genderSelfDescription: next.genderSelfDescription,
          } : {}),
        });
        setLoaded(true);
      } catch (err) {
        if (alive) setError(describe(err));
      } finally {
        if (alive) setBusy(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []); // Editor is remounted for each record.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (hasChanges) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);
  function close() {
    if (busy) return;
    if (
      !hasChanges ||
      window.confirm("تغییرات ذخیره نشده‌اند. از فرم خارج می‌شوید؟")
    )
      onClose();
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const rawBody = writePayload(resource, data, source, creating);
      const body = resource.id === "leads" ? leadEditPayload(data, source, rawBody) : rawBody;

      if (resource.id === "leads" && item) {
        await saveLeadChanges(adminRequest, source, dirty ? body : undefined, leadStatus, (saved) => {
          setSource(saved);
          setDirty(false);
        });
      } else {
        await adminRequest(
          `${resource.path}${item ? `/${item.id}` : ""}`,
          item ? (resource.method ?? "PUT") : "POST",
          body,
          Number(source.version) || undefined,
        );
      }
      setDirty(false);
      onSaved();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }
  async function action(suffix: string, payload: RecordData, method = "POST") {
    if (dirty) {
      setError("پیش از این عملیات، تغییرات فرم را ذخیره کنید.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await adminRequest(
        `${resource.path}/${item?.id}/${suffix}`,
        method,
        payload,
        Number(source.version),
      );
      if ((result.data as RecordData)?.version)
        setSource(result.data as RecordData);
      setNotice("عملیات با موفقیت انجام شد.");
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="adm-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="adm-dialog-heading">
        <div>
          <small>{resource.title}</small>
          <h2>
            {creating
              ? "افزودن رکورد"
              : resource.readOnly
                ? "جزئیات رخداد"
                : "جزئیات و ویرایش"}
          </h2>
        </div>
        <button aria-label="بستن فرم" onClick={close}>
          ×
        </button>
      </div>
      <ErrorBox message={error} />
      {notice && (
        <p className="adm-success" role="status">
          {notice}
        </p>
      )}
      {busy && <p role="status">در حال پردازش…</p>}
      {resource.readOnly ? (
        <dl className="adm-details">
          {Object.entries(source).map(([key, value]) => (
            <div key={key}>
              <dt>{labels[key] ?? key}</dt>
              <dd>
                {typeof value === "object" ? (
                  <pre>{JSON.stringify(value, null, 2)}</pre>
                ) : (
                  displayValue(value)
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <>
          <form onSubmit={save}>
            <fieldset disabled={busy || !loaded} className="adm-form-body">
              <Fields
                fields={fields}
                value={data}
                onChange={(next) => {
                  setData(next);
                  setDirty(true);
                }}
              />
              {resource.id === "leads" && item && loaded && (
                <div className="adm-fields">
                  <label>
                    وضعیت
                    <select
                      value={leadStatus}
                      disabled={Boolean(source.archived) || source.status === "closed"}
                      aria-describedby="lead-status-help"
                      onChange={(event) => setLeadStatus(event.target.value)}
                    >
                      {source.status === "assigned" && <option value="assigned" disabled>انتخاب وضعیت جدید</option>}
                      {leadStatuses.map((status) => (
                        <option key={status} value={status} disabled={status !== source.status && !canChangeLeadStatus(source, status)}>
                          {labels[status] ?? status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p id="lead-status-help" className="adm-wide">
                    {source.status === "assigned" && "این رکورد قبلاً ارجاع شده است. "}
                    {source.archived ? "وضعیت درخواست بایگانی‌شده قابل تغییر نیست." : source.status === "closed"
                      ? "این درخواست بسته شده و وضعیت دیگری برای آن قابل انتخاب نیست."
                      : !source.assignee
                        ? "برای وضعیت‌های پیگیری، ابتدا باید مسئول درخواست تعیین شده باشد؛ در حال حاضر فقط بستن درخواست مجاز است."
                        : "وضعیت‌های قابل انتخاب بر اساس مرحلهٔ فعلی درخواست نمایش داده می‌شوند."}
                    {" "}تغییر وضعیت با «ذخیره تغییرات» ثبت می‌شود.
                  </p>
                </div>
              )}
              <footer className="adm-form-footer">
                <button
                  type="submit"
                  className="adm-primary"
                  disabled={busy || (!hasChanges && !creating)}
                >
                  ذخیره تغییرات
                </button>
                <button type="button" onClick={close}>
                  انصراف
                </button>
              </footer>
            </fieldset>
          </form>
          {item && loaded && resource.id !== "leads" && (
            <section className="adm-actions">
              <h3>عملیات رکورد</h3>
              <small>
                شناسه: <b dir="ltr">{String(item.id)}</b>
              </small>
              {resource.lifecycle && (
                <>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "محتوای هر دو زبان را بررسی کرده‌اید و منتشر شود؟",
                        )
                      )
                        void action("publish", {});
                    }}
                  >
                    انتشار
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      const reason = window.prompt(
                        "دلیل بایگانی (حداقل ۳ حرف)",
                      );
                      if (reason && reason.trim().length >= 3)
                        void action("archive", { reason });
                    }}
                  >
                    بایگانی
                  </button>
                </>
              )}
              {resource.id === "staff" && (
                <StaffActions busy={busy} onAction={action} source={source} />
              )}
            </section>
          )}
        </>
      )}
    </dialog>
  );
}

function StaffActions({
  busy,
  source,
  onAction,
}: {
  busy: boolean;
  source: RecordData;
  onAction: (
    suffix: string,
    payload: RecordData,
    method?: string,
  ) => Promise<void>;
}) {
  const [roles, setRoles] = useState(
    ((source.roles ?? []) as RecordData[]).map((role) => String(role.code)),
  );
  return (
    <div>
      <h4>نقش‌های دسترسی</h4>
      <div className="adm-role-options">
        {["super_admin", "content_editor", "support", "consultant"].map(
          (role) => (
            <label key={role}>
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={(e) =>
                  setRoles(
                    e.target.checked
                      ? [...roles, role]
                      : roles.filter((value) => value !== role),
                  )
                }
              />
              {labels[role]}
            </label>
          ),
        )}
      </div>
      <button
        disabled={busy || !roles.length}
        onClick={() => onAction("roles", { roleCodes: roles }, "PUT")}
      >
        ذخیره نقش‌ها
      </button>
      <button
        disabled={busy}
        onClick={() => {
          if (window.confirm("ایمیل بازیابی دسترسی برای این کاربر ارسال شود؟"))
            void onAction("access-recovery", { reactivate: false });
        }}
      >
        ارسال بازیابی دسترسی
      </button>
    </div>
  );
}

function MediaUpload({ onSaved }: { onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File;
    try {
      const result = await adminRequest("/admin/media/upload-intents", "POST", {
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        purpose: form.get("purpose"),
        altFa: form.get("altFa") || null,
        altEn: form.get("altEn") || null,
      });
      const intent = result.data as RecordData;
      const response = await fetch(String(intent.uploadUrl), {
        method: String(intent.method),
        headers: intent.headers as Record<string, string>,
        body: file,
        credentials: "omit",
      });
      if (!response.ok) throw new Error("بارگذاری فایل انجام نشد.");
      const hash = await crypto.subtle.digest(
        "SHA-256",
        await file.arrayBuffer(),
      );
      const checksum = Array.from(new Uint8Array(hash))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      await adminRequest(`/admin/media/${intent.id}/confirm`, "POST", {
        checksumSha256: checksum,
      });
      onSaved();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="adm-card">
      <summary>بارگذاری رسانه جدید</summary>
      <ErrorBox message={error} />
      <form onSubmit={upload} className="adm-fields">
        <label>
          فایل
          <input
            name="file"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />
        </label>
        <label>
          کاربرد
          <select name="purpose">
            <option value="university_image">تصویر دانشگاه</option>
            <option value="logo">لوگو</option>
            <option value="article_image">تصویر مقاله</option>
            <option value="public_file">فایل عمومی PDF</option>
          </select>
        </label>
        <label>
          متن جایگزین فارسی
          <input name="altFa" />
        </label>
        <label>
          متن جایگزین انگلیسی
          <input name="altEn" />
        </label>
        <button className="adm-primary" disabled={busy}>
          {busy ? "در حال بارگذاری و بررسی…" : "بارگذاری و بررسی فایل"}
        </button>
      </form>
    </details>
  );
}

const listSessions = new Map<
  string,
  {
    query: string;
    status: string;
    page: number;
    filters: Record<string, string>;
    calendar: Calendar;
    fromDate: string;
    toDate: string;
  }
>();
function ResourceList({ resource }: { resource: Resource }) {
  const previous = listSessions.get(resource.id);
  const [query, setQuery] = useState(previous?.query ?? "");
  const [status, setStatus] = useState(previous?.status && resource.statuses?.includes(previous.status) ? previous.status : "");
  const [calendar, setCalendar] = useState<Calendar>(previous?.calendar ?? "persian");
  const [fromDate, setFromDate] = useState(previous?.fromDate ?? "");
  const [toDate, setToDate] = useState(previous?.toDate ?? "");
  const [page, setPage] = useState(previous?.page ?? 1);
  const [data, setData] = useState<RecordData>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [editor, setEditor] = useState<{ item: RecordData | null } | null>(
    null,
  );
  const [refresh, setRefresh] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>(
    resource.id === "leads" ? {} : previous?.filters ?? {},
  );
  useEffect(() => {
    listSessions.set(resource.id, { query, status, page, filters, fromDate, toDate, calendar });
  }, [resource.id, query, status, page, filters, fromDate, toDate, calendar]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newIds, setNewIds] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    let previousRows: RecordData[] | null = null;
    setBusy(true);
    setError("");
    setData({});
    setLastUpdated(null);
    setNewIds([]);
    setAnnouncement("");
    const params = new URLSearchParams({
      page: String(page), limit: "20",
      ...(resource.id === "leads" ? dateRangeParams(fromDate, toDate) : Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
    });
    if (resource.id === "leads") params.set("sort", "created_desc");
    if (query.trim().length >= 2)
      params.set(resource.id === "audit" ? "action" : "q", query.trim());
    if (status) params.set("status", status);
    let live: ReturnType<typeof startLiveRefresh<RecordData>> | undefined;
    const timer = setTimeout(() => {
      live = startLiveRefresh({
        load: (signal) => adminRequest(`${resource.path}?${params}`, "GET", undefined, undefined, signal),
        active: () => document.visibilityState !== "hidden" && navigator.onLine,
        interval: resource.id === "leads" ? 2000 : 30000,
        onData: (result) => {
          const nextRows = rowsOf(result);
          const added = newLeadIds(previousRows, nextRows);
          if (added.length) {
            setNewIds(added);
            setAnnouncement(`${added.length.toLocaleString("fa-IR")} درخواست به جدول اضافه شد.`);
          }
          previousRows = nextRows;
          setData(result);
          setError("");
          setBusy(false);
          setLastUpdated(new Date());
        },
        onError: (err) => {
          if (err instanceof AdminError && [401, 403].includes(err.status)) setData({});
          setError(describe(err) + " دریافت خودکار دوباره تلاش می‌کند؛ اطلاعات قبلی ممکن است به‌روز نباشد.");
          setBusy(false);
        },
      });
    }, 250);
    const resume = () => { void live?.refresh(); };
    const offline = () => { setError("اتصال اینترنت قطع است؛ پس از اتصال، جدول خودکار به‌روز می‌شود."); setBusy(false); };
    if (!navigator.onLine) offline();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    window.addEventListener("offline", offline);
    return () => {
      clearTimeout(timer);
      live?.stop();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", offline);
    };
  }, [resource.path, resource.id, page, query, status, refresh, filters, fromDate, toDate]);
  const rows = rowsOf(data);
  const total = totalOf(data);
  return (
    <>
      <div className="adm-section-title">
        <div>
          <h2>{resource.title}</h2>
          <p>
            {resource.id === "leads"
              ? "همهٔ درخواست‌های مشاوره و فرم ارزیابی، از جدیدترین به قدیمی‌ترین"
              : resource.id === "programs"
              ? "اطلاعات رشته‌ها صرفاً مرجع داخلی تیم است و نمایش عمومی ندارد."
              : resource.readOnly
                ? "رخدادها فقط خواندنی هستند و قابل تغییر نیستند."
                : "جست‌وجو، بررسی و مدیریت اطلاعات"}
          </p>
        </div>
        {!["leads", "media", "audit"].includes(resource.id) && (
          <button
            className="adm-primary"
            onClick={() => setEditor({ item: null })}
          >
            + افزودن
          </button>
        )}
      </div>
      {resource.id === "media" && (
        <MediaUpload onSaved={() => setRefresh((value) => value + 1)} />
      )}
      <section className="adm-card">
        <div className="adm-live-status" role="status">
          <span className={error ? "adm-live-dot is-stale" : "adm-live-dot"} />
          <span>{error ? "نیاز به اتصال مجدد" : busy ? "در حال اتصال…" : "به‌روزرسانی خودکار هر ۲ ثانیه"}</span>
          {lastUpdated && <small>آخرین دریافت: {lastUpdated.toLocaleTimeString("fa-IR")}</small>}
        </div>
        <p className="adm-live-announcement" role="status" aria-live="polite">{announcement}</p>
        {(page > 1 || query || status || fromDate || toDate || Object.values(filters).some(Boolean)) && (
          <p className="adm-list-hint">برای دیدن همهٔ درخواست‌های تازه، فیلترها را پاک کنید و به صفحهٔ اول بروید.</p>
        )}
        <div className="adm-toolbar">
          <label className="adm-search">
            {resource.id === "audit" ? "نام عملیات" : "جست‌وجو"}
            <input
              placeholder="حداقل دو حرف…"
              maxLength={100}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {resource.statuses && (
            <label>
              وضعیت
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">همه وضعیت‌ها</option>
                {resource.statuses.map((value) => (
                  <option key={value} value={value}>
                    {labels[value] ?? value}
                  </option>
                ))}
              </select>
            </label>
          )}
          {resource.id === "leads" && <>
            <DateFilter calendar={calendar} onCalendarChange={setCalendar} label="از تاریخ" value={fromDate} max={toDate} onChange={(date) => { setFromDate(date); setPage(1); }} />
            <DateFilter calendar={calendar} onCalendarChange={setCalendar} label="تا تاریخ" value={toDate} min={fromDate} onChange={(date) => { setToDate(date); setPage(1); }} />
          </>}
          <button onClick={() => setRefresh((value) => value + 1)}>
            تازه‌سازی
          </button>
          <button
            className="adm-link"
            onClick={() => {
              setQuery("");
              setStatus("");
              setFilters({});
              setFromDate("");
              setToDate("");
              setPage(1);
            }}
          >
            پاک کردن فیلترها
          </button>
        </div>
        {["programs", "audit"].includes(resource.id) && (
          <details>
            <summary>فیلترهای بیشتر</summary>
            <div className="adm-fields">
              {(resource.id === "programs"
                ? [
                    ["universityId", "شناسه دانشگاه"],
                    ["academicLevelId", "شناسه مقطع"],
                    ["fieldId", "شناسه حوزه"],
                    ["intakeId", "شناسه ورودی"],
                    ["currency", "کد ارز"],
                  ]
                : [
                    ["actor_user_id", "شناسه کاربر"],
                    ["entity_type", "نوع رکورد"],
                  ]
              ).map(([key, title]) => (
                <label key={key}>
                  {title}
                  <input
                    value={filters[key] ?? ""}
                    onChange={(e) => {
                      setFilters({ ...filters, [key]: e.target.value });
                      setPage(1);
                    }}
                  />
                </label>
              ))}
              {resource.id === "programs" && (
                <label>
                  مرتب‌سازی
                  <select
                    value={filters.sort ?? "updated_desc"}
                    onChange={(e) => {
                      setFilters({ ...filters, sort: e.target.value });
                      setPage(1);
                    }}
                  >
                    <option value="updated_desc">آخرین تغییر</option>
                    <option value="title_asc">عنوان الفبایی</option>
                    <option value="tuition_asc">شهریه صعودی</option>
                    <option value="deadline_asc">مهلت درخواست</option>
                  </select>
                </label>
              )}
            </div>
          </details>
        )}
        <ErrorBox message={error} />
        {busy ? (
          <div className="adm-empty" role="status">
            در حال دریافت اطلاعات…
          </div>
        ) : rows.length || resource.id === "leads" ? (
          <div className="adm-table-wrap">
            <table dir="rtl">
              <thead>
                <tr>
                  {resource.columns.map((column) => (
                    <th scope="col" key={column}>{labels[column] ?? column}</th>
                  ))}
                  {resource.id !== "leads" && <th scope="col">عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {!rows.length && !error && <tr><td colSpan={resource.columns.length}><div className="adm-empty">درخواستی مطابق فیلترهای فعلی پیدا نشد.</div></td></tr>}
                {rows.map((row) => (
                  <tr key={String(row.id)} className={newIds.includes(String(row.id)) ? "adm-new-lead" : undefined}>
                    {resource.columns.map((column) => (
                      <td key={column} dir={["mobile", "email", "reference"].includes(column) ? "ltr" : undefined}>
                        {resource.id === "leads" && column === "reference" ? (
                          <button className="adm-link" onClick={() => setEditor({ item: row })} aria-label={`مشاهده درخواست ${row.reference}`}>{displayValue(row.reference)}</button>
                        ) : ["status", "syncStatus", "uploadStatus"].includes(
                          column,
                        ) ? (
                          <Badge value={row[column]} />
                        ) : (
                          displayValue(resource.id === "leads" ? leadCell(row, column) : row[column])
                        )}
                      </td>
                    ))}
                    {resource.id !== "leads" && <td>
                      <button
                        className="adm-link"
                        onClick={() => setEditor({ item: row })}
                      >
                        مشاهده ←
                      </button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <div className="adm-empty">
              <strong>رکوردی پیدا نشد</strong>
              <p>{resource.id === "leads" ? "درخواست‌های ثبت‌شده از فرم مشاوره و ارزیابی اینجا نمایش داده می‌شوند. اگر فیلتری فعال است، آن را پاک کنید." : "در این بخش رکوردی مطابق فیلترهای فعلی وجود ندارد."}</p>
            </div>
          )
        )}
        <footer className="adm-pagination">
          <span>{total.toLocaleString("fa-IR")} رکورد</span>
          <button
            disabled={page <= 1 || busy}
            onClick={() => setPage(page - 1)}
          >
            قبلی
          </button>
          <span>صفحه {page.toLocaleString("fa-IR")}</span>
          <button
            disabled={page * 20 >= total || busy}
            onClick={() => setPage(page + 1)}
          >
            بعدی
          </button>
        </footer>
      </section>
      {editor && (
        <Editor
          resource={resource}
          item={editor.item}
          onClose={() => {
            setEditor(null);
            setRefresh((value) => value + 1);
          }}
          onSaved={() => {
            setEditor(null);
            setRefresh((value) => value + 1);
          }}
        />
      )}
    </>
  );
}

export default function AdminPanel() {
  const [user, setUser] = useState<RecordData | null>(null);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState("leads");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [access, setAccess] = useState<PanelAccess | null>(null);
  const [accessError, setAccessError] = useState("");
  const [accessRetry, setAccessRetry] = useState(0);
  useEffect(() => {
    setAccess(null);
    setAccessError("");
    if (!user) return;
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const result = await adminRequest("/users/me/panel-access", "GET", undefined, undefined, controller.signal);
        if (!controller.signal.aborted) {
          const next = result.data as PanelAccess;
          setAccess(next);
          setAccessError("");
          const allowed = visibleSections(next);
          setSection(current => allowed.some(item => item.id === current) ? current : (allowed[0]?.id ?? ""));
        }
      } catch (err) {
        if (!controller.signal.aborted) { setAccess(null); setAccessError(describe(err)); }
      } finally { pending = false; }
    };
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 10000);
    window.addEventListener("focus", load);
    window.addEventListener("admin-access-changed", load);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener("admin-access-changed", load);
    };
  }, [user, accessRetry]);
  useEffect(() => {
    let alive = true;
    restoreAdminSession()
      .then((result) => {
        if (alive) {
          const session = result.data as RecordData;
          acceptAdminSession(session);
          setUser(session.user as RecordData);
        }
      })
      .catch(() => {
        clearAdminSession();
      })
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const expire = () => {
      listSessions.clear();
      setUser(null);
    };
    window.addEventListener("admin-session-expired", expire);
    return () => window.removeEventListener("admin-session-expired", expire);
  }, []);
  function navigate(key: string) {
    if (!visibleSections(access).some(item => item.id === key)) return;
    setSection(key);
    setMobileMenu(false);
  }
  if (checking)
    return (
      <main className="adm-checking" role="status">
        در حال بررسی نشست…
      </main>
    );
  if (!user) return <Login onLogin={setUser} />;
  const resource = resources.find((item) => item.id === section);
  return (
    <div className="adm-shell">
      <aside className={`adm-sidebar ${mobileMenu ? "is-open" : ""}`}>
        <div className="adm-brand">
          <img src="/brand/jahan-academy-official.png" alt="جهان آکادمی" />
          <span>
            جهان آکادمی<small>پنل مدیریت</small>
          </span>
        </div>
        <nav aria-label="بخش‌های مدیریت">
          {visibleSections(access).map(item => <button key={item.id} className={section === item.id ? "selected" : ""} onClick={() => navigate(item.id)}>
            <span className="adm-nav-dot" /> {item.title}
          </button>)}
        </nav>
        <div className="adm-sidebar-note">
          <b>همراه مسیرهای تازه</b>
          <small>JAHAN ACADEMY</small>
        </div>
      </aside>
      <div className="adm-main">
        <header className="adm-topbar">
          <button
            className="adm-menu"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="فهرست بخش‌ها"
          >
            ☰
          </button>
          <div>
            <small>فضای مدیریت /</small>
            <b>{section === "access" ? "مدیریت دسترسی" : resource?.title ?? "نمای کلی"}</b>
          </div>
          <div className="adm-account">
            <span className="adm-avatar">
              {String(user.firstName ?? "ج").slice(0, 1)}
            </span>
            <span>
              {displayValue(user.firstName)} {displayValue(user.lastName)}
            </span>
            <button
              className="adm-link"
              onClick={async () => {
                setLogoutError("");
                try {
                  await adminRequest("/auth/logout", "POST", {});
                  clearAdminSession();
                  listSessions.clear();
                  setUser(null);
                } catch (err) {
                  setLogoutError(describe(err));
                }
              }}
            >
              خروج
            </button>
          </div>
        </header>
        <main className="adm-content">
          <ErrorBox message={logoutError} />
          {accessError ? <><ErrorBox message={accessError} /><button onClick={() => setAccessRetry(value => value + 1)}>بررسی دوبارهٔ دسترسی</button></> : !access ? <p role="status">در حال بررسی دسترسی‌ها…</p> : !visibleSections(access).some(item => item.id === section) ? <p className="adm-empty">در حال حاضر دسترسی به بخشی از پنل برای شما فعال نیست. با مدیر سازمان تماس بگیرید.</p> : section === "access" && access.isSuperAdmin ? <AccessManager /> : resource ? (
            <ResourceList key={resource.id} resource={resource} />
          ) : (
            <Dashboard navigate={navigate} />
          )}
        </main>
        <footer className="adm-page-footer">
          جهان آکادمی · مدیریت درخواست‌های مشاوره و ارزیابی
        </footer>
      </div>
    </div>
  );
}
