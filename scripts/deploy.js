const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

require('@nomicfoundation/hardhat-toolbox');

async function main() {
  if (hre.network.name === 'hardhat') {
    console.warn(
      'You are deploying to the Hardhat Network, which resets on every run. Use "--network localhost" for persistence.',
    );
  }

  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  const explorerUrl = getExplorerUrl(networkName);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInEth = hre.ethers.formatEther(balance);
  console.log(`💰 Deployer balance: ${balanceInEth} ETH`);

  if (balance < hre.ethers.parseEther('0.05')) {
    console.error(
      '❌ Not enough balance! You need at least 0.05 ETH to deploy.',
    );
    return;
  }

  console.log('🚀 Deploying contracts with account:', deployer.address);

  try {
    const FPTCurrency = await hre.ethers.getContractFactory('FPTCurrency');
    const fptToken = await FPTCurrency.deploy();
    const fptTx = await fptToken.deploymentTransaction();
    await fptToken.waitForDeployment();
    const fptTokenAddress = await fptToken.getAddress();
    console.log(`✅ FPTCurrency deployed to: ${fptTokenAddress}`);
    console.log(`🔗 Transaction: ${explorerUrl}/tx/${fptTx.hash}`);

    const LabBookingSystem = await hre.ethers.getContractFactory(
      'LabBookingSystem',
    );
    const labBookingSystem = await LabBookingSystem.deploy(fptTokenAddress);
    const labBookingTx = await labBookingSystem.deploymentTransaction();
    await labBookingSystem.waitForDeployment();
    const labBookingSystemAddress = await labBookingSystem.getAddress();
    console.log(`✅ LabBookingSystem deployed to: ${labBookingSystemAddress}`);
    console.log(`🔗 Transaction: ${explorerUrl}/tx/${labBookingTx.hash}`);

    saveDeploymentDetails({
      network: networkName,
      contracts: {
        FPTCurrency: {
          address: fptTokenAddress,
          explorer: `${explorerUrl}/address/${fptTokenAddress}`,
          transaction: `${explorerUrl}/tx/${fptTx.hash}`,
        },
        LabBookingSystem: {
          address: labBookingSystemAddress,
          explorer: `${explorerUrl}/address/${labBookingSystemAddress}`,
          transaction: `${explorerUrl}/tx/${labBookingTx.hash}`,
        },
      },
    });

    saveContractArtifacts('FPTCurrency');
    saveContractArtifacts('LabBookingSystem');
  } catch (error) {
    console.error('[ERROR]:', error);
  }
}

function saveDeploymentDetails(data) {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, 'deploydetails.json');

  let existingData = {};
  if (fs.existsSync(filePath)) {
    existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  existingData[data.network] = data.contracts;

  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

  console.log(`📁 Deployment details saved to: ${filePath}`);
}

function saveContractArtifacts(contractName) {
  const artifactsDir = path.join(__dirname, '..', 'deployments', 'contracts');

  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const artifact = hre.artifacts.readArtifactSync(contractName);
  const artifactPath = path.join(artifactsDir, `${contractName}.json`);

  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));

  console.log(
    `📁 Full contract artifact saved for ${contractName} at: ${artifactPath}`,
  );
}

function getExplorerUrl(network) {
  const explorers = {
    sepolia: 'https://sepolia.etherscan.io',
    lineaSepolia: 'https://sepolia.lineascan.build',
    bnb: 'https://testnet.bscscan.com',
    bnbv2: 'https://testnet.bscscan.com',
  };
  return explorers[network] || 'https://etherscan.io';
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
