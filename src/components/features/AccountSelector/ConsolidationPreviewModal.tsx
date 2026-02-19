import React from 'react'
import { ethers } from 'ethers'
import { createPortal } from 'react-dom'
import { ConsolidationPlan } from '@/types'
import { formatEthBalance } from '@/utils'

interface ConsolidationPreviewModalProps {
  plan: ConsolidationPlan
  onConfirm: () => void
  onCancel: () => void
}

export const ConsolidationPreviewModal: React.FC<ConsolidationPreviewModalProps> = ({
  plan,
  onConfirm,
  onCancel,
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  const modalContent = (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4'
      onClick={handleOverlayClick}
    >
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-text-primary'>Consolidate Funds</h2>
            <button
              onClick={onCancel}
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
          </div>

          <div className='mb-6'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
              <div className='flex items-center space-x-2 mb-2'>
                <svg
                  className='w-5 h-5 text-blue-500 flex-shrink-0'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span className='text-sm font-medium text-blue-800'>Destination Account</span>
              </div>
              <p className='text-sm text-blue-700 break-all'>
                <strong
                  className='truncate max-w-[200px] inline-block align-bottom'
                  title={plan.toAccount.name}
                >
                  {plan.toAccount.name}
                </strong>{' '}
                ({formatAddress(plan.toAccount.AAaddress)})
              </p>
            </div>

            {/* How it works section */}
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
              <div className='flex items-center space-x-2 mb-2'>
                <svg
                  className='w-5 h-5 text-green-600 flex-shrink-0'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span className='text-sm font-medium text-green-800'>Fully Automated Process</span>
              </div>
              <div className='text-sm text-green-700 space-y-1'>
                <p>• Automatically consolidate all funds</p>
                <p>• All transfers executed automatically</p>
                <p>• ERC20 tokens transferred first, then $NERO</p>
                <p>• $NERO (0.001) reserved for gas fees</p>
                <p>• Monitor progress in real-time</p>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-text-primary'>Funds to Consolidate:</h3>

              {plan.fromAccounts.length === 0 ? (
                <div className='text-center py-4 sm:py-8 text-gray-500'>
                  <svg
                    className='w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M20 12H4'
                    />
                  </svg>
                  <p className='text-xs sm:text-sm'>No funds found to consolidate</p>
                </div>
              ) : (
                <div className='max-h-32 sm:max-h-64 overflow-y-auto space-y-1 sm:space-y-3'>
                  {plan.fromAccounts.map((account) => (
                    <div
                      key={account.accountId}
                      className='border border-gray-200 rounded-lg p-2 sm:p-3'
                    >
                      <div className='flex items-center justify-between mb-1 sm:mb-2'>
                        <span
                          className='font-medium text-text-primary text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[180px]'
                          title={account.accountName}
                        >
                          {account.accountName}
                        </span>
                        <span className='text-xs text-gray-500 ml-1 sm:ml-2 font-mono flex-shrink-0'>
                          {formatAddress(account.AAaddress)}
                        </span>
                      </div>

                      <div className='space-y-0.5 sm:space-y-1'>
                        {/* Native Token */}
                        {ethers.BigNumber.from(account.nativeBalance).gt(
                          ethers.utils.parseEther('0.001'),
                        ) && (
                          <div className='flex justify-between text-xs'>
                            <span className='text-gray-600'>$NERO</span>
                            <span className='font-mono'>
                              {formatEthBalance(account.nativeBalance)} $NERO
                            </span>
                          </div>
                        )}

                        {/* ERC20 Tokens */}
                        {account.tokenBalances.map((tokenBalance, index) => (
                          <div key={index} className='flex justify-between text-xs'>
                            <span className='text-gray-600 truncate flex-1 pr-1'>
                              {tokenBalance.token.symbol}
                            </span>
                            <span className='font-mono'>
                              {tokenBalance.formattedBalance} {tokenBalance.token.symbol}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className='bg-gray-50 rounded-lg p-2 sm:p-4 mb-3 sm:mb-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs'>
              <div className='flex justify-between sm:block'>
                <span className='text-gray-600'>Total Transfers:</span>
                <span className='font-medium sm:ml-2'>{plan.totalTransfers}</span>
              </div>
              <div className='flex justify-between sm:block'>
                <span className='text-gray-600'>Estimated Gas:</span>
                <span className='font-medium sm:ml-2'>{plan.estimatedGasNeeded} $NERO</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {plan.warnings.length > 0 && (
            <div className='bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-4 mb-3 sm:mb-6'>
              <div className='flex items-center space-x-2 mb-1 sm:mb-2'>
                <svg
                  className='w-3 h-3 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
                <span className='text-xs sm:text-sm font-medium text-orange-800'>
                  Important Notes
                </span>
              </div>
              <ul className='text-xs sm:text-sm text-orange-700 space-y-0.5 sm:space-y-1'>
                {plan.warnings.map((warning, index) => (
                  <li key={index} className='break-words'>
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'>
            <button
              onClick={onCancel}
              className='flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!plan.canExecute}
              className='flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-black border border-transparent rounded-lg hover:from-gray-900 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {plan.canExecute ? 'Start Consolidation' : 'Cannot Execute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
