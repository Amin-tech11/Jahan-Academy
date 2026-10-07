# University profile data audit — 2026-10-04

Panel: `university-info:3600`. The 33 additional catalog/public profiles use `frontend/lib/university-info-facts.json`; Western remains the reference record. All 33 now have a localized city, street/campus address, foundation year and institution type. Canadian records additionally have a DLI. An address identifies the named central campus/building, not every teaching location.

## Discipline distributions

`frontend/lib/university-info-statistics.json` is the auditable source ledger: each of its 23 records retains the source URL, observation year, population description in both languages, original category counts and, where necessary, the published denominator and supporting sources. These are statistical shares, not subject rankings or admission probabilities. They must not be compared across universities as if the populations were identical.

The renderer sorts named categories by count, displays the largest three, and aggregates the remaining categories into Other. Percentages are rounded independently to one decimal; totals can differ slightly from 100%. Published rounded FTE totals may differ by one from the sum of rounded rows. KTH's published percentage weights are retained. Western's supplied 34/25/14/26 distribution is preserved without normalization.

Important scope qualifications, also shown beneath the charts:

- Australian National University and Curtin: Australian government 2024 Table 4.6 student load (EFTSL), not headcount.
- Chalmers: teaching load by department; the Chalmers share is used for joint departments.
- Delft, Eindhoven and Erasmus: DUO 2025 registrations, which can include secondary registrations. Suppressed cells (`<5`) are excluded from both numerator and denominator, so results are approximate shares of disclosed registrations.
- Toronto: 2024/25 undergraduate fall FTE from Schedule 3a; Arts and Science spans three campuses; the source classifies medical residents within the medical total.
- Charité: 2024 new entrants only, not its complete student population.
- Tübingen: main-subject registrations, not unique people.
- KTH: 2024 government-funded FTE; fee-paying students excluded.
- Aalto: 2025 total degree students minus the documented Business and Arts counts gives Technology; all three supporting sources are retained.
- Otago: the 2024 column of the rolling Quick Statistics table, not its newer 2025 column.

## Unresolved distributions

Ten profiles intentionally contain no percentage data. Their cards retain the university-specific Top disciplines heading and show an explicit unavailable-data message. A list of field names is not substituted for a distribution.

| University | Research limitation |
| --- | --- |
| Laval | Official 2025 indicators give totals and faculty bars without sufficient numeric labels; no percentages inferred from image dimensions. |
| Adelaide University | Newly merged institution began teaching in 2026; predecessor statistics do not represent the new university. |
| Catholic University of the Sacred Heart | MUR's university/subject CSV could not be retrieved; questionnaire response counts were rejected as student population data. |
| Polytechnic University of Turin | Official 2025/26 totals and level counts do not give a subject distribution; MUR CSV inaccessible. |
| University of Bologna | Reviewed sustainability/gender reports did not provide a complete usable category denominator; within-subject gender percentages are not subject shares. |
| Technical University of Denmark | Reviewed official key figures provide degree-level totals, not a complete discipline distribution. |
| Cardiff | HESA Table 49 download inaccessible; campus-specific ApplyBoard figures do not establish whole-institution shares. |
| Durham | HESA download and institution statistics inaccessible; a foundation study centre is not the whole university. |
| Tampere | Official annual totals insufficient; statistics API retrieval failed. |
| Massey | Official student facts and annual report provide totals/demographics/campuses, not a verified complete college distribution. |

