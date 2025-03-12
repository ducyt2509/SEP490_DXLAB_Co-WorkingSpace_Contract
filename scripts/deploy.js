const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy FPT Token
  const FPTCurrency = await ethers.getContractFactory("FPTCurrency");
  const fptToken = await FPTCurrency.deploy();
  await fptToken.waitForDeployment();
  const fptTokenAddress = await fptToken.getAddress();
  console.log("FPTCurrency deployed to:", fptTokenAddress);

  // Deploy Lab Booking System
  const LabBookingSystem = await ethers.getContractFactory("LabBookingSystem");
  const labBookingSystem = await LabBookingSystem.deploy(fptTokenAddress);
  await labBookingSystem.waitForDeployment();
  const labBookingSystemAddress = await labBookingSystem.getAddress();
  console.log("LabBookingSystem deployed to:", labBookingSystemAddress);

  // Mint some initial tokens for testing
  const initialMint = ethers.parseEther("1000"); // 1000 FPT tokens
  await fptToken.mint(deployer.address, initialMint);
  console.log("Minted", ethers.formatEther(initialMint), "FPT tokens to deployer");

  // Log deployment details for verification
  console.log("\nDeployment details:");
  console.log("--------------------");
  console.log("Network:", hre.network.name);
  console.log("FPT Token:", fptTokenAddress);
  console.log("Lab Booking System:", labBookingSystemAddress);
  console.log("Deployer:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
