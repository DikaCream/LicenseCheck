"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTRACT_ADDRESS, addressExplorerUrl, START_POINTS } from "@/lib/config";
import { pts, shortAddress } from "@/lib/format";
import { useTx, useUser } from "@/lib/hooks";
import { getUser } from "@/lib/contract";
import { useWallet } from "@/lib/WalletProvider";
import { ClerkLog } from "./ui";

const NAV = [
  { href: "/", label: "Registry" },
  { href: "/register", label: "Register a work" },
  { href: "/reports", label: "Reports" },
  { href: "/trust", label: "Rules & trust" },
];

export function Masthead() {
  const path = usePathname();
  const w = useWallet();
  const user = useUser(w.address);
  const tx = useTx();
  const needsPoints = !!w.address && user.data && !user.data.claimed_start;
  return (
    <header>
      <div className="drawer px-4 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="brass flex items-center gap-3 px-3 py-2">
            <span className="brass-slot px-4 py-1.5">
              <span className="font-display text-2xl leading-none sm:text-3xl">License<i className="text-oxblood">Check</i></span>
            </span>
            <span className="hidden narrow text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d2a12] sm:block">Public license<br />registry</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mono text-[12px] text-card">
            {w.address && user.data && <span className="rounded-sm border border-card/50 px-2 py-1" title="Non-monetary registry points">{pts(user.data.balance)} pts</span>}
            {needsPoints && (
              <button className="btn btn-ox !px-3 !py-1.5" disabled={tx.busy} onClick={() => tx.run("claim_points", [], { key: "claim_points", verify: async () => ((await getUser(w.address as string)).claimed_start ? null : "points not credited") })}>
                Claim {pts(START_POINTS)} pts
              </button>
            )}
            {w.address && !w.isCorrectChain && <button className="btn btn-ox !px-3 !py-1.5" onClick={w.switchChain}>Switch to Studionet</button>}
            {w.address ? (
              <button className="btn !px-3 !py-1.5" onClick={w.disconnect} title="Disconnect">{shortAddress(w.address)} ✕</button>
            ) : (
              <button className="btn !px-3 !py-1.5" onClick={w.connect} disabled={w.isConnecting}>
                {w.isConnecting ? "Connecting…" : w.isMetaMaskAvailable ? "Connect MetaMask" : "Install MetaMask"}
              </button>
            )}
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-1">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`tab-divider narrow text-[13px] font-bold uppercase tracking-[0.12em] ${active ? "!bg-card text-ink" : "!bg-card-2/70 text-ink-2 hover:text-ink"}`}>
                {n.label}
              </Link>
            );
          })}
          {CONTRACT_ADDRESS && (
            <a className="ml-auto self-end mono text-[11px] text-card/80 underline" href={addressExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
              contract {shortAddress(CONTRACT_ADDRESS)}
            </a>
          )}
        </nav>
      </div>
      {(w.error || tx.error) && <p className="mt-2 text-right mono text-[12px] text-oxblood">{w.error || tx.error}</p>}
      {tx.status && <ClerkLog status={tx.status} hash={tx.hash} error={tx.error} />}
    </header>
  );
}
