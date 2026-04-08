import { NextResponse } from 'next/server';
import { getPaymentById } from '@/lib/mp/mpService';

/**
 * GET /api/mp/payment/[id]
 *
 * Retrieves full payment details and payer identity for a given MP payment ID.
 * Returns 404 if not found.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await getPaymentById(id);
    if (!result) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API/mp/payment/${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error fetching the payment information' },
      { status: 500 }
    );
  }
}
