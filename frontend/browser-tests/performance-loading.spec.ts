import { test, expect } from "@playwright/test";

for (const locale of ["fa", "en"]) {
  for (const width of [390, 1440]) {
    test(`${locale} ${width}: critical resources are discovered early without shipping article bodies`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const response = await page.goto(`/${locale}`);
      const html = await response!.text();
      expect(Buffer.byteLength(html)).toBeLessThan(280000);
      expect(html).not.toContain("articleId");
      await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(2);
      await expect(page.locator('link[rel="preload"][as="image"][media]')).toHaveCount(2);
      const hero = page.locator(".home-hero__image");
      await expect(hero).toBeVisible();
      await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      const loaded = await hero.evaluate((image: HTMLImageElement) => ({ current: image.currentSrc, requests: performance.getEntriesByType("resource").filter(entry => entry.name === image.currentSrc).length }));
      expect(loaded.current).toContain("/hero-assets/");
      expect(loaded.requests).toBe(1);
    });
  }
}

test("journal transfers previews while keeping full articles on their own pages", async ({ page }) => {
  const response = await page.goto("/fa/articles");
  const html = await response!.text();
  expect(Buffer.byteLength(html)).toBeLessThan(150000);
  expect(html).not.toContain("articleId");
  await expect(page.locator("#journal-news .journal-card").first()).toBeVisible();
});
