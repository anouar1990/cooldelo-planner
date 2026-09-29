import React, { createContext, useContext, ReactNode } from 'react';

interface VerificationContextType {
    isEmailVerified: boolean;
    requireVerification: (actionName: string, onProceed?: () => void) => boolean;
    openVerificationModal: (actionName?: string) => void;
    closeVerificationModal: () => void;
}

const VerificationContext = createContext<VerificationContextType>({
    isEmailVerified: true,
    requireVerification: (actionName: string, onProceed?: () => void) => {
        if (onProceed) onProceed();
        return true;
    },
    openVerificationModal: () => {},
    closeVerificationModal: () => {},
});

export const useRequireVerification = () => useContext(VerificationContext);

interface VerificationProviderProps {
    children: ReactNode;
}

export function VerificationProvider({ children }: VerificationProviderProps) {
    const requireVerification = (actionName: string, onProceed?: () => void): boolean => {
        if (onProceed) onProceed();
        return true;
    };

    const openVerificationModal = () => {};
    const closeVerificationModal = () => {};

    return (
        <VerificationContext.Provider
            value={{
                isEmailVerified: true,
                requireVerification,
                openVerificationModal,
                closeVerificationModal,
            }}
        >
            {children}
        </VerificationContext.Provider>
    );
}

