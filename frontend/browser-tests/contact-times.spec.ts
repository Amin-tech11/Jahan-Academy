import { test, expect } from "@playwright/test";

const slots = ["10 - 10:30", "10:30 - 11", "11 - 11:30", "11:30 - 12", "12 - 12:30", "12:30 - 1", "2 - 2:30", "2:30 - 3", "3 - 3:30", "3:30 - 4"];

for (const locale of ["fa", "en"]) {
  for (const path of ["/free-consultation", "/countries", "/countries/germany", "/services", "/articles"]) {
    test(`${locale}${path} offers the office half-hour contact slots`, async ({ page }) => {
      await page.setViewportSize({ width: locale === "fa" ? 390 : 1440, height: 900 });
      await page.goto(`/${locale}${path}`);
      const select = page.locator('select[name="contactTime"]').first();
      await expect(select).toBeAttached();
      const noPreference = locale === "fa" ? "فرقی ندارد" : path === "/services" ? "No preference" : "Any time";
      expect(await select.locator("option").allTextContents()).toEqual([noPreference, ...slots]);
      expect(await select.inputValue()).toBe(path === "/services" ? "" : noPreference);
      const trigger = select.locator("..").getByRole("combobox");
      await trigger.click();
      await page.getByRole("option", { name: "12:30 - 1", exact: true }).click();
      await expect(trigger).toHaveText("12:30 - 1");
      await expect(select).toHaveValue("12:30 - 1");
      expect(await trigger.evaluate(el => getComputedStyle(el).direction)).toBe("ltr");
    });
  }
}

test("support sees the submitted contact time between request date and request type", async ({ page }) => {
  await page.route("**/admin/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/refresh")) return route.fulfill({ json: { data: { accessToken: "synthetic", user: { id: "test" }, mfaEnrollmentRequired: false } } });
    if (path.endsWith("/auth/activity")) return route.fulfill({ status: 204 });
    if (path.endsWith("/users/me/panel-access")) return route.fulfill({ json: { data: { isSuperAdmin: false, sections: ["leads"] } } });
    if (path.endsWith("/admin/leads")) return route.fulfill({ json: { data: [{ id: "time-test", reference: "JA-TIME", firstName: "آزمایش", lastName: "تماس", message: "زمان مناسب تماس: 12:30 - 1", createdAt: "2026-10-21T08:00:00Z", status: "new" }], meta: { total: 1 } } });
    return route.fulfill({ json: { data: [], meta: { total: 0 } } });
  });
  await page.goto("/admin");
  const table = page.locator("table").filter({ hasText: "JA-TIME" });
  await expect(table).toBeVisible();
  const headers = await table.locator("thead th").allTextContents();
  const index = headers.findIndex(text => text.includes("زمان تماس با لید"));
  expect(index).toBeGreaterThan(0);
  expect(headers[index - 1]).toContain("تاریخ ثبت درخواست");
  expect(headers[index + 1]).toContain("نوع درخواست");
  await expect(table.getByRole("cell", { name: "12:30 - 1", exact: true })).toHaveAttribute("dir", "ltr");
});
