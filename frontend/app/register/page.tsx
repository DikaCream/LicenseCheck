"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LICENSES, verifiers } from "@/lib/contract";
import { useTx } from "@/lib/hooks";
import { useWallet } from "@/lib/WalletProvider";
import { ClerkLog, Field, LicenseBadge, SectionTitle, licenseNote } from "@/components/ui";

export default function RegisterWork() {
  const w = useWallet();
  const tx = useTx();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [license, setLicense] = useState<string>("CC-BY-NC");
  const [clauses, setClauses] = useState<string[]>([]);
  const clean = clauses.map((c) => c.trim()).filter(Boolean);
  const valid = title.trim().length >= 4 && /^https:\/\//i.test(url.trim()) && clean.every((c) => c.length >= 10 && c.length <= 240);

  async function submit() {
    const t = title.trim().split(/\s+/).join(" ");
    const res = await tx.run("register_work", [t, url.trim(), license, clean], {
      key: `register_work:${url.trim().toLowerCase()}`,
      verify: (r) => verifiers.registered(w.address as string, t, r),
    });
    const id = res ? Number(res.values.id) : NaN; // the id comes from THIS transaction's result, never a pre-read count
    if (Number.isInteger(id)) router.push(`/work/${id}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="card">
        <div className="flex justify-between"><span className="tag">Accession form · new work</span><span className="mono text-[11px] text-ink-2">free · AI-screened</span></div>
        <div className="mt-8 space-y-5">
          <Field label="Title of the work" hint="As it appears on the original page. 4–120 characters.">
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Harbor Lights, a poem by Mira Okafor" maxLength={120} />
          </Field>
          <Field label="Canonical URL of the original" hint="https only. Validators snapshot this page now; the snapshot (sha256 + up to 12,000 chars) is locked with the license.">
            <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="License">
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LICENSES.map((l) => (
                <button key={l} type="button" onClick={() => setLicense(l)} className={`border px-2 py-3 text-left ${license === l ? "border-ink bg-card-2" : "border-ruled"}`}>
                  <LicenseBadge license={l} />
                  <span className="mt-2 block text-[12px] leading-tight text-ink-2">{licenseNote(l)}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Custom clauses (optional, up to 3)`} hint="Concrete and checkable from a public page, e.g. “Credit must include a link to the original.” Vague clauses are rejected by the AI screen.">
            {clauses.map((c, i) => (
              <div key={i} className="mt-2 flex gap-2">
                <input className="field" value={c} onChange={(e) => setClauses(clauses.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Clause ${i + 1}`} maxLength={240} />
                <button type="button" className="mono text-oxblood" onClick={() => setClauses(clauses.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            {clauses.length < 3 && <button type="button" className="ink-link mt-2 mono text-[13px]" onClick={() => setClauses([...clauses, ""])}>+ add a clause</button>}
          </Field>
          <div className="pt-2">
            <button className="btn" disabled={!w.address || !valid || tx.busy} onClick={submit}>
              {tx.busy ? "Filing…" : "File this card"}
            </button>
            {!w.address && <span className="ml-3 mono text-[12px] text-ink-2">Connect MetaMask to register.</span>}
          </div>
          <ClerkLog status={tx.status} hash={tx.hash} error={tx.error} />
        </div>
      </div>
      <aside className="space-y-5">
        <div className="specimen">
          <div className="tag">What gets locked</div>
          <ul className="mt-2 list-disc pl-5 text-[14.5px]">
            <li>Title, canonical URL, license and clauses: immutable after registration.</li>
            <li>A consensus snapshot of the original page: sha256 of its normalized text and the full stored text window.</li>
            <li>One registration per exact normalized URL (fragment removed, host lowercased; path and query kept).</li>
          </ul>
        </div>
        <div className="specimen">
          <div className="tag">Ownership is not identity</div>
          <p className="mt-2 text-[14.5px]">
            A wallet is not proof that you created the work. Optionally publish <code className="mono">licensecheck:&lt;your wallet address&gt;</code> on
            the original page before registering: the card then shows an ownership marker, which proves only control of that page&apos;s content at
            registration time.
          </p>
        </div>
        <SectionTitle>Not legal advice</SectionTitle>
        <p className="text-[14.5px] text-ink-2">LicenseCheck records machine-judged readings of public pages against the terms you choose. It does not replace a lawyer or a court.</p>
      </aside>
    </div>
  );
}
