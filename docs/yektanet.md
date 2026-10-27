# Yektanet — Jahan Academy

Account: `WMkKzu6T`. The supplied account loader lives in `frontend/lib/yektanet.ts`, rendered as an ordinary inline script at the start of `PublicDocument`'s head with the request nonce. This project has separate public/admin root layouts, not a single `app/layout.tsx`. Admin does not render it. No GTM container or earlier Yektanet installation was found in source or production HTML on 2026-10-25.

Only `jahanacademi.ir` and `www.jahanacademi.ir` public `/fa` and `/en` routes are enabled. Unknown query strings, fragments and sensitive referrers suppress tracking. The existing fixed `source` values for consultation links are allowed. Navigating from a tracked document across that boundary uses a full document navigation so the vendor cannot keep tracking the excluded URL. Consequently advertising URLs with arbitrary campaign query parameters are intentionally not measured until their non-personal parameters can be explicitly reviewed/allowed. Do not relax this by allowing arbitrary query values.

The vendor already instruments SPA history and drains `yektanetManualTags` after initialization. Do not add manual page views or a second queue drain. A document guard prevents duplicate loaders/listeners. Contact events count trusted clicks on the footer's primary telephone link (`+989196017164`), not connected calls or sales. Only tag IDs are passed:

- CONTACT: `c60b290c-8026-4396-b1e4-0b81a27e4384`
- INSTALL: `62d791d1-09f0-4f37-a519-955f7c8b8fea`, only a trusted `appinstalled`, once per document; listeners clean up on pagehide and restore on pageshow.
- SIGNUP: `ace26736-92d7-43aa-886a-1b62d9d48f14` is **not emitted**: this site has no public account-creation flow. Consultation submissions and administrator login are not signups.

There is currently no installable public PWA flow; INSTALL is dormant unless a browser actually reports installation. Safari does not provide equivalent `appinstalled` coverage. No native-app installation claims are made.

The retrieved vendor configuration has manual CONTACT/SIGNUP/INSTALL tags (no CSS duplicate), `capture_clicks: false` and `submit_form_data: false`. Keep these settings; future dashboard changes can alter vendor behavior without a code release. Do not enable form-data capture. The delivered vendor bundle internally uses application ID `7rvWJttr`, while its tags identify account `WMkKzu6T`; the installed URL and account remain exactly as supplied, not another site's ID.

CSP keeps the nonce/strict-dynamic policy. Public-only additions: `ua.yektanet.com` for collection/pixel fallback, `event.yektanet.com` for vendor metrics, `audience.yektanet.com` for preview validation, `cdn.yektanet.com` for the fingerprint iframe, and `plus.sabavision.com` for the vendor's cookie-match pixel. No wildcard domain or unsafe-inline script permission was added. Trusted loader descendants are covered by strict-dynamic.

Validation: unit tests exercise domain/privacy gates, duplicate load, contact queue/error isolation, true install vs cancelled/synthetic events, listener lifecycle and private navigation. Browser tests check the real local head/admin boundary and a production-origin simulation with **all vendor traffic intercepted**. A separately retrieved real vendor bundle was exercised with intercepted collection, including its event API and current CSP. These are not proof of production delivery.

Release checklist: green CI, authorized merge to main, deploy exact main SHA with rollback; verify the real CDN response and single load, public navigation and CSP, then verify tag `035c6381-3612-4c0e-a2a9-0940d98c0a79` (all visitors) in Yektanet. Report code, deployment, actual browser loading and dashboard receipt separately. Never count local/simulated testing as dashboard verification.
