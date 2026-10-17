import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.setTimeout(90000);
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: "reduce" }); });

for (const route of ["free-consultation", "consultation"]) {
  test(`${route}: slow JavaScript keeps submission disabled until handlers are ready`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let release!: () => void;
    const scripts = new Promise<void>(resolve => { release = resolve; });
    await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async request => { await scripts; await request.continue(); });
    try {
      await page.goto(`/en/${route}`, { waitUntil: "commit" });
      const submit = page.locator('main form button[type="submit"]');
      await expect(submit).toBeDisabled();
      const name = page.locator(`main form input[name="${route === "consultation" ? "fullName" : "firstName"}"]`);
      await name.fill("Before hydration");
      release();
      await expect(submit).toBeEnabled();
      await expect(name).toHaveValue("Before hydration");
      expect(new URL(page.url()).search).toBe("");
    } finally { release(); }
  });
}

for (const locale of ["fa", "en"]) {
  for (const width of [320, 360, 390, 430, 600, 768, 820, 1024, 1194]) {
    test(`${locale} ${width}: conversion layouts fit and use the intended columns`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ["free-consultation", "consultation"]) {
        await page.goto(`/${locale}/${route}`, { waitUntil: "domcontentloaded" });
        const grid = page.locator(route === "consultation" ? ".assessment-form__grid" : ".home-consultation__fields");
        await expect(grid).toBeVisible();
        expect(await grid.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(width < 768 ? 1 : 2);
        for (const field of await grid.locator("input, .site-select__trigger").all()) {
          const box = await field.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
          expect(await field.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
        }
        if (route === "free-consultation") {
          const image = await page.locator(".free-consultation-page__media").boundingBox();
          const form = await page.locator(".home-consultation__form").boundingBox();
          expect(image!.y + image!.height).toBeLessThanOrEqual(form!.y);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      await page.goto(`/${locale}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".home-hero-chat")).toBeHidden();
      const hero = page.locator(".home-hero");
      const heroImage = hero.locator(".home-hero__image");
      await expect(heroImage).toBeVisible();
      expect(await hero.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(320);
      await expect(heroImage).toHaveAttribute("src", /home-hero-campus-v2|hero-assets/);
      const columns = await page.locator(".home-destinations").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length);
      expect(columns).toBe(width < 600 ? 1 : width < 1024 ? 2 : 3);
      expect(await page.locator(".home-services").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(width < 600 ? 1 : 2);
      expect(await page.locator(".home-universities").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(width < 600 ? 1 : width < 1024 ? 2 : 3);
    });
  }

  test(`${locale}: collapsible journey keeps complete text and desktop presentation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}`, { waitUntil: "domcontentloaded" });
    const steps = page.locator(".home-process__step");
    await expect(steps).toHaveCount(13);
    await expect(page.locator(".home-process__toggle")).toHaveCount(13);
    expect((await steps.locator(".home-process__detail").allTextContents()).every(text => text.length > 20)).toBe(true);
    const first = steps.first();
    await expect(first.locator("p")).toBeHidden();
    await first.getByRole("button").click();
    await expect(first.locator("p")).toBeVisible();
    await expect(first.locator(".home-process__media")).toBeVisible();
    await first.getByRole("button").press("Enter");
    await expect(first.locator("p")).toBeHidden();
    for (const width of [1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(page.locator(".home-hero-chat")).toBeVisible();
      await expect(page.locator(".home-process__toggle")).toHaveCount(0);
      await expect(page.locator(".home-process__detail:visible")).toHaveCount(13);
      await expect(page.locator(".home-process__media:visible")).toHaveCount(13);
      expect(await page.locator(".home-services").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(4);
    }
  });

  test(`${locale}: native and API errors are inline; rotation preserves values and retries`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests: { key: string | undefined; body: Record<string, unknown> }[] = [];
    await page.route("**/api/v1/consultation-requests", async route => {
      requests.push({ key: route.request().headers()["idempotency-key"], body: route.request().postDataJSON() });
      if (requests.length === 1) await route.fulfill({ status: 422, json: { error: { code: "validation_error", message: "Check the surname", fieldErrors: { lastName: ["Check the surname"] } } } });
      else if (requests.length === 2) await route.fulfill({ status: 503, json: { error: { code: "temporarily_unavailable", message: "Please retry" } } });
      else await route.fulfill({ status: 201, json: { data: { reference: "JA-RESPONSIVE-TEST", duplicate: false } } });
    });
    await page.goto(`/${locale}/free-consultation`, { waitUntil: "domcontentloaded" });
    const form = page.locator(".home-consultation__form");
    const submit = form.locator('button[type="submit"]');
    await submit.click();
    await expect(form.locator('[name="firstName"]')).toBeFocused();
    await expect(form.locator(".public-field-error")).toHaveCount(6);
    const errorBounds = await form.locator('[name="firstName"]').boundingBox();
    const header = await page.locator(".site-header").boundingBox();
    expect(errorBounds!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
    expect(errorBounds!.y + errorBounds!.height).toBeLessThanOrEqual(844);
    await form.locator('[name="firstName"]').fill("Responsive");
    await form.locator('[name="lastName"]').fill("Applicant");
    await form.locator('[name="mobile"]').fill("invalid");
    await form.locator(".site-select__trigger").first().click();
    await page.getByRole("listbox").getByRole("option").nth(1).click();
    await form.locator('[name="privacyConsent"]').check();
    await form.locator('[name="contactConsent"]').check();
    await submit.click();
    await expect(form.locator('[name="mobile"]')).toBeFocused();
    await expect(form.locator('[name="mobile"]')).toHaveAttribute("aria-invalid", "true");
    expect(requests).toHaveLength(0);
    await form.locator('[name="mobile"]').fill("09121234567");
    for (const width of [820, 320, 1194, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(form.locator('[name="firstName"]')).toHaveValue("Responsive");
      await expect(form.locator('[name="lastName"]')).toHaveValue("Applicant");
      await expect(form.locator('[name="mobile"]')).toHaveValue("09121234567");
      await expect(form.locator('[name="privacyConsent"]')).toBeChecked();
    }
    expect(await page.evaluate(() => [...Object.values(localStorage), ...Object.values(sessionStorage)].some(value => value.includes("Responsive") || value.includes("09121234567")))).toBe(false);
    await submit.click();
    await expect(form.locator('[name="lastName"]')).toBeFocused();
    await expect(form.locator(".public-field-error")).toHaveText(locale === "fa" ? "مقدار واردشده معتبر نیست." : "Please check this value.");
    await form.locator('[name="lastName"]').fill("Applicant Updated");
    await submit.click();
    await expect(form.getByRole("alert")).toHaveText("Please retry");
    await page.setViewportSize({ width: 320, height: 844 });
    await submit.click();
    const reference = page.getByText("JA-RESPONSIVE-TEST", { exact: true });
    await expect(reference).toBeVisible();
    const receiptBounds = await reference.boundingBox();
    expect(receiptBounds!.x).toBeGreaterThanOrEqual(0);
    expect(receiptBounds!.x + receiptBounds!.width).toBeLessThanOrEqual(320);
    expect(requests).toHaveLength(3);
    expect(requests[0].key).not.toBe(requests[1].key);
    expect(requests[1].key).toBe(requests[2].key);
    expect(requests[2].body.mobile).toBe("+989121234567");
  });

  test(`${locale}: assessment retains entries and focuses the first invalid field`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/consultation`, { waitUntil: "domcontentloaded" });
    let submitted: Record<string, unknown> | undefined;
    await page.route("**/api/v1/consultation-requests", async route => {
      submitted = route.request().postDataJSON();
      await route.fulfill({ status: 422, json: { error: { code: "validation_error", message: "Check the name", fieldErrors: { firstName: ["INVALID_NAME"] } } } });
    });
    const form = page.locator(".assessment-form");
    await form.locator('[name="fullName"]').fill("Responsive Applicant");
    await form.locator('[name="mobile"]').fill("09121234567");
    await form.locator('[name="email"]').fill("invalid-mail");
    await form.locator('[name="age"]').fill("25");
    for (const width of [820, 320, 1194]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(form.locator('[name="fullName"]')).toHaveValue("Responsive Applicant");
      await expect(form.locator('[name="mobile"]')).toHaveValue("09121234567");
      await expect(form.locator('[name="age"]')).toHaveValue("25");
    }
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[name="email"]')).toBeFocused();
    await expect(form.locator('[name="email"]')).toHaveAttribute("aria-invalid", "true");
    await expect(form.locator('[name="email"]').locator("..").locator(".public-field-error")).toBeVisible();
    expect(submitted).toBeUndefined();
    await form.locator('[name="email"]').fill("responsive@example.com");
    await form.locator('[name="occupation"]').fill("Student");
    for (const select of await form.locator(".site-select__trigger").all()) {
      await select.click();
      await page.getByRole("listbox").getByRole("option").nth(1).click();
    }
    await form.locator('[name="privacyConsent"]').check();
    await form.locator('[name="contactConsent"]').check();
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[name="fullName"]')).toBeFocused();
    await expect(form.locator('[name="fullName"]')).toHaveAttribute("aria-invalid", "true");
    await expect(form.locator('[name="fullName"]')).toHaveValue("Responsive Applicant");
    expect(submitted?.firstName).toBe("Responsive");
    expect(submitted?.lastName).toBe("Applicant");
  });

  test(`${locale}: short landscape dropdown remains visible after viewport resize`, async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 390 });
    await page.goto(`/${locale}/free-consultation`, { waitUntil: "domcontentloaded" });
    await page.locator(".home-consultation__form .site-select__trigger").first().click();
    const popup = page.getByRole("listbox");
    await expect(popup).toBeVisible();
    for (const viewport of [{ width: 820, height: 390 }, { width: 390, height: 500 }]) {
      await page.setViewportSize(viewport);
      await expect.poll(async () => {
        const box = await popup.boundingBox();
        return Boolean(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1);
      }).toBe(true);
      expect(await popup.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    }
  });

  test(`${locale}: validation messages remain accessible on a narrow screen`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(`/${locale}/free-consultation`, { waitUntil: "domcontentloaded" });
    await page.locator('.home-consultation__form button[type="submit"]').click();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });

  test(`${locale}: inline consultation forms stack and validate on every template`, async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 390 });
    const routes = [
      { path: "/services", form: ".services-request", photo: ".services-cta__photo" },
      { path: "/about", form: ".home-consultation__form", photo: ".home-closing__image" },
      { path: "/articles", form: ".home-consultation__form", photo: ".home-closing__image" },
      { path: "/countries", form: ".home-consultation__form", photo: ".home-closing__image" },
      { path: "/countries/germany", form: "form[data-consultation-form]", photo: "#destination-consultation img" },
      { path: "/universities", form: ".home-consultation__form", photo: ".home-closing__image" },
    ];
    for (const route of routes) {
      await page.goto(`/${locale}${route.path}`, { waitUntil: "domcontentloaded" });
      const form = page.locator(route.form);
      await form.scrollIntoViewIfNeeded();
      const picture = await page.locator(route.photo).first().boundingBox();
      const bounds = await form.boundingBox();
      expect(picture!.y + picture!.height).toBeLessThanOrEqual(bounds!.y + 1);
      expect(await form.locator('[name="firstName"]').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
      await form.locator('button[type="submit"]').click();
      const first = form.locator('[name="firstName"]');
      await expect(first).toBeFocused();
      await expect(first).toHaveAttribute("aria-invalid", "true");
      const field = await first.boundingBox();
      const header = await page.locator(".site-header").boundingBox();
      expect(field!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
      expect(field!.y + field!.height).toBeLessThanOrEqual(390);
      await expect(page.locator("[data-mobile-consultation-visible]")).toBeHidden();
    }
  });
}
