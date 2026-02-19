import React, { useEffect, useRef } from 'react'
import { useAccountManager, useAccountConsolidation } from '@/hooks'

export const ConsolidationButton: React.FC = () => {
  const { accounts } = useAccountManager()
  const { canConsolidate, isScanning, isConsolidating, scanAccountBalances, openPreviewModal } =
    useAccountConsolidation()

  // Use ref to track if we're in consolidation mode to prevent unwanted closures
  const isConsolidationActiveRef = useRef(false)

  // Update ref when consolidation state changes
  useEffect(() => {
    isConsolidationActiveRef.current = isConsolidating
  }, [isConsolidating])

  const handleConsolidateClick = async () => {
    if (accounts.length <= 1) return

    try {
      await scanAccountBalances()
      openPreviewModal()
    } catch (error) {
      console.error('Failed to scan account balances:', error)
    }
  }

  if (accounts.length <= 1) return null

  return (
    <>
      <button
        onClick={handleConsolidateClick}
        disabled={!canConsolidate || isScanning}
        className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-lg hover:from-gray-900 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isScanning ? (
          <>
            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
            <span className='text-sm font-medium'>Scanning Balances...</span>
          </>
        ) : (
          <>
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
              />
            </svg>
            <span className='text-sm font-medium'>Consolidate All Funds</span>
          </>
        )}
      </button>
    </>
  )
}
