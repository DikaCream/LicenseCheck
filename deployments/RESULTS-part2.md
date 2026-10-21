# LicenseCheck e2e steps (part 2)

## overturn

reporter appeals with an exhibit -> first verdict OVERTURNED (COMPLIANT -> INCONCLUSIVE), bond returned

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x2296f9ce…](https://explorer-studio.genlayer.com/transactions/0x2296f9ceeeddf1133dcf1f532d368ea1f5eda9afdbed21cfcc071de815c84214) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x2a285e1b…](https://explorer-studio.genlayer.com/transactions/0x2a285e1bfe714f31eacb592f96c34e3bcbc80befad9142238381cf51584732b5) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0xae3831f3…](https://explorer-studio.genlayer.com/transactions/0xae3831f3988b1f001d66671dc150e7ef5bc111979d7d7ae5294e3bd1054d260c) |
| register_work (overturn-8903105) | A_creator | SUCCESS id=33 / FINALIZED | [0x1408c66c…](https://explorer-studio.genlayer.com/transactions/0x1408c66ca5a774a5d102c59e2481c79a7bd77ddc2c0995fb554799578758ce5a) |
| file_report ATTRIBUTION conflicting-credit.txt | B_reporter | SUCCESS id=27 / FINALIZED | [0x4cad3e41…](https://explorer-studio.genlayer.com/transactions/0x4cad3e4173510b8037af17122ab6df1484f7bd4510860a7f7ea9932e64d4b428) |
| judge (attempt 1) | A_creator | SUCCESS id=27 / FINALIZED | [0xeb30791a…](https://explorer-studio.genlayer.com/transactions/0xeb30791ae512fb77ceeb595bf1d3e1a42aa48f5328f546523fdc277fa3a1ec17) |
| appeal by B_reporter adding the editors' dispute log (with #fragment) | B_reporter | SUCCESS id=27 / FINALIZED | [0x3e49afb1…](https://explorer-studio.genlayer.com/transactions/0x3e49afb10430e64ac9714d7da9e493095aaa17093c222e6511e541b57963d533) |
| rule_appeal (attempt 1) | A_creator | SUCCESS id=27 / FINALIZED | [0xe86b411b…](https://explorer-studio.genlayer.com/transactions/0xe86b411b00d12bda71dadedef70d71d80fcd0d3cc0ebe4a167abd7ef5bcd160c) |

Checks:
- PASS: work 33 registered from the tx's own return id (attempt 1)
- PASS: report 27 filed (attempt 1)
- PASS: appeal exhibit stored canonically (fragment stripped) and snapshotted
- PASS: appeal exhibit reached round two
- PASS: expected scenario: verdict OVERTURNED with bond RETURNED
- PASS: points conserved: balances + escrow + pool == minted

## registered

appellant registers an attempt, round never completes -> bond split 50/50

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x43e99232…](https://explorer-studio.genlayer.com/transactions/0x43e992329aac06375817aa14e4dc9417419b6885cb70f936addb024f25ee95a2) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x2a3ec89f…](https://explorer-studio.genlayer.com/transactions/0x2a3ec89f280dd4b3dac4a503ead1f1486ca252522d647669f204ee07d2096c85) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0x59ed3f08…](https://explorer-studio.genlayer.com/transactions/0x59ed3f0893b9f76d2e85aca545659b4ecd016f0a2d1b8a351de828e4dd8fc675) |
| register_work (registered-7318359) | A_creator | SUCCESS id=21 / FINALIZED | [0x8abe2dcc…](https://explorer-studio.genlayer.com/transactions/0x8abe2dccae64030811459f340e38f559e4c90929b64b4450600392a0ca030ec0) |
| file_report ATTRIBUTION copy-no-credit.txt | B_reporter | SUCCESS id=17 / FINALIZED | [0x7b0e1e4c…](https://explorer-studio.genlayer.com/transactions/0x7b0e1e4cac1ce30cbe13f0399ab4c5852343094e546774ab65d6710807031e81) |
| judge (attempt 1) | A_creator | SUCCESS id=17 / FINALIZED | [0x060273b3…](https://explorer-studio.genlayer.com/transactions/0x060273b393491b75710a5fbbcdb88c1efb71dadc0657a7bc8bb7c41c5365c910) |
| appeal by C_accused (first verdict VIOLATION) | C_accused | SUCCESS id=17 / FINALIZED | [0xe93b0472…](https://explorer-studio.genlayer.com/transactions/0xe93b0472d575d210f834335deedc67ac436cf409c09d63a34e18aee4e90f942f) |
| register_appeal_attempt | C_accused | SUCCESS id=17 / FINALIZED | [0xaed293dd…](https://explorer-studio.genlayer.com/transactions/0xaed293dd5e7d6d70fd637c002971d0fa157259d4ce9df77d5b5b3b85c5c6e23f) |
| rule_appeal after the deadline reverts | A_creator | expected revert / FINALIZED | [0x7099e49b…](https://explorer-studio.genlayer.com/transactions/0x7099e49b9d997797431d893f1164becbf4a1d3113e06c725799998be7f6a6f4b) |
| expire (anyone applies the finality rules) | A_creator | SUCCESS id=17 / FINALIZED | [0xa0116d42…](https://explorer-studio.genlayer.com/transactions/0xa0116d42229d52aa3c8dd1480eef72b6bf27d439d45941f1cd57e6e8e83b9bb5) |

Checks:
- PASS: work 21 registered from the tx's own return id (attempt 1)
- PASS: report 17 filed (attempt 1)
- PASS: attempt recorded on-chain and 600 s grace added
- PASS: first verdict stands and report is FINAL (no escape)
- PASS: appeal bond SPLIT
- PASS: points conserved: balances + escrow + pool == minted

## screens

AI screen rejects vague registration and vague report (no stake taken)

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x2bdea55e…](https://explorer-studio.genlayer.com/transactions/0x2bdea55e07401b26ac39fce77b49f0ce60a975e02db74eb78ede4375c4fac596) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x9a2ac9db…](https://explorer-studio.genlayer.com/transactions/0x9a2ac9dbd9620e78d428264155d6f8c730041ea4cab576cb45ed0feb21a4d57f) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0x23294056…](https://explorer-studio.genlayer.com/transactions/0x2329405641527c6f590bc7ac32f667994d00b8602cdb3a09f2e1f17b44b6a6f5) |
| register_work (screens-5399427) | A_creator | SUCCESS id=1 / FINALIZED | [0x3a26e652…](https://explorer-studio.genlayer.com/transactions/0x3a26e6527c0f5680027de553b459995118164cadc7513ff2f5569810d8d9736c) |
| register_work (screens-5399427-vague) | A_creator | SUCCESS id=8 / FINALIZED | [0x561be1f8…](https://explorer-studio.genlayer.com/transactions/0x561be1f8f3f17d607ef1ad5f83400a38ffef461e07b371e45d787b644c8cbe9c) |
| file_report ATTRIBUTION copy-no-credit.txt | B_reporter | SUCCESS id=7 / FINALIZED | [0x8315d484…](https://explorer-studio.genlayer.com/transactions/0x8315d4846b20927fa61c3edea0be0d08a44ebec532896392b45c2542528a1e08) |
| file_report on a term outside the license reverts | B_reporter | expected revert / FINALIZED | [0xb5f9293d…](https://explorer-studio.genlayer.com/transactions/0xb5f9293d47f90f8fc149aab5b0aa122f3fb11400cc394cb3bbe96a48213016d5) |
| register the same original URL again (fragment variant) reverts | A_creator | expected revert / FINALIZED | [0xe9cec246…](https://explorer-studio.genlayer.com/transactions/0xe9cec2463a5109cb253c62e6e3dd1bdf10b53aa30b775694d4f157f5fa071ba9) |

Checks:
- PASS: work 1 registered from the tx's own return id (attempt 1)
- PASS: AI screen rejects a vague registration (no stake, not reportable)
- PASS: AI screen rejects a vague report without taking the bond
- PASS: points conserved: balances + escrow + pool == minted

## timeout

judging deadline missed -> VOID, bond refunded

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x15a2eb17…](https://explorer-studio.genlayer.com/transactions/0x15a2eb1742f1129caa8fc4f8abe3da61f6a2e397e8bcb353911c3334098911cc) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x497ce582…](https://explorer-studio.genlayer.com/transactions/0x497ce58268bbf309776c2bcf180d34e898051386721f039495cbf54e05361207) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0x70e01297…](https://explorer-studio.genlayer.com/transactions/0x70e01297e9ac3fa7bf797536a8205a11ae44f30b097cc06858d22d5050cdd10e) |
| register_work (timeout-5971029) | A_creator | SUCCESS id=12 / FINALIZED | [0x86dae6d7…](https://explorer-studio.genlayer.com/transactions/0x86dae6d73b09f3d9fc80ebc05d29ecf02b125aeb96352a759b7ad1901fd96147) |
| file_report ATTRIBUTION copy-no-credit.txt | B_reporter | SUCCESS id=11 / FINALIZED | [0x45924030…](https://explorer-studio.genlayer.com/transactions/0x459240301a4fa2a3500aabacfeee0f196d63f5aec7cfdb8388f4cd619d98acea) |
| judge after its deadline reverts | A_creator | expected revert / FINALIZED | [0x38c96a3f…](https://explorer-studio.genlayer.com/transactions/0x38c96a3f9081a4f4e0ffa657b0a2c1a94ba671b70672030319fa12e1d5c05321) |
| expire (judging deadline passed) | C_accused | SUCCESS id=11 / FINALIZED | [0x5d58f6c8…](https://explorer-studio.genlayer.com/transactions/0x5d58f6c885bc607339912711642e3c36759b282d60e3eb4de9e352c7526f6cfb) |
| expire again reverts (nothing to expire) | C_accused | expected revert / FINALIZED | [0x340cd16e…](https://explorer-studio.genlayer.com/transactions/0x340cd16e7baa4a8a7eb5bb0d6a89e8e73dbfe836377bc87e4f071a859603c1cf) |

Checks:
- PASS: work 12 registered from the tx's own return id (attempt 1)
- PASS: report VOID with JUDGE_TIMEOUT and bond refunded
- PASS: points conserved: balances + escrow + pool == minted

## uncompleted

appeal never decided -> first verdict stands, bond forfeited

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x0bf169f4…](https://explorer-studio.genlayer.com/transactions/0x0bf169f48ca11306abbd7073d08cf74c4ba306c08023546bfb6c8a4d330960c2) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x3fe6a8be…](https://explorer-studio.genlayer.com/transactions/0x3fe6a8be46f95b1d83929541dfb693121544530df719e44653b2f1f4167a0a41) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0xcf3a5472…](https://explorer-studio.genlayer.com/transactions/0xcf3a5472ec5c39746951e43f9aa6f8bd729d0ba4420ad030c8d85bd5ad291cb8) |
| register_work (uncompleted-5963046) | A_creator | SUCCESS id=9 / FINALIZED | [0x5a22240b…](https://explorer-studio.genlayer.com/transactions/0x5a22240b3c7216ad41f987ce8e346be59474b641c759d720ab7ee5c244d63314) |
| file_report ATTRIBUTION copy-no-credit.txt | B_reporter | SUCCESS id=8 / FINALIZED | [0xe953b175…](https://explorer-studio.genlayer.com/transactions/0xe953b175a68b4b4cca71255d23a788375be5bf756fa54aef9b00926cc0090640) |
| judge (attempt 1) | A_creator | SUCCESS id=8 / FINALIZED | [0x65e6fb1e…](https://explorer-studio.genlayer.com/transactions/0x65e6fb1e6d6082a75d43d7506c7740755948f291cb6feebe5af7d8695aa2acf2) |
| appeal by C_accused (first verdict VIOLATION) | C_accused | SUCCESS id=8 / FINALIZED | [0x8d375041…](https://explorer-studio.genlayer.com/transactions/0x8d3750410a2c791e5888c5e955d5f94b8930630e922023a514bd34c48547f9eb) |
| rule_appeal after the deadline reverts | A_creator | expected revert / FINALIZED | [0xba04cb0a…](https://explorer-studio.genlayer.com/transactions/0xba04cb0a4bb8606b91a6571a0e7f701da9ec4f66071869059efb99e1dc2dcb09) |
| expire (anyone applies the finality rules) | A_creator | SUCCESS id=8 / FINALIZED | [0xce7b3c4d…](https://explorer-studio.genlayer.com/transactions/0xce7b3c4d5cedcfb53cfe0ef90e7db93c732b123a210a62afbfb52d0b6209355c) |

Checks:
- PASS: work 9 registered from the tx's own return id (attempt 1)
- PASS: report 8 filed (attempt 1)
- PASS: first verdict stands and report is FINAL (no escape)
- PASS: appeal bond FORFEITED
- PASS: points conserved: balances + escrow + pool == minted

## upheld

appeal without new evidence -> UPHELD, bond forfeited

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0xc50edd2c…](https://explorer-studio.genlayer.com/transactions/0xc50edd2cc6f9d32abb6ed5693d13b18400c0792c8421502331d854a611e703e5) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x696ea71e…](https://explorer-studio.genlayer.com/transactions/0x696ea71e7a17b613a10a9fa070567e567f126fd430e14465df70f4b0ca4660bd) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0x72d7491e…](https://explorer-studio.genlayer.com/transactions/0x72d7491e45912eab631864ffbee3bee1fa0f9f441eae62d45b4ec40be18e944b) |
| register_work (upheld-5411385) | A_creator | SUCCESS id=5 / FINALIZED | [0xd0e928de…](https://explorer-studio.genlayer.com/transactions/0xd0e928de2a2e12746ab2ff4b7ce74e7666ff77c8fed70dc4d5d7ead7e2bbf0c2) |
| file_report ATTRIBUTION copy-no-credit.txt | B_reporter | SUCCESS id=4 / FINALIZED | [0xb8369a6e…](https://explorer-studio.genlayer.com/transactions/0xb8369a6e4a2b3378cd7bd8708723a13741e58fc4f650e581dd179a27a6334a7d) |
| judge (attempt 1) | A_creator | SUCCESS id=4 / FINALIZED | [0x049ad2ba…](https://explorer-studio.genlayer.com/transactions/0x049ad2bac39cb018c351d18dda1106d7fecdd3de895567a633c45dfaec15b764) |
| appeal by C_accused (first verdict VIOLATION) | C_accused | SUCCESS id=4 / FINALIZED | [0x5a8571fb…](https://explorer-studio.genlayer.com/transactions/0x5a8571fb51ca54b1015a35338a55f90dc705f12c5fef614161b2f85d374cab0a) |
| rule_appeal | A_creator | SUCCESS id=4 / FINALIZED | [0x24b2aee6…](https://explorer-studio.genlayer.com/transactions/0x24b2aee639f74d18364213ce8b4df45b09e17f787900bd5bea30a06ca8565c20) |

Checks:
- PASS: work 5 registered from the tx's own return id (attempt 1)
- PASS: report 4 filed (attempt 1)
- PASS: appeal decided, report FINAL
- PASS: expected scenario: appeal UPHELD, bond FORFEITED
- PASS: both rounds recorded
- PASS: points conserved: balances + escrow + pool == minted

## violation

CC BY attribution missing -> VIOLATION, reward paid

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x0d60edc0…](https://explorer-studio.genlayer.com/transactions/0x0d60edc077380e0afd855d268d381ec5f527ce2eb9da09f34626626c4f3b4661) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x54059c51…](https://explorer-studio.genlayer.com/transactions/0x54059c5131440f719a59b6b3450b4deb41fdb6fb242f123d0d1b0aa51a19cf19) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0xb23a4387…](https://explorer-studio.genlayer.com/transactions/0xb23a43872b66fbfc0b34532dc877a5b84163e59eb306acb4e26ca31b56d8b45b) |
| register_work (violation-5973020) | A_creator | SUCCESS id=13 / FINALIZED | [0x8b97f9be…](https://explorer-studio.genlayer.com/transactions/0x8b97f9bec079fc3da6a7bda91804a1cd8e3988aab0dc52cbc2c682d15766a160) |
| file_report ATTRIBUTION copy-no-credit.txt | B_reporter | SUCCESS id=12 / FINALIZED | [0xe9048e0f…](https://explorer-studio.genlayer.com/transactions/0xe9048e0fac9bc398ef3cc68c9e8b78dbc4b460e535ecec2879ff028dc4917c36) |
| judge (attempt 1) | A_creator | SUCCESS id=12 / FINALIZED | [0xa107ed24…](https://explorer-studio.genlayer.com/transactions/0xa107ed2499144410e8ce93c3c218eda6813735113bf855e4afa6db2f2d436e08) |
| finalize | A_creator | SUCCESS id=12 / FINALIZED | [0x3748da33…](https://explorer-studio.genlayer.com/transactions/0x3748da3327f11e5af44b2f67f4dbb42295c71987305bf79db0f1e119ece07afe) |
| re-report of a URL with a final VIOLATION precedent reverts | C_accused | expected revert / FINALIZED | [0x621a402b…](https://explorer-studio.genlayer.com/transactions/0x621a402bf58eb6a4e80fa775549c86d41c0c74aa721e6ebf20b6e9b918d7c552) |

Checks:
- PASS: work 13 registered from the tx's own return id (attempt 1)
- PASS: report 12 filed (attempt 1)
- PASS: expected verdict VIOLATION
- PASS: round stored structured findings (source index + verbatim quote)
- PASS: snapshots of original + reported page stored with sha256 and full text
- PASS: report FINAL and bond settled per verdict
- PASS: outcome stored in the work's precedent registry
- PASS: points conserved: balances + escrow + pool == minted
