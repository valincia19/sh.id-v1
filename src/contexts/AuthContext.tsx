"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { authApi, User } from "@/lib/api/auth";
import { fetchCsrfToken, clearCsrfToken } from "@/lib/api/client";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthModalOpen: boolean;
    authModalTab: "login" | "register";
    openAuthModal: (tab: "login" | "register") => void;
    closeAuthModal: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

    const fetchUser = async () => {
        try {
            const { user: serverUser } = await authApi.getMe();
            setUser(serverUser);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Skip auth on getfreekey subdomain — it's fully public
        const isGetFreeKey = typeof window !== 'undefined' && window.location.hostname.includes('getfreekey.');
        if (isGetFreeKey) {
            setIsLoading(false);
            return;
        }

        // Initialize CSRF token on app load
        fetchCsrfToken().catch(() => {
            // CSRF token fetch failed, will be retried on first mutation
        });

        fetchUser();
        window.addEventListener('auth-change', fetchUser);
        return () => window.removeEventListener('auth-change', fetchUser);
    }, []);

    const openAuthModal = (tab: "login" | "register") => {
        setAuthModalTab(tab);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const refreshUser = () => {
        // This can be used to notify other components that auth state changed
        // In many cases, components use hooks like useUser which might need to be updated
        // or we can reload the page if needed, but a state change is cleaner.
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-change'));
        }
    };

    const handleLogout = () => {
        setUser(null);
        clearCsrfToken();
        refreshUser();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthModalOpen,
                authModalTab,
                openAuthModal,
                closeAuthModal,
                refreshUser,
            }}
        >
            {children}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                defaultTab={authModalTab}
                onLogin={refreshUser}
            />
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
