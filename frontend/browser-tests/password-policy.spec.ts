import { test, expect } from "@playwright/test";

test("recovery preserves Unicode passwords and displays common-password rejection", async ({ page }) => {
  const sent: string[] = [];
  await page.route("**/admin/api/auth/password-resets", async route => {
    const body = route.request().postDataJSON();
    sent.push(body.newPassword);
    if (body.newPassword === "passwordpassword") {
      await route.fulfill({ status: 422, json: { error: {
        code: "VALIDATION_ERROR", fieldErrors: { password: ["PASSWORD_COMMON_OR_COMPROMISED"] },
      } } });
    } else await route.fulfill({ status: 204 });
  });
  await page.goto(`/reset-password#token=${"synthetic-token-".repeat(4)}`);
  await expect(page).toHaveURL(/\/reset-password$/);
  const password = page.locator('input[name="password"]');
  const confirmation = page.locator('input[name="confirmation"]');
  const submit = page.getByRole("button", { name: "ثبت رمز جدید" });
  await password.fill("short");
  await confirmation.fill("short");
  await submit.click();
  await expect(page.locator("main").getByRole("alert")).toContainText("۱۵ و ۱۲۸");
  expect(sent).toHaveLength(0);
  await password.fill("passwordpassword");
  await confirmation.fill("passwordpassword");
  await submit.click();
  await expect(page.locator("main").getByRole("alert")).toContainText("این رمز رایج است");
  const unicode = "🌏".repeat(128);
  await password.fill(unicode);
  await confirmation.fill(unicode);
  await submit.click();
  await expect(page.getByRole("status")).toContainText("رمز جدید ثبت شد");
  expect(sent).toEqual(["passwordpassword", unicode]);
});

test("login shows throttling without retrying credentials automatically", async ({ page }) => {
  let logins = 0;
  await page.route("**/admin/api/**", async route => {
    if (route.request().url().endsWith("/auth/login")) {
      logins++;
      await route.fulfill({ status: 429, headers: { "Retry-After": "47" }, json: {
        error: { code: "AUTH_RATE_LIMITED" },
      } });
    } else await route.fulfill({ status: 401, json: {} });
  });
  await page.goto("/admin");
  await page.getByLabel("نام کاربری", { exact: false }).fill("synthetic-staff");
  await page.locator('input[name="password"]').fill("old-password");
  await page.getByRole("button", { name: "ورود به پنل", exact: true }).click();
  await expect(page.locator("#adm-login-error")).toContainText("تعداد درخواست‌ها زیاد است");
  expect(logins).toBe(1);
});
