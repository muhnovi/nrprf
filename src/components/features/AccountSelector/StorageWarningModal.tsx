import React from 'react'

interface StorageWarningModalProps {
  onClose: () => void
  message: string
}

export const StorageWarningModal: React.FC<StorageWarningModalProps> = ({ onClose, message }) => {
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
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-red-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <h2 className='text-lg font-semibold text-text-primary'>Storage Full</h2>
            </div>
            <button
              onClick={onClose}
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
            <p className='text-text-primary text-sm leading-relaxed mb-4'>{message}</p>

            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
              <h3 className='text-sm font-medium text-yellow-800 mb-2'>💡 How to fix this:</h3>
              <ul className='text-xs text-yellow-700 space-y-1'>
                <li>• Clear your browser data (Settings → Privacy → Clear browsing data)</li>
                <li>• Use browser developer tools (F12 → Application → Local Storage → Clear)</li>
                <li>• Free up storage space by removing unused data</li>
              </ul>
            </div>
          </div>

          <div className='flex space-x-3'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors'
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
