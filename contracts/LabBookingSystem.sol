// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./FPTCurrency.sol";

contract LabBookingSystem is Ownable, ReentrancyGuard {
    FPTCurrency public fptToken;
    uint256 public constant SLOT_PRICE = 5 * 10 ** 18; // 5 FPT tokens
    uint256 public constant MAX_SLOTS = 5;
    uint256 public constant PENALTY_AMOUNT = 10 * 10 ** 18; // 10 FPT for reactivation
    uint256 public constant CHECK_IN = 15 minutes;

    struct User {
        bool isRegistered;
        bool isStaff;
        uint256 consecutiveCancellations;
        uint256 blockEndTime;
        string email;
    }

    struct Booking {
        string roomId;
        uint8 slot;
        address user;
        uint256 price;
        uint256 time;
        bool checkedIn;
        bool checkedOut;
        bool cancelled;
    }

    mapping(address => User) public users;
    mapping(bytes32 => Booking) public bookings;
    mapping(bytes32 => bool) public roomSlotBooked; // roomId + date + slot => booked status

    event UserRegistered(address indexed user, string email, bool isStaff);
    event BookingCreated(
        bytes32 indexed bookingId,
        string roomId,
        uint8 slot,
        address user,
        uint256 time
    );
    event BookingCancelled(bytes32 indexed bookingId, uint256 refundAmount);
    event BookingCheckedIn(bytes32 indexed bookingId);
    event BookingCheckedOut(bytes32 indexed bookingId);
    event UserBlocked(address indexed user);
    event UserUnblocked(address indexed user);
    event TokensDeposited(address indexed user, uint256 amount);
    event TokensWithdrawn(address indexed user, uint256 amount);

    modifier onlyStaff() {
        require(
            msg.sender == owner() || users[msg.sender].isStaff,
            "Only staff can perform this action"
        );
        _;
    }

    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }

    modifier notBlocked() {
        require(
            block.timestamp >= users[msg.sender].blockEndTime,
            "User is blocked"
        );
        _;
    }

    constructor(address _fptToken) Ownable(msg.sender) {
        fptToken = FPTCurrency(_fptToken);
    }

    function registerUser(
        address userAddress,
        string memory email,
        bool isStaff
    ) external onlyStaff {
        require(!users[userAddress].isRegistered, "User already registered");
        users[userAddress] = User(true, isStaff, 0, 0, email);
        emit UserRegistered(userAddress, email, isStaff);
    }

    function generateBookingId(
        string memory roomId,
        uint8 slot,
        uint256 time
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(roomId, slot, time));
    }

    function generateRoomSlotId(
        string memory roomId,
        uint8 slot,
        uint256 date
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(roomId, slot, date));
    }

    function book(
        string memory roomId,
        uint8 slot,
        uint256 time
    ) external onlyRegistered notBlocked nonReentrant {
        require(slot > 0 && slot <= MAX_SLOTS, "Invalid slot number");
        require(time > block.timestamp, "Cannot book in the past");

        bytes32 bookingId = generateBookingId(roomId, slot, time);
        bytes32 roomSlotId = generateRoomSlotId(roomId, slot, time);

        require(!roomSlotBooked[roomSlotId], "Slot already booked");
        require(
            fptToken.balanceOf(msg.sender) >= SLOT_PRICE,
            "Insufficient FPT balance"
        );

        // Transfer tokens from user to contract
        require(
            fptToken.transferFrom(msg.sender, address(this), SLOT_PRICE),
            "Token transfer failed"
        );

        bookings[bookingId] = Booking(
            roomId,
            slot,
            msg.sender,
            SLOT_PRICE,
            time,
            false,
            false,
            false
        );
        roomSlotBooked[roomSlotId] = true;

        emit BookingCreated(bookingId, roomId, slot, msg.sender, time);
    }

    function cancelBooking(bytes32 bookingId) external nonReentrant {
        Booking storage booking = bookings[bookingId];
        require(booking.user == msg.sender, "Not the booking owner");
        require(!booking.cancelled, "Booking already cancelled");
        require(!booking.checkedIn, "Already checked in");
        require(booking.time > block.timestamp, "Booking time passed");

        uint256 refundAmount = 0;
        uint256 timeToBooking = booking.time - block.timestamp;

        if (timeToBooking >= 1 hours) {
            refundAmount = booking.price; // 100% refund
        } else if (timeToBooking >= 30 minutes) {
            refundAmount = booking.price / 2; // 50% refund
        }

        booking.cancelled = true;
        bytes32 roomSlotId = generateRoomSlotId(
            booking.roomId,
            booking.slot,
            booking.time
        );
        roomSlotBooked[roomSlotId] = false;

        if (refundAmount > 0) {
            require(
                fptToken.transfer(msg.sender, refundAmount),
                "Refund failed"
            );
        }

        // Update consecutive cancellations
        User storage user = users[msg.sender];
        user.consecutiveCancellations++;

        if (user.consecutiveCancellations >= 3) {
            user.blockEndTime = block.timestamp + 1 weeks;
            emit UserBlocked(msg.sender);
        }

        emit BookingCancelled(bookingId, refundAmount);
    }

    function checkIn(bytes32 bookingId) external onlyRegistered {
        Booking storage booking = bookings[bookingId];
        require(booking.user == msg.sender, "Not the booking owner");
        require(!booking.cancelled, "Booking cancelled");
        require(!booking.checkedIn, "Already checked in");
        require(
            block.timestamp <= booking.time + CHECK_IN,
            "Check-in window passed"
        );

        booking.checkedIn = true;
        users[msg.sender].consecutiveCancellations = 0; // Reset consecutive cancellations

        emit BookingCheckedIn(bookingId);
    }

    function checkOut(bytes32 bookingId) external onlyRegistered nonReentrant {
        Booking storage booking = bookings[bookingId];
        require(booking.user == msg.sender, "Not the booking owner");
        require(booking.checkedIn, "User has not checked in");
        require(!booking.cancelled, "Booking was cancelled");
        require(!booking.checkedOut, "Already checked out");

        booking.checkedOut = true;

        bytes32 roomSlotId = generateRoomSlotId(
            booking.roomId,
            booking.slot,
            booking.time
        );
        roomSlotBooked[roomSlotId] = false;

        emit BookingCheckedOut(bookingId);
    }

    function reactivateAccount() external nonReentrant {
        User storage user = users[msg.sender];
        require(user.blockEndTime > block.timestamp, "Account not blocked");
        require(
            fptToken.balanceOf(msg.sender) >= PENALTY_AMOUNT,
            "Insufficient penalty amount"
        );

        require(
            fptToken.transferFrom(msg.sender, address(this), PENALTY_AMOUNT),
            "Penalty payment failed"
        );

        user.blockEndTime = block.timestamp;
        user.consecutiveCancellations = 0;

        emit UserUnblocked(msg.sender);
    }

    function depositTokens(
        uint256 amount
    ) external onlyRegistered nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            fptToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        emit TokensDeposited(msg.sender, amount);
    }

    function withdrawTokens(
        uint256 amount
    ) external onlyRegistered nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(fptToken.transfer(msg.sender, amount), "Transfer failed");
        emit TokensWithdrawn(msg.sender, amount);
    }
}
