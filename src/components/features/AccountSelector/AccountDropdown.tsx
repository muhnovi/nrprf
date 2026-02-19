import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiEyeOff, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { ConsolidationButton } from './ConsolidationButton'
import { useAccountManager } from '@/hooks'
import { AccountDropdownProps } from '@/types'

// Custom Confirmation Modal Component
const HideAccountConfirmModal: React.FC<{
  accountName: string
  onConfirm: () => void
  onCancel: () => void
}> = ({ accountName, onConfirm, onCancel }) => {
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
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-text-primary'>Hide Account</h2>
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
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                <FiEyeOff className='w-6 h-6 text-orange-600' />
              </div>
              <div>
                <p className='text-text-primary font-medium'>
                  Are you sure you want to hide "{accountName}"?
                </p>
                <p className='text-sm text-gray-500 mt-1'>
                  You can unhide it later from the hidden accounts section.
                </p>
              </div>
            </div>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
              <p className='text-sm text-blue-800'>
                <strong>Note:</strong> Hiding an account won't delete it or affect your funds. It
                will simply be moved to the hidden accounts section.
              </p>
            </div>
          </div>

          <div className='flex space-x-3'>
            <button
              onClick={onCancel}
              className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className='flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-black border border-transparent rounded-lg hover:from-gray-900 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-colors'
            >
              Hide Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export const AccountDropdown: React.FC<AccountDropdownProps> = ({ onClose, onCreateAccount }) => {
  const {
    accounts,
    visibleAccounts,
    hiddenAccounts,
    activeAccountId,
    switchAccount,
    hideAccount,
    unhideAccount,
    showHiddenAccounts,
    setShowHiddenAccounts,
    recoverAccountByIndex,
  } = useAccountManager()
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false)
  const [recoveryIndex, setRecoveryIndex] = useState('')
  const [showHideConfirm, setShowHideConfirm] = useState<{
    show: boolean
    accountId: string
    accountName: string
  }>({
    show: false,
    accountId: '',
    accountName: '',
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleAccountClick = (accountId: string) => {
    switchAccount(accountId)
    onClose()
  }

  const handleHideAccount = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation()
    if (visibleAccounts.length > 1) {
      const account = accounts.find((a) => a.id === accountId)
      setShowHideConfirm({
        show: true,
        accountId,
        accountName: account?.name || '',
      })
    }
  }

  const handleUnhideAccount = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation()
    unhideAccount(accountId)
  }

  const handleRecoverAccount = async () => {
    const index = parseInt(recoveryIndex)
    if (isNaN(index) || index < 0) {
      alert('Please enter a valid account index (0 or higher)')
      return
    }

    try {
      const recovered = await recoverAccountByIndex(index)
      if (recovered) {
        alert(`Successfully recovered account: ${recovered.name} (${recovered.AAaddress})`)
        setRecoveryIndex('')
      } else {
        alert('Failed to recover account. Check console for details.')
      }
    } catch (error) {
      console.error('Recovery error:', error)
      alert('Failed to recover account. Check console for details.')
    }
  }

  const generateAccountIcon = (name: string) => {
    const colors = [
      'from-gray-700 to-gray-900',
      'from-slate-700 to-slate-900',
      'from-zinc-700 to-zinc-900',
      'from-stone-700 to-stone-900',
      'from-neutral-700 to-neutral-900',
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  return (
    <div
      ref={dropdownRef}
      className='absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto'
    >
      {/* Existing Accounts */}
      <div className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-800'>Accounts</h3>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowRecoveryPanel(!showRecoveryPanel)}
              className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
              title='Account Recovery'
            >
              <FiRefreshCw className='w-4 h-4' />
            </button>
            <button
              onClick={onCreateAccount}
              className='p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors'
              title='Create New Account'
            >
              <FiPlus className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Account List */}
        <div className='space-y-2 mb-4'>
          {visibleAccounts.map((account) => {
            const isFirstAccount = accounts.length > 0 && accounts[0]?.id === account.id
            const canHide = visibleAccounts.length > 1 && !isFirstAccount

            return (
              <div
                key={account.id}
                onClick={() => handleAccountClick(account.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  account.id === activeAccountId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className='flex items-center space-x-3'>
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-r ${generateAccountIcon(account.name)} flex items-center justify-center`}
                  >
                    <span className='text-white font-semibold text-sm'>
                      {account.name.charAt(0)}
                    </span>
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p
                      className='font-medium text-gray-800 truncate max-w-[180px]'
                      title={account.name}
                    >
                      {account.name}
                    </p>
                    <p className='text-sm text-gray-500'>{formatAddress(account.AAaddress)}</p>
                    <p className='text-xs text-gray-400'>Salt: {account.salt}</p>
                  </div>
                </div>
                {canHide ? (
                  <button
                    onClick={(e) => handleHideAccount(e, account.id)}
                    className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    title='Hide Account'
                  >
                    <FiEyeOff className='w-4 h-4' />
                  </button>
                ) : (
                  <div
                    className='p-2 text-gray-300 cursor-not-allowed'
                    title={
                      isFirstAccount
                        ? 'Cannot hide - this is the consolidation target account'
                        : 'Cannot hide the last visible account'
                    }
                  >
                    <FiEyeOff className='w-4 h-4' />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Hidden Accounts Section */}
        {hiddenAccounts.length > 0 && (
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-2'>
              <h4 className='text-sm font-medium text-gray-600'>
                Hidden Accounts ({hiddenAccounts.length})
              </h4>
              <button
                onClick={() => setShowHiddenAccounts(!showHiddenAccounts)}
                className='text-xs text-blue-600 hover:text-blue-800 transition-colors'
              >
                {showHiddenAccounts ? 'Hide' : 'Show'}
              </button>
            </div>

            {showHiddenAccounts && (
              <div className='space-y-2 border-t pt-2'>
                {hiddenAccounts.map((account) => (
                  <div
                    key={account.id}
                    className='flex items-center justify-between p-2 rounded-lg bg-gray-50 opacity-75'
                  >
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-r ${generateAccountIcon(account.name)} flex items-center justify-center`}
                      >
                        <span className='text-white font-semibold text-xs'>
                          {account.name.charAt(0)}
                        </span>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p
                          className='font-medium text-gray-600 text-sm truncate max-w-[150px]'
                          title={account.name}
                        >
                          {account.name}
                        </p>
                        <p className='text-xs text-gray-500'>{formatAddress(account.AAaddress)}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleUnhideAccount(e, account.id)}
                      className='p-1 text-green-600 hover:bg-green-50 rounded transition-colors'
                      title='Unhide Account'
                    >
                      <FiRefreshCw className='w-3 h-3' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Consolidation Button */}
        <div className='mb-4'>
          <ConsolidationButton />
        </div>

        {/* Recovery Panel */}
        {showRecoveryPanel && (
          <div className='border-t pt-4 mt-4'>
            <h4 className='text-md font-semibold text-gray-800 mb-3 flex items-center gap-2'>
              <FiRefreshCw className='w-4 h-4' />
              Account Recovery
            </h4>

            {/* Recovery by Index */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Recover Account by Index
              </label>
              <div className='flex gap-2'>
                <input
                  type='number'
                  min='0'
                  placeholder='Account index (0, 1, 2...)'
                  value={recoveryIndex}
                  onChange={(e) => setRecoveryIndex(e.target.value)}
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <button
                  onClick={handleRecoverAccount}
                  disabled={!recoveryIndex}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
                >
                  Recover
                </button>
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                Enter the index of the account to recover (starts from 0)
              </p>
            </div>

            <div className='mt-3 p-3 bg-blue-50 rounded-lg'>
              <p className='text-xs text-blue-800'>
                <strong>💡 How AA Recovery Works:</strong>
                <br />
                • Same EOA + Same Salt → Same AA Address
                <br />
                • No private keys for AA accounts
                <br />
                • Deterministic address generation
                <br />• Check console for detailed explanations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hide Account Confirmation Modal */}
      {showHideConfirm.show && (
        <HideAccountConfirmModal
          accountName={showHideConfirm.accountName}
          onConfirm={() => {
            hideAccount(showHideConfirm.accountId)
            setShowHideConfirm({ show: false, accountId: '', accountName: '' })
          }}
          onCancel={() => setShowHideConfirm({ show: false, accountId: '', accountName: '' })}
        />
      )}
    </div>
  )
}
