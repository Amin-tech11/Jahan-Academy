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

Encrypted and malformed PDFs fail closed. Public file upload is for passive documents:
fillable and some digitally signed PDFs containing AcroForm must be exported as a
static PDF first. No PDF is rendered, executed or sent to an external inspection API.
The original inspected/scanned bytes are still what gets published; the earlier
quarantine replacement fix is preserved. ClamAV remains a separate defense.

Inspection runs in a separate Python process, with a 10-second parent timeout, 25 MiB
input cap, traversal/depth limits, and one worker slot per API process. On Linux the
worker additionally has hard 8-second CPU and 192 MiB address-space limits. Windows
uses the parent timeout and input/traversal/worker-slot limits. Failure, timeout or an
unavailable parser never publishes the file. Validation runs off the API event loop.
If the single worker slot is busy, the API returns a retryable 503 and leaves the intent
pending rather than permanently rejecting an otherwise valid document.

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

Local backend suite: 201 unit/architecture/contract tests passed. Full integration suite:
49 passed. Frontend Node suite: 218 passed. Ruff, formatting, mypy, TypeScript and
the production build passed. Seven panel browser tests passed on localhost:5000,
including signed multipart upload, MFA, step-up and password-policy journeys.
Both Persian and English home-page browser checks also passed, including hydration,
metadata, keyboard navigation and accessibility (nine browser tests in total).
The latest isolated Linux worker also accepted a passive PDF under its 192 MiB cap.
Remote CI has not been run.

References: [S3 POST policy generation](https://docs.aws.amazon.com/boto3/latest/reference/services/s3/client/generate_presigned_post.html),
[pypdf release](https://pypi.org/project/pypdf/6.21.1/).
