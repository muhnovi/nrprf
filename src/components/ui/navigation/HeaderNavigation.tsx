import React, { useEffect, useState, useRef, useContext } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { IoArrowBackSharp, IoEarthOutline, IoChevronDown, IoCopy } from 'react-icons/io5'
import { useAccount, useDisconnect } from 'wagmi'
import NEROLogoSquareIcon from '@/assets/NERO-Logo-square-beta.svg'
import {
  AccountDropdown,
  CreateAccountModal,
  StorageWarningModal,
} from '@/components/features/AccountSelector'
import { ConfigContext } from '@/contexts'
import { useScreenManager, useAccountManager } from '@/hooks'
import { HeaderNavigationProps, screens } from '@/types'

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  className = '',
  title,
  onBack,
  showBackButton = false,
  rightElement,
  isClose = false,
  navigate,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [favicon, setFavicon] = useState('')
  const { navigateTo, currentScreen, previousScreen } = useScreenManager()
  const [showFallback, setShowFallback] = useState(false)
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const menuRef = useRef<HTMLDivElement>(null)

  // AccountSelector functionality
  const { activeAccount, isCreatingAccount } = useAccountManager()
  const config = useContext(ConfigContext)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Storage warning modal state
  const [showStorageWarning, setShowStorageWarning] = useState(false)
  const [storageWarningMessage, setStorageWarningMessage] = useState('')

  const networkMenuRef = useRef<HTMLDivElement>(null)
  const accountDropdownRef = useRef<HTMLDivElement>(null)

  // Animation states for graceful show/hide
  const [networkMenuVisible, setNetworkMenuVisible] = useState(false)
  const [accountDropdownVisible, setAccountDropdownVisible] = useState(false)

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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

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

  // Handle network menu animations
  useEffect(() => {
    if (isNetworkMenuOpen) {
      setNetworkMenuVisible(true)
    } else {
      const timer = setTimeout(() => setNetworkMenuVisible(false), 150)
      return () => clearTimeout(timer)
    }
  }, [isNetworkMenuOpen])

  // Handle account dropdown animations
  useEffect(() => {
    if (isDropdownOpen) {
      setAccountDropdownVisible(true)
    } else {
      const timer = setTimeout(() => setAccountDropdownVisible(false), 150)
      return () => clearTimeout(timer)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    if (isConnected) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
      if (link) {
        setFavicon(link.href)
      }
    }
  }, [isConnected])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleIconClick = () => {
    if (isClose && navigate) {
      navigate()
    } else {
      if (currentScreen === screens.SETTING) {
        navigateTo(previousScreen)
      } else {
        navigateTo(screens.SETTING)
      }
    }
  }

  const handleDisconnect = async () => {
    disconnect()
    setShowMenu(false)
  }

  const handleBackClick = () => {
    if (onBack) {
      onBack()
    } else {
      navigateTo(previousScreen)
    }
  }

  return (
    <div
      className={`flex items-center justify-between border-b border-border-primary rounded-tr rounded-tl text-text-primary bg-white px-2 py-2 ${className}`}
    >
      <div className='flex items-center gap-2'>
        {showBackButton && (
          <button onClick={handleBackClick} className='p-1 rounded-full hover:bg-gray-100'>
            <IoArrowBackSharp className='size-5' />
          </button>
        )}
        {title ? (
          <h2 className='text-lg font-medium'>{title}</h2>
        ) : (
          <img src={NEROLogoSquareIcon} alt='NERO Logo' width={30} height={30} />
        )}
      </div>

      {/* Compact MetaMask-style AccountSelector */}
      {isConnected && (
        <div className='flex items-center space-x-2 flex-1 max-w-sm mx-4'>
          {/* Network Selection Button */}
          <div className='relative' ref={networkMenuRef}>
            <button
              onClick={() => setIsNetworkMenuOpen(!isNetworkMenuOpen)}
              className='p-1.5 hover:bg-gray-100 rounded transition-colors'
              title='Switch Network'
            >
              <IoEarthOutline className='w-5 h-5 text-gray-600' />
            </button>

            {networkMenuVisible && (
              <div
                className={`absolute left-0 top-full mt-1 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 transition-all duration-150 ease-out ${
                  isNetworkMenuOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-1'
                }`}
              >
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
                      <span className='capitalize'>
                        {chain.chain.networkType.replace('_', ' ')}
                      </span>
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

          {/* Account Section - Two Separate Buttons Stacked */}
          <div className='relative flex-1' ref={accountDropdownRef}>
            <div className='flex flex-col'>
              {/* Top Button: Account Name with Dropdown */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded-t transition-colors w-full border-b border-gray-200'
                disabled={isCreatingAccount}
              >
                {/* Centered Avatar + Account Name */}
                <div className='flex items-center justify-center space-x-2 flex-1'>
                  {/* Account Avatar */}
                  <div
                    className={`w-5 h-5 bg-gradient-to-br ${generateAccountIcon(activeAccount?.name || 'Account')} rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                  >
                    {isCreatingAccount ? (
                      <div className='w-2 h-2 border border-white border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      activeAccount?.name?.charAt(0) || 'A'
                    )}
                  </div>

                  {/* Account Name */}
                  <span
                    className='text-sm font-medium text-text-primary truncate max-w-[120px]'
                    title={isCreatingAccount ? 'Creating...' : activeAccount?.name || 'No Account'}
                  >
                    {isCreatingAccount ? 'Creating...' : activeAccount?.name || 'No Account'}
                  </span>
                </div>

                {/* Dropdown Arrow - Right Side */}
                <IoChevronDown
                  className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Bottom Button: Address Copy */}
              <button
                onClick={handleCopyAddress}
                className='flex items-center justify-center space-x-1 px-2 py-1 hover:bg-gray-100 rounded-b transition-colors text-xs text-gray-500 hover:text-gray-700 group w-full'
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

            {/* Account Dropdown with Animation */}
            {accountDropdownVisible && (
              <div
                className={`absolute top-full left-0 w-full z-30 transition-all duration-150 ease-out ${
                  isDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-1'
                }`}
              >
                <AccountDropdown
                  onClose={() => setIsDropdownOpen(false)}
                  onCreateAccount={() => {
                    setIsDropdownOpen(false)
                    setIsCreateModalOpen(true)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className='flex items-center space-x-2'>
        {rightElement}
        {isConnected && (
          <div className='relative border rounded-full border-border-primary' ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className='flex items-center space-x-2 hover:bg-gray-200 rounded-full'
            >
              {favicon && !showFallback ? (
                <img
                  src={favicon}
                  alt='Site favicon'
                  width={24}
                  height={24}
                  className='rounded-full object-cover'
                  onError={() => setShowFallback(true)}
                />
              ) : (
                <div className='w-6 h-6 flex items-center justify-center'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                </div>
              )}
            </button>
            {showMenu && (
              <div className='absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10'>
                <div
                  className='py-1'
                  role='menu'
                  aria-orientation='vertical'
                  aria-labelledby='options-menu'
                >
                  <button
                    onClick={handleDisconnect}
                    className='block w-full text-left px-4 py-2 text-sm text-text-tertiary hover:bg-gray-100'
                    role='menuitem'
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <BsThreeDotsVertical className='size-5 cursor-pointer' onClick={handleIconClick} />
      </div>

      {/* Create Account Modal */}
      {isCreateModalOpen && (
        <CreateAccountModal
          onClose={() => setIsCreateModalOpen(false)}
          onStorageWarning={(message: string) => {
            setIsCreateModalOpen(false)
            setStorageWarningMessage(message)
            setShowStorageWarning(true)
          }}
        />
      )}

      {/* Storage Warning Modal */}
      {showStorageWarning && (
        <StorageWarningModal
          message={storageWarningMessage}
          onClose={() => setShowStorageWarning(false)}
        />
      )}
    </div>
  )
}

export default HeaderNavigation
