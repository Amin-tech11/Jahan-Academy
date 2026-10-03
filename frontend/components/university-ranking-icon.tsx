export function UniversityRankingIcon({ index }: { index: number }) {
  return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {index === 0 ? <>
      <circle cx="24" cy="24" r="18" />
      <ellipse cx="24" cy="24" rx="8" ry="18" />
      <path d="M6 24h36M10 13c8 5 20 5 28 0M10 35c8-5 20-5 28 0" />
    </> : index === 1 ? <>
      <path d="M8 40h32M11 34V23h6v11M21 34V16h6v18M31 34V8h6v26M10 15l12-7" />
      <path d="m16 7 6 1-2 6" />
    </> : <>
      <path d="M10 10h12c4 0 6 2 6 5v25c-2-3-4-4-8-4H10V10ZM28 15c0-3 2-5 6-5h6v26h-4c-4 0-6 1-8 4M15 17h7M15 23h7M15 29h7M33 17h3M33 23h3" />
    </>}
  </svg>;
}
