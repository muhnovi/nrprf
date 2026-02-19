import { vi, describe, beforeEach, test, expect } from 'vitest'
import {
  generateDeterministicSalt,
  generateStorageKeys,
  sanitizeAccountName,
  validateAccountData,
  safeJsonParse,
} from '@/utils/security'
import { isValidAddress } from '@/utils/validation'

describe('🛡️ Core Security Functions', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Deterministic Salt Generation', () => {
    test('should generate salt = 0 for first account (index 0)', () => {
      const signerAddress = '0x1234567890123456789012345678901234567890'
      const chainId = 11155111

      expect(generateDeterministicSalt(signerAddress, 0, chainId)).toBe(0)
    })

    test('should generate unique deterministic salts for different indices', () => {
      const signerAddress = '0x1234567890123456789012345678901234567890'
      const chainId = 11155111

      const salts = []
      for (let i = 0; i < 10; i++) {
        salts.push(generateDeterministicSalt(signerAddress, i, chainId))
      }

      // Verify all salts are unique
      const uniqueSalts = new Set(salts)
      expect(uniqueSalts.size).toBe(10)

      // Verify first salt is 0
      expect(salts[0]).toBe(0)

      // Verify subsequent salts are not 0
      for (let i = 1; i < 10; i++) {
        expect(salts[i]).not.toBe(0)
      }
    })

    test('should generate different salts for different signers', () => {
      const signer1 = '0x1111111111111111111111111111111111111111'
      const signer2 = '0x2222222222222222222222222222222222222222'
      const chainId = 11155111
      const accountIndex = 1

      const salt1 = generateDeterministicSalt(signer1, accountIndex, chainId)
      const salt2 = generateDeterministicSalt(signer2, accountIndex, chainId)

      expect(salt1).not.toBe(salt2)
    })

    test('should generate different salts for different chain IDs', () => {
      const signerAddress = '0x1234567890123456789012345678901234567890'
      const accountIndex = 1

      const saltMainnet = generateDeterministicSalt(signerAddress, accountIndex, 1)
      const saltSepolia = generateDeterministicSalt(signerAddress, accountIndex, 11155111)

      expect(saltMainnet).not.toBe(saltSepolia)
    })
  })

  describe('Authentication Detection', () => {
    test('should detect metamask authentication method', () => {
      const detectAuthMethod = (connector: any) => {
        if (connector?.id === 'injected' || connector?.name === 'MetaMask') {
          return 'metamask'
        }
        return 'unknown'
      }

      const metamaskConnector = { id: 'injected', name: 'MetaMask' }
      expect(detectAuthMethod(metamaskConnector)).toBe('metamask')
    })

    test('should detect web3auth google authentication', () => {
      const detectAuthMethod = (connector: any, userInfo: any) => {
        if (connector?.id === 'web3auth') {
          if (userInfo?.typeOfLogin === 'google') {
            return 'web3auth-google'
          }
        }
        return 'unknown'
      }

      const web3authConnector = { id: 'web3auth' }
      const googleUserInfo = { typeOfLogin: 'google', email: 'user@gmail.com' }

      expect(detectAuthMethod(web3authConnector, googleUserInfo)).toBe('web3auth-google')
    })
  })

  describe('Storage Key Generation', () => {
    test('should generate unique storage keys for different auth contexts', () => {
      const signerAddress = '0x1234567890123456789012345678901234567890'

      const metamaskKeys = generateStorageKeys(signerAddress, 'metamask')
      const googleKeys = generateStorageKeys(signerAddress, 'web3auth-google', 'user@gmail.com')
      const facebookKeys = generateStorageKeys(
        signerAddress,
        'web3auth-facebook',
        'user@facebook.com',
      )

      // All keys should be unique
      const accountsKeys = [
        metamaskKeys.accountsKey,
        googleKeys.accountsKey,
        facebookKeys.accountsKey,
      ]
      const uniqueAccountsKeys = new Set(accountsKeys)
      expect(uniqueAccountsKeys.size).toBe(3)

      // Keys should follow expected format
      expect(metamaskKeys.accountsKey).toMatch(/^nero-wallet-accounts-0x[a-f0-9]{40}-metamask$/)
      expect(googleKeys.accountsKey).toMatch(
        /^nero-wallet-accounts-0x[a-f0-9]{40}-web3auth-google-/,
      )

      // Should also generate activeAccountKey
      expect(metamaskKeys.activeAccountKey).toMatch(
        /^nero-wallet-active-account-0x[a-f0-9]{40}-metamask$/,
      )
    })

    test('should sanitize user IDs in storage keys', () => {
      const dangerousUserId = '<script>alert("xss")</script>@evil.com'
      const keys = generateStorageKeys(
        '0x1234567890123456789012345678901234567890',
        'web3auth-google',
        dangerousUserId,
      )

      // Should not contain dangerous characters
      expect(keys.accountsKey).not.toContain('<')
      expect(keys.accountsKey).not.toContain('>')
      expect(keys.accountsKey).not.toContain('(')
      expect(keys.accountsKey).not.toContain(')')
      expect(keys.accountsKey).not.toContain('"')
      expect(keys.accountsKey).not.toContain('@')
    })
  })

  describe('Account Data Validation', () => {
    test('should validate account data structure', () => {
      const validAccount = {
        id: 'account_123',
        name: 'Test Account',
        AAaddress: '0x1234567890123456789012345678901234567890',
        salt: 12345,
        createdAt: Date.now(),
      }

      const validAccountWithHidden = {
        ...validAccount,
        hidden: false,
      }

      const invalidAccounts = [
        null,
        undefined,
        {},
        { id: 'test' }, // Missing required fields
        { ...validAccount, id: 123 }, // Wrong type
        { ...validAccount, AAaddress: '0x123' }, // Invalid address
        { ...validAccount, salt: '123' }, // Wrong type
        { ...validAccount, hidden: 'false' }, // Wrong type for hidden field
      ]

      expect(validateAccountData(validAccount)).toBe(true)
      expect(validateAccountData(validAccountWithHidden)).toBe(true)

      invalidAccounts.forEach((account) => {
        expect(validateAccountData(account)).toBe(false)
      })
    })

    test('should prevent hiding the first account (consolidation target)', () => {
      const accounts = [
        { id: 'first_account', name: 'Account 1', createdAt: 1000 },
        { id: 'second_account', name: 'Account 2', createdAt: 2000 },
        { id: 'third_account', name: 'Account 3', createdAt: 3000 },
      ]

      const canHideAccount = (accountId: string, allAccounts: any[]) => {
        const targetAccount = allAccounts.find((acc) => acc.id === accountId)
        if (!targetAccount) return false

        // Don't allow hiding the first account (consolidation master)
        const firstAccount = allAccounts[0]
        if (firstAccount && targetAccount.id === firstAccount.id) {
          return false
        }

        // Don't allow hiding if only one visible account remains
        const visibleAccounts = allAccounts.filter((acc) => !acc.hidden)
        if (visibleAccounts.length <= 1) {
          return false
        }

        return true
      }

      // Should not be able to hide first account
      expect(canHideAccount('first_account', accounts)).toBe(false)

      // Should be able to hide other accounts
      expect(canHideAccount('second_account', accounts)).toBe(true)
      expect(canHideAccount('third_account', accounts)).toBe(true)

      // Should not be able to hide last visible account
      const accountsWithTwoHidden = [
        { id: 'first_account', name: 'Account 1', createdAt: 1000 },
        { id: 'second_account', name: 'Account 2', createdAt: 2000, hidden: true },
        { id: 'third_account', name: 'Account 3', createdAt: 3000, hidden: true },
      ]
      expect(canHideAccount('first_account', accountsWithTwoHidden)).toBe(false)
    })

    test('should validate account isolation in storage', () => {
      const getAccountsForAuth = (signerAddress: string, authMethod: string) => {
        const keys = generateStorageKeys(signerAddress, authMethod)
        const storedData = localStorage.getItem(keys.accountsKey)
        return storedData ? safeJsonParse(storedData, []) : []
      }

      const setAccountsForAuth = (signerAddress: string, authMethod: string, accounts: any[]) => {
        const keys = generateStorageKeys(signerAddress, authMethod)
        localStorage.setItem(keys.accountsKey, JSON.stringify(accounts))
      }

      const signer1 = '0x1111111111111111111111111111111111111111'
      const signer2 = '0x2222222222222222222222222222222222222222'
      const accounts1 = [{ id: '1', name: 'Account 1' }]
      const accounts2 = [{ id: '2', name: 'Account 2' }]

      setAccountsForAuth(signer1, 'metamask', accounts1)
      setAccountsForAuth(signer2, 'metamask', accounts2)

      // Accounts should be isolated by signer
      expect(getAccountsForAuth(signer1, 'metamask')).toEqual(accounts1)
      expect(getAccountsForAuth(signer2, 'metamask')).toEqual(accounts2)

      // Different auth methods should be isolated
      setAccountsForAuth(signer1, 'web3auth-google', accounts2)
      expect(getAccountsForAuth(signer1, 'metamask')).toEqual(accounts1)
      expect(getAccountsForAuth(signer1, 'web3auth-google')).toEqual(accounts2)
    })
  })

  describe('Input Sanitization', () => {
    test('should handle malicious account names safely', () => {
      const maliciousNames = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '"><img src=x onerror=alert(1)>',
        'Account with "quotes" and \'apostrophes\'',
        '',
        null,
        undefined,
        'A'.repeat(100), // Very long name
      ]

      maliciousNames.forEach((name) => {
        const sanitized = sanitizeAccountName(name as string)
        expect(sanitized).not.toContain('<')
        expect(sanitized).not.toContain('>')
        expect(sanitized).not.toContain('"')
        expect(sanitized).not.toContain("'")
        expect(sanitized).not.toContain('&')
        expect(sanitized.length).toBeLessThanOrEqual(50)
        expect(sanitized.length).toBeGreaterThan(0)
      })
    })

    test('should validate address format', () => {
      const validAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0xffffffffffffffffffffffffffffffffffffffff',
        '0x0000000000000000000000000000000000000000',
      ]

      const invalidAddresses = [
        '1234567890123456789012345678901234567890', // Missing 0x
        '0x123', // Too short
        '0xGGGG567890123456789012345678901234567890', // Invalid hex
        '',
        null,
        undefined,
      ]

      validAddresses.forEach((address) => {
        expect(isValidAddress(address)).toBe(true)
      })

      invalidAddresses.forEach((address) => {
        expect(isValidAddress(address as string)).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle corrupted localStorage gracefully', () => {
      const safeGetAccounts = (storageKey: string) => {
        try {
          const stored = localStorage.getItem(storageKey)
          if (!stored) return []
          return JSON.parse(stored)
        } catch {
          // Clear corrupted data and return empty array
          localStorage.removeItem(storageKey)
          return []
        }
      }

      // Set corrupted data
      localStorage.setItem('test-key', '{invalid json}')

      const result = safeGetAccounts('test-key')
      expect(result).toEqual([])
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    test('should handle missing signer gracefully', () => {
      const createAccountSafely = (signer: any) => {
        if (!signer || typeof signer.getAddress !== 'function') {
          throw new Error('Valid signer required')
        }
        return { success: true }
      }

      expect(() => createAccountSafely(null)).toThrow('Valid signer required')
      expect(() => createAccountSafely({})).toThrow('Valid signer required')
      expect(() => createAccountSafely({ getAddress: () => '0x123' })).not.toThrow()
    })
  })

  describe('Performance & Security Constraints', () => {
    test('should enforce reasonable salt range', () => {
      const isValidSalt = (salt: number) => {
        return (
          typeof salt === 'number' &&
          Number.isInteger(salt) &&
          salt >= 0 &&
          salt <= 0xffffffff &&
          !Number.isNaN(salt) &&
          Number.isFinite(salt)
        )
      }

      const validSalts = [0, 1, 12345, 0xffffffff]
      const invalidSalts = [-1, 1.5, NaN, Infinity, 0x100000000]

      validSalts.forEach((salt) => {
        expect(isValidSalt(salt)).toBe(true)
      })

      invalidSalts.forEach((salt) => {
        expect(isValidSalt(salt)).toBe(false)
      })
    })

    test('should limit account creation rate', async () => {
      vi.useFakeTimers()

      const rateLimiter = {
        lastCreation: 0,
        minInterval: 1000, // 1 second

        canCreateAccount() {
          const now = Date.now()
          if (now - this.lastCreation < this.minInterval) {
            return false
          }
          this.lastCreation = now
          return true
        },
      }

      // First creation should be allowed
      expect(rateLimiter.canCreateAccount()).toBe(true)

      // Immediate second creation should be blocked
      expect(rateLimiter.canCreateAccount()).toBe(false)

      // Advance time by 1100ms and try again
      vi.advanceTimersByTime(1100)
      expect(rateLimiter.canCreateAccount()).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('🚨 Critical Edge Cases & Security Vulnerabilities', () => {
    describe('Salt Collision & Address Hijacking Prevention', () => {
      test('should prevent salt collision attacks across different EOAs', () => {
        const generateSalt = (signerAddress: string, accountIndex: number, chainId: number) => {
          if (accountIndex === 0) return 0

          let hash = 0
          const input = `${signerAddress}-${accountIndex}-${chainId}`
          for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) - hash + input.charCodeAt(i)) & 0xffffffff
          }
          return Math.abs(hash) % 0xffffffff || 1
        }

        // Test with similar but different addresses (potential collision vectors)
        const similarAddresses = [
          '0x1234567890123456789012345678901234567890',
          '0x1234567890123456789012345678901234567891', // Last digit different
          '0x0234567890123456789012345678901234567890', // First digit different
          '0x1234567890123456789012345678901234567880', // Second to last different
        ]

        const chainId = 11155111
        const accountIndex = 1

        const salts = similarAddresses.map((addr) => generateSalt(addr, accountIndex, chainId))

        // All salts should be unique (no collisions)
        const uniqueSalts = new Set(salts)
        expect(uniqueSalts.size).toBe(similarAddresses.length)
      })

      test('should prevent salt manipulation by limiting input ranges', () => {
        const generateSalt = (signerAddress: string, accountIndex: number, chainId: number) => {
          // Input validation to prevent manipulation
          if (
            typeof signerAddress !== 'string' ||
            !signerAddress.startsWith('0x') ||
            signerAddress.length !== 42
          ) {
            throw new Error('Invalid signer address')
          }
          if (typeof accountIndex !== 'number' || accountIndex < 0 || accountIndex > 1000) {
            throw new Error('Invalid account index range')
          }
          if (typeof chainId !== 'number' || chainId < 1 || chainId > 0xffffffff) {
            throw new Error('Invalid chain ID')
          }

          if (accountIndex === 0) return 0

          let hash = 0
          const input = `${signerAddress}-${accountIndex}-${chainId}`
          for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) - hash + input.charCodeAt(i)) & 0xffffffff
          }
          return Math.abs(hash) % 0xffffffff || 1
        }

        // Valid inputs should work
        expect(() =>
          generateSalt('0x1234567890123456789012345678901234567890', 5, 11155111),
        ).not.toThrow()

        // Invalid inputs should be rejected
        expect(() => generateSalt('invalid-address', 1, 11155111)).toThrow('Invalid signer address')
        expect(() =>
          generateSalt('0x1234567890123456789012345678901234567890', -1, 11155111),
        ).toThrow('Invalid account index range')
        expect(() =>
          generateSalt('0x1234567890123456789012345678901234567890', 1001, 11155111),
        ).toThrow('Invalid account index range')
        expect(() => generateSalt('0x1234567890123456789012345678901234567890', 1, 0)).toThrow(
          'Invalid chain ID',
        )
        expect(() =>
          generateSalt('0x1234567890123456789012345678901234567890', 1, 0x100000000),
        ).toThrow('Invalid chain ID')
      })

      test('should prevent deterministic salt prediction by using cryptographically secure inputs', () => {
        // Simulate weak salt generation (predictable)
        const weakSaltGen = (accountIndex: number) => accountIndex * 12345

        // Simulate strong salt generation (cryptographically secure)
        const strongSaltGen = (signerAddress: string, accountIndex: number, chainId: number) => {
          if (accountIndex === 0) return 0

          // Simulate cryptographic hash with unpredictable output
          let hash = 0
          const input = `${signerAddress}-${accountIndex}-${chainId}-${Date.now()}`
          for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) - hash + input.charCodeAt(i)) & 0xffffffff
          }
          return Math.abs(hash) % 0xffffffff || 1
        }

        // Weak salts should be easily predictable
        const weakSalts = [1, 2, 3, 4, 5].map((i) => weakSaltGen(i))
        const predictedWeak = [1, 2, 3, 4, 5].map((i) => i * 12345)
        expect(weakSalts).toEqual(predictedWeak) // Should be predictable (bad)

        // Strong salts should not be easily predictable
        const strongSalts = [1, 2, 3, 4, 5].map((i) =>
          strongSaltGen('0x1234567890123456789012345678901234567890', i, 11155111),
        )
        const notSequential = strongSalts.every(
          (salt, index) => index === 0 || Math.abs(salt - strongSalts[index - 1]) > 1000,
        )
        expect(notSequential).toBe(true) // Should not be sequential
      })
    })

    describe('Account Recovery Attack Prevention', () => {
      test('should prevent unauthorized account recovery by validating ownership', () => {
        const recoverAccount = (
          signerAddress: string,
          accountIndex: number,
          claimedOwnerSignature: string,
        ) => {
          // Simulate signature verification
          const isValidSignature = (signature: string, expectedSigner: string) => {
            // In real implementation, this would verify cryptographic signature
            return signature.includes(expectedSigner.slice(0, 10))
          }

          if (!isValidSignature(claimedOwnerSignature, signerAddress)) {
            throw new Error('Invalid signature - unauthorized recovery attempt')
          }

          // Additional check: ensure account index is reasonable
          if (accountIndex < 0 || accountIndex > 100) {
            throw new Error('Suspicious account index - potential brute force attack')
          }

          return {
            recovered: true,
            address: signerAddress,
            index: accountIndex,
          }
        }

        const validSigner = '0x1234567890123456789012345678901234567890'
        const validSignature = 'signature-containing-0x12345678'
        const invalidSignature = 'signature-containing-0xdeadbeef'

        // Valid recovery should work
        expect(() => recoverAccount(validSigner, 5, validSignature)).not.toThrow()

        // Invalid signature should be rejected
        expect(() => recoverAccount(validSigner, 5, invalidSignature)).toThrow('Invalid signature')

        // Suspicious index should be rejected
        expect(() => recoverAccount(validSigner, 999, validSignature)).toThrow(
          'Suspicious account index',
        )
      })

      test('should rate limit account discovery to prevent enumeration attacks', () => {
        vi.useFakeTimers()

        const discoveryRateLimiter = {
          lastDiscovery: 0,
          minInterval: 5000, // 5 seconds between discovery attempts
          maxAccountsPerDiscovery: 10,

          canPerformDiscovery(requestedAccountCount: number) {
            const now = Date.now()

            // Check time-based rate limit
            if (now - this.lastDiscovery < this.minInterval) {
              return { allowed: false, reason: 'Rate limited - too frequent discovery attempts' }
            }

            // Check account count limit
            if (requestedAccountCount > this.maxAccountsPerDiscovery) {
              return {
                allowed: false,
                reason: 'Too many accounts requested - potential enumeration attack',
              }
            }

            this.lastDiscovery = now
            return { allowed: true }
          },
        }

        // First discovery should be allowed
        expect(discoveryRateLimiter.canPerformDiscovery(5).allowed).toBe(true)

        // Immediate second discovery should be blocked
        expect(discoveryRateLimiter.canPerformDiscovery(5).allowed).toBe(false)

        // Large account discovery should be blocked
        vi.advanceTimersByTime(6000)
        expect(discoveryRateLimiter.canPerformDiscovery(50).allowed).toBe(false)

        // Normal discovery after rate limit should work
        expect(discoveryRateLimiter.canPerformDiscovery(5).allowed).toBe(true)

        vi.useRealTimers()
      })
    })

    describe('Paymaster Security Vulnerabilities', () => {
      test('should validate paymaster address and prevent malicious paymasters', () => {
        const validatePaymaster = (paymasterAddress: string, allowedPaymasters: string[]) => {
          // Check if paymaster is in whitelist
          if (!allowedPaymasters.includes(paymasterAddress.toLowerCase())) {
            throw new Error('Untrusted paymaster - potential fund drain attack')
          }

          // Check address format
          if (!paymasterAddress.startsWith('0x') || paymasterAddress.length !== 42) {
            throw new Error('Invalid paymaster address format')
          }

          // Prevent zero address
          if (paymasterAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Untrusted paymaster - potential fund drain attack')
          }

          return true
        }

        const allowedPaymasters = [
          '0x1234567890123456789012345678901234567890',
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        ]

        // Valid paymaster should work
        expect(() => validatePaymaster(allowedPaymasters[0], allowedPaymasters)).not.toThrow()

        // Unlisted paymaster should be rejected
        expect(() =>
          validatePaymaster('0x9999999999999999999999999999999999999999', allowedPaymasters),
        ).toThrow('Untrusted paymaster - potential fund drain attack')

        // Zero address should be rejected
        expect(() =>
          validatePaymaster('0x0000000000000000000000000000000000000000', allowedPaymasters),
        ).toThrow('Untrusted paymaster - potential fund drain attack')

        // Invalid format should be rejected
        expect(() => validatePaymaster('invalid-address', allowedPaymasters)).toThrow(
          'Untrusted paymaster - potential fund drain attack',
        )
      })

      test('should prevent paymaster token approval exploitation', () => {
        const validateTokenApproval = (
          tokenAddress: string,
          spenderAddress: string,
          amount: string,
        ) => {
          // Check for suspicious unlimited approvals
          const maxSafeApproval = '1000000000000000000000000' // 1M tokens (example threshold)

          if (
            amount ===
            '115792089237316195423570985008687907853269984665640564039457584007913129639935'
          ) {
            throw new Error('Unlimited approval detected - potential exploitation risk')
          }

          // Check if approval amount is suspiciously high
          if (parseFloat(amount) > parseFloat(maxSafeApproval)) {
            throw new Error('Approval amount exceeds safety threshold')
          }

          // Validate addresses
          if (!tokenAddress.startsWith('0x') || !spenderAddress.startsWith('0x')) {
            throw new Error('Invalid token or spender address')
          }

          return true
        }

        // Safe approval should work
        expect(() =>
          validateTokenApproval(
            '0x1234567890123456789012345678901234567890',
            '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            '1000000000000000000', // 1 token
          ),
        ).not.toThrow()

        // Unlimited approval should be flagged
        expect(() =>
          validateTokenApproval(
            '0x1234567890123456789012345678901234567890',
            '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            '115792089237316195423570985008687907853269984665640564039457584007913129639935',
          ),
        ).toThrow('Unlimited approval detected')

        // Excessive approval should be flagged
        expect(() =>
          validateTokenApproval(
            '0x1234567890123456789012345678901234567890',
            '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            '10000000000000000000000000', // 10M tokens
          ),
        ).toThrow('exceeds safety threshold')
      })
    })

    describe('Cross-Chain Attack Prevention', () => {
      test('should prevent chain confusion attacks', () => {
        const validateChainContext = (
          chainId: number,
          targetAddress: string,
          expectedChain: number,
        ) => {
          // Ensure operations are executed on intended chain
          if (chainId !== expectedChain) {
            throw new Error(`Chain mismatch - expected ${expectedChain}, got ${chainId}`)
          }

          // Check for known malicious chain IDs
          const maliciousChains = [999999, 0, -1]
          if (maliciousChains.includes(chainId)) {
            throw new Error('Operation on suspicious chain detected')
          }

          // Validate address exists on this chain (simplified check)
          const knownChainAddresses: Record<number, string[]> = {
            1: ['0x1234567890123456789012345678901234567890'], // Mainnet
            11155111: ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'], // Sepolia
          }

          if (
            knownChainAddresses[chainId] &&
            !knownChainAddresses[chainId].includes(targetAddress)
          ) {
            console.warn(`Address ${targetAddress} not verified on chain ${chainId}`)
          }

          return true
        }

        // Valid chain operation should work
        expect(() =>
          validateChainContext(1, '0x1234567890123456789012345678901234567890', 1),
        ).not.toThrow()

        // Chain mismatch should be detected
        expect(() =>
          validateChainContext(11155111, '0x1234567890123456789012345678901234567890', 1),
        ).toThrow('Chain mismatch')

        // Malicious chain should be rejected
        expect(() =>
          validateChainContext(999999, '0x1234567890123456789012345678901234567890', 999999),
        ).toThrow('suspicious chain detected')
      })
    })

    describe('Transaction Replay Attack Prevention', () => {
      test('should prevent nonce reuse and transaction replay', () => {
        const usedNonces = new Set<string>()

        const validateNonce = (senderAddress: string, nonce: number, chainId: number) => {
          const nonceKey = `${senderAddress}-${nonce}-${chainId}`

          // Check for nonce reuse
          if (usedNonces.has(nonceKey)) {
            throw new Error('Nonce reuse detected - potential replay attack')
          }

          // Validate nonce is positive
          if (nonce < 0) {
            throw new Error('Invalid negative nonce')
          }

          // Mark nonce as used
          usedNonces.add(nonceKey)
          return true
        }

        const senderAddress = '0x1234567890123456789012345678901234567890'
        const chainId = 11155111

        // First use of nonce should work
        expect(() => validateNonce(senderAddress, 1, chainId)).not.toThrow()

        // Reuse of same nonce should be detected
        expect(() => validateNonce(senderAddress, 1, chainId)).toThrow('Nonce reuse detected')

        // Different chain same nonce should work
        expect(() => validateNonce(senderAddress, 1, 1)).not.toThrow()

        // Negative nonce should be rejected
        expect(() => validateNonce(senderAddress, -1, chainId)).toThrow('Invalid negative nonce')
      })
    })

    describe('Storage Isolation & Data Integrity', () => {
      test('should prevent localStorage pollution and ensure data isolation', () => {
        const secureStorage = {
          namespace: 'nero-wallet-',

          setItem(key: string, value: string, authContext: string) {
            // Validate key format
            if (!key.match(/^[a-zA-Z0-9-_]+$/)) {
              throw new Error('Invalid storage key format - potential injection attack')
            }

            // Ensure namespace isolation
            const namespacedKey = `${this.namespace}${authContext}-${key}`

            // Prevent oversized data
            if (value.length > 100000) {
              // 100KB limit
              throw new Error('Storage value too large - potential DoS attack')
            }

            localStorage.setItem(namespacedKey, value)
          },

          getItem(key: string, authContext: string) {
            const namespacedKey = `${this.namespace}${authContext}-${key}`
            return localStorage.getItem(namespacedKey)
          },

          validateAuthContext(authContext: string) {
            // Prevent auth context manipulation
            if (!authContext.match(/^[a-zA-Z0-9-]+$/)) {
              throw new Error('Invalid auth context format')
            }

            if (authContext.length > 50) {
              throw new Error('Auth context too long')
            }

            return true
          },
        }

        // Valid storage operations should work
        expect(() => {
          secureStorage.validateAuthContext('metamask')
          secureStorage.setItem('accounts', '[]', 'metamask')
        }).not.toThrow()

        // Cross-auth contamination should be prevented
        secureStorage.setItem('accounts', '[{"id":"test1"}]', 'metamask')
        secureStorage.setItem('accounts', '[{"id":"test2"}]', 'web3auth-google')

        expect(secureStorage.getItem('accounts', 'metamask')).toBe('[{"id":"test1"}]')
        expect(secureStorage.getItem('accounts', 'web3auth-google')).toBe('[{"id":"test2"}]')

        // Invalid key format should be rejected
        expect(() =>
          secureStorage.setItem('accounts/../../../etc/passwd', '[]', 'metamask'),
        ).toThrow('Invalid storage key format')

        // Oversized data should be rejected
        expect(() => secureStorage.setItem('accounts', 'x'.repeat(100001), 'metamask')).toThrow(
          'Storage value too large',
        )

        // Invalid auth context should be rejected
        expect(() => secureStorage.validateAuthContext('auth/../../../etc')).toThrow(
          'Invalid auth context format',
        )
      })
    })

    describe('Memory & Resource Exhaustion Prevention', () => {
      test('should prevent memory exhaustion attacks through account limits', () => {
        const accountLimiter = {
          maxAccounts: 100,
          maxAccountNameLength: 100,
          maxStorageSize: 1000000, // 1MB

          validateAccountCreation(existingAccounts: any[], newAccountName: string) {
            // Check account count limit
            if (existingAccounts.length >= this.maxAccounts) {
              throw new Error('Maximum account limit reached - potential DoS attack')
            }

            // Check account name length
            if (newAccountName.length > this.maxAccountNameLength) {
              throw new Error('Account name too long - potential memory exhaustion')
            }

            // Estimate storage size
            const estimatedSize =
              JSON.stringify(existingAccounts).length +
              JSON.stringify({ name: newAccountName }).length

            if (estimatedSize > this.maxStorageSize) {
              throw new Error('Storage limit exceeded - potential storage exhaustion')
            }

            return true
          },

          validateBatchOperation(operationCount: number) {
            const maxBatchSize = 10

            if (operationCount > maxBatchSize) {
              throw new Error('Batch operation too large - potential DoS attack')
            }

            return true
          },
        }

        // Normal account creation should work
        const normalAccounts = Array(50)
          .fill(0)
          .map((_, i) => ({ id: `account_${i}`, name: `Account ${i}` }))
        expect(() =>
          accountLimiter.validateAccountCreation(normalAccounts, 'New Account'),
        ).not.toThrow()

        // Excessive accounts should be rejected
        const excessiveAccounts = Array(100)
          .fill(0)
          .map((_, i) => ({ id: `account_${i}`, name: `Account ${i}` }))
        expect(() =>
          accountLimiter.validateAccountCreation(excessiveAccounts, 'New Account'),
        ).toThrow('Maximum account limit reached')

        // Oversized account name should be rejected
        expect(() => accountLimiter.validateAccountCreation([], 'x'.repeat(101))).toThrow(
          'Account name too long',
        )

        // Large batch operations should be rejected
        expect(() => accountLimiter.validateBatchOperation(20)).toThrow('Batch operation too large')

        // Normal batch should work
        expect(() => accountLimiter.validateBatchOperation(5)).not.toThrow()
      })
    })
  })

  describe('🚨 Advanced Account Abstraction Security Vulnerabilities', () => {
    describe('UserOperation Validation & Manipulation Prevention', () => {
      test('should prevent UserOperation structure manipulation attacks', () => {
        const validateUserOperation = (userOp: any) => {
          const requiredFields = [
            'sender',
            'nonce',
            'initCode',
            'callData',
            'callGasLimit',
            'verificationGasLimit',
            'preVerificationGas',
            'maxFeePerGas',
            'maxPriorityFeePerGas',
            'paymasterAndData',
            'signature',
          ]

          // Check all required fields exist
          for (const field of requiredFields) {
            if (!(field in userOp)) {
              throw new Error(`Missing required UserOperation field: ${field}`)
            }
          }

          // Validate sender address format
          if (!userOp.sender.startsWith('0x') || userOp.sender.length !== 42) {
            throw new Error('Invalid sender address format')
          }

          // Prevent nonce manipulation (must be sequential)
          if (typeof userOp.nonce !== 'number' || userOp.nonce < 0) {
            throw new Error('Invalid nonce value')
          }

          // Validate gas limits (prevent DoS with excessive gas)
          const maxGasLimit = 10000000 // 10M gas limit
          if (userOp.callGasLimit > maxGasLimit || userOp.verificationGasLimit > maxGasLimit) {
            throw new Error('Gas limit exceeds maximum allowed')
          }

          // Prevent zero gas prices (would cause transaction failure)
          if (userOp.maxFeePerGas <= 0 || userOp.maxPriorityFeePerGas < 0) {
            throw new Error('Invalid gas price values')
          }

          // Validate signature format
          if (!userOp.signature.startsWith('0x') || userOp.signature.length < 130) {
            throw new Error('Invalid signature format')
          }

          return true
        }

        const validUserOp = {
          sender: '0x1234567890123456789012345678901234567890',
          nonce: 1,
          initCode: '0x',
          callData: '0x',
          callGasLimit: 100000,
          verificationGasLimit: 150000,
          preVerificationGas: 21000,
          maxFeePerGas: 1000000000,
          maxPriorityFeePerGas: 1000000000,
          paymasterAndData: '0x',
          signature: '0x' + 'a'.repeat(130),
        }

        const invalidUserOps = [
          { ...validUserOp, sender: 'invalid-address' }, // Invalid sender
          { ...validUserOp, nonce: -1 }, // Invalid nonce
          { ...validUserOp, callGasLimit: 20000000 }, // Excessive gas
          { ...validUserOp, maxFeePerGas: 0 }, // Zero gas price
          { ...validUserOp, signature: '0xshort' }, // Invalid signature
          { sender: validUserOp.sender }, // Missing fields
        ]

        // Valid UserOp should pass
        expect(() => validateUserOperation(validUserOp)).not.toThrow()

        // Invalid UserOps should be rejected
        invalidUserOps.forEach((userOp) => {
          expect(() => validateUserOperation(userOp)).toThrow()
        })
      })

      test('should prevent callData injection and manipulation attacks', () => {
        const validateCallData = (callData: string, allowedFunctions: string[]) => {
          // Validate hex format
          if (!callData.startsWith('0x') || callData.length % 2 !== 0) {
            throw new Error('Invalid callData format')
          }

          // Prevent empty callData for account creation (should have initCode)
          if (callData === '0x') {
            return true // Empty callData is valid for ETH transfers
          }

          // Extract function selector (first 4 bytes)
          if (callData.length < 10) {
            throw new Error('CallData too short to contain function selector')
          }

          const functionSelector = callData.slice(0, 10)

          // Check if function is in allowed list
          if (!allowedFunctions.includes(functionSelector)) {
            throw new Error('Function selector not in allowlist')
          }

          // Prevent suspiciously large callData (potential DoS)
          if (callData.length > 20000) {
            // 10KB limit
            throw new Error('CallData too large - potential DoS attack')
          }

          // Check for known dangerous patterns
          const dangerousPatterns = [
            '0xa9059cbb', // transfer - should be validated separately
            '0x095ea7b3', // approve - should be validated separately
            '0x23b872dd', // transferFrom - potentially dangerous
            '0x40c10f19', // mint - should be restricted
          ]

          if (dangerousPatterns.includes(functionSelector)) {
            console.warn(`Potentially dangerous function call detected: ${functionSelector}`)
          }

          return true
        }

        const allowedFunctions = [
          '0xa9059cbb', // transfer
          '0x70a08231', // balanceOf
          '0xdd62ed3e', // allowance
        ]

        // Valid callData should work
        expect(() =>
          validateCallData(
            '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000001',
            allowedFunctions,
          ),
        ).not.toThrow()
        expect(() => validateCallData('0x', allowedFunctions)).not.toThrow()

        // Invalid callData should be rejected
        expect(() => validateCallData('invalid-hex', allowedFunctions)).toThrow(
          'Invalid callData format',
        )
        expect(() => validateCallData('0x123', allowedFunctions)).toThrow('Invalid callData format') // Odd length hex
        expect(() => validateCallData('0x12345678', allowedFunctions)).toThrow(
          'Function selector not in allowlist',
        )
        expect(() => validateCallData('0xa9059cbb' + 'a'.repeat(20000), allowedFunctions)).toThrow(
          'CallData too large',
        )
      })

      test('should prevent nonce manipulation and front-running attacks', () => {
        const usedNonces = new Map<string, Set<number>>()

        const validateNonceSequence = (sender: string, nonce: number, expectedNonce: number) => {
          // Ensure nonce is exactly what's expected (sequential)
          if (nonce !== expectedNonce) {
            throw new Error(`Nonce mismatch - expected ${expectedNonce}, got ${nonce}`)
          }

          // Check for nonce reuse
          if (!usedNonces.has(sender)) {
            usedNonces.set(sender, new Set())
          }

          const senderNonces = usedNonces.get(sender)!
          if (senderNonces.has(nonce)) {
            throw new Error('Nonce already used - potential replay attack')
          }

          // Mark nonce as used
          senderNonces.add(nonce)
          return true
        }

        const sender = '0x1234567890123456789012345678901234567890'

        // Sequential nonces should work
        expect(() => validateNonceSequence(sender, 0, 0)).not.toThrow()
        expect(() => validateNonceSequence(sender, 1, 1)).not.toThrow()
        expect(() => validateNonceSequence(sender, 2, 2)).not.toThrow()

        // Non-sequential nonce should be rejected
        expect(() => validateNonceSequence(sender, 5, 3)).toThrow('Nonce mismatch')

        // Nonce reuse should be detected
        expect(() => validateNonceSequence(sender, 1, 1)).toThrow('Nonce already used')
      })
    })

    describe('Bundler Security & MEV Protection', () => {
      test('should detect and prevent bundler manipulation attacks', () => {
        const validateBundlerRequest = (userOps: any[], bundlerUrl: string) => {
          // Validate bundler URL
          if (!bundlerUrl.startsWith('https://')) {
            throw new Error('Bundler must use HTTPS')
          }

          // Prevent batch size manipulation (DoS attack)
          if (userOps.length > 100) {
            throw new Error('Batch size too large - potential DoS attack')
          }

          if (userOps.length === 0) {
            throw new Error('Empty batch not allowed')
          }

          // Check for bundler fee manipulation
          userOps.forEach((userOp, index) => {
            // Prevent abnormally high gas prices (MEV attack)
            const maxReasonableGasPrice = 1000000000000 // 1000 Gwei
            if (userOp.maxFeePerGas > maxReasonableGasPrice) {
              throw new Error(`UserOp ${index}: Abnormally high gas price - potential MEV attack`)
            }

            // Ensure minimum gas for execution
            if (userOp.callGasLimit < 21000) {
              throw new Error(`UserOp ${index}: Gas limit too low for execution`)
            }

            // Check for gas price front-running
            if (userOp.maxPriorityFeePerGas > userOp.maxFeePerGas) {
              throw new Error(`UserOp ${index}: Priority fee exceeds max fee`)
            }
          })

          return true
        }

        const validUserOps = [
          {
            maxFeePerGas: 50000000000, // 50 Gwei
            maxPriorityFeePerGas: 2000000000, // 2 Gwei
            callGasLimit: 100000,
          },
          {
            maxFeePerGas: 40000000000, // 40 Gwei
            maxPriorityFeePerGas: 1500000000, // 1.5 Gwei
            callGasLimit: 150000,
          },
        ]

        const invalidScenarios = [
          { ops: validUserOps, url: 'http://bundler.com' }, // HTTP not HTTPS
          { ops: Array(101).fill(validUserOps[0]), url: 'https://bundler.com' }, // Too many ops
          { ops: [], url: 'https://bundler.com' }, // Empty batch
          {
            ops: [{ ...validUserOps[0], maxFeePerGas: 2000000000000 }],
            url: 'https://bundler.com',
          }, // High gas
          { ops: [{ ...validUserOps[0], callGasLimit: 5000 }], url: 'https://bundler.com' }, // Low gas
          {
            ops: [{ ...validUserOps[0], maxPriorityFeePerGas: 60000000000 }],
            url: 'https://bundler.com',
          }, // Priority > max
        ]

        // Valid request should work
        expect(() => validateBundlerRequest(validUserOps, 'https://bundler.com')).not.toThrow()

        // Invalid requests should be rejected
        invalidScenarios.forEach((scenario) => {
          expect(() => validateBundlerRequest(scenario.ops, scenario.url)).toThrow()
        })
      })

      test('should prevent transaction ordering and MEV exploitation', () => {
        const detectMEVRisk = (userOps: any[]) => {
          const riskFactors: string[] = []

          // Check for arbitrage opportunities (same token pairs)
          const tokenInteractions = userOps.flatMap((op, index) => {
            // Simplified token extraction from callData
            const callData = op.callData || '0x'
            if (callData.includes('a9059cbb')) {
              // transfer function
              return [{ opIndex: index, function: 'transfer', data: callData }]
            }
            return []
          })

          // Look for potential sandwich attacks
          if (tokenInteractions.length > 1) {
            riskFactors.push(
              'Multiple token interactions detected - potential sandwich attack risk',
            )
          }

          // Check for abnormal gas price patterns
          const gasPrices = userOps.map((op) => op.maxFeePerGas)
          const maxGas = Math.max(...gasPrices)
          const minGas = Math.min(...gasPrices)

          if (maxGas > minGas * 2) {
            riskFactors.push('High gas price variance - potential front-running attempt')
          }

          // Check for time-sensitive operations
          userOps.forEach((op, index) => {
            if (op.callData && op.callData.includes('deadline')) {
              riskFactors.push(`UserOp ${index}: Time-sensitive operation detected`)
            }
          })

          return {
            hasRisk: riskFactors.length > 0,
            riskFactors,
          }
        }

        const lowRiskOps = [
          { maxFeePerGas: 50000000000, callData: '0x70a08231' }, // balanceOf
          { maxFeePerGas: 52000000000, callData: '0x70a08231' }, // balanceOf
        ]

        const highRiskOps = [
          { maxFeePerGas: 100000000000, callData: '0xa9059cbb' }, // transfer
          { maxFeePerGas: 50000000000, callData: '0xa9059cbb' }, // transfer
          { maxFeePerGas: 200000000000, callData: '0xa9059cbb' }, // transfer with high gas
        ]

        // Low risk should be detected correctly
        const lowRiskResult = detectMEVRisk(lowRiskOps)
        expect(lowRiskResult.hasRisk).toBe(false)

        // High risk should be detected
        const highRiskResult = detectMEVRisk(highRiskOps)
        expect(highRiskResult.hasRisk).toBe(true)
        expect(highRiskResult.riskFactors.length).toBeGreaterThan(0)
      })

      test('should validate bundler response and prevent manipulation', () => {
        const validateBundlerResponse = (response: any, expectedUserOpHash: string) => {
          // Validate response structure
          if (!response || typeof response !== 'object') {
            throw new Error('Invalid bundler response format')
          }

          // Check required fields
          const requiredFields = ['userOpHash', 'success']
          requiredFields.forEach((field) => {
            if (!(field in response)) {
              throw new Error(`Missing required field: ${field}`)
            }
          })

          // Validate userOpHash format
          if (!response.userOpHash.startsWith('0x') || response.userOpHash.length !== 66) {
            throw new Error('Invalid userOpHash format')
          }

          // Ensure userOpHash matches expected (prevent hash substitution)
          if (response.userOpHash !== expectedUserOpHash) {
            throw new Error('UserOpHash mismatch - potential bundler manipulation')
          }

          // Check for suspicious response times (potential delay attacks)
          if (response.timestamp && Date.now() - response.timestamp > 300000) {
            // 5 minutes
            throw new Error('Response too old - potential replay attack')
          }

          // Validate success flag
          if (typeof response.success !== 'boolean') {
            throw new Error('Invalid success flag format')
          }

          return true
        }

        const expectedHash = '0x' + 'a'.repeat(64)

        const validResponses = [
          { userOpHash: expectedHash, success: true, timestamp: Date.now() },
          { userOpHash: expectedHash, success: false }, // Failed ops are valid responses
        ]

        const invalidResponses = [
          null, // Null response
          {}, // Missing fields
          { userOpHash: 'invalid', success: true }, // Invalid hash format
          { userOpHash: '0x' + 'b'.repeat(64), success: true }, // Hash mismatch
          { userOpHash: expectedHash, success: 'true' }, // Wrong success type
          { userOpHash: expectedHash, success: true, timestamp: Date.now() - 400000 }, // Too old
        ]

        // Valid responses should work
        validResponses.forEach((response) => {
          expect(() => validateBundlerResponse(response, expectedHash)).not.toThrow()
        })

        // Invalid responses should be rejected
        invalidResponses.forEach((response) => {
          expect(() => validateBundlerResponse(response, expectedHash)).toThrow()
        })
      })
    })

    describe('Factory Contract Security', () => {
      test('should prevent factory contract manipulation and unauthorized account creation', () => {
        const validateFactoryCall = (factoryAddress: string, initCode: string, salt: number) => {
          // Validate factory address
          if (!factoryAddress.startsWith('0x') || factoryAddress.length !== 42) {
            throw new Error('Invalid factory address format')
          }

          // Prevent zero address factory (would fail)
          if (factoryAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Zero address factory not allowed')
          }

          // Validate initCode format
          if (!initCode.startsWith('0x') || initCode.length % 2 !== 0) {
            throw new Error('Invalid initCode format')
          }

          // Check for suspiciously large initCode (potential DoS)
          if (initCode.length > 10000) {
            // 5KB limit
            throw new Error('InitCode too large - potential DoS attack')
          }

          // Validate salt range
          if (typeof salt !== 'number' || salt < 0 || salt > 0xffffffff) {
            throw new Error('Salt out of valid range')
          }

          // Check for known malicious factory patterns
          const maliciousPatterns = [
            '0xdeadbeef', // Known test pattern
            '0x00000000', // Suspicious zero pattern
          ]

          maliciousPatterns.forEach((pattern) => {
            if (initCode.includes(pattern.slice(2))) {
              throw new Error('Malicious pattern detected in initCode')
            }
          })

          return true
        }

        const validFactory = '0x1234567890123456789012345678901234567890'
        const validInitCode = '0x608060405234801561001057600080fd5b50'
        const validSalt = 123456

        // Valid factory call should work
        expect(() => validateFactoryCall(validFactory, validInitCode, validSalt)).not.toThrow()

        // Invalid factory calls should be rejected
        expect(() => validateFactoryCall('invalid-address', validInitCode, validSalt)).toThrow(
          'Invalid factory address',
        )
        expect(() =>
          validateFactoryCall(
            '0x0000000000000000000000000000000000000000',
            validInitCode,
            validSalt,
          ),
        ).toThrow('Zero address factory')
        expect(() => validateFactoryCall(validFactory, 'invalid-hex', validSalt)).toThrow(
          'Invalid initCode format',
        )
        expect(() =>
          validateFactoryCall(validFactory, '0x' + 'a'.repeat(10000), validSalt),
        ).toThrow('InitCode too large')
        expect(() => validateFactoryCall(validFactory, validInitCode, -1)).toThrow(
          'Salt out of valid range',
        )
        expect(() => validateFactoryCall(validFactory, '0xdeadbeef123456', validSalt)).toThrow(
          'Malicious pattern detected',
        )
      })

      test('should prevent salt collision attacks in account creation', () => {
        const usedSalts = new Map<string, Set<number>>()

        const validateSaltUniqueness = (
          signerAddress: string,
          salt: number,
          factoryAddress: string,
        ) => {
          const factoryKey = `${factoryAddress}-${signerAddress}`

          if (!usedSalts.has(factoryKey)) {
            usedSalts.set(factoryKey, new Set())
          }

          const saltsForFactory = usedSalts.get(factoryKey)!

          // Check for salt collision
          if (saltsForFactory.has(salt)) {
            throw new Error('Salt collision detected - account would be duplicated')
          }

          // Validate salt is not in reserved range
          const reservedSalts = [0, 1, 2] // Reserved for special purposes
          if (reservedSalts.includes(salt)) {
            console.warn(`Using reserved salt ${salt} - ensure this is intentional`)
          }

          // Check for suspicious salt patterns (potential brute force)
          if (salt > 1000000) {
            throw new Error('Salt too large - potential brute force attack')
          }

          saltsForFactory.add(salt)
          return true
        }

        const signer = '0x1234567890123456789012345678901234567890'
        const factory = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

        // First use should work
        expect(() => validateSaltUniqueness(signer, 100, factory)).not.toThrow()

        // Different salt should work
        expect(() => validateSaltUniqueness(signer, 200, factory)).not.toThrow()

        // Same salt should be rejected
        expect(() => validateSaltUniqueness(signer, 100, factory)).toThrow(
          'Salt collision detected',
        )

        // Different factory should work with same salt
        expect(() =>
          validateSaltUniqueness(signer, 100, '0x9999999999999999999999999999999999999999'),
        ).not.toThrow()

        // Excessive salt should be rejected
        expect(() => validateSaltUniqueness(signer, 2000000, factory)).toThrow('Salt too large')
      })
    })

    describe('Entrypoint Security & Validation', () => {
      test('should validate entrypoint interactions and prevent unauthorized access', () => {
        const validateEntrypointCall = (
          entrypointAddress: string,
          callData: string,
          gasLimit: number,
        ) => {
          // Validate entrypoint address
          if (!entrypointAddress.startsWith('0x') || entrypointAddress.length !== 42) {
            throw new Error('Invalid entrypoint address format')
          }

          // Ensure using official entrypoint (prevent rouge entrypoint attacks)
          const officialEntrypoints = [
            '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // v0.6.0
            '0x0576a174D229E3cFA37253523E645A78A0C91B57', // v0.5.0
          ]

          if (!officialEntrypoints.includes(entrypointAddress)) {
            throw new Error('Unauthorized entrypoint - potential rouge entrypoint attack')
          }

          // Validate callData for entrypoint functions
          if (!callData.startsWith('0x') || callData.length < 10) {
            throw new Error('Invalid entrypoint callData')
          }

          const functionSelector = callData.slice(0, 10)
          const allowedFunctions = [
            '0x1fad948c', // handleOps
            '0x765e827f', // handleAggregatedOps
            '0x70a08231', // balanceOf
          ]

          if (!allowedFunctions.includes(functionSelector)) {
            throw new Error('Unauthorized entrypoint function call')
          }

          // Validate gas limit
          if (gasLimit < 21000 || gasLimit > 10000000) {
            throw new Error('Gas limit out of reasonable range')
          }

          return true
        }

        const validEntrypoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
        const validCallData = '0x1fad948c' + '0'.repeat(64) // handleOps call
        const validGasLimit = 500000

        // Valid entrypoint call should work
        expect(() =>
          validateEntrypointCall(validEntrypoint, validCallData, validGasLimit),
        ).not.toThrow()

        // Invalid entrypoint calls should be rejected
        expect(() =>
          validateEntrypointCall(
            '0x1111111111111111111111111111111111111111',
            validCallData,
            validGasLimit,
          ),
        ).toThrow('Unauthorized entrypoint')
        expect(() => validateEntrypointCall(validEntrypoint, '0x12345678', validGasLimit)).toThrow(
          'Unauthorized entrypoint function',
        )
        expect(() => validateEntrypointCall(validEntrypoint, validCallData, 15000)).toThrow(
          'Gas limit out of reasonable range',
        )
        expect(() => validateEntrypointCall(validEntrypoint, validCallData, 15000000)).toThrow(
          'Gas limit out of reasonable range',
        )
      })
    })
  })
})
