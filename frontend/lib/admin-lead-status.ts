import type { RecordData, adminRequest } from "./admin-api";

// Mirrors the consultation workflow; the API remains authoritative for permissions.
const statuses = ["new", "initial_contact", "unanswered", "contacted", "qualified", "not_qualified", "converted", "closed"];

export function canChangeLeadStatus(source: RecordData, status: string): boolean {
  return !source.archived &&
    source.status !== status &&
    (statuses.includes(status) || (status === "assigned" && Boolean(source.assignee)));
}

export async function saveLeadChanges(
  request: typeof adminRequest,
  source: RecordData,
  patch: RecordData | undefined,
  status: string,
  onPatched: (saved: RecordData) => void,
): Promise<void> {
  const statusChanged = status !== source.status;
  if (statusChanged && !canChangeLeadStatus(source, status))
    throw new Error("این تغییر وضعیت برای رکورد مجاز نیست؛ وضعیت فعلی و بایگانی درخواست را بررسی کنید.");
  let saved = source;
  const path = `/admin/leads/${source.id}`;
  if (patch) {
    saved = (await request(path, "PATCH", patch, Number(source.version))).data as RecordData;
    // Keep the new version even if the subsequent status change fails.
    onPatched(saved);
  }
  if (statusChanged) {
    try {
      await request(`${path}/status-transitions`, "POST", { toStatus: status }, Number(saved.version));
    } catch (error) {
      if (!patch) throw error;
      throw new Error(`اطلاعات رکورد ذخیره شد، اما وضعیت تغییر نکرد. ${error instanceof Error ? error.message : "دوباره تلاش کنید."}`);
    }
  }
}
