/**
 * monitor.ts
 *
 * MP payment monitor state utility.
 * Keeps `lastProcessedId` in memory (per Next.js process) and exposes
 * helpers for the API Route that serves as the monitor endpoint.
 *
 * In production, if real persistence across restarts is needed,
 * replace the in-memory variable with a Supabase table row.
 */

import { fetchNewNotifications, MPNotification } from './mpService';

// Global in-memory state (valid while the Node process is alive)
let lastProcessedId: number | null = null;
let isInitialized = false;

export interface MonitorState {
  lastProcessedId:  number | null;
  isInitialized:    boolean;
  totalResolved:    number;
}

// History of the last 100 notifications (ring buffer)
const MAX_HISTORY = 100;
let notificationHistory: MPNotification[] = [];

/**
 * Runs a polling cycle: fetches new payments, updates state, and returns notifications.
 * @returns Array of new notifications found in this cycle.
 */
export async function runMonitorCycle(): Promise<MPNotification[]> {
  const { notifications, latestId } = await fetchNewNotifications(lastProcessedId);

  if (!isInitialized) {
    // Initial call: only set the anchor ID
    lastProcessedId = latestId;
    isInitialized   = true;
    return [];
  }

  if (latestId !== null) {
    lastProcessedId = latestId;
  }

  if (notifications.length > 0) {
    // Prepend to history and trim to limit
    notificationHistory = [...notifications, ...notificationHistory].slice(0, MAX_HISTORY);
  }

  return notifications;
}

/**
 * Returns the full history of notifications accumulated in memory.
 * @returns Array of MPNotification objects.
 */
export function getNotificationHistory(): MPNotification[] {
  return notificationHistory;
}

/**
 * Resets the monitor (useful for testing).
 */
export function resetMonitor(): void {
  lastProcessedId      = null;
  isInitialized        = false;
  notificationHistory  = [];
}

/**
 * Returns the current state of the monitor for diagnostic purposes.
 * @returns MonitorState object.
 */
export function getMonitorState(): MonitorState {
  return {
    lastProcessedId,
    isInitialized,
    totalResolved: notificationHistory.length,
  };
}
