"use client";

import { useState } from "react";
import { isAddress } from "ethers";
import { useSolsticeSwap, CreateOrderParams, CreateIcebergOrderParams } from "@/hooks/useSolsticeSwap";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

export function OrderForm() {
  const { ethersSigner, ethersReadonlyProvider, chainId, sameChain, sameSigner } = useMetaMaskEthersSigner();
  const { instance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const { createOrder, createIcebergOrder, canCreateOrder, message, isCreatingOrder } = useSolsticeSwap({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: undefined,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [orderType, setOrderType] = useState<"limit" | "iceberg">("limit");
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  // Preset token addresses for testing
  const PRESET_TOKENS = [
    { label: "Token A (Mock)", address: "0x1111111111111111111111111111111111111111" },
    { label: "Token B (Mock)", address: "0x2222222222222222222222222222222222222222" },
    { label: "Token C (Mock)", address: "0x3333333333333333333333333333333333333333" },
    { label: "Token D (Mock)", address: "0x4444444444444444444444444444444444444444" },
    { label: "Custom Address", address: "" },
  ];

  const [inputToken, setInputToken] = useState(PRESET_TOKENS[0].address);
  const [outputToken, setOutputToken] = useState(PRESET_TOKENS[1].address);
  const [inputTokenCustom, setInputTokenCustom] = useState("");
  const [outputTokenCustom, setOutputTokenCustom] = useState("");
  const [inputTokenMode, setInputTokenMode] = useState<"preset" | "custom">("preset");
  const [outputTokenMode, setOutputTokenMode] = useState<"preset" | "custom">("preset");
  
  // Iceberg order specific
  const [totalAmount, setTotalAmount] = useState("");
  const [visibleAmount, setVisibleAmount] = useState("");
  const [revealInterval, setRevealInterval] = useState("3600");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreateOrder) {
      return;
    }

    // Get actual token addresses based on mode
    const actualInputToken = inputTokenMode === "custom" ? inputTokenCustom : inputToken;
    const actualOutputToken = outputTokenMode === "custom" ? outputTokenCustom : outputToken;

    // Validate address format
    if (!isAddress(actualInputToken)) {
      alert("Invalid Input Token Address format. Must be a valid Ethereum address (0x...).");
      return;
    }
    if (!isAddress(actualOutputToken)) {
      alert("Invalid Output Token Address format. Must be a valid Ethereum address (0x...).");
      return;
    }
    if (actualInputToken.toLowerCase() === actualOutputToken.toLowerCase()) {
      alert("Input Token and Output Token must be different.");
      return;
    }

    try {
      if (orderType === "iceberg") {
        if (!totalAmount || !visibleAmount) {
          alert("Please fill in all iceberg order fields");
          return;
        }
        const params: CreateIcebergOrderParams = {
          totalAmount: BigInt(totalAmount),
          visibleAmount: BigInt(visibleAmount),
          inputAmount: BigInt(inputAmount),
          outputAmount: BigInt(outputAmount),
          minPrice: BigInt(minPrice),
          maxPrice: BigInt(maxPrice),
          orderType: 2, // Iceberg
          inputToken: actualInputToken,
          outputToken: actualOutputToken,
          revealInterval: parseInt(revealInterval),
        };
        const orderId = await createIcebergOrder(params);
        if (orderId) {
          alert(`Iceberg order created! Order ID: ${orderId}`);
          // Reset form
          setInputAmount("");
          setOutputAmount("");
          setMinPrice("");
          setMaxPrice("");
          setTotalAmount("");
          setVisibleAmount("");
        }
      } else {
        const params: CreateOrderParams = {
          inputAmount: BigInt(inputAmount),
          outputAmount: BigInt(outputAmount),
          minPrice: BigInt(minPrice),
          maxPrice: BigInt(maxPrice),
          orderType: 0, // Limit
          inputToken: actualInputToken,
          outputToken: actualOutputToken,
        };
        const orderId = await createOrder(params);
        if (orderId) {
          alert(`Order created! Order ID: ${orderId}`);
          // Reset form
          setInputAmount("");
          setOutputAmount("");
          setMinPrice("");
          setMaxPrice("");
        }
      }
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Create encrypted order">
      <div>
        <label className="block text-sm font-semibold mb-3 text-foreground">Order Type</label>
        <div className="flex gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              value="limit"
              checked={orderType === "limit"}
              onChange={(e) => setOrderType(e.target.value as "limit" | "iceberg")}
              className="peer sr-only"
            />
            <div className="p-4 rounded-xl border-2 border-border bg-white peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:shadow-md transition-all text-center">
              <div className="font-semibold mb-1 text-foreground">Limit Order</div>
              <div className="text-xs text-foreground/70">Standard order with fixed price</div>
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              value="iceberg"
              checked={orderType === "iceberg"}
              onChange={(e) => setOrderType(e.target.value as "limit" | "iceberg")}
              className="peer sr-only"
            />
            <div className="p-4 rounded-xl border-2 border-border bg-white peer-checked:border-secondary peer-checked:bg-secondary/10 peer-checked:shadow-md transition-all text-center">
              <div className="font-semibold mb-1 text-foreground">Iceberg Order</div>
              <div className="text-xs text-foreground/70">Large order with hidden size</div>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">
            Input Token
          </label>
          <div className="space-y-2">
            <select
              value={inputTokenMode === "preset" ? inputToken : "custom"}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setInputTokenMode("custom");
                } else {
                  setInputTokenMode("preset");
                  setInputToken(e.target.value);
                }
              }}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            >
              {PRESET_TOKENS.map((token, index) => (
                <option key={index} value={token.address || "custom"}>
                  {token.label}
                </option>
              ))}
            </select>
            {inputTokenMode === "custom" && (
              <div>
                <input
                  type="text"
                  value={inputTokenCustom}
                  onChange={(e) => setInputTokenCustom(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background font-mono text-sm hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  required
                />
                {inputTokenCustom && !isAddress(inputTokenCustom) && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <span>⚠</span> Invalid address format
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">
            Output Token
          </label>
          <div className="space-y-2">
            <select
              value={outputTokenMode === "preset" ? outputToken : "custom"}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setOutputTokenMode("custom");
                } else {
                  setOutputTokenMode("preset");
                  setOutputToken(e.target.value);
                }
              }}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            >
              {PRESET_TOKENS.map((token, index) => (
                <option key={index} value={token.address || "custom"}>
                  {token.label}
                </option>
              ))}
            </select>
            {outputTokenMode === "custom" && (
              <div>
                <input
                  type="text"
                  value={outputTokenCustom}
                  onChange={(e) => setOutputTokenCustom(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background font-mono text-sm hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  required
                />
                {outputTokenCustom && !isAddress(outputTokenCustom) && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <span>⚠</span> Invalid address format
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Input Amount</label>
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            required
            min="0"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Output Amount</label>
          <input
            type="number"
            value={outputAmount}
            onChange={(e) => setOutputAmount(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            required
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Min Price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            required
            min="0"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Max Price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            required
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      {orderType === "iceberg" && (
        <div className="p-6 bg-accent/5 border-2 border-accent/20 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🧊</span>
            <h3 className="font-semibold text-foreground">Iceberg Order Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Total Amount</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                required
                min="0"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Visible Amount</label>
              <input
                type="number"
                value={visibleAmount}
                onChange={(e) => setVisibleAmount(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                required
                min="0"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Reveal Interval (seconds)</label>
              <input
                type="number"
                value={revealInterval}
                onChange={(e) => setRevealInterval(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                required
                min="0"
                placeholder="3600"
              />
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl border ${
          message.includes("failed") || message.includes("error") || message.includes("Error")
            ? "bg-destructive/10 border-destructive/20 text-destructive"
            : "bg-info/10 border-info/20 text-info"
        }`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canCreateOrder || isCreatingOrder}
        className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isCreatingOrder ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Creating Encrypted Order...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🔒</span>
            Create Encrypted Order
          </span>
        )}
      </button>
    </form>
  );
}


