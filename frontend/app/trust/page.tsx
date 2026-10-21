import Link from "next/link";

export const metadata = { title: "Rules & trust · LicenseCheck" };

const ATTACKS: [string, string][] = [
  ["Prompt injection (page, claim, clause, appeal grounds)", "Every untrusted string is wrapped by fence(), which replaces < and > so text can never close its fence; prompts say the fenced data is never instructions and require replies in English. Directional verdicts also need verbatim quotes that validators re-check deterministically."],
  ["Page swap after filing", "The reported page and the original are snapshotted by consensus (sha256 of normalized text + full stored text up to 12,000 chars, truncation flagged). At judging, a changed page is judged from the stored text and flagged; if stored text cannot reproduce its fingerprint, directional verdicts are blocked (INCONCLUSIVE)."],
  ["Fabricated or irrelevant quotes", "A finding survives only if its quote is verbatim in the source it cites. Validators re-derive the verdict, must agree on the term answer and reuse finding, reject contradictory labels on the same passage, and must independently find the decisive quote relevant and supporting the same verdict."],
  ["Sybil reporters", "Each report locks a 20–500 point bond; COMPLIANT forfeits it. One unresolved report per exact (work, term, URL) key; a final VIOLATION blocks re-reports of the same key. Starting points are once per wallet, so sybils still need fresh wallets (residual risk on a gasless testnet)."],
  ["Self-reporting / reward farming", "The VIOLATION reward (25 pts) is paid only from a pool funded by forfeited bonds, never minted, so farming can only redistribute what wrong reporters lost. A creator who hosts a fake copy can still farm the pool: residual risk, documented."],
  ["Front-running a registration", "First valid registration of an exact normalized URL wins. A squatter gains a card, not authorship: the optional on-page ownership marker shows who controls the original page. Wallet ≠ real creator."],
  ["Front-running a report", "A copycat report on the same key reverts while one is unresolved. IDs are assigned inside the transaction and returned in its result; the UI never guesses from counts."],
  ["Validator collusion", "Out of scope of the app: GenLayer's optimistic democracy (majority of validators, rotation on disagreement, network-level appeals). A colluding majority could pass a wrong verdict; the bonded appeal gives one stricter re-examination."],
  ["Appeal as an escape hatch", "Unpursued appeals never void a report: the first verdict stands and is settled; the bond is forfeited (or split if an attempt was recorded; returned only if consensus itself recorded a failed round)."],
];

export default function Trust() {
  return (
    <div className="space-y-8">
      <div className="card">
        <span className="tag">Rules &amp; trust model</span>
        <h1 className="mt-6 font-display text-4xl">How a verdict is reached, and what it does not prove</h1>
        <p className="mt-3 max-w-3xl">
          LicenseCheck is an experiment on GenLayer Studionet. Points are <b>non-monetary</b> registry points. Verdicts are machine readings of public
          pages against chosen license terms. They are <b>not legal advice</b> and not a court finding. The full model with attack table and residual
          risks is in <a className="ink-link" href="https://github.com/DikaCream/LicenseCheck/blob/main/docs/TRUST_MODEL.md">docs/TRUST_MODEL.md</a>.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="specimen">
          <div className="tag">Sources</div>
          <ul className="mt-2 list-disc pl-5 text-[14.5px]">
            <li>Source 0: the registered original (snapshot locked at registration).</li>
            <li>Source 1: the reported page (snapshot taken when the report is admitted).</li>
            <li>Source 2: an optional appeal exhibit (snapshot taken at appeal).</li>
            <li>The reporter&apos;s claim and appeal grounds are allegations, never evidence.</li>
          </ul>
        </div>
        <div className="specimen">
          <div className="tag">What validators must agree on</div>
          <ul className="mt-2 list-disc pl-5 text-[14.5px]">
            <li>Snapshots: identical sha256, stored text and truncation flag (strict schema).</li>
            <li>The verdict label, which sources changed or are incomplete.</li>
            <li>For VIOLATION / COMPLIANT: the term answer, whether the page reuses the work, every quote verbatim, no contradictory reading, and the decisive quote supports the verdict. A VIOLATION must be decided by a quote from the reported page.</li>
            <li>Disagreement → leader rotation → UNDETERMINED: nothing is recorded; retry before the deadline.</li>
          </ul>
        </div>
        <div className="specimen">
          <div className="tag">Points</div>
          <ul className="mt-2 list-disc pl-5 text-[14.5px]">
            <li>1000 starting points per wallet, once. Registration is free.</li>
            <li>Report bond 20–500: VIOLATION → refunded + up to 25 pts from the pool; INCONCLUSIVE → refunded; COMPLIANT → pool.</li>
            <li>Appeal bond 100: verdict changed → returned; upheld or never pursued → pool; attempt recorded → split; consensus failure recorded → returned.</li>
            <li>Invariant shown live on the registry: balances + escrow + pool = minted.</li>
          </ul>
        </div>
        <div className="specimen">
          <div className="tag">Deadlines (every stage)</div>
          <ul className="mt-2 list-disc pl-5 text-[14.5px]">
            <li>Examination deadline: missed → anyone expires, report VOID, bond refunded (network failure is not the reporter&apos;s fault).</li>
            <li>Appeal window: closed → anyone finalizes the first verdict.</li>
            <li>Appeal decision deadline (+10 min grace per recorded attempt, max 3): missed → first verdict stands.</li>
          </ul>
        </div>
      </div>

      <div>
        <h2 className="font-display text-3xl">Attack table</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full bg-card text-[14px]">
            <tbody>
              {ATTACKS.map(([a, m]) => (
                <tr key={a} className="border-t border-ruled align-top"><td className="w-1/3 p-3 narrow font-bold uppercase tracking-wider text-[12.5px]">{a}</td><td className="p-3">{m}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="specimen">
        <div className="tag">Integrity is not authenticity</div>
        <p className="mt-2 text-[14.5px]">
          The snapshots prove what a URL served at a moment, as agreed by validators. They do not prove who wrote the work, who owns the domain, or that
          the original predates the copy. A wallet address is not a real-world identity. The optional <code className="mono">licensecheck:&lt;wallet&gt;</code> marker
          only proves control of the original page&apos;s content at registration time.
        </p>
      </div>
      <p className="mono text-[12px] text-ink-2"><Link className="ink-link" href="/">Back to the registry</Link></p>
    </div>
  );
}
