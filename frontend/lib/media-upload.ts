export function storageUploadRequest(intent: { method?: unknown; fields?: unknown }, file: File): RequestInit {
  if (intent.method !== "POST" || !intent.fields || typeof intent.fields !== "object" || Array.isArray(intent.fields))
    throw new Error("فرم امن بارگذاری معتبر نیست؛ دوباره تلاش کنید.");
  const form = new FormData();
  for (const [name, value] of Object.entries(intent.fields)) {
    if (typeof value !== "string" || name === "file") throw new Error("فرم بارگذاری معتبر نیست.");
    form.append(name, value);
  }
  form.append("file", file);
  return { method: "POST", body: form, credentials: "omit" };
}
