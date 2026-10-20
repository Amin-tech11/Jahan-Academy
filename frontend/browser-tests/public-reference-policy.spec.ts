import { test, expect } from "@playwright/test";

test("public pages expose external references only in rankings, editorial sources and company contacts", async ({ page, request }) => {
  test.setTimeout(180000);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const paths = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)]
    .map(match => new URL(match[1]).pathname);
  expect(paths.length).toBeGreaterThan(50);
  // Parse fetched HTML in a stable document, independent of app navigation/HMR.
  await page.goto("about:blank");
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    const violations = await page.evaluate(({ html, path }) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const editorial = /^\/(fa|en)\/(guides|articles|news)\/[^/]+/.test(path);
      return [...doc.querySelectorAll('a[href]')].flatMap(anchor => {
        const href = anchor.getAttribute("href") ?? "";
        if (!/^https?:\/\//.test(href)) return [];
        const host = new URL(href).hostname;
        if (["jahanacademi.ir", "www.jahanacademi.ir"].includes(host)) return [];
        if (anchor.closest("footer, #home-social") && ["t.me", "www.instagram.com", "wa.me"].includes(host)) return [];
        if (anchor.closest("#university-rankings")) return [];
        if (editorial && anchor.closest("section[aria-labelledby='guide-sources'], section[aria-labelledby='news-sources']")) return [];
        return [href];
      });
    }, { html: await response.text(), path });
    expect(violations, path).toEqual([]);
  }
  for (const locale of ["fa", "en"]) {
    await page.goto(`/${locale}/universities`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#university-rankings a[href^='https://']")).toHaveCount(3);
    await page.goto(`/${locale}/guides/netherlands-study-residence-guide`, { waitUntil: "domcontentloaded" });
    expect(await page.locator("section[aria-labelledby='guide-sources'] a").count()).toBeGreaterThan(0);
  }
});
