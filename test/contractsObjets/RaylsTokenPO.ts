import { RaylsToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

export class RaylsTokenPO {
  token: RaylsToken;

  constructor(token: RaylsToken) {
    this.token = token;
  }

  async balanceOf(address: string) {
    return this.token.balanceOf(address);
  }

  async totalSupply() {
    return this.token.totalSupply();
  }

  async allowance(owner: string, spender: string) {
    return this.token.allowance(owner, spender);
  }

  async owner() {
    return this.token.owner();
  }

  async mint(to: SignerWithAddress, amount: bigint) {
    return this.token.mint(to.address, amount);
  }

  async mintAs(from: SignerWithAddress, to: SignerWithAddress, amount: bigint) {
    return this.token.connect(from).mint(to.address, amount);
  }

  async burn(from: SignerWithAddress, amount: bigint) {
    return this.token.connect(from).burn(amount);
  }

  async approve(from: SignerWithAddress, spender: SignerWithAddress, amount: bigint) {
    return this.token.connect(from).approve(spender.address, amount);
  }

  async transferFrom(
    from: SignerWithAddress,
    to: SignerWithAddress,
    amount: bigint,
    sender: SignerWithAddress
  ) {
    return this.token.connect(sender).transferFrom(from.address, to.address, amount);
  }

  async estimateGasMint(to: SignerWithAddress, amount: bigint) {
    return this.token.mint.estimateGas(to.address, amount);
  }
}
