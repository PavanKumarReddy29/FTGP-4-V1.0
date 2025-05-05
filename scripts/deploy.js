const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const FTGPtokenFactory = await hre.ethers.getContractFactory("FTGPtoken");
  const ftgpToken = await FTGPtokenFactory.deploy();

  await ftgpToken.waitForDeployment(); // Use for Hardhat v6+
  const deployedAddress = ftgpToken.target; // Use .target in Hardhat v6+

  console.log("FTGPtoken deployed to:", deployedAddress);

  // === Export ABI to lib/abi.json ===
  const contractPath = path.join(__dirname, "../artifacts/contracts/FTGPtoken.sol/FTGPtoken.json");
  const abiPath = path.join(__dirname, "../lib/abi.json");

  const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  fs.writeFileSync(abiPath, JSON.stringify(contractJson.abi, null, 2));
  console.log("ABI exported to lib/abi.json");

  // === Optionally export contract address too ===
  const addressPath = path.join(__dirname, "../lib/contractAddress.js");
  fs.writeFileSync(
    addressPath,
    `export const FTGP_ADDRESS = "${deployedAddress}";\n`
  );
  console.log("Contract address saved to lib/contractAddress.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
