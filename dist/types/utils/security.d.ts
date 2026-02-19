/**
 * Generate deterministic salt for Account Abstraction wallet creation
 * Extracted from AccountManagerContext for testability
 */
export declare const generateDeterministicSalt: (signerAddress: string, accountIndex: number, chainId: number) => number;
/**
 * Generate storage keys for different authentication contexts
 * Extracted from AccountManagerContext for testability
 */
export declare const generateStorageKeys: (signerAddress: string, authMethod: string, userId?: string) => {
    accountsKey: string;
    activeAccountKey: string;
};
/**
 * Validate salt range constraints
 */
export declare const isValidSalt: (salt: number) => boolean;
/**
 * Sanitize account name for safe storage and display
 */
export declare const sanitizeAccountName: (name: string) => string;
/**
 * Validate account data structure
 */
export declare const validateAccountData: (account: any) => boolean;
/**
 * Safe JSON parsing with fallback
 */
export declare const safeJsonParse: <T>(jsonString: string, fallback: T) => T;
/**
 * Check if localStorage is available
 */
export declare const isLocalStorageAvailable: () => boolean;
/**
 * Validate array size constraints
 */
export declare const validateArraySize: <T>(array: T[], maxSize: number) => boolean;
/**
 * Estimate object size in bytes
 */
export declare const getObjectSize: (obj: any) => number;
/**
 * Validate object size constraints
 */
export declare const validateObjectSize: (obj: any, maxSizeBytes: number) => boolean;
