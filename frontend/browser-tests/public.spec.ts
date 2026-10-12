import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["fa", "en"]) {
  for (const path of ["", "/services", "/countries", "/universities", "/about", "/privacy", "/consultation", "/free-consultation"]) {
    test(`${locale}${path}: semantics, hydration, accessibility and metadata`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      const response = await page.goto(`/${locale}${path}`);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://jahanacademi.ir/${locale}${path}`);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `https://jahanacademi.ir/${locale}${path}`);
      await page.keyboard.press("Tab");
      await expect(page.locator(".skip-link")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#main-content")).toBeFocused();
      // Audit stable content, rather than partially transparent entrance frames.
      await page.emulateMedia({ reducedMotion: "reduce" });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      expect(errors).toEqual([]);
      for (const image of await page.locator('img[fetchpriority="high"], img[loading="eager"]').all()) {
        await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      }
    });
  }
}

test("desktop consultation card can be dismissed with the keyboard", async ({ page }) => {
  await page.goto("/fa/services");
  const close = page.getByRole("button", { name: "بستن پیشنهاد مشاوره" });
  await close.focus();
  await close.press("Enter");
  await expect(close).toHaveCount(0);
});

test("reset link is removed from address bar and reset success is shown", async ({ page }) => {
  let submitted: unknown;
  await page.route("**/admin/api/auth/password-resets", async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { data: { accepted: true } } });
  });
  const token = "browser-test-token-" + "a".repeat(40);
  await page.goto(`/reset-password#token=${token}`);
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel("رمز جدید", { exact: true }).fill("Replacement-Password-2027");
  await page.getByLabel("تکرار رمز جدید").fill("Replacement-Password-2027");
  await page.getByRole("button", { name: "ثبت رمز جدید" }).click();
  await expect(page.getByRole("status")).toContainText("رمز جدید ثبت شد");
  expect(submitted).toEqual({ token, newPassword: "Replacement-Password-2027" });
});

test("invalid recovery link never submits and email outage is explicit", async ({ page }) => {
  await page.goto("/reset-password#token=bad");
  await expect(page.locator('p[role="alert"]')).toContainText("لینک معتبر نیست");
  await expect(page.getByRole("button", { name: "ثبت رمز جدید" })).toBeDisabled();
  await page.route("**/admin/api/auth/refresh", route => route.fulfill({ status: 401, json: { error: { message: "No session" } } }));
  await page.route("**/admin/api/auth/password-reset-requests", route => route.fulfill({ status: 503, json: { error: { message: "بازیابی ایمیلی فعلاً در دسترس نیست." } } }));
  await page.goto("/admin");
  await page.getByRole("button", { name: "رمز عبور را فراموش کرده‌اید؟" }).click();
  await page.getByLabel("ایمیل حساب").fill("browser@example.com");
  await page.getByRole("button", { name: "ارسال لینک بازیابی" }).click();
  await expect(page.locator("#adm-login-error")).toContainText("در دسترس نیست");
});

test("consultation retains retry key and shows success only after acceptance", async ({ page }) => {
  const keys: string[] = [];
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/v1/consultation-requests", async route => {
    keys.push(route.request().headers()["idempotency-key"]);
    bodies.push(route.request().postDataJSON());
    await route.fulfill(keys.length === 1
      ? { status: 503, json: { error: { message: "ثبت موقتاً در دسترس نیست" } } }
      : { status: 201, json: { data: { reference: "JA-BROWSER-001" } } });
  });
  await page.goto("/fa/free-consultation");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const form = page.getByRole("form", { name: "درخواست مشاوره تخصصی رایگان" });
  await form.locator('[name="firstName"]').fill("آزمایش");
  await form.locator('[name="lastName"]').fill("مرورگر");
  await form.locator('[name="mobile"]').fill("09191234567");
  const occupation = form.getByRole("combobox", { name: "حوزه فعالیت *" });
  await occupation.focus();
  await occupation.press("ArrowDown");
  await occupation.press("Home");
  await occupation.press("Enter");
  await form.locator('[name="privacyConsent"]').check();
  await form.locator('[name="contactConsent"]').check();
  await form.getByRole("button", { name: "ثبت درخواست مشاوره" }).click();
  await expect(form.locator('[role="alert"]')).toContainText("در دسترس نیست");
  await expect(page.getByText("JA-BROWSER-001")).toHaveCount(0);
  await form.getByRole("button", { name: "ثبت درخواست مشاوره" }).click();
  await expect(page.getByText("JA-BROWSER-001")).toBeVisible();
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
  expect(bodies[0]).toEqual(bodies[1]);
  expect(bodies[0].mobile).toBe("+989191234567");
});

test("MFA login preserves password and submits the authenticator code", async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/admin/api/auth/refresh", route => route.fulfill({ status: 401, json: { error: { code: "SESSION_EXPIRED" } } }));
  await page.route("**/admin/api/auth/login", async route => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 401, json: { error: { code: bodies.length === 1 ? "MFA_REQUIRED" : "MFA_INVALID" } } });
  });
  await page.goto("/admin");
  await page.locator('input[name="username"]').fill("browser@example.com");
  await page.locator('input[name="password"]').fill("Browser-Test-Password-2026");
  await page.getByRole("button", { name: "ورود به پنل" }).click();
  await expect(page.locator("#adm-login-error")).toContainText("کد اپ احراز هویت");
  await page.locator('input[name="mfaCode"]').fill("123456");
  await page.getByRole("button", { name: "ورود به پنل" }).click();
  await expect(page.locator("#adm-login-error")).toContainText("کد احراز هویت معتبر نیست");
  expect(bodies[1]).toEqual({ username: "browser@example.com", password: "Browser-Test-Password-2026", mfaCode: "123456" });
});
