import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

let owner: SignerWithAddress;
let userA: SignerWithAddress;
let userB: SignerWithAddress;

describe("Check Addresses", function () {

    before(async () => {
        // Criando signers a partir das private keys do .env
        owner = new ethers.Wallet(process.env.PRIVATE_KEY_OWNER!, ethers.provider) as unknown as SignerWithAddress;
        userA = new ethers.Wallet(process.env.PRIVATE_KEY_USER_A!, ethers.provider) as unknown as SignerWithAddress;
        userB = new ethers.Wallet(process.env.PRIVATE_KEY_USER_B!, ethers.provider) as unknown as SignerWithAddress;
    });

    it("should show the addresses", async function () {
        // Apenas para garantir que o teste roda
        console.log("Owner (from test):", owner.address);
        console.log("User A (from test):", userA.address);
        console.log("User B (from test):", userB.address);
    });

});
