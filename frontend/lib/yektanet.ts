// Kept inline for the ordinary, nonce-bearing script at the start of the public head.
// Base loader supplied by Yektanet for jahanacademi.ir, with host/privacy/duplicate guards.
export const yektanetBootstrap = String.raw`
(function () {
  try {
  var w = window, d = document;
  function publicUrl(value) {
    try {
      var u = new URL(value, w.location.href);
      var safeSources = ['about', 'floating-consultation', 'hero-example', 'home-trust',
        'mobile-consultation', 'footer', 'header', 'mobile-menu'];
      var safeQuery = Array.from(u.searchParams).every(function (entry) {
        return entry[0] === 'source' && safeSources.includes(entry[1]);
      });
      return /^(www\.)?jahanacademi\.ir$/.test(u.hostname) &&
        /^\/(fa|en)(\/|$)/.test(u.pathname) &&
        !/\/(admin|login|register|reset-password|payment|account)(\/|$)/i.test(u.pathname) &&
        safeQuery && !u.hash;
    } catch (_) { return false; }
  }
  // The vendor reads the complete URL/referrer. Do not load on URLs carrying data.
  if (!publicUrl(w.location.href) || (d.referrer && !publicUrl(d.referrer) &&
      (new URL(d.referrer).pathname !== '/' || new URL(d.referrer).search || new URL(d.referrer).hash)) ||
      w.jahanYektanet || d.getElementById('ua-script-WMkKzu6T')) return;
  w.jahanYektanet = true;

  // Cross this privacy boundary with a new document, where the loader is gated again.
  // Install before the vendor's own SPA hooks. No extra page-view calls are needed.
  ['pushState', 'replaceState'].forEach(function (method) {
    var original = w.history[method];
    w.history[method] = function (state, unused, url) {
      if (url != null && !publicUrl(new URL(url, w.location.href).href)) {
        w.location[method === 'replaceState' ? 'replace' : 'assign'](url);
        return;
      }
      return original.apply(this, arguments);
    };
  });
  var contact = 'c60b290c-8026-4396-b1e4-0b81a27e4384';
  var install = '62d791d1-09f0-4f37-a519-955f7c8b8fea';
  var installed = false;
  function send(tag) {
    try {
      if (!publicUrl(w.location.href)) return;
      if (typeof w.yektanet?.event === 'function') w.yektanet.event(tag);
      else (w.yektanetManualTags || (w.yektanetManualTags = [])).push(tag);
    } catch (_) { /* Advertising must never interrupt the site. */ }
  }
  function clicked(e) {
    if (e.isTrusted && e.target instanceof Element &&
        e.target.closest('a[data-yektanet-contact][href="tel:+989196017164"]')) send(contact);
  }
  function appInstalled(e) {
    if (e.isTrusted && !installed) { installed = true; send(install); }
  }
  function attach() { d.addEventListener('click', clicked); w.addEventListener('appinstalled', appInstalled); }
  function detach() { d.removeEventListener('click', clicked); w.removeEventListener('appinstalled', appInstalled); }
  w.addEventListener('pagehide', detach);
  w.addEventListener('pageshow', attach);
  attach();
  // The vendor drains yektanetManualTags after its DOM-ready initialization.
  !function (t, e, n) {
    t.yektanetAnalyticsObject = n, t[n] = t[n] || function () { t[n].q.push(arguments) }, t[n].q = t[n].q || [];
    var a = new Date, r = a.getFullYear().toString() + '0' + a.getMonth() + '0' + a.getDate() + '0' + a.getHours(),
        c = e.getElementsByTagName('script')[0], s = e.createElement('script');
    s.id = 'ua-script-WMkKzu6T'; s.dataset.analyticsobject = n;
    s.async = 1; s.type = 'text/javascript';
    s.nonce = d.currentScript?.nonce || '';
    s.src = 'https://cdn.yektanet.com/rg_woebegone/scripts_v3/WMkKzu6T/rg.complete.js?v=' + r;
    c.parentNode.insertBefore(s, c);
  }(w, d, 'yektanet');
  } catch (_) { /* A blocked advertising script must not prevent rendering. */ }
})();`;
