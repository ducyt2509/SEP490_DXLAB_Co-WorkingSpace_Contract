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
    const DXLABCoin = await hre.ethers.getContractFactory('DXLABCoin');
    const dxlToken = await DXLABCoin.deploy();
    const dxlTx = await dxlToken.deploymentTransaction();
    await dxlToken.waitForDeployment();
    const dxlTokenAddress = await dxlToken.getAddress();
    console.log(`✅ DXLABCoin deployed to: ${dxlTokenAddress}`);
    console.log(`🔗 Transaction: ${explorerUrl}/tx/${dxlTx.hash}`);

    const Booking = await hre.ethers.getContractFactory(
      'Booking',
    );
    const booking = await Booking.deploy(dxlTokenAddress);
    const bookingTx = await booking.deploymentTransaction();
    await booking.waitForDeployment();
    const bookingAddress = await booking.getAddress();
    console.log(`✅ Booking deployed to: ${bookingAddress}`);
    console.log(`🔗 Transaction: ${explorerUrl}/tx/${bookingTx.hash}`);

    saveDeploymentDetails({
      network: networkName,
      contracts: {
        DXLABCoin: {
          address: dxlTokenAddress,
          explorer: `${explorerUrl}/address/${dxlTokenAddress}`,
          transaction: `${explorerUrl}/tx/${dxlTx.hash}`,
        },
        Booking: {
          address: bookingAddress,
          explorer: `${explorerUrl}/address/${bookingAddress}`,
          transaction: `${explorerUrl}/tx/${bookingTx.hash}`,
        },
      },
    });

    saveContractArtifacts('DXLABCoin');
    saveContractArtifacts('Booking');
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
