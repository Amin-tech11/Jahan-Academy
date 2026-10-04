import { resources } from "./admin-resources";
import { filterPanelSections, type PanelAccess } from "./admin-access-policy";
export { superAdminSections, type PanelAccess } from "./admin-access-policy";

export const panelSections = [
  { id: "dashboard", title: "نمای کلی", group: "گزارش‌ها" },
  ...resources.map(({ id, title, group }) => ({ id, title, group })),
  { id: "access", title: "مدیریت دسترسی", group: "مدیریت سازمان" },
];
export function visibleSections(access: PanelAccess | null) {
  return filterPanelSections(panelSections, access);
}
