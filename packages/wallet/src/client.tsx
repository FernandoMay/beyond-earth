'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isValidAccountAddress, truncateAddress } from '@aerospace/stellar-sdk';

export type WalletConnectionState =
  'unavailable' | 'disconnected' | 'connecting' | 'connected' | 'wrong_network';

export interface WalletNetwork {
  network: string;
  networkPassphrase: string;
  networkUrl?: string;
}

export interface WalletState {
  status: WalletConnectionState;
  address?: string;
  network?: WalletNetwork;
  error?: string;
}

export interface UseFreighterWallet {
  state: WalletState;
  isAvailable: boolean;
  displayAddress: string | undefined;
  connect: () => Promise<void>;
  disconnect: () => void;
  signXdr: (xdr: string) => Promise<string>;
  refresh: () => Promise<void>;
}

export interface FreighterApi {
  isConnected?: () => Promise<{ isConnected?: boolean; error?: { message?: string } }>;
  requestAccess?: () => Promise<{ address?: string; error?: { message?: string } }>;
  getAddress?: () => Promise<{ address?: string; error?: { message?: string } }>;
  getNetworkDetails?: () => Promise<{
    network?: string;
    networkPassphrase?: string;
    networkUrl?: string;
  }>;
  signTransaction?: (
    xdr: string,
    options?: { networkPassphrase?: string; address?: string },
  ) => Promise<{ signedTxXdr?: string; error?: { message?: string } }>;
}

const INITIAL: WalletState = { status: 'unavailable' };

function normalizeNetwork(
  raw: { network?: string; networkPassphrase?: string; networkUrl?: string } | undefined,
): WalletNetwork | undefined {
  if (!raw) return undefined;
  return {
    network: raw.network ?? 'unknown',
    networkPassphrase: raw.networkPassphrase ?? '',
    networkUrl: raw.networkUrl,
  };
}

export function networkMatches(passphrase: string | undefined, expected: string): boolean {
  if (!passphrase) return true;
  const normalized = passphrase.toUpperCase();
  const target = expected.toUpperCase().replace(/[^A-Z]/g, '');
  if (target.includes('TESTNET')) return normalized.includes('TEST SDF NETWORK');
  if (target.includes('FUTURENET')) return normalized.includes('FUTURE NETWORK');
  if (target.includes('MAINNET') || target.includes('PUBLIC')) {
    return normalized.includes('PUBLIC GLOBAL STELLAR NETWORK');
  }
  if (target.includes('LOCAL') || target.includes('STANDALONE')) {
    return normalized.includes('STANDALONE');
  }
  return true;
}

/**
 * Load Freighter lazily so server rendering and demo mode never require the
 * extension. Wallet connection is explicit and never autoruns a signature.
 */
async function loadFreighter(): Promise<FreighterApi | null> {
  try {
    const module = (await import('@stellar/freighter-api')) as unknown as FreighterApi;
    return module;
  } catch {
    return null;
  }
}

export function useFreighterWallet(expectedNetwork = 'TESTNET'): UseFreighterWallet {
  const [state, setState] = useState<WalletState>(INITIAL);
  const apiRef = useRef<FreighterApi | null>(null);

  const checkAvailability = useCallback(async () => {
    const api = apiRef.current ?? (await loadFreighter());
    apiRef.current = api;
    if (!api) {
      setState({ status: 'unavailable', error: 'Freighter extension not detected.' });
      return;
    }
    try {
      const result = await api.isConnected?.();
      if (result?.isConnected) {
        const addressResult = await api.getAddress?.();
        if (addressResult?.address && isValidAccountAddress(addressResult.address)) {
          const network = normalizeNetwork(await api.getNetworkDetails?.());
          setState({
            status: networkMatches(network?.networkPassphrase, expectedNetwork)
              ? 'connected'
              : 'wrong_network',
            address: addressResult.address,
            network,
          });
          return;
        }
      }
      setState({ status: 'disconnected' });
    } catch {
      setState({ status: 'disconnected' });
    }
  }, [expectedNetwork]);

  useEffect(() => {
    void checkAvailability();
  }, [checkAvailability]);

  const connect = useCallback(async () => {
    setState((current) => ({ ...current, status: 'connecting', error: undefined }));
    const api = apiRef.current ?? (await loadFreighter());
    apiRef.current = api;
    if (!api) {
      setState({ status: 'unavailable', error: 'Install Freighter to connect a wallet.' });
      return;
    }

    try {
      const access = await api.requestAccess?.();
      if (access?.error) throw new Error(access.error.message ?? 'Wallet access was rejected.');
      const address = access?.address ?? (await api.getAddress?.())?.address;
      if (!address || !isValidAccountAddress(address)) {
        throw new Error('Freighter returned an invalid Stellar address.');
      }
      const network = normalizeNetwork(await api.getNetworkDetails?.());
      const matches = networkMatches(network?.networkPassphrase, expectedNetwork);
      setState({
        status: matches ? 'connected' : 'wrong_network',
        address,
        network,
        error: matches ? undefined : `Switch Freighter to ${expectedNetwork}.`,
      });
    } catch (error) {
      setState({
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unable to connect wallet.',
      });
    }
  }, [expectedNetwork]);

  const disconnect = useCallback(() => {
    setState({ status: 'disconnected' });
  }, []);

  const signXdr = useCallback(
    async (xdr: string) => {
      const api = apiRef.current ?? (await loadFreighter());
      apiRef.current = api;
      if (!api?.signTransaction) throw new Error('Freighter is not available.');
      if (state.status !== 'connected' || !state.address) {
        throw new Error('Connect an eligible wallet before signing.');
      }
      const result = await api.signTransaction(xdr, {
        networkPassphrase: state.network?.networkPassphrase,
        address: state.address,
      });
      if (result.error || !result.signedTxXdr) {
        throw new Error(result.error?.message ?? 'The transaction was not signed.');
      }
      return result.signedTxXdr;
    },
    [state.address, state.network?.networkPassphrase, state.status],
  );

  const displayAddress = useMemo(
    () => (state.address ? truncateAddress(state.address) : undefined),
    [state.address],
  );

  return {
    state,
    isAvailable: state.status !== 'unavailable',
    displayAddress,
    connect,
    disconnect,
    signXdr,
    refresh: checkAvailability,
  };
}
