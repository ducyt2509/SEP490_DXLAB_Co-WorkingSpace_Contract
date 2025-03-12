require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      // Local network config
    },
    // Only include Sepolia if credentials are provided
    ...(process.env.PRIVATE_KEY && process.env.SEPOLIA_RPC_URL ? {
      sepolia: {
        url: SEPOLIA_RPC_URL,
        accounts: [SEPOLIA_PRIVATE_KEY],
      }
    } : {})
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
  }
};
