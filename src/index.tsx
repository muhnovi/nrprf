// src/index.tsx
import React from 'react'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'
import {
  AccountManagerProvider,
  ClientProvider,
  ConfigProvider,
  MultiSendProvider,
  NFTProvider,
  PaymasterProvider,
  ScreenManagerProvider,
  SendProvider,
  SendUserOpProvider,
  SignatureProvider,
  TokenProvider,
  TransactionProvider,
  WrapWagmiProvider,
} from '@/contexts'
import { AccountConsolidationProvider } from '@/contexts/AccountConsolidationContext'
import { useSignature, useAAtransfer, useSendUserOp, useConfig } from '@/hooks'
import { useAccountManager } from '@/hooks/account/useAccountManager'
import '@rainbow-me/rainbowkit/styles.css'
import '@/index.css'
import { WalletConfig } from '@/types'

interface SocialWalletProps {
  config: WalletConfig
  zIndex?: number
  children?: React.ReactNode
  mode?: 'sidebar' | 'button'
}

export const SocialWallet: React.FC<SocialWalletProps> = ({
  config,
  zIndex = 9999,
  children,
  mode = 'sidebar',
}) => {
  const queryClient = new QueryClient()

  return (
    <ConfigProvider config={config}>
      <WrapWagmiProvider>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider modalSize='compact'>
            <AccountManagerProvider>
              <SignatureProvider>
                <ScreenManagerProvider>
                  <PaymasterProvider>
                    <TokenProvider>
                      <NFTProvider>
                        <SendProvider>
                          <MultiSendProvider>
                            <ClientProvider>
                              <AccountConsolidationProvider>
                                <SendUserOpProvider>
                                  <TransactionProvider>
                                    {children}
                                    <div style={{ position: 'relative', zIndex: zIndex }}>
                                      <App mode={mode} />
                                    </div>
                                  </TransactionProvider>
                                </SendUserOpProvider>
                              </AccountConsolidationProvider>
                            </ClientProvider>
                          </MultiSendProvider>
                        </SendProvider>
                      </NFTProvider>
                    </TokenProvider>
                  </PaymasterProvider>
                </ScreenManagerProvider>
              </SignatureProvider>
            </AccountManagerProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WrapWagmiProvider>
    </ConfigProvider>
  )
}

export { useAAtransfer, useSignature, useSendUserOp, useConfig, useAccountManager }
