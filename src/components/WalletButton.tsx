import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.id === 'injected') || connectors[0];
    if (injectedConnector) connect({ connector: injectedConnector });
  };

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 border border-primary"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      className="font-mono-cipher text-xs border border-border text-muted-foreground px-4 py-2 uppercase tracking-widest hover:border-primary hover:text-foreground transition-all duration-100 flex items-center gap-2"
    >
      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
    </button>
  );
}

export function EncryptProfileButton() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate('/app');
    }
  }, [isConnected, navigate]);

  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.id === 'injected') || connectors[0];
    if (injectedConnector) connect({ connector: injectedConnector });
  };

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        className="font-mono-cipher text-xs bg-primary text-primary-foreground px-6 py-3 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100"
      >
        Connect Wallet to Encrypt Profile →
      </button>
    );
  }

  return (
    <button
      className="font-mono-cipher text-xs bg-primary text-primary-foreground px-6 py-3 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100"
      onClick={() => navigate('/app')}
    >
      Enter Dashboard →
    </button>
  );
}