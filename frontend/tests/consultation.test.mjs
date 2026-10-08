import assert from "node:assert/strict";
import { test } from "node:test";

import {
  consultationPayload, isValidEmail, latinDigits, normalizeMobile, sourcePageUrl, validateConsultation,
} from "../lib/consultation.ts";

const validFields = () => ({
  firstName: "  Sara ", lastName: " Ahmadi ", mobile: "۰۹۱۲ ۱۲۳ ۴۵۶۷",
  email: "", country: "Canada", intake: "fall", startYear: String(new Date().getUTCFullYear() + 1),
  age: "", gender: "prefer_not_to_say", occupation: "", maritalStatus: "",
  budgetRange: "", currency: "", message: "", privacyConsent: true, contactConsent: true,
});

test("email format accepts common providers and rejects malformed addresses", () => {
  for (const value of ["name@gmail.com", "first.last+study@example.co.uk", " name@example.com "]) {
    assert.equal(isValidEmail(value), true, value);
  }
  for (const value of ["", "name", "name@example", "name@@gmail.com", "first..last@gmail.com", ".name@gmail.com", "name.@gmail.com", "name@-gmail.com", "name@gmail..com", "name@ gmail.com", "name@exa_mple.com", "a".repeat(65) + "@gmail.com"]) {
    assert.equal(isValidEmail(value), false, value);
    assert.ok(validateConsultation({ ...validFields(), email: value || "invalid" }, "fa").errors.email);
  }
});

test("Iranian and international mobile numbers normalize without accepting invalid input", () => {
  assert.equal(latinDigits("۱۴۰۵ ١٢"), "1405 12");
  assert.equal(normalizeMobile("۰۹۱۲ ۱۲۳ ۴۵۶۷"), "+989121234567");
  assert.equal(normalizeMobile("0098 (912) 123-4567"), "+989121234567");
  assert.equal(normalizeMobile("+49 151 23456789"), "+4915123456789");
  assert.equal(normalizeMobile("+98 812 123 4567"), null);
  assert.equal(normalizeMobile("0912abc4567"), null);
});

test("validation requires consent and rejects invalid qualification values", () => {
  const fields = { ...validFields(), age: "17", budgetRange: "10k_20k", currency: "", privacyConsent: false, mobile: "123" };
  const result = validateConsultation(fields, "fa");
  assert.equal(result.mobile, null);
  assert.deepEqual(Object.keys(result.errors).sort(), ["age", "currency", "mobile", "privacyConsent"]);
  assert.deepEqual(validateConsultation(validFields(), "en").errors, {});
});

test("payload omits optional qualification details and keeps approved source context", () => {
  const fields = validFields();
  const payload = consultationPayload(fields, "fa", "/fa/universities/example", "+989121234567");
  assert.equal(payload.firstName, "Sara");
  assert.equal(payload.mobile, "+989121234567");
  assert.equal(payload.email, null);
  assert.equal(payload.investmentBudget, null);
  assert.deepEqual(payload.source, { pageUrl: "/fa/universities/example" });
  assert.equal(sourcePageUrl("fa", "university:example:footer"), "/fa/universities/example");
  assert.equal(sourcePageUrl("en", "program:secret"), "/en/consultation");
  assert.equal(sourcePageUrl("fa", "university:../admin"), "/fa/consultation");
});

test("selected budget is sent as a range with an ISO currency", () => {
  const fields = { ...validFields(), budgetRange: "10k_20k", currency: "EUR" };
  const payload = consultationPayload(fields, "en", "/en/consultation", "+989121234567");
  assert.deepEqual(payload.investmentBudget, { rangeCode: "10k_20k", currency: "EUR" });
});
