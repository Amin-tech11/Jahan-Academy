"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="recovery-page"><p className="eyebrow">JAHAN ACADEMY</p><h1>مشکلی پیش آمد.</h1><p>We could not load this page. Please try again.</p><button className="button button-primary" onClick={reset} type="button">تلاش دوباره</button></main>; }
