"use client";

import { useEffect, useState, useRef } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { createFhevmInstance } from "./internal/fhevm";
import { FhevmInstance } from "./fhevmTypes";

export function useFhevm() {
  const { provider, chainId, initialMockChains } = useMetaMaskEthersSigner();
  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, setStatus] = useState<string>("idle");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!provider || !chainId) {
      setInstance(undefined);
      setStatus("idle");
      return;
    }

    // Abort previous instance creation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setStatus("creating");

    createFhevmInstance({
      provider,
      mockChains: initialMockChains,
      signal: abortController.signal,
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
    })
      .then((newInstance) => {
        if (!abortController.signal.aborted) {
          setInstance(newInstance);
          setStatus("ready");
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          console.error("Failed to create FHEVM instance:", error);
          setInstance(undefined);
          setStatus("error");
        }
      });

    return () => {
      abortController.abort();
    };
  }, [provider, chainId, initialMockChains]);

  return { instance, status };
}


