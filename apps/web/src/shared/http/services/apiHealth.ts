/**
 * Tiny observable store that tracks whether the backend is reachable.
 *
 * The Axios interceptor reports every network-level failure (no response at
 * all — connection refused, DNS failure, timeout) as "offline". Screens that
 * fall back to mock data can then surface a `<DemoDataBadge />` so the user
 * knows the numbers they see are not live.
 */

export type ApiHealthStatus = "unknown" | "online" | "offline";

export interface ApiHealthState {
  status: ApiHealthStatus;
  /** Epoch ms of the last successful API response. */
  lastSuccessAt: number | null;
  /** Epoch ms of the last network-level failure. */
  lastFailureAt: number | null;
  /** Human readable reason for the last failure. */
  lastErrorMessage: string | null;
}

export const INITIAL_API_HEALTH: ApiHealthState = {
  status: "unknown",
  lastSuccessAt: null,
  lastFailureAt: null,
  lastErrorMessage: null,
};

let state: ApiHealthState = INITIAL_API_HEALTH;
const listeners = new Set<(next: ApiHealthState) => void>();

export function getApiHealthState(): ApiHealthState {
  return state;
}

export function subscribeApiHealth(listener: (next: ApiHealthState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setState(next: ApiHealthState): void {
  state = next;
  listeners.forEach((listener) => listener(state));
}

/** Called by the Axios interceptor for every successful response. */
export function markApiOnline(): void {
  if (state.status === "online" && state.lastErrorMessage === null) return;
  setState({
    ...state,
    status: "online",
    lastSuccessAt: Date.now(),
    lastErrorMessage: null,
  });
}

/** Called by the Axios interceptor when the request never reached the API. */
export function markApiOffline(message: string): void {
  setState({
    ...state,
    status: "offline",
    lastFailureAt: Date.now(),
    lastErrorMessage: message,
  });
}

/** Resets the tracker (e.g. after a successful login). */
export function resetApiHealth(): void {
  setState({ ...INITIAL_API_HEALTH });
}

/** True when the backend is known to be unreachable. */
export function isApiOffline(): boolean {
  return state.status === "offline";
}
