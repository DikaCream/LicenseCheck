"use client";

import { useCallback, useEffect, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ADDRESS } from "./config";
import {
  getConfig, getReport, getReports, getWorkSnapshot, getRounds, getSnapshots, getStats, getUser, getWork, getWorkReports, getWorks, sendTx, TxError,
  type TxOptions, type TxResult,
} from "./contract";
import { getProvider } from "./wallet";
import { useWallet } from "./WalletProvider";

const enabled = !!CONTRACT_ADDRESS;
export const PAGE_SIZE = 12;

/** Newest-first registry, one bounded page per request; "Load more" walks the full history via next_offset. */
export const useWorks = (includeRejected: boolean) =>
  useInfiniteQuery({
    queryKey: ["lc", "works", includeRejected],
    queryFn: ({ pageParam }) => getWorks(pageParam, PAGE_SIZE, includeRejected),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.next_offset >= 0 ? last.next_offset : undefined),
    enabled,
    refetchInterval: 30_000,
  });

export const useReports = (status: string) =>
  useInfiniteQuery({
    queryKey: ["lc", "reports", status],
    queryFn: ({ pageParam }) => getReports(status, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.next_offset >= 0 ? last.next_offset : undefined),
    enabled,
    refetchInterval: 30_000,
  });

export const useWorkReports = (id: number | null) =>
  useInfiniteQuery({
    queryKey: ["lc", "work-reports", id],
    queryFn: ({ pageParam }) => getWorkReports(id as number, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.next_offset >= 0 ? last.next_offset : undefined),
    enabled: enabled && id !== null,
    refetchInterval: 20_000,
  });

export const useWork = (id: number | null) =>
  useQuery({ queryKey: ["lc", "work", id], queryFn: () => getWork(id as number), enabled: enabled && id !== null });
export const useReport = (id: number | null) =>
  useQuery({ queryKey: ["lc", "report", id], queryFn: () => getReport(id as number), enabled: enabled && id !== null, refetchInterval: 8_000 });
export const useRounds = (id: number | null, rounds: number) =>
  useQuery({ queryKey: ["lc", "rounds", id, rounds], queryFn: () => getRounds(id as number), enabled: enabled && id !== null && rounds > 0 });
export const useSnapshots = (id: number | null) =>
  useQuery({ queryKey: ["lc", "snaps", id], queryFn: () => getSnapshots(id as number), enabled: enabled && id !== null });
export const useUser = (user: string | null) =>
  useQuery({ queryKey: ["lc", "user", user], queryFn: () => getUser(user as string), enabled: enabled && !!user, refetchInterval: 20_000 });
export const useStats = () => useQuery({ queryKey: ["lc", "stats"], queryFn: getStats, enabled, refetchInterval: 15_000 });

export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Runs one contract write with live consensus status. Busy for the whole operation (no double submit). */
export function useTx() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (functionName: string, args: unknown[], opts?: TxOptions): Promise<TxResult | null> => {
      const provider = getProvider();
      if (!address || !provider) {
        setError("Connect MetaMask first");
        return null;
      }
      setBusy(true);
      setError(null);
      setHash(null);
      setStatus("SIGNING");
      try {
        return await sendTx(address, provider, functionName, args, { onHash: setHash, onStatus: setStatus }, opts);
      } catch (e: any) {
        if (e instanceof TxError && e.hash) setHash(e.hash);
        setError(friendlyError(e));
        return null;
      } finally {
        setBusy(false);
        queryClient.invalidateQueries({ queryKey: ["lc"] });
      }
    },
    [address, queryClient],
  );
  const reset = useCallback(() => { setStatus(null); setHash(null); setError(null); }, []);
  return { run, status, hash, error, busy, reset };
}

export function friendlyError(e: any): string {
  if (e?.code === 4001 || /user rejected|denied/i.test(e?.message ?? "")) {
    if (!(e instanceof TxError)) return "Transaction was rejected in your wallet";
  }
  return e?.shortMessage || e?.message || "Something went wrong";
}

export const useConfig = () => useQuery({ queryKey: ["lc", "config"], queryFn: getConfig, enabled, staleTime: Infinity });
export const useWorkSnapshot = (id: number | null, on: boolean) =>
  useQuery({ queryKey: ["lc", "work-snap", id], queryFn: () => getWorkSnapshot(id as number), enabled: enabled && id !== null && on });
