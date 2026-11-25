'use client';

import { useFreighterWallet } from './client';

export function WalletButton({ expectedNetwork = 'TESTNET' }: { expectedNetwork?: string }) {
  const wallet = useFreighterWallet(expectedNetwork);
  const { state } = wallet;

  const label =
    state.status === 'connected'
      ? wallet.displayAddress
      : state.status === 'connecting'
        ? 'Connecting…'
        : state.status === 'wrong_network'
          ? 'Wrong network'
          : state.status === 'unavailable'
            ? 'Freighter not detected'
            : 'Connect wallet';

  return (
    <button
      type="button"
      className={`ar-wallet-button ${state.status === 'connected' ? 'is-connected' : ''}`}
      onClick={() => {
        if (state.status === 'connected') {
          wallet.disconnect();
        } else {
          void wallet.connect();
        }
      }}
      title={
        state.error ??
        (state.status === 'connected'
          ? `Connected to ${state.network?.network ?? expectedNetwork}. Click to disconnect.`
          : `Connect a ${expectedNetwork} wallet`)
      }
      aria-live="polite"
    >
      <span
        className={`ar-status-dot ${
          state.status === 'connected'
            ? 'ar-status-dot--live'
            : state.status === 'wrong_network' || state.status === 'unavailable'
              ? 'ar-status-dot--warning'
              : 'ar-status-dot--offline'
        }`}
      />
      {label}
    </button>
  );
}
