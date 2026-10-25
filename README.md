# ChainDrive

Blockchain-based Driving License & Traffic Management System

## Overview

ChainDrive is a production-grade blockchain-based system for managing driving licenses, traffic violations, fine payments, and disputes. The system demonstrates blockchain's value for data integrity and transparency while keeping sensitive personal information off-chain.

## Architecture

```
chaindrive/
├── contracts/          # Smart contracts (Hardhat + Solidity)
├── backend/           # Express API + MongoDB
├── frontend/          # React + Vite + TailwindCSS
└── shared/            # Shared types and contract ABIs
```

## Tech Stack

### Smart Contracts
- **Solidity 0.8.20** - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin** - Security-audited contract libraries
- **Ethers.js v6** - Blockchain interaction

### Backend
- **Node.js + Express** - REST API server
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Multer** - File uploads

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form validation
- **Ethers.js v6** - Wallet integration

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- MetaMask browser extension

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (root, contracts, backend, frontend, shared).

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 3. Start Development Servers

**Option A: Start all services together**
```bash
npm run dev:all
```

**Option B: Start services individually**

Terminal 1 - Hardhat Node:
```bash
npm run dev:contracts
```

Terminal 2 - Backend:
```bash
npm run dev:backend
```

Terminal 3 - Frontend:
```bash
npm run dev:frontend
```

### 4. Deploy Smart Contracts

In a new terminal (while Hardhat node is running):
```bash
cd contracts
npm run deploy-local
```

### 5. Seed Demo Data

```bash
npm run seed
```

## Development

- **Contracts**: `http://127.0.0.1:8545` (Hardhat node)
- **Backend**: `http://localhost:5000`
- **Frontend**: `http://localhost:3000`

## Testing

```bash
# Test smart contracts
npm run test:contracts

# Test backend
npm run test:backend
```

## Building for Production

```bash
npm run build:all
```

## Features

- ✅ Role-based access control (Admin, Officer, Driver)
- ✅ License lifecycle management (application → approval → issuance → renewal/suspension)
- ✅ Traffic violation recording with evidence
- ✅ MetaMask payment integration
- ✅ Dispute submission and resolution
- ✅ Blockchain integrity verification
- ✅ Public license verification
- ✅ Audit logging

## License

MIT
