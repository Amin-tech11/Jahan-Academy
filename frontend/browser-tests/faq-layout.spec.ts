import { test, expect } from "@playwright/test";

for (const locale of ["fa", "en"]) {
  for (const route of ["", "/about", "/countries", "/universities", "/countries/canada"]) {
    test(`${locale}${route}: fresh FAQ keeps its layout and accordion motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(`/${locale}${route}`);
      const question = page.locator('h3 > button[aria-controls]').first();
      const answerId = await question.getAttribute("aria-controls");
      const answer = page.locator(`[id="${answerId}"]`);
      await expect(question).toHaveAttribute("aria-expanded", "false");
      await expect(answer).toHaveCSS("display", "grid");
      await expect(answer).toHaveCSS("visibility", "hidden");
      expect(await answer.evaluate(e => e.getBoundingClientRect().height)).toBe(0);
      expect(await answer.evaluate(e => getComputedStyle(e).transitionProperty)).toContain("grid-template-rows");
      expect(await answer.evaluate(e => getComputedStyle(e).transitionDuration)).not.toBe("0s");
      await question.click();
      await expect(question).toHaveAttribute("aria-expanded", "true");
      await expect(answer).toHaveCSS("opacity", "1");
      expect(await answer.evaluate(e => e.getBoundingClientRect().height)).toBeGreaterThan(20);
      await question.press("Enter");
      await expect(answer).toHaveCSS("visibility", "hidden");
      await expect.poll(() => answer.evaluate(e => e.getBoundingClientRect().height)).toBe(0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(answer).toHaveCSS("transition-duration", "0s");
    });
  }
}
