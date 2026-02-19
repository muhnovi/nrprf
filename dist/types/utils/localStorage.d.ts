import { NftWithImages, ERC20Token } from '@/types';
/**
 * Simple localStorage quota check
 * Returns true if storage is full or nearly full
 */
export declare const isLocalStorageNearFull: () => {
    isFull: boolean;
    message?: string;
};
export declare const saveCustomERC20Token: (token: ERC20Token) => void;
export declare const getCustomERC20Tokens: () => ERC20Token[];
export declare const removeCustomERC20Token: (contractAddress: string) => void;
export declare const saveCustomERC721Token: (token: NftWithImages) => void;
export declare const getCustomERC721Tokens: () => NftWithImages[];
export declare const removeCustomERC721Token: (contractAddress: string) => void;
export declare const updateCustomERC721Token: (updatedToken: NftWithImages) => void;
export declare const getCustomERC721TokenByAddress: (contractAddress: string) => NftWithImages | undefined;
export declare const toggleNFTVisibility: (contractAddress: string, tokenId: number) => void;
