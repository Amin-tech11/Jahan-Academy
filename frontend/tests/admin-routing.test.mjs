import assert from "node:assert/strict";
import test from "node:test";
import config from "../next.config.ts";

test("public forms and university data are bridged without exposing admin routes", async (t) => {
  const original = process.env.ADMIN_API_URL;
  t.after(() => { if (original === undefined) delete process.env.ADMIN_API_URL; else process.env.ADMIN_API_URL = original; });
  for (const base of ["http://localhost:8080", "http://localhost:8080/api/v1/"]) {
    process.env.ADMIN_API_URL = base;
    assert.deepEqual(await config.rewrites(), ["consultation-requests", "reference-data/:path*", "universities/:path*"].map(path => ({
      source: `/api/v1/${path}`,
      destination: `http://localhost:8080/api/v1/${path}`,
    })));
  }
});
