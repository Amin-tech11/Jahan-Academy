import { test, expect } from "@playwright/test";

for (const locale of ["fa", "en"]) {
  test(`${locale}: university profile opens in the same tab and returns to a bounded university grid`, async ({ page }) => {
    await page.goto(`/${locale}/universities`);
    const profile = page;
    const pageCount = page.context().pages().length;
    await page.locator(".home-university-card").first().click();
    await profile.emulateMedia({ reducedMotion: "reduce" });
    await profile.waitForURL(new RegExp(`/${locale}/universities/[^/]+$`));
    expect(page.context().pages()).toHaveLength(pageCount);
    await profile.getByRole("navigation", { name: locale === "fa" ? "ناوبری اصلی" : "Main navigation", exact: true })
      .locator(`a[href="/${locale}/universities"]`).click();
    await expect(profile).toHaveURL(new RegExp(`/${locale}/universities$`));
    await profile.locator('a[href="#university-countries"]').click();

    async function expectBoundedCards() {
      await expect(profile.locator(".home-university-card")).toHaveCount(3);
      await expect.poll(async () => profile.locator(".home-university-card__media").evaluateAll(elements =>
        elements.every(element => {
          const box = element.getBoundingClientRect();
          const image = element.querySelector("img")!.getBoundingClientRect();
          return box.height > 80 && box.height < 450 &&
            image.width <= box.width + 2 && image.height <= box.height + 2;
        }),
      )).toBe(true);
      expect(await profile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }

    await expectBoundedCards();
    await profile.reload();
    await expectBoundedCards();
    await profile.setViewportSize({ width: 390, height: 844 });
    await expectBoundedCards();
    await profile.close();
  });
}
