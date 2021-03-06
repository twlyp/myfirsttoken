const { expect } = require("chai");
const { ethers } = require("hardhat");
const { toWei } = require("../scripts/utils");

describe("VolcanoCoin", () => {
  let VolcanoCoin, volcano, owner, admin, addr1;

  beforeEach(async () => {
    VolcanoCoin = await ethers.getContractFactory("VolcanoCoin");
    [owner, admin, addr1, ...addrs] = await ethers.getSigners();
    volcano = await VolcanoCoin.deploy(admin.address);
  });

  describe("deployment", () => {
    it("should set the correct admin", async function () {
      expect(
        await volcano.hasRole(
          ethers.constants.HashZero, // default admin role is hash zero
          admin.address
        )
      ).to.be.true;
    });

    it("should give the owner all the money", async () => {
      const ownerBalance = await volcano.balanceOf(owner.address);
      expect(await volcano.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("transfers", () => {
    it("should transfer tokens between accounts", async () => {
      await volcano.transfer(admin.address, toWei(100));
      await volcano.transfer(addr1.address, toWei(50));

      const adminBalance = await volcano.balanceOf(admin.address);
      expect(adminBalance).to.equal(toWei(100));

      const addr1Balance = await volcano.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(toWei(50));
    });

    it("should fail if sender doesn't have enough tokens", async () => {
      const ownerBalance = await volcano.balanceOf(owner.address);
      const addr1Balance = await volcano.balanceOf(addr1.address);

      await expect(
        volcano.connect(addr1).transfer(owner.address, toWei(1000))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await volcano.balanceOf(owner.address)).to.equal(ownerBalance);
      expect(await volcano.balanceOf(addr1.address)).to.equal(addr1Balance);
    });

    it("should update balances after transfer", async () => {
      const initialOwnerBalance = ethers.utils.formatEther(
        await volcano.balanceOf(owner.address)
      );

      await volcano.transfer(admin.address, toWei(100));
      await volcano.transfer(addr1.address, toWei(50));

      const finalOwnerBalance = await volcano.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(toWei(initialOwnerBalance - 150));

      const adminBalance = await volcano.balanceOf(admin.address);
      expect(adminBalance).to.equal(toWei(100));

      const addr1Balance = await volcano.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(toWei(50));
    });

    it("should record payments", async () => {
      await volcano.transfer(admin.address, toWei(100));

      const record = await volcano.paymentsFromId(0);
      expect(record.sender).to.equal(owner.address);

      const payment = await volcano.payments(owner.address, 0);
      expect(payment.amount).to.equal(toWei(100));
    });
  });

  describe("payments", () => {
    it("should allow users to update details on their own payments", async () => {
      await volcano.transfer(addr1.address, toWei(100));
      await volcano.connect(addr1).transfer(admin.address, toWei(50));

      const testComment = "my test comment";
      await volcano.connect(addr1).updateDetails(1, 2, testComment);
      const payment = await volcano.payments(addr1.address, 0);

      expect(payment.paymentType).to.equal(2);
      expect(payment.comment).to.equal(testComment);
    });

    it("should prevent users from updating other users' details", async () => {
      await volcano.transfer(addr1.address, toWei(100));

      await expect(
        volcano.connect(addr1).updateDetails(0, 2, "")
      ).to.be.revertedWith("this payment is not yours to edit");
    });

    it("should let admin edit any users' payments", async () => {
      await volcano.transfer(addr1.address, toWei(100));

      const testComment = "my test comment";
      await volcano.connect(admin).updateDetails(0, 2, testComment);
      const payment = await volcano.payments(owner.address, 0);

      expect(payment.paymentType).to.equal(2);
      expect(payment.comment).to.equal(testComment + " (updated by admin)");
    });
  });

  describe("other functionalities", () => {
    it("should allow owner to increase supply", async () => {
      const initialSupply = await volcano.totalSupply();
      await volcano.increaseSupply();

      expect(await volcano.totalSupply()).to.equal(initialSupply.mul(2));
    });

    it("shouldn't allow other users to increase supply", async () => {
      const initialSupply = await volcano.totalSupply();
      await expect(volcano.connect(admin).increaseSupply()).to.be.reverted;
      expect(await volcano.totalSupply()).to.equal(initialSupply);
    });
  });
});
