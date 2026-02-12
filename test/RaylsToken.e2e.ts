import { expect } from "chai";
import { ethers } from "hardhat";
import { RaylsToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { RaylsTokenPO } from "./contractsObjets/RaylsTokenPO";

describe("RaylsToken - Full Integration E2E", function () {

  let token: RaylsToken;
  let po: RaylsTokenPO;
  let owner: SignerWithAddress;
  let userA: SignerWithAddress;
  let userB: SignerWithAddress;

  const initialSupply = ethers.parseUnits("1000000", 18);
  const mintAmount = ethers.parseUnits("1000", 18);
  const approveAmount = ethers.parseUnits("400", 18);
  const burnAmount = ethers.parseUnits("100", 18);

  before(async function () {
    [owner, userA, userB] = await ethers.getSigners();

    const fundAmount = ethers.parseEther("1");
    await owner.sendTransaction({ to: userA.address, value: fundAmount });
    await owner.sendTransaction({ to: userB.address, value: fundAmount });

    const RaylsTokenFactory = await ethers.getContractFactory("RaylsToken");
    token = await RaylsTokenFactory.deploy(initialSupply);
    await token.waitForDeployment();

    po = new RaylsTokenPO(token);
  });


  it("Should deploy correctly and assign initial supply to owner", async function () {
    expect(await po.owner()).to.equal(owner.address);
    expect(await po.totalSupply()).to.equal(initialSupply);
    expect(await po.balanceOf(owner.address)).to.equal(initialSupply);
  });


  it("Owner should mint tokens to User A and emit Transfer event", async function () {
    const tx = await po.mint(userA, mintAmount);
    await expect(tx)
      .to.emit(token, "Transfer")
      .withArgs(ethers.ZeroAddress, userA.address, mintAmount);

    expect(await po.balanceOf(userA.address)).to.equal(mintAmount);
    expect(await po.totalSupply()).to.equal(initialSupply + mintAmount);
  });

  it("Non-owner should not be able to mint", async function () {
    await expect(
      po.mintAs(userB, userB, mintAmount)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
  });

  it("Should approve, transferFrom and emit events correctly", async function () {
    await expect(po.approve(userA, userB, approveAmount))
      .to.emit(token, "Approval")
      .withArgs(userA.address, userB.address, approveAmount);

    expect(await po.allowance(userA.address, userB.address)).to.equal(approveAmount);

    await expect(po.transferFrom(userA, userB, approveAmount, userB))
      .to.emit(token, "Transfer")
      .withArgs(userA.address, userB.address, approveAmount);

    expect(await po.balanceOf(userB.address)).to.equal(approveAmount);
    expect(await po.balanceOf(userA.address)).to.equal(mintAmount - approveAmount);
    expect(await po.allowance(userA.address, userB.address)).to.equal(0);
    expect(await po.totalSupply()).to.equal(initialSupply + mintAmount);
  });

  it("User B should burn tokens and reduce totalSupply", async function () {
    const totalBeforeBurn = await po.totalSupply();
    await expect(po.burn(userB, burnAmount))
      .to.emit(token, "Transfer")
      .withArgs(userB.address, ethers.ZeroAddress, burnAmount);

    const totalAfterBurn = await po.totalSupply();
    expect(totalAfterBurn).to.equal(totalBeforeBurn - burnAmount);
    expect(await po.balanceOf(userB.address)).to.equal(approveAmount - burnAmount);
  });

  it("Should estimate gas for mint operation", async function () {
    const estimatedGas = await po.estimateGasMint(userA, 1n);
    expect(estimatedGas).to.be.gt(0);
  });
  
});
