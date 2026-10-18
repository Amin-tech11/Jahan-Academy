import { test, expect } from "@playwright/test";

test("media upload sends the signed multipart form and confirms only after storage accepts", async ({ page }) => {
  let uploaded = false;
  let confirmed = false;
  await page.route("http://localhost:9100/**", async route => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers()["content-type"]).toContain("multipart/form-data; boundary=");
    const body = route.request().postDataBuffer()!.toString();
    expect(body).toContain('name="policy"'); expect(body).toContain("synthetic-policy");
    expect(body).toContain('name="file"; filename="guide.pdf"');
    uploaded = true;
    await route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  });
  await page.route("**/admin/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/refresh")) await route.fulfill({ json: { data: { accessToken: "synthetic", mfaEnrollmentRequired: false, user: { id: "admin", firstName: "Test" } } } });
    else if (path.endsWith("/auth/activity")) await route.fulfill({ status: 204 });
    else if (path.endsWith("/users/me/panel-access")) await route.fulfill({ json: { data: { sections: ["media"], isSuperAdmin: false } } });
    else if (path.endsWith("/media/upload-intents")) await route.fulfill({ json: { data: { id: "synthetic-id", method: "POST", uploadUrl: "http://localhost:9100/quarantine", fields: { key: "fixed.pdf", policy: "synthetic-policy", "Content-Type": "application/pdf" }, headers: {}, maxSizeBytes: 3 } } });
    else if (path.endsWith("/synthetic-id/confirm")) { expect(uploaded).toBe(true); confirmed = true; await route.fulfill({ json: { data: {} } }); }
    else await route.fulfill({ json: { data: [], meta: { total: 0 } } });
  });
  await page.goto("/admin");
  await page.getByText("بارگذاری رسانه جدید", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "guide.pdf", mimeType: "application/pdf", buffer: Buffer.from("pdf") });
  await page.locator('select[name="purpose"]').selectOption("public_file", { force: true });
  await page.getByRole("button", { name: "بارگذاری و بررسی فایل", exact: true }).click();
  await expect.poll(() => confirmed).toBe(true);
});
