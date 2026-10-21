"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { verifiers } from "@/lib/contract";
import { pts } from "@/lib/format";
import { useConfig, useTx, useUser, useWork } from "@/lib/hooks";
import { useWallet } from "@/lib/WalletProvider";
import { ClerkLog, Field, LicenseBadge, termLabel, workNo } from "@/components/ui";

const WINDOWS = [
  { s: 600, l: "10 minutes" }, { s: 1800, l: "30 minutes" }, { s: 3600, l: "1 hour" }, { s: 21600, l: "6 hours" },
  { s: 86400, l: "1 day" }, { s: 259200, l: "3 days" },
];

function NewReport() {
  const sp = useSearchParams();
  const id = Number(sp.get("work"));
  const work = useWork(Number.isInteger(id) && id >= 0 ? id : null);
  const cfg = useConfig();
  const w = useWallet();
  const me = useUser(w.address);
  const tx = useTx();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [term, setTerm] = useState("");
  const [claim, setClaim] = useState("");
  const [bond, setBond] = useState(50);
  const [jt, setJt] = useState(3600);
  const [aw, setAw] = useState(3600);
  const [at, setAt] = useState(3600);
  if (!work.data) return <p className="mono text-ink-2">{work.isError ? "Work not found." : "Loading the work card…"}</p>;
  const wk = work.data;
  const t = term || wk.terms[0];
  const ok = /^https:\/\//i.test(url.trim()) && claim.trim().length >= 30 && claim.trim().length <= 600 && bond >= 20 && bond <= 500;

  async function submit() {
    const res = await tx.run("file_report", [wk.id, url.trim(), t, claim.trim(), bond, jt, aw, at], {
      key: `file_report:${wk.id}:${t}:${url.trim().toLowerCase()}`,
      verify: (r) => verifiers.filed(w.address as string, wk.id, r),
    });
    const rid = res ? Number(res.values.id) : NaN; // id from the transaction result, never a pre-read count
    if (Number.isInteger(rid)) router.push(`/report/${rid}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="card">
        <div className="flex justify-between"><span className="tag">Misuse report against {workNo(wk.id)}</span><LicenseBadge license={wk.license} /></div>
        <h1 className="mt-6 font-display text-3xl">{wk.title}</h1>
        <div className="mt-6 space-y-5">
          <Field label="Reported URL" hint="The page you believe breaks the license. https only; #fragments are ignored, paths and queries are exact.">
            <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" data-testid="reported-url" />
          </Field>
          <Field label="Which term is broken?">
            <select className="field" value={t} onChange={(e) => setTerm(e.target.value)} data-testid="term">
              {wk.terms.map((x) => <option key={x} value={x}>{termLabel(x)}</option>)}
            </select>
            <span className="mt-1 block text-[13.5px] text-ink-2">
              {t.startsWith("CUSTOM_") ? `“${wk.clauses[Number(t.slice(7)) - 1]}”` : cfg.data?.terms[t]?.question}
            </span>
          </Field>
          <Field label="Your claim" hint="30–600 characters. Say concretely what the page does. Vague or unjudgeable claims are rejected by the AI screen before any bond is taken.">
            <textarea className="field" rows={4} value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="The page reproduces the first stanza verbatim and never names the author or links to the original." data-testid="claim" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bond (points)" hint="20–500. Refunded on VIOLATION or INCONCLUSIVE; forfeited to the community pool on COMPLIANT.">
              <input className="field" type="number" min={20} max={500} value={bond} onChange={(e) => setBond(Number(e.target.value))} data-testid="bond" />
            </Field>
            <Field label="Judging deadline"><select className="field" value={jt} onChange={(e) => setJt(Number(e.target.value))}>{WINDOWS.map((x) => <option key={x.s} value={x.s}>{x.l}</option>)}</select></Field>
            <Field label="Appeal window"><select className="field" value={aw} onChange={(e) => setAw(Number(e.target.value))} data-testid="appeal-window">{WINDOWS.map((x) => <option key={x.s} value={x.s}>{x.l}</option>)}</select></Field>
            <Field label="Appeal must be decided within"><select className="field" value={at} onChange={(e) => setAt(Number(e.target.value))}>{WINDOWS.map((x) => <option key={x.s} value={x.s}>{x.l}</option>)}</select></Field>
          </div>
          <button className="btn btn-ox" disabled={!w.address || !ok || tx.busy} onClick={submit}>{tx.busy ? "Filing…" : "Post bond & file report"}</button>
          {me.data && <span className="ml-3 mono text-[12px] text-ink-2">balance {pts(me.data.balance)} pts</span>}
          <ClerkLog status={tx.status} hash={tx.hash} error={tx.error} />
        </div>
      </div>
      <aside className="space-y-4">
        <div className="specimen text-[14.5px]">
          <div className="tag">What happens next</div>
          <ol className="mt-2 list-decimal pl-5">
            <li>An AI screen admits or rejects the claim (no bond taken on rejection).</li>
            <li>Validators snapshot the reported page (sha256 + stored text). Later edits cannot whitewash it.</li>
            <li>Anyone triggers the examination before the deadline; validators must agree on the verdict and its quoted findings.</li>
            <li>Appeal window, then final. The outcome joins this work&apos;s public precedents.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="mono text-ink-2">Loading…</p>}><NewReport /></Suspense>;
}
