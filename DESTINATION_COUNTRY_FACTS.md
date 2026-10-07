# Destination overview country facts

Reviewed 7 October 2026 for `destinationS:3800`.

The user explicitly requested country-level living costs, annual tuition, student work and post-study stay for all ten overview countries. These are editorial national estimates, not University record fields, admission requirements or a public Program catalogue. `PROJECT_CONTEXT.md` FR-UNI-006 remains unchanged; no shared university/API/permission/schema changes are required.

Each fact in `frontend/lib/destination-country-facts.ts` carries its primary-source URL and bilingual scope note, displayed beside the figure. Living costs and tuition are distinct. Currencies are named explicitly; no exchange-rate conversion is used. Post-study stays are conditional temporary permits, not permanent residence.

Source families: DAAD and Make it in Germany; EduCanada and IRCC; British Council Study UK and GOV.UK; European Commission and EU Immigration Portal; Study in NL and IND; Study Australia; European Commission and Swedish Migration Agency; Study in Finland and Migri; Study in Denmark and SIRI; Education New Zealand and Immigration New Zealand.

Editorial calculations:

- Canada monthly budget is the official suggested CAD 23,000 annual budget divided by 12, rounded to CAD 1,917. Undergraduate and graduate tuition values are national averages, not minimum fees.
- Denmark monthly DKK 8,450–13,700 sums the minimum/maximum items in the official sample budget; additional expenses are excluded. Tuition is published by the source in EUR.
- New Zealand NZD 1,500–2,250 monthly divides the official page's city-dependent annual living examples of NZD 18,000–27,000 by 12. The tuition page identifies its undergraduate figures as March 2025 estimates.
- Sweden uses the published average tuition rather than repeating an apparent extra-zero typo in the European Commission's range. Work limits use the newer migration authority rule: 15 hours during semesters for permits granted from 11 June 2026, with exceptions linked.
- Australia has no national cost range on its current official cost page. Both cost fields state the relevant variation rather than inventing amounts or treating visa funding requirements as living costs.
- UK Graduate visa is two years for applications before 1 January 2027 and 18 months thereafter; doctorates differ.

Validation: all-country/four-field bilingual source coverage test; existing public-catalog scope tests retain the ban on courses/programs, deadlines and admission details while allowing the specifically requested national tuition summary. TypeScript and all frontend unit tests; refreshed Persian/English localhost responses checked for ten cards, forty facts and removed selectors/CTA/intro. No new data API, authentication or permissions design applies to static public editorial content. Links use HTTPS and safe new-tab attributes.
