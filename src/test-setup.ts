import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage with actual storage functionality for security tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => {
      return store[key] || null
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock performance.now for rate limiting tests
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
  writable: true,
})

// Mock console methods to keep test output clean
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
}

// Mock crypto functions for signature validation tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-1234-5678-9abc-def0'),
    getRandomValues: vi.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
  },
  writable: true,
})

// Basic Date mock for deterministic testing
const originalDateNow = Date.now

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01 00:00:00 UTC
})

afterEach(() => {
  vi.restoreAllMocks()
  Date.now = originalDateNow
})
