type Feature = "consultation" | "pathway" | "documents" | "support";

/** Original, two-tone illustrations for the homepage's four service promises. */
export function HomeFeatureIcon({ kind }: { kind: Feature }) {
  return <svg className="home-start__feature-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="3" y="3" width="58" height="58" rx="19" fill="#eff4fb" stroke="none" />
    {kind === "consultation" && <>
      <path d="M15 31v-5a17 17 0 0 1 34 0v5" />
      <path d="M15 29h3v14h-3a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4ZM49 29h-3v14h3a4 4 0 0 0 4-4v-6a4 4 0 0 0-4-4Z" fill="#c9d9ee" />
      <path d="M49 43v3a6 6 0 0 1-6 6h-8" />
      <rect x="29" y="49" width="9" height="5" rx="2.5" fill="currentColor" stroke="none" />
      <path d="M25 23h14a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-7l-7 5v-5a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4Z" fill="white" />
      <path d="M27 29h10M27 34h6" />
    </>}
    {kind === "pathway" && <>
      <path d="M16 48h13a7 7 0 0 0 0-14h-3a7 7 0 0 1 0-14h8" strokeDasharray="3 4" />
      <circle cx="16" cy="48" r="4" fill="#c9d9ee" />
      <path d="m28 17 15-7 15 7-15 7-15-7Z" fill="white" />
      <path d="M34 21v7c5 3 13 3 18 0v-7M58 17v11" />
      <circle cx="43" cy="44" r="12" fill="white" />
      <path d="m48 39-3 8-7 2 3-8 7-2Z" fill="#c9d9ee" />
      <path d="M43 32v3M55 44h-3M43 56v-3M31 44h3" />
    </>}
    {kind === "documents" && <>
      <rect x="13" y="15" width="29" height="38" rx="4" fill="#c9d9ee" />
      <path d="M23 10h17l9 9v25a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Z" fill="white" />
      <path d="M40 10v9h9M32 26h10M32 34h7M24 25l2 2 3-4M24 33l2 2 3-4" />
      <circle cx="46" cy="46" r="11" fill="currentColor" stroke="none" />
      <path d="m41 46 3 3 7-7" stroke="white" strokeWidth="2.2" />
    </>}
    {kind === "support" && <>
      <circle cx="24" cy="21" r="6" fill="white" />
      <path d="M11 45v-5a13 13 0 0 1 26 0v5H11Z" fill="white" />
      <path d="M37 15a6 6 0 0 1 0 12M41 31a11 11 0 0 1 11 11" />
      <path d="m44 32 12 4v8c0 7-6 11-12 14-6-3-12-7-12-14v-8l12-4Z" fill="#c9d9ee" />
      <path d="m39 44 4 4 7-8" strokeWidth="2.2" />
    </>}
  </svg>;
}
