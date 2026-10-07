export function UniversityCriteriaIcon({ index }: { index: number }) {
  return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {index === 0 ? <>
      <circle cx="24" cy="24" r="18" fill="currentColor" fillOpacity=".05" />
      <path d="M24 10v3m0 22v3M10 24h3m22 0h3" />
      <path d="m31 17-4 10-10 4 4-10 10-4Z" fill="currentColor" fillOpacity=".12" />
      <path d="m31 17-10 4 6 6 4-10Z" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="1.5" fill="white" stroke="none" />
    </> : index === 1 ? <>
      <path d="M8 15 32 8a3 3 0 0 1 4 3v5" />
      <rect x="6" y="16" width="36" height="25" rx="5" fill="currentColor" fillOpacity=".05" />
      <path d="M42 24H32a5 5 0 0 0 0 10h10" fill="currentColor" fillOpacity=".1" />
      <circle cx="32" cy="29" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 21h10" />
    </> : index === 2 ? <>
      <rect x="7" y="10" width="34" height="32" rx="5" fill="currentColor" fillOpacity=".05" />
      <path d="M7 20h34M16 6v8M32 6v8" />
      <path d="M14 27h3m7 0h3m-13 7h3" />
      <path d="m25 34 4 4 7-9" strokeWidth="2.5" />
    </> : <>
      <path d="m5 18 19-11 19 11H5Z" fill="currentColor" fillOpacity=".1" />
      <path d="M8 22h32v15H8Z" fill="currentColor" fillOpacity=".04" />
      <path d="M15 22v15m9-15v15m9-15v15M5 42h38M8 37h32" />
      <circle cx="24" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </>}
  </svg>;
}
