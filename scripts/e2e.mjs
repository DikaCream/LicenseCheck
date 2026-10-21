// On-chain e2e scenarios on Studionet (throwaway wallets). Usage: node scripts/e2e.mjs <scenario>
//   screens       valid registration + AI-screen rejection of a vague registration and of a vague report (no stake)
//   violation     ATTRIBUTION report on an uncredited copy -> VIOLATION, finalized after the appeal window
//   compliant     ATTRIBUTION report on a credited copy -> COMPLIANT, bond forfeited to the pool
//   noncommercial NONCOMMERCIAL report on a poster shop -> VIOLATION, rewarded from the pool when funded
//   inconclusive  report whose page cannot settle the term -> INCONCLUSIVE, bond refunded
//   upheld        VIOLATION, the accused appeals without new evidence, stricter round confirms (bond forfeited)
//   overturn      credit lives on a separate page; the appeal adds it as an exhibit and round two changes the verdict
//   uncompleted   an appeal nobody pursues: first verdict stands, bond forfeited (appeal finality)
//   registered    appellant registers an attempt but no round runs: first verdict stands, bond split 50/50
//   overlap       exact URL keys: fragment duplicate rejected, overlapping path and ?query are distinct reports
//   changed-file / changed-judge   file a report, the page is edited (pushed to GitHub), judge from the snapshot
//   concurrent    four wallets register and report at the same time: each learns its own distinct id
//   timeout       judging never happens before its deadline: judge reverts, expire voids and refunds the bond
// Writes deployments/e2e-<scenario>.json.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { Run, read, now, sleep, PAGES, TITLE, CLAIM_ATTR, CLAIM_NC, registerWork, fileReport } from "./e2e-lib.mjs";

const name = process.argv[2];
const run = new Run(name);
const A = run.actor("A_creator"), B = run.actor("B_reporter"), C = run.actor("C_accused");
const rep = (id) => read("get_report", [id]);
const bal = async (a) => (await read("get_user", [a.address])).balance;
const waitUntil = async (ts) => { const w = ts - now() + 8; if (w > 0) { console.log(`[${name}] waiting ${w}s`); await sleep(w * 1000); } };
const tag = `${name}-${Date.now() % 1e7}`;

async function work(o = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await registerWork(run, A, `${tag}${attempt > 1 ? "-r" + attempt : ""}`, o);
    const id = r.values.id;
    const w = await read("get_work", [id]);
    run.check(`work ${id} registered from the tx's own return id (attempt ${attempt})`, w.creator === A.address, { status: w.status, reason: w.reject_reason });
    if (w.status === "REGISTERED") return id;
  }
  throw new Error("registration rejected 3 times");
}
async function reportAndJudge(wid, url, term, claim, o = {}) {
  let id, r;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const f = await fileReport(run, o.who || B, wid, url, term, claim, o);
    id = f.values.id;
    r = await rep(id);
    run.check(`report ${id} filed (attempt ${attempt})`, Number.isInteger(id) && r.reporter === (o.who || B).address, { status: r.status, reason: r.reject_reason });
    if (r.status === "OPEN") break;
  }
  if (r.status !== "OPEN") throw new Error("report rejected: " + r.reject_reason);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const j = await run.write(`judge (attempt ${attempt})`, A, "judge", [id], { expectFail: false });
    if (j.success) break;
  }
  r = await rep(id);
  const rounds = await read("get_rounds", [id]);
  run.doc.verdicts = [...(run.doc.verdicts || []), { report: id, verdict: r.verdict, term_answer: rounds[0]?.term_answer, reuses_work: rounds[0]?.reuses_work, findings: rounds[0]?.findings, reasoning: rounds[0]?.reasoning }];
  run.save();
  return id;
}
const settle = async (id) => { const r = await rep(id); await waitUntil(r.appeal_ends); await run.write("finalize", A, "finalize", [id]); return rep(id); };

await run.start(A, B, C);

