import { useState, useEffect, useCallback } from 'react'
import { getItem, setItem, removeItem } from '@/utils/localforage'

export interface UseLocalforageReturn<T> {
  storedValue: T
  setValue: (value: T | ((val: T) => T)) => Promise<void>
  removeValue: () => Promise<void>
  isLoading: boolean
  error: Error | null
}

export function useLocalforage<T>(key: string, initialValue: T): UseLocalforageReturn<T> {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load initial value
  useEffect(() => {
    let isMounted = true

    const loadInitialValue = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const value = await getItem<T>(key, initialValue)

        if (isMounted) {
          setStoredValue(value || initialValue)
        }
      } catch (err) {
        console.error('Error loading from localforage:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load data'))
          setStoredValue(initialValue)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInitialValue()

    return () => {
      isMounted = false
    }
  }, [key, initialValue])

  const setValue = useCallback(
    async (value: T | ((val: T) => T)) => {
      try {
        setError(null)
        const valueToStore = value instanceof Function ? value(storedValue) : value

        setStoredValue(valueToStore)
        await setItem(key, valueToStore)
      } catch (err) {
        console.error('Error writing to localforage:', err)
        setError(err instanceof Error ? err : new Error('Failed to save data'))
        throw err
      }
    },
    [key, storedValue],
  )

  const removeValue = useCallback(async () => {
    try {
      setError(null)
      setStoredValue(initialValue)
      await removeItem(key)
    } catch (err) {
      console.error('Error removing from localforage:', err)
      setError(err instanceof Error ? err : new Error('Failed to remove data'))
      throw err
    }
  }, [key, initialValue])

  return {
    storedValue,
    setValue,
    removeValue,
    isLoading,
    error,
  }
}

/**
 * Hook for async account management with localforage
 * Specialized for account data with proper typing
 */
export function useAccountStorage(authKey: string) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const accountsKey = `nero-wallet-accounts-${authKey}`
  const activeKey = `nero-wallet-active-account-${authKey}`

  // Load initial data
  useEffect(() => {
    let isMounted = true

    const loadAccountData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [loadedAccounts, loadedActiveId] = await Promise.all([
          getItem<any[]>(accountsKey, []),
          getItem<string | null>(activeKey, null),
        ])

        if (isMounted) {
          setAccounts(loadedAccounts || [])
          setActiveAccountId(loadedActiveId)
        }
      } catch (err) {
        console.error('Error loading account data:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load account data'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAccountData()

    return () => {
      isMounted = false
    }
  }, [accountsKey, activeKey])

  const saveAccounts = useCallback(
    async (newAccounts: any[]) => {
      try {
        setError(null)
        setAccounts(newAccounts)
        await setItem(accountsKey, newAccounts)
      } catch (err) {
        console.error('Error saving accounts:', err)
        setError(err instanceof Error ? err : new Error('Failed to save accounts'))
        throw err
      }
    },
    [accountsKey],
  )

  const saveActiveAccountId = useCallback(
    async (accountId: string | null) => {
      try {
        setError(null)
        setActiveAccountId(accountId)
        if (accountId !== null) {
          await setItem(activeKey, accountId)
        } else {
          await removeItem(activeKey)
        }
      } catch (err) {
        console.error('Error saving active account ID:', err)
        setError(err instanceof Error ? err : new Error('Failed to save active account'))
        throw err
      }
    },
    [activeKey],
  )

  return {
    accounts,
    activeAccountId,
    saveAccounts,
    saveActiveAccountId,
    isLoading,
    error,
  }
}
