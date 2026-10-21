"use client";

import type { ReportSummary } from "@/lib/contract";
import { FAILED_STATUSES, TX_STEPS } from "@/lib/contract";
import { txExplorerUrl } from "@/lib/config";

export const workNo = (id: number) => `LC-${String(id + 1).padStart(4, "0")}`;
export const reportNo = (id: number) => `R-${String(id + 1).padStart(4, "0")}`;

const LICENSE_STYLE: Record<string, { short: string; color: string; note: string }> = {
  "CC-BY": { short: "CC BY", color: "text-verdigris", note: "Attribution" },
  "CC-BY-SA": { short: "CC BY-SA", color: "text-verdigris", note: "Attribution · ShareAlike" },
  "CC-BY-NC": { short: "CC BY-NC", color: "text-prussian", note: "Attribution · NonCommercial" },
  "CC-BY-ND": { short: "CC BY-ND", color: "text-violet", note: "Attribution · NoDerivatives" },
  "CC-BY-NC-ND": { short: "CC BY-NC-ND", color: "text-violet", note: "Attribution · NonCommercial · NoDerivatives" },
  "ALL-RIGHTS-RESERVED": { short: "© All rights", color: "text-oxblood", note: "All rights reserved" },
};

export function LicenseBadge({ license, size = "sm" }: { license: string; size?: "sm" | "lg" }) {
  const s = LICENSE_STYLE[license] ?? { short: license, color: "text-ink", note: "" };
  return (
    <span className={`stamp ${size === "lg" ? "stamp-lg" : "stamp-sm"} ${s.color}`} title={s.note}>
      {s.short}
    </span>
  );
}
export const licenseNote = (l: string) => LICENSE_STYLE[l]?.note ?? l;

export const TERM_LABEL: Record<string, string> = {
  ATTRIBUTION: "Attribution",
  NONCOMMERCIAL: "Non-commercial",
  NO_DERIVATIVES: "No derivatives",
  SHARE_ALIKE: "Share-alike",
  NO_REUSE: "No reuse",
};
export const termLabel = (t: string) => TERM_LABEL[t] ?? (t.startsWith("CUSTOM_") ? `Custom clause ${t.slice(7)}` : t);

export function verdictMeta(r: Pick<ReportSummary, "status" | "verdict" | "void_reason">): { label: string; color: string } {
  switch (r.status) {
    case "REJECTED": return { label: "Not admitted", color: "text-ink-2" };
    case "OPEN": return { label: "Awaiting examination", color: "text-ochre" };
    case "VOID": return { label: "Void · refunded", color: "text-ink-2" };
    case "APPEALED": return { label: "Under appeal", color: "text-violet" };
    default: {
      const prefix = r.status === "JUDGED" ? "" : "Final · ";
      if (r.verdict === "VIOLATION") return { label: prefix + "Violation", color: "text-oxblood" };
      if (r.verdict === "COMPLIANT") return { label: prefix + "Compliant", color: "text-verdigris" };
      return { label: prefix + "Inconclusive", color: "text-violet" };
    }
  }
}

export function VerdictStamp({ r, size = "sm" }: { r: Parameters<typeof verdictMeta>[0]; size?: "sm" | "lg" }) {
  const m = verdictMeta(r);
  return <span className={`stamp ${size === "lg" ? "stamp-lg stamp-anim" : "stamp-sm"} ${m.color}`}>{m.label}</span>;
}

export function SectionTitle({ n, children, aside }: { n?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 mt-12 flex items-end justify-between gap-4">
      <h2 className="flex items-baseline gap-3 font-display text-3xl">
        {n && <span className="tab-divider tag !text-[11px] !text-ink">{n}</span>}
        {children}
      </h2>
      {aside && <div className="tag pb-1">{aside}</div>}
    </div>
  );
}

export function LoadMore({ q }: { q: { hasNextPage?: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown } }) {
  if (!q.hasNextPage) return <p className="tag mt-4 text-center">— end of the drawer —</p>;
  return (
    <div className="mt-5 text-center">
      <button className="btn btn-ghost" disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
        {q.isFetchingNextPage ? "Pulling cards…" : "Pull the next cards"}
      </button>
    </div>
  );
}

/** Registrar's log: live consensus progress. Success is only claimed once FINALIZED and verified on-chain. */
export function ClerkLog({ status, hash, error }: { status: string | null; hash?: string | null; error?: string | null }) {
  if (!status && !error) return null;
  const failed = !!status && FAILED_STATUSES.has(status);
  const idx = status ? TX_STEPS.indexOf(status as (typeof TX_STEPS)[number]) : -1;
  const lines = status === "SIGNING" ? ["Awaiting your signature in MetaMask"] : idx >= 0 ? TX_STEPS.slice(0, idx + 1).map((s) => s.charAt(0) + s.slice(1).toLowerCase()) : status ? [status] : [];
  return (
    <div className="specimen mt-4 mono text-[12.5px]" data-testid="clerk-log">
      <div className="tag mb-1">Registrar&apos;s log</div>
      {lines.map((l, i) => (
        <div key={l + i}>
          <span className="text-ink-2">{String(i + 1).padStart(2, "0")} ·</span> {l}
          {i === lines.length - 1 && !failed && status !== "FINALIZED" && <span className="animate-pulse"> …</span>}
        </div>
      ))}
      {failed && <div className="text-oxblood">Validators could not agree ({status}). Nothing was recorded and no points moved.</div>}
      {status === "ACCEPTED" && !error && <div className="text-ink-2">Accepted by consensus; waiting for finalization. Not done until FINALIZED and verified.</div>}
      {status === "FINALIZED" && !error && <div className="text-verdigris">Finalized and verified against the contract state.</div>}
      {error && <div className="mt-1 text-oxblood">Rejected: {error}</div>}
      {hash && (
        <a href={txExplorerUrl(hash)} target="_blank" rel="noreferrer" className="ink-link mt-1 inline-block">
          transaction {hash.slice(0, 12)}…
        </a>
      )}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="tag">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-[13px] text-ink-2">{hint}</span>}
    </label>
  );
}
