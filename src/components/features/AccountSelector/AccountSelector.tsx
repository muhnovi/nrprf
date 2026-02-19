import React, { useState, useRef, useEffect, useContext } from 'react'
import { IoEarthOutline, IoChevronDown, IoCopy } from 'react-icons/io5'
import { AccountDropdown } from './AccountDropdown'
import { CreateAccountModal } from './CreateAccountModal'
import { ConfigContext } from '@/contexts'
import { useAccountManager } from '@/hooks'

export const AccountSelector: React.FC = () => {
  const { activeAccount, isCreatingAccount, accounts } = useAccountManager()
  const config = useContext(ConfigContext)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const networkMenuRef = useRef<HTMLDivElement>(null)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Check if current account is the first account (consolidation target)
  const isConsolidationTarget = accounts.length > 0 && accounts[0]?.id === activeAccount?.id

  const handleCopyAddress = async () => {
    if (activeAccount?.AAaddress) {
      try {
        await navigator.clipboard.writeText(activeAccount.AAaddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy address:', err)
      }
    }
  }

  const handleNetworkSelect = (index: number) => {
    config?.switchToNetwork(index)
    setIsNetworkMenuOpen(false)
  }

  // Close network menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (networkMenuRef.current && !networkMenuRef.current.contains(event.target as Node)) {
        setIsNetworkMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
      <div className='flex items-stretch'>
        {/* Network Selection - Left Side */}
        <div className='relative border-r border-gray-200' ref={networkMenuRef}>
          <button
            onClick={() => setIsNetworkMenuOpen(!isNetworkMenuOpen)}
            className='flex items-center justify-center px-3 py-3 hover:bg-gray-50 transition-colors rounded-l-lg group'
            title='Switch Network'
          >
            <IoEarthOutline className='w-5 h-5 text-blue-600 group-hover:text-blue-700' />
          </button>

          {isNetworkMenuOpen && (
            <div className='absolute left-0 top-full mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20'>
              <div className='py-1' role='menu'>
                <div className='px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100'>
                  Select Network
                </div>
                {config?.chains.map((chain, index) => (
                  <button
                    key={chain.chain.networkType}
                    onClick={() => handleNetworkSelect(index)}
                    className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors
                      ${index === config.currentNetworkIndex ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-3 ${
                        index === config.currentNetworkIndex ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                    ></div>
                    <span className='capitalize'>{chain.chain.networkType.replace('_', ' ')}</span>
                    {index === config.currentNetworkIndex && (
                      <div className='ml-auto'>
                        <div className='w-1.5 h-1.5 bg-blue-600 rounded-full'></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account Info - Main Section */}
        <div className='flex-1 relative'>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className='w-full flex items-center px-4 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg'
            disabled={isCreatingAccount}
          >
            <div className='flex items-center space-x-3 flex-1 min-w-0'>
              {/* Account Avatar */}
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0'>
                {isCreatingAccount ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                ) : (
                  activeAccount?.name?.charAt(0) || 'A'
                )}
              </div>

              {/* Account Details */}
              <div className='flex flex-col items-start min-w-0 flex-1'>
                {/* Account Name */}
                <div className='flex items-center space-x-2 w-full min-w-0'>
                  <span
                    className='text-base font-semibold text-gray-900 truncate max-w-[180px]'
                    title={
                      isCreatingAccount
                        ? 'Creating Account...'
                        : activeAccount?.name || 'No Account'
                    }
                  >
                    {isCreatingAccount
                      ? 'Creating Account...'
                      : activeAccount?.name || 'No Account'}
                  </span>
                  {isConsolidationTarget && (
                    <span className='flex-shrink-0 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full'>
                      Target
                    </span>
                  )}
                </div>

                {/* Address - Clickable for Copy */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyAddress()
                  }}
                  className='flex items-center space-x-1 mt-1 text-xs text-gray-500 hover:text-gray-700 transition-colors group'
                  title={copied ? 'Copied!' : 'Click to copy address'}
                >
                  <span className='font-mono'>
                    {activeAccount ? formatAddress(activeAccount.AAaddress) : '0x000...000'}
                  </span>
                  <IoCopy
                    className={`w-3 h-3 transition-colors ${
                      copied ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  {copied && <span className='text-green-600 font-medium ml-1'>Copied!</span>}
                </button>
              </div>
            </div>

            {/* Dropdown Arrow */}
            <IoChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Account Dropdown */}
          {isDropdownOpen && !isCreatingAccount && (
            <AccountDropdown
              onClose={() => setIsDropdownOpen(false)}
              onCreateAccount={() => {
                setIsDropdownOpen(false)
                setIsCreateModalOpen(true)
              }}
            />
          )}
        </div>
      </div>

      {/* Current Network Indicator */}
      <div className='px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <span className='text-xs text-gray-600 capitalize'>
              Connected to {config?.networkType?.replace('_', ' ')}
            </span>
          </div>
          <div className='flex items-center space-x-1 text-xs text-gray-500'>
            <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
            <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
            <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {isCreateModalOpen && <CreateAccountModal onClose={() => setIsCreateModalOpen(false)} />}
    </div>
  )
}
