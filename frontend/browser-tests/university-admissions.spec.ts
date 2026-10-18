import { test, expect } from "@playwright/test";
import { universityAdmissions } from "../lib/university-admissions";

for (const locale of ["fa", "en"] as const) {
  for (const [slug, admissions] of Object.entries(universityAdmissions)) {
    test(`${locale}/${slug} preserves admissions without public external source links`, async ({ page }) => {
      await page.goto(`/${locale}/universities/${slug}`, { waitUntil: "domcontentloaded" });
      await page.reload({ waitUntil: "domcontentloaded" });
      const section = page.locator("section[aria-labelledby='university-admissions-title']");
      await expect(section).toBeVisible();
      await expect(section.locator("article")).toHaveCount(admissions.programmes.length);
      await expect(section.locator("time")).toHaveAttribute("datetime", admissions.reviewedAt);
      await expect(section.locator("a[href^='http']")).toHaveCount(0);
      for (const programme of admissions.programmes) {
        const article = section.locator(`article[aria-labelledby='admission-${programme.id}']`);
        await expect(article.locator("h3")).toHaveText(programme.title[locale]);
        await expect(article.locator("dt")).toHaveCount(programme.rows.length);
        for (const row of programme.rows) {
          await expect(article).toContainText(row.text[locale]);
          expect(row.sources.length).toBeGreaterThan(0);
          for (const source of row.sources) expect(source.url).toMatch(/^https:\/\//);
        }
      }
    });
  }
}
