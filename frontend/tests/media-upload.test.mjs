import assert from "node:assert/strict";
import test from "node:test";
import { storageUploadRequest } from "../lib/media-upload.ts";
import { storageOrigin } from "../lib/storage-origin.ts";

test("signed POST form keeps all policy fields and puts file last without setting a boundary", () => {
  const file = new File(["pdf"], "guide.pdf", { type: "application/pdf" });
  const request = storageUploadRequest({ method: "POST", fields: { key: "fixed.pdf", policy: "signed", "Content-Type": "application/pdf" } }, file);
  assert.equal(request.method, "POST");
  assert.equal(request.credentials, "omit");
  assert.equal(request.headers, undefined);
  assert.deepEqual([...request.body.keys()], ["key", "policy", "Content-Type", "file"]);
  assert.equal(request.body.get("file").size, 3);
});
test("unbounded PUT and malformed form are not sent", () => {
  const file = new File(["x"], "x.pdf");
  for (const intent of [{ method: "PUT", fields: {} }, { method: "POST", fields: { file: "replace" } }, { method: "POST", fields: { key: 3 } }])
    assert.throws(() => storageUploadRequest(intent, file));
});
test("storage CSP allows only an exact trusted origin", () => {
  assert.equal(storageOrigin("https://files.example.com"), "https://files.example.com");
  assert.equal(storageOrigin("http://localhost:9100"), "http://localhost:9100");
  for (const origin of [undefined, "*", "https://*.example.com", "https://files.example.com/path", "https://user:secret@example.com", "https://example.com; connect-src *", "http://files.example.com"])
    assert.equal(storageOrigin(origin), "");
});
