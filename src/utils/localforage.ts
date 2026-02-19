import localforage from 'localforage'
import { ERC20Token, NftWithImages } from '@/types'

// Configure localforage
localforage.config({
  name: 'NERO-AA-Wallet',
  version: 1.0,
  size: 50 * 1024 * 1024, // 50MB
  storeName: 'nero_wallet_storage',
  description: 'NERO AA Wallet storage using IndexedDB with localStorage fallback',
})

// Initialize separate stores for different data types
const accountStore = localforage.createInstance({
  name: 'NERO-AA-Wallet',
  storeName: 'accounts',
})

const tokenStore = localforage.createInstance({
  name: 'NERO-AA-Wallet',
  storeName: 'tokens',
})

const settingsStore = localforage.createInstance({
  name: 'NERO-AA-Wallet',
  storeName: 'settings',
})

// Storage keys constants
const CUSTOM_ERC20_TOKENS_KEY = 'customERC20Tokens'
const CUSTOM_ERC721_TOKENS_KEY = 'customERC721Tokens'

/**
 * Enhanced storage quota check for localforage
 * Checks available quota and provides detailed storage information
 */
export const isStorageNearFull = async (): Promise<{
  isFull: boolean
  message?: string
  availableSpace?: number
  usedSpace?: number
}> => {
  try {
    // Check if IndexedDB quota API is available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const usedSpace = estimate.usage || 0
      const availableSpace = estimate.quota || 0
      const usageRatio = usedSpace / availableSpace

      if (usageRatio > 0.9) {
        return {
          isFull: true,
          message: `Storage is ${Math.round(usageRatio * 100)}% full. Please clear some data to continue.`,
          availableSpace,
          usedSpace,
        }
      }

      return {
        isFull: false,
        availableSpace,
        usedSpace,
      }
    } else {
      // Fallback to testing with a small write operation
      const testKey = '__nero_storage_test__'
      const testData = 'x'.repeat(100000) // 100KB test data

      try {
        await localforage.setItem(testKey, testData)
        await localforage.removeItem(testKey)
        return { isFull: false }
      } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          return {
            isFull: true,
            message:
              "Your browser's storage is full. Please clear some data or increase storage quota to create new accounts.",
          }
        }
        throw error
      }
    }
  } catch (error) {
    console.error('Error checking storage quota:', error)
    return {
      isFull: true,
      message: 'Unable to check storage availability. Please try again or clear your browser data.',
    }
  }
}

export const saveAccounts = async (key: string, accounts: any[]): Promise<void> => {
  try {
    // Filter out non-serializable data (like SimpleAccount instances)
    const serializableAccounts = accounts.map((account) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { simpleAccountInstance, ...serializableAccount } = account
      return serializableAccount
    })

    await accountStore.setItem(key, serializableAccounts)
  } catch (error) {
    console.error('Error saving accounts:', error)
    // Fallback to localStorage if localforage fails
    try {
      const serializableAccounts = accounts.map((account) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { simpleAccountInstance, ...serializableAccount } = account
        return serializableAccount
      })
      localStorage.setItem(key, JSON.stringify(serializableAccounts))
    } catch (fallbackError) {
      console.error('Fallback localStorage also failed:', fallbackError)
      throw new Error('Failed to save accounts: Storage unavailable')
    }
  }
}

export const loadAccounts = async (key: string): Promise<any[] | null> => {
  try {
    const accounts = await accountStore.getItem<any[]>(key)
    return accounts
  } catch (error) {
    console.error('Error loading accounts from localforage:', error)
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (fallbackError) {
      console.error('Fallback localStorage read failed:', fallbackError)
      return null
    }
  }
}

export const removeAccounts = async (key: string): Promise<void> => {
  try {
    await accountStore.removeItem(key)
  } catch (error) {
    console.error('Error removing accounts:', error)
    // Fallback to localStorage
    try {
      localStorage.removeItem(key)
    } catch (fallbackError) {
      console.error('Fallback localStorage removal failed:', fallbackError)
    }
  }
}

/**
 * Custom Token Storage Functions
 */
export const saveCustomERC20Token = async (token: ERC20Token): Promise<void> => {
  try {
    const existingTokens = await getCustomERC20Tokens()
    const updatedTokens = [...existingTokens, token]
    await tokenStore.setItem(CUSTOM_ERC20_TOKENS_KEY, updatedTokens)
  } catch (error) {
    console.error('Error saving ERC20 token:', error)
    // Fallback to localStorage
    try {
      const existingTokens = getCustomERC20TokensSync()
      const updatedTokens = [...existingTokens, token]
      localStorage.setItem(CUSTOM_ERC20_TOKENS_KEY, JSON.stringify(updatedTokens))
    } catch (fallbackError) {
      console.error('Fallback ERC20 token save failed:', fallbackError)
      throw new Error('Failed to save token: Storage unavailable')
    }
  }
}

