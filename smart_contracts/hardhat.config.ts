import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config(); // replaces require("ts-node/register")

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    polygonMumbai: {
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts: [
        // Add your private key here when deploying
        // process.env.PRIVATE_KEY
      ],
      chainId: 80001,
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: "YOUR_POLYGONSCAN_API_KEY",
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
