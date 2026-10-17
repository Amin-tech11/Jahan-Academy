# University discipline source review — 2026-10-17

The existing card displays the three largest named population groups plus Other. Shares are enrolment distributions, not academic rankings or admission odds. This update changes only static data and its validation; no API, database, permissions or component changes are needed.

## Added

### Laval

Sources: [registrar workbook](https://www.reg.ulaval.ca/system/files/public/accueil/Profil-ULaval-public.xlsx), [registrar website](https://www.reg.ulaval.ca/), [all-programme profile](https://www.reg.ulaval.ca/system/files/public/accueil/Profil-tous-cycle.pdf).

In `Donnees`, filter `Code_session=202609` and sum `Nb_ins_tous_automne` by `Nom_faculte_responsable` across sexes, cycles and programme types. Workbook observed 28 September 2026. Administrative sciences: 10,650; science and engineering: 8,550; social sciences: 6,996; other 17 units: 27,600. Total 53,796 agrees with the profile PDF.

The workbook defines programme registrations: one person in several programmes can count several times. The displayed basis explicitly states this. Do not combine sessions or use distinct-person headcounts as denominator.

### Catholic University of the Sacred Heart

[Bilancio di missione 2024](https://www.unicatt.it/content/dam/siti-web/unicatt/it/ateneo/bilancio-missione/Bilancio%20di%20missione%202024%20ITA.pdf#page=25), printed p.45 / PDF p.25, table `Gli iscritti per facoltà nell’anno accademico 23/24`.

Sum campuses within the 12 faculties. Faculty-table sum: 42,416; economics: 9,401; education: 5,770; medicine and surgery: 5,543. Original table visually checked, including single-cycle medicine in the first-cycle column.

Use this faculty-table sum as denominator. The adjacent course-type summary is not identical; do not infer a reconciliation or normalize to a different total. Excludes post-laurea masters, doctorates and specialist schools. The card specifies first- and second-cycle enrolments by faculty.

### Polytechnic University of Turin

[Bilancio di genere 2023](https://www.polito.it/sites/default/files/2024-01/BDG_2023_DEF.pdf#page=21), printed pp.20–22, figures 3.1.2 A/B. Historical academic year 2021/22; university extraction date 31 December 2022. Historical year is explicit on the card.

Combine matching 15 teaching-college counts: bachelor 21,298 plus master 14,449 = 35,747. Mechanical/aerospace/automotive: 8,117; computer/cinema/mechatronics: 6,276; management/production: 4,270. Use numeric enrolment counts, not the charts' gender percentages. The original charts were rendered and visually checked: text extraction places some labels out of order.

## Reviewed without adding shares

The following records retain the verified-statistics-unavailable message. This means no sufficient distribution was obtained in this review, not that no such data exists.

| University | Official sources inspected | Limitation |
|---|---|---|
| Adelaide | [2026 profile](https://adelaide.edu.au/study/how-to-apply/admissions-student-profile/), [Australian Government preliminary statistics](https://www.education.gov.au/higher-education-statistics/preliminary-trends-higher-education) | New university started in 2026. Profile groups applicant backgrounds; government warns of substantially underreported domestic enrolments. No verified complete discipline distribution for the new institution. Do not assign predecessor statistics. |
| Technical University of Denmark | [Education figures](https://www.dtu.dk/english/about/facts-and-figures/education), [2025 intake announcement](https://www.dtu.dk/newsarchive/2025/07/flot-optag-paa-dtus-uddannelser) | Accessible tables split degree levels. Indexed board-report PDF URLs containing programme intake tables returned 403/404. Cached snippets were not used as a published distribution. |
| Cardiff | [Facts](https://www.cardiff.ac.uk/about/facts-and-figures), [2024/25 equality report](https://www.cardiff.ac.uk/__data/assets/pdf_file/0004/3034084/SEP-Annual-Monitoring-Report-2024-2025.pdf), [HESA table 49](https://www.hesa.ac.uk/data-and-analysis/students/table-49) | Obtained totals/demographics, not a complete discipline-enrolment table. HESA access blocked. Staff college shares cannot stand for student shares. |
| Durham | [About](https://dur.ac.uk/about-us/), [admissions statistics](https://dur.ac.uk/study/undergraduate/how-to-apply/undergraduate-admissions-statistics/), [HESA](https://www.hesa.ac.uk/data-and-analysis/students/table-49) | Departmental table covers applications/offers, not enrolled students. HESA access blocked. |
| Tampere | [2025 review](https://www.tuni.fi/en/tau/about-tampere-university/operations-and-finances/annual-review-2025), [2024 report](https://content-webapi.tuni.fi/proxy/public/2025-06/tampere-university-foundation-sr-annual-report-and-financial-statements-2024.pdf), Statistics Finland table 136b | Current discipline chart has no exact labels. National statistics API returned 400. No counts estimated from bar heights. Old faculty table inspected contains inconsistent subtotals. |
| Massey | [2024 annual report](https://www.massey.ac.nz/documents/2174/Massey_University_Annual_Report_2024.pdf), [student facts](https://www.massey.ac.nz/about/student-facts-and-figures/) | Accessible distributions cover campus, demographics, degree levels and citizenship. No complete discipline denominator verified. Campus counts overlap; rankings and a single course count are unsuitable. |
