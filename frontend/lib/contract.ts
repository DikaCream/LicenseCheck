// Typed wrapper around the LicenseCheck intelligent contract using genlayer-js.
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { TransactionHash } from "genlayer-js/types";
import { CHAIN_ID, CONTRACT_ADDRESS, RPC_URL } from "./config";
import { ensureCorrectChain, type EthereumProvider } from "./wallet";

export type ReportStatus = "REJECTED" | "OPEN" | "JUDGED" | "APPEALED" | "FINAL" | "VOID";
export type Verdict = "" | "VIOLATION" | "COMPLIANT" | "INCONCLUSIVE";
export const LICENSES = ["CC-BY", "CC-BY-SA", "CC-BY-NC", "CC-BY-ND", "CC-BY-NC-ND", "ALL-RIGHTS-RESERVED"] as const;
export type License = (typeof LICENSES)[number];

export interface Page<T> { total: number; items: T[]; next_offset: number; limit?: number }

export interface WorkSummary {
  id: number; creator: string; title: string; original_url: string; license: License; clauses: string[];
  status: "REGISTERED" | "REJECTED"; reject_reason: string; terms: string[]; ownership_marker: boolean;
  registered_at: number; reports: number; violations: number; compliant: number; inconclusive: number;
}
export interface Work extends WorkSummary { snapshot: { sha256: string; chars: number; truncated: boolean } }
export interface SnapshotRow { url: string; sha256: string; excerpt: string; truncated: boolean }

export interface ReportSummary {
  id: number; work_id: number; work_title: string; reporter: string; reported_url: string; term: string; bond: number;
  status: ReportStatus; verdict: Verdict; first_verdict: Verdict; appeal_result: "" | "OVERTURNED" | "UPHELD" | "UNRESOLVED";
  void_reason: string; filed_at: number; final_at: number;
}
export interface Report extends ReportSummary {
  claim: string; term_rule: string; term_question: string; clause: string; reject_reason: string;
  judge_timeout: number; judge_due: number; appeal_window: number; appeal_ends: number; appeal_open: boolean;
  appeal_timeout: number; appeal_due: number; appeal_grace_s: number; judged_at: number; appellant: string;
  appeal_grounds: string; appeal_evidence: string; appealed_at: number; appeal_attempts: number;
  appeal_undetermined: number; appeal_bond_outcome: "" | "RETURNED" | "FORFEITED" | "SPLIT"; reward: number;
  evidence_changed: boolean; rounds: number; snapshot: { sha256: string; chars: number; truncated: boolean };
}
export interface Finding { source: number; url: string; quote: string; fact: string; supports: "VIOLATION" | "COMPLIANT" | "NEUTRAL" }
export interface Round {
  kind: "INITIAL" | "APPEAL" | "APPEAL_UNDETERMINED" | "TIMEOUT"; verdict: string; reuses_work: string; term_answer: string;
  evidence_quote: string; source_url: string; reasoning: string; sources: string[]; evidence_changed: string[];
  evidence_incomplete: string[]; findings: Finding[]; decisive: number; caller: string; timestamp: number;
}
export interface ReportSnapshot { role: string; url: string; sha256: string; excerpt: string; truncated: boolean }
export interface UserInfo { address: string; balance: number; claimed_start: boolean; works: number; reports: number }
export interface Stats {
  works: number; registered: number; reports: number; by_status: Record<ReportStatus, number>; users: number;
  minted: number; balances: number; escrow: number; pool: number; conserved: boolean; appeals: number; overturned: number;
}

// genlayer-js decodes contract dicts as Map and ints as bigint; normalize to plain JSON values.
export function toPlain(value: unknown): any {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) obj[String(k)] = toPlain(v);
    return obj;
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && (value as object).constructor === Object) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) obj[k] = toPlain(v);
    return obj;
  }
  return value;
}

function requireAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured");
  return CONTRACT_ADDRESS;
}

const readClient = createClient({ chain: studionet, endpoint: RPC_URL });

