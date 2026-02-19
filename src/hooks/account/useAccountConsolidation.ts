import { useContext } from 'react'
import { AccountConsolidationContext } from '@/contexts/AccountConsolidationContext'

export const useAccountConsolidation = () => {
  const context = useContext(AccountConsolidationContext)

  if (context === undefined) {
    throw new Error('useAccountConsolidation must be used within an AccountConsolidationProvider')
  }

  return context
}
