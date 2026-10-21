// Shared helpers for the Studionet e2e runs (scripts/e2e.mjs) and the browser demo.
// Actors are throwaway in-memory wallets (Studionet is gasless): no key is ever written to disk or printed.
import { writeFileSync, readFileSync } from "node:fs";
import { createAccount, createClient, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { toPlain, waitAndInspect, parseReadable, EXPLORER_URL } from "./lib.mjs";

export const RPC = process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
export const ADDRESS = process.env.CONTRACT_ADDRESS ||
  JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url))).contractAddress;
export const RAW = "https://raw.githubusercontent.com/DikaCream/LicenseCheck/main/docs/evidence/";
export const ORIGINAL = RAW + "original/harbor-lights.txt";
export const PAGES = {
  noCredit: RAW + "reported/copy-no-credit.txt",
  noCredit2: RAW + "reported/copy-no-credit-2.txt",
  withCredit: RAW + "reported/copy-with-credit.txt",
  poster: RAW + "reported/poster-shop.txt",
  vague: RAW + "reported/vague-mention.txt",
  dateUnclear: RAW + "reported/date-unclear.txt",
  creditElsewhere: RAW + "reported/credit-elsewhere.txt",
  credits: RAW + "appeal/lantern-credits.txt",
  swap: RAW + "swap/page.txt",
};
export const TITLE = "Harbor Lights - a poem by Mira Okafor";
export const CLAIM_ATTR = "The reported page reproduces the full first stanza of Harbor Lights but never names Mira Okafor or links to the original, so the attribution term is broken.";
export const CLAIM_NC = "The reported store sells a poster printed with the first stanza of Harbor Lights for 29 dollars, which is commercial use of a CC BY-NC work.";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const now = () => Math.floor(Date.now() / 1000);

export const reader = createClient({ chain: studionet, endpoint: RPC });
export const read = async (fn, args = []) => toPlain(await reader.readContract({ address: ADDRESS, functionName: fn, args }));

export class Run {
  constructor(name) {
    this.name = name;
    this.doc = { scenario: name, network: "studionet", chainId: 61999, contract: ADDRESS, startedAt: new Date().toISOString(), actors: {}, steps: [], checks: [] };
    this.out = new URL(`../deployments/e2e-${name}.json`, import.meta.url);
  }
  actor(label, pk = generatePrivateKey()) {
    const account = createAccount(pk);
    const client = createClient({ chain: studionet, endpoint: RPC, account });
    this.doc.actors[label] = account.address;
    return { label, client, address: account.address };
  }
  save() { writeFileSync(this.out, JSON.stringify(this.doc, null, 2) + "\n"); }
  async write(label, who, fn, args, { expectFail = false } = {}) {
    const t = Date.now();
    let hash, out;
    try {
      hash = await who.client.writeContract({ address: ADDRESS, functionName: fn, args, value: 0n });
    } catch (e) { out = { success: false, error: String(e.shortMessage || e.message).slice(0, 200) }; }
    // a transient RPC error (HTML error page) while polling is NOT a failed transaction: keep polling the same hash
    for (let i = 0; hash && !out && i < 8; i++) {
      try { out = await waitAndInspect(who.client, hash, { retries: 300, interval: 4000 }); }
      catch (e) { console.log(`[${this.name}] poll retry ${i + 1}: ${String(e.message).slice(0, 80)}`); await sleep(10000); }
    }
    out = out || { success: false, error: "could not poll the transaction" };
    const ok = expectFail ? out.success !== true : out.success === true;
    const values = parseReadable(out.returnValue);
    const step = { step: label, actor: who.label, method: fn, tx: hash || null, explorer: hash ? `${EXPLORER_URL}/transactions/${hash}` : null,
      status: out.statusName || "REJECTED", execution: out.executionResult || "ERROR", ok, expected: expectFail ? "revert" : "success",
      returned_id: values.id ?? null, seconds: Math.round((Date.now() - t) / 1000) };
    if (expectFail && out.stderr) step.revert_reason = String(out.stderr).split("\n").filter(Boolean).slice(-1)[0]?.slice(0, 160);
    if (expectFail && !out.stderr && out.returnValue) step.revert_reason = String(out.returnValue).slice(0, 160);
    this.doc.steps.push(step);
    console.log(`[${this.name}] ${ok ? "OK  " : "FAIL"} ${label} [${step.status}/${step.execution}] ${step.seconds}s ${hash || out.error}`);
    this.save();
    return { ...out, values, step };
  }
  check(label, pass, detail) {
    this.doc.checks.push({ check: label, pass: !!pass, detail });
    console.log(`[${this.name}] ${pass ? "PASS" : "FAIL"} ${label}${detail !== undefined ? " -> " + JSON.stringify(detail).slice(0, 300) : ""}`);
    this.save();
  }
  async start(...actors) {
    for (const a of actors) {
      const u = await read("get_user", [a.address]);
      if (!u.claimed_start) await this.write(`claim_points (${a.label})`, a, "claim_points", []);
    }
  }
  async conservation() {
    const s = await read("get_stats");
    this.check("points conserved: balances + escrow + pool == minted", s.conserved === true && s.balances + s.escrow + s.pool === s.minted,
      { minted: s.minted, balances: s.balances, escrow: s.escrow, pool: s.pool });
  }
  // Waits until every successful tx of this run reached FINALIZED and records it.
  async finalizeAll(maxMinutes = 30) {
    const deadline = Date.now() + maxMinutes * 60_000;
    for (const s of this.doc.steps) {
      if (!s.tx) continue;
      while (Date.now() < deadline) {
        const tx = await reader.getTransaction({ hash: s.tx }).catch(() => null);
        if (tx?.statusName) s.final_status = tx.statusName;
        if (tx?.statusName === "FINALIZED") break;
        await sleep(15000);
      }
    }
    this.doc.finishedAt = new Date().toISOString();
    this.doc.all_finalized = this.doc.steps.filter((s) => s.tx).every((s) => s.final_status === "FINALIZED");
    this.doc.all_checks_pass = this.doc.checks.every((c) => c.pass) && this.doc.steps.every((s) => s.ok);
    this.save();
    console.log(`[${this.name}] finalized=${this.doc.all_finalized} checks=${this.doc.all_checks_pass}`);
  }
}

// register_work with a per-run ?run= query: an exact, distinct registry key that serves the same fixture.
export const registerWork = (run, who, tag, o = {}) =>
  run.write(`register_work (${tag})`, who, "register_work", [o.title || TITLE, `${ORIGINAL}?run=${tag}`, o.license || "CC-BY-NC", o.clauses || []], o);

export const fileReport = (run, who, wid, url, term, claim, o = {}) =>
  run.write(o.label || `file_report ${term} ${url.split("/").slice(-1)[0]}`, who, "file_report",
    [wid, url, term, claim, o.bond ?? 50, o.jt ?? 1800, o.aw ?? 120, o.at ?? 1800], o);