async function read<T>(functionName: string, args: any[] = []): Promise<T> {
  const result = await readClient.readContract({ address: requireAddress(), functionName, args });
  return toPlain(result) as T;
}

export const getWorks = (offset: number, limit: number, includeRejected = false) =>
  read<Page<WorkSummary>>("get_works", [offset, limit, includeRejected]);
export const getWork = (id: number) => read<Work>("get_work", [id]);
export const getWorkSnapshot = (id: number) => read<SnapshotRow>("get_work_snapshot", [id]);
export const getWorkReports = (id: number, offset: number, limit: number) =>
  read<Page<ReportSummary>>("get_work_reports", [id, offset, limit]);
export const getReports = (status: string, offset: number, limit: number) =>
  read<Page<ReportSummary>>("get_reports", [status, offset, limit]);
export const getUserReports = (user: string, offset: number, limit: number) =>
  read<Page<ReportSummary>>("get_user_reports", [user, offset, limit]);
export const getUserWorks = (user: string, offset: number, limit: number) =>
  read<Page<WorkSummary>>("get_user_works", [user, offset, limit]);
export const getReport = (id: number) => read<Report>("get_report", [id]);
export const getRounds = (id: number) => read<Round[]>("get_rounds", [id]);
export const getSnapshots = (id: number) => read<ReportSnapshot[]>("get_snapshots", [id]);
export const getUser = (user: string) => read<UserInfo>("get_user", [user]);
export const getStats = () => read<Stats>("get_stats");

// ------------------------------------------------------------------ transactions

/** Consensus steps shown in the UI, in order (from the transaction's statusName). */
export const TX_STEPS = ["PENDING", "PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED", "FINALIZED"] as const;
export const FAILED_STATUSES = new Set(["UNDETERMINED", "CANCELED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"]);
const FINALIZE_WAIT_MS = 25 * 60_000;

export interface TxCallbacks {
  onHash?: (hash: string) => void;
  onStatus?: (status: string) => void;
}

export interface TxResult {
  hash: string;
  statusName: string;
  values: Record<string, unknown>;
}

/** Called once the transaction is FINALIZED and successful: read the contract and return null if the
 *  expected state change is really there, or a message describing what is wrong. */
export type Verifier = (r: TxResult) => Promise<string | null>;

export interface TxOptions {
  /** Idempotency key: one in-flight transaction per key (e.g. "respond:3"). */
  key?: string;
  verify?: Verifier;
}

export class TxError extends Error {
  hash?: string;
  constructor(message: string, hash?: string) {
    super(message);
    this.hash = hash;
  }
}

/** Studio's "readable" return payload is JSON-like but may omit commas; extract scalar fields. */
export function parseReadable(readable: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof readable !== "string") return out;
  for (const m of readable.matchAll(/"(\w+)"\s*:\s*("(?:[^"\\]|\\.)*"|-?\d+|true|false)/g)) {
    const raw = m[2];
    try {
      out[m[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw === "true" ? true : raw === "false" ? false : Number(raw);
    } catch {
      out[m[1]] = raw.slice(1, -1);
    }
  }
  return out;
}

function cleanError(raw: unknown): string {
  const text = String(raw ?? "").trim();
  if (!text) return "The contract rejected the transaction";
  const quoted = text.match(/"([^"]{3,200})"/);
  return (quoted ? quoted[1] : text).slice(0, 200);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchTx(hash: string): Promise<any | null> {
  try {
    return await readClient.getTransaction({ hash: hash as TransactionHash });
  } catch {
    return null;
  }
}

// ---- persisted transaction records (localStorage) -------------------------------------------

export type TxRecordState = "SUBMITTED" | "ACCEPTED" | "CONFIRMED" | "FAILED" | "UNVERIFIED" | "UNCERTAIN";
export interface TxRecord {
  hash: string;
  key: string;
  method: string;
  author: string;
  state: TxRecordState;
  at: number;
  note?: string;
}
const STORE = "licensecheck:txs:v1";

export function loadTxRecords(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORE) || "[]") as TxRecord[];
  } catch {
    return [];
  }
}
function saveTxRecord(rec: TxRecord) {
  if (typeof window === "undefined") return;
  const all = loadTxRecords().filter((r) => r.hash !== rec.hash);
  all.unshift(rec);
  window.localStorage.setItem(STORE, JSON.stringify(all.slice(0, 50)));
  window.dispatchEvent(new Event("licensecheck:txs"));
}
export function dismissTxRecord(hash: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE, JSON.stringify(loadTxRecords().filter((r) => r.hash !== hash)));
  window.dispatchEvent(new Event("licensecheck:txs"));
}
/** A record that is still unresolved (so the same operation must not be signed a second time). */
export function pendingRecord(key: string, author: string): TxRecord | undefined {
  return loadTxRecords().find(
    (r) => r.key === key && r.author.toLowerCase() === author.toLowerCase() &&
      (r.state === "SUBMITTED" || r.state === "ACCEPTED" || r.state === "UNCERTAIN") && Date.now() - r.at < 60 * 60_000,
  );
}

