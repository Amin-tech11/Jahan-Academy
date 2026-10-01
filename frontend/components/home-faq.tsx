"use client";

import { useId, useState } from "react";

export function HomeFaq({ items }: { items: Array<{ question: string; answer: string }> }) {
  const [active, setActive] = useState<number | null>(null);
  const prefix = useId();
  return <div className="home-faq__list">{items.map((item, index) => {
    const open = active === index;
    const buttonId = `${prefix}-question-${index}`;
    const answerId = `${prefix}-answer-${index}`;
    return <div className="home-faq__item" data-open={open} key={item.question}>
      <h3 className="home-faq__question">
        <button type="button" id={buttonId} aria-expanded={open} aria-controls={answerId} onClick={() => setActive((current) => current === index ? null : index)}>
          <span className="home-faq__question-icon" aria-hidden="true">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 0 1 4.9.7c0 1.8-2.5 2-2.5 3.3" /><circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="home-faq__question-text">{item.question}</span>
          <svg className="home-faq__chevron" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </h3>
      <div className="home-faq__answer" id={answerId} role="region" aria-labelledby={buttonId} aria-hidden={!open} inert={!open}>
        <div className="home-faq__answer-inner"><p>{item.answer}</p></div>
      </div>
    </div>;
  })}</div>;
}
