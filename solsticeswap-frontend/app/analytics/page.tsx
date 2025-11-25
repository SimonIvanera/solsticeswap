"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSolsticeSwap } from "@/hooks/useSolsticeSwap";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { SolsticeSwapABI } from "@/abi/SolsticeSwapABI";

interface AnalyticsData {
  totalOrders: number;
  filledOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  orders24h: number;
  orders7d: number;
  orders30d: number;
  totalMatches: number;
  matches24h: number;
  matches7d: number;
  matches30d: number;
  uniqueUsers: number;
  orderTypes: {
    limit: number;
    market: number;
    iceberg: number;
    other: number;
  };
}

export default function AnalyticsPage() {
  const { ethersSigner, ethersReadonlyProvider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { instance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const { contractAddress, isDeployed, getOrder } = useSolsticeSwap({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: undefined,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDeployed || !contractAddress || !ethersReadonlyProvider) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const contract = new ethers.Contract(
          contractAddress,
          SolsticeSwapABI.abi,
          ethersReadonlyProvider
        );

        // Get current timestamp
        const now = Math.floor(Date.now() / 1000);
        const oneDayAgo = now - 24 * 60 * 60;
        const sevenDaysAgo = now - 7 * 24 * 60 * 60;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

        // Get order count
        const nextOrderId = await contract.nextOrderId();
        const orderCount = Number(nextOrderId);

        // Get match count
        const nextMatchId = await contract.nextMatchId();
        const totalMatches = Number(nextMatchId);

        // Initialize counters
        let filledOrders = 0;
        let pendingOrders = 0;
        let cancelledOrders = 0;
        let orders24h = 0;
        let orders7d = 0;
        let orders30d = 0;
        let matches24h = 0;
        let matches7d = 0;
        let matches30d = 0;
        const uniqueUsersSet = new Set<string>();
        const orderTypes = {
          limit: 0,
          market: 0,
          iceberg: 0,
          other: 0,
        };

        // Fetch all orders
        for (let i = 1; i < orderCount; i++) {
          try {
            const order = await getOrder(BigInt(i));
            if (!order) continue;

            const status = Number(order.status);
            const createdAt = Number(order.createdAt);

            // Count by status
            if (status === 2) filledOrders++;
            else if (status === 0) pendingOrders++;
            else if (status === 3) cancelledOrders++;

            // Count by time period
            if (createdAt >= oneDayAgo) orders24h++;
            if (createdAt >= sevenDaysAgo) orders7d++;
            if (createdAt >= thirtyDaysAgo) orders30d++;

            // Count unique users
            uniqueUsersSet.add(order.creator.toLowerCase());

            // Note: Order type is not directly available from getOrder, so we skip type counting
          } catch (err) {
            // Skip invalid orders
            console.warn(`Failed to fetch order ${i}:`, err);
          }
        }

        // Fetch match results
        for (let i = 1; i < totalMatches; i++) {
          try {
            const matchResult = await contract.getMatchResult(i);
            const timestamp = Number(matchResult.timestamp);

            if (timestamp >= oneDayAgo) matches24h++;
            if (timestamp >= sevenDaysAgo) matches7d++;
            if (timestamp >= thirtyDaysAgo) matches30d++;
          } catch (err) {
            console.warn(`Failed to fetch match ${i}:`, err);
          }
        }

        setAnalytics({
          totalOrders: orderCount - 1,
          filledOrders,
          pendingOrders,
          cancelledOrders,
          orders24h,
          orders7d,
          orders30d,
          totalMatches: totalMatches - 1,
          matches24h,
          matches7d,
          matches30d,
          uniqueUsers: uniqueUsersSet.size,
          orderTypes,
        });
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isDeployed, contractAddress, ethersReadonlyProvider, getOrder]);

  if (!isDeployed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-gradient-to-br from-destructive/10 to-warning/5 border-2 border-destructive/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <p className="text-foreground font-medium">
              SolsticeSwap contract not deployed on this network.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-16">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <p className="text-foreground/80 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-gradient-to-br from-destructive/10 to-warning/5 border-2 border-destructive/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">❌</span>
            <p className="text-foreground font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
          Analytics
        </h1>
        <p className="text-foreground/80 text-lg">
          Real-time statistics from on-chain order data
        </p>
      </div>

      {analytics && (
        <>
          {/* Order Statistics */}
          <div className="bg-white rounded-2xl border-2 border-border/60 shadow-lg p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Order Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Total Orders</h3>
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.totalOrders}</p>
                <p className="text-xs text-foreground/70">All time</p>
              </div>

              <div className="group p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-2xl border-2 border-success/20 hover:border-success/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Filled Orders</h3>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.filledOrders}</p>
                <p className="text-xs text-foreground/70">
                  {analytics.totalOrders > 0
                    ? `${Math.round((analytics.filledOrders / analytics.totalOrders) * 100)}% filled`
                    : "0% filled"}
                </p>
              </div>

              <div className="group p-6 bg-gradient-to-br from-info/10 to-info/5 rounded-2xl border-2 border-info/20 hover:border-info/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Pending Orders</h3>
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.pendingOrders}</p>
                <p className="text-xs text-foreground/70">Awaiting match</p>
              </div>

              <div className="group p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Unique Users</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.uniqueUsers}</p>
                <p className="text-xs text-foreground/70">Active traders</p>
              </div>
            </div>
          </div>

          {/* Time-based Statistics */}
          <div className="bg-white rounded-2xl border-2 border-border/60 shadow-lg p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Orders by Time Period</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">24h Orders</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.orders24h}</p>
                <p className="text-xs text-foreground/70">Last 24 hours</p>
              </div>

              <div className="group p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">7d Orders</h3>
                  <span className="text-2xl">📈</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.orders7d}</p>
                <p className="text-xs text-foreground/70">Last 7 days</p>
              </div>

              <div className="group p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">30d Orders</h3>
                  <span className="text-2xl">📉</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.orders30d}</p>
                <p className="text-xs text-foreground/70">Last 30 days</p>
              </div>
            </div>
          </div>

          {/* Match Statistics */}
          <div className="bg-white rounded-2xl border-2 border-border/60 shadow-lg p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Match Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Total Matches</h3>
                  <span className="text-2xl">🔗</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.totalMatches}</p>
                <p className="text-xs text-foreground/70">All time</p>
              </div>

              <div className="group p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">24h Matches</h3>
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.matches24h}</p>
                <p className="text-xs text-foreground/70">Last 24 hours</p>
              </div>

              <div className="group p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">7d Matches</h3>
                  <span className="text-2xl">🔥</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.matches7d}</p>
                <p className="text-xs text-foreground/70">Last 7 days</p>
              </div>

              <div className="group p-6 bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl border-2 border-warning/20 hover:border-warning/40 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">30d Matches</h3>
                  <span className="text-2xl">💫</span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.matches30d}</p>
                <p className="text-xs text-foreground/70">Last 30 days</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 bg-info/10 border border-info/20 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Privacy-Preserving Analytics</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Analytics data is computed from on-chain order data. Order amounts and prices are fully encrypted using FHEVM,
                  ensuring complete privacy. Only aggregated counts and public metadata (timestamps, status, addresses) are shown here.
                  Individual order parameters remain private and can only be decrypted by the order creator.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

