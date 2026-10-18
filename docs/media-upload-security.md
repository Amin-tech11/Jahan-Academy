# PDF inspection and bounded storage uploads

Target: develop, localhost:5000. No migration, push, PR, merge or deployment is needed.
Home-page source and assets are unchanged.

## PDF policy

The validator parses PDFs using locked pypdf 6.21.1 in strict mode. It follows the
reachable object graph, including indirect objects, escaped names and compressed
object streams, instead of matching raw byte substrings. It rejects JavaScript,
automatic/additional actions, external launch actions, embedded files, interactive
forms/XFA, multimedia and other unsafe action types. Ordinary static PDFs and explicit
HTTP(S) link annotations remain supported. Keywords in inert strings are not actions.
Security discriminators (`/Subtype`, `/S`, `/Type`) and URI values are resolved before
comparison, including chained references. Cyclic/excessive scalar references fail
closed. Traversal tracks action context separately so a shared object first visited
in a benign context cannot bypass later action checks.

Encrypted and malformed PDFs fail closed. Public file upload is for passive documents:
fillable and some digitally signed PDFs containing AcroForm must be exported as a
static PDF first. No PDF is rendered, executed or sent to an external inspection API.
The original inspected/scanned bytes are still what gets published; the earlier
quarantine replacement fix is preserved. ClamAV remains a separate defense.

PDF and image inspection run in disposable Python processes with a 10-second parent
timeout and hard 8-second CPU / 192 MiB memory limits. Linux uses resource limits;
Windows uses an enforced Job Object (committed process memory and user-mode CPU).
Failure to establish limits returns a retryable 503, never an unchecked publication.
PDF input remains capped at 25 MiB, with traversal/depth limits.

Images have a 15 MiB compressed-input cap and a 64 MiB decoded-raster budget, accounted
conservatively as four bytes per pixel (at most 16,777,216 pixels, or a stricter
configured pixel limit). JPEG, PNG and WebP remain supported; animated/multiframe
images are rejected. Large images that previously fit the 40-million-pixel declaration
limit may now need resizing. A static 4096x4096 PNG at the new raster budget is tested.
Decoder metadata/temporary allocations are additionally bounded by the worker's OS
memory limit. The API itself never opens or decodes image content with Pillow.

One admission slot per API process spans storage reads, inspection, scanning and
publication, before large buffers are read. Both file types share inspection capacity.
Busy requests return retryable 503 and roll back to pending. Cancellation waits for
outstanding native I/O/inspection to finish before releasing admission, so abandoned
requests cannot accumulate background buffers. Larger configured limits and legacy
intents cannot bypass input caps. Multiple API processes multiply the worker budget;
deployment memory must be sized accordingly. ClamAV and immutable-byte publication
remain in place. No migration, dependency change or automatic retry of mutations is
introduced.

## Storage policy and panel

New intents return `method: POST`, `uploadUrl` and signed `fields`, not a presigned
unbounded PUT. The storage policy binds the random object key, Content-Type and exact
declared file size using `content-length-range`. The declaration must first fit the
existing per-purpose server limit. The panel sends every signed field unchanged and
the file last in FormData, omits credentials, and lets the browser set the multipart
boundary. A failed storage response is never confirmed. The API still checks stored
size, actual content, checksum, owner, expiry and malware scan before publishing.

`maxSizeBytes` now reports the exact size authorized by that intent. There is no PUT
fallback. Previously issued PUT links, if any, are not retroactively revoked and must
expire before the old path is considered retired. This is a per-file cap, not a new
aggregate storage quota or a cleanup policy for abandoned intents.

The admin-only CSP admits one configured `ADMIN_STORAGE_ORIGIN`. Its value is validated
as an exact HTTPS origin (HTTP is allowed only for explicit loopback development);
wildcards, paths, userinfo and injected CSP fragments are rejected. Public-page CSP is
unchanged. The local ignored frontend .env.local adds http://localhost:9100 to match
the existing preview storage endpoint. S3 deployments must allow POST CORS responses
for the trusted panel origin; no bucket is made public or writable anonymously.

The existing local storage service is Moto, an emulator. Security evidence for S3
policy enforcement comes from a separate real MinIO test container, not that emulator.
CI now starts the same isolated policy-test service. Existing services/data are not
replaced. New dependencies are recorded in pyproject.toml and uv.lock; only pypdf was
added. The local API runtime was given that exact dependency for preview verification.

## Verification

Tests cover escaped PDF names, compressed object-stream actions, malformed/encrypted
documents, traversal limits, worker timeout, passive documents, inert keyword text and
safe links. Real MinIO tests reject undersize, oversize, altered type/key/policy and
unsigned writes, and accept the exact size. A complete API/database/real-storage flow
publishes a passive PDF and rejects an active one before it reaches the public bucket.
That focused flow uses a synthetic authorized actor and a disabled malware scanner to
isolate the new PDF policy; it does not claim an antivirus end-to-end test.

The 2026-10-18 regression tests cover indirect annotation/action discriminators,
shared-object action context, safe indirect links, image decoding outside the API,
large-raster rejection, malformed images, timeout, unavailable isolation, memory-cap
enforcement, concurrent admission, cancellation and retry after a scanner failure.
The real-MinIO publication test now also rejects the indirect 3D annotation fixture.
Native allocation probes deny 256 MiB under the 192 MiB cap on both Windows and Linux;
the Linux probe uses a disposable network-isolated container and accepts a legitimate
4096x4096 PNG. These are bounded regression probes, not a production load test or a
claim that every decoder/parser vulnerability has been eliminated.

Final local results: 224 backend unit/architecture/contract tests, 49 full integration
tests, 218 frontend Node tests and nine browser tests passed. The three focused media
integration tests passed again after the final legacy-input guards. Ruff, formatting,
mypy, TypeScript and the production build passed. Browser coverage on localhost:5000
includes multipart upload, mandatory MFA, step-up, password policy and both home-page
locales (hydration, accessibility, metadata and keyboard navigation). Panel browser
journeys mock API responses; database/real-storage inspection is covered separately
by integration tests. No real-user account or production database was changed.
Only the dedicated local develop API was restarted to load the changes. Disposable
test services are removed afterward. Remote CI, push, merge and deployment were not run.

The aggregate upload-quota/abandoned-object cleanup and managed Sheets snapshot
retention fixes are documented in [media-sheets-retention.md](media-sheets-retention.md).
That document also describes the separate limits concerning Google revision history
and independently copied/exported data.

References: [S3 POST policy generation](https://docs.aws.amazon.com/boto3/latest/reference/services/s3/client/generate_presigned_post.html),
[pypdf release](https://pypi.org/project/pypdf/6.21.1/).
Resource references: [Windows Job Object limits](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_extended_limit_information),
[Pillow security guidance](https://pillow.readthedocs.io/en/stable/handbook/security.html).
