"use client";

import Link from "next/link";
import { useState } from "react";
import { CONTRACT_ADDRESS } from "@/lib/config";
import { host, pts, shortAddress, timeAgo } from "@/lib/format";
import { useStats, useWorks } from "@/lib/hooks";
import { LicenseBadge, LoadMore, SectionTitle, workNo } from "@/components/ui";

export default function Registry() {
  const [rejected, setRejected] = useState(false);
  const works = useWorks(rejected);
  const stats = useStats();
  const items = works.data?.pages.flatMap((p) => p.items) ?? [];
  const total = works.data?.pages[0]?.total ?? 0;
  return (
    <div>
      <section className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="tag">Catalogue entry · how it works</span>
            <span className="mono text-[11px] text-ink-2">Studionet · 61999</span>
          </div>
          <h1 className="mt-6 font-display text-4xl leading-tight sm:text-5xl">
            Licenses, filed on cards.<br /><i className="text-oxblood">Misuse, judged in public.</i>
          </h1>
          <p className="mt-4 max-w-xl">
            A creator registers a work with structured license terms, locked with a fingerprinted snapshot of the original.
            Anyone can file a bonded misuse report. GenLayer validators read both pages and agree on
            <b> VIOLATION</b>, <b>COMPLIANT</b> or <b>INCONCLUSIVE</b> for the exact term, quoting the passages that decide it.
            Every outcome becomes a precedent card on the work.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/register" className="btn">Register a work</Link>
            <Link href="/trust" className="btn btn-ghost">Read the rules</Link>
          </div>
        </div>
        <div className="specimen self-start" data-testid="stats">
          <div className="tag">Registry ledger</div>
          {!CONTRACT_ADDRESS && <p className="mono text-oxblood">NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.</p>}
          {stats.data ? (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 mono text-[13px]">
              <dt>Works on file</dt><dd className="text-right" data-testid="stat-works">{stats.data.registered}</dd>
              <dt>Reports filed</dt><dd className="text-right">{stats.data.reports}</dd>
              <dt>Final verdicts</dt><dd className="text-right">{stats.data.by_status.FINAL}</dd>
              <dt>Appeals / overturned</dt><dd className="text-right">{stats.data.appeals} / {stats.data.overturned}</dd>
              <dt>Bonds in escrow</dt><dd className="text-right">{pts(stats.data.escrow)} pts</dd>
              <dt>Community pool</dt><dd className="text-right">{pts(stats.data.pool)} pts</dd>
              <dt>Points conserved</dt><dd className={`text-right ${stats.data.conserved ? "text-verdigris" : "text-oxblood"}`}>{stats.data.conserved ? "yes ✓" : "NO"}</dd>
            </dl>
          ) : (
            <p className="mono text-[13px] text-ink-2">{stats.isError ? "Could not reach Studionet." : "Reading the ledger…"}</p>
          )}
          <p className="mt-3 text-[12.5px] text-ink-2">Points are non-monetary. Verdicts are not legal advice.</p>
        </div>
      </section>

      <SectionTitle n="Drawer A" aside={`${total} card${total === 1 ? "" : "s"} · newest first`}>The works registry</SectionTitle>
      <label className="mb-3 flex items-center gap-2 mono text-[12px] text-ink-2">
        <input type="checkbox" checked={rejected} onChange={(e) => setRejected(e.target.checked)} /> include entries the AI screen did not admit
      </label>
      {works.isLoading && <p className="mono text-ink-2">Opening the drawer…</p>}
      {works.isError && <p className="mono text-oxblood">Could not read the registry: {String((works.error as Error)?.message).slice(0, 120)}</p>}
      {!works.isLoading && items.length === 0 && !works.isError && <p className="mono text-ink-2">No works on file yet.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="works">
        {items.map((w) => (
          <Link key={w.id} href={`/work/${w.id}`} className="card block" data-testid="work-card">
            <div className="flex items-start justify-between gap-2">
              <span className="mono text-[12px] text-ink-2">{workNo(w.id)}</span>
              {w.status === "REGISTERED" ? <LicenseBadge license={w.license} /> : <span className="stamp stamp-sm text-ink-2">Not admitted</span>}
            </div>
            <h3 className="mt-5 font-display text-xl leading-snug">{w.title}</h3>
            <p className="mono text-[12px] text-ink-2">{host(w.original_url)}</p>
            <p className="mt-2 mono text-[12px]">
              by {shortAddress(w.creator)} · {timeAgo(w.registered_at)}
              {w.ownership_marker && <span className="ml-1 text-verdigris" title="The original page publishes this wallet's marker">· marker ✓</span>}
            </p>
            <p className="mt-1 mono text-[12px]">
              {w.reports} report{w.reports === 1 ? "" : "s"} · <span className="text-oxblood">{w.violations} viol.</span> · <span className="text-verdigris">{w.compliant} compl.</span> · <span className="text-violet">{w.inconclusive} incl.</span>
            </p>
          </Link>
        ))}
      </div>
      {items.length > 0 && <LoadMore q={works} />}
    </div>
  );
}