// ---- wallet revalidation --------------------------------------------------------------------

/** Immediately before signing: the wallet's ACTIVE account must still be `author` and the chain must be 61999. */
async function revalidateWallet(author: string, provider: EthereumProvider) {
  let chain = parseInt(await provider.request({ method: "eth_chainId" }), 16);
  if (chain !== CHAIN_ID) {
    await ensureCorrectChain();
    chain = parseInt(await provider.request({ method: "eth_chainId" }), 16);
  }
  if (chain !== CHAIN_ID) throw new TxError(`Wrong network (chain ${chain}). Switch your wallet to GenLayer Studionet (${CHAIN_ID}) and retry.`);
  const accounts: string[] = await provider.request({ method: "eth_accounts" });
  if (!accounts[0] || accounts[0].toLowerCase() !== author.toLowerCase()) {
    throw new TxError("The active wallet account changed. Reconnect with the account you started with and retry.");
  }
}

/**
 * Polls a submitted transaction until it is FINALIZED (the only authoritative success), checks the leader
 * receipt, then lets `verify` confirm the resulting contract state. ACCEPTED is shown but is NOT success.
 */
export async function watchTx(
  hash: string, rec: TxRecord, cb: TxCallbacks, verify?: Verifier,
): Promise<TxResult> {
  let status = "PENDING";
  let tx: any = null;
  const deadline = Date.now() + FINALIZE_WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(2500);
    const next = await fetchTx(hash);
    if (!next) continue;
    tx = next;
    const s = String(tx.statusName ?? status);
    if (s !== status) {
      status = s;
      cb.onStatus?.(s);
      if (s === "ACCEPTED") saveTxRecord({ ...rec, state: "ACCEPTED", at: Date.now() });
    }
    const receipts = tx?.consensus_data?.leader_receipt;
    const leader = Array.isArray(receipts) ? receipts[0] : receipts;
    if (FAILED_STATUSES.has(s)) {
      saveTxRecord({ ...rec, state: "FAILED", note: s, at: Date.now() });
      throw new TxError(`Validators could not agree (status: ${s}). Nothing was recorded.`, hash);
    }
    if (leader?.execution_result && leader.execution_result !== "SUCCESS") {
      saveTxRecord({ ...rec, state: "FAILED", note: "execution error", at: Date.now() });
      throw new TxError(cleanError(leader?.result?.payload?.readable || leader?.genvm_result?.stderr), hash);
    }
    if (s === "FINALIZED") break;
  }
  if (status !== "FINALIZED") {
    saveTxRecord({ ...rec, state: "UNCERTAIN", note: `still ${status} after ${FINALIZE_WAIT_MS / 60000} min`, at: Date.now() });
    throw new TxError(
      `Not finalized yet (${status.toLowerCase()}). The transaction may still complete: its hash is saved on this device, check the explorer or reopen this page later. Do not resubmit.`,
      hash,
    );
  }
  const receipts = tx?.consensus_data?.leader_receipt;
  const leader = Array.isArray(receipts) ? receipts[0] : receipts;
  const result: TxResult = { hash, statusName: status, values: parseReadable(leader?.result?.payload?.readable) };
  if (verify) {
    let problem: string | null;
    try {
      problem = await verify(result);
    } catch (e: any) {
      problem = `could not read the contract to confirm (${String(e?.message ?? e).slice(0, 80)})`;
    }
    if (problem) {
      saveTxRecord({ ...rec, state: "UNVERIFIED", note: problem, at: Date.now() });
      throw new TxError(`The transaction finalized but the expected result is not on-chain: ${problem}`, hash);
    }
  }
  saveTxRecord({ ...rec, state: "CONFIRMED", at: Date.now() });
  return result;
}

