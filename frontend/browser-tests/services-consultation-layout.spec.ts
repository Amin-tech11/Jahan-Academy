import { test, expect } from "@playwright/test";

for (const locale of ["fa", "en"]) {
  test(`${locale}: services preserves desktop overlap and stacks compact consultation`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}/services`);
    const layout = page.locator(".services-cta__layout");
    const geometry = () => layout.evaluate(e => {
      const photo = e.querySelector(".services-cta__photo")!.getBoundingClientRect();
      const card = e.querySelector(".services-cta__card")!.getBoundingClientRect();
      return { overlap: photo.right - card.left, verticalOverlap: photo.bottom - card.top,
        contained: card.left >= 0 && card.right <= innerWidth };
    });
    expect((await geometry()).overlap).toBeCloseTo(24, 0);
    expect((await geometry()).contained).toBe(true);
    await expect(page.locator(".services-request")).toBeVisible();
    for (const width of [390, 820, 1194]) {
      await page.setViewportSize({ width, height: 844 });
      expect((await geometry()).verticalOverlap).toBeCloseTo(-24, 0);
      expect((await geometry()).contained).toBe(true);
    }
  });
}