Relevant follow-up sources: [MUR university/subject registrations](https://dati-ustat.mur.gov.it/dataset/iscritti), [HESA Table 49](https://www.hesa.ac.uk/data-and-analysis/students/table-49), [Laval indicators](https://www.ulaval.ca/sites/default/files/notre-universite/direction-gouv/Documents_officiels/Rapports/Indicateurs_reperes_2025.pdf), [Massey student statistics](https://www.massey.ac.nz/about/student-facts-and-figures/).

## Institution fact sources

Existing campus/identity sources remain in each record of `university-info-profiles.ts`. Additional official checks used for the facts and historical distinctions:

- Canada: [IRCC DLI list](https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/preparer/liste-etablissements-enseignement-designes.html?wbdisable=true); [Toronto study permit/DLI](https://internationalexperience.utoronto.ca/international-student-services/immigration/studying-in-canada/apply-for-your-study-permit). Dalhousie, Laval, McGill and Toronto institutional history/contact pages supplement their existing campus sources.
- Germany: [Charité facts](https://www.charite.de/en/charite/about_us/facts_figures/), Braunschweig's official statistical report, Tübingen's official statistics and TUM's official institutional presentation (linked in the statistics ledger), alongside existing campus sources.
- Australia: [ANU corporate plan](https://www.anu.edu.au/about/strategic-planning/anu-corporate-plan-2026-2029), [Adelaide strategic direction 2024–34](https://adelaide.edu.au/content/dam/adelaideuniversity/documents/about/pdfs/our-journey/AU%20Strategic%20Ambition%20and%20Direction%202024-34.pdf), [Adelaide 2026 opening](https://www.adelaideuni.edu.au/about/news/2026/a-bold-new-future-for-australian-higher-education-begins-today/), [Curtin enabling legislation](https://www.curtin.edu.au/about/governance/enabling-legislation/). Curtin's 1966 predecessor and 1987 university status are distinguished in the profile.
- Italy: [Cattolica contacts](https://www.unicatt.it/en/contacts.html), [Cattolica history](https://www.unicatt.it/ateneo/universita-cattolica/la-nostra-storia.html), [Politecnico di Milano figures](https://www.polimi.it/en/the-politecnico/our-figures), [Politecnico di Torino figures](https://www.polito.it/ateneo/colpo-d-occhio/studenti-e-dottorandi), and Bologna's existing institution record/campus source.
- Denmark: [Aalborg profile](https://www.aau.dk/om-aau/profil), [Aarhus about](https://www.au.dk/om), [DTU contact](https://www.dtu.dk/english/about/contact).
- UK: [Cardiff Main Building](https://www.cardiff.ac.uk/visit/accessibility/cathays-park-campus/main-building), Durham's existing Palatine Centre campus source, [Imperial contact](https://www.imperial.ac.uk/about/leadership-and-strategy/president/contact/).
- Finland: [Aalto history](https://www.aalto.fi/en/aalto-university/history), [foundation constitution](https://www.aalto.fi/en/aalto-handbook/aalto-university-foundations-constitution), [Aalto contact](https://www.aalto.fi/en/aalto-university/aalto-university-contact-information), [Tampere operator/contact](https://content-webapi.tuni.fi/proxy/public/2026-03/tietosuojaseloste_opiskelijavalinnat_eng.pdf), [Helsinki contact](https://www.helsinki.fi/en/about-us/university-helsinki/contact-details). Tampere's current institution dates to the 2019 merger.
- Netherlands: existing official institution history/campus sources and DUO institution records. [Delft Aula address](https://prometheus.tudelft.nl/en/office/). Erasmus's 1913 predecessor and 1973 present institution are distinguished.
- New Zealand: [Massey contact](https://www.massey.ac.nz/about/contact-us/); [Auckland Old Arts Building address](https://www.heritage.org.nz/list-details/25/Old%20Arts%20Building%2C%20University%20of%20Auckland); Otago's official history/campus pages. Massey's 1927 college and 1964 university status are distinguished.
- Sweden: [Chalmers Servicecenter address](https://www.chalmers.se/en/about-chalmers/contact/chalmers-servicecenter/), [KTH campus](https://www.kth.se/en/om/kontakt/campus/kth-campus-1.640118), [KI factsheet](https://education.ki.se/sites/utbildning/files/2026/03/Fact_Sheet_KI_2026-2027.pdf), with each institution's annual report/history.

## Updating

Replace a distribution only after verifying the entire category set, denominator, year and institution identity. Keep factual provenance with the data; do not manufacture percentages from a list of strengths, program counts, ranking scores, campus-only data or predecessor institutions. Run unit tests and the localhost integration verifier after changes. The remaining ten distributions are an open data gap, not a completed research claim.
