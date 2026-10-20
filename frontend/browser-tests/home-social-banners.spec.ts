import { test, expect } from "@playwright/test";

for (const locale of ["fa", "en"]) {
  test(`${locale}: social banners follow FAQ, match footer destinations and open safely`, async ({ page, context }) => {
    await page.goto(`/${locale}`, { waitUntil: "domcontentloaded" });
    const section = page.locator("#home-social");
    await expect(section.locator("a")).toHaveCount(3);
    expect(await section.evaluate(node => node.previousElementSibling?.querySelector("#home-faq-title") !== null)).toBe(true);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await section.scrollIntoViewIfNeeded();
      await expect.poll(() => section.locator("img").evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
      const boxes = await section.locator("a").evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect();
        return { width: box.width, height: box.height, top: box.top };
      }));
      expect(boxes.every(box => Math.abs(box.width - box.height) < 1)).toBe(true);
      if (width === 1440) expect(new Set(boxes.map(box => Math.round(box.top))).size).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await context.route(/https:\/\/(t\.me|www\.instagram\.com|wa\.me)\//, route => route.fulfill({ contentType: "text/html", body: "<title>Social destination test</title>" }));
    for (const link of await section.locator("a").all()) {
      const href = await link.getAttribute("href");
      await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      const popupPromise = page.waitForEvent("popup");
      await link.click();
      const popup = await popupPromise;
      await expect(popup).toHaveURL(href!);
      await popup.close();
    }
    const image = section.locator("img").first();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await image.hover();
    await expect.poll(() => image.evaluate(node => Number(getComputedStyle(node).transform.match(/matrix\(([^,]+)/)?.[1] ?? 1))).toBeGreaterThan(1.02);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(image).toHaveCSS("transform", "none");
    await section.screenshot({ path: `test-results/social-banners-${locale}.png` });
  });
}
