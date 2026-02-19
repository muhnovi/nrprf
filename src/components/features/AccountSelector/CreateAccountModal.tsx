import React, { useState } from 'react'
import { useAccountManager } from '@/hooks'
import { isStorageNearFull } from '@/utils/localforage'

interface CreateAccountModalProps {
  onClose: () => void
  onStorageWarning?: (message: string) => void
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  onClose,
  onStorageWarning,
}) => {
  const { createAccount, isCreatingAccount } = useAccountManager()
  const [accountName, setAccountName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check storage quota before proceeding
    try {
      const storageCheck = await isStorageNearFull()
      if (storageCheck.isFull) {
        console.error('Cannot create account: Storage is full')
        if (onStorageWarning) {
          onStorageWarning(
            storageCheck.message || 'Storage is full. Please clear browser data to continue.',
          )
          return
        }
      }
    } catch (error) {
      console.error('Error checking storage:', error)
      // Continue with account creation if storage check fails
    }

    try {
      await createAccount(accountName.trim() || undefined)
      onClose()
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      onClick={handleOverlayClick}
    >
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md mx-4'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-text-primary'>Create New Account</h2>
            <button
              onClick={onClose}
              className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
              disabled={isCreatingAccount}
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

          <form onSubmit={handleSubmit}>
            <div className='mb-4'>
              <label
                htmlFor='accountName'
                className='block text-sm font-medium text-text-primary mb-2'
              >
                Account Name
              </label>
              <input
                type='text'
                id='accountName'
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder='Enter account name (optional)'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                disabled={isCreatingAccount}
                maxLength={50}
              />
              <p className='text-xs text-gray-500 mt-1'>
                If left empty, a default name will be generated
              </p>
            </div>

            <div className='flex space-x-3'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors'
                disabled={isCreatingAccount}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='flex-1 px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={isCreatingAccount}
              >
                {isCreatingAccount ? (
                  <div className='flex items-center justify-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
