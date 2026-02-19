export interface UseLocalforageReturn<T> {
    storedValue: T;
    setValue: (value: T | ((val: T) => T)) => Promise<void>;
    removeValue: () => Promise<void>;
    isLoading: boolean;
    error: Error | null;
}
export declare function useLocalforage<T>(key: string, initialValue: T): UseLocalforageReturn<T>;
/**
 * Hook for async account management with localforage
 * Specialized for account data with proper typing
 */
export declare function useAccountStorage(authKey: string): {
    accounts: any[];
    activeAccountId: string | null;
    saveAccounts: (newAccounts: any[]) => Promise<void>;
    saveActiveAccountId: (accountId: string | null) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
};
