const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lab Booking System", function () {
  let FPTCurrency, LabBookingSystem;
  let fptToken, labBookingSystem;
  let owner, staff, student1, student2;
  const SLOT_PRICE = ethers.parseEther("5"); // 5 FPT
  const PENALTY_AMOUNT = ethers.parseEther("10"); // 10 FPT

  beforeEach(async function () {
    [owner, staff, student1, student2] = await ethers.getSigners();

    // Deploy FPT Token
    FPTCurrency = await ethers.getContractFactory("FPTCurrency");
    fptToken = await FPTCurrency.deploy();
    await fptToken.waitForDeployment();

    // Deploy Lab Booking System
    LabBookingSystem = await ethers.getContractFactory("LabBookingSystem");
    labBookingSystem = await LabBookingSystem.deploy(await fptToken.getAddress());
    await labBookingSystem.waitForDeployment();

    // Mint tokens for testing
    await fptToken.mint(student1.address, ethers.parseEther("100"));
    await fptToken.mint(student2.address, ethers.parseEther("100"));

    // Approve token spending
    await fptToken.connect(student1).approve(await labBookingSystem.getAddress(), ethers.parseEther("100"));
    await fptToken.connect(student2).approve(await labBookingSystem.getAddress(), ethers.parseEther("100"));

    // Register users
    await labBookingSystem.connect(owner).registerUser(staff.address, "staff@fpt.edu.vn", true);
    await labBookingSystem.connect(staff).registerUser(student1.address, "student1@fpt.edu.vn", false);
    await labBookingSystem.connect(staff).registerUser(student2.address, "student2@fpt.edu.vn", false);
  });

  describe("User Management", function () {
    it("Should register a new user correctly", async function () {
      const newStudent = (await ethers.getSigners())[4];
      await labBookingSystem.connect(staff).registerUser(newStudent.address, "newstudent@fpt.edu.vn", false);
      const user = await labBookingSystem.users(newStudent.address);
      expect(user.isRegistered).to.be.true;
      expect(user.isStaff).to.be.false;
    });

    it("Should not allow non-staff to register users", async function () {
      const newStudent = (await ethers.getSigners())[4];
      await expect(
        labBookingSystem.connect(student1).registerUser(newStudent.address, "newstudent@fpt.edu.vn", false)
      ).to.be.revertedWith("Only staff can perform this action");
    });
  });

  describe("Booking Management", function () {
    it("Should create a booking successfully", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const bookingTime = currentTime + 3600; // 1 hour from now
      const roomId = "LAB001";
      const slot = 1;

      await labBookingSystem.connect(student1).book(roomId, slot, bookingTime);

      const bookingId = await labBookingSystem.generateBookingId(roomId, slot, bookingTime);
      const booking = await labBookingSystem.bookings(bookingId);

      expect(booking.roomId).to.equal(roomId);
      expect(booking.slot).to.equal(slot);
      expect(booking.user).to.equal(student1.address);
      expect(booking.price).to.equal(SLOT_PRICE);
    });

    it("Should not allow booking past slots", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      await expect(
        labBookingSystem.connect(student1).book("LAB001", 1, pastTime)
      ).to.be.revertedWith("Cannot book in the past");
    });

    it("Should not allow booking already booked slots", async function () {
      const bookingTime = Math.floor(Date.now() / 1000) + 3600;
      await labBookingSystem.connect(student1).book("LAB001", 1, bookingTime);

      await expect(
        labBookingSystem.connect(student2).book("LAB001", 1, bookingTime)
      ).to.be.revertedWith("Slot already booked");
    });
  });

  describe("Cancellation and Refunds", function () {
    let bookingId;
    const roomId = "LAB001";
    const slot = 1;

    beforeEach(async function () {
      const bookingTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      await labBookingSystem.connect(student1).book(roomId, slot, bookingTime);
      bookingId = await labBookingSystem.generateBookingId(roomId, slot, bookingTime);
    });

    it("Should refund 100% if cancelled 1 hour before", async function () {
      const initialBalance = await fptToken.balanceOf(student1.address);
      await labBookingSystem.connect(student1).cancelBooking(bookingId);
      const finalBalance = await fptToken.balanceOf(student1.address);
      expect(finalBalance - initialBalance).to.equal(SLOT_PRICE);
    });

    it("Should block user after 3 consecutive cancellations", async function () {
      const bookingTime2 = Math.floor(Date.now() / 1000) + 7200;
      const bookingTime3 = Math.floor(Date.now() / 1000) + 7300;

      await labBookingSystem.connect(student1).book(roomId, 2, bookingTime2);
      await labBookingSystem.connect(student1).book(roomId, 3, bookingTime3);

      const bookingId1 = await labBookingSystem.generateBookingId(roomId, 1, bookingTime2);
      const bookingId2 = await labBookingSystem.generateBookingId(roomId, 2, bookingTime2);
      const bookingId3 = await labBookingSystem.generateBookingId(roomId, 3, bookingTime3);

      await labBookingSystem.connect(student1).cancelBooking(bookingId1);
      await labBookingSystem.connect(student1).cancelBooking(bookingId2);
      await labBookingSystem.connect(student1).cancelBooking(bookingId3);

      const user = await labBookingSystem.users(student1.address);
      expect(user.consecutiveCancellations).to.equal(3);

      const newBookingTime = Math.floor(Date.now() / 1000) + 7400;
      await expect(
        labBookingSystem.connect(student1).book(roomId, 4, newBookingTime)
      ).to.be.revertedWith("User is blocked");
    });
  });

  describe("Check-in System", function () {
    let bookingId;
    const roomId = "LAB001";
    const slot = 1;

    beforeEach(async function () {
      const bookingTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
      await labBookingSystem.connect(student1).book(roomId, slot, bookingTime);
      bookingId = await labBookingSystem.generateBookingId(roomId, slot, bookingTime);
    });

    it("Should allow check-in within the window", async function () {
      await labBookingSystem.connect(student1).checkIn(bookingId);
      const booking = await labBookingSystem.bookings(bookingId);
      expect(booking.checkedIn).to.be.true;
    });

    it("Should reset consecutive cancellations after successful check-in", async function () {
      await labBookingSystem.connect(student1).checkIn(bookingId);
      const user = await labBookingSystem.users(student1.address);
      expect(user.consecutiveCancellations).to.equal(0);
    });
  });

  describe("Account Reactivation", function () {
    it("Should allow reactivation with penalty payment", async function () {
      // Block the user first
      const bookingTime = Math.floor(Date.now() / 1000) + 7200;
      for(let i = 1; i <= 3; i++) {
        await labBookingSystem.connect(student1).book(roomId, i, bookingTime + i*100);
        const bookingId = await labBookingSystem.generateBookingId(roomId, i, bookingTime + i*100);
        await labBookingSystem.connect(student1).cancelBooking(bookingId);
      }

      // Try to reactivate
      await fptToken.connect(student1).approve(await labBookingSystem.getAddress(), PENALTY_AMOUNT);
      await labBookingSystem.connect(student1).reactivateAccount();

      const user = await labBookingSystem.users(student1.address);
      expect(user.blockEndTime).to.lte(Math.floor(Date.now() / 1000));
      expect(user.consecutiveCancellations).to.equal(0);
    });
  });
});
