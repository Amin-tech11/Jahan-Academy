export type ReauthOperation = { method: string; path: string };
type Handler = (operation: ReauthOperation) => Promise<string>;
let handler: Handler | undefined;
export function setReauthHandler(next: Handler) {
  handler = next;
  return () => { if (handler === next) handler = undefined; };
}
export function requestReauthentication(operation: ReauthOperation): Promise<string> {
  if (!handler) return Promise.reject(new Error("تأیید هویت آماده نیست؛ صفحه را تازه کنید."));
  return handler(operation);
}
