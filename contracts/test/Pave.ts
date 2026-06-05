import { expect } from "chai";
import hre from "hardhat";

describe("Pave Contracts", function () {
  let owner: any;
  let seller: any;
  let buyer: any;
  let other: any;
  let usdc: any;
  let feeCollector: any;
  let registry: any;
  let processor: any;

  const ONE_USDC = 1_000_000n;
  const INVOICE_AMOUNT = 100n * ONE_USDC;
  const ONE_DAY = 86400n;

  beforeEach(async function () {
    [owner, seller, buyer, other] = await hre.ethers.getSigners();

    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const FeeCollector = await hre.ethers.getContractFactory("FeeCollector");
    feeCollector = await FeeCollector.deploy();

    const InvoiceRegistry = await hre.ethers.getContractFactory("InvoiceRegistry");
    registry = await InvoiceRegistry.deploy();

    const PaymentProcessor = await hre.ethers.getContractFactory("PaymentProcessor");
    processor = await PaymentProcessor.deploy(
      await usdc.getAddress(),
      await registry.getAddress(),
      await feeCollector.getAddress()
    );

    await usdc.mint(await buyer.getAddress(), 1000n * ONE_USDC);
  });

  describe("FeeCollector", function () {
    it("sets deployer as owner", async function () {
      expect(await feeCollector.owner()).to.equal(await owner.getAddress());
    });

    it("owner can withdraw fees", async function () {
      await usdc.mint(await feeCollector.getAddress(), 10n * ONE_USDC);
      await feeCollector.withdrawFees(
        await usdc.getAddress(),
        await owner.getAddress(),
        10n * ONE_USDC
      );
      expect(await usdc.balanceOf(await owner.getAddress())).to.equal(10n * ONE_USDC);
    });

    it("non-owner cannot withdraw fees", async function () {
      await usdc.mint(await feeCollector.getAddress(), 10n * ONE_USDC);
      await expect(
        feeCollector.connect(other).withdrawFees(
          await usdc.getAddress(),
          await other.getAddress(),
          10n * ONE_USDC
        )
      ).to.be.revertedWith("Not the owner");
    });

    it("owner can transfer ownership", async function () {
      await feeCollector.transferOwnership(await other.getAddress());
      expect(await feeCollector.owner()).to.equal(await other.getAddress());
    });
  });

  describe("InvoiceRegistry", function () {
    let dueDate: bigint;

    beforeEach(async function () {
      const block = await hre.ethers.provider.getBlock("latest");
      dueDate = BigInt(block!.timestamp) + ONE_DAY * 7n;
    });

    it("creates an invoice correctly", async function () {
      await registry.connect(seller).createInvoice(
        INVOICE_AMOUNT, dueDate, "INV-001"
      );
      const invoice = await registry.getInvoice(0);
      expect(invoice.seller).to.equal(await seller.getAddress());
      expect(invoice.amountUSDC).to.equal(INVOICE_AMOUNT);
      expect(invoice.status).to.equal(0);
    });

    it("rejects zero amount invoice", async function () {
      await expect(
        registry.connect(seller).createInvoice(0, dueDate, "INV-002")
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("rejects past due date", async function () {
      const pastDate = BigInt((await hre.ethers.provider.getBlock("latest"))!.timestamp) - ONE_DAY;
      await expect(
        registry.connect(seller).createInvoice(INVOICE_AMOUNT, pastDate, "INV-003")
      ).to.be.revertedWith("Due date must be in the future");
    });

    it("seller can cancel a pending invoice", async function () {
      await registry.connect(seller).createInvoice(INVOICE_AMOUNT, dueDate, "INV-004");
      await registry.connect(seller).cancelInvoice(0);
      const invoice = await registry.getInvoice(0);
      expect(invoice.status).to.equal(2);
    });

    it("non-seller cannot cancel invoice", async function () {
      await registry.connect(seller).createInvoice(INVOICE_AMOUNT, dueDate, "INV-005");
      await expect(
        registry.connect(other).cancelInvoice(0)
      ).to.be.revertedWith("Not the invoice seller");
    });

    it("returns all invoices for a seller", async function () {
      await registry.connect(seller).createInvoice(INVOICE_AMOUNT, dueDate, "INV-006");
      await registry.connect(seller).createInvoice(INVOICE_AMOUNT, dueDate, "INV-007");
      const invoiceIds = await registry.getInvoicesBySeller(await seller.getAddress());
      expect(invoiceIds.length).to.equal(2);
    });
  });

  describe("PaymentProcessor", function () {
    let dueDate: bigint;
    let invoiceId: bigint;

    beforeEach(async function () {
      const block = await hre.ethers.provider.getBlock("latest");
      dueDate = BigInt(block!.timestamp) + ONE_DAY * 7n;

      await registry.connect(seller).createInvoice(INVOICE_AMOUNT, dueDate, "INV-008");
      invoiceId = 0n;

      await registry.connect(seller).transferSellerRole(
        await processor.getAddress()
      );
    });

    it("processes a full payment correctly", async function () {
      await usdc.connect(buyer).approve(await processor.getAddress(), INVOICE_AMOUNT);
      await processor.connect(buyer).payInvoice(invoiceId);

      const feeAmount = (INVOICE_AMOUNT * 50n) / 10000n;
      const sellerAmount = INVOICE_AMOUNT - feeAmount;

      expect(await usdc.balanceOf(await seller.getAddress())).to.equal(sellerAmount);
      expect(await usdc.balanceOf(await feeCollector.getAddress())).to.equal(feeAmount);
    });

    it("rejects payment without approval", async function () {
      await expect(
        processor.connect(buyer).payInvoice(invoiceId)
      ).to.be.revertedWith("Insufficient USDC allowance");
    });

    it("seller cannot pay own invoice", async function () {
      await usdc.mint(await seller.getAddress(), INVOICE_AMOUNT);
      await usdc.connect(seller).approve(await processor.getAddress(), INVOICE_AMOUNT);
      await expect(
        processor.connect(seller).payInvoice(invoiceId)
      ).to.be.revertedWith("Seller cannot pay own invoice");
    });
  });
});
