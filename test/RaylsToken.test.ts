import { expect } from "chai";
import { ethers } from "hardhat";
import { RaylsToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RaylsToken", function () {
  let token: RaylsToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  const initialSupply = ethers.parseUnits("1000000", 18);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const RaylsToken = await ethers.getContractFactory("RaylsToken");
    token = await RaylsToken.deploy(initialSupply);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
     expect(await token.name()).to.equal("Rayls Test Token");
     expect(await token.symbol()).to.equal("RYLSTEST");
    });

    it("Should set the right decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseUnits("100", 18);

      await token.transfer(addr1.address, transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);

      await token.connect(addr1).transfer(addr2.address, transferAmount);
      expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      await expect(
        token.connect(addr1).transfer(owner.address, ethers.parseUnits("1", 18))
      ).to.be.reverted;
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      const transferAmount = ethers.parseUnits("100", 18);

      await token.transfer(addr1.address, transferAmount);
      await token.transfer(addr2.address, transferAmount);

      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - transferAmount * 2n);

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      await token.mint(addr1.address, mintAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const burnAmount = ethers.parseUnits("100", 18);
      const initialBalance = await token.balanceOf(owner.address);

      await token.burn(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
      expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
    });

    it("Should not allow burning more tokens than balance", async function () {
      const balance = await token.balanceOf(addr1.address);
      await expect(
        token.connect(addr1).burn(balance + 1n)
      ).to.be.reverted;
    });
  });

  describe("Approval and Allowance", function () {
    it("Should approve tokens for delegated transfer", async function () {
      const approveAmount = ethers.parseUnits("100", 18);

      await token.approve(addr1.address, approveAmount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });

    it("Should allow approved spender to transfer tokens", async function () {
      const approveAmount = ethers.parseUnits("100", 18);

      await token.approve(addr1.address, approveAmount);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount);

      expect(await token.balanceOf(addr2.address)).to.equal(approveAmount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should not allow transfer more than approved amount", async function () {
      const approveAmount = ethers.parseUnits("100", 18);

      await token.approve(addr1.address, approveAmount);
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount + 1n)
      ).to.be.reverted;
    });
  });
});
