import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Synthetic, intercepted UI fixtures only. No Google credentials or live account data.
function fixture(days = 28) {
  return {
    status: "ready", source: "google_analytics_4", propertyId: "558971968", rangeDays: days,
    fetchedAt: "2026-10-20T08:00:00Z", timeZone: "Asia/Tehran", cached: false,
    totals: { activeUsers: days === 7 ? 4 : 10, newUsers: 4, sessions: 20, views: 50, engagementRate: .75 },
    previous: { activeUsers: 8, newUsers: 3, sessions: 16, views: 40, engagementRate: .5 },
    daily: [
      { date: "2026-10-18", activeUsers: 6, newUsers: 2, sessions: 8, views: 20, engagementRate: .5 },
      { date: "2026-10-19", activeUsers: 7, newUsers: 2, sessions: 12, views: 30, engagementRate: .9166667 },
    ],
    channels: [{ name: "Organic Search", sessions: 12 }, { name: "Direct", sessions: 8 }],
    devices: [{ name: "mobile", sessions: 15 }, { name: "desktop", sessions: 5 }],
    pages: [{ path: "/fa", views: 30 }, { path: "/fa/countries/canada", views: 20 }], limitations: [],
  };
}

async function panel(page: Page, options: { superAdmin?: boolean; configured?: boolean; overviewError?: boolean; liveError?: boolean } = {}) {
  const calls: string[] = [];
  await page.route("**/admin/api/**", async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    calls.push(path + url.search);
    if (path.endsWith("/auth/refresh")) return route.fulfill({ json: { data: { accessToken: "synthetic", user: { id: "test", firstName: "آزمون", lastName: "مدیر" }, mfaEnrollmentRequired: false } } });
    if (path.endsWith("/auth/activity")) return route.fulfill({ status: 204 });
    if (path.endsWith("/users/me/panel-access")) return route.fulfill({ json: { data: { isSuperAdmin: options.superAdmin !== false, sections: ["leads", "analytics"] } } });
    if (path.endsWith("/reporting/analytics/realtime")) {
      if (options.liveError) return route.fulfill({ status: 503, json: { error: { code: "ANALYTICS_UPSTREAM_FAILED" } } });
      return route.fulfill({ json: { status: options.configured === false ? "not_configured" : "ready", propertyId: "558971968", activeUsers: options.configured === false ? null : 3, fetchedAt: "2026-10-20T08:00:00Z" } });
    }
    if (path.endsWith("/reporting/analytics")) {
      if (options.overviewError) return route.fulfill({ status: 429, json: { error: { code: "ANALYTICS_QUOTA_EXCEEDED" } } });
      if (options.configured === false) return route.fulfill({ json: { status: "not_configured", propertyId: "558971968", rangeDays: 28, totals: null, previous: null, daily: [], channels: [], devices: [], pages: [], limitations: [] } });
      return route.fulfill({ json: fixture(Number(url.searchParams.get("days") || 28)) });
    }
    return route.fulfill({ json: { data: [], total: 0, meta: { total: 0 } } });
  });
  await page.goto("/admin");
  await expect(page.locator('nav[aria-label="بخش‌های مدیریت"]')).toBeAttached();
  return calls;
}

async function openAnalytics(page: Page) {
  if (page.viewportSize()!.width < 900) await page.getByRole("button", { name: "فهرست بخش‌ها" }).click();
  await page.getByRole("button", { name: "آمار بازدید سایت", exact: true }).click();
  await expect(page.getByRole("heading", { name: "آمار بازدید سایت", level: 1 })).toBeVisible();
}

test("support cannot see analytics even when an invalid reserved section is returned", async ({ page }) => {
  const calls = await panel(page, { superAdmin: false });
  await expect(page.getByRole("button", { name: "آمار بازدید سایت", exact: true })).toHaveCount(0);
  expect(calls.some(path => path.includes("reporting/analytics"))).toBe(false);
});

test("unconfigured connection shows setup, not fabricated report values", async ({ page }) => {
  await panel(page, { configured: false });
  await openAnalytics(page);
  await expect(page.getByRole("heading", { name: "اتصال Google Analytics هنوز فعال نشده است" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "روند روزانه" })).toHaveCount(0);
});

test("admin report preserves period totals, filters and accessible daily detail", async ({ page }, testInfo) => {
  const calls = await panel(page);
  await openAnalytics(page);
  await expect(page.getByRole("heading", { name: "روند روزانه" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "کاربران فعال", exact: true }).locator("..")).toContainText("۱۰");
  await expect(page.getByText("۲۵ واحد درصد افزایش", { exact: true })).toBeVisible();
  const channelBars = page.getByRole("region", { name: "۱۰ کانال ورودی برتر" }).locator('li > div[aria-hidden="true"] > span');
  const channelWidths = await channelBars.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
  expect(channelWidths[1] / channelWidths[0]).toBeCloseTo(8 / 12, 2);
  await page.getByLabel("بازهٔ گزارش").selectOption("7");
  await expect.poll(() => calls.some(path => path.endsWith("analytics?days=7"))).toBe(true);
  await expect(page.locator('[data-analytics-dashboard]')).toContainText("۷ روز کامل تا دیروز");
  await expect(page.getByRole("heading", { name: "کاربران فعال", exact: true }).locator("..")).toContainText("۴");
  await page.getByLabel("شاخص نمودار").selectOption("sessions");
  await page.getByText("مشاهدهٔ داده‌های روزانه", { exact: true }).click();
  await expect(page.getByRole("table", { name: "گزارش روزانهٔ Google Analytics" })).toBeVisible();
  const violations = (await new AxeBuilder({ page }).include('[data-analytics-dashboard]').analyze()).violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
  expect(violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("analytics-desktop.png"), fullPage: true });
});

test("historical failure offers retry and realtime failure stays unavailable", async ({ page }) => {
  const options = { overviewError: true, liveError: true };
  await panel(page, options);
  await openAnalytics(page);
  await expect(page.locator('[data-analytics-dashboard]').getByRole("alert")).toContainText("سهمیهٔ گزارش‌گیری");
  await expect(page.getByRole("heading", { name: "روند روزانه" })).toHaveCount(0);
  options.overviewError = false;
  await page.getByRole("button", { name: "تلاش دوباره" }).click();
  await expect(page.getByRole("heading", { name: "روند روزانه" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "فعال در ۳۰ دقیقهٔ اخیر" }).locator("..")).toContainText("—");
});

test("analytics is usable on a narrow mobile viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await panel(page);
  await openAnalytics(page);
  await expect(page.getByRole("heading", { name: "۱۰ صفحهٔ پربازدید" })).toBeVisible();
  const width = await page.locator('[data-analytics-dashboard]').evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  await page.screenshot({ path: testInfo.outputPath("analytics-mobile.png"), fullPage: true });
});
