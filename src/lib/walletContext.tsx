"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
    address: string | null;
    isConnected: boolean;
    connectAsGuest: () => void;
    connectMetaMask: () => Promise<void>;
    disconnect: () => void;
    isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const storedAddress = localStorage.getItem('wallet_address');
        if (storedAddress) {
            setAddress(storedAddress);
        }
    }, []);

    const connectAsGuest = () => {
        setIsConnecting(true);
        // Simulate delay
        setTimeout(() => {
            const guestAddr = "0xGuest" + Math.random().toString(16).slice(2, 10).toUpperCase();
            setAddress(guestAddr);
            localStorage.setItem('wallet_address', guestAddr);
            setIsConnecting(false);
        }, 800);
    };

    const connectMetaMask = async () => {
        setIsConnecting(true);
        try {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    localStorage.setItem('wallet_address', accounts[0]);
                }
            } else {
                alert("MetaMask not found! Falling back to Guest mode.");
                connectAsGuest();
            }
        } catch (error) {
            console.error("MetaMask connection failed", error);
            alert("Connection failed. Try Guest Mode.");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setAddress(null);
        localStorage.removeItem('wallet_address');
    };

    return (
        <WalletContext.Provider value={{
            address,
            isConnected: !!address,
            connectAsGuest,
            connectMetaMask,
            disconnect,
            isConnecting
        }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
