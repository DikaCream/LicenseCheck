"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { verifiers, type Report, type Round } from "@/lib/contract";
import { addressExplorerUrl } from "@/lib/config";
import { countdown, sameAddress, shortAddress, utc } from "@/lib/format";
import { useNow, useReport, useRounds, useSnapshots, useTx } from "@/lib/hooks";
import { useWallet } from "@/lib/WalletProvider";
import { ClerkLog, SectionTitle, VerdictStamp, reportNo, termLabel, workNo } from "@/components/ui";

const SUP: Record<string, string> = { VIOLATION: "text-oxblood", COMPLIANT: "text-verdigris", NEUTRAL: "text-ink-2" };

function Timeline({ r, now }: { r: Report; now: number }) {
  const rows: [string, number, string][] = [["Filed", r.filed_at, "done"]];
  if (r.status === "OPEN") rows.push(["Examination due by", r.judge_due, now < r.judge_due ? `in ${countdown(r.judge_due - now)}` : "passed: anyone may expire (bond refunded)"]);
  if (r.judged_at) rows.push([`First verdict: ${r.first_verdict}`, r.judged_at, "done"]);
  if (r.status === "JUDGED") rows.push(["Appeal window closes", r.appeal_ends, now < r.appeal_ends ? `in ${countdown(r.appeal_ends - now)}` : "closed: anyone may finalize"]);
  if (r.appealed_at) rows.push([`Appeal lodged by ${shortAddress(r.appellant)}`, r.appealed_at, "done"]);
  if (r.status === "APPEALED") rows.push(["Appeal must be decided by", r.appeal_due, now < r.appeal_due ? `in ${countdown(r.appeal_due - now)}` : "passed: anyone may expire (first verdict stands)"]);
  if (r.final_at) rows.push([r.status === "VOID" ? "Voided" : "Final", r.final_at, "done"]);
  return (
    <ol className="space-y-2 border-l-2 border-ink/40 pl-4" data-testid="timeline">
      {rows.map(([label, ts, note], i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-ink bg-card" />
          <b className="narrow uppercase tracking-wider text-[13px]">{label}</b>
          <span className="block mono text-[12px] text-ink-2">{utc(ts)}{note !== "done" ? ` · ${note}` : ""}</span>
        </li>
      ))}
    </ol>
  );
}

function RoundCard({ x, i }: { x: Round; i: number }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <span className="tag">Round {i + 1} · {x.kind.replace("_", " ").toLowerCase()}</span>
        <span className={`stamp stamp-sm ${x.verdict === "VIOLATION" ? "text-oxblood" : x.verdict === "COMPLIANT" ? "text-verdigris" : "text-violet"}`}>{x.verdict}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 mono text-[12px]">
        {x.kind !== "TIMEOUT" && <><span>reuses the work: <b>{x.reuses_work}</b></span><span>term answer: <b>{x.term_answer}</b></span></>}
      </div>
      <p className="mt-2 text-[15px]">{x.reasoning}</p>
      {x.findings.length > 0 && (
        <div className="mt-3 space-y-2" data-testid="findings">
          <div className="tag">Structured findings</div>
          {x.findings.map((f, k) => (
            <div key={k} className={`quote-slip ${k === x.decisive ? "ring-1 ring-oxblood" : ""}`}>
              <div className="not-italic mono text-[11px] text-ink-2">
                source [{f.source}] {f.url.split("/").slice(-1)[0]} · <span className={SUP[f.supports]}>{f.supports}</span>{k === x.decisive ? " · DECISIVE" : ""}
              </div>
              “{f.quote}”
              <div className="not-italic text-[13px] text-ink-2">{f.fact}</div>
            </div>
          ))}
        </div>
      )}
      {(x.evidence_changed.length > 0 || x.evidence_incomplete.length > 0) && (
        <p className="mt-3 mono text-[12px] text-ochre">
          {x.evidence_changed.length > 0 && <>Changed since snapshot (judged from stored text): {x.evidence_changed.join(", ")}. </>}
          {x.evidence_incomplete.length > 0 && <>Incomplete stored evidence (directional verdicts blocked): {x.evidence_incomplete.join(", ")}.</>}
        </p>
      )}
      <p className="mt-2 mono text-[11px] text-ink-2">{utc(x.timestamp)} · triggered by {shortAddress(x.caller)}</p>
    </div>
  );
}

