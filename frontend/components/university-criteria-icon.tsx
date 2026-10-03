export function UniversityCriteriaIcon({ index }: { index: number }) {
  return <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {index === 0 ? <><circle cx="24" cy="26" r="17" /><circle cx="24" cy="5" r="3" /><path d="M24 8v3M24 12v3M24 37v3M10 26h3M35 26h3m-8-6-4 8-8 4 4-8 8-4Z" /><path d="m30 20-8 4 4 4 4-8Z" fill="currentColor" /></>
      : index === 1 ? <><path d="M8 15 32 7c2-1 3 0 4 2l2 8M9 17h29a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H9a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4M41 25H31a5 5 0 0 0 0 10h10" /><circle cx="32" cy="30" r="1" /></>
      : index === 2 ? <><rect x="7" y="10" width="34" height="33" rx="4" /><path d="M7 21h34M15 5v11M33 5v11M15 28h2m7 0h2m7 0h2M15 35h2m7 0h2m7 0h2" /></>
      : <><path d="m8 20 16-9 16 9H8ZM10 41h28M6 44h36M14 24v13m10-13v13m10-13v13M24 11V3l8 3-8 3" /><path d="M5 38c-5-2-3-10 0-14 3 4 5 12 0 14Zm0 0v6M43 38c-5-2-3-10 0-14 3 4 5 12 0 14Zm0 0v6" /></>}
  </svg>;
}
