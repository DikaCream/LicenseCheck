"use client";

import { useEffect, useState } from "react";
import { dismissTxRecord, loadTxRecords, type TxRecord } from "@/lib/contract";
import { txExplorerUrl } from "@/lib/config";

/** Transactions this browser submitted that are not yet confirmed (or whose result could not be verified). */
export function PendingTxs() {
  const [recs, setRecs] = useState<TxRecord[]>([]);
  useEffect(() => {
    const sync = () => setRecs(loadTxRecords());
    sync();
    window.addEventListener("licensecheck:txs", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("licensecheck:txs", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const open = recs.filter((r) => r.state !== "CONFIRMED" && r.state !== "FAILED");
  if (open.length === 0) return null;
  return (
    <aside className="specimen mt-4 mono text-[12px]" data-testid="pending-txs">
      <p className="tag">Transactions awaiting confirmation (saved on this device)</p>
      <ul className="mt-1 space-y-1">
        {open.map((r) => (
          <li key={r.hash}>
            <b>{r.method}</b> · {r.state}{r.note ? ` (${r.note})` : ""} ·{" "}
            <a className="ink-link" href={txExplorerUrl(r.hash)} target="_blank" rel="noreferrer">{r.hash.slice(0, 14)}…</a>{" "}
            <button className="ink-link underline" onClick={() => dismissTxRecord(r.hash)}>dismiss</button>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-ink-2">Do not resubmit these: the same action is blocked while its transaction is unresolved.</p>
    </aside>
  );
}
