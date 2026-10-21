// BROWSER-ORIGINATED end-to-end demonstration against the live frontend.
// A headless Chrome drives the real UI (work registration, misuse report, examination, appeal, settlement) with an injected
// EIP-1193 provider. The provider is a thin bridge: every signing request is forwarded to THIS Node process,
// which signs with the test wallet key from .env (PRIVATE_KEY / PRIVATE_KEY_2). Keys never enter the page.
// Two browser contexts: creator (wallet 1) and reporter (wallet 2).
// Usage: DEMO_URL=https://licensecheck-dikacreams-projects.vercel.app node scripts/browser-demo.mjs
// Writes deployments/browser-demo.json (tx hashes read FROM THE UI) and docs/demo-*.png (local only).
import "dotenv/config";
import { chromium } from "playwright-core";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { read, ORIGINAL, PAGES, TITLE, CLAIM_ATTR, ADDRESS } from "./e2e-lib.mjs";

const URL_BASE = (process.env.DEMO_URL || "https://licensecheck-dikacreams-projects.vercel.app").replace(/\/$/, "");
const RPC = process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
const EXPLORER = "https://explorer-studio.genlayer.com/transactions/";
const keys = { creator: process.env.PRIVATE_KEY, reporter: process.env.PRIVATE_KEY_2 };
if (!keys.creator || !keys.reporter) throw new Error("PRIVATE_KEY and PRIVATE_KEY_2 are required in .env");
const doc = { demo: "browser-originated workflow", site: URL_BASE, contract: ADDRESS, startedAt: new Date().toISOString(), wallets: {}, steps: [], checks: [], rpcMethodsSeenByNodeSigner: {} };
const save = () => writeFileSync(new URL("../deployments/browser-demo.json", import.meta.url), JSON.stringify(doc, null, 2) + "\n");
mkdirSync(new URL("../docs/", import.meta.url), { recursive: true });

async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j.result;
}

// Node-side wallet: the page can only ask; signing happens here.
function wallet(pk, label) {
  const account = privateKeyToAccount(pk);
  doc.wallets[label] = account.address;
  return async (method, params = []) => {
    doc.rpcMethodsSeenByNodeSigner[method] = (doc.rpcMethodsSeenByNodeSigner[method] || 0) + 1;
    switch (method) {
      case "eth_requestAccounts": case "eth_accounts": return [account.address];
      case "eth_chainId": return "0xf22f";
      case "wallet_switchEthereumChain": case "wallet_addEthereumChain": return null;
      case "eth_sendTransaction": {
        const t = params[0];
        const nonce = t.nonce !== undefined ? Number(BigInt(t.nonce)) : Number(BigInt(await rpc("eth_getTransactionCount", [account.address, "pending"])));
        const raw = await account.signTransaction({
          type: "legacy", to: t.to, data: t.data, value: t.value ? BigInt(t.value) : 0n, gas: BigInt(t.gas || "0x1e8480"),
          nonce, gasPrice: t.gasPrice ? BigInt(t.gasPrice) : 0n, chainId: 61999,
        });
        return rpc("eth_sendRawTransaction", [raw]);
      }
      default: return rpc(method, params);
    }
  };
}

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
async function session(label, pk) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
  const handler = wallet(pk, label);
  const page = await ctx.newPage();
  await page.exposeFunction("__lcWallet", handler);
  await page.addInitScript(() => {
    window.ethereum = { isMetaMask: true, request: ({ method, params }) => window.__lcWallet(method, params ?? []), on() {}, removeListener() {} };
  });
  page.on("pageerror", (e) => console.log(`[${label}] pageerror`, String(e).slice(0, 160)));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log(`[${label}] console.${m.type()}`, m.text().slice(0, 200)); });
  return { label, page, ctx, address: handler && doc.wallets[label] };
}
const shot = (s, name) => s.page.screenshot({ path: new URL(`../docs/demo-${name}.png`, import.meta.url).pathname, fullPage: false }).catch(() => {});

