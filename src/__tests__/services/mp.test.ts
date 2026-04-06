/**
 * mp.test.ts
 *
 * Unit tests for mpService (Mercado Pago interaction).
 * axios is mocked to avoid real network calls.
 */
import axios from 'axios';
import { getRecentPayments, getPaymentById, fetchNewNotifications } from '@/lib/mp/mpService';
import { getNameFromAfip } from '@/lib/mp/arcaService';

// Mock arcaService to avoid its own overhead
jest.mock('@/lib/mp/arcaService', () => ({
    getNameFromAfip: jest.fn(),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('mpService › getRecentPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches payments from Mercado Pago API and returns results', async () => {
    const mockPayments = [{ id: 1, transaction_amount: 100, status: 'approved' }];
    mockedAxios.get.mockResolvedValue({ data: { results: mockPayments } });

    const result = await getRecentPayments(1);
    
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/payments/search'),
      expect.objectContaining({
        params: expect.objectContaining({ limit: 1 })
      })
    );
    expect(result).toEqual(mockPayments);
  });

  it('returns empty array if results are missing', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} });
    const result = await getRecentPayments();
    expect(result).toEqual([]);
  });
});

describe('mpService › getPaymentById', () => {
  it('enriches payment data with payer info from poi', async () => {
    const mockPayment = {
      id: 123,
      transaction_amount: 100,
      currency_id: 'ARS',
      point_of_interaction: {
        transaction_data: {
          payer: { long_name: 'TEST USER' }
        }
      }
    };
    mockedAxios.get.mockResolvedValue({ data: mockPayment });

    const result = await getPaymentById(123);
    
    expect(result?.payer.name).toBe('TEST USER');
    expect(result?.netAmount).toBe(100);
  });

  it('calls arcaService if name is missing but CUIT is present', async () => {
    const mockPayment = {
      id: 123,
      payer: {
        identification: { type: 'CUIT', number: '20123456789' }
      }
    };
    mockedAxios.get.mockResolvedValue({ data: mockPayment });
    (getNameFromAfip as jest.Mock).mockResolvedValue('ARCA RESOLVED NAME');

    const result = await getPaymentById(123);
    
    expect(getNameFromAfip).toHaveBeenCalledWith('20123456789');
    expect(result?.payer.name).toBe('ARCA RESOLVED NAME');
  });
});

describe('mpService › fetchNewNotifications', () => {
    it('returns only new payments since lastProcessedId', async () => {
        const mockPayments = [
            { id: 300, status: 'approved', date_created: '2024-01-01', transaction_amount: 10 },
            { id: 200, status: 'approved', date_created: '2024-01-01', transaction_amount: 10 },
            { id: 100, status: 'approved', date_created: '2024-01-01', transaction_amount: 10 }
        ];
        mockedAxios.get.mockResolvedValue({ data: { results: mockPayments } });

        // Last processed was 100
        const result = await fetchNewNotifications(100);
        
        // Should contain 200 and 300
        expect(result.notifications.length).toBe(2);
        expect(result.notifications[0].id).toBe(200);
        expect(result.notifications[1].id).toBe(300);
        expect(result.latestId).toBe(300);
    });
});
