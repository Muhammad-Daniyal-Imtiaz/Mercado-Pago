import axios from 'axios';
import { getNameFromAfip } from './arcaService';
import { getOrganizationMPCredentials, getCurrentUserOrganizationMPCredentials } from './credentials';

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
 * @param accessToken Optional access token (uses env fallback if not provided).
 * @returns Array of MPPayment objects.
 */
export async function getRecentPayments(
  limit = 10,
  accessToken = MP_ACCESS_TOKEN
): Promise<MPPayment[]> {
  const token = accessToken || MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN is required');
  }

  const response = await axios.get<{ results: MPPayment[] }>(
    `${MP_API_BASE}/payments/search`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params:  { sort: 'date_created', criteria: 'desc', limit },
    }
  );
  return response.data.results ?? [];
}

/**
 * Get recent payments using organization credentials from database.
 * @param organizationId Organization ID to fetch credentials for.
 * @param limit Number of results to fetch.
 * @returns Array of MPPayment objects.
 */
export async function getRecentPaymentsForOrganization(
  organizationId: string,
  limit = 10
): Promise<MPPayment[]> {
  const creds = await getOrganizationMPCredentials(organizationId);
  if (!creds) {
    throw new Error('No MP credentials configured for this organization');
  }
  return getRecentPayments(limit, creds.accessToken);
}

/**
 * Returns full details for a specific payment, with payer info enriched by ARCA.
 * @param paymentId The unique payment ID.
 * @param accessToken Optional access token (uses env fallback if not provided).
 * @returns Details including payer info and net amount.
 */
export async function getPaymentById(
  paymentId: string | number,
  accessToken = MP_ACCESS_TOKEN
): Promise<{
  payment: MPPayment;
  payer:   MPPayerInfo;
  netAmount: number;
} | null> {
  const token = accessToken || MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN is required');
  }

  const response = await axios.get<MPPayment>(
    `${MP_API_BASE}/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const p         = response.data;
  const payer     = await getPayerInfo(p);
  const netAmount = p.transaction_details?.net_received_amount ?? p.transaction_amount;

  return { payment: p, payer, netAmount };
}

/**
 * Get payment details using organization credentials from database.
 * @param paymentId The unique payment ID.
 * @param organizationId Organization ID to fetch credentials for.
 * @returns Details including payer info and net amount.
 */
export async function getPaymentByIdForOrganization(
  paymentId: string | number,
  organizationId: string
): Promise<{
  payment: MPPayment;
  payer:   MPPayerInfo;
  netAmount: number;
} | null> {
  const creds = await getOrganizationMPCredentials(organizationId);
  if (!creds) {
    throw new Error('No MP credentials configured for this organization');
  }
  return getPaymentById(paymentId, creds.accessToken);
}

/**
 * Fetches all new payments since the last processed ID, enriches them,
 * and returns them as notification objects.
 * @param lastProcessedId The ID of the last processed payment.
 * @param limit Max search limit.
 * @param accessToken Optional access token (uses env fallback if not provided).
 * @returns New notifications and the updated latest ID.
 */
export async function fetchNewNotifications(
  lastProcessedId: number | null,
  limit = 5,
  accessToken = MP_ACCESS_TOKEN
): Promise<{ notifications: MPNotification[]; latestId: number | null }> {
  const payments = await getRecentPayments(limit, accessToken);

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

/**
 * Fetches new notifications using organization credentials from database.
 * @param lastProcessedId The ID of the last processed payment.
 * @param organizationId Organization ID to fetch credentials for.
 * @param limit Max search limit.
 * @returns New notifications and the updated latest ID.
 */
export async function fetchNewNotificationsForOrganization(
  lastProcessedId: number | null,
  organizationId: string,
  limit = 5
): Promise<{ notifications: MPNotification[]; latestId: number | null }> {
  const creds = await getOrganizationMPCredentials(organizationId);
  if (!creds) {
    throw new Error('No MP credentials configured for this organization');
  }
  return fetchNewNotifications(lastProcessedId, limit, creds.accessToken);
}
