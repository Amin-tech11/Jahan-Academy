import { test, expect } from "@playwright/test";

test("MFA enrollment renders a local QR and distinguishes setup-code errors", async ({ page }) => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // Public RFC test key only.
  const uri = `otpauth://totp/Jahan%20Academy%3Atest%40example.com?secret=${secret}&issuer=Jahan+Academy&algorithm=SHA1&digits=6&period=30`;
  const calls: string[] = [];
  await page.route("**/admin/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    calls.push(path);
    if (path.endsWith("/auth/refresh")) {
      return route.fulfill({ json: { data: { accessToken: "synthetic", user: { id: "test", email: "test@example.com" }, mfaEnrollmentRequired: true } } });
    }
    if (path.endsWith("/auth/mfa")) return route.fulfill({ json: { data: { enabled: false, required: true } } });
    if (path.endsWith("/auth/mfa/setup")) return route.fulfill({ json: { data: { secret, otpauthUri: uri } } });
    if (path.endsWith("/auth/mfa/confirm")) return route.fulfill({ status: 401, json: { error: { code: "MFA_INVALID" } } });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto("/admin");
  await page.getByRole("button", { name: "امنیت حساب", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("رمز فعلی").fill("Synthetic-Test-Password-2026");
  await dialog.getByRole("button", { name: "آغاز فعال‌سازی" }).click();
  await expect(dialog.getByRole("img", { name: "QR محرمانهٔ راه‌اندازی ورود دومرحله‌ای" })).toHaveAttribute("src", /^data:image\/png;base64,/);
  await expect(dialog.locator("code")).toBeHidden();
  await dialog.getByText("راهنمای ورود دستی در SafeAuth", { exact: true }).click();
  await expect(dialog.locator("code")).toHaveText(secret);
  await expect(dialog).toContainText("Private Key");
  await dialog.getByLabel("کد اپ احراز هویت", { exact: true }).fill("123456");
  await dialog.getByRole("button", { name: "تأیید و دریافت کدهای بازیابی" }).click();
  await expect(dialog.getByRole("alert")).toContainText("کلید این راه‌اندازی");
  await expect(dialog.getByRole("alert")).not.toContainText("مصرف شده");
  expect(calls.filter(path => path.endsWith("/auth/mfa/setup"))).toHaveLength(1);
  await dialog.getByRole("button", { name: "بستن", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
