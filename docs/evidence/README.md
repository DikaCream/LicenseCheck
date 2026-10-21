# Evidence fixtures

Stable, fictional pages served from `raw.githubusercontent.com` for the on-chain e2e runs. Raw GitHub files return
identical text to every validator (no ads, clocks or A/B tests), which consensus snapshots need. Wikipedia and other
live sites proved unreliable for consensus in earlier projects.

| File | Role |
|---|---|
| `original/harbor-lights.txt` | The registered original (CC BY-NC 4.0 poem) |
| `reported/copy-no-credit.txt` | Verbatim copy without credit: expected ATTRIBUTION VIOLATION |
| `reported/copy-no-credit-2.txt` | Overlapping path (`copy-no-credit` + `-2`): must be a distinct URL |
| `reported/copy-with-credit.txt` | Credited, non-commercial copy: expected COMPLIANT |
| `reported/poster-shop.txt` | Credited but sold as a poster: expected NONCOMMERCIAL VIOLATION |
| `reported/vague-mention.txt` | No reproduced text, only a vague mention: COMPLIANT or INCONCLUSIVE |
| `reported/credit-elsewhere.txt` | Copy whose credit lives on a separate page (appeal scenario) |
| `appeal/lantern-credits.txt` | The separate credits page, submitted as an appeal exhibit |
| `swap/page.txt` | Edited after a report is filed (page-swap / changed-evidence scenario) |
