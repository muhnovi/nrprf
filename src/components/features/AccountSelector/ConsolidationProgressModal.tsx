import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAccountConsolidation } from '@/hooks'

interface ConsolidationProgressModalProps {
  onClose: () => void
}

export const ConsolidationProgressModal: React.FC<ConsolidationProgressModalProps> = ({
  onClose,
}) => {
  const { isConsolidating, consolidationProgress, executeConsolidation, clearConsolidation } =
    useAccountConsolidation()

  // Use ref to track if consolidation has been started to prevent re-execution
  const hasStartedConsolidation = useRef(false)
  const [consolidationError, setConsolidationError] = useState<string | null>(null)

  useEffect(() => {
    // Only execute consolidation once when modal opens
    if (!isConsolidating && !hasStartedConsolidation.current && !consolidationError) {
      hasStartedConsolidation.current = true

      // Add error handling for executeConsolidation
      executeConsolidation().catch((error) => {
        console.error('Consolidation execution failed:', error)
        setConsolidationError(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred during consolidation',
        )
      })
    }
  }, [executeConsolidation, isConsolidating, consolidationError])

  const handleClose = () => {
    clearConsolidation()
    // Reset the ref when modal closes
    hasStartedConsolidation.current = false
    setConsolidationError(null)

    // Call the parent close handler (which now uses context protection)
    onClose()
  }

  const handleRetry = async () => {
    setConsolidationError(null)
    hasStartedConsolidation.current = false

    try {
      if (!isConsolidating) {
        hasStartedConsolidation.current = true
        await executeConsolidation()
      }
    } catch (error) {
      console.error('Retry consolidation failed:', error)
      setConsolidationError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during consolidation retry',
      )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className='w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full'></div>
        )
      case 'processing':
        return (
          <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        )
      case 'completed':
        return (
          <svg
            className='w-4 h-4 text-green-500'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
        )
      case 'failed':
        return (
          <svg
            className='w-4 h-4 text-red-500'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        )
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500'
      case 'processing':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  const isAllCompleted = consolidationProgress.every((account) =>
    account.transfers.every(
      (transfer) => transfer.status === 'completed' || transfer.status === 'failed',
    ),
  )

  const totalTransfers = consolidationProgress.reduce(
    (total, account) => total + account.transfers.length,
    0,
  )

  const completedTransfers = consolidationProgress.reduce(
    (total, account) => total + account.transfers.filter((t) => t.status === 'completed').length,
    0,
  )

  const failedTransfers = consolidationProgress.reduce(
    (total, account) => total + account.transfers.filter((t) => t.status === 'failed').length,
    0,
  )

  const modalContent = (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-text-primary'>Consolidation Progress</h2>
            {(isAllCompleted || consolidationError) && (
              <button
                onClick={handleClose}
                className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Overall Progress */}
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-text-primary'>Overall Progress</span>
              <span className='text-sm text-gray-500'>
                {completedTransfers + failedTransfers} / {totalTransfers}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-gray-800 to-black h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${totalTransfers > 0 ? ((completedTransfers + failedTransfers) / totalTransfers) * 100 : 0}%`,
                }}
              ></div>
            </div>
            {failedTransfers > 0 && (
              <p className='text-xs sm:text-sm text-red-600 mt-1'>
                {failedTransfers} transfer{failedTransfers > 1 ? 's' : ''} failed
              </p>
            )}
          </div>

          {/* Account Progress */}
          <div className='space-y-2 sm:space-y-4 max-h-48 sm:max-h-96 overflow-y-auto'>
            {consolidationProgress.map((account) => (
              <div key={account.accountId} className='border border-gray-200 rounded-lg p-2 sm:p-4'>
                <h3
                  className='font-medium text-text-primary mb-1 sm:mb-3 text-xs sm:text-base truncate max-w-[200px] sm:max-w-[300px]'
                  title={account.accountName}
                >
                  {account.accountName}
                </h3>

                <div className='space-y-1 sm:space-y-2'>
                  {account.transfers.map((transfer, index) => (
                    <div key={index} className='flex items-center space-x-2 sm:space-x-3'>
                      <div className='flex-shrink-0'>{getStatusIcon(transfer.status)}</div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between'>
                          <span className='text-xs sm:text-sm font-medium text-text-primary truncate'>
                            {transfer.tokenSymbol}
                          </span>
                          <span
                            className={`text-xs font-medium ${getStatusColor(transfer.status)} ml-1 sm:ml-2`}
                          >
                            {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                          </span>
                        </div>
                        {transfer.error && (
                          <p className='text-xs text-red-500 mt-0.5 sm:mt-1 break-words'>
                            {transfer.error}
                          </p>
                        )}
                        {transfer.txHash && (
                          <p className='text-xs text-gray-500 mt-0.5 sm:mt-1 font-mono break-all'>
                            Tx: {transfer.txHash.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Status Message */}
          <div className='mt-3 sm:mt-6'>
            {/* Error State */}
            {consolidationError && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-2 sm:p-4 mb-4'>
                <div className='flex items-start space-x-2'>
                  <svg
                    className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                  <div className='flex-1'>
                    <span className='text-xs sm:text-sm font-medium text-red-800 block mb-1'>
                      Consolidation Failed
                    </span>
                    <p className='text-xs text-red-700 break-words mb-2'>{consolidationError}</p>
                    <button
                      onClick={handleRetry}
                      className='text-xs font-medium text-red-600 hover:text-red-800 underline'
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isConsolidating && !isAllCompleted && !consolidationError && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0'></div>
                  <span className='text-xs sm:text-sm font-medium text-blue-800'>
                    Processing consolidation...
                  </span>
                </div>
              </div>
            )}

            {isAllCompleted && !consolidationError && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4'>
                <div className='flex items-center space-x-2'>
                  <svg
                    className='w-3 h-3 sm:w-5 sm:h-5 text-green-500 flex-shrink-0'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                  <span className='text-xs sm:text-sm font-medium text-green-800'>
                    Consolidation completed!
                    {failedTransfers > 0 &&
                      ` (${failedTransfers} transfer${failedTransfers > 1 ? 's' : ''} failed)`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          {(isAllCompleted || consolidationError) && (
            <div className='mt-3 sm:mt-6'>
              <button
                onClick={handleClose}
                className='w-full px-3 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-black border border-transparent rounded-lg hover:from-gray-900 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-colors'
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
