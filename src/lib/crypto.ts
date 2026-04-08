import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

// Master key from environment - must be 32 bytes (64 hex chars)
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY

if (!MASTER_KEY || MASTER_KEY.length !== 64) {
  throw new Error('MASTER_ENCRYPTION_KEY must be set and be 64 hexadecimal characters (32 bytes)')
}

const key = Buffer.from(MASTER_KEY, 'hex')

export interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns an object with encrypted data, IV, and auth tag (all base64 encoded)
 */
export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM
 * Takes an object with encrypted data, IV, and auth tag (all base64 encoded)
 */
export function decrypt(data: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(data.iv, 'base64')
  )
  
  decipher.setAuthTag(Buffer.from(data.authTag, 'base64'))
  
  let decrypted = decipher.update(data.encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Checks if a value is already encrypted (has the structure of EncryptedData)
 */
export function isEncrypted(value: unknown): value is EncryptedData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'encrypted' in value &&
    'iv' in value &&
    'authTag' in value &&
    typeof (value as EncryptedData).encrypted === 'string' &&
    typeof (value as EncryptedData).iv === 'string' &&
    typeof (value as EncryptedData).authTag === 'string'
  )
}
