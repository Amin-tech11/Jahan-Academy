type LoginConfiguration = {
  environment?: string;
  username?: string;
  email?: string;
};

/** Development aliases only resolve an identity; the backend still checks its password. */
export function loginPayload(
  input: unknown,
  configuration: LoginConfiguration,
) {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  if (typeof body.username !== "string" || typeof body.password !== "string")
    return null;
  const username = body.username.trim();
  if (
    !username ||
    username.length > 320 ||
    !body.password ||
    Array.from(body.password).length > 128
  )
    return null;
  const localAlias =
    configuration.environment === "development" &&
    configuration.username &&
    configuration.email &&
    username.toLowerCase() === configuration.username.toLowerCase();
  const email = localAlias
    ? configuration.email
    : username.includes("@")
      ? username
      : null;
  if (body.mfaCode != null && (typeof body.mfaCode !== "string" || body.mfaCode.length > 64)) return null;
  const identity = email ? { email } : /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(username) ? { username } : null;
  return identity ? { ...identity, password: body.password, ...(body.mfaCode ? { mfaCode: body.mfaCode } : {}) } : null;
}
