"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { addressExplorerUrl } from "@/lib/config";
import { shortAddress, timeAgo, utc } from "@/lib/format";
import { useConfig, useWork, useWorkReports, useWorkSnapshot } from "@/lib/hooks";
import { LicenseBadge, LoadMore, SectionTitle, VerdictStamp, licenseNote, reportNo, termLabel, workNo } from "@/components/ui";

export default function WorkDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const valid = Number.isInteger(id) && id >= 0;
  const work = useWork(valid ? id : null);
  const reports = useWorkReports(valid ? id : null);
  const cfg = useConfig();
  const [showText, setShowText] = useState(false);
  const snap = useWorkSnapshot(valid ? id : null, showText);
  if (!valid) return <p className="mono text-oxblood">Invalid work number.</p>;
  if (work.isLoading) return <p className="mono text-ink-2">Pulling card {workNo(id)}…</p>;
  if (work.isError || !work.data) return <p className="mono text-oxblood">Work {workNo(id)} not found.</p>;
  const w = work.data;
  const items = reports.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card">
          <div className="flex items-start justify-between">
            <span className="mono text-[13px]">{workNo(w.id)}</span>
            {w.status === "REGISTERED" ? <LicenseBadge license={w.license} size="lg" /> : <span className="stamp stamp-lg text-ink-2">Not admitted</span>}
          </div>
          <h1 className="mt-6 font-display text-4xl leading-tight" data-testid="work-title">{w.title}</h1>
          <p className="mt-2 mono text-[13px]"><a className="ink-link break-all" href={w.original_url} target="_blank" rel="noreferrer">{w.original_url}</a></p>
          <p className="mt-2 mono text-[13px]">
            Registered by <a className="ink-link" href={addressExplorerUrl(w.creator)} target="_blank" rel="noreferrer">{shortAddress(w.creator)}</a> · {utc(w.registered_at)}
          </p>
          {w.status === "REJECTED" && <p className="mt-3 quote-slip not-italic">The registration screen did not admit this entry: {w.reject_reason}</p>}
          {w.status === "REGISTERED" && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn btn-ox" href={`/report/new?work=${w.id}`}>File a misuse report</Link>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="specimen">
            <div className="tag">License terms (locked)</div>
            <p className="mt-1 font-display text-lg">{licenseNote(w.license)}</p>
            <ul className="mt-2 space-y-2 text-[14.5px]">
              {w.terms.map((t) => (
                <li key={t}>
                  <b className="narrow uppercase tracking-wider">{termLabel(t)}</b>
                  <span className="block text-ink-2">
                    {t.startsWith("CUSTOM_") ? `“${w.clauses[Number(t.slice(7)) - 1]}”` : cfg.data?.terms[t]?.rule}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="specimen">
            <div className="tag">Snapshot of the original</div>
            <p className="mt-1 mono text-[12px] break-all">sha256 {w.snapshot.sha256 || "—"}</p>
            <p className="mono text-[12px]">{w.snapshot.chars} chars stored{w.snapshot.truncated ? " · page longer than the 12,000-char window (truncated)" : " · complete"}</p>
            <p className="mono text-[12px]">ownership marker: {w.ownership_marker ? "published on the page ✓" : "not published"}</p>
            {w.status === "REGISTERED" && (
              <button className="ink-link mt-1 mono text-[12px]" onClick={() => setShowText(!showText)}>{showText ? "hide" : "show"} stored text</button>
            )}
            {showText && <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap bg-card-2 p-2 mono text-[11.5px]">{snap.data?.excerpt ?? "…"}</pre>}
          </div>
        </div>
      </div>

      <SectionTitle n="Precedents" aside={`${reports.data?.pages[0]?.total ?? 0} report(s) · newest first`}>Reports and outcomes for this work</SectionTitle>
      {items.length === 0 && <p className="mono text-ink-2">No reports filed against this work yet.</p>}
      <div className="grid gap-4 md:grid-cols-2" data-testid="precedents">
        {items.map((r) => (
          <Link key={r.id} href={`/report/${r.id}`} className="card block">
            <div className="flex items-start justify-between gap-2">
              <span className="mono text-[12px] text-ink-2">{reportNo(r.id)} · {termLabel(r.term)}</span>
              <VerdictStamp r={r} />
            </div>
            <p className="mt-5 mono text-[12.5px] break-all">{r.reported_url}</p>
            <p className="mt-1 mono text-[12px] text-ink-2">
              by {shortAddress(r.reporter)} · {timeAgo(r.filed_at)}{r.appeal_result ? ` · appeal ${r.appeal_result.toLowerCase()}` : ""}
            </p>
          </Link>
        ))}
      </div>
      {items.length > 0 && <LoadMore q={reports} />}
    </div>
  );
}
