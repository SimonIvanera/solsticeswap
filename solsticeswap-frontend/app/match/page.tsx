"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useSolsticeSwap } from "@/hooks/useSolsticeSwap";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { SolsticeSwapABI } from "@/abi/SolsticeSwapABI";
import Link from "next/link";

interface Order {
  id: bigint;
  creator: string;
  status: number;
  createdAt: bigint;
  inputToken: string;
  outputToken: string;
}

export default function MatchPage() {
  const { ethersSigner, ethersReadonlyProvider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { instance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const { 
    getOrder, 
    matchOrders, 
    executeTrade,
    isDeployed, 
    contractAddress,
    message,
    isMatchingOrders,
  } = useSolsticeSwap({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: undefined,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBuyOrder, setSelectedBuyOrder] = useState<bigint | null>(null);
  const [selectedSellOrder, setSelectedSellOrder] = useState<bigint | null>(null);
  const [matchId, setMatchId] = useState<bigint | null>(null);

  const orderStatusMap: Record<number, string> = {
    0: "Pending",
    1: "Partially Filled",
    2: "Filled",
    3: "Cancelled",
  };

  useEffect(() => {
    if (!isDeployed || !contractAddress || !ethersReadonlyProvider || !getOrder) {
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const contract = new ethers.Contract(
          contractAddress,
          SolsticeSwapABI.abi,
          ethersReadonlyProvider
        );

        const nextOrderId = await contract.nextOrderId();
        const orderCount = Number(nextOrderId);

        if (orderCount === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const fetchedOrders: Order[] = [];
        for (let i = 1; i < orderCount; i++) {
          try {
            const orderData = await getOrder(BigInt(i));
            if (orderData) {
              // Convert status to number for comparison (it might be BigInt)
              const statusNum = Number(orderData.status);
              
              console.log(`Order ${i}:`, {
                id: i,
                status: statusNum,
                statusRaw: orderData.status,
                creator: orderData.creator,
                inputToken: orderData.inputToken,
                outputToken: orderData.outputToken,
              });
              
              // Show ALL pending orders (not just user's orders) for matching
              // OrderStatus.Pending = 0
              if (statusNum === 0) {
                fetchedOrders.push({
                  id: BigInt(i),
                  ...orderData,
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch order ${i}:`, error);
          }
        }
        
        console.log(`Total orders found: ${orderCount - 1}, Pending orders: ${fetchedOrders.length}`);

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Listen for order updates
    const contract = new ethers.Contract(
      contractAddress,
      SolsticeSwapABI.abi,
      ethersReadonlyProvider
    );

    const handleOrderCreated = () => {
      fetchOrders();
    };

    const handleOrderFilled = () => {
      fetchOrders();
    };

    contract.on("OrderCreated", handleOrderCreated);
    contract.on("OrderFilled", handleOrderFilled);

    return () => {
      contract.removeAllListeners("OrderCreated");
      contract.removeAllListeners("OrderFilled");
    };
  }, [isDeployed, contractAddress, ethersReadonlyProvider, getOrder]);

  const handleMatch = async () => {
    if (!matchOrders || !selectedBuyOrder || !selectedSellOrder) {
      return;
    }

    try {
      const resultMatchId = await matchOrders(selectedBuyOrder, selectedSellOrder);
      if (resultMatchId) {
        setMatchId(resultMatchId);
      }
    } catch (error) {
      console.error("Failed to match orders:", error);
    }
  };

  const handleExecute = async () => {
    if (!executeTrade || !matchId) {
      return;
    }

    try {
      await executeTrade(matchId);
      setMatchId(null);
      setSelectedBuyOrder(null);
      setSelectedSellOrder(null);
      // Refresh orders
      window.location.reload();
    } catch (error) {
      console.error("Failed to execute trade:", error);
    }
  };

  const canMatch = (buyOrder: Order, sellOrder: Order): boolean => {
    // Check if token pairs match: buyOrder.inputToken == sellOrder.outputToken && buyOrder.outputToken == sellOrder.inputToken
    return (
      buyOrder.inputToken.toLowerCase() === sellOrder.outputToken.toLowerCase() &&
      buyOrder.outputToken.toLowerCase() === sellOrder.inputToken.toLowerCase()
    );
  };

  if (!isDeployed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-surface rounded-xl border border-border p-6">
          <p className="text-foreground">
            SolsticeSwap contract not deployed on this network.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
          Order Matching
        </h1>
        <p className="text-foreground/80 text-lg">
          Match buy and sell orders to create trades
        </p>
      </div>

      <div className="space-y-6">
        {/* Selection Summary */}
        {(selectedBuyOrder || selectedSellOrder) && (
          <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
            <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <span>📋</span>
              Selected Orders
              {!selectedBuyOrder && <span className="text-xs font-normal text-muted-foreground ml-2">(Select a Buy order)</span>}
              {!selectedSellOrder && selectedBuyOrder && <span className="text-xs font-normal text-muted-foreground ml-2">(Select a Sell order)</span>}
            </h3>
            <div className="space-y-3">
              {selectedBuyOrder && (
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-primary/20">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Buy Order</p>
                    <p className="font-mono font-semibold text-foreground">{selectedBuyOrder.toString()}</p>
                  </div>
                </div>
              )}
              {selectedSellOrder && (
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-secondary/20">
                  <span className="text-2xl">📉</span>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Sell Order</p>
                    <p className="font-mono font-semibold text-foreground">{selectedSellOrder.toString()}</p>
                  </div>
                </div>
              )}
              {selectedBuyOrder && selectedSellOrder && (
                <div className="mt-3 space-y-2">
                  {(() => {
                    const buyOrder = orders.find((o) => o.id === selectedBuyOrder);
                    const sellOrder = orders.find((o) => o.id === selectedSellOrder);
                    
                    if (!buyOrder || !sellOrder) {
                      return <span className="text-red-600">✗ Orders not found</span>;
                    }
                    
                    const matches = canMatch(buyOrder, sellOrder);
                    
                    return matches ? (
                      <div className="space-y-4 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-xl">
                          <span className="text-xl">✓</span>
                          <span className="text-accent font-semibold">Token pairs match - Ready to match!</span>
                        </div>
                        {!matchId ? (
                          <button
                            onClick={handleMatch}
                            disabled={isMatchingOrders}
                            className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none font-semibold text-lg"
                          >
                            {isMatchingOrders ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⏳</span>
                                Matching Orders...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <span>🔗</span>
                                Match Orders
                              </span>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl">
                              <span className="text-xl">✓</span>
                              <span className="text-success font-semibold">Matched! Match ID: {matchId.toString()}</span>
                            </div>
                            <button
                              onClick={handleExecute}
                              className="w-full px-6 py-4 bg-gradient-to-r from-accent to-success text-accent-foreground rounded-xl hover:from-accent/90 hover:to-success/90 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <span>⚡</span>
                                Execute Trade
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                          <span className="text-xl">✗</span>
                          <span className="text-destructive font-semibold">Token pairs do not match</span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground pl-1">
                          <p>
                            <span className="font-medium">Buy:</span> {buyOrder.inputToken.slice(0, 6)}...{buyOrder.inputToken.slice(-4)} → {buyOrder.outputToken.slice(0, 6)}...{buyOrder.outputToken.slice(-4)}
                          </p>
                          <p>
                            <span className="font-medium">Sell:</span> {sellOrder.inputToken.slice(0, 6)}...{sellOrder.inputToken.slice(-4)} → {sellOrder.outputToken.slice(0, 6)}...{sellOrder.outputToken.slice(-4)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {message && (
          <div className="bg-background rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-2xl border-2 border-border/60 shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Pending Orders</h2>
            <p className="text-sm text-foreground/80">
              Select orders to match - choose one Buy and one Sell order
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-foreground/80">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-foreground/80">
                No pending orders found.
              </p>
              <div className="bg-warning/10 border-2 border-warning/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-foreground font-semibold mb-2">🔍 Debug Info:</p>
                <p className="text-xs text-foreground/80 font-mono">
                  Check browser console for order fetching details.
                  Make sure you have created orders and they are in Pending status.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Link 
                  href="/swap" 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-sm"
                >
                  Create Order
                </Link>
                <Link 
                  href="/orders" 
                  className="px-4 py-2 bg-white border-2 border-border rounded-lg hover:bg-surface hover:border-primary/50 transition-colors font-semibold text-foreground shadow-sm"
                >
                  View All Orders
                </Link>
                <Link 
                  href="/test" 
                  className="px-4 py-2 bg-white border-2 border-border rounded-lg hover:bg-surface hover:border-primary/50 transition-colors font-semibold text-foreground shadow-sm"
                >
                  Test Page
                </Link>
              </div>
              <p className="text-sm text-foreground/80 mt-4">
                💡 Tip: You can match orders from any user. Create at least two orders (one buy, one sell) with matching token pairs to test matching.
              </p>
              <div className="mt-4 p-4 bg-background rounded-lg border border-border text-left max-w-2xl mx-auto">
                <h4 className="font-semibold text-sm mb-2">Quick Test Steps:</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <Link href="/swap" className="text-primary hover:underline">Swap page</Link> and create a buy order (e.g., Token A → Token B)</li>
                  <li>Create a sell order (e.g., Token B → Token A) with matching token pairs</li>
                  <li>Return to this page to see and match the orders</li>
                  <li>Or use the <Link href="/test" className="text-primary hover:underline">Test page</Link> for automated testing</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface/50">
                  <tr>
                <th className="text-left p-4 font-semibold text-sm text-foreground/80">Select</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground/80">Order ID</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground/80">Creator</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground/80">Input Token</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground/80">Output Token</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground/80">Created</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders.map((order) => (
                    <tr 
                      key={order.id.toString()} 
                      className={`hover:bg-surface/30 transition-colors ${
                        selectedBuyOrder === order.id || selectedSellOrder === order.id
                          ? "bg-primary/5"
                          : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (selectedBuyOrder === order.id) {
                                setSelectedBuyOrder(null);
                              } else {
                                setSelectedBuyOrder(order.id);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              selectedBuyOrder === order.id
                                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                                : "bg-surface border border-border hover:border-primary/50 hover:bg-primary/5"
                            }`}
                          >
                            📈 Buy
                          </button>
                          <button
                            onClick={() => {
                              if (selectedSellOrder === order.id) {
                                setSelectedSellOrder(null);
                              } else {
                                setSelectedSellOrder(order.id);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              selectedSellOrder === order.id
                                ? "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-md"
                                : "bg-surface border border-border hover:border-secondary/50 hover:bg-secondary/5"
                            }`}
                          >
                            📉 Sell
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm font-medium">{order.id.toString()}</td>
                      <td className="p-4 font-mono text-sm text-foreground/80">
                        {`${order.creator.slice(0, 6)}...${order.creator.slice(-4)}`}
                      </td>
                      <td className="p-4 font-mono text-sm text-foreground/80">
                        {`${order.inputToken.slice(0, 6)}...${order.inputToken.slice(-4)}`}
                      </td>
                      <td className="p-4 font-mono text-sm text-foreground/80">
                        {`${order.outputToken.slice(0, 6)}...${order.outputToken.slice(-4)}`}
                      </td>
                      <td className="p-4 text-sm text-foreground/80">
                        {new Date(Number(order.createdAt) * 1000).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/orders/${order.id.toString()}`}
                          className="text-primary hover:text-primary/80 font-medium text-sm hover:underline transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-white to-surface border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-xl text-foreground mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            How to Match Orders
          </h3>
          <ol className="text-sm text-foreground/85 space-y-3 list-decimal list-inside ml-2">
            <li className="leading-relaxed">Select a <strong className="text-foreground">Buy</strong> order (wants to receive Output Token)</li>
            <li className="leading-relaxed">Select a <strong className="text-foreground">Sell</strong> order (wants to receive Input Token)</li>
            <li className="leading-relaxed">Ensure token pairs match: Buy Order's Input Token = Sell Order's Output Token</li>
            <li className="leading-relaxed">Click <strong className="text-foreground">"Match Orders"</strong> to create a match</li>
            <li className="leading-relaxed">Click <strong className="text-foreground">"Execute Trade"</strong> to finalize and change order status to Filled</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

