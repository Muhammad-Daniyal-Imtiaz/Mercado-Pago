/**
 * Custom type definitions for @arcasdk/core to avoid using 'any'
 * and ensuring project build health with ESLint.
 */

export interface ArcaTicketStorage {
    // Basic interface for ticket storage systems
    [key: string]: unknown;
}

export interface ArcaOptions {
    cuit:           number;
    cert:           string;
    key:            string;
    production:     boolean;
    ticketStorage:  ArcaTicketStorage;
}

export interface TaxpayerDetailsResponse {
    taxpayerDetails?: {
        persona?:        AfipTaxpayerBase;
        datosGenerales?: AfipTaxpayerBase;
    };
    personaReturn?: {
        persona?:        AfipTaxpayerBase;
        datosGenerales?: AfipTaxpayerBase;
    };
    persona?:        AfipTaxpayerBase;
    datosGenerales?: AfipTaxpayerBase;
}

export interface AfipTaxpayerBase {
    razonSocial?:     string;
    nombreCompleto?:  string;
    nombre?:          string;
    apellido?:        string;
    description?:     string;
    businessName?:    string;
}

export interface ArcaInstance {
    registerScopeThirteenService: {
        getTaxpayerDetails(cuit: number): Promise<TaxpayerDetailsResponse | null>;
    };
}

export interface FileSystemTicketStorageOptions {
    ticketFolder: string;
}
