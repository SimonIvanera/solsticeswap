
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const SolsticeSwapABI = {
  "abi": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "name": "OrderCancelled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "enum SolsticeSwap.OrderType",
          "name": "orderType",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "inputToken",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "outputToken",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        }
      ],
      "name": "OrderCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "enum SolsticeSwap.OrderStatus",
          "name": "status",
          "type": "uint8"
        }
      ],
      "name": "OrderFilled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "buyOrderId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "sellOrderId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "OrderMatched",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tradeId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "buyOrderId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "sellOrderId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "TradeExecuted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "name": "cancelOrder",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint256",
          "name": "inputEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint256",
          "name": "visibleAmountEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint256",
          "name": "outputEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint256",
          "name": "minPriceEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint256",
          "name": "maxPriceEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "visibleProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "outputProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "minPriceProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "maxPriceProof",
          "type": "bytes"
        },
        {
          "internalType": "address",
          "name": "inputToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "outputToken",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "revealInterval",
          "type": "uint256"
        }
      ],
      "name": "createIcebergOrder",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint256",
          "name": "inputEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint256",
          "name": "outputEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint256",
          "name": "minPriceEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint256",
          "name": "maxPriceEuint256",
          "type": "bytes32"
        },
        {
          "internalType": "enum SolsticeSwap.OrderType",
          "name": "orderType",
          "type": "uint8"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "outputProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "minPriceProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "maxPriceProof",
          "type": "bytes"
        },
        {
          "internalType": "address",
          "name": "inputToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "outputToken",
          "type": "address"
        }
      ],
      "name": "createOrder",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        }
      ],
      "name": "executeTrade",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        }
      ],
      "name": "getMatchResult",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "buyOrderId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "sellOrderId",
          "type": "uint256"
        },
        {
          "internalType": "euint256",
          "name": "tradeAmount",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "tradePrice",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "name": "getOrder",
      "outputs": [
        {
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "internalType": "enum SolsticeSwap.OrderStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "inputToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "outputToken",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "name": "getOrderEncryptedValues",
      "outputs": [
        {
          "internalType": "euint256",
          "name": "inputAmount",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "outputAmount",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "minPrice",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "maxPrice",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPendingBuyOrdersCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPendingSellOrdersCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "buyOrderId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "sellOrderId",
          "type": "uint256"
        }
      ],
      "name": "matchOrders",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "matchResults",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "buyOrderId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "sellOrderId",
          "type": "uint256"
        },
        {
          "internalType": "euint256",
          "name": "tradeAmount",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "tradePrice",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextMatchId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextOrderId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "orders",
      "outputs": [
        {
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "internalType": "euint256",
          "name": "inputAmount",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "outputAmount",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "minPrice",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "maxPrice",
          "type": "bytes32"
        },
        {
          "internalType": "enum SolsticeSwap.OrderType",
          "name": "orderType",
          "type": "uint8"
        },
        {
          "internalType": "enum SolsticeSwap.OrderStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "filledAmount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "inputToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "outputToken",
          "type": "address"
        },
        {
          "internalType": "euint256",
          "name": "totalAmount",
          "type": "bytes32"
        },
        {
          "internalType": "euint256",
          "name": "visibleAmount",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "revealInterval",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastRevealTime",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "pendingBuyOrders",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "pendingSellOrders",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        }
      ],
      "name": "revealNextChunk",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;

