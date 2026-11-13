import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { FREE_SCANS } from './config';
import { currentStreak, dayKey } from './dates';
import { sumMacros } from './nutrition';
import type { LogEntry, Macros, Profile } from './types';

const KEYS = {
  profile: 'munchly:profile',
  entries: 'munchly:entries',
  scansUsed: 'munchly:scansUsed',
  isPro: 'munchly:isPro',
};

/** Keep about four months of history on the phone. */
const KEEP_DAYS = 120;

interface StoreValue {
  ready: boolean;
  profile: Profile | null;
  entries: LogEntry[];
  scansUsed: number;
  isPro: boolean;
  scansLeft: number;
  canScan: boolean;
  streak: number;
  saveProfile: (p: Profile) => Promise<void>;
  addEntry: (e: Omit<LogEntry, 'id' | 'createdAt' | 'day'> & { day?: string }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  recordScan: () => Promise<void>;
  setPro: (value: boolean) => Promise<void>;
  resetAll: () => Promise<void>;
  entriesFor: (day: string) => LogEntry[];
  totalsFor: (day: string) => Macros;
}

const StoreContext = createContext<StoreValue | null>(null);

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Could not save', key, err);
  }
}

function pruneOld(entries: LogEntry[]): LogEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const cutoffKey = dayKey(cutoff);
  return entries.filter((e) => e.day >= cutoffKey);
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [scansUsed, setScansUsed] = useState(0);
  const [isPro, setIsPro] = useState(false);
  // Refs hold the latest values so quick successive saves never write stale data.
  const entriesRef = useRef<LogEntry[]>([]);
  const scansRef = useRef(0);

  useEffect(() => {
    (async () => {
      const [p, e, s, pro] = await Promise.all([
        readJson<Profile | null>(KEYS.profile, null),
        readJson<LogEntry[]>(KEYS.entries, []),
        readJson<number>(KEYS.scansUsed, 0),
        readJson<boolean>(KEYS.isPro, false),
      ]);
      const kept = pruneOld(e);
      entriesRef.current = kept;
      scansRef.current = s;
      setProfile(p);
      setEntries(kept);
      setScansUsed(s);
      setIsPro(pro);
      setReady(true);
    })();
  }, []);

  const saveProfile = useCallback(async (p: Profile) => {
    setProfile(p);
    await writeJson(KEYS.profile, p);
  }, []);

  const commitEntries = useCallback(async (next: LogEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
    await writeJson(KEYS.entries, next);
  }, []);

  const addEntry = useCallback<StoreValue['addEntry']>(
    async (input) => {
      const entry: LogEntry = { ...input, id: makeId(), createdAt: Date.now(), day: input.day ?? dayKey() };
      await commitEntries([...entriesRef.current, entry]);
    },
    [commitEntries],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      await commitEntries(entriesRef.current.filter((e) => e.id !== id));
    },
    [commitEntries],
  );

  const recordScan = useCallback(async () => {
    scansRef.current += 1;
    setScansUsed(scansRef.current);
    await writeJson(KEYS.scansUsed, scansRef.current);
  }, []);

  const setPro = useCallback(async (value: boolean) => {
    setIsPro(value);
    await writeJson(KEYS.isPro, value);
  }, []);

  const resetAll = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (err) {
      console.warn('Could not erase saved data', err);
    }
    entriesRef.current = [];
    scansRef.current = 0;
    setProfile(null);
    setEntries([]);
    setScansUsed(0);
    setIsPro(false);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const byDay = new Map<string, LogEntry[]>();
    for (const e of entries) {
      const list = byDay.get(e.day) ?? [];
      list.push(e);
      byDay.set(e.day, list);
    }
    const scansLeft = Math.max(0, FREE_SCANS - scansUsed);
    return {
      ready,
      profile,
      entries,
      scansUsed,
      isPro,
      scansLeft,
      canScan: isPro || scansLeft > 0,
      streak: currentStreak(new Set(byDay.keys())),
      saveProfile,
      addEntry,
      removeEntry,
      recordScan,
      setPro,
      resetAll,
      entriesFor: (day) => (byDay.get(day) ?? []).slice().sort((a, b) => a.createdAt - b.createdAt),
      totalsFor: (day) => sumMacros(byDay.get(day) ?? []),
    };
  }, [ready, profile, entries, scansUsed, isPro, saveProfile, addEntry, removeEntry, recordScan, setPro, resetAll]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
