import axios from 'axios';
import { getNameFromAfip } from './arcaService';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? '';
const MP_API_BASE     = 'https://api.mercadopago.com/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MPPayerInfo {
  display: string;
  name:    string;
  id:      string;
  email:   string;
}

export interface MPPayment {
  id:                   number;
  date_created:         string;
  status:               string;
  status_detail:        string;
  currency_id:          string;
  transaction_amount:   number;
  description:          string | null;
  payment_method_id:    string;
  payment_type_id:      string;
  payer: {
    id:             number;
    first_name?:    string;
    last_name?:     string;
    email?:         string;
    identification?: {
      type:   string;
      number: string;
    };
  };
  point_of_interaction?: {
    transaction_data?: {
      payer?: {
        long_name?: string;
        name?:      string;
      };
    };
  };
  transaction_details?: {
    net_received_amount?: number;
  };
}

export interface MPNotification {
  id:          number;
  dateCreated: string;
  status:      string;
  statusDetail:string;
  amount:      number;
  netAmount:   number;
  currency:    string;
  description: string;
  payerName:   string;
  payerEmail:  string;
  payerId:     string;
  paymentMethod: string;
  paymentType:   string;
  resolvedAt:    string; // ISO timestamp taken when the notification was resolved
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts the best available information about the payer, enriching with ARCA if possible.
 * @param p The raw Mercado Pago payment object.
 * @returns Refined payer information.
 */
export async function getPayerInfo(p: MPPayment): Promise<MPPayerInfo> {
  const poiPayer = p.point_of_interaction?.transaction_data?.payer;
  let sourceName: string | null =
    poiPayer?.long_name ??
    poiPayer?.name ??
    (p.payer?.first_name ? `${p.payer.first_name} ${p.payer.last_name ?? ''}`.trim() : null);

  const sourceEmail    = p.payer?.email ?? 'N/A';
  const identification = p.payer?.identification?.number ?? null;
  const idDisplay      = identification
    ? `${p.payer.identification!.type}: ${identification}`
    : null;

  // If we don't have a name but we have a CUIT/CUIL → consult ARCA
  if (
    !sourceName &&
    identification &&
    (p.payer.identification!.type === 'CUIT' || p.payer.identification!.type === 'CUIL')
  ) {
    const afipName = await getNameFromAfip(identification);
    if (afipName) sourceName = afipName;
  }

  const displayName = sourceName ?? idDisplay ?? 'Unknown';

  return {
    display: `${displayName} (${sourceEmail})`,
    name:    sourceName ?? 'N/A',
    id:      idDisplay  ?? 'N/A',
    email:   sourceEmail,
  };
}

// ─── Public Service ─────────────────────────────────────────────────────────

/**
 * Returns the last N payments from the account (descending by date).
 * @param limit Number of results to fetch.
 * @returns Array of MPPayment objects.
 */
export async function getRecentPayments(limit = 10): Promise<MPPayment[]> {
  const response = await axios.get<{ results: MPPayment[] }>(
    `${MP_API_BASE}/payments/search`,
    {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      params:  { sort: 'date_created', criteria: 'desc', limit },
    }
  );
  return response.data.results ?? [];
}

/**
 * Returns full details for a specific payment, with payer info enriched by ARCA.
 * @param paymentId The unique payment ID.
 * @returns Details including payer info and net amount.
 */
export async function getPaymentById(paymentId: string | number): Promise<{
  payment: MPPayment;
  payer:   MPPayerInfo;
  netAmount: number;
} | null> {
  const response = await axios.get<MPPayment>(
    `${MP_API_BASE}/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
  );

  const p         = response.data;
  const payer     = await getPayerInfo(p);
  const netAmount = p.transaction_details?.net_received_amount ?? p.transaction_amount;

  return { payment: p, payer, netAmount };
}

/**
 * Fetches all new payments since the last processed ID, enriches them,
 * and returns them as notification objects.
 * @param lastProcessedId The ID of the last processed payment.
 * @param limit Max search limit.
 * @returns New notifications and the updated latest ID.
 */
export async function fetchNewNotifications(
  lastProcessedId: number | null,
  limit = 5
): Promise<{ notifications: MPNotification[]; latestId: number | null }> {
  const payments = await getRecentPayments(limit);

  if (!payments.length) return { notifications: [], latestId: lastProcessedId };

  // Initial call: only set the anchor ID
  if (lastProcessedId === null) {
    return { notifications: [], latestId: payments[0].id };
  }

  // Filter only those newer than the anchor ID
  const newPayments: MPPayment[] = [];
  for (const p of payments) {
    if (p.id === lastProcessedId) break;
    newPayments.push(p);
  }

  const notifications: MPNotification[] = [];

  for (const p of newPayments.reverse()) {
    if (p.status !== 'approved') continue;

    const payer     = await getPayerInfo(p);
    const netAmount = p.transaction_details?.net_received_amount ?? p.transaction_amount;

    notifications.push({
      id:            p.id,
      dateCreated:   p.date_created,
      status:        p.status,
      statusDetail:  p.status_detail,
      amount:        p.transaction_amount,
      netAmount,
      currency:      p.currency_id,
      description:   p.description ?? 'Transfer / Payment',
      payerName:     payer.name,
      payerEmail:    payer.email,
      payerId:       payer.id,
      paymentMethod: p.payment_method_id,
      paymentType:   p.payment_type_id,
      resolvedAt:    new Date().toISOString(),
    });
  }

  return {
    notifications,
    latestId: payments[0].id,
  };
}