/**
 * Sends a write through the wallet and reports success only when it is FINALIZED and the contract state
 * verifies. Guards: wallet account + chain are re-checked right before signing; one in-flight transaction per
 * key (a repeat call resumes watching the saved hash instead of signing again); the hash is persisted at once.
 */
export async function sendTx(
  author: `0x${string}`,
  provider: EthereumProvider,
  functionName: string,
  args: unknown[],
  cb: TxCallbacks = {},
  opts: TxOptions = {},
): Promise<TxResult> {
  const address = requireAddress();
  const key = opts.key ?? functionName;
  const existing = pendingRecord(key, author);
  if (existing) {
    cb.onHash?.(existing.hash);
    cb.onStatus?.(existing.state === "ACCEPTED" ? "ACCEPTED" : "PENDING");
    return watchTx(existing.hash, existing, cb, opts.verify);
  }
  await revalidateWallet(author, provider);
  const writeClient = createClient({ chain: studionet, endpoint: RPC_URL, account: author, provider: provider as any });
  const hash: string = await writeClient.writeContract({ address, functionName, args: args as any, value: BigInt(0) });
  const rec: TxRecord = { hash, key, method: functionName, author, state: "SUBMITTED", at: Date.now() };
  saveTxRecord(rec); // preserved immediately: a reload mid-flight can resume instead of re-signing
  cb.onHash?.(hash);
  cb.onStatus?.("PENDING");
  return watchTx(hash, rec, cb, opts.verify);
}

// ---- state verifiers (what must be true on-chain once each write finalized) -----------------

export const verifiers = {
  /** register_work: the id comes from the transaction's own return value, then checked against contract state. */
  async registered(me: string, title: string, r: TxResult): Promise<string | null> {
    const id = Number(r.values.id);
    if (!Number.isInteger(id)) return "the receipt carries no work id";
    const w = await getWork(id);
    if (w.creator.toLowerCase() !== me.toLowerCase() || w.title !== title) return `work ${id} is not this registration`;
    return null;
  },
  async filed(me: string, workId: number, r: TxResult): Promise<string | null> {
    const id = Number(r.values.id);
    if (!Number.isInteger(id)) return "the receipt carries no report id";
    const rep = await getReport(id);
    if (rep.reporter.toLowerCase() !== me.toLowerCase() || rep.work_id !== workId) return `report ${id} is not this filing`;
    return null;
  },
  async status(id: number, ok: ReportStatus[]): Promise<string | null> {
    const rep = await getReport(id);
    return ok.includes(rep.status) ? null : `report ${id} is ${rep.status}, expected ${ok.join(" or ")}`;
  },
};

export interface Config {
  start_points: number; min_bond: number; max_bond: number; appeal_bond: number; violation_reward: number; page_chars: number;
  min_window_s: number; max_window_s: number; appeal_grace_s: number; max_appeal_attempts: number; max_page: number;
  licenses: Record<string, string[]>; terms: Record<string, { rule: string; question: string; violating_answer: string }>;
}
export const getConfig = () => read<Config>("get_config");
