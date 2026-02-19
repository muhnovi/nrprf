import React from 'react';
interface CreateAccountModalProps {
    onClose: () => void;
    onStorageWarning?: (message: string) => void;
}
export declare const CreateAccountModal: React.FC<CreateAccountModalProps>;
export {};
