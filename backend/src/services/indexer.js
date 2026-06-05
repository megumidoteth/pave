const { ethers } = require("ethers");
const { query } = require("../db");
require("dotenv").config();

const INVOICE_REGISTRY_ABI = [
  "event InvoiceCreated(uint256 indexed id, address indexed seller, uint256 amountUSDC, uint256 dueDate, string invoiceRef)",
  "event InvoicePaid(uint256 indexed id, address indexed buyer, uint256 amountUSDC)",
  "event InvoiceCancelled(uint256 indexed id, address indexed seller)",
];

const PAYMENT_PROCESSOR_ABI = [
  "event InvoicePaid(uint256 indexed invoiceId, address indexed buyer, address indexed seller, uint256 totalAmount, uint256 feeAmount, uint256 sellerAmount)"
];

let provider;
let lastBlock = 0;

const processLogs = async () => {
  try {
    const currentBlock = await provider.getBlockNumber();

    if (lastBlock === 0) {
      lastBlock = currentBlock - 1;
    }

    if (currentBlock <= lastBlock) return;

    // Query InvoicePaid logs from PaymentProcessor
    const processorInterface = new ethers.Interface(PAYMENT_PROCESSOR_ABI);
    const paidTopic = processorInterface.getEvent("InvoicePaid").topicHash;

    const paidLogs = await provider.getLogs({
      address: process.env.PAYMENT_PROCESSOR_ADDRESS,
      topics: [paidTopic],
      fromBlock: lastBlock + 1,
      toBlock: currentBlock,
    });

    for (const log of paidLogs) {
      const parsed = processorInterface.parseLog(log);
      const invoiceId = parsed.args.invoiceId.toString();
      const buyer = parsed.args.buyer;

      console.log("InvoicePaid detected — Invoice ID:", invoiceId, "Buyer:", buyer);

      await query(
        `UPDATE invoices 
         SET status = 'paid', tx_hash = $1, paid_at = now()
         WHERE chain_invoice_id = $2`,
        [log.transactionHash, invoiceId]
      );

      console.log("Database updated for invoice:", invoiceId);
    }

    // Query InvoiceCancelled logs from InvoiceRegistry
    const registryInterface = new ethers.Interface(INVOICE_REGISTRY_ABI);
    const cancelledTopic = registryInterface.getEvent("InvoiceCancelled").topicHash;

    const cancelledLogs = await provider.getLogs({
      address: process.env.INVOICE_REGISTRY_ADDRESS,
      topics: [cancelledTopic],
      fromBlock: lastBlock + 1,
      toBlock: currentBlock,
    });

    for (const log of cancelledLogs) {
      const parsed = registryInterface.parseLog(log);
      const invoiceId = parsed.args.id.toString();

      console.log("InvoiceCancelled detected — Invoice ID:", invoiceId);

      await query(
        `UPDATE invoices SET status = 'cancelled' WHERE chain_invoice_id = $1`,
        [invoiceId]
      );
    }

    lastBlock = currentBlock;

  } catch (err) {
    console.error("Indexer polling error:", err.message);
  }
};

const startIndexer = async () => {
  try {
    console.log("Starting Arc event indexer...");

    provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
    const network = await provider.getNetwork();
    console.log("Connected to Arc — Chain ID:", network.chainId.toString());

    // Poll every 5 seconds
    setInterval(processLogs, 5000);

    console.log("Event indexer running — polling Arc every 5 seconds...");

  } catch (err) {
    console.error("Failed to start indexer:", err.message);
    console.log("Retrying in 10 seconds...");
    setTimeout(startIndexer, 10000);
  }
};

module.exports = { startIndexer };
