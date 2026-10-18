import { test, expect } from "@playwright/test";

for (const locale of ["fa", "en"]) {
  test(`${locale}: strict public CSP blocks injected script and preserves navigation`, async ({ page, request }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    // Simulate attacker-controlled HTML, outside DevTools' privileged evaluation world.
    await page.route(new RegExp(`/${locale}$`), async route => {
      const upstream = await route.fetch();
      const html = (await upstream.text()).replace("</head>", '<script data-csp-probe>window.__injectedCspProbe = true</script></head>');
      await route.fulfill({ response: upstream, body: html });
    });
    const response = await page.goto(`/${locale}`);
    const policy = response!.headers()["content-security-policy"];
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(policy.split(";").find(rule => rule.trim().startsWith("script-src"))).not.toContain("unsafe-inline");
    expect(response!.headers()["cache-control"]).toContain("no-store");
    const inlineNonces = await page.locator("script:not([src]):not([data-csp-probe])").evaluateAll(nodes => nodes.map(node => (node as HTMLScriptElement).nonce));
    expect(inlineNonces.length).toBeGreaterThan(0);
    expect(inlineNonces.every(value => value === nonce)).toBe(true);
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__injectedCspProbe)).toBeUndefined();
    const second = await request.get(`/${locale}`);
    expect(second.headers()["content-security-policy"].match(/'nonce-([^']+)'/)?.[1]).not.toBe(nonce);
    await page.locator(`a[href="/${locale}/countries"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/countries$`));
    await expect(page.locator("h1")).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}
