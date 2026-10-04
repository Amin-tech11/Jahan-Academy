export function UniversityTypeIcon({ index }: { index: number }) {
  return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {index === 0 ? <>
      <path d="M6 18 24 8l18 10H6ZM8 39h32M5 43h38M11 22v13m9-13v13m8-13v13m9-13v13" />
      <circle cx="24" cy="14" r="1" />
    </> : index === 1 ? <>
      <path d="m5 15 19-8 19 8-19 8-19-8ZM12 19v10c7 6 17 6 24 0V19M43 15v13M10 40c5-3 9-3 14 0 5-3 9-3 14 0M24 34v6" />
    </> : <>
      <path d="m25 7 9 5-9 16-9-5 9-16ZM23 6l13 7M17 26l5 3M31 22a11 11 0 0 1-1 21H12M24 33H9M17 33v10M9 43h29" />
      <circle cx="33" cy="23" r="3" />
    </>}
  </svg>;
}
