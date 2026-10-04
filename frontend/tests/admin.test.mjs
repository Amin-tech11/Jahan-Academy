import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  adminRequest,
  clearAdminSession,
  acceptAdminSession,
  restoreAdminSession,
  totalOf,
} from "../lib/admin-api.ts";
import {
  resources,
  formData,
  normalizeRecord,
  writePayload,
  setValue,
} from "../lib/admin-resources.ts";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  clearAdminSession();
});
const resource = (id) => resources.find((item) => item.id === id);

test("own panel access is fetched through the authenticated no-store proxy", async () => {
  acceptAdminSession({ accessToken: "test-access" });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/admin/api/users/me/panel-access");
    assert.equal(options.headers.Authorization, "Bearer test-access");
    assert.equal(options.cache, "no-store");
    return Response.json({ data: { sections: [], isSuperAdmin: false } });
  };
  assert.deepEqual((await adminRequest("/users/me/panel-access")).data.sections, []);
});

test("section access replacement sends an empty list and version for revocation", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/admin/api/admin/staff/test-id/panel-access");
    assert.equal(options.method, "PUT");
    assert.equal(options.headers["If-Match"], '"7"');
    assert.deepEqual(JSON.parse(options.body), { sections: [] });
    return Response.json({ data: { sections: [], version: 8 } });
  };
  await adminRequest("/admin/staff/test-id/panel-access", "PUT", { sections: [] }, 7);
});

test("admin update carries bearer and optimistic concurrency without persisting credentials", async () => {
  acceptAdminSession({ accessToken: "test-only-token" });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/admin/api/admin/leads/abc");
    assert.equal(options.headers.Authorization, "Bearer test-only-token");
    assert.equal(options.headers["If-Match"], '"4"');
    assert.equal(options.cache, "no-store");
    assert.deepEqual(JSON.parse(options.body), { firstName: "Test" });
    return Response.json({ data: { version: 5 } });
  };
  await adminRequest("/admin/leads/abc", "PATCH", { firstName: "Test" }, 4);
});
test("refresh is coalesced so React strict mode cannot rotate a refresh token twice", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ data: { accessToken: "test-refreshed" } });
  };
  await Promise.all([restoreAdminSession(), restoreAdminSession()]);
  assert.equal(calls, 1);
});
test("forbidden and stale writes remain errors, not false successful saves", async () => {
  for (const status of [403, 409, 412, 422, 502]) {
    globalThis.fetch = async () =>
      Response.json({ error: { message: "Rejected" } }, { status });
    await assert.rejects(
      adminRequest("/admin/leads/a", "PATCH", {}, 1),
      (error) => error.status === status,
    );
  }
});
test("expired access token refreshes once and retries the protected read", async () => {
  let reads = 0;
  let refreshes = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith("/auth/refresh")) {
      refreshes++;
      return Response.json({ data: { accessToken: "renewed" } });
    }
    reads++;
    return reads === 1
      ? Response.json({}, { status: 401 })
      : Response.json({ data: [] });
  };
  assert.deepEqual(await adminRequest("/admin/leads"), { data: [] });
  assert.equal(reads, 2);
  assert.equal(refreshes, 1);
});
test("paths cannot address other hosts or escape the administrative namespace", async () => {
  for (const path of [
    "//example.com",
    "/admin/../auth/register",
    "/consultation-requests",
  ])
    await assert.rejects(adminRequest(path));
});
test("program replacement preserves relation IDs and structured requirements", () => {
  const input = {
    university: { id: "u" },
    academicLevel: { id: "a" },
    primaryField: { id: "f" },
    fields: [{ id: "f" }],
    intakes: [
      {
        id: "row",
        intake: { id: "i" },
        year: 2027,
        applicationDeadline: "2027-01-01",
        status: "open",
      },
    ],
    requirements: [
      {
        id: "r",
        requirementType: "language",
        required: true,
        value: { minimum: 6.5 },
      },
    ],
    tuition: { mode: "contact" },
    applicationFee: { mode: "free" },
  };
  const r = resource("programs");
  const body = writePayload(
    r,
    formData(r.fields, normalizeRecord(input)),
    input,
    false,
  );
  assert.equal(body.universityId, "u");
  assert.deepEqual(body.fieldIds, ["f"]);
  assert.equal(body.intakes[0].intakeId, "i");
  assert.equal(body.intakes[0].id, undefined);
  assert.deepEqual(body.requirements[0].value, { minimum: 6.5 });
  assert.deepEqual(body.applicationFee, { mode: "free" });
});
test("article replacement preserves categories tags author and bilingual SEO", () => {
  const input = {
    author: { id: "a" },
    categories: [{ id: "c" }],
    tags: [{ id: "t" }],
    translations: {
      fa: { title: "عنوان", body: "متن", seoTitle: "سئو" },
      en: { title: "Title", body: "Body", seoTitle: "SEO" },
    },
  };
  const r = resource("articles");
  const body = writePayload(
    r,
    formData(r.fields, normalizeRecord(input)),
    input,
    false,
  );
  assert.equal(body.authorId, "a");
  assert.deepEqual(body.categoryIds, ["c"]);
  assert.deepEqual(body.tagIds, ["t"]);
  assert.equal(body.translations.en.seoTitle, "SEO");
});
test("changing tuition to contact removes incompatible stale amounts", () => {
  const r = resource("programs");
  const data = {
    tuition: {
      mode: "contact",
      minimumMinor: 100,
      maximumMinor: 200,
      currency: "USD",
    },
  };
  assert.deepEqual(writePayload(r, data, {}, false).tuition, {
    mode: "contact",
  });
});
test("optional PATCH fields can be cleared and references use their distinct pagination contract", () => {
  const r = resource("leads");
  const body = writePayload(r, { firstName: "Test", email: "" }, {}, false);
  assert.equal(body.email, null);
  assert.equal(totalOf({ total: 45 }), 45);
  assert.equal(totalOf({ meta: { total: 62 } }), 62);
});
test("nested edits do not mutate source data and audit has no mutation controls", () => {
  const input = { translations: { fa: { title: "original" } } };
  const next = setValue(input, "translations.fa.title", "changed");
  assert.equal(input.translations.fa.title, "original");
  assert.equal(next.translations.fa.title, "changed");
  assert.equal(resource("audit").readOnly, true);
  assert.equal(resource("categories").path, "/admin/content/category");
});
