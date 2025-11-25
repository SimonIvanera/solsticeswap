//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAY USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE 
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider, Contract } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  console.log("[fhevmMockCreateInstance] Creating mock FHEVM instance...");
  
  const provider = new JsonRpcProvider(parameters.rpcUrl);
  
  // Query InputVerifier contract's EIP712 domain for proper configuration
  const inputVerifierContract = new Contract(
    parameters.metadata.InputVerifierAddress,
    ["function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])"],
    provider
  );
  
  let verifyingContractAddressInputVerification = parameters.metadata.InputVerifierAddress;
  let domainChainId = parameters.chainId;
  
  try {
    const domain = await inputVerifierContract.eip712Domain();
    verifyingContractAddressInputVerification = domain[4]; // index 4 is verifyingContract
    domainChainId = Number(domain[3]); // index 3 is chainId
    console.log("[fhevmMockCreateInstance] InputVerifier EIP712 domain chainId:", domainChainId);
    console.log("[fhevmMockCreateInstance] InputVerifier EIP712 verifyingContract:", verifyingContractAddressInputVerification);
  } catch (error) {
    console.warn("[fhevmMockCreateInstance] Failed to query EIP712 domain, using defaults:", error);
  }
  
  const instance = await MockFhevmInstance.create(
    provider,
    provider,
    {
      aclContractAddress: parameters.metadata.ACLAddress,
      chainId: parameters.chainId,
      gatewayChainId: domainChainId,
      inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
      kmsContractAddress: parameters.metadata.KMSVerifierAddress,
      verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
      verifyingContractAddressInputVerification,
    },
    {
      // v0.3.0 requires 4th parameter: properties
      inputVerifierProperties: {},
      kmsVerifierProperties: {},
    }
  );
  
  console.log("[fhevmMockCreateInstance] ✅ Mock FHEVM instance created successfully");
  
  return instance as unknown as FhevmInstance;
};


