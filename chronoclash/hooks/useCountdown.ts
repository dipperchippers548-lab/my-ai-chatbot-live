import { useCallback, useEffect, useRef, useState } from 'react';

export interface Countdown {
  /** Whole seconds remaining (ceil), drives the UI. */
  seconds: number;
  getRemainingMs: () => number;
  /** Resets to `ms` (paused). */
  reset: (ms: number) => void;
  addMs: (ms: number) => void;
  /** Run while `true`; the owner derives this from all pause sources. */
  setRunning: (running: boolean) => void;
}

/**
 * Drift-free countdown: tracks a wall-clock deadline while running and a
 * frozen remainder while paused. `onExpire` fires once when it hits zero.
 */
export function useCountdown(initialMs: number, onExpire: () => void): Countdown {
  const remainingRef = useRef(initialMs);
  const deadlineRef = useRef<number | null>(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  const [seconds, setSeconds] = useState(Math.ceil(initialMs / 1000));
  const [running, setRunningState] = useState(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const getRemainingMs = useCallback(() => {
    if (deadlineRef.current === null) return remainingRef.current;
    return Math.max(0, deadlineRef.current - Date.now());
  }, []);

  const sync = useCallback(() => {
    const ms = getRemainingMs();
    setSeconds(Math.ceil(ms / 1000));
    if (ms <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      remainingRef.current = 0;
      deadlineRef.current = null;
      setRunningState(false);
      onExpireRef.current();
    }
  }, [getRemainingMs]);

  const setRunning = useCallback(
    (next: boolean) => {
      if (expiredRef.current) return;
      if (next && deadlineRef.current === null) {
        deadlineRef.current = Date.now() + remainingRef.current;
      } else if (!next && deadlineRef.current !== null) {
        remainingRef.current = Math.max(0, deadlineRef.current - Date.now());
        deadlineRef.current = null;
      }
      setRunningState(next);
    },
    [],
  );

  const reset = useCallback((ms: number) => {
    expiredRef.current = false;
    remainingRef.current = ms;
    deadlineRef.current = null;
    setRunningState(false);
    setSeconds(Math.ceil(ms / 1000));
  }, []);

  const addMs = useCallback(
    (ms: number) => {
      if (deadlineRef.current !== null) deadlineRef.current += ms;
      else remainingRef.current += ms;
      sync();
    },
    [sync],
  );

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(sync, 100);
    return () => clearInterval(id);
  }, [running, sync]);

  return { seconds, getRemainingMs, reset, addMs, setRunning };
}