export const getCustomERC20Tokens = async (): Promise<ERC20Token[]> => {
  try {
    const tokens = await tokenStore.getItem<ERC20Token[]>(CUSTOM_ERC20_TOKENS_KEY)
    return tokens || []
  } catch (error) {
    console.error('Error loading ERC20 tokens:', error)
    // Fallback to localStorage
    return getCustomERC20TokensSync()
  }
}

// Synchronous fallback for ERC20 tokens
const getCustomERC20TokensSync = (): ERC20Token[] => {
  try {
    const tokensJson = localStorage.getItem(CUSTOM_ERC20_TOKENS_KEY)
    return tokensJson ? JSON.parse(tokensJson) : []
  } catch (error) {
    console.error('Fallback ERC20 token load failed:', error)
    return []
  }
}

export const removeCustomERC20Token = async (contractAddress: string): Promise<void> => {
  try {
    const existingTokens = await getCustomERC20Tokens()
    const normalizedAddress = contractAddress.toLowerCase()
    const updatedTokens = existingTokens.filter(
      (token) => token.contractAddress.toLowerCase() !== normalizedAddress,
    )
    await tokenStore.setItem(CUSTOM_ERC20_TOKENS_KEY, updatedTokens)
  } catch (error) {
    console.error('Error removing ERC20 token:', error)
    // Fallback to localStorage
    try {
      const existingTokens = getCustomERC20TokensSync()
      const normalizedAddress = contractAddress.toLowerCase()
      const updatedTokens = existingTokens.filter(
        (token) => token.contractAddress.toLowerCase() !== normalizedAddress,
      )
      localStorage.setItem(CUSTOM_ERC20_TOKENS_KEY, JSON.stringify(updatedTokens))
    } catch (fallbackError) {
      console.error('Fallback ERC20 token removal failed:', fallbackError)
      throw new Error('Failed to remove token: Storage unavailable')
    }
  }
}

export const saveCustomERC721Token = async (token: NftWithImages): Promise<void> => {
  try {
    const existingTokens = await getCustomERC721Tokens()
    const existingToken = existingTokens.find(
      (t) => t.contractAddress.toLowerCase() === token.contractAddress.toLowerCase(),
    )

    if (existingToken) {
      const uniqueTokenData = token.tokenData
        .filter(
          (newData) =>
            !existingToken.tokenData.some(
              (existingData) => existingData.tokenId === newData.tokenId,
            ),
        )
        .map((data) => ({
          ...data,
          hidden: false,
        }))

      existingToken.tokenData.push(...uniqueTokenData)
      existingToken.balance = (parseInt(existingToken.balance) + uniqueTokenData.length).toString()
    } else {
      token.tokenData = token.tokenData.map((data) => ({
        ...data,
        hidden: false,
      }))
      existingTokens.push(token)
    }

    await tokenStore.setItem(CUSTOM_ERC721_TOKENS_KEY, existingTokens)
  } catch (error) {
    console.error('Error saving ERC721 token:', error)
    throw new Error('Failed to save NFT: Storage unavailable')
  }
}

export const getCustomERC721Tokens = async (): Promise<NftWithImages[]> => {
  try {
    const tokens = await tokenStore.getItem<NftWithImages[]>(CUSTOM_ERC721_TOKENS_KEY)
    return tokens || []
  } catch (error) {
    console.error('Error loading ERC721 tokens:', error)
    // Fallback to localStorage
    try {
      const tokensJson = localStorage.getItem(CUSTOM_ERC721_TOKENS_KEY)
      return tokensJson ? JSON.parse(tokensJson) : []
    } catch (fallbackError) {
      console.error('Fallback ERC721 token load failed:', fallbackError)
      return []
    }
  }
}

export const removeCustomERC721Token = async (contractAddress: string): Promise<void> => {
  try {
    const existingTokens = await getCustomERC721Tokens()
    const updatedTokens = existingTokens.filter(
      (token) => token.contractAddress !== contractAddress,
    )
    await tokenStore.setItem(CUSTOM_ERC721_TOKENS_KEY, updatedTokens)
  } catch (error) {
    console.error('Error removing ERC721 token:', error)
    throw new Error('Failed to remove NFT: Storage unavailable')
  }
}

export const updateCustomERC721Token = async (updatedToken: NftWithImages): Promise<void> => {
  try {
    const existingTokens = await getCustomERC721Tokens()
    const updatedTokens = existingTokens.map((token) =>
      token.contractAddress === updatedToken.contractAddress ? updatedToken : token,
    )
    await tokenStore.setItem(CUSTOM_ERC721_TOKENS_KEY, updatedTokens)
  } catch (error) {
    console.error('Error updating ERC721 token:', error)
    throw new Error('Failed to update NFT: Storage unavailable')
  }
}

