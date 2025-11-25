"use client";

import { useState } from "react";
import { useSolsticeSwap } from "@/hooks/useSolsticeSwap";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

/**
 * 测试页面 - 演示完整的订单流程
 * 
 * 测试步骤：
 * 1. 创建两个订单（一个买入，一个卖出）
 * 2. 匹配这两个订单
 * 3. 执行交易，将订单状态从 Pending 变为 Filled
 */
export default function TestPage() {
  const { ethersSigner, ethersReadonlyProvider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { instance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const { 
    createOrder, 
    matchOrders, 
    executeTrade,
    isDeployed,
    message,
    isCreatingOrder,
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

  const [buyOrderId, setBuyOrderId] = useState<string>("");
  const [sellOrderId, setSellOrderId] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (msg: string) => {
    setTestResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // 步骤1: 创建买入订单
  const handleCreateBuyOrder = async () => {
    if (!createOrder) {
      addResult("❌ createOrder not available");
      return;
    }

    try {
      addResult("📝 Creating buy order...");
      const orderId = await createOrder({
        inputAmount: BigInt(100),
        outputAmount: BigInt(200),
        minPrice: BigInt(2),
        maxPrice: BigInt(3),
        orderType: 0, // Limit
        inputToken: "0x1111111111111111111111111111111111111111", // Token A
        outputToken: "0x2222222222222222222222222222222222222222", // Token B
      });

      if (orderId) {
        setBuyOrderId(orderId.toString());
        addResult(`✅ Buy order created! Order ID: ${orderId}`);
      }
    } catch (error) {
      addResult(`❌ Failed to create buy order: ${error}`);
    }
  };

  // 步骤2: 创建卖出订单
  const handleCreateSellOrder = async () => {
    if (!createOrder) {
      addResult("❌ createOrder not available");
      return;
    }

    try {
      addResult("📝 Creating sell order...");
      // 注意：卖出订单的 inputToken 和 outputToken 是反过来的
      const orderId = await createOrder({
        inputAmount: BigInt(200),
        outputAmount: BigInt(100),
        minPrice: BigInt(1),
        maxPrice: BigInt(2),
        orderType: 0, // Limit
        inputToken: "0x2222222222222222222222222222222222222222", // Token B (卖出)
        outputToken: "0x1111111111111111111111111111111111111111", // Token A (买入)
      });

      if (orderId) {
        setSellOrderId(orderId.toString());
        addResult(`✅ Sell order created! Order ID: ${orderId}`);
      }
    } catch (error) {
      addResult(`❌ Failed to create sell order: ${error}`);
    }
  };

  // 步骤3: 匹配订单
  const handleMatchOrders = async () => {
    if (!matchOrders || !buyOrderId || !sellOrderId) {
      addResult("❌ Please create both buy and sell orders first");
      return;
    }

    try {
      addResult(`🔗 Matching orders ${buyOrderId} and ${sellOrderId}...`);
      const matchIdResult = await matchOrders(BigInt(buyOrderId), BigInt(sellOrderId));

      if (matchIdResult) {
        setMatchId(matchIdResult.toString());
        addResult(`✅ Orders matched! Match ID: ${matchIdResult}`);
        addResult("ℹ️  Orders are still Pending. Execute trade to change status to Filled.");
      }
    } catch (error) {
      addResult(`❌ Failed to match orders: ${error}`);
    }
  };

  // 步骤4: 执行交易
  const handleExecuteTrade = async () => {
    if (!executeTrade || !matchId) {
      addResult("❌ Please match orders first");
      return;
    }

    try {
      addResult(`⚡ Executing trade for match ${matchId}...`);
      const success = await executeTrade(BigInt(matchId));

      if (success) {
        addResult(`✅ Trade executed! Orders should now be Filled.`);
        addResult("🔄 Refresh the orders page to see updated status.");
      }
    } catch (error) {
      addResult(`❌ Failed to execute trade: ${error}`);
    }
  };

  if (!isDeployed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
          Order Testing Guide
        </h1>
        <p className="text-foreground/80 text-lg">
          Complete order lifecycle testing (Create → Match → Execute)
        </p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-border/60 shadow-lg p-6 md:p-8 space-y-6">
        <div className="p-6 bg-gradient-to-br from-info/10 to-primary/5 rounded-xl border-2 border-info/20">
          <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
            <span className="text-2xl">📋</span>
            测试流程说明
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground/80 ml-2">
            <li className="leading-relaxed">创建买入订单（用 Token A 换 Token B）</li>
            <li className="leading-relaxed">创建卖出订单（用 Token B 换 Token A）</li>
            <li className="leading-relaxed">匹配这两个订单（创建匹配结果）</li>
            <li className="leading-relaxed">执行交易（将订单状态从 Pending 变为 Filled）</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">1️⃣</span>
              <h3 className="font-bold text-lg text-foreground">创建买入订单</h3>
            </div>
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
              用 100 Token A 换取 200 Token B（价格范围：2-3）
            </p>
            {buyOrderId && (
              <div className="mb-3 p-2 bg-white rounded-lg border border-primary/20">
                <p className="text-xs font-medium text-foreground/70 mb-1">Order ID</p>
                <p className="font-mono text-sm font-bold text-primary">{buyOrderId}</p>
              </div>
            )}
            <button
              onClick={handleCreateBuyOrder}
              disabled={isCreatingOrder || !!buyOrderId}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none font-semibold"
            >
              {isCreatingOrder ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Creating...
                </span>
              ) : buyOrderId ? (
                `✅ Buy Order: ${buyOrderId}`
              ) : (
                "Create Buy Order"
              )}
            </button>
          </div>

          <div className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border-2 border-secondary/20 hover:border-secondary/40 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">2️⃣</span>
              <h3 className="font-bold text-lg text-foreground">创建卖出订单</h3>
            </div>
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
              用 200 Token B 换取 100 Token A（价格范围：1-2）
            </p>
            {sellOrderId && (
              <div className="mb-3 p-2 bg-white rounded-lg border border-secondary/20">
                <p className="text-xs font-medium text-foreground/70 mb-1">Order ID</p>
                <p className="font-mono text-sm font-bold text-secondary">{sellOrderId}</p>
              </div>
            )}
            <button
              onClick={handleCreateSellOrder}
              disabled={isCreatingOrder || !!sellOrderId}
              className="w-full px-4 py-3 bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground rounded-xl hover:from-secondary/90 hover:to-secondary/70 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none font-semibold"
            >
              {isCreatingOrder ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Creating...
                </span>
              ) : sellOrderId ? (
                `✅ Sell Order: ${sellOrderId}`
              ) : (
                "Create Sell Order"
              )}
            </button>
          </div>

          <div className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border-2 border-accent/20 hover:border-accent/40 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">3️⃣</span>
              <h3 className="font-bold text-lg text-foreground">匹配订单</h3>
            </div>
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
              匹配买入订单和卖出订单（需要代币对匹配）
            </p>
            {matchId && (
              <div className="mb-3 p-2 bg-white rounded-lg border border-accent/20">
                <p className="text-xs font-medium text-foreground/70 mb-1">Match ID</p>
                <p className="font-mono text-sm font-bold text-accent">{matchId}</p>
              </div>
            )}
            <button
              onClick={handleMatchOrders}
              disabled={isMatchingOrders || !buyOrderId || !sellOrderId || !!matchId}
              className="w-full px-4 py-3 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground rounded-xl hover:from-accent/90 hover:to-accent/70 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none font-semibold"
            >
              {isMatchingOrders ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Matching...
                </span>
              ) : matchId ? (
                `✅ Matched! Match ID: ${matchId}`
              ) : (
                "Match Orders"
              )}
            </button>
          </div>

          <div className="p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border-2 border-success/20 hover:border-success/40 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">4️⃣</span>
              <h3 className="font-bold text-lg text-foreground">执行交易</h3>
            </div>
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
              执行匹配的交易，将订单状态从 Pending 变为 Filled
            </p>
            <button
              onClick={handleExecuteTrade}
              disabled={!matchId}
              className="w-full px-4 py-3 bg-gradient-to-r from-success to-success/80 text-white rounded-xl hover:from-success/90 hover:to-success/70 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none font-semibold"
            >
              ⚡ Execute Trade
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border ${
            message.includes("failed") || message.includes("error") || message.includes("Error")
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : message.includes("success") || message.includes("completed")
              ? "bg-success/10 border-success/20 text-success"
              : "bg-info/10 border-info/20 text-info"
          }`}>
            <p className="text-sm font-semibold mb-1">Status:</p>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="p-6 bg-gradient-to-br from-surface to-white rounded-xl border-2 border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <span>📝</span>
                Test Log
              </h3>
              <button
                onClick={() => setTestResults([])}
                className="px-4 py-2 text-sm bg-surface border border-border rounded-lg hover:bg-surface/80 hover:border-primary/50 transition-colors font-medium"
              >
                Clear Log
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-surface/50 border-border/50 text-foreground text-sm font-mono"
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="font-semibold text-blue-600 mb-2">💡 提示</h3>
          <ul className="text-sm text-foreground/80 space-y-1">
            <li>• 订单创建后状态为 <strong>Pending</strong></li>
            <li>• 匹配订单后创建匹配结果，但订单状态仍为 <strong>Pending</strong></li>
            <li>• 执行交易后，订单状态变为 <strong>Filled</strong></li>
            <li>• 在 Orders 页面刷新查看更新后的状态</li>
            <li>• 确保两个订单的代币对匹配（A→B 和 B→A）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