if (name === "screens") {
  const wid = await work();
  const bad = await registerWork(run, A, tag + "-vague", { clauses: ["Use it nicely and respect the vibes of it, okay"], title: "Stuff" });
  const bw = await read("get_work", [bad.values.id]);
  run.check("AI screen rejects a vague registration (no stake, not reportable)", bw.status === "REJECTED" && bw.terms.length === 0, { status: bw.status, reason: bw.reject_reason });
  const before = await bal(B);
  const vr = await fileReport(run, B, wid, PAGES.noCredit, "ATTRIBUTION", "this page is bad and not okay at all, trust me on this one");
  const r = await rep(vr.values.id);
  run.check("AI screen rejects a vague report without taking the bond", r.status === "REJECTED" && r.bond === 0 && (await bal(B)) === before, { status: r.status, reason: r.reject_reason });
  await fileReport(run, B, wid, PAGES.noCredit, "NO_DERIVATIVES", CLAIM_ATTR, { expectFail: true, label: "file_report on a term outside the license reverts" });
  await run.write("register the same original URL again (fragment variant) reverts", A, "register_work", ["Harbor Lights duplicate", `${PAGES.noCredit.replace(/reported\/.*/, "original/harbor-lights.txt")}?run=${tag}#stanza-2`, "CC-BY", []], { expectFail: true });
} else if (name === "violation" || name === "compliant" || name === "noncommercial" || name === "inconclusive") {
  const wid = await work();
  const cfg = {
    violation: [PAGES.noCredit, "ATTRIBUTION", CLAIM_ATTR, "VIOLATION"],
    compliant: [PAGES.withCredit, "ATTRIBUTION", "The reading club page reproduces the first stanza of Harbor Lights; I claim it does not credit Mira Okafor or link to the original.", "COMPLIANT"],
    noncommercial: [PAGES.poster, "NONCOMMERCIAL", CLAIM_NC, "VIOLATION"],
    inconclusive: [PAGES.conflicting, "ATTRIBUTION", "The moodboard page reproduces the first stanza of Harbor Lights and its credit to Mira Okafor has been withdrawn by an editor, so the page no longer credits the author.", "INCONCLUSIVE"],
  }[name];
  const before = await bal(B);
  const id = await reportAndJudge(wid, cfg[0], cfg[1], cfg[2]);
  let r = await rep(id);
  run.check(`expected verdict ${cfg[3]}`, r.verdict === cfg[3], { verdict: r.verdict });
  const rounds = await read("get_rounds", [id]);
  run.check("round stored structured findings (source index + verbatim quote)", r.verdict === "INCONCLUSIVE" || (rounds[0].findings.length > 0 && rounds[0].decisive >= 0 && rounds[0].evidence_quote.length > 0), rounds[0].findings);
  const snaps = await read("get_snapshots", [id]);
  run.check("snapshots of original + reported page stored with sha256 and full text", snaps.length === 2 && snaps.every((s) => /^[0-9a-f]{64}$/.test(s.sha256) && s.excerpt.length > 50), snaps.map((s) => [s.role, s.sha256.slice(0, 12), s.excerpt.length, s.truncated]));
  r = await settle(id);
  const delta = (await bal(B)) - before;
  const exp = r.verdict === "COMPLIANT" ? -50 : r.verdict === "VIOLATION" ? r.reward : 0;
  run.check("report FINAL and bond settled per verdict", r.status === "FINAL" && delta === exp, { verdict: r.verdict, delta, reward: r.reward });
  const w = await read("get_work", [wid]);
  const prec = await read("get_work_reports", [wid, 0, 10]);
  run.check("outcome stored in the work's precedent registry", prec.items.some((p) => p.id === id && p.status === "FINAL" && p.verdict === r.verdict) && w.violations + w.compliant + w.inconclusive === 1, { violations: w.violations, compliant: w.compliant, inconclusive: w.inconclusive });
  if (r.verdict === "VIOLATION") await fileReport(run, C, wid, cfg[0] + "#again", cfg[1], cfg[2], { expectFail: true, label: "re-report of a URL with a final VIOLATION precedent reverts" });
} else if (name === "upheld" || name === "uncompleted" || name === "registered") {
  const wid = await work();
  const id = await reportAndJudge(wid, PAGES.noCredit, "ATTRIBUTION", CLAIM_ATTR, { at: name === "upheld" ? 1800 : name === "registered" ? 300 : 60, aw: 300 });
  let r = await rep(id);
  const first = r.verdict;
  const appellant = first === "VIOLATION" ? C : B;
  const b0 = await bal(appellant);
  await run.write(`appeal by ${appellant.label} (first verdict ${first})`, appellant, "appeal", [id, "The page is a fair-use quotation and the poet is known to everyone; please re-examine the attribution question.", ""]);
  if (name === "upheld") {
    await run.write("rule_appeal", A, "rule_appeal", [id]);
    r = await rep(id);
    run.check("appeal decided, report FINAL", r.status === "FINAL" && ["UPHELD", "OVERTURNED"].includes(r.appeal_result), { first, final: r.verdict, appeal: r.appeal_result, bond: r.appeal_bond_outcome });
    run.check("expected scenario: appeal UPHELD, bond FORFEITED", r.appeal_result === "UPHELD" && r.appeal_bond_outcome === "FORFEITED" && (await bal(appellant)) === b0 - 100, { appeal: r.appeal_result, bond: r.appeal_bond_outcome });
    const rounds = await read("get_rounds", [id]);
    run.check("both rounds recorded", rounds.length === 2 && rounds[1].kind === "APPEAL", rounds.map((x) => x.kind + ":" + x.verdict));
  } else {
    if (name === "registered") {
      await run.write("register_appeal_attempt", appellant, "register_appeal_attempt", [id]);
      r = await rep(id);
      run.check("attempt recorded on-chain and 600 s grace added", r.appeal_attempts === 1 && r.appeal_due === r.appealed_at + 300 + 600, { attempts: r.appeal_attempts, due: r.appeal_due });
    }
    r = await rep(id);
    await waitUntil(r.appeal_due);
    await run.write("rule_appeal after the deadline reverts", A, "rule_appeal", [id], { expectFail: true });
    await run.write("expire (anyone applies the finality rules)", A, "expire", [id]);
    r = await rep(id);
    const want = name === "registered" ? "SPLIT" : "FORFEITED";
    run.check("first verdict stands and report is FINAL (no escape)", r.status === "FINAL" && r.verdict === first && r.appeal_result === "UNRESOLVED", { first, verdict: r.verdict, appeal: r.appeal_result });
    run.check(`appeal bond ${want}`, r.appeal_bond_outcome === want && (await bal(appellant)) === b0 - (want === "SPLIT" ? 50 : 100), { bond: r.appeal_bond_outcome });
  }
} else if (name === "overturn") {
  const wid = await work();
  const id = await reportAndJudge(wid, PAGES.creditLinked, "ATTRIBUTION", "The zine page reproduces the first stanza of Harbor Lights and does not itself name Mira Okafor or link to the original, so attribution is missing.", { aw: 1800 });
  let r = await rep(id);
  const first = r.verdict;
  const appellant = first === "VIOLATION" ? C : B;
  await run.write(`appeal by ${appellant.label} adding the zine's credits page (with #fragment)`, appellant, "appeal",
    [id, "The zine page links directly to its credits page, and that linked credits page names Mira Okafor and links the original. A linked credits page is reasonable attribution, so the page credits the author.", PAGES.credits + "#issue-12"]);
  r = await rep(id);
  run.check("appeal exhibit stored canonically (fragment stripped) and snapshotted", r.appeal_evidence === PAGES.credits, r.appeal_evidence);
  // A round whose validators cannot agree (UNDETERMINED) changes nothing on-chain; it can be retried before the deadline.
  for (let attempt = 1; attempt <= 3; attempt++) {
    await run.write(`rule_appeal (attempt ${attempt})`, A, "rule_appeal", [id]);
    r = await rep(id);
    if (r.status !== "APPEALED") break;
  }
  const rounds = await read("get_rounds", [id]);
  run.check("appeal exhibit reached round two", rounds[1]?.sources?.includes(PAGES.credits), rounds[1]?.sources);
  run.check("expected scenario: verdict OVERTURNED with bond RETURNED", r.status === "FINAL" && r.appeal_result === "OVERTURNED" && r.appeal_bond_outcome === "RETURNED", { first, final: r.verdict, appeal: r.appeal_result });
} else if (name === "overlap") {
  const wid = await work();
  const f1 = await fileReport(run, B, wid, PAGES.noCredit, "ATTRIBUTION", CLAIM_ATTR);
  await fileReport(run, C, wid, PAGES.noCredit.replace("raw.githubusercontent.com", "RAW.GitHubUserContent.com") + "#stanza", "ATTRIBUTION", CLAIM_ATTR, { expectFail: true, label: "same URL with host case + #fragment is the SAME key: reverts" });
  const f2 = await fileReport(run, C, wid, PAGES.noCredit2, "ATTRIBUTION", CLAIM_ATTR.replace("reproduces", "also reproduces"), { label: "overlapping path copy-no-credit-2.txt is a distinct report" });
  const f3 = await fileReport(run, C, wid, PAGES.noCredit + "?edition=print", "ATTRIBUTION", CLAIM_ATTR, { label: "?query variant is a distinct report" });
  const r1 = await rep(f1.values.id), r2 = await rep(f2.values.id), r3 = await rep(f3.values.id);
  run.check("three distinct reports with exact canonical URLs", new Set([r1.id, r2.id, r3.id]).size === 3 && r2.reported_url === PAGES.noCredit2 && r3.reported_url === PAGES.noCredit + "?edition=print", [r1.reported_url, r2.reported_url, r3.reported_url]);
  const s2 = await read("get_snapshots", [r2.id]);
  run.check("overlapping path snapshot holds ITS OWN page (second edition), not the shorter URL's", s2[1].url === PAGES.noCredit2 && s2[1].excerpt.includes("second edition") && s2[1].sha256 !== (await read("get_snapshots", [r1.id]))[1].sha256, s2[1].excerpt.slice(0, 80));
  await run.write("judge overlapping-path report", A, "judge", [r2.id]);
  const rd = await read("get_rounds", [r2.id]);
  run.check("round sources are exactly [original, copy-no-credit-2]", rd[0].sources.length === 2 && rd[0].sources[1] === PAGES.noCredit2, rd[0].sources);
} else if (name === "changed-file") {
  const wid = await work();
  const f = await fileReport(run, B, wid, PAGES.swap, "ATTRIBUTION", "The Harbor Notes blog reproduces the first stanza of Harbor Lights and credits only 'the Harbor Notes team', never Mira Okafor.", { jt: 7200, aw: 120 });
  const r = await rep(f.values.id);
  run.check("report filed with a snapshot of version A", r.status === "OPEN" && /^[0-9a-f]{64}$/.test(r.snapshot.sha256), r.snapshot);
  writeFileSync(new URL("../deployments/.changed-state.json", import.meta.url), JSON.stringify({ id: f.values.id, wid }));
} else if (name === "changed-judge") {
  const { id } = JSON.parse(readFileSync(new URL("../deployments/.changed-state.json", import.meta.url)));
  const live = await (await fetch(PAGES.swap, { cache: "no-store" })).text();
  run.check("live page now differs (version B pushed after filing)", /version B/.test(live), live.slice(0, 90));
  await run.write("judge after the page swap", A, "judge", [id]);
  const r = await rep(id);
  const rd = await read("get_rounds", [id]);
  run.check("page change detected by consensus and judged from the stored snapshot", r.evidence_changed === true && rd[0].evidence_changed.includes(PAGES.swap), { changed: rd[0].evidence_changed, verdict: r.verdict });
  run.check("verdict reflects the filing-time version (swap did not whitewash it)", r.verdict !== "COMPLIANT", { verdict: r.verdict, findings: rd[0].findings });
  run.doc.verdicts = [{ report: id, verdict: r.verdict, findings: rd[0].findings, reasoning: rd[0].reasoning }];
} else if (name === "concurrent") {
  const D = run.actor("D");
  await run.start(D);
  const actors = [A, B, C, D];
  const before = (await read("get_stats")).works;
  const regs = await Promise.all(actors.map((w, i) => run.write(`concurrent register_work (${w.label})`, w, "register_work", [TITLE, `${PAGES.noCredit.replace(/reported\/.*/, "original/harbor-lights.txt")}?run=${tag}-${i}`, "CC-BY", []])));
  const wids = regs.map((r) => r.values.id);
  run.check("every registration returned a distinct, fresh id", wids.every(Number.isInteger) && new Set(wids).size === 4 && wids.every((i) => i >= before), { before, wids });
  for (let i = 0; i < 4; i++) {
    const w = await read("get_work", [wids[i]]);
    run.check(`wallet ${actors[i].label}: returned work id ${wids[i]} is its own`, w.creator === actors[i].address && w.original_url.endsWith(`${tag}-${i}`), { status: w.status });
  }
  const ok = [];
  for (let i = 0; i < 4; i++) if ((await read("get_work", [wids[i]])).status === "REGISTERED") ok.push(wids[i]);
  const target = ok.length ? ok[0] : await work();
  const urls = [PAGES.noCredit, PAGES.noCredit2, PAGES.poster, PAGES.withCredit];
  const reps = await Promise.all(actors.map((w, i) => fileReport(run, w, target, urls[i], "ATTRIBUTION", CLAIM_ATTR, { label: `concurrent file_report (${w.label})` })));
  const rids = reps.map((r) => r.values.id);
  run.check("every report returned a distinct id", rids.every(Number.isInteger) && new Set(rids).size === 4, rids);
  for (let i = 0; i < 4; i++) {
    const r = await rep(rids[i]);
    const mine = (await read("get_user_reports", [actors[i].address, 0, 1])).items[0];
    run.check(`wallet ${actors[i].label}: report ${rids[i]} is its own and its newest`, r.reporter === actors[i].address && r.reported_url === urls[i] && mine?.id === rids[i], { status: r.status });
  }
} else if (name === "timeout") {
  const wid = await work();
  const f = await fileReport(run, B, wid, PAGES.noCredit, "ATTRIBUTION", CLAIM_ATTR, { jt: 60 });
  const id = f.values.id;
  let r = await rep(id);
  const b0 = await bal(B);
  await waitUntil(r.judge_due);
  await run.write("judge after its deadline reverts", A, "judge", [id], { expectFail: true });
  await run.write("expire (judging deadline passed)", C, "expire", [id]);
  r = await rep(id);
  run.check("report VOID with JUDGE_TIMEOUT and bond refunded", r.status === "VOID" && r.void_reason === "JUDGE_TIMEOUT" && (await bal(B)) === b0 + 50, { status: r.status, void: r.void_reason });
  await run.write("expire again reverts (nothing to expire)", C, "expire", [id], { expectFail: true });
} else {
  throw new Error("unknown scenario " + name);
}
await run.conservation();
run.doc.stats = await read("get_stats");
run.save();
await run.finalizeAll();