export const getCustomERC721TokenByAddress = async (
  contractAddress: string,
): Promise<NftWithImages | undefined> => {
  try {
    const existingTokens = await getCustomERC721Tokens()
    return existingTokens.find((token) => token.contractAddress === contractAddress)
  } catch (error) {
    console.error('Error finding ERC721 token:', error)
    return undefined
  }
}

export const toggleNFTVisibility = async (
  contractAddress: string,
  tokenId: number,
): Promise<void> => {
  try {
    const existingTokens = await getCustomERC721Tokens()
    const updatedTokens = existingTokens.map((token) => {
      if (token.contractAddress.toLowerCase() === contractAddress.toLowerCase()) {
        return {
          ...token,
          tokenData: token.tokenData.map((data) => {
            if (data.tokenId === tokenId) {
              return { ...data, hidden: !data.hidden }
            }
            return data
          }),
        }
      }
      return token
    })
    await tokenStore.setItem(CUSTOM_ERC721_TOKENS_KEY, updatedTokens)
  } catch (error) {
    console.error('Error toggling NFT visibility:', error)
    throw new Error('Failed to update NFT visibility: Storage unavailable')
  }
}

/**
 * Generic Storage Functions
 */
export const setItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    await settingsStore.setItem(key, value)
  } catch (error) {
    console.error('Error setting item:', error)
    // Fallback to localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (fallbackError) {
      console.error('Fallback setItem failed:', fallbackError)
      throw new Error('Failed to store data: Storage unavailable')
    }
  }
}

export const getItem = async <T>(key: string, fallback?: T): Promise<T | null> => {
  try {
    const value = await settingsStore.getItem<T>(key)
    return value !== null ? value : fallback || null
  } catch (error) {
    console.error('Error getting item:', error)
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : fallback || null
    } catch (fallbackError) {
      console.error('Fallback getItem failed:', fallbackError)
      return fallback || null
    }
  }
}

export const removeItem = async (key: string): Promise<void> => {
  try {
    await settingsStore.removeItem(key)
  } catch (error) {
    console.error('Error removing item:', error)
    // Fallback to localStorage
    try {
      localStorage.removeItem(key)
    } catch (fallbackError) {
      console.error('Fallback removeItem failed:', fallbackError)
    }
  }
}

/**
 * Migration helper function
 * Migrates existing localStorage data to localforage
 */
export const migrateFromLocalStorage = async (): Promise<{
  migrated: boolean
  accountsMigrated: number
  tokensMigrated: number
  errors: string[]
}> => {
  const errors: string[] = []
  let accountsMigrated = 0
  let tokensMigrated = 0

  try {
    // Migrate account data
    const storageKeys = Object.keys(localStorage).filter(
      (key) =>
        key.startsWith('nero-wallet-accounts-') || key.startsWith('nero-wallet-active-account-'),
    )

    for (const key of storageKeys) {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          if (key.includes('accounts-')) {
            const accounts = JSON.parse(data)
            await saveAccounts(key, accounts)
            accountsMigrated += accounts.length
          } else {
            await setItem(key, data)
          }
          // Don't remove from localStorage yet - keep as fallback
        }
      } catch (error) {
        errors.push(`Failed to migrate ${key}: ${error}`)
      }
    }

    // Migrate token data
    try {
      const erc20Data = localStorage.getItem(CUSTOM_ERC20_TOKENS_KEY)
      if (erc20Data) {
        const tokens = JSON.parse(erc20Data)
        await tokenStore.setItem(CUSTOM_ERC20_TOKENS_KEY, tokens)
        tokensMigrated += tokens.length
      }
    } catch (error) {
      errors.push(`Failed to migrate ERC20 tokens: ${error}`)
    }

    try {
      const erc721Data = localStorage.getItem(CUSTOM_ERC721_TOKENS_KEY)
      if (erc721Data) {
        const tokens = JSON.parse(erc721Data)
        await tokenStore.setItem(CUSTOM_ERC721_TOKENS_KEY, tokens)
        tokensMigrated += tokens.length
      }
    } catch (error) {
      errors.push(`Failed to migrate ERC721 tokens: ${error}`)
    }
    return {
      migrated: true,
      accountsMigrated,
      tokensMigrated,
      errors,
    }
  } catch (error) {
    errors.push(`Migration failed: ${error}`)
    return {
      migrated: false,
      accountsMigrated,
      tokensMigrated,
      errors,
    }
  }
}

// Export the store instances for advanced usage
export { accountStore, tokenStore, settingsStore }
