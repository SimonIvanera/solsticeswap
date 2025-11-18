import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SolsticeSwap, SolsticeSwap__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

// Mock token addresses for testing
// These addresses are used for testing order creation and matching
const MOCK_TOKEN_A = "0x1111111111111111111111111111111111111111";
const MOCK_TOKEN_B = "0x2222222222222222222222222222222222222222";

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SolsticeSwap")) as SolsticeSwap__factory;
  const solsticeSwap = (await factory.deploy()) as SolsticeSwap;
  const solsticeSwapAddress = await solsticeSwap.getAddress();

  return { solsticeSwap, solsticeSwapAddress };
}

describe("SolsticeSwap", function () {
  let signers: Signers;
  let solsticeSwap: SolsticeSwap;
  let solsticeSwapAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ solsticeSwap, solsticeSwapAddress } = await deployFixture());
  });

  describe("Order Creation", function () {
    it("should create a limit order", async function () {
      const inputAmount = 100;
      const outputAmount = 200;
      const minPrice = 2;
      const maxPrice = 3;

      // Create encrypted inputs
      const encryptedInput = await fhevm
        .createEncryptedInput(solsticeSwapAddress, signers.alice.address)
        .add256(inputAmount)
        .add256(outputAmount)
        .add256(minPrice)
        .add256(maxPrice)
        .encrypt();

      const tx = await solsticeSwap
        .connect(signers.alice)
        .createOrder(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.handles[3],
          0, // OrderType.Limit
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          MOCK_TOKEN_A,
          MOCK_TOKEN_B
        );

      await tx.wait();

      const orderId = 1;
      const order = await solsticeSwap.getOrder(orderId);

      expect(order.creator).to.eq(signers.alice.address);
      expect(order.status).to.eq(0); // OrderStatus.Pending
      expect(order.inputToken).to.eq(MOCK_TOKEN_A);
      expect(order.outputToken).to.eq(MOCK_TOKEN_B);
    });

    it("should create an iceberg order", async function () {
      const totalAmount = 1000;
      const visibleAmount = 100;
      const outputAmount = 2000;
      const minPrice = 2;
      const maxPrice = 3;

      // Create encrypted inputs
      const encryptedInput = await fhevm
        .createEncryptedInput(solsticeSwapAddress, signers.alice.address)
        .add256(totalAmount)
        .add256(visibleAmount)
        .add256(outputAmount)
        .add256(minPrice)
        .add256(maxPrice)
        .encrypt();

      const revealInterval = 3600; // 1 hour

      const tx = await solsticeSwap
        .connect(signers.alice)
        .createIcebergOrder(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.handles[3],
          encryptedInput.handles[4],
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          MOCK_TOKEN_A,
          MOCK_TOKEN_B,
          revealInterval
        );

      await tx.wait();

      const orderId = 1;
      const order = await solsticeSwap.getOrder(orderId);

      expect(order.creator).to.eq(signers.alice.address);
      expect(order.status).to.eq(0); // OrderStatus.Pending
    });
  });

  describe("Order Matching", function () {
    it("should match two orders", async function () {
      // Alice creates a buy order
      const aliceInputAmount = 100;
      const aliceOutputAmount = 200;
      const aliceMinPrice = 2;
      const aliceMaxPrice = 3;

      const aliceEncrypted = await fhevm
        .createEncryptedInput(solsticeSwapAddress, signers.alice.address)
        .add256(aliceInputAmount)
        .add256(aliceOutputAmount)
        .add256(aliceMinPrice)
        .add256(aliceMaxPrice)
        .encrypt();

      await solsticeSwap
        .connect(signers.alice)
        .createOrder(
          aliceEncrypted.handles[0],
          aliceEncrypted.handles[1],
          aliceEncrypted.handles[2],
          aliceEncrypted.handles[3],
          0, // OrderType.Limit
          aliceEncrypted.inputProof,
          aliceEncrypted.inputProof,
          aliceEncrypted.inputProof,
          aliceEncrypted.inputProof,
          MOCK_TOKEN_A,
          MOCK_TOKEN_B
        );

      // Bob creates a sell order
      const bobInputAmount = 200;
      const bobOutputAmount = 100;
      const bobMinPrice = 1;
      const bobMaxPrice = 2;

      const bobEncrypted = await fhevm
        .createEncryptedInput(solsticeSwapAddress, signers.bob.address)
        .add256(bobInputAmount)
        .add256(bobOutputAmount)
        .add256(bobMinPrice)
        .add256(bobMaxPrice)
        .encrypt();

      const tx2 = await solsticeSwap
        .connect(signers.bob)
        .createOrder(
          bobEncrypted.handles[0],
          bobEncrypted.handles[1],
          bobEncrypted.handles[2],
          bobEncrypted.handles[3],
          0, // OrderType.Limit
          bobEncrypted.inputProof,
          bobEncrypted.inputProof,
          bobEncrypted.inputProof,
          bobEncrypted.inputProof,
          MOCK_TOKEN_B,
          MOCK_TOKEN_A
        );

      await tx2.wait();

      // Match orders
      const tx3 = await solsticeSwap
        .connect(signers.deployer)
        .matchOrders(1, 2);

      await tx3.wait();

      const matchId = 1;
      const matchResult = await solsticeSwap.getMatchResult(matchId);

      expect(matchResult.buyOrderId).to.eq(1);
      expect(matchResult.sellOrderId).to.eq(2);
      expect(matchResult.timestamp).to.be.gt(0);
    });
  });

  describe("Order Cancellation", function () {
    it("should cancel a pending order", async function () {
      // Create an order
      const inputAmount = 100;
      const outputAmount = 200;
      const minPrice = 2;
      const maxPrice = 3;

      const encryptedInput = await fhevm
        .createEncryptedInput(solsticeSwapAddress, signers.alice.address)
        .add256(inputAmount)
        .add256(outputAmount)
        .add256(minPrice)
        .add256(maxPrice)
        .encrypt();

      await solsticeSwap
        .connect(signers.alice)
        .createOrder(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.handles[3],
          0, // OrderType.Limit
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          MOCK_TOKEN_A,
          MOCK_TOKEN_B
        );

      // Cancel the order
      const tx = await solsticeSwap
        .connect(signers.alice)
        .cancelOrder(1);

      await tx.wait();

      const order = await solsticeSwap.getOrder(1);
      expect(order.status).to.eq(3); // OrderStatus.Cancelled
    });

    it("should not allow non-creator to cancel order", async function () {
      // Create an order
      const inputAmount = 100;
      const outputAmount = 200;
      const minPrice = 2;
      const maxPrice = 3;

      const encryptedInput = await fhevm
        .createEncryptedInput(solsticeSwapAddress, signers.alice.address)
        .add256(inputAmount)
        .add256(outputAmount)
        .add256(minPrice)
        .add256(maxPrice)
        .encrypt();

      await solsticeSwap
        .connect(signers.alice)
        .createOrder(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.handles[3],
          0, // OrderType.Limit
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          MOCK_TOKEN_A,
          MOCK_TOKEN_B
        );

      // Try to cancel as Bob (should fail)
      await expect(
        solsticeSwap.connect(signers.bob).cancelOrder(1)
      ).to.be.revertedWith("Not order creator");
    });
  });

  describe("Iceberg Order", function () {
    it("should reveal next chunk after interval", async function () {
      const totalAmount = 1000;
      const visibleAmount = 100;
      const outputAmount = 2000;
      const minPrice = 2;
      const maxPrice = 3;

      const encryptedInput = await fhevm
        .createEncryptedInput(solsticeSwapAddress, signers.alice.address)
        .add256(totalAmount)
        .add256(visibleAmount)
        .add256(outputAmount)
        .add256(minPrice)
        .add256(maxPrice)
        .encrypt();

      const revealInterval = 1; // 1 second for testing

      await solsticeSwap
        .connect(signers.alice)
        .createIcebergOrder(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.handles[3],
          encryptedInput.handles[4],
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          encryptedInput.inputProof,
          MOCK_TOKEN_A,
          MOCK_TOKEN_B,
          revealInterval
        );

      // Wait for interval
      await ethers.provider.send("evm_increaseTime", [revealInterval + 1]);
      await ethers.provider.send("evm_mine", []);

      // Reveal next chunk
      const tx = await solsticeSwap
        .connect(signers.alice)
        .revealNextChunk(1);

      await tx.wait();

      // Order should still be pending
      const order = await solsticeSwap.getOrder(1);
      expect(order.status).to.eq(0); // OrderStatus.Pending
    });
  });
});


