import { test, expect } from "@playwright/test";

const enrollment = {
  accessToken: "synthetic-enrollment-token",
  csrfToken: "synthetic-csrf",
  mfaEnrollmentRequired: true,
  user: { id: "synthetic-staff", firstName: "Test", lastName: "Staff", email: "staff@example.com" },
};

for (const fromLogin of [false, true]) {
  test(`mandatory MFA gates private panel data after ${fromLogin ? "login" : "refresh"}`, async ({ page }) => {
    let signedIn = !fromLogin;
    let privateRequests = 0;
    await page.route("**/admin/api/**", async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/refresh")) {
        await route.fulfill({ status: signedIn ? 200 : 401, json: { data: enrollment } });
      } else if (path.endsWith("/auth/login")) {
        signedIn = true;
        await route.fulfill({ json: { data: enrollment } });
      } else if (path.endsWith("/auth/mfa")) {
        await route.fulfill({ json: { data: { required: true, enabled: false } } });
      } else if (path.endsWith("/auth/mfa/setup")) {
        await route.fulfill({ json: { data: { secret: "SYNTHETIC-SETUP-KEY" } } });
      } else if (path.endsWith("/auth/mfa/confirm")) {
        await route.fulfill({ json: { data: { recoveryCodes: ["synthetic-recovery-1", "synthetic-recovery-2"] } } });
      } else {
        privateRequests++;
        await route.fulfill({ status: 403, json: { error: { code: "MFA_ENROLLMENT_REQUIRED" } } });
      }
    });
    await page.goto("/admin");
    if (fromLogin) {
      await page.getByLabel("نام کاربری", { exact: false }).fill("synthetic-staff");
      await page.locator('input[name="password"]').fill("Synthetic-Password-2026");
      await page.getByRole("button", { name: "ورود به پنل", exact: true }).click();
    }
    await expect(page.getByRole("heading", { name: "فعال‌سازی ورود دومرحله‌ای الزامی است" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "فعال‌سازی ورود دومرحله‌ای الزامی است" })).toBeVisible();
    await page.getByRole("button", { name: "امنیت حساب", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="password"]').fill("Synthetic-Password-2026");
    await dialog.getByRole("button", { name: "آغاز فعال‌سازی" }).click();
    await expect(dialog.getByText("SYNTHETIC-SETUP-KEY", { exact: true })).toBeHidden();
    await dialog.getByText("راهنمای ورود دستی در SafeAuth", { exact: true }).click();
    await expect(dialog.getByText("SYNTHETIC-SETUP-KEY", { exact: true })).toBeVisible();
    await dialog.locator('input[name="code"]').fill("123456");
    await dialog.getByRole("button", { name: "تأیید و دریافت کدهای بازیابی" }).click();
    await expect(dialog.locator("pre")).toContainText("synthetic-recovery-1");
    await dialog.getByRole("button", { name: "کدها را ذخیره کردم؛ ورود دوباره" }).click();
    await expect(page.getByRole("heading", { name: "ورود به سامانه" })).toBeVisible();
    expect(privateRequests).toBe(0);
  });
}
