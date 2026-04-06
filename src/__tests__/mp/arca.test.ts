/**
 * arca.test.ts
 *
 * Unit tests for arcaService (ARCA/AFIP identity resolution).
 * @arcasdk/core is mocked to avoid real network calls.
 */

// First, mock the module BEFORE jest loads arcaService
jest.mock('@arcasdk/core', () => ({
  Arca: jest.fn().mockImplementation(() => ({
    registerScopeThirteenService: {
      getTaxpayerDetails: jest.fn(),
    },
  })),
  FileSystemTicketStorage: jest.fn(),
}));

// Mock fs to prevent certificate reading failure in CI
jest.mock('fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('MOCK_CERT_CONTENT'),
}));

import { Arca } from '@arcasdk/core';
import { getNameFromAfip, arca } from '@/lib/mp/arcaService';

const mockArcaInstance = (Arca as jest.MockedClass<typeof Arca>).mock.results[0].value as {
  registerScopeThirteenService: {
    getTaxpayerDetails: jest.Mock;
  };
};

describe('arcaService › getNameFromAfip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if CUIT is less than 11 digits', async () => {
    const result = await getNameFromAfip('123456789');
    expect(result).toBeNull();
  });

  it('extracts the name in "last name, first name" format from AFIP details', async () => {
    mockArcaInstance.registerScopeThirteenService.getTaxpayerDetails.mockResolvedValue({
      idPersona: 23326892599,
      datosGenerales: {
        apellido: 'ANDRADA',
        nombre:   'GUILLERMO DAVID',
      },
    });
    const result = await getNameFromAfip('23326892599');
    expect(result).toBe('ANDRADA GUILLERMO DAVID');
  });

  it('returns business name if it is a company', async () => {
    mockArcaInstance.registerScopeThirteenService.getTaxpayerDetails.mockResolvedValue({
      datosGenerales: {
        razonSocial: 'COTO C.I.C.S.A.',
      },
    });
    const result = await getNameFromAfip('30528503835');
    expect(result).toBe('COTO C.I.C.S.A.');
  });

  it('returns null if the service result is empty', async () => {
    mockArcaInstance.registerScopeThirteenService.getTaxpayerDetails.mockResolvedValue(null);
    const result = await getNameFromAfip('23326892599');
    expect(result).toBeNull();
  });

  it('returns null and does not throw on "Not enabled" error', async () => {
    mockArcaInstance.registerScopeThirteenService.getTaxpayerDetails.mockRejectedValue(
      new Error('Not enabled for this CUIT')
    );
    const result = await getNameFromAfip('23326892599');
    expect(result).toBeNull();
  });

  it('cleans non-numeric characters from CUIT before querying', async () => {
    mockArcaInstance.registerScopeThirteenService.getTaxpayerDetails.mockResolvedValue({
      datosGenerales: { razonSocial: 'TEST' },
    });
    await getNameFromAfip('23-32689259-9');
    expect(mockArcaInstance.registerScopeThirteenService.getTaxpayerDetails).toHaveBeenCalledWith(
      23326892599
    );
  });
});

describe('arcaService › module export', () => {
  it('exports the arca object (may be null if certs are missing)', () => {
    // arca can be null in CI without real certs; just checking export exists
    expect(arca !== undefined).toBe(true);
  });
});
