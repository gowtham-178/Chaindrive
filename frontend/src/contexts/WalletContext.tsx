import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletContextValue {
  account: string | null;
  isConnected: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getSigner: () => Promise<ethers.JsonRpcSigner | null>;
}

const HARDHAT_CHAIN_ID = 31337;

const WalletContext = createContext<WalletContextValue | null>(null);

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const isConnected = !!account;
  const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to use this feature.');
      return;
    }
    const accounts = (await window.ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];
    setAccount(accounts[0] ?? null);

    const chainIdHex = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    setChainId(parseInt(chainIdHex, 16));
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
  }, []);

  const getSigner = useCallback(async (): Promise<ethers.JsonRpcSigner | null> => {
    if (!window.ethereum || !account) return null;
    const provider = new ethers.BrowserProvider(window.ethereum as any);
    return await provider.getSigner();
  }, [account]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const arr = accounts as string[];
      setAccount(arr[0] ?? null);
    };
    const handleChainChanged = (chainIdHex: unknown) => {
      setChainId(parseInt(chainIdHex as string, 16));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        const arr = accounts as string[];
        if (arr.length > 0) {
          setAccount(arr[0]!);
          window.ethereum!.request({ method: 'eth_chainId' }).then((hex) => {
            setChainId(parseInt(hex as string, 16));
          });
        }
      })
      .catch(() => {});

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnected,
        chainId,
        isCorrectNetwork,
        connectWallet,
        disconnectWallet,
        getSigner,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
