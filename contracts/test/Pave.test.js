const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pave Contracts", function () {
  let owner, seller, buyer, other;
  let usdc, feeCollector, registry, processor;

  const ONE_USDC = 1_000_000n;
  const INVOICE_AMOUNT = 100n * ONE_USDC;
  const ONE_DAY = 86400n;

  beforeEach(async function () {
    [owner, seller, buyer, other] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const FeeCollector = await ethers.getContractFactory("FeeCollector");
    feeCollector = await FeeCollector.deploy();

    const InvoiceRegistry = await ethers.getContractFactory("InvoiceRegistry");
    registry = await InvoiceRegistry.deploy();

    const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
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
    let dueDate;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock("latest");
      dueDate = BigInt(block.timestamp) + ONE_DAY * 7n;
    });

    it("creates an invoice correctly", async function () {
      await registry.connect(seller).createInvoice(INVOICE_AMOUNT, dueDate, "INV-001");
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
      const block = await ethers.provider.getBlock("latest");
      const pastDate = BigInt(block.timestamp) - ONE_DAY;
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
    let dueDate;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock("latest");
      dueDate = BigInt(block.timestamp) + ONE_DAY * 7n;
      await registry.connect(seller).createInvoice(INVOICE_AMOUNT, dueDate, "INV-008");
    });

    it("processes a full payment correctly", async function () {
      await usdc.connect(buyer).approve(await processor.getAddress(), INVOICE_AMOUNT);
      await processor.connect(buyer).payInvoice(0);

      const feeAmount = (INVOICE_AMOUNT * 50n) / 10000n;
      const sellerAmount = INVOICE_AMOUNT - feeAmount;

      expect(await usdc.balanceOf(await seller.getAddress())).to.equal(sellerAmount);
      expect(await usdc.balanceOf(await feeCollector.getAddress())).to.equal(feeAmount);
    });

    it("rejects payment without approval", async function () {
      await expect(
        processor.connect(buyer).payInvoice(0)
      ).to.be.revertedWith("Insufficient USDC allowance");
    });

    it("seller cannot pay own invoice", async function () {
      await usdc.mint(await seller.getAddress(), INVOICE_AMOUNT);
      await usdc.connect(seller).approve(await processor.getAddress(), INVOICE_AMOUNT);
      await expect(
        processor.connect(seller).payInvoice(0)
      ).to.be.revertedWith("Seller cannot pay own invoice");
    });
  });
});
