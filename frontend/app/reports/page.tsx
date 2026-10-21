"use client";

import Link from "next/link";
import { useState } from "react";
import { shortAddress, timeAgo } from "@/lib/format";
import { useReports } from "@/lib/hooks";
import { LoadMore, SectionTitle, VerdictStamp, reportNo, termLabel, workNo } from "@/components/ui";

const FILTERS = ["ALL", "OPEN", "JUDGED", "APPEALED", "FINAL", "VOID", "REJECTED"];

export default function Reports() {
  const [status, setStatus] = useState("ALL");
  const q = useReports(status);
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <div>
      <SectionTitle n="Drawer B" aside={`${q.data?.pages[0]?.total ?? 0} report(s) · newest first`}>Misuse reports</SectionTitle>
      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setStatus(f)} className={`tab-divider narrow text-[12px] font-bold uppercase tracking-wider ${status === f ? "!bg-card" : "text-ink-2"}`}>{f.toLowerCase()}</button>
        ))}
      </div>
      {q.isLoading && <p className="mono text-ink-2">Opening the drawer…</p>}
      {!q.isLoading && items.length === 0 && <p className="mono text-ink-2">No reports in this drawer.</p>}
      <div className="overflow-x-auto">
        <table className="w-full bg-card mono text-[12.5px]" data-testid="reports-table">
          <thead><tr className="text-left tag"><th className="p-2">No.</th><th className="p-2">Work</th><th className="p-2">Term</th><th className="p-2">Reported page</th><th className="p-2">Reporter</th><th className="p-2">Filed</th><th className="p-2">Status</th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-ruled align-top">
                <td className="p-2"><Link className="ink-link" href={`/report/${r.id}`}>{reportNo(r.id)}</Link></td>
                <td className="p-2"><Link className="ink-link" href={`/work/${r.work_id}`}>{workNo(r.work_id)}</Link> {r.work_title.slice(0, 32)}</td>
                <td className="p-2">{termLabel(r.term)}</td>
                <td className="max-w-[260px] p-2 break-all">{r.reported_url.replace(/^https:\/\//, "")}</td>
                <td className="p-2">{shortAddress(r.reporter)}</td>
                <td className="p-2">{timeAgo(r.filed_at)}</td>
                <td className="p-2"><VerdictStamp r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length > 0 && <LoadMore q={q} />}
    </div>
  );
}
