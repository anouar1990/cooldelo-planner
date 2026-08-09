import React from 'react';
import { OTPVerificationModal } from './OTPVerificationModal';

export { OTPVerificationModal };

export interface EmailConfirmationModalProps {
    visible: boolean;
    email: string;
    onClose: () => void;
    onGoToLogin?: () => void;
    onSuccess?: () => void;
}

/**
 * @deprecated Use OTPVerificationModal directly.
 * Forwarding component for backward compatibility.
 */
export function EmailConfirmationModal({ visible, email, onClose, onSuccess }: EmailConfirmationModalProps) {
    return (
        <OTPVerificationModal
            visible={visible}
            email={email}
            onClose={onClose}
            onSuccess={onSuccess}
        />
    );
}