// Waits for the UI's clerk log to report FINALIZED+verified, and reads the transaction hash from the UI.
async function uiAction(s, label, trigger) {
  const t = Date.now();
  await trigger();
  const spy = setInterval(async () => { const txt = await s.page.locator('[data-testid="clerk-log"]').first().textContent({ timeout: 2000 }).catch(() => "(no clerk log)"); console.log(`  [${label}] ${Math.round((Date.now() - t) / 1000)}s: ${String(txt).replace(/\s+/g, " ").slice(0, 220)}`); }, 60_000);
  const log = s.page.locator('[data-testid="clerk-log"]').first();
  await log.waitFor({ timeout: 60_000 });
  const outcome = await s.page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="clerk-log"]');
    const txt = el?.textContent || "";
    if (/Finalized and verified/.test(txt)) return "OK";
    if (/Rejected:|Validators could not agree|not on-chain|Not finalized yet/.test(txt)) return "FAIL: " + txt.slice(0, 300);
    return false;
  }, null, { timeout: 25 * 60_000, polling: 3000 }).then((h) => h.jsonValue());
  clearInterval(spy);
  const href = await log.locator('a[href*="/transactions/"]').first().getAttribute("href").catch(() => null);
  const hash = href ? href.split("/transactions/")[1] : null;
  const step = { step: label, actor: s.label, tx_from_ui: hash, explorer: hash ? EXPLORER + hash : null, ui_outcome: outcome, seconds: Math.round((Date.now() - t) / 1000) };
  doc.steps.push(step);
  console.log(`${outcome === "OK" ? "OK  " : "FAIL"} ${label} ${hash} ${step.seconds}s`);
  save();
  if (outcome !== "OK") throw new Error(`${label}: ${outcome}`);
  return hash;
}
const check = (label, pass, detail) => { doc.checks.push({ check: label, pass: !!pass, detail }); console.log(pass ? "PASS" : "FAIL", label, detail ? JSON.stringify(detail).slice(0, 200) : ""); save(); };

async function connect(s) {
  await s.page.goto(URL_BASE + "/", { waitUntil: "networkidle" });
  const btn = s.page.getByRole("button", { name: /Connect MetaMask/ });
  if (await btn.waitFor({ timeout: 5000 }).then(() => true).catch(() => false)) await btn.click();
  await s.page.waitForTimeout(3000);
}