export default function ReportDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const valid = Number.isInteger(id) && id >= 0;
  const q = useReport(valid ? id : null);
  const rounds = useRounds(valid ? id : null, q.data?.rounds ?? 0);
  const snaps = useSnapshots(valid ? id : null);
  const w = useWallet();
  const tx = useTx();
  const now = useNow();
  const [grounds, setGrounds] = useState("");
  const [extra, setExtra] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  if (!valid) return <p className="mono text-oxblood">Invalid report number.</p>;
  if (q.isLoading) return <p className="mono text-ink-2">Pulling {reportNo(id)}…</p>;
  if (!q.data) return <p className="mono text-oxblood">Report {reportNo(id)} not found.</p>;
  const r = q.data;
  const isReporter = sameAddress(w.address, r.reporter);
  const canAppeal = r.appeal_open && !!w.address && (r.verdict === "VIOLATION" ? !isReporter : isReporter);
  const act = (fn: string, args: unknown[], ok: Report["status"][]) =>
    tx.run(fn, args, { key: `${fn}:${r.id}`, verify: () => verifiers.status(r.id, ok) });

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <span className="mono text-[13px]">{reportNo(r.id)} · against <Link className="ink-link" href={`/work/${r.work_id}`}>{workNo(r.work_id)}</Link></span>
            <span data-testid="verdict"><VerdictStamp r={r} size="lg" /></span>
          </div>
          <h1 className="mt-6 font-display text-3xl leading-tight">{r.work_title}</h1>
          <p className="mt-2 mono text-[13px] break-all">Reported page: <a className="ink-link" href={r.reported_url} target="_blank" rel="noreferrer">{r.reported_url}</a></p>
          <div className="mt-4 specimen">
            <div className="tag">Term at issue: {termLabel(r.term)}</div>
            <p className="mt-1 text-[15px]">{r.clause ? `“${r.clause}”` : r.term_rule}</p>
            <p className="mt-1 text-[13.5px] text-ink-2">Question for the validators: {r.term_question}</p>
          </div>
          <p className="mt-4 tag">The reporter&apos;s claim (allegation, not proof)</p>
          <p className="quote-slip mt-1">{r.claim}</p>
          {r.status === "REJECTED" && <p className="mt-3 mono text-[13px] text-oxblood">Not admitted by the AI screen: {r.reject_reason}. No bond was taken.</p>}
          <p className="mt-4 mono text-[12px] text-ink-2">
            Reporter <a className="ink-link" href={addressExplorerUrl(r.reporter)} target="_blank" rel="noreferrer">{shortAddress(r.reporter)}</a> · bond {r.bond} pts
            {r.reward ? ` · reward ${r.reward} pts from the pool` : ""}
            {r.appeal_result ? ` · appeal ${r.appeal_result}${r.appeal_bond_outcome ? `, appeal bond ${r.appeal_bond_outcome}` : ""}` : ""}
          </p>
        </div>
        <div className="space-y-4">
          <div className="specimen"><div className="tag mb-2">Timeline</div><Timeline r={r} now={now} /></div>
          <div className="specimen" data-testid="actions">
            <div className="tag mb-2">Actions</div>
            {!w.address && <p className="mono text-[12px] text-ink-2">Connect MetaMask to act on this report.</p>}
            {r.status === "OPEN" && now < r.judge_due && (
              <button className="btn" disabled={!w.address || tx.busy} onClick={() => act("judge", [r.id], ["JUDGED"])}>Run the examination</button>
            )}
            {r.status === "OPEN" && now >= r.judge_due && <button className="btn btn-ghost" disabled={!w.address || tx.busy} onClick={() => act("expire", [r.id], ["VOID"])}>Expire (refund bond)</button>}
            {r.status === "JUDGED" && !r.appeal_open && <button className="btn" disabled={!w.address || tx.busy} onClick={() => act("finalize", [r.id], ["FINAL"])}>Finalize</button>}
            {canAppeal && (
              <div className="space-y-2">
                <p className="text-[13.5px]">{r.verdict === "VIOLATION" ? "Disagree with the violation (e.g. you run the reported page)?" : "As the reporter you may appeal this verdict."} Appeal bond 100 pts; returned if the verdict changes, forfeited to the pool if upheld or never pursued.</p>
                <textarea className="field" rows={3} value={grounds} onChange={(e) => setGrounds(e.target.value)} placeholder="Grounds for appeal (20–500 characters)" data-testid="appeal-grounds" />
                <input className="field" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Optional extra exhibit URL (https://…)" data-testid="appeal-url" />
                <button className="btn btn-ox" disabled={tx.busy || grounds.trim().length < 20} onClick={() => act("appeal", [r.id, grounds.trim(), extra.trim()], ["APPEALED"])}>Lodge appeal</button>
              </div>
            )}
            {r.status === "JUDGED" && r.appeal_open && !canAppeal && w.address && <p className="mono text-[12px] text-ink-2">Appeal window open ({countdown(r.appeal_ends - now)} left). {r.verdict === "VIOLATION" ? "The prevailing reporter cannot appeal." : "Only the reporter can appeal this verdict."}</p>}
            {r.status === "APPEALED" && now < r.appeal_due && (
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-ox" disabled={!w.address || tx.busy} onClick={() => act("rule_appeal", [r.id], ["FINAL", "APPEALED"])}>Decide the appeal</button>
                {sameAddress(w.address, r.appellant) && r.appeal_attempts < 3 && (
                  <button className="btn btn-ghost" disabled={tx.busy} onClick={() => act("register_appeal_attempt", [r.id], ["APPEALED"])}>Record an attempt (+10 min)</button>
                )}
              </div>
            )}
            {r.status === "APPEALED" && now >= r.appeal_due && <button className="btn btn-ghost" disabled={!w.address || tx.busy} onClick={() => act("expire", [r.id], ["FINAL"])}>Expire (first verdict stands)</button>}
            {(r.status === "FINAL" || r.status === "VOID" || r.status === "REJECTED") && <p className="mono text-[12px] text-ink-2">No further actions: this record is closed.</p>}
            <ClerkLog status={tx.status} hash={tx.hash} error={tx.error} />
          </div>
        </div>
      </div>

      {r.appeal_grounds && (
        <>
          <SectionTitle n="Appeal">Grounds lodged</SectionTitle>
          <p className="quote-slip">{r.appeal_grounds}</p>
          {r.appeal_evidence && <p className="mt-2 mono text-[12px]">Extra exhibit: <a className="ink-link break-all" href={r.appeal_evidence}>{r.appeal_evidence}</a></p>}
          <p className="mt-1 mono text-[12px] text-ink-2">attempts recorded {r.appeal_attempts} · undetermined rounds {r.appeal_undetermined}</p>
        </>
      )}

      <SectionTitle n="Findings" aside={`${r.rounds} round(s)`}>Examination record</SectionTitle>
      {r.rounds === 0 && <p className="mono text-ink-2">No examination has run yet.</p>}
      <div className="grid gap-5 md:grid-cols-2">{rounds.data?.map((x, i) => <RoundCard key={i} x={x} i={i} />)}</div>

      <SectionTitle n="Evidence">Fingerprinted snapshots</SectionTitle>
      <div className="space-y-3">
        {snaps.data?.map((s, i) => (
          <div key={i} className="specimen">
            <div className="flex flex-wrap justify-between gap-2"><span className="tag">source [{i}] · {s.role}</span><span className="mono text-[11px]">{s.excerpt.length} chars{s.truncated ? " · truncated window" : ""}</span></div>
            <p className="mono text-[12px] break-all">{s.url}</p>
            <p className="mono text-[11px] text-ink-2 break-all">sha256 {s.sha256}</p>
            <button className="ink-link mono text-[12px]" onClick={() => setOpen(open === i ? null : i)}>{open === i ? "hide" : "show"} stored text</button>
            {open === i && <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap bg-card-2 p-2 mono text-[11.5px]">{s.excerpt}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}
