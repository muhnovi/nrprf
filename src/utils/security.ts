import { ethers } from 'ethers'

/**
 * Generate deterministic salt for Account Abstraction wallet creation
 * Extracted from AccountManagerContext for testability
 */
export const generateDeterministicSalt = (
  signerAddress: string,
  accountIndex: number,
  chainId: number,
): number => {
  // First account (index 0) should use salt = 0 for compatibility with other AA wallets
  if (accountIndex === 0) {
    return 0
  }

  // Create deterministic salt for subsequent accounts using:
  // 1. EOA address (to ensure uniqueness across different wallets)
  // 2. Account index (to ensure multiple accounts for same EOA)
  // 3. Chain ID (to ensure different addresses across chains)

  // Use ethers.utils.keccak256 for deterministic hash
  const saltInput = ethers.utils.solidityPack(
    ['address', 'uint256', 'uint256'],
    [signerAddress, accountIndex, chainId],
  )

  const saltHash = ethers.utils.keccak256(saltInput)

  // Convert to BigNumber and use modulo to keep within safe range
  // Using 2^32 - 1 (4,294,967,295) which is safe for both JS and ethers.js
  const saltBigNumber = ethers.BigNumber.from(saltHash)
  const maxSalt = ethers.BigNumber.from('4294967295') // 2^32 - 1
  const salt = saltBigNumber.mod(maxSalt).toNumber()

  // Ensure salt is never 0 for subsequent accounts to avoid collision with first account
  const finalSalt = salt === 0 ? 1 : salt
  return finalSalt
}

/**
 * Generate storage keys for different authentication contexts
 * Extracted from AccountManagerContext for testability
 */
export const generateStorageKeys = (signerAddress: string, authMethod: string, userId?: string) => {
  const authSuffix = userId ? `${authMethod}-${userId.replace(/[^a-zA-Z0-9]/g, '')}` : authMethod

  return {
    accountsKey: `nero-wallet-accounts-${signerAddress}-${authSuffix}`,
    activeAccountKey: `nero-wallet-active-account-${signerAddress}-${authSuffix}`,
  }
}

/**
 * Validate salt range constraints
 */
export const isValidSalt = (salt: number): boolean => {
  return (
    typeof salt === 'number' &&
    Number.isInteger(salt) &&
    salt >= 0 &&
    salt <= 0xffffffff && // 2^32 - 1
    !Number.isNaN(salt) &&
    Number.isFinite(salt)
  )
}

/**
 * Sanitize account name for safe storage and display
 */
export const sanitizeAccountName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return 'Account'
  }

  // Remove dangerous characters and limit length
  return (
    name
      .replace(/[<>"'&]/g, '')
      .substring(0, 50)
      .trim() || 'Account'
  )
}

/**
 * Validate account data structure
 */
export const validateAccountData = (account: any): boolean => {
  if (!account || typeof account !== 'object') return false
  if (!account.id || typeof account.id !== 'string') return false
  if (!account.name || typeof account.name !== 'string') return false
  if (!account.AAaddress || typeof account.AAaddress !== 'string') return false
  if (typeof account.salt !== 'number') return false
  if (!account.createdAt || typeof account.createdAt !== 'number') return false
  if (!account.AAaddress.startsWith('0x')) return false
  if (account.AAaddress.length !== 42) return false

  // Validate optional hidden field
  if (account.hidden !== undefined && typeof account.hidden !== 'boolean') return false

  return true
}

/**
 * Safe JSON parsing with fallback
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(jsonString)
    return parsed !== null ? parsed : fallback
  } catch {
    return fallback
  }
}

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Validate array size constraints
 */
export const validateArraySize = <T>(array: T[], maxSize: number): boolean => {
  return Array.isArray(array) && array.length <= maxSize
}

/**
 * Estimate object size in bytes
 */
export const getObjectSize = (obj: any): number => {
  return JSON.stringify(obj).length * 2 // Rough estimate (2 bytes per char)
}

/**
 * Validate object size constraints
 */
export const validateObjectSize = (obj: any, maxSizeBytes: number): boolean => {
  return getObjectSize(obj) <= maxSizeBytes
}