try {
  const A = await session("creator", keys.creator);
  const B = await session("reporter", keys.reporter);
  for (const s of [A, B]) await connect(s);
  await shot(A, "01-connected");
  for (const s of [A, B]) {
    const claimBtn = s.page.getByRole("button", { name: /^Claim .* pts$/ });
    if (await claimBtn.waitFor({ timeout: 15_000 }).then(() => true).catch(() => false)) await uiAction(s, `claim starting points (${s.label})`, () => claimBtn.click());
  }

  // ---- register a work (creator, via the form); exact distinct URL key per demo run
  const tag = "browser-" + Date.now();
  const before = (await read("get_stats")).works;
  await A.page.goto(URL_BASE + "/register", { waitUntil: "networkidle" });
  await A.page.getByPlaceholder("Harbor Lights, a poem by Mira Okafor").fill(TITLE);
  await A.page.getByPlaceholder("https://…").first().fill(`${ORIGINAL}?run=${tag}`);
  await shot(A, "02-register");
  console.log("register button enabled:", await A.page.getByRole("button", { name: /File this card/ }).isEnabled());
  await uiAction(A, "register work", () => A.page.getByRole("button", { name: /File this card/ }).click());
  await A.page.waitForURL(/\/work\/\d+/, { timeout: 60_000 });
  const wid = Number(A.page.url().match(/\/work\/(\d+)/)[1]);
  const work = await read("get_work", [wid]);
  check("UI navigated to the work id returned by the transaction (not count-before)", work.creator.toLowerCase() === A.address.toLowerCase() && work.original_url.includes(tag), { navigated_to: wid, works_before: before, status: work.status, reason: work.reject_reason });
  if (work.status !== "REGISTERED" && work.status !== "ACTIVE") throw new Error("registration rejected by the AI screen: " + work.reject_reason);

  // ---- file a misuse report (reporter, second context)
  await B.page.goto(`${URL_BASE}/report/new?work=${wid}`, { waitUntil: "networkidle" });
  await B.page.locator('[data-testid="reported-url"]').fill(PAGES.noCredit);
  await B.page.locator('[data-testid="term"]').selectOption("ATTRIBUTION");
  await B.page.locator('[data-testid="claim"]').fill(CLAIM_ATTR);
  await B.page.locator('[data-testid="bond"]').fill("50");
  await B.page.locator('[data-testid="appeal-window"]').selectOption("3600");
  await uiAction(B, "file misuse report (bond 50)", () => B.page.getByRole("button", { name: /Post bond & file report/ }).click());
  await B.page.waitForURL(/\/report\/\d+/, { timeout: 60_000 });
  const rid = Number(B.page.url().match(/\/report\/(\d+)/)[1]);
  let r = await read("get_report", [rid]);
  check("report id from the tx result belongs to this work and reporter", r.work_id === wid && r.reporter.toLowerCase() === B.address.toLowerCase(), { rid, status: r.status });
  if (r.status !== "OPEN") throw new Error("report rejected by the AI screen: " + r.reject_reason);

  // ---- examination
  await uiAction(B, "run the examination", () => B.page.getByRole("button", { name: /Run the examination/ }).click());
  r = await read("get_report", [rid]);
  const rounds1 = await read("get_rounds", [rid]);
  check("verdict stored with structured findings", ["VIOLATION", "COMPLIANT", "INCONCLUSIVE"].includes(r.verdict), { verdict: r.verdict, rounds: rounds1.length });
  await B.page.reload({ waitUntil: "networkidle" });
  await shot(B, "03-judged");

  // ---- appeal: anyone but the reporter may appeal a VIOLATION; only the reporter may appeal other verdicts
  const appellant = r.verdict === "VIOLATION" ? A : B;
  await appellant.page.goto(`${URL_BASE}/report/${rid}`, { waitUntil: "networkidle" });
  await appellant.page.locator('[data-testid="appeal-grounds"]').fill("Please re-read both stored snapshots: the attribution question should be decided on the full text, not a summary.");
  await uiAction(appellant, "lodge appeal (bond 100)", () => appellant.page.getByRole("button", { name: /Lodge appeal/ }).click());
  await appellant.page.reload({ waitUntil: "networkidle" });
  await uiAction(appellant, "decide the appeal", () => appellant.page.getByRole("button", { name: /Decide the appeal/ }).click());
  r = await read("get_report", [rid]);
  check("report FINAL after the appeal, settled on-chain", r.status === "FINAL", { first: r.first_verdict, final: r.verdict, appeal: r.appeal_result });
  await appellant.page.reload({ waitUntil: "networkidle" });
  await shot(appellant, "04-final");
  doc.work = work; doc.report = { id: rid, final: r, rounds: await read("get_rounds", [rid]) };
  const stats = await read("get_stats");
  check("points conserved after the demo", stats.conserved === true, stats);
  const stored = await A.page.evaluate(() => localStorage.getItem("licensecheck:txs:v1"));
  doc.uiPersistedTxRecords = JSON.parse(stored || "[]").map((x) => ({ method: x.method, state: x.state, hash: x.hash }));
  check("every UI action ended FINALIZED + verified", doc.steps.every((x) => x.ui_outcome === "OK"), doc.steps.length + " actions");
  check("private keys never present in the page", !(await A.page.content()).includes(keys.creator.slice(2, 20)) && !(await B.page.content()).includes(keys.reporter.slice(2, 20)));
} catch (e) {
  console.error("DEMO FAILED:", e.message);
  doc.error = String(e.message).slice(0, 500);
  process.exitCode = 1;
} finally {
  doc.finishedAt = new Date().toISOString();
  save();
  await browser.close();
}
