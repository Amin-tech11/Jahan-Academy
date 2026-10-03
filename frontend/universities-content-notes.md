# University guide content

## Palette update — 2026-10-03

- Scoped university theme uses the requested seven colors. Visual hierarchy follows approximately 60% neutral canvas, 30% white surfaces and 10% blue brand accents; the approved hero photo is excluded from this color allocation.
- Main text is #202833; secondary text #66717F; borders #D6DCE4; silver #AEB7C2 is reserved for decorative outlines, not text.
- No API or permission design applies to this CSS-only visual change. TypeScript and diff checks passed; refreshed localhost:3400 and visually checked cards and computed brand/text colors.
- No new unit tests are needed for reversible palette styling; publication and CI remain pending as described below.

Reviewed on 2026-10-01 for `universities-page:3400`.

## Editorial basis

- Reference structure: https://go2tr.com/university (university types, rankings, countries, Iranian universities, college comparison and FAQs).
- Persian and English copy is original to Jahan Academy. The country directory contains one illustrative institution per destination, rather than claiming to be a complete list or a ranking.
- Ranking descriptions use official QS, THE and ARWU sources linked on the page. Numerical ranking tables from the reference were not reproduced; its QS tables use an older edition.
- EducationUSA provides supporting guidance for institution types, US college terminology and choosing institutions.

## Scope and verification

- Static editorial content: no new API, database or permission design is needed.
- The university listing uses the new guide; university detail pages retain their existing implementation.
- TypeScript checking and all 14 existing unit tests passed. No new unit tests were added for static prose.
- Refreshed the Persian page on localhost:3400; checked 384px and 1440px viewports, seven sections, no document overflow, and FAQ expansion.
- Reviewed outbound links, semantic headings, table headers and native disclosure controls. External links use HTTPS and `rel="noreferrer"`.
- Push, pull request and CI verification remain pending: an earlier push was rejected by automatic approval review for lack of explicit publication authorization.
