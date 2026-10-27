import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { yektanetBootstrap } from '../lib/yektanet.ts';

function setup(href = 'https://jahanacademi.ir/fa', referrer = '') {
  const listeners = new Map(), scripts = [], navigations = [], sent = [];
  function add(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); }
  function remove(type, fn) { listeners.get(type)?.delete(fn); }
  class Element { closest() { return this; } }
  const window = {
    location: { href, assign: u => navigations.push(u), replace: u => navigations.push(u) },
    history: { pushState() {}, replaceState() {} }, addEventListener: add, removeEventListener: remove,
  };
  const document = {
    referrer, currentScript: { nonce: 'test-nonce' }, addEventListener: add, removeEventListener: remove,
    getElementById: id => scripts.find(s => s.id === id),
    createElement: () => ({ dataset: {} }),
    getElementsByTagName: () => [{ parentNode: { insertBefore: s => scripts.push(s) } }],
  };
  const context = vm.createContext({ window, document, URL, Element });
  const run = () => vm.runInContext(yektanetBootstrap, context);
  const fire = (type, event = {}) => { for (const fn of listeners.get(type) ?? []) fn(event); };
  run();
  return { window, scripts, navigations, sent, run, fire, Element,
    ready() { window.yektanet.event = id => sent.push(id); } };
}
test('only public production documents without URL data load the correct script once', () => {
  for (const url of ['http://localhost:5000/fa', 'https://preview.test/fa', 'https://jahanacademi.ir/admin',
    'https://jahanacademi.ir/fa/account', 'https://jahanacademi.ir/fa?email=secret', 'https://jahanacademi.ir/fa#secret']) {
    assert.equal(setup(url).scripts.length, 0);
  }
  for (const ref of ['https://jahanacademi.ir/admin', 'https://search.test/?q=secret']) {
    assert.equal(setup(undefined, ref).scripts.length, 0);
  }
  const app = setup(); app.run();
  assert.equal(setup('https://jahanacademi.ir/fa/free-consultation?source=footer').scripts.length, 1);
  assert.equal(app.scripts.length, 1);
  assert.match(app.scripts[0].src, /scripts_v3\/WMkKzu6T\/rg.complete.js\?v=/);
  assert.equal(app.scripts[0].nonce, 'test-nonce');
});
test('contact queues before readiness, sends only tag ID and isolates vendor failures', () => {
  const app = setup();
  const click = { isTrusted: true, target: new app.Element() };
  app.fire('click', click);
  assert.deepEqual(Array.from(app.window.yektanetManualTags), ['c60b290c-8026-4396-b1e4-0b81a27e4384']);
  app.ready(); app.fire('click', click);
  assert.deepEqual(app.sent, ['c60b290c-8026-4396-b1e4-0b81a27e4384']);
  app.window.yektanet.event = () => { throw new Error('offline'); };
  assert.doesNotThrow(() => app.fire('click', click));
});
test('install requires trusted appinstalled, counts once; no signup or form conversion', () => {
  const app = setup(); app.ready(); app.run();
  for (const type of ['beforeinstallprompt', 'submit', 'signup', 'login']) app.fire(type, { isTrusted: true });
  app.fire('appinstalled', { isTrusted: false });
  assert.equal(app.sent.length, 0);
  app.fire('appinstalled', { isTrusted: true }); app.fire('appinstalled', { isTrusted: true });
  assert.deepEqual(app.sent, ['62d791d1-09f0-4f37-a519-955f7c8b8fea']);
});
test('listeners clean up and restore without duplication; unsafe SPA URLs cross document boundary', () => {
  const app = setup(); app.ready();
  const click = { isTrusted: true, target: new app.Element() };
  app.fire('pagehide'); app.fire('click', click); assert.equal(app.sent.length, 0);
  app.fire('pageshow'); app.fire('pageshow'); app.fire('click', click); assert.equal(app.sent.length, 1);
  app.window.history.pushState({}, '', '/fa/services'); assert.equal(app.navigations.length, 0);
  app.window.history.pushState({}, '', '/fa?phone=private');
  assert.deepEqual(app.navigations, ['/fa?phone=private']);
});
