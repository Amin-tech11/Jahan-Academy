type AboutIconName = "conversation" | "clarity" | "expertise" | "people" | "support" | "growth" | "global" | "listen" | "route" | "prepare";

export function AboutIcon({ name }: { name: AboutIconName }) {
  const shapes = {
    conversation: <><path d="M21 11.5a2 2 0 0 1-2 2H9l-4 4V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" /><path d="M3 6H2a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12l4 2v-6M9 6h8M9 9.5h5" /></>,
    clarity: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 12h4M8 16l2 2 5-5" /></>,
    expertise: <><path d="m12 2 3 2 3.5.5.5 3.5 2 3-2 3-.5 3.5-3.5.5-3 2-3-2-3.5-.5L5 14l-2-3 2-3 .5-3.5L9 4l3-2Z" /><path d="m8 11 2.5 2.5L16 8" /></>,
    people: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2M3 6a3 3 0 0 0 0 6m18-6a3 3 0 0 1 0 6" /></>,
    support: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="m5 5 4 4m6 6 4 4M5 19l4-4m6-6 4-4" /></>,
    growth: <><path d="M12 22v-9M12 15C4 15 2 10 2 5c6 0 10 3 10 10ZM12 11c0-6 4-9 10-9 0 6-4 9-10 9Z" /></>,
    global: <><circle cx="12" cy="12" r="10" /><path d="m16.5 7.5-3 6-6 3 3-6 6-3Z" /></>,
    listen: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-4 2 1-5A8.5 8.5 0 1 1 21 11.5Z" /><path d="M7.5 10h9m-9 4h6" /></>,
    route: <><circle cx="6" cy="5" r="3" /><circle cx="18" cy="19" r="3" /><path d="M9 5h7a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h7" /></>,
    prepare: <><rect x="4" y="4" width="16" height="18" rx="2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="m8 14 3 3 5-6" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

export const valueIcons = ["clarity", "expertise", "people", "support", "growth", "global"] as const;
export const journeyIcons = ["listen", "route", "prepare"] as const;
