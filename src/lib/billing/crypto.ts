import { encrypt, decrypt, isEncrypted, EncryptedData } from '../crypto'

export interface PaymentData {
  cardNumber?: string
  cardholderName?: string
  expiryMonth?: string
  expiryYear?: string
  cvv?: string
  bankAccountNumber?: string
  bankRoutingNumber?: string
  paypalEmail?: string
  mercadoPagoAccessToken?: string
  stripeCustomerId?: string
  stripePaymentMethodId?: string
}

export interface EncryptedPaymentData {
  card_last_four?: string
  card_brand?: string
  card_expiry?: string
  bank_last_four?: string
  bank_name?: string
  paypal_email?: string
  gateway_customer_id?: string
  gateway_payment_method_id?: string
  encrypted_data: EncryptedData
}

/**
 * Encrypts sensitive payment data while keeping non-sensitive data visible
 */
export function encryptPaymentData(paymentData: PaymentData): EncryptedPaymentData {
  const sensitiveData: Record<string, string> = {}
  const publicData: Record<string, string> = {}

  // Separate sensitive and non-sensitive data
  if (paymentData.cardNumber) {
    sensitiveData.cardNumber = paymentData.cardNumber
    publicData.card_last_four = paymentData.cardNumber.slice(-4)
  }

  if (paymentData.cardholderName) {
    sensitiveData.cardholderName = paymentData.cardholderName
  }

  if (paymentData.expiryMonth && paymentData.expiryYear) {
    sensitiveData.expiryMonth = paymentData.expiryMonth
    sensitiveData.expiryYear = paymentData.expiryYear
    publicData.card_expiry = `${paymentData.expiryMonth}/${paymentData.expiryYear.slice(-2)}`
  }

  if (paymentData.cvv) {
    sensitiveData.cvv = paymentData.cvv
  }

  if (paymentData.bankAccountNumber) {
    sensitiveData.bankAccountNumber = paymentData.bankAccountNumber
    publicData.bank_last_four = paymentData.bankAccountNumber.slice(-4)
  }

  if (paymentData.bankRoutingNumber) {
    sensitiveData.bankRoutingNumber = paymentData.bankRoutingNumber
  }

  if (paymentData.paypalEmail) {
    sensitiveData.paypalEmail = paymentData.paypalEmail
    publicData.paypal_email = paymentData.paypalEmail
  }

  if (paymentData.mercadoPagoAccessToken) {
    sensitiveData.mercadoPagoAccessToken = paymentData.mercadoPagoAccessToken
  }

  if (paymentData.stripeCustomerId) {
    sensitiveData.stripeCustomerId = paymentData.stripeCustomerId
    publicData.gateway_customer_id = paymentData.stripeCustomerId
  }

  if (paymentData.stripePaymentMethodId) {
    sensitiveData.stripePaymentMethodId = paymentData.stripePaymentMethodId
    publicData.gateway_payment_method_id = paymentData.stripePaymentMethodId
  }

  // Detect card brand from card number
  if (paymentData.cardNumber) {
    publicData.card_brand = detectCardBrand(paymentData.cardNumber)
  }

  // Encrypt sensitive data
  const encrypted_data = encrypt(JSON.stringify(sensitiveData))

  return {
    ...publicData,
    encrypted_data
  }
}

/**
 * Decrypts payment data
 */
export function decryptPaymentData(encryptedData: EncryptedPaymentData): PaymentData {
  if (!isEncrypted(encryptedData.encrypted_data)) {
    throw new Error('Invalid encrypted payment data format')
  }

  const sensitiveData: PaymentData = JSON.parse(decrypt(encryptedData.encrypted_data))
  
  return {
    cardNumber: sensitiveData.cardNumber,
    cardholderName: sensitiveData.cardholderName,
    expiryMonth: sensitiveData.expiryMonth,
    expiryYear: sensitiveData.expiryYear,
    cvv: sensitiveData.cvv,
    bankAccountNumber: sensitiveData.bankAccountNumber,
    bankRoutingNumber: sensitiveData.bankRoutingNumber,
    paypalEmail: sensitiveData.paypalEmail || encryptedData.paypal_email,
    mercadoPagoAccessToken: sensitiveData.mercadoPagoAccessToken,
    stripeCustomerId: sensitiveData.stripeCustomerId || encryptedData.gateway_customer_id,
    stripePaymentMethodId: sensitiveData.stripePaymentMethodId || encryptedData.gateway_payment_method_id
  }
}

/**
 * Gets public payment info without decrypting sensitive data
 */
export function getPublicPaymentInfo(encryptedData: EncryptedPaymentData) {
  return {
    card_last_four: encryptedData.card_last_four,
    card_brand: encryptedData.card_brand,
    card_expiry: encryptedData.card_expiry,
    bank_last_four: encryptedData.bank_last_four,
    paypal_email: encryptedData.paypal_email,
    gateway_customer_id: encryptedData.gateway_customer_id,
    gateway_payment_method_id: encryptedData.gateway_payment_method_id
  }
}

/**
 * Detects credit card brand from card number
 */
function detectCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\D/g, '')
  
  // Visa
  if (/^4/.test(number)) return 'visa'
  
  // Mastercard
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard'
  
  // American Express
  if (/^3[47]/.test(number)) return 'amex'
  
  // Discover
  if (/^6(?:011|5[0-9]{2})/.test(number)) return 'discover'
  
  // Diners Club
  if (/^3[0689]/.test(number)) return 'diners'
  
  // JCB
  if (/^35/.test(number)) return 'jcb'
  
  return 'unknown'
}

/**
 * Validates card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  const number = cardNumber.replace(/\D/g, '')
  
  if (number.length < 13 || number.length > 19) return false
  
  let sum = 0
  let isEven = false
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Validates expiry date
 */
export function validateExpiryDate(month: string, year: string): boolean {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  const expYear = parseInt(year, 10)
  const expMonth = parseInt(month, 10)
  
  if (expYear < currentYear) return false
  if (expYear === currentYear && expMonth < currentMonth) return false
  
  return expMonth >= 1 && expMonth <= 12
}

/**
 * Masks sensitive data for logging
 */
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return data
  
  const masked = { ...data }
  
  // Mask card numbers
  if (typeof masked.cardNumber === 'string') {
    masked.cardNumber = masked.cardNumber.slice(-4).padStart(masked.cardNumber.length, '*')
  }
  
  // Mask CVV
  if (masked.cvv) {
    masked.cvv = '***'
  }
  
  // Mask bank account numbers
  if (typeof masked.bankAccountNumber === 'string') {
    masked.bankAccountNumber = masked.bankAccountNumber.slice(-4).padStart(masked.bankAccountNumber.length, '*')
  }
  
  // Mask access tokens
  if (typeof masked.mercadoPagoAccessToken === 'string') {
    masked.mercadoPagoAccessToken = masked.mercadoPagoAccessToken.slice(-8).padStart(masked.mercadoPagoAccessToken.length, '*')
  }
  
  return masked
}
