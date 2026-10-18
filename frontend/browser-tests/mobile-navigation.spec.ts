import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("slow scripts do not expose an unresponsive menu button", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  let release!: () => void;
  const scripts = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async route => {
    await scripts;
    await route.continue();
  });
  try {
    await page.goto("/en/privacy", { waitUntil: "commit" });
    const toggle = page.locator(".mobile-menu-toggle");
    await expect(toggle).toBeDisabled();
    release();
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(page.locator("dialog.mobile-nav")).toBeVisible();
  } finally { release(); }
});

for (const locale of ["fa", "en"]) {
  test(`${locale}: destination title and country toggle have independent actions`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/privacy`);
    await page.reload();
    await page.locator(".mobile-menu-toggle").click();
    const menu = page.locator("dialog.mobile-nav");
    const title = menu.locator(".mobile-destinations-row > a");
    const countryToggle = menu.locator(".mobile-destinations-toggle");
    for (const control of [title, countryToggle]) {
      const bounds = await control.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    await countryToggle.focus();
    await countryToggle.press("Space");
    await expect(countryToggle).toHaveAttribute("aria-expanded", "true");
    await expect(page).toHaveURL(new RegExp(`/${locale}/privacy$`));
    const countries = menu.locator("#mobile-destinations-list");
    await expect(countries.locator("a").first()).toHaveAttribute("href", `/${locale}/countries`);
    await countryToggle.press("Enter");
    await expect(countries).toBeHidden();
    await title.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/countries$`));
    await expect(menu).toBeHidden();
    await page.locator(".mobile-menu-toggle").click();
    await countryToggle.click();
    await countries.locator("a").first().click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/${locale}/countries$`));
    await page.locator(".mobile-menu-toggle").click();
    await countries.locator('a[href$="/germany"]').click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/countries/germany$`));
    await expect(menu).toBeHidden();
  });
  for (const width of [320, 360, 390, 430, 600, 768, 820, 1024, 1194]) {
    test(`${locale} ${width}: touch menu fits and restores focus`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/${locale}/privacy`);
      const toggle = page.locator(".mobile-menu-toggle");
      const menu = page.locator("dialog.mobile-nav");
      await toggle.click();
      await expect(menu).toBeVisible();
      await expect(page.locator('[data-mobile-consultation-visible="true"]')).toHaveCount(0);
      const box = await menu.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(844);
      await expect(page.locator(".mobile-nav__close")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      expect(await menu.evaluate(node => node.contains(document.activeElement))).toBe(true);
      const countryToggle = menu.locator(".mobile-destinations-toggle");
      await countryToggle.click();
      await expect(countryToggle).toHaveAttribute("aria-expanded", "true");
      await expect(menu.locator("#mobile-destinations-list")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/${locale}/privacy$`));
      await page.keyboard.press("Escape");
      await expect(menu).not.toBeVisible();
      await expect(toggle).toBeFocused();
      await expect(page.locator('[data-mobile-consultation-visible="true"]')).toBeVisible();
      await expect.poll(() => page.locator(".site").evaluate(node => {
        const action = document.querySelector<HTMLElement>('[data-mobile-consultation-visible="true"]');
        return parseFloat(getComputedStyle(node).paddingBottom) >= (action?.getBoundingClientRect().height ?? Infinity) - 1;
      })).toBe(true);
      await expect(page.locator('[data-mobile-consultation-visible] a')).toHaveAttribute("href", `/${locale}/free-consultation?source=mobile-consultation`);
    });
  }
  test(`${locale}: dedicated forms suppress the bottom action`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["consultation", "free-consultation"]) {
      await page.goto(`/${locale}/${route}`);
      await expect(page.locator("[data-mobile-consultation-visible]")).toBeHidden();
    }
  });
  test(`${locale}: consultation form and modal state do not compete with the bottom action`, async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1000 });
    await page.goto(`/${locale}/about`);
    const bar = page.locator("[data-mobile-consultation-visible]");
    await expect(bar).toBeVisible();
    await page.locator(".home-consultation__form").scrollIntoViewIfNeeded();
    await expect(bar).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).toBeVisible();
    await page.locator(".mobile-menu-toggle").click();
    await expect(bar).toBeHidden();
    await page.mouse.click(810, 990);
    await expect(page.locator("dialog.mobile-nav")).toBeHidden();
    await expect(bar).toBeVisible();
    await page.locator(".mobile-menu-toggle").click();
    await page.setViewportSize({ width: 1280, height: 1000 });
    await expect(page.locator("dialog.mobile-nav")).toBeHidden();
    expect(await page.locator("html").evaluate(node => node.style.overflow)).not.toBe("hidden");
  });
  test(`${locale}: desktop retains full navigation and floating card`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`/${locale}/privacy`);
    await expect(page.locator(".main-nav")).toBeVisible();
    await expect(page.locator(".mobile-menu-toggle")).toBeHidden();
    await expect(page.locator("[data-mobile-consultation-visible]")).toBeHidden();
  });
  test(`${locale}: open touch menu has no serious accessibility violations`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(`/${locale}/privacy`);
    await page.locator(".mobile-menu-toggle").click();
    await expect(page.locator("dialog.mobile-nav")).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  });
}
