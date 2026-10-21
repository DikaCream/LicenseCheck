# LicenseCheck e2e steps (part 1)

## changed-file

report filed, snapshot stored

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0xed6f29dc…](https://explorer-studio.genlayer.com/transactions/0xed6f29dc77b7e259248040af358c3a703a3c6015aa171d31251ae760d3ccabec) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0xd7b2f29a…](https://explorer-studio.genlayer.com/transactions/0xd7b2f29a9f3c3f2d2bb4fd4ee6876918badee4b62723fb5e9d45aea93d36b2f0) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0xded350e2…](https://explorer-studio.genlayer.com/transactions/0xded350e2bc6e892a16b0c78a03ccee80d5fc4f4f160f2473dc76bc4e55408368) |
| register_work (changed-file-5417380) | A_creator | SUCCESS id=7 / FINALIZED | [0x4c1d8f6a…](https://explorer-studio.genlayer.com/transactions/0x4c1d8f6aafda1aa5ae44226bdbf4bbf0bae753892b13d099d34848a2bd6f36e3) |
| file_report ATTRIBUTION page.txt | B_reporter | SUCCESS id=6 / FINALIZED | [0x1d90e101…](https://explorer-studio.genlayer.com/transactions/0x1d90e10155fc034a00d48e1c42f32cc3c6cb155d0d343d532a33b2e94c09c425) |

Checks:
- PASS: work 7 registered from the tx's own return id (attempt 1)
- PASS: report filed with a snapshot of version A
- PASS: points conserved: balances + escrow + pool == minted

## changed-judge

page edited after filing -> judged from stored snapshot

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x6e5d7d9e…](https://explorer-studio.genlayer.com/transactions/0x6e5d7d9e44a2892c9fe00d5b50c99f9589d868d278be0a7f1c39ce79cd912840) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x43146150…](https://explorer-studio.genlayer.com/transactions/0x4314615066dc51008a4377571de585cf2a57fcfef489c55f02bee2c7c50e5c5c) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0x86daaab9…](https://explorer-studio.genlayer.com/transactions/0x86daaab9fd70b3eaef3328c2313a4b394a0370597b41ad035874e265e2cbf4bf) |
| judge after the page swap | A_creator | SUCCESS id=6 / FINALIZED | [0xf771659e…](https://explorer-studio.genlayer.com/transactions/0xf771659ec61858a7f046185cc7b1234d10856f1f559bd350c9e75fe9c3797d0a) |

Checks:
- PASS: live page now differs (version B pushed after filing)
- PASS: page change detected by consensus and judged from the stored snapshot
- PASS: verdict reflects the filing-time version (swap did not whitewash it)
- PASS: points conserved: balances + escrow + pool == minted

## compliant

credited copy -> COMPLIANT, reporter bond forfeited

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x6a2ed6fc…](https://explorer-studio.genlayer.com/transactions/0x6a2ed6fc3df09e3753bb288e2a1f6c16d7e17ea65d4958bbf96975dbc153d183) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0x19c6b8f6…](https://explorer-studio.genlayer.com/transactions/0x19c6b8f6dfa0734f32d118b6b6fec1f092e7d2fd169849ae5557325955611da7) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0x7d729e6b…](https://explorer-studio.genlayer.com/transactions/0x7d729e6bb54bbbec952b99b1795498dfd74b338381459104a3cf77041a4175fb) |
| register_work (compliant-5402359) | A_creator | SUCCESS id=2 / FINALIZED | [0xeb351cd8…](https://explorer-studio.genlayer.com/transactions/0xeb351cd8eca4c2747c2330fc024cb510eefd261c77b332c7a17c25189e664232) |
| file_report ATTRIBUTION copy-with-credit.txt | B_reporter | SUCCESS id=1 / FINALIZED | [0xe9aeace5…](https://explorer-studio.genlayer.com/transactions/0xe9aeace5a72e807471ec3a607a4d707bed5c777f884dd140cfd8ef8eb7ccbe20) |
| judge (attempt 1) | A_creator | SUCCESS id=1 / FINALIZED | [0x89c13cee…](https://explorer-studio.genlayer.com/transactions/0x89c13cee9d879da019ce6eda7f469b4f754c6e1d383832790f3ac29564a207e2) |
| finalize | A_creator | SUCCESS id=1 / FINALIZED | [0x65f673c8…](https://explorer-studio.genlayer.com/transactions/0x65f673c8b9f603d5446924bac6bb115bc0088b529d4cf09c8abcc590e6272453) |

Checks:
- PASS: work 2 registered from the tx's own return id (attempt 1)
- PASS: report 1 filed (attempt 1)
- PASS: expected verdict COMPLIANT
- PASS: round stored structured findings (source index + verbatim quote)
- PASS: snapshots of original + reported page stored with sha256 and full text
- PASS: report FINAL and bond settled per verdict
- PASS: outcome stored in the work's precedent registry
- PASS: points conserved: balances + escrow + pool == minted

## concurrent

4 wallets register + report at once, ids from tx results

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x94be8673…](https://explorer-studio.genlayer.com/transactions/0x94be8673a3695fa33d0dfba87961e27b0162cfaf2eeb0cf5747ce0cd4ae00ad1) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0xd519576c…](https://explorer-studio.genlayer.com/transactions/0xd519576cea66588c9ce6abf2ab2dba1b9ce8453b2e5b184ae7ab0260f34be569) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0x83b6046d…](https://explorer-studio.genlayer.com/transactions/0x83b6046df0790a095d61678810cfa89b0fec50927b2f1717755c7778faea0778) |
| claim_points (D) | D | SUCCESS / FINALIZED | [0x42505c63…](https://explorer-studio.genlayer.com/transactions/0x42505c63be5ded4de9075c111f43ff8d59f7252281f7ee63bf5a7e6e2532c2f9) |
| concurrent register_work (A_creator) | A_creator | SUCCESS id=22 / FINALIZED | [0xca177b32…](https://explorer-studio.genlayer.com/transactions/0xca177b3217fa80a32fa18c061a565b4d9e1afd5a8b3758e623b482fedc5cf6fc) |
| concurrent register_work (B_reporter) | B_reporter | SUCCESS id=23 / FINALIZED | [0x3146d215…](https://explorer-studio.genlayer.com/transactions/0x3146d215617402cae91b120ed4059d0b3a15852d65df804f601d0e9d32201635) |
| concurrent register_work (C_accused) | C_accused | SUCCESS id=24 / FINALIZED | [0x7e984392…](https://explorer-studio.genlayer.com/transactions/0x7e9843926af8586ea064a221b1a549e4f88a6f544906c835572f503adf018bc5) |
| concurrent register_work (D) | D | SUCCESS id=25 / FINALIZED | [0x17b08b6c…](https://explorer-studio.genlayer.com/transactions/0x17b08b6c12e2e67e056e9b9bd1783c16697f0728a021a79d94a38a16e1bbb9fc) |
| concurrent file_report (A_creator) | A_creator | SUCCESS id=18 / FINALIZED | [0xeb56c65f…](https://explorer-studio.genlayer.com/transactions/0xeb56c65f5731ddc8603cbc11360de672324aab16df5933c68617ca527c98eef8) |
| concurrent file_report (B_reporter) | B_reporter | SUCCESS id=19 / FINALIZED | [0x891edd83…](https://explorer-studio.genlayer.com/transactions/0x891edd83efd89e9db817b60da6eeedd9bac54d36b753a96b3ba6e97a73c604e8) |
| concurrent file_report (C_accused) | C_accused | SUCCESS id=20 / FINALIZED | [0x023bbbe3…](https://explorer-studio.genlayer.com/transactions/0x023bbbe3ed3a09e38d90007265db1977934e52cd81b53641e9eb651837428c1c) |
| concurrent file_report (D) | D | SUCCESS id=21 / FINALIZED | [0xab8caff3…](https://explorer-studio.genlayer.com/transactions/0xab8caff3f102de7e9cfbb9ac690fb700f2e684cdc293e407096a3c80acc74387) |

Checks:
- PASS: every registration returned a distinct, fresh id
- PASS: wallet A_creator: returned work id 22 is its own
- PASS: wallet B_reporter: returned work id 23 is its own
- PASS: wallet C_accused: returned work id 24 is its own
- PASS: wallet D: returned work id 25 is its own
- PASS: every report returned a distinct id
- PASS: wallet A_creator: report 18 is its own and its newest
- PASS: wallet B_reporter: report 19 is its own and its newest
- PASS: wallet C_accused: report 20 is its own and its newest
- PASS: wallet D: report 21 is its own and its newest
- PASS: points conserved: balances + escrow + pool == minted

## inconclusive

conflicting credit on the page -> INCONCLUSIVE, bond refunded

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0xb0d02d69…](https://explorer-studio.genlayer.com/transactions/0xb0d02d6913be11bc6dd129d195f3118b0fc247c714d480f3dd655ff264e63bb8) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0xfefba7d1…](https://explorer-studio.genlayer.com/transactions/0xfefba7d130595677c66f191cc63b83f6ebcc8b739fdc11d631614f826f3719f5) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0xae05b2e5…](https://explorer-studio.genlayer.com/transactions/0xae05b2e553456ca0863dd48739199e59a9f10c487f00727bc9520e08312ccbc1) |
| register_work (inconclusive-8069433) | A_creator | SUCCESS id=30 / FINALIZED | [0x84a1cf89…](https://explorer-studio.genlayer.com/transactions/0x84a1cf89ef7e4fdc6cf00dcf836da415b7d30997e00340418942419cc8c234a7) |
| file_report ATTRIBUTION conflicting-credit.txt | B_reporter | SUCCESS id=25 / FINALIZED | [0x9ab76d63…](https://explorer-studio.genlayer.com/transactions/0x9ab76d63f57c615544e8803bd8e23fdeb3a16f4e527c3d9fea86b15cac34dacb) |
| judge (attempt 1) | A_creator | SUCCESS id=25 / FINALIZED | [0x8e5d8c11…](https://explorer-studio.genlayer.com/transactions/0x8e5d8c114ed8214776c0c1192cb09af823e7e3e2709600cc50dcdab90c8f2f3c) |
| finalize | A_creator | SUCCESS id=25 / FINALIZED | [0x9659b62e…](https://explorer-studio.genlayer.com/transactions/0x9659b62e10df0df6d60f3294a7d794c9c13056ee1645c0af057db85e5e91f334) |

Checks:
- PASS: work 30 registered from the tx's own return id (attempt 1)
- PASS: report 25 filed (attempt 1)
- PASS: expected verdict INCONCLUSIVE
- PASS: round stored structured findings (source index + verbatim quote)
- PASS: snapshots of original + reported page stored with sha256 and full text
- PASS: report FINAL and bond settled per verdict
- PASS: outcome stored in the work's precedent registry
- PASS: points conserved: balances + escrow + pool == minted

## noncommercial

poster shop sells CC BY-NC work -> VIOLATION

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0x5ad4f6a8…](https://explorer-studio.genlayer.com/transactions/0x5ad4f6a8f4f9870088812a824b84ddb09f047a21b983d5ab2d18bec0f43d013d) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0xfb7c84f6…](https://explorer-studio.genlayer.com/transactions/0xfb7c84f65b25de2981aeeb666d57a6c13ecbbd3c8981833e879526821b8f3b5d) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0xef45293f…](https://explorer-studio.genlayer.com/transactions/0xef45293f998f48a8f190d5038b3d30b745e51e15274a5758190b0026f2b1a917) |
| register_work (noncommercial-5405472) | A_creator | SUCCESS id=3 / FINALIZED | [0x0f963dce…](https://explorer-studio.genlayer.com/transactions/0x0f963dcec59fc492272fdd4c6a7ce3dce990cd48ceb0e157308d77a0404cc595) |
| file_report NONCOMMERCIAL poster-shop.txt | B_reporter | SUCCESS id=2 / FINALIZED | [0xa3978c9f…](https://explorer-studio.genlayer.com/transactions/0xa3978c9ffea6a9a1caadfb9a41a25567e5f7d897e2b112feb7ae943fefff35ef) |
| judge (attempt 1) | A_creator | SUCCESS id=2 / FINALIZED | [0xa15e7a89…](https://explorer-studio.genlayer.com/transactions/0xa15e7a89cf57ac46f843826bd6a06c1e4aca5d57fdb14bc024aab677b3693d26) |
| finalize | A_creator | SUCCESS id=2 / FINALIZED | [0x25086204…](https://explorer-studio.genlayer.com/transactions/0x250862041d8b8e968eb0d9f2866bbcc8605b77e7ed07416ecd5b06d20a98b2f4) |
| re-report of a URL with a final VIOLATION precedent reverts | C_accused | expected revert / FINALIZED | [0xc8103e83…](https://explorer-studio.genlayer.com/transactions/0xc8103e83efc5c2aa6d3c4d8e261107bf595e437c7a458fc36fab46f300b89913) |

Checks:
- PASS: work 3 registered from the tx's own return id (attempt 1)
- PASS: report 2 filed (attempt 1)
- PASS: expected verdict VIOLATION
- PASS: round stored structured findings (source index + verbatim quote)
- PASS: snapshots of original + reported page stored with sha256 and full text
- PASS: report FINAL and bond settled per verdict
- PASS: outcome stored in the work's precedent registry
- PASS: points conserved: balances + escrow + pool == minted

## overlap

exact normalized URL keys (fragment/case/path/query)

| Step | Actor | Result | Tx |
|---|---|---|---|
| claim_points (A_creator) | A_creator | SUCCESS / FINALIZED | [0xa45b6947…](https://explorer-studio.genlayer.com/transactions/0xa45b69475cb7295bc37d6c36b5d401f9c9e9c1cc62a29e48e8a514422dd1b524) |
| claim_points (B_reporter) | B_reporter | SUCCESS / FINALIZED | [0xbee12bec…](https://explorer-studio.genlayer.com/transactions/0xbee12becde10c7e774e895a72090fa20604670a9e9824d5847e5159a5a4d42cc) |
| claim_points (C_accused) | C_accused | SUCCESS / FINALIZED | [0x0b6e0799…](https://explorer-studio.genlayer.com/transactions/0x0b6e0799d71eb61dfd4d8f472d5f00490540fcdc3080f311a02f42c8aba4d8c5) |
| register_work (overlap-5967011) | A_creator | SUCCESS id=11 / FINALIZED | [0x79174625…](https://explorer-studio.genlayer.com/transactions/0x79174625f1369b3fdac3d48e70d3f6e3aa32d28b2538f150ab7b62462e7b2fec) |
| file_report ATTRIBUTION copy-no-credit.txt | B_reporter | SUCCESS id=10 / FINALIZED | [0xb04731e4…](https://explorer-studio.genlayer.com/transactions/0xb04731e438d45c2131fcacd71cc79763ba5e2990796b1da245f2cd49e2703937) |
| same URL with host case + #fragment is the SAME key: reverts | C_accused | expected revert / FINALIZED | [0xd5227df9…](https://explorer-studio.genlayer.com/transactions/0xd5227df949e7112eb46df6ee223c1bcdf40921032ee4039cc296517c426c1424) |
| overlapping path copy-no-credit-2.txt is a distinct report | C_accused | SUCCESS id=13 / FINALIZED | [0x28cab576…](https://explorer-studio.genlayer.com/transactions/0x28cab5765f29f9970b5c3958463215702c31dec2646849d429a0c2b19f23d6cf) |
| ?query variant is a distinct report | C_accused | SUCCESS id=14 / FINALIZED | [0x4b0f18b3…](https://explorer-studio.genlayer.com/transactions/0x4b0f18b33fbfb847e8525fe1c22e25918c94eb05206bf9c256788e20ec160ab4) |
| judge overlapping-path report | A_creator | SUCCESS id=13 / FINALIZED | [0xac38d254…](https://explorer-studio.genlayer.com/transactions/0xac38d254034e50afcdbf624af5749f8f58bd1227f1ed21cd2715df40e843e4ea) |

Checks:
- PASS: work 11 registered from the tx's own return id (attempt 1)
- PASS: three distinct reports with exact canonical URLs
- PASS: overlapping path snapshot holds ITS OWN page (second edition), not the shorter URL's
- PASS: round sources are exactly [original, copy-no-credit-2]
- PASS: points conserved: balances + escrow + pool == minted
