import { expect, test } from '@playwright/test';
import { yektanetBootstrap } from '../lib/yektanet';

test('public head has a nonce; localhost and admin never load advertising', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', r => { if (/yektanet|sabavision/.test(r.url())) requests.push(r.url()); });
  const response = await page.goto('/fa', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('head script#jahan-yektanet')).toHaveCount(1);
  const nonce = await page.locator('#jahan-yektanet').evaluate((el: HTMLScriptElement) => el.nonce);
  expect(nonce).toBeTruthy();
  expect(response?.headers()['content-security-policy']).toContain(`'nonce-${nonce}'`);
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#jahan-yektanet')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('production-origin simulation: once, nonce, queued contact, SPA and privacy boundary', async ({ page, request }) => {
  const response = await request.get('/fa');
  const policy = response.headers()['content-security-policy'];
  const nonce = policy.match(/'nonce-([^']+)'/)![1];
  const calls: string[] = [], violations: string[] = [];
  let loads = 0;
  page.on('console', m => { if (/Content Security Policy|violates.*directive/.test(m.text())) violations.push(m.text()); });
  await page.route('**/*', async route => {
    if (route.request().url().startsWith('https://jahanacademi.ir/')) {
      return route.fulfill({ contentType: 'text/html', headers: { 'content-security-policy': policy }, body:
        `<html><head><script nonce="${nonce}">${yektanetBootstrap}</script></head><body><a data-yektanet-contact href="tel:+989196017164">Call</a></body></html>` });
    }
    if (route.request().url().includes('/WMkKzu6T/rg.complete.js')) {
      loads++;
      return route.fulfill({ contentType: 'application/javascript', body: `
        window.yektanet.event = id => fetch('https://ua.yektanet.com/api/analytics-event/v1/collect?tag=' + id);
        (window.yektanetManualTags || []).forEach(id => window.yektanet.event(id));
        window.yektanetManualTags = [];
      ` });
    }
    if (route.request().url().startsWith('https://ua.yektanet.com/')) {
      calls.push(route.request().url());
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    }
    return route.abort();
  });
  await page.goto('https://jahanacademi.ir/fa');
  // Prevent an actual phone handler while retaining a trusted browser click.
  await page.locator('a').evaluate(el => el.addEventListener('click', e => e.preventDefault()));
  await page.locator('a').click();
  await expect.poll(() => calls.length).toBe(1);
  await page.evaluate(() => history.pushState({}, '', '/en/services'));
  expect(loads).toBe(1);
  expect(calls[0]).toContain('c60b290c-8026-4396-b1e4-0b81a27e4384');
  expect(violations).toEqual([]);
  await page.evaluate(() => history.pushState({}, '', '/fa?email=private'));
  await expect(page).toHaveURL(/email=private/);
  expect(loads).toBe(1);
});
