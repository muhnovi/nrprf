import { useState, useEffect, useCallback } from 'react'
import { ERC20Token, NftWithImages } from '@/types'
import { tokenEventEmitter } from '@/utils'
import {
  saveCustomERC20Token,
  getCustomERC20Tokens,
  removeCustomERC20Token,
  saveCustomERC721Token,
  getCustomERC721Tokens,
  removeCustomERC721Token,
  updateCustomERC721Token,
} from '@/utils/localforage'

export const useCustomERC20Tokens = () => {
  const [erc20Tokens, setERC20Tokens] = useState<ERC20Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadTokens = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const tokens = await getCustomERC20Tokens()

        if (isMounted) {
          setERC20Tokens(tokens)
        }
      } catch (err) {
        console.error('Failed to load initial ERC20 tokens:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load tokens'))
          setERC20Tokens([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTokens()

    const unsubscribe = tokenEventEmitter.subscribe(async () => {
      try {
        const tokens = await getCustomERC20Tokens()
        if (isMounted) {
          setERC20Tokens(tokens)
        }
      } catch (err) {
        console.error('Failed to update ERC20 tokens:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to update tokens'))
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const addERC20Token = useCallback(async (token: ERC20Token) => {
    try {
      setError(null)
      await saveCustomERC20Token(token)
      setERC20Tokens((prev) => [...prev, token])
      tokenEventEmitter.emit()
    } catch (error) {
      console.error('Failed to add ERC20 token:', error)
      setError(error instanceof Error ? error : new Error('Failed to add token'))
      throw error
    }
  }, [])

  const removeERC20Token = useCallback(async (contractAddress: string) => {
    try {
      setError(null)
      await removeCustomERC20Token(contractAddress)
      setERC20Tokens((prev) =>
        prev.filter(
          (token) => token.contractAddress.toLowerCase() !== contractAddress.toLowerCase(),
        ),
      )
      tokenEventEmitter.emit()
    } catch (error) {
      console.error('Failed to remove ERC20 token:', error)
      setError(error instanceof Error ? error : new Error('Failed to remove token'))
      throw error
    }
  }, [])

  return {
    erc20Tokens,
    addERC20Token,
    removeERC20Token,
    isLoading,
    error,
  }
}

export const useCustomERC721Tokens = () => {
  const [erc721Tokens, setERC721Tokens] = useState<NftWithImages[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadTokens = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const tokens = await getCustomERC721Tokens()

        if (isMounted) {
          setERC721Tokens(tokens)
        }
      } catch (err) {
        console.error('Failed to load initial ERC721 tokens:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load NFT tokens'))
          setERC721Tokens([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTokens()

    const unsubscribe = tokenEventEmitter.subscribe(async () => {
      try {
        setIsLoading(true)
        const tokens = await getCustomERC721Tokens()
        if (isMounted) {
          setERC721Tokens(tokens)
        }
      } catch (err) {
        console.error('Failed to update ERC721 tokens:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to update NFT tokens'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const addERC721Token = useCallback(async (token: NftWithImages) => {
    try {
      setError(null)
      await saveCustomERC721Token(token)
      setERC721Tokens((prev) => [...prev, token])
      tokenEventEmitter.emit()
    } catch (error) {
      console.error('Failed to add ERC721 token:', error)
      setError(error instanceof Error ? error : new Error('Failed to add NFT'))
      throw error
    }
  }, [])

  const removeERC721Token = useCallback(
    async (contractAddress: string, tokenId?: number) => {
      try {
        setError(null)

        if (tokenId !== undefined) {
          const updatedTokens = erc721Tokens
            .map((token) => {
              if (token.contractAddress.toLowerCase() === contractAddress.toLowerCase()) {
                return {
                  ...token,
                  tokenData: token.tokenData.filter((data) => data.tokenId !== tokenId),
                }
              }
              return token
            })
            .filter((token) => token.tokenData.length > 0)

          setERC721Tokens(updatedTokens)

          // Update storage
          if (updatedTokens.length > 0) {
            const targetToken = updatedTokens.find(
              (t) => t.contractAddress.toLowerCase() === contractAddress.toLowerCase(),
            )
            if (targetToken) {
              await updateCustomERC721Token(targetToken)
            }
          } else {
            await removeCustomERC721Token(contractAddress)
          }
        } else {
          await removeCustomERC721Token(contractAddress)
          setERC721Tokens((prev) =>
            prev.filter(
              (token) => token.contractAddress.toLowerCase() !== contractAddress.toLowerCase(),
            ),
          )
        }

        tokenEventEmitter.emit()
      } catch (error) {
        console.error('Failed to remove ERC721 token:', error)
        setError(error instanceof Error ? error : new Error('Failed to remove NFT'))
        throw error
      }
    },
    [erc721Tokens],
  )

  return {
    erc721Tokens,
    addERC721Token,
    removeERC721Token,
    isLoading,
    error,
  }
}
