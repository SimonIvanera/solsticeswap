"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useSolsticeSwap } from "@/hooks/useSolsticeSwap";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { SolsticeSwapABI } from "@/abi/SolsticeSwapABI";

interface MatchResult {
  matchId: bigint;
  buyOrderId: bigint;
  sellOrderId: bigint;
  timestamp: bigint;
}

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const { ethersSigner, ethersReadonlyProvider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { instance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const { getOrder, decryptOrderParams, decryptMatchResult, isDeployed, isDecrypting, message, contractAddress } = useSolsticeSwap({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: undefined,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decryptedParams, setDecryptedParams] = useState<{
    inputAmount?: bigint;
    outputAmount?: bigint;
    minPrice?: bigint;
    maxPrice?: bigint;
  } | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [decryptedMatchResults, setDecryptedMatchResults] = useState<Map<bigint, {
    tradeAmount: bigint;
    tradePrice: bigint;
  }>>(new Map());
  const [decryptingMatchId, setDecryptingMatchId] = useState<bigint | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!getOrder || !orderId) {
        setLoading(false);
        return;
      }

      try {
        const orderData = await getOrder(BigInt(orderId));
        setOrder(orderData);
        
        // Check if current user is the order creator
        if (orderData && ethersSigner) {
          const userAddress = await ethersSigner.getAddress();
          setIsCreator(userAddress.toLowerCase() === orderData.creator.toLowerCase());
        }
      } catch (error) {
        console.error("Failed to load order:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [getOrder, orderId, ethersSigner]);

  // Load match results for this order
  useEffect(() => {
    const loadMatchResults = async () => {
      if (!contractAddress || !ethersReadonlyProvider || !orderId) {
        return;
      }

      try {
        const contract = new ethers.Contract(
          contractAddress,
          SolsticeSwapABI.abi,
          ethersReadonlyProvider
        );

        // Get total match count
        const nextMatchId = await contract.nextMatchId();
        const matchCount = Number(nextMatchId);
        const currentOrderId = BigInt(orderId);

        const matches: MatchResult[] = [];

        // Search through all matches to find ones involving this order
        for (let i = 1; i < matchCount; i++) {
          try {
            const matchResult = await contract.getMatchResult(i);
            const buyOrderId = BigInt(matchResult.buyOrderId.toString());
            const sellOrderId = BigInt(matchResult.sellOrderId.toString());

            // Check if this order is involved in the match
            if (buyOrderId === currentOrderId || sellOrderId === currentOrderId) {
              matches.push({
                matchId: BigInt(i),
                buyOrderId,
                sellOrderId,
                timestamp: BigInt(matchResult.timestamp.toString()),
              });
            }
          } catch (err) {
            // Skip invalid matches
            console.warn(`Failed to fetch match ${i}:`, err);
          }
        }

        setMatchResults(matches);
      } catch (error) {
        console.error("Failed to load match results:", error);
      }
    };

    if (isDeployed && contractAddress && ethersReadonlyProvider) {
      loadMatchResults();
    }
  }, [contractAddress, ethersReadonlyProvider, orderId, isDeployed]);

  const handleDecrypt = async () => {
    if (!decryptOrderParams || !orderId) {
      return;
    }

    try {
      const params = await decryptOrderParams(BigInt(orderId));
      if (params) {
        // Ensure all values are bigint
        setDecryptedParams({
          inputAmount: typeof params.inputAmount === 'bigint' ? params.inputAmount : BigInt(params.inputAmount || 0),
          outputAmount: typeof params.outputAmount === 'bigint' ? params.outputAmount : BigInt(params.outputAmount || 0),
          minPrice: typeof params.minPrice === 'bigint' ? params.minPrice : BigInt(params.minPrice || 0),
          maxPrice: typeof params.maxPrice === 'bigint' ? params.maxPrice : BigInt(params.maxPrice || 0),
        });
      }
    } catch (error) {
      console.error("Failed to decrypt order params:", error);
    }
  };

  const handleDecryptMatchResult = async (matchId: bigint) => {
    if (!decryptMatchResult || !orderId) {
      return;
    }

    setDecryptingMatchId(matchId);
    try {
      const result = await decryptMatchResult(matchId, BigInt(orderId));
      if (result) {
        const tradeAmount = typeof result.tradeAmount === 'bigint' ? result.tradeAmount : BigInt(result.tradeAmount || 0);
        const tradePrice = typeof result.tradePrice === 'bigint' ? result.tradePrice : BigInt(result.tradePrice || 0);
        
        setDecryptedMatchResults(prev => {
          const newMap = new Map(prev);
          newMap.set(matchId, { tradeAmount, tradePrice });
          return newMap;
        });
      }
    } catch (error) {
      console.error("Failed to decrypt match result:", error);
    } finally {
      setDecryptingMatchId(null);
    }
  };

  if (!isDeployed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-surface rounded-xl border border-border p-6">
          <p className="text-foreground/80">
            SolsticeSwap contract not deployed on this network.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-surface rounded-xl border border-border p-6">
          <p className="text-foreground/80">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-surface rounded-xl border border-border p-6">
          <p className="text-foreground/80">Order not found.</p>
        </div>
      </div>
    );
  }

  const statusMap: Record<number, string> = {
    0: "Pending",
    1: "Partially Filled",
    2: "Filled",
    3: "Cancelled",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
          Order Details
        </h1>
        <p className="text-foreground/80 text-lg">
          View encrypted order information
        </p>
      </div>
      <div className="bg-white rounded-2xl border-2 border-border/60 shadow-lg p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-surface/50 rounded-xl border border-border/50">
            <h3 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">Order ID</h3>
            <p className="font-mono text-lg font-bold text-foreground">{orderId}</p>
          </div>
          <div className="p-4 bg-surface/50 rounded-xl border border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Status</h3>
            <p className="text-lg font-semibold text-foreground">{statusMap[Number(order.status)] || "Unknown"}</p>
          </div>
          <div className="p-4 bg-surface/50 rounded-xl border border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Creator</h3>
            <p className="font-mono text-sm text-foreground break-all">{order.creator}</p>
          </div>
          <div className="p-4 bg-surface/50 rounded-xl border border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Created At</h3>
            <p className="text-sm text-foreground">{new Date(Number(order.createdAt) * 1000).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-surface/50 rounded-xl border border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Input Token</h3>
            <p className="font-mono text-sm text-foreground break-all">{order.inputToken}</p>
          </div>
          <div className="p-4 bg-surface/50 rounded-xl border border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Output Token</h3>
            <p className="font-mono text-sm text-foreground break-all">{order.outputToken}</p>
          </div>
        </div>
        <div className="pt-6 border-t border-border/50">
          <div className="space-y-6">
            <div className="p-4 bg-info/10 border border-info/20 rounded-xl">
                <p className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-lg">🔒</span>
                <span>
                  <strong className="text-foreground">Encrypted Parameters:</strong> Order parameters (input amount, output amount, prices) are fully encrypted on-chain. Only the order creator can decrypt these values.
                </span>
              </p>
            </div>
            
            {isCreator && (
              <div className="space-y-4">
                {!decryptedParams ? (
                  <button
                    onClick={handleDecrypt}
                    disabled={isDecrypting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-semibold text-lg"
                  >
                    {isDecrypting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Decrypting Parameters...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>🔓</span>
                        Decrypt Order Parameters
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4 p-6 bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border-2 border-accent/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <span>✅</span>
                        Decrypted Parameters
                      </h4>
                      <button
                        onClick={() => setDecryptedParams(null)}
                        className="px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-surface rounded-lg transition-colors"
                      >
                        Hide
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-border/50">
                        <h5 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">Input Amount</h5>
                        <p className="font-mono text-xl font-bold text-foreground">{decryptedParams.inputAmount?.toString() || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-border/50">
                        <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Output Amount</h5>
                        <p className="font-mono text-xl font-bold text-foreground">{decryptedParams.outputAmount?.toString() || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-border/50">
                        <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Min Price</h5>
                        <p className="font-mono text-xl font-bold text-foreground">{decryptedParams.minPrice?.toString() || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-border/50">
                        <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Max Price</h5>
                        <p className="font-mono text-xl font-bold text-foreground">{decryptedParams.maxPrice?.toString() || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}
                {message && (
                  <div className={`p-4 rounded-xl border ${
                    message.includes("failed") || message.includes("error") || message.includes("Error")
                      ? "bg-destructive/10 border-destructive/20 text-destructive"
                      : message.includes("completed") || message.includes("success")
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-info/10 border-info/20 text-info"
                  }`}>
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Match Results Section */}
            {matchResults.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-border/50">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span>🔗</span>
                  Match Results
                </h3>
                <div className="space-y-4">
                  {matchResults.map((match) => {
                    const isBuyOrder = match.buyOrderId.toString() === orderId;
                    const otherOrderId = isBuyOrder ? match.sellOrderId : match.buyOrderId;
                    const decryptedData = decryptedMatchResults.get(match.matchId);
                    const isDecrypted = !!decryptedData;
                    const isDecrypting = decryptingMatchId === match.matchId;

                    return (
                      <div
                        key={match.matchId.toString()}
                        className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border-2 border-accent/20"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">📊</span>
                              <h4 className="font-bold text-foreground">Match #{match.matchId.toString()}</h4>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground ml-7">
                              <p>
                                <span className="font-medium">Type:</span> {isBuyOrder ? "Buy Order" : "Sell Order"}
                              </p>
                              <p>
                                <span className="font-medium">Counter Order:</span> #{otherOrderId.toString()}
                              </p>
                              <p>
                                <span className="font-medium">Matched At:</span>{" "}
                                {new Date(Number(match.timestamp) * 1000).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {isCreator && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            {!isDecrypted ? (
                              <button
                                onClick={() => handleDecryptMatchResult(match.matchId)}
                                disabled={isDecrypting || decryptingMatchId !== null}
                                className="w-full px-4 py-3 bg-gradient-to-r from-accent to-success text-accent-foreground rounded-xl hover:from-accent/90 hover:to-success/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-semibold"
                              >
                                {isDecrypting || decryptingMatchId === match.matchId ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    Decrypting Trade Details...
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-2">
                                    <span>🔓</span>
                                    Decrypt Trade Price & Amount
                                  </span>
                                )}
                              </button>
                            ) : (
                              <div className="space-y-3">
                                <div className="p-4 bg-white rounded-xl border border-border/50">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-bold text-foreground flex items-center gap-2">
                                      <span>✅</span>
                                      Decrypted Trade Details
                                    </h5>
                                    <button
                                      onClick={() => {
                                        setDecryptedMatchResults(prev => {
                                          const newMap = new Map(prev);
                                          newMap.delete(match.matchId);
                                          return newMap;
                                        });
                                      }}
                                      className="px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-surface rounded-lg transition-colors"
                                    >
                                      Hide
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h6 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">
                                        Trade Amount
                                      </h6>
                                      <p className="font-mono text-2xl font-bold text-foreground">
                                        {decryptedData.tradeAmount.toString()}
                                      </p>
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">
                                        Trade Price
                                      </h6>
                                      <p className="font-mono text-2xl font-bold text-foreground">
                                        {decryptedData.tradePrice.toString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!isCreator && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
                              <p className="text-xs text-foreground/80">
                                Only order creators can decrypt trade details. If you are the creator of order #{otherOrderId.toString()}, 
                                visit that order's detail page to view the decrypted trade information.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {matchResults.length === 0 && Number(order.status) === 2 && (
              <div className="pt-6 border-t border-border/50">
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl">
                  <p className="text-sm text-foreground/80">
                    This order is marked as Filled, but no match results were found. This may indicate the order was filled through a different mechanism.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
