import React from 'react';
import { ConsolidationPlan } from '@/types';
interface ConsolidationPreviewModalProps {
    plan: ConsolidationPlan;
    onConfirm: () => void;
    onCancel: () => void;
}
export declare const ConsolidationPreviewModal: React.FC<ConsolidationPreviewModalProps>;
export {};
