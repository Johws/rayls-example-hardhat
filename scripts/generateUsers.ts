import { ethers } from "hardhat";

async function main() {
  const userA = ethers.Wallet.createRandom();
  const userB = ethers.Wallet.createRandom();

  console.log("User A address:", userA.address);
  console.log("User A private key:", userA.privateKey);

  console.log("User B address:", userB.address);
  console.log("User B private key:", userB.privateKey);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
