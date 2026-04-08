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
 * Carga certificados AFIP desde archivos locales (desarrollo) o variables de entorno (producción)
 * @returns {cert: string, key: string} o null si no se encuentran los certificados
 */
function loadCertificates(): { cert: string; key: string } | null {
  try {
    // No cargar certificados durante el build
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_PHASE === 'phase-development-build') {
      console.log('[ARCA] Skipping certificate loading during build phase');
      return null;
    }
    
    // En producción (Vercel), usar variables de entorno
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV) {
      const crtBase64 = process.env.AFIP_PROD_CERTIFICATE_CRT || process.env.AFIP_CERTIFICATE_CRT;
      const keyBase64 = process.env.AFIP_PROD_PRIVATE_KEY || process.env.AFIP_PRIVATE_KEY;
      
      if (!crtBase64 || !keyBase64) {
        console.warn('[ARCA] Environment variables for certificates not found');
        return null;
      }
      
      const cert = Buffer.from(crtBase64, 'base64').toString();
      const key = Buffer.from(keyBase64, 'base64').toString();
      
      return { cert, key };
    }
    
    // En desarrollo local, usar archivos físicos
    const certPath = path.join(process.cwd(), 'produccion_certificado.crt');
    const keyPath = path.join(process.cwd(), 'produccion_privada.key');
    
    console.log('[ARCA] Looking for certificates at:', { certPath, keyPath, cwd: process.cwd() });
    
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.warn('[ARCA] Certificate files not found');
      return null;
    }
    
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    
    return { cert, key };
  } catch (error) {
    console.error('[ARCA] Error loading certificates:', error);
    return null;
  }
}

/**
 * Initializes the ARCA (ex AFIP) instance with mandatory certificates.
 * @returns An ArcaInstance or null if certificates are missing.
 */
function createArcaInstance(): ArcaInstance | null {
  try {
    const certificates = loadCertificates();
    
    if (!certificates) {
      console.warn('[ARCA] Certificates not found. ARCA service will be disabled.');
      return null;
    }

    const options: ArcaOptions = {
      cuit: Number(process.env.AFIP_CUIT ?? 0),
      cert: certificates.cert,
      key: certificates.key,
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
