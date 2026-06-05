const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with wallet:", deployer.address);
  console.log("Wallet balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Step 1 — Deploy FeeCollector
  console.log("\n1. Deploying FeeCollector...");
  const FeeCollector = await hre.ethers.getContractFactory("FeeCollector");
  const feeCollector = await FeeCollector.deploy();
  await feeCollector.waitForDeployment();
  const feeCollectorAddress = await feeCollector.getAddress();
  console.log("FeeCollector deployed to:", feeCollectorAddress);

  // Step 2 — Deploy InvoiceRegistry
  console.log("\n2. Deploying InvoiceRegistry...");
  const InvoiceRegistry = await hre.ethers.getContractFactory("InvoiceRegistry");
  const registry = await InvoiceRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("InvoiceRegistry deployed to:", registryAddress);

  // Step 3 — Deploy PaymentProcessor
  // Official Arc Testnet USDC ERC-20 interface address
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

  console.log("\n3. Deploying PaymentProcessor...");
  const PaymentProcessor = await hre.ethers.getContractFactory("PaymentProcessor");
  const processor = await PaymentProcessor.deploy(
    USDC_ADDRESS,
    registryAddress,
    feeCollectorAddress
  );
  await processor.waitForDeployment();
  const processorAddress = await processor.getAddress();
  console.log("PaymentProcessor deployed to:", processorAddress);

  // Summary
  console.log("\n=============================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("=============================");
  console.log("FeeCollector:      ", feeCollectorAddress);
  console.log("InvoiceRegistry:   ", registryAddress);
  console.log("PaymentProcessor:  ", processorAddress);
  console.log("USDC:              ", USDC_ADDRESS);
  console.log("=============================");
  console.log("Save these addresses — you will need them for the backend and frontend.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
