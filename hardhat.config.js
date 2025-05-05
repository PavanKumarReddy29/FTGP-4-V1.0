require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/264e677137d94f59a502d4b3e6066f3b",
      accounts: [process.env.PRIVATE_KEY || "2e1f42d17fa152532469948f2909fce8da38097670c1b669f02f29184a98c2e3"],
    },
  },
};