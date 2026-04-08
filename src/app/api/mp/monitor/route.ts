import { NextResponse } from 'next/server';
import { runMonitorCycle, getNotificationHistory, getMonitorState } from '@/lib/mp/monitor';

/**
 * GET /api/mp/monitor
 *
 * Runs a polling cycle on the MP account and returns:
 * - `new`: new notifications found in this cycle
 * - `history`: all notifications accumulated in memory (since startup)
 * - `state`: monitor metadata (isInitialized, totalResolved, etc.)
 *
 * Designed to be called periodically from the client (e.g., every 15s).
 */
export async function GET() {
  try {
    const newNotifications = await runMonitorCycle();
    return NextResponse.json({
      new:     newNotifications,
      history: getNotificationHistory(),
      state:   getMonitorState(),
    });
  } catch (error) {
    console.error('[API/mp/monitor] Error:', error);
    return NextResponse.json(
      { error: 'Error executing the monitor cycle' },
      { status: 500 }
    );
  }
}
