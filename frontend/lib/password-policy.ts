export const passwordPolicyHint = "۱۵ تا ۱۲۸ کاراکتر؛ یک عبارت طولانی و منحصربه‌فرد انتخاب کنید. فاصله و حروف فارسی مجازند و ترکیب اجباری وجود ندارد.";

export function newPasswordError(password: string): string {
  const length = Array.from(password).length;
  return length < 15 || length > 128
    ? "رمز جدید باید بین ۱۵ و ۱۲۸ کاراکتر باشد."
    : "";
}
