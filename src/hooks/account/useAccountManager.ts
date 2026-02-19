import { useContext } from 'react'
import { AccountManagerContext } from '@/contexts/AccountManagerContext'

export const useAccountManager = () => {
  const context = useContext(AccountManagerContext)

  if (context === undefined) {
    throw new Error('useAccountManager must be used within an AccountManagerProvider')
  }

  return context
}
