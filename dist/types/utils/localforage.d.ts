import { ERC20Token, NftWithImages } from '@/types';
declare const accountStore: LocalForage;
declare const tokenStore: LocalForage;
declare const settingsStore: LocalForage;
/**
 * Enhanced storage quota check for localforage
 * Checks available quota and provides detailed storage information
 */
export declare const isStorageNearFull: () => Promise<{
    isFull: boolean;
    message?: string;
    availableSpace?: number;
    usedSpace?: number;
}>;
export declare const saveAccounts: (key: string, accounts: any[]) => Promise<void>;
export declare const loadAccounts: (key: string) => Promise<any[] | null>;
export declare const removeAccounts: (key: string) => Promise<void>;
/**
 * Custom Token Storage Functions
 */
export declare const saveCustomERC20Token: (token: ERC20Token) => Promise<void>;
export declare const getCustomERC20Tokens: () => Promise<ERC20Token[]>;
export declare const removeCustomERC20Token: (contractAddress: string) => Promise<void>;
export declare const saveCustomERC721Token: (token: NftWithImages) => Promise<void>;
export declare const getCustomERC721Tokens: () => Promise<NftWithImages[]>;
export declare const removeCustomERC721Token: (contractAddress: string) => Promise<void>;
export declare const updateCustomERC721Token: (updatedToken: NftWithImages) => Promise<void>;
export declare const getCustomERC721TokenByAddress: (contractAddress: string) => Promise<NftWithImages | undefined>;
export declare const toggleNFTVisibility: (contractAddress: string, tokenId: number) => Promise<void>;
/**
 * Generic Storage Functions
 */
export declare const setItem: <T>(key: string, value: T) => Promise<void>;
export declare const getItem: <T>(key: string, fallback?: T) => Promise<T | null>;
export declare const removeItem: (key: string) => Promise<void>;
/**
 * Migration helper function
 * Migrates existing localStorage data to localforage
 */
export declare const migrateFromLocalStorage: () => Promise<{
    migrated: boolean;
    accountsMigrated: number;
    tokensMigrated: number;
    errors: string[];
}>;
export { accountStore, tokenStore, settingsStore };
