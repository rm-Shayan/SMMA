"use client";

import { useSyncExternalStore } from "react";
import {
  INITIAL_API_HEALTH,
  getApiHealthState,
  subscribeApiHealth,
  type ApiHealthState,
} from "@/services/apiHealth";

/**
 * Subscribes to the API reachability tracker maintained by the Axios
 * transport. `status === "offline"` means the backend could not be reached
 * and the UI is most likely rendering mock fallback data.
 */
export function useApiHealth(): ApiHealthState {
  return useSyncExternalStore(
    subscribeApiHealth,
    getApiHealthState,
    () => INITIAL_API_HEALTH,
  );
}
