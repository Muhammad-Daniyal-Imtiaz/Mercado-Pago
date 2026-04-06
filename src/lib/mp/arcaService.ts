import { Arca, FileSystemTicketStorage } from '@arcasdk/core';
import fs from 'fs';
import path from 'path';
import {
  ArcaInstance,
  ArcaOptions,
  ArcaTicketStorage,
  FileSystemTicketStorageOptions,
  AfipTaxpayerBase,
  TaxpayerDetailsResponse
} from './types';

/**
 * Initializes the ARCA (ex AFIP) instance with mandatory certificates.
 * @returns An ArcaInstance or null if certificates are missing.
 */
function createArcaInstance(): ArcaInstance | null {
  try {
    const certPath = path.join(process.cwd(), 'produccion_certificado.crt');
    const keyPath = path.join(process.cwd(), 'produccion_privada.key');

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.warn('[ARCA] Certificates not found. ARCA service will be disabled.');
      return null;
    }

    const options: ArcaOptions = {
      cuit: Number(process.env.AFIP_CUIT ?? 0),
      cert: fs.readFileSync(certPath, 'utf8'),
      key: fs.readFileSync(keyPath, 'utf8'),
      production: true,
      ticketStorage: new (FileSystemTicketStorage as unknown as { new(o: FileSystemTicketStorageOptions): ArcaTicketStorage })(
        { ticketFolder: process.cwd() }
      ),
    };

    return new (Arca as unknown as { new(o: ArcaOptions): ArcaInstance })(options);
  } catch (err) {
    console.error('[ARCA] Instance initialization error:', err);
    return null;
  }
}

// Singleton – instantiated once at module load (server-side only)
const arca = createArcaInstance();

/**
 * Given a CUIT/CUIL string, looks for the real name in the ARCA (ex AFIP) registry.
 * @param cuitString Tax identification number (CUIT/CUIL).
 * @returns Real name or null if resolution fails.
 */
export async function getNameFromAfip(cuitString: string): Promise<string | null> {
  if (!arca) return null;

  try {
    const taxId = cuitString.replace(/\D/g, '');
    if (!taxId || taxId.length < 11) return null;

    const resp = await arca.registerScopeThirteenService.getTaxpayerDetails(Number(taxId));
    if (!resp) return null;

    // A13 returns nested structures – we explore all known variants
    const r = resp as TaxpayerDetailsResponse;
    const p = r.taxpayerDetails ?? r.personaReturn ?? r;
    const persona = (p.persona ?? p.datosGenerales ?? p) as AfipTaxpayerBase;

    const name: string | null =
      persona.razonSocial ??
      persona.nombreCompleto ??
      (persona.nombre && persona.apellido
        ? `${persona.apellido} ${persona.nombre}`
        : null) ??
      persona.nombre ??
      persona.apellido ??
      persona.description ??
      persona.businessName ??
      null;

    return name;
  } catch (error) {
    const msg = (error as Error).message ?? String(error);
    if (msg.includes('No habilitado')) {
      console.log('[ARCA] A13 service not enabled for this CUIT yet. (Takes ~20 min to activate)');
    } else {
      console.error(`[ARCA Error]: ${msg}`);
    }
    return null;
  }
}

export { arca };
