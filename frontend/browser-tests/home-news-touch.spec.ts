import { test, expect, type Page } from "@playwright/test";

test.use({ hasTouch: true, isMobile: true });

async function swipe(page: Page, x: number, y: number, dx: number, dy = 0) {
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 12; step++) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * step / 12, y: y + dy * step / 12 }] });
    await page.waitForTimeout(16);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
}

for (const locale of ["fa", "en"]) {
  for (const width of [390, 820]) {
    test(`${locale} ${width}: news swipes naturally both ways without opening a link`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}`);
      if (locale === "fa" && width === 390) await page.reload();
      const viewport = page.locator(".home-news__viewport");
      await viewport.scrollIntoViewIfNeeded();
      await expect(viewport).toHaveCSS("overflow-x", "auto");
      await expect(page.locator(".home-news__track")).toHaveCSS("animation-name", "none");
      const box = (await viewport.boundingBox())!;
      const y = box.y + box.height / 2;
      const start = await viewport.evaluate(node => node.scrollLeft);
      await swipe(page, box.x + box.width * .8, y, -box.width * .55);
      await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBeGreaterThan(start + 80);
      // Wait for the browser's momentum/snap to settle before reversing direction.
      await expect.poll(async () => viewport.evaluate(node => Math.abs(node.scrollLeft - Number(node.dataset.lastScroll ?? 0)) < 1 ? true : (node.dataset.lastScroll = String(node.scrollLeft), false))).toBe(true);
      const forward = await viewport.evaluate(node => node.scrollLeft);
      await swipe(page, box.x + box.width * .2, y, box.width * .55);
      await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBeLessThan(forward - 80);
      await expect(page).toHaveURL(new RegExp(`/${locale}$`));
      const beforeY = await page.evaluate(() => scrollY);
      await swipe(page, box.x + box.width / 2, y, 0, -120);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeY + 40);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(viewport).toHaveCSS("overflow-x", "auto");
      await expect(page.locator('.home-news__group[aria-hidden="true"]')).toBeHidden();
      const link = page.locator(".home-news__card").first();
      const href = await link.getAttribute("href");
      await link.tap();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    });
  }
}
