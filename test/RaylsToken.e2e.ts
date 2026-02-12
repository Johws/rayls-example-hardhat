import { expect } from "chai";
import { ethers } from "hardhat";
import { RaylsToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RaylsToken - Full Integration E2E", function () {

  let token: RaylsToken;
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
  });


  it("Should deploy correctly and assign initial supply to owner", async function () {
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.totalSupply()).to.equal(initialSupply);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  });


  it("Owner should mint tokens to User A and emit Transfer event", async function () {

    const tx = await token.mint(userA.address, mintAmount);

    await expect(tx)
      .to.emit(token, "Transfer")
      .withArgs(ethers.ZeroAddress, userA.address, mintAmount);

    expect(await token.balanceOf(userA.address)).to.equal(mintAmount);
    expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
  });

  it("Non-owner should not be able to mint", async function () {
    await expect(
      token.connect(userB).mint(userB.address, mintAmount)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
  });

  it("Should approve, transferFrom and emit events correctly", async function () {

    await expect(
      token.connect(userA).approve(userB.address, approveAmount)
    )
      .to.emit(token, "Approval")
      .withArgs(userA.address, userB.address, approveAmount);

    expect(
      await token.allowance(userA.address, userB.address)
    ).to.equal(approveAmount);

    await expect(
      token.connect(userB).transferFrom(
        userA.address,
        userB.address,
        approveAmount
      )
    )
      .to.emit(token, "Transfer")
      .withArgs(userA.address, userB.address, approveAmount);

    expect(await token.balanceOf(userB.address)).to.equal(approveAmount);
    expect(await token.balanceOf(userA.address)).to.equal(
      mintAmount - approveAmount
    );

    expect(
      await token.allowance(userA.address, userB.address)
    ).to.equal(0);
  });


  it("User B should burn tokens and reduce totalSupply", async function () {

    const totalBeforeBurn = await token.totalSupply();

    await expect(
      token.connect(userB).burn(burnAmount)
    )
      .to.emit(token, "Transfer")
      .withArgs(userB.address, ethers.ZeroAddress, burnAmount);

    const totalAfterBurn = await token.totalSupply();

    expect(totalAfterBurn).to.equal(totalBeforeBurn - burnAmount);
    expect(await token.balanceOf(userB.address)).to.equal(
      approveAmount - burnAmount
    );
  });

  it("Should estimate gas for mint operation", async function () {
    const estimatedGas = await token.mint.estimateGas(userA.address, 1n);
    expect(estimatedGas).to.be.gt(0);
  });

});
