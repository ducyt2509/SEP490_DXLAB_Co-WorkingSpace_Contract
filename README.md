# FPT University Lab Booking System

A blockchain-based system for booking laboratory rooms at FPT University using FPT CURRENCY (FPT) tokens.

## Features

- ERC20 token (FPT CURRENCY) for payments
- Lab room booking system with time slots
- User management (Owner, Staff, Students)
- Refund system based on cancellation timing
- Penalty system for no-shows and frequent cancellations
- Complete booking history tracking

## Smart Contracts

1. `FPTCurrency.sol`: ERC20 token contract for FPT CURRENCY
2. `LabBookingSystem.sol`: Main contract for managing lab bookings

## Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- Hardhat

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd fpt-lab-booking
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` with your:
- Private key
- Sepolia RPC URL
- Etherscan API key (optional, for verification)

## Testing

Run the test suite:
```bash
npx hardhat test
```

## Deployment

### Local Deployment

1. Start local node:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia Testnet Deployment

1. Ensure your wallet has sufficient ETH
2. Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Contract Details

### FPT CURRENCY (FPT)
- ERC20 token
- Mintable by owner
- Used for booking payments

### Lab Booking System
- Booking cost: 5 FPT per slot
- Maximum 5 slots per booking
- Refund rules:
  - 100% refund if cancelled 1+ hour before
  - 50% refund if cancelled 30-60 minutes before
  - No refund if cancelled <30 minutes before
- Penalty system:
  - Account blocked after 3 consecutive cancellations
  - Reactivation cost: 10 FPT
- Check-in required within 15 minutes of booking time

## Usage

### As Staff
1. Register new users:
```javascript
await labBookingSystem.registerUser(userAddress, "user@fpt.edu.vn", false);
```

### As Student
1. Approve token spending:
```javascript
await fptToken.approve(labBookingSystemAddress, amount);
```

2. Book a lab:
```javascript
await labBookingSystem.book("LAB001", 1, bookingTime);
```

3. Check in:
```javascript
await labBookingSystem.checkIn(bookingId);
```

## Events Emitted

- UserRegistered
- BookingCreated
- BookingCancelled
- BookingCheckedIn
- UserBlocked
- UserUnblocked
- TokensDeposited
- TokensWithdrawn

## Security Considerations

- ReentrancyGuard implemented for token operations
- Access control for different user roles
- Proper validation for all inputs
- Time-based constraints for bookings and cancellations

## License

MIT
