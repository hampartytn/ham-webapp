/** Yield to the browser so user-driven navigation always runs first. */

export type CancelIdle = () => void;

/**
 * Run `work` after the current input/navigation turn.
 * Uses `requestIdleCallback` when available; otherwise a macrotask via MessageChannel
 * (not a timed delay).
 */
export function scheduleIdle(work: () => void): CancelIdle {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(() => work());
    return () => cancelIdleCallback(id);
  }

  const channel = new MessageChannel();
  let cancelled = false;
  channel.port1.onmessage = () => {
    if (!cancelled) work();
  };
  channel.port2.postMessage(null);
  return () => {
    cancelled = true;
  };
}

let navDataPrefetchCancel: CancelIdle | null = null;

/** Latest hover target wins; cancelled on pointerdown so the click's RSC wins. */
export function scheduleNavDataPrefetch(work: () => void): void {
  navDataPrefetchCancel?.();
  navDataPrefetchCancel = scheduleIdle(() => {
    navDataPrefetchCancel = null;
    work();
  });
}

export function cancelNavDataPrefetch(): void {
  navDataPrefetchCancel?.();
  navDataPrefetchCancel = null;
}
