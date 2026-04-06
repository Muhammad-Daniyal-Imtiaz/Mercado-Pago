/**
 * env.test.ts
 *
 * Verifies that the mandatory environment variables for the MP/ARCA monitor
 * are correctly configured in the runtime.
 */
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local (standard for Next.js)
config({ path: path.resolve(process.cwd(), '.env.local') });

describe('Environment Configuration › Mercado Pago', () => {
  it('should have MP_ACCESS_TOKEN configured', () => {
    expect(process.env.MP_ACCESS_TOKEN).toBeDefined();
    expect((process.env.MP_ACCESS_TOKEN as string).length).toBeGreaterThan(10);
  });
});

describe('Environment Configuration › ARCA / AFIP', () => {
  it('should have AFIP_CUIT configured', () => {
    expect(process.env.AFIP_CUIT).toBeDefined();
    expect(process.env.AFIP_CUIT!.replace(/\D/g, '').length).toBe(11);
  });

  it('should have certificate and key files in the root directory', () => {
    const certPath = path.resolve(process.cwd(), 'produccion_certificado.crt');
    const keyPath  = path.resolve(process.cwd(), 'produccion_privada.key');
    expect(fs.existsSync(certPath)).toBe(true);
    expect(fs.existsSync(keyPath)).toBe(true);
  });
});
