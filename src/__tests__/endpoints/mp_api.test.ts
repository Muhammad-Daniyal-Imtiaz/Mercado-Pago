/**
 * mp_api.test.ts
 *
 * Integration tests for Mercado Pago API endpoints.
 */

// Mock the service layer to only test endpoint behavior
jest.mock('@/lib/mp/monitor', () => ({
  runMonitorCycle:        jest.fn(),
  getNotificationHistory: jest.fn(),
  getMonitorState:        jest.fn(),
}));

jest.mock('@/lib/mp/mpService', () => ({
  getPaymentById: jest.fn(),
}));

import { GET as getMonitor } from '@/app/api/mp/monitor/route';
import { GET as getPayment } from '@/app/api/mp/payment/[id]/route';
import { runMonitorCycle, getNotificationHistory, getMonitorState } from '@/lib/mp/monitor';
import { getPaymentById } from '@/lib/mp/mpService';
import { createMockRequest, parseResponse } from '../helpers/api';

describe('API Route › /api/mp/monitor', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns monitor cycle results and history', async () => {
        const mockNew = [{ id: 1, amount: 100 }];
        const mockHistory = [{ id: 1, amount: 100 }, { id: 0, amount: 50 }];
        const mockState = { isInitialized: true, totalResolved: 2 };

        (runMonitorCycle as jest.Mock).mockResolvedValue(mockNew);
        (getNotificationHistory as jest.Mock).mockReturnValue(mockHistory);
        (getMonitorState as jest.Mock).mockReturnValue(mockState);

        const res = await getMonitor();
        const { status, data } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data.new).toEqual(mockNew);
        expect(data.history).toEqual(mockHistory);
        expect(data.state.totalResolved).toBe(2);
    });

    it('handles service errors with 500 status', async () => {
        (runMonitorCycle as jest.Mock).mockRejectedValue(new Error('Monitor Failure'));

        const res = await getMonitor();
        const { status, data } = await parseResponse(res);

        expect(status).toBe(500);
        expect(data.error).toBeDefined();
    });
});

describe('API Route › /api/mp/payment/[id]', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns payment details for valid ID', async () => {
        const mockResult = { payment: { id: 123 }, payer: { name: 'TEST' }, netAmount: 100 };
        (getPaymentById as jest.Mock).mockResolvedValue(mockResult);

        const req = createMockRequest('http://api/mp/payment/123');
        const res = await getPayment(req, { params: Promise.resolve({ id: '123' }) });
        const { status, data } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data.payment.id).toBe(123);
        expect(data.payer.name).toBe('TEST');
    });

    it('returns 404 if payment not found', async () => {
        (getPaymentById as jest.Mock).mockResolvedValue(null);

        const req = createMockRequest('http://api/mp/payment/999');
        const res = await getPayment(req, { params: Promise.resolve({ id: '999' }) });
        const { status } = await parseResponse(res);

        expect(status).toBe(404);
    });

    it('returns 500 on service error', async () => {
        (getPaymentById as jest.Mock).mockRejectedValue(new Error('MP API down'));

        const req = createMockRequest('http://api/mp/payment/123');
        const res = await getPayment(req, { params: Promise.resolve({ id: '123' }) });
        const { status } = await parseResponse(res);

        expect(status).toBe(500);
    });
});
