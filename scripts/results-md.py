"""Builds deployments/RESULTS.md from deployments/e2e-*.json and browser-demo.json."""
import json, glob, os
D = "deployments"
X = "https://explorer-studio.genlayer.com/transactions/"
st = json.load(open(f"{D}/studionet.json")); ver = json.load(open(f"{D}/verification.json"))
DESC = {"screens": "AI screen rejects vague registration and vague report (no stake taken)", "violation": "CC BY attribution missing -> VIOLATION, reward paid",
  "compliant": "credited copy -> COMPLIANT, reporter bond forfeited", "noncommercial": "poster shop sells CC BY-NC work -> VIOLATION",
  "inconclusive": "conflicting credit on the page -> INCONCLUSIVE, bond refunded", "upheld": "appeal without new evidence -> UPHELD, bond forfeited",
  "overturn": "reporter appeals with an exhibit -> first verdict OVERTURNED (COMPLIANT -> INCONCLUSIVE), bond returned", "uncompleted": "appeal never decided -> first verdict stands, bond forfeited",
  "registered": "appellant registers an attempt, round never completes -> bond split 50/50", "overlap": "exact normalized URL keys (fragment/case/path/query)",
  "changed-file": "report filed, snapshot stored", "changed-judge": "page edited after filing -> judged from stored snapshot",
  "concurrent": "4 wallets register + report at once, ids from tx results", "timeout": "judging deadline missed -> VOID, bond refunded"}
out = ["# LicenseCheck on-chain results (GenLayer Studionet, chain 61999)", "",
  f"Contract: `{st['contractAddress']}` (deploy tx [{st['deployTxHash'][:12]}…]({X}{st['deployTxHash']}))  ",
  f"Deployed-code sha256 `{ver.get('deployed_sha256', ver.get('commit_sha256'))}` matches commit `{ver.get('commit','')[:10]}`: **{ver.get('commit_matches_deployed')}** (see verification.json)", "",
  "Every write below was waited to FINALIZED and its effect verified by reading contract state. Earlier failed attempts are kept as `e2e-*-attempt*.json` for transparency.", "",
  "| Scenario | What it shows | All FINALIZED | All checks pass |", "|---|---|---|---|"]
files = sorted(f for f in glob.glob(f"{D}/e2e-*.json") if "attempt" not in f)
docs = [json.load(open(f)) for f in files]
for d in docs: out.append(f"| [{d['scenario']}](e2e-{d['scenario']}.json) | {DESC.get(d['scenario'],'')} | {d.get('all_finalized')} | {d.get('all_checks_pass')} |")
for d in docs:
    out += ["", f"## {d['scenario']}", "", DESC.get(d["scenario"], ""), "", "| Step | Actor | Result | Tx |", "|---|---|---|---|"]
    for s in d["steps"]:
        res = "expected revert" if s.get("expected") == "revert" else f"{s.get('execution')}" + (f" id={s['returned_id']}" if s.get("returned_id") is not None else "")
        out.append(f"| {s['step']} | {s['actor']} | {res} / {s.get('final_status', s.get('status'))} | [{s['tx'][:10]}…]({X}{s['tx']}) |")
    out += ["", "Checks:"] + [f"- {'PASS' if c['pass'] else 'FAIL'}: {c['check']}" for c in d["checks"]]
if os.path.exists(f"{D}/browser-demo.json"):
    b = json.load(open(f"{D}/browser-demo.json"))
    out += ["", "## Browser-originated demo (live site, injected EIP-1193 provider, signing in Node)", "", f"Site: {b['site']}", "", "| Step | Actor | UI outcome | Tx |", "|---|---|---|---|"]
    out += [f"| {s['step']} | {s['actor']} | {s['ui_outcome']} | [{(s['tx_from_ui'] or '')[:10]}…]({s['explorer']}) |" for s in b["steps"]]
    out += [""] + [f"- {'PASS' if c['pass'] else 'FAIL'}: {c['check']}" for c in b["checks"]] + ([f"- ERROR: {b['error']}"] if b.get("error") else [])
open(f"{D}/RESULTS.md", "w").write("\n".join(out) + "\n")
print(len(files), "scenarios")
