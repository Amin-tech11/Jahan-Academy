import { test, expect } from "@playwright/test";

for (const role of ["super_admin", "support", "consultant", "content_editor"]) {
  test(`${role} can record any call outcome without assignment`, async ({ page }) => {
    let lead = { id: "status-test", reference: "JA-STATUS", firstName: "آزمایش", lastName: "تماس", mobile: "+989123456789", status: "new", version: 1, assignee: null, archived: false };
    let transition: unknown;
    await page.route("**/admin/api/**", async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/refresh")) return route.fulfill({ json: { data: { accessToken: "synthetic", user: { id: "test", roles: [role] }, mfaEnrollmentRequired: false } } });
      if (path.endsWith("/auth/activity")) return route.fulfill({ status: 204 });
      if (path.endsWith("/users/me/panel-access")) return route.fulfill({ json: { data: { isSuperAdmin: role === "super_admin", sections: ["leads"] } } });
      if (path.endsWith("/status-transitions")) {
        expect(route.request().headers()["if-match"]).toBe('"1"');
        transition = route.request().postDataJSON();
        lead = { ...lead, status: "converted", version: 2 };
        return route.fulfill({ json: { data: lead } });
      }
      if (path.endsWith("/admin/leads/status-test")) return route.fulfill({ json: { data: lead } });
      if (path.endsWith("/admin/leads")) return route.fulfill({ json: { data: [lead], meta: { total: 1 } } });
      return route.fulfill({ json: { data: [], meta: { total: 0 } } });
    });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    if (role === "super_admin") await page.getByRole("button", { name: "درخواست‌های مشاوره", exact: true }).click();
    await page.getByRole("button", { name: "مشاهده درخواست JA-STATUS" }).click();
    const dialog = page.getByRole("dialog");
    const select = dialog.locator('select').filter({ has: page.locator('option[value="converted"]') });
    await expect(select).toBeEnabled();
    await expect(select.locator("option:disabled")).toHaveCount(0);
    await expect(select.locator("option")).toHaveCount(8);
    const trigger = dialog.getByRole("combobox").filter({ hasText: "جدید" });
    await trigger.click();
    await page.getByRole("option", { name: "تبدیل‌شده", exact: true }).click();
    await dialog.getByRole("button", { name: "ذخیره تغییرات", exact: true }).click();
    await expect.poll(() => transition).toEqual({ toStatus: "converted" });
    await expect(dialog).not.toBeVisible();
  });
}
