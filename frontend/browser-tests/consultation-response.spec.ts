import { test, expect, type Page } from "@playwright/test";

async function fillConsultation(page: Page) {
  await page.goto("/fa/free-consultation?source=floating-consultation");
  const form = page.getByRole("form", { name: "درخواست مشاوره تخصصی رایگان" });
  await form.locator('[name="firstName"]').fill("آزمایش");
  await form.locator('[name="lastName"]').fill("پاسخ");
  await form.locator('[name="mobile"]').fill("+12025550199");
  const occupation = form.getByRole("combobox", { name: "حوزه فعالیت *" });
  await occupation.focus(); await occupation.press("ArrowDown");
  await occupation.press("Home"); await occupation.press("Enter");
  await form.locator('[name="privacyConsent"]').check();
  await form.locator('[name="contactConsent"]').check();
  return form;
}

test("consultation accepts a receipt after the old ten-second deadline", async ({ page }) => {
  await page.route("**/api/v1/consultation-requests", async route => {
    await new Promise(resolve => setTimeout(resolve, 11000));
    await route.fulfill({ status: 201, json: { data: { reference: "JA-SLOW-RECEIPT" } } });
  });
  const form = await fillConsultation(page);
  await form.getByRole("button", { name: "ثبت درخواست مشاوره" }).click();
  await expect(page.getByText("JA-SLOW-RECEIPT")).toBeVisible({ timeout: 20000 });
  await expect(form.locator('[role="alert"]')).toHaveCount(0);
});

test("lost response is recovered with the original idempotency key", async ({ page }) => {
  const requests: { key: string; body: string | null }[] = [];
  await page.route("**/api/v1/consultation-requests", async route => {
    requests.push({ key: route.request().headers()["idempotency-key"], body: route.request().postData() });
    if (requests.length === 1) await route.abort("connectionreset");
    else await route.fulfill({ status: 201, json: { data: { reference: "JA-RECOVERED" } } });
  });
  const form = await fillConsultation(page);
  await form.getByRole("button", { name: "ثبت درخواست مشاوره" }).click();
  await expect(page.getByText("JA-RECOVERED")).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0].key).toBeTruthy();
  expect(requests[0]).toEqual(requests[1]);
});
