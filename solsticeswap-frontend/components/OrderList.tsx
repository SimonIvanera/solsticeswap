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

export function OrderList() {
  const { ethersSigner, ethersReadonlyProvider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { instance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const { getOrder, isDeployed, contractAddress } = useSolsticeSwap({
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [userAddress, setUserAddress] = useState<string | undefined>();

  const orderStatusMap: Record<number, string> = {
    0: "Pending",
    1: "Partially Filled",
    2: "Filled",
    3: "Cancelled",
  };

  const statusColors: Record<number, string> = {
    0: "bg-blue-500/20 text-blue-600",
    1: "bg-purple-500/20 text-purple-600",
    2: "bg-green-500/20 text-green-600",
    3: "bg-gray-500/20 text-gray-600",
  };

  useEffect(() => {
    if (!isDeployed || !contractAddress || !ethersReadonlyProvider || !getOrder) {
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Get user address
        let currentUserAddress = userAddress;
        if (ethersSigner && !currentUserAddress) {
          currentUserAddress = await ethersSigner.getAddress();
          setUserAddress(currentUserAddress);
        }

        // Create contract instance
        const contract = new ethers.Contract(
          contractAddress,
          SolsticeSwapABI.abi,
          ethersReadonlyProvider
        );

        // Get nextOrderId to know how many orders exist
        const nextOrderId = await contract.nextOrderId();
        const orderCount = Number(nextOrderId);

        if (orderCount === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Fetch all orders
        const fetchedOrders: Order[] = [];
        for (let i = 1; i < orderCount; i++) {
          try {
            const orderData = await getOrder(BigInt(i));
            if (orderData) {
              // Optionally filter by user address
              if (!currentUserAddress || orderData.creator.toLowerCase() === currentUserAddress.toLowerCase()) {
                fetchedOrders.push({
                  id: BigInt(i),
                  ...orderData,
                });
              }
            }
          } catch (error) {
            // Order might not exist or be invalid, skip it
            console.warn(`Failed to fetch order ${i}:`, error);
          }
        }

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Listen for new orders
    const contract = new ethers.Contract(
      contractAddress,
      SolsticeSwapABI.abi,
      ethersReadonlyProvider
    );

    const handleOrderCreated = () => {
      fetchOrders();
    };

    contract.on("OrderCreated", handleOrderCreated);

    // Cleanup listener on unmount
    return () => {
      contract.removeAllListeners("OrderCreated");
    };
  }, [isDeployed, contractAddress, ethersReadonlyProvider, getOrder, ethersSigner, userAddress]);

  if (!isDeployed) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <p className="text-foreground/80">
          SolsticeSwap contract not deployed on this network.
        </p>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "all") return true;
    const statusNum = Number(order.status);
    return orderStatusMap[statusNum] === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order History</h2>
          <p className="text-sm text-foreground/80 mt-1">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-border rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Partially Filled">Partially Filled</option>
          <option value="Filled">Filled</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <p className="text-foreground/80 font-medium">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-gradient-to-br from-surface to-white rounded-2xl border border-border/50 shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-foreground/80 text-lg font-medium mb-2">
            No orders found
          </p>
          <p className="text-sm text-foreground/70">
            Create your first order to get started!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-border/60 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-surface/80 to-surface/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm text-foreground/80">Order ID</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground/80">Type</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground/80">Input Token</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground/80">Output Token</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground/80">Status</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground/80">Created</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredOrders.map((order) => (
                  <tr key={order.id.toString()} className="hover:bg-primary/5 transition-colors border-b border-border/30">
                    <td className="p-4 font-mono text-sm font-bold text-foreground">{order.id.toString()}</td>
                    <td className="p-4">
                      <span className="px-3 py-1.5 bg-primary/15 text-primary rounded-lg text-xs font-bold border border-primary/20">
                        Limit
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm text-foreground/80">
                      {`${order.inputToken.slice(0, 6)}...${order.inputToken.slice(-4)}`}
                    </td>
                    <td className="p-4 font-mono text-sm text-foreground/80">
                      {`${order.outputToken.slice(0, 6)}...${order.outputToken.slice(-4)}`}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusColors[Number(order.status)] || ""}`}
                      >
                        {orderStatusMap[Number(order.status)] || "Unknown"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground/80">
                      {new Date(Number(order.createdAt) * 1000).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/orders/${order.id.toString()}`}
                        className="text-primary hover:text-primary/80 font-medium text-sm hover:underline transition-colors"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

