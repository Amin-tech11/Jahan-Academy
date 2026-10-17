import type { Locale } from "@/lib/site-content";

function ConsultationFreeText({ text, locale }: { text: string; locale: Locale }) {
  const word = locale === "fa" ? "رایگان" : "free";
  const index = text.indexOf(word);
  if (index < 0) return text;
  return <>{text.slice(0, index)}<strong className="consultation-free-word">{word}</strong>{text.slice(index + word.length)}</>;
}

export function ConsultationFormHeading({ locale, level = "h3" }: { locale: Locale; level?: "h2" | "h3" }) {
  const Heading = level;
  const title = locale === "fa" ? "درخواست مشاوره تخصصی رایگان" : "Request a free expert consultation";
  const description = locale === "fa"
    ? "اطلاعات کوتاه زیر را بنویسید تا برای هماهنگی مشاوره با شما تماس بگیریم."
    : "Share a few details so we can contact you to arrange your consultation.";

  return <div className="consultation-form-heading">
    <Heading><ConsultationFreeText text={title} locale={locale} /></Heading>
    <p>{description}</p>
  </div>;
}
