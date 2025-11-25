"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { SolsticeSwapAddresses } from "@/abi/SolsticeSwapAddresses";
import { SolsticeSwapABI } from "@/abi/SolsticeSwapABI";

type SolsticeSwapInfoType = {
  abi: typeof SolsticeSwapABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getSolsticeSwapByChainId(
  chainId: number | undefined
): SolsticeSwapInfoType {
  if (!chainId) {
    return { abi: SolsticeSwapABI.abi };
  }

  const entry =
    SolsticeSwapAddresses[chainId.toString() as keyof typeof SolsticeSwapAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: SolsticeSwapABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: SolsticeSwapABI.abi,
  };
}

export type OrderType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CreateOrderParams {
  inputAmount: bigint;
  outputAmount: bigint;
  minPrice: bigint;
  maxPrice: bigint;
  orderType: OrderType;
  inputToken: string;
  outputToken: string;
}

export interface CreateIcebergOrderParams extends CreateOrderParams {
  totalAmount: bigint;
  visibleAmount: bigint;
  revealInterval: number;
}

export const useSolsticeSwap = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [message, setMessage] = useState<string>("");
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [isMatchingOrders, setIsMatchingOrders] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  const solsticeSwapRef = useRef<SolsticeSwapInfoType | undefined>(undefined);

  const solsticeSwap = useMemo(() => {
    const c = getSolsticeSwapByChainId(chainId);
    solsticeSwapRef.current = c;
    if (!c.address) {
      setMessage(`SolsticeSwap deployment not found for chainId=${chainId}.`);
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!solsticeSwap) {
      return undefined;
    }
    return (
      Boolean(solsticeSwap.address) &&
      solsticeSwap.address !== ethers.ZeroAddress
    );
  }, [solsticeSwap]);

  const canCreateOrder = useMemo(() => {
    return (
      solsticeSwap.address &&
      instance &&
      ethersSigner &&
      !isCreatingOrder
    );
  }, [solsticeSwap.address, instance, ethersSigner, isCreatingOrder]);

  const createOrder = useCallback(
    async (params: CreateOrderParams) => {
      if (isCreatingOrder || !solsticeSwap.address || !instance || !ethersSigner) {
        return;
      }

      const thisChainId = chainId;
      const thisSolsticeSwapAddress = solsticeSwap.address;
      const thisEthersSigner = ethersSigner;
      const thisSolsticeSwapContract = new ethers.Contract(
        thisSolsticeSwapAddress,
        solsticeSwap.abi,
        thisEthersSigner
      );

      setIsCreatingOrder(true);
      setMessage("Creating encrypted order...");

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisSolsticeSwapAddress !== solsticeSwapRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const input = instance.createEncryptedInput(
            thisSolsticeSwapAddress,
            thisEthersSigner.address
          );
          input.add256(params.inputAmount);
          input.add256(params.outputAmount);
          input.add256(params.minPrice);
          input.add256(params.maxPrice);

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage("Order creation cancelled (stale)");
            return;
          }

          setMessage("Submitting order to contract...");

          const tx: ethers.TransactionResponse =
            await thisSolsticeSwapContract.createOrder(
              enc.handles[0],
              enc.handles[1],
              enc.handles[2],
              enc.handles[3],
              params.orderType,
              enc.inputProof,
              enc.inputProof,
              enc.inputProof,
              enc.inputProof,
              params.inputToken,
              params.outputToken
            );

          setMessage(`Waiting for tx: ${tx.hash}...`);

          const receipt = await tx.wait();

          setMessage(`Order created! Status: ${receipt?.status}`);

          if (isStale()) {
            return;
          }

          // Parse order ID from events
          const orderCreatedEvent = receipt?.logs.find(
            (log: ethers.Log) => {
              try {
                const parsed = thisSolsticeSwapContract.interface.parseLog(log);
                return parsed?.name === "OrderCreated";
              } catch {
                return false;
              }
            }
          );

          if (orderCreatedEvent) {
            const parsed = thisSolsticeSwapContract.interface.parseLog(
              orderCreatedEvent
            );
            const orderId = parsed?.args[0];
            return orderId;
          }
        } catch (error) {
          setMessage(`Order creation failed: ${error}`);
          throw error;
        } finally {
          setIsCreatingOrder(false);
        }
      };

      return run();
    },
    [
      ethersSigner,
      solsticeSwap.address,
      solsticeSwap.abi,
      instance,
      chainId,
      sameChain,
      sameSigner,
    ]
  );

  const createIcebergOrder = useCallback(
    async (params: CreateIcebergOrderParams) => {
      if (isCreatingOrder || !solsticeSwap.address || !instance || !ethersSigner) {
        return;
      }

      const thisChainId = chainId;
      const thisSolsticeSwapAddress = solsticeSwap.address;
      const thisEthersSigner = ethersSigner;
      const thisSolsticeSwapContract = new ethers.Contract(
        thisSolsticeSwapAddress,
        solsticeSwap.abi,
        thisEthersSigner
      );

      setIsCreatingOrder(true);
      setMessage("Creating encrypted iceberg order...");

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisSolsticeSwapAddress !== solsticeSwapRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const input = instance.createEncryptedInput(
            thisSolsticeSwapAddress,
            thisEthersSigner.address
          );
          input.add256(params.totalAmount);
          input.add256(params.visibleAmount);
          input.add256(params.outputAmount);
          input.add256(params.minPrice);
          input.add256(params.maxPrice);

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage("Order creation cancelled (stale)");
            return;
          }

          setMessage("Submitting iceberg order to contract...");

          const tx: ethers.TransactionResponse =
            await thisSolsticeSwapContract.createIcebergOrder(
              enc.handles[0],
              enc.handles[1],
              enc.handles[2],
              enc.handles[3],
              enc.handles[4],
              enc.inputProof,
              enc.inputProof,
              enc.inputProof,
              enc.inputProof,
              enc.inputProof,
              params.inputToken,
              params.outputToken,
              params.revealInterval
            );

          setMessage(`Waiting for tx: ${tx.hash}...`);

          const receipt = await tx.wait();

          setMessage(`Iceberg order created! Status: ${receipt?.status}`);

          if (isStale()) {
            return;
          }

          const orderCreatedEvent = receipt?.logs.find(
            (log: ethers.Log) => {
              try {
                const parsed = thisSolsticeSwapContract.interface.parseLog(log);
                return parsed?.name === "OrderCreated";
              } catch {
                return false;
              }
            }
          );

          if (orderCreatedEvent) {
            const parsed = thisSolsticeSwapContract.interface.parseLog(
              orderCreatedEvent
            );
            const orderId = parsed?.args[0];
            return orderId;
          }
        } catch (error) {
          setMessage(`Iceberg order creation failed: ${error}`);
          throw error;
        } finally {
          setIsCreatingOrder(false);
        }
      };

      return run();
    },
    [
      ethersSigner,
      solsticeSwap.address,
      solsticeSwap.abi,
      instance,
      chainId,
      sameChain,
      sameSigner,
    ]
  );

  const matchOrders = useCallback(
    async (buyOrderId: bigint, sellOrderId: bigint) => {
      if (isMatchingOrders || !solsticeSwap.address || !ethersSigner) {
        return;
      }

      const thisSolsticeSwapContract = new ethers.Contract(
        solsticeSwap.address,
        solsticeSwap.abi,
        ethersSigner
      );

      setIsMatchingOrders(true);
      setMessage("Matching orders...");

      try {
        const tx = await thisSolsticeSwapContract.matchOrders(
          buyOrderId,
          sellOrderId
        );

        setMessage(`Waiting for tx: ${tx.hash}...`);

        const receipt = await tx.wait();

        setMessage(`Orders matched! Status: ${receipt?.status}`);

        const orderMatchedEvent = receipt?.logs.find(
          (log: ethers.Log) => {
            try {
              const parsed = thisSolsticeSwapContract.interface.parseLog(log);
              return parsed?.name === "OrderMatched";
            } catch {
              return false;
            }
          }
        );

        if (orderMatchedEvent) {
          const parsed = thisSolsticeSwapContract.interface.parseLog(
            orderMatchedEvent
          );
          const matchId = parsed?.args[0];
          return matchId;
        }
      } catch (error) {
        setMessage(`Order matching failed: ${error}`);
        throw error;
      } finally {
        setIsMatchingOrders(false);
      }
    },
    [solsticeSwap.address, solsticeSwap.abi, ethersSigner]
  );

  const decryptMatchResult = useCallback(
    async (matchId: bigint, orderId: bigint) => {
      if (isDecrypting || !solsticeSwap.address || !instance || !ethersSigner) {
        return;
      }

      const thisChainId = chainId;
      const thisSolsticeSwapAddress = solsticeSwap.address;
      const thisEthersSigner = ethersSigner;
      const thisSolsticeSwapContract = new ethers.Contract(
        thisSolsticeSwapAddress,
        solsticeSwap.abi,
        ethersReadonlyProvider || thisEthersSigner
      );

      setIsDecrypting(true);
      setMessage("Decrypting match result...");

      const run = async () => {
        const isStale = () =>
          thisSolsticeSwapAddress !== solsticeSwapRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const matchResult = await thisSolsticeSwapContract.getMatchResult(
            matchId
          );

          const tradeAmountHandle = matchResult.tradeAmount;
          const tradePriceHandle = matchResult.tradePrice;

          const sig: FhevmDecryptionSignature | null =
            await FhevmDecryptionSignature.loadOrSign(
              instance,
              [thisSolsticeSwapAddress],
              thisEthersSigner,
              fhevmDecryptionSignatureStorage
            );

          if (!sig) {
            setMessage("Unable to build FHEVM decryption signature");
            return;
          }

          if (isStale()) {
            setMessage("Decryption cancelled (stale)");
            return;
          }

          setMessage("Calling FHEVM userDecrypt...");

          const res = await instance.userDecrypt(
            [
              { handle: tradeAmountHandle, contractAddress: thisSolsticeSwapAddress },
              { handle: tradePriceHandle, contractAddress: thisSolsticeSwapAddress },
            ],
            sig.privateKey,
            sig.publicKey,
            sig.signature,
            sig.contractAddresses,
            sig.userAddress,
            sig.startTimestamp,
            sig.durationDays
          );

          setMessage("Decryption completed!");

          if (isStale()) {
            setMessage("Decryption cancelled (stale)");
            return;
          }

          return {
            tradeAmount: res[tradeAmountHandle],
            tradePrice: res[tradePriceHandle],
          };
        } catch (error) {
          setMessage(`Decryption failed: ${error}`);
          throw error;
        } finally {
          setIsDecrypting(false);
        }
      };

      return run();
    },
    [
      fhevmDecryptionSignatureStorage,
      ethersSigner,
      ethersReadonlyProvider,
      solsticeSwap.address,
      solsticeSwap.abi,
      instance,
      chainId,
      sameChain,
      sameSigner,
    ]
  );

  const getOrder = useCallback(
    async (orderId: bigint) => {
      if (!solsticeSwap.address || !ethersReadonlyProvider) {
        return;
      }

      const contract = new ethers.Contract(
        solsticeSwap.address,
        solsticeSwap.abi,
        ethersReadonlyProvider
      );

      try {
        const order = await contract.getOrder(orderId);
        return {
          creator: order.creator,
          status: order.status,
          createdAt: order.createdAt,
          inputToken: order.inputToken,
          outputToken: order.outputToken,
        };
      } catch (error) {
        setMessage(`Failed to get order: ${error}`);
        return undefined;
      }
    },
    [solsticeSwap.address, solsticeSwap.abi, ethersReadonlyProvider]
  );

  const executeTrade = useCallback(
    async (matchId: bigint) => {
      if (!solsticeSwap.address || !ethersSigner) {
        return;
      }

      const thisSolsticeSwapContract = new ethers.Contract(
        solsticeSwap.address,
        solsticeSwap.abi,
        ethersSigner
      );

      setMessage("Executing trade...");

      try {
        const tx = await thisSolsticeSwapContract.executeTrade(matchId);

        setMessage(`Waiting for tx: ${tx.hash}...`);

        const receipt = await tx.wait();

        setMessage(`Trade executed! Status: ${receipt?.status}`);

        return receipt?.status === 1;
      } catch (error) {
        setMessage(`Trade execution failed: ${error}`);
        throw error;
      }
    },
    [solsticeSwap.address, solsticeSwap.abi, ethersSigner]
  );

  const decryptOrderParams = useCallback(
    async (orderId: bigint) => {
      if (isDecrypting || !solsticeSwap.address || !instance || !ethersSigner) {
        return;
      }

      const thisChainId = chainId;
      const thisSolsticeSwapAddress = solsticeSwap.address;
      const thisEthersSigner = ethersSigner;
      const thisSolsticeSwapContract = new ethers.Contract(
        thisSolsticeSwapAddress,
        solsticeSwap.abi,
        ethersReadonlyProvider || thisEthersSigner
      );

      setIsDecrypting(true);
      setMessage("Decrypting order parameters...");

      const run = async () => {
        const isStale = () =>
          thisSolsticeSwapAddress !== solsticeSwapRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          // Get encrypted values from contract
          const encryptedValues = await thisSolsticeSwapContract.getOrderEncryptedValues(
            orderId
          );

          const inputAmountHandle = encryptedValues.inputAmount;
          const outputAmountHandle = encryptedValues.outputAmount;
          const minPriceHandle = encryptedValues.minPrice;
          const maxPriceHandle = encryptedValues.maxPrice;

          const sig: FhevmDecryptionSignature | null =
            await FhevmDecryptionSignature.loadOrSign(
              instance,
              [thisSolsticeSwapAddress],
              thisEthersSigner,
              fhevmDecryptionSignatureStorage
            );

          if (!sig) {
            setMessage("Unable to build FHEVM decryption signature");
            return;
          }

          if (isStale()) {
            setMessage("Decryption cancelled (stale)");
            return;
          }

          setMessage("Calling FHEVM userDecrypt...");

          const res = await instance.userDecrypt(
            [
              { handle: inputAmountHandle, contractAddress: thisSolsticeSwapAddress },
              { handle: outputAmountHandle, contractAddress: thisSolsticeSwapAddress },
              { handle: minPriceHandle, contractAddress: thisSolsticeSwapAddress },
              { handle: maxPriceHandle, contractAddress: thisSolsticeSwapAddress },
            ],
            sig.privateKey,
            sig.publicKey,
            sig.signature,
            sig.contractAddresses,
            sig.userAddress,
            sig.startTimestamp,
            sig.durationDays
          );

          setMessage("Decryption completed!");

          if (isStale()) {
            setMessage("Decryption cancelled (stale)");
            return;
          }

          return {
            inputAmount: res[inputAmountHandle],
            outputAmount: res[outputAmountHandle],
            minPrice: res[minPriceHandle],
            maxPrice: res[maxPriceHandle],
          };
        } catch (error) {
          setMessage(`Decryption failed: ${error}`);
          throw error;
        } finally {
          setIsDecrypting(false);
        }
      };

      return run();
    },
    [
      fhevmDecryptionSignatureStorage,
      ethersSigner,
      ethersReadonlyProvider,
      solsticeSwap.address,
      solsticeSwap.abi,
      instance,
      chainId,
      sameChain,
      sameSigner,
    ]
  );

  return {
    contractAddress: solsticeSwap.address,
    isDeployed,
    canCreateOrder,
    createOrder,
    createIcebergOrder,
    matchOrders,
    executeTrade,
    decryptMatchResult,
    decryptOrderParams,
    getOrder,
    message,
    isCreatingOrder,
    isMatchingOrders,
    isDecrypting,
  };
};


