const WS_URL = "<WebSocket RPC URL>";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { createPublicClient, webSocket, formatEther } from "viem";
import { mainnet } from "viem/chains";
import { useState, useRef, useEffect } from "react";

export default function App() {
  const { address, isConnected } = useAccount();

  // Pending Transactions
  const [pendingTxs, setPendingTxs] = useState([]);
  const [listeningTx, setListeningTx] = useState(false);
  const [txCount, setTxCount] = useState(0);
  const txClientRef = useRef(null);

  // New Blocks
  const [blocks, setBlocks] = useState([]);
  const [listeningBlocks, setListeningBlocks] = useState(false);
  const [blockCount, setBlockCount] = useState(0);
  const blockClientRef = useRef(null);

  /** ---------------- Pending Transactions ---------------- **/
  const startPendingTx = async () => {
    if (listeningTx) return;
    setListeningTx(true);

    const client = createPublicClient({
      chain: mainnet,
      transport: webSocket(WS_URL),
    });

    txClientRef.current = client;

    const unsubscribe = client.watchPendingTransactions({
      onTransactions: (txs) => {
        setTxCount((c) => c + txs.length);
        setPendingTxs((prev) => [...txs, ...prev].slice(0, 150));
      },
    });

    txClientRef.current.unsubscribe = unsubscribe;
  };

  const stopPendingTx = () => {
    if (txClientRef.current?.unsubscribe) txClientRef.current.unsubscribe();
    setListeningTx(false);
  };

  /** ---------------- Block Listener ---------------- **/
  const startBlocks = async () => {
    if (listeningBlocks) return;
    setListeningBlocks(true);

    const client = createPublicClient({
      chain: mainnet,
      transport: webSocket(WS_URL),
    });

    blockClientRef.current = client;

    const unsubscribe = client.watchBlocks({
      includeTransactions: true,
      onBlock: (block) => {
        const totalTxs = block.transactions?.length || 0;
        const time = new Date(Number(block.timestamp) * 1000).toLocaleString();
        setBlockCount((c) => c + 1);
        setBlocks((prev) =>
          [
            {
              number: block.number,
              totalTxs,
              time,
            },
            ...prev,
          ].slice(0, 100)
        );
      },
    });

    blockClientRef.current.unsubscribe = unsubscribe;
  };

  const stopBlocks = () => {
    if (blockClientRef.current?.unsubscribe)
      blockClientRef.current.unsubscribe();
    setListeningBlocks(false);
  };

  /** Cleanup **/
  useEffect(() => {
    return () => {
      if (txClientRef.current?.unsubscribe) txClientRef.current.unsubscribe();
      if (blockClientRef.current?.unsubscribe)
        blockClientRef.current.unsubscribe();
    };
  }, []);

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <h1 className="app-title">⚡ Ethereum Live Monitor</h1>
        <ConnectButton />
      </header>

      {/* MAIN */}
      <main className="app-main">
        {!isConnected ? (
          <div className="not-connected">
            <h3>Connect your wallet to get started</h3>
          </div>
        ) : (
          <div className="sections">
            {/* Pending Transactions */}
            <section className="section-card">
              <div className="section-header">
                <h2>Pending Transactions</h2>
                <button
                  className={`btn ${listeningTx ? "btn-stop" : "btn-start"}`}
                  onClick={listeningTx ? stopPendingTx : startPendingTx}
                >
                  {listeningTx ? "Stop Listening" : "Start Listening"}
                </button>
              </div>
              <div className="section-info">
                <p>Count: {txCount}</p>
              </div>
              <div className="scroll-box">
                {pendingTxs.length === 0 ? (
                  <p className="empty-msg">
                    {listeningTx
                      ? "Listening for pending transactions..."
                      : "Press Start to begin"}
                  </p>
                ) : (
                  pendingTxs.map((tx, i) => (
                    <div className="tx-item" key={i}>
                      <a
                        href={`https://etherscan.io/tx/${tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tx}
                      </a>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* New Blocks */}
            <section className="section-card">
              <div className="section-header">
                <h2>New Blocks</h2>
                <button
                  className={`btn ${
                    listeningBlocks ? "btn-stop" : "btn-start"
                  }`}
                  onClick={listeningBlocks ? stopBlocks : startBlocks}
                >
                  {listeningBlocks ? "Stop Listening" : "Start Listening"}
                </button>
              </div>
              <div className="section-info">
                <p>Count: {blockCount}</p>
              </div>
              <div className="scroll-box">
                {blocks.length === 0 ? (
                  <p className="empty-msg">
                    {listeningBlocks
                      ? "Listening for new blocks..."
                      : "Press Start to begin"}
                  </p>
                ) : (
                  <table className="block-table">
                    <thead>
                      <tr>
                        <th>Block</th>
                        <th>Total Txns</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((b, i) => (
                        <tr key={i}>
                          <td>
                            <a
                              href={`https://etherscan.io/block/${b.number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {b.number.toString()}
                            </a>
                          </td>
                          <td>{b.totalTxs}</td>
                          <td>{b.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
