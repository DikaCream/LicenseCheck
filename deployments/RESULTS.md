# LicenseCheck on-chain results (GenLayer Studionet, chain 61999)

Contract: `0x9e2885d91a1F9A426ceEd1580863840395CC109c` (deploy tx [0x8da3bf2402…](https://explorer-studio.genlayer.com/transactions/0x8da3bf24024a1dae372e263d0154ddd7d0213256ddacf24f9828c1e418de5f46))  
Deployed-code sha256 `f997e624207aa24e8adc702165d4ac89192559990287e693e1c3d685939929a5` matches commit `28ead3ac09`: **True** (see verification.json)

Every write below was waited to FINALIZED and its effect verified by reading contract state. Earlier failed attempts are kept as `e2e-*-attempt*.json` for transparency.

| Scenario | What it shows | All FINALIZED | All checks pass |
|---|---|---|---|
| [changed-file](e2e-changed-file.json) | report filed, snapshot stored | True | True |
| [changed-judge](e2e-changed-judge.json) | page edited after filing -> judged from stored snapshot | True | True |
| [compliant](e2e-compliant.json) | credited copy -> COMPLIANT, reporter bond forfeited | True | True |
| [concurrent](e2e-concurrent.json) | 4 wallets register + report at once, ids from tx results | True | True |
| [inconclusive](e2e-inconclusive.json) | conflicting credit on the page -> INCONCLUSIVE, bond refunded | True | True |
| [noncommercial](e2e-noncommercial.json) | poster shop sells CC BY-NC work -> VIOLATION | True | True |
| [overlap](e2e-overlap.json) | exact normalized URL keys (fragment/case/path/query) | True | True |
| [overturn](e2e-overturn.json) | reporter appeals with an exhibit -> first verdict OVERTURNED (COMPLIANT -> INCONCLUSIVE), bond returned | True | True |
| [registered](e2e-registered.json) | appellant registers an attempt, round never completes -> bond split 50/50 | True | True |
| [screens](e2e-screens.json) | AI screen rejects vague registration and vague report (no stake taken) | True | True |
| [timeout](e2e-timeout.json) | judging deadline missed -> VOID, bond refunded | True | True |
| [uncompleted](e2e-uncompleted.json) | appeal never decided -> first verdict stands, bond forfeited | True | True |
| [upheld](e2e-upheld.json) | appeal without new evidence -> UPHELD, bond forfeited | True | True |
| [violation](e2e-violation.json) | CC BY attribution missing -> VIOLATION, reward paid | True | True |


Per-scenario step tables with every transaction link: [RESULTS-part1.md](RESULTS-part1.md), [RESULTS-part2.md](RESULTS-part2.md).

## Browser-originated demo (live site, injected EIP-1193 provider, signing in Node)

Site: https://licensecheck-dikacreams-projects.vercel.app

| Step | Actor | UI outcome | Tx |
|---|---|---|---|
| register work | creator | OK | [0xdb4e7d98…](https://explorer-studio.genlayer.com/transactions/0xdb4e7d984c8a0f49b2ffe1e3ee0ec0a9267621cd842bfe4961a773d6e66c4a55) |
| file misuse report (bond 50) | reporter | OK | [0x1db7527a…](https://explorer-studio.genlayer.com/transactions/0x1db7527ab495c94b83bb201ef0c4d085a886b375820acc07e3b1c8cb58722136) |
| run the examination | reporter | OK | [0x3dc00488…](https://explorer-studio.genlayer.com/transactions/0x3dc0048816caa7f2b230eae362a3ec26dc13d30e3ecb882e80677c2faeeb7f2c) |
| lodge appeal (bond 100) | creator | OK | [0x24568189…](https://explorer-studio.genlayer.com/transactions/0x24568189748d9da5acef21b1ce0af3559b9b9e154c4770733c66ee22cf1026b7) |
| decide the appeal | creator | OK | [0xab82d6cd…](https://explorer-studio.genlayer.com/transactions/0xab82d6cd51c6231f4acaf587f5525179812ef8bb60a89e2881adba3ab8380d6b) |

- PASS: UI navigated to the work id returned by the transaction (not count-before)
- PASS: report id from the tx result belongs to this work and reporter
- PASS: verdict stored with structured findings
- PASS: report FINAL after the appeal, settled on-chain
- PASS: points conserved after the demo
- PASS: every UI action ended FINALIZED + verified
- PASS: private keys never present in the page
