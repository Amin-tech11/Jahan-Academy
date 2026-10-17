import { test, expect } from "@playwright/test";

for (const cancel of [false, true]) {
  test(`sensitive panel change ${cancel ? "cancels without mutation" : "requires password and MFA"}`, async ({ page }) => {
    const id = "11111111-1111-4111-8111-111111111111";
    let writes = 0;
    let activities = 0;
    let confirmations = 0;
    await page.route("**/admin/api/**", async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path.endsWith("/auth/refresh")) await route.fulfill({ json: { data: {
        accessToken: "synthetic", csrfToken: "synthetic", mfaEnrollmentRequired: false,
        user: { id: "admin", firstName: "Admin", lastName: "Test" },
      } } });
      else if (path.endsWith("/auth/activity")) { activities++; await route.fulfill({ status: 204 }); }
      else if (path.endsWith("/auth/reauthenticate")) {
        confirmations++;
        const body = request.postDataJSON();
        expect(body.path).toBe(`/admin/staff/${id}/panel-access`);
        expect(body.method).toBe("PUT");
        expect(body.password).toBe("Synthetic-Password-2026");
        expect(body.code).toBe("synthetic-recovery");
        await route.fulfill({ json: { data: { token: "one-use-proof", expiresIn: 300 } } });
      } else if (path.endsWith(`/staff/${id}/panel-access`)) {
        if (request.method() === "PUT") {
          writes++;
          if (!request.headers()["x-reauth-token"]) {
            await route.fulfill({ status: 403, json: { error: { code: "REAUTH_REQUIRED" } } }); return;
          }
          expect(request.headers()["x-reauth-token"]).toBe("one-use-proof");
        }
        await route.fulfill({ json: { data: { sections: writes > 1 ? ["leads", "dashboard"] : ["leads"], version: writes > 1 ? 2 : 1, isSuperAdmin: false } } });
      } else if (path.endsWith("/users/me/panel-access")) await route.fulfill({ json: { data: { sections: ["access"], isSuperAdmin: true } } });
      else if (path.endsWith("/admin/staff")) await route.fulfill({ json: { data: [{ id, firstName: "Test", lastName: "Staff", email: "staff@example.com", active: true }], meta: { total: 1 } } });
      else await route.fulfill({ json: { data: [] } });
    });
    await page.goto("/admin");
    await page.getByRole("button", { name: "مدیریت دسترسی", exact: true }).click();
    await page.getByRole("button", { name: "تنظیم دسترسی", exact: true }).click();
    const editor = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "دسترسی‌های Test Staff" }) });
    await editor.getByRole("checkbox").nth(0).check();
    await editor.getByRole("button", { name: "ذخیره دسترسی‌ها" }).click();
    const challenge = page.getByRole("dialog", { name: "تأیید هویت برای عملیات حساس" });
    await expect(challenge).toBeVisible();
    expect(writes).toBe(1);
    if (cancel) {
      await challenge.getByRole("button", { name: "لغو عملیات" }).click();
      await expect(challenge).toHaveCount(0);
      expect(writes).toBe(1); expect(confirmations).toBe(0);
    } else {
      await challenge.locator('input[name="password"]').fill("Synthetic-Password-2026");
      await challenge.locator('input[name="code"]').fill("synthetic-recovery");
      await challenge.getByRole("button", { name: "تأیید و ادامه" }).click();
      await expect(editor.getByRole("status")).toContainText("دسترسی‌ها ذخیره");
      expect(writes).toBe(2); expect(confirmations).toBe(1);
    }
    expect(activities).toBeGreaterThan(0);
  });
}
