export type PanelAccess = { sections: string[]; isSuperAdmin: boolean; version?: number };
export const superAdminSections = new Set(["staff", "audit", "access"]);
export function filterPanelSections<T extends { id: string }>(sections: T[], access: PanelAccess | null): T[] {
  if (!access) return [];
  return sections.filter(section => access.isSuperAdmin || (
    !superAdminSections.has(section.id) && access.sections.includes(section.id)
  ));
}
