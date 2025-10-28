# Waternity - Decentralized Water Management Platform

🏆 **Built for Hedera Hackathon Africa 2024**

## 🌊 Overview

Waternity is a comprehensive decentralized water management platform built on Hedera Hashgraph that addresses critical water challenges across Africa. Our solution combines blockchain technology, IoT integration, and financial inclusion to create a transparent, efficient, and sustainable water ecosystem.

## 🎯 Hackathon Track

**💸 Onchain Finance & Real-World Assets (RWA)**
- Sub-track 1: Decentralized Financial Systems
- Sub-track 2: Asset Tokenization
- Sub-track 3: Financial Inclusion

## ✨ Key Features

### 🔐 THG Identity Platform Integration
- **Digital Identity Management**: Secure credential storage and verification
- **Water Access Rights**: Tamper-proof digital certificates for water access
- **Conservation Achievements**: Verifiable credentials for water conservation efforts
- **Mobile Wallet Support**: Identity wallet for credential management

### 🌐 Core Hedera Integration
- **Hedera Consensus Service (HCS)**: Immutable transaction logging
- **Hedera File Service (HFS)**: Decentralized document storage
- **Real-time Data Streaming**: Water quality and usage monitoring
- **Transparent Operations**: All transactions recorded on-chain

### 💰 DeFi & Micro-Finance
- **Lending Protocols**: Decentralized lending for water infrastructure
- **Micro-Finance Platform**: Financial inclusion for underbanked communities
- **Credit Scoring**: Blockchain-based credit assessment
- **Group Lending**: Community-backed loan guarantees
- **Liquidity Pools**: Decentralized funding mechanisms

### 🏗️ Real-World Asset Tokenization
- **Water Infrastructure Tokenization**: Fractional ownership of water assets
- **NFT Certificates**: Unique digital certificates for water rights
- **Dividend Distribution**: Automated revenue sharing
- **Performance Tracking**: Real-time asset performance monitoring
- **Metadata Storage**: Secure asset documentation on HFS

### ⚙️ Smart Contract Operations
- **Water Management Contract**: Transparent resource allocation
- **Well Registration**: Decentralized well management
- **Usage Tracking**: Automated water consumption monitoring
- **Quality Assurance**: Blockchain-verified water quality data
- **Payment Processing**: Automated billing and settlements

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Backend APIs   │    │ Hedera Network  │
│                 │    │                 │    │                 │
│ • Dashboard     │◄──►│ • Identity      │◄──►│ • HCS Topics    │
│ • Monitoring    │    │ • Contracts     │    │ • HFS Files     │
│ • Investor      │    │ • Tokenization  │    │ • Smart Contracts│
│ • Operator      │    │ • DeFi          │    │ • Token Service │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │   Database      │
                       │                 │
                       │ • PostgreSQL    │
                       │ • Prisma ORM    │
                       └─────────────────┘
```

## 🚀 Technology Stack

- **Blockchain**: Hedera Hashgraph (HCS, HFS, Smart Contracts)
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM
- **Database**: PostgreSQL
- **Identity**: THG Identity Platform
- **Smart Contracts**: Solidity
- **SDK**: Hedera JavaScript SDK

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL
- Hedera Testnet Account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/waternity-hedera.git
cd waternity-hedera
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/waternity"

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY

# Application
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

4. **Database Setup**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the application**
```bash
npm run dev
```

Visit `http://localhost:3000` to access the platform.

## 🎮 Demo Features

### 1. Dashboard Overview
- Real-time water consumption metrics
- Financial performance indicators
- System health monitoring
- Recent transactions

### 2. Water Monitoring
- Live water quality data
- Usage analytics
- Well performance tracking
- Alert management

### 3. Investor Portal
- Tokenized asset marketplace
- Investment opportunities
- Portfolio management
- Dividend tracking

### 4. Operator Interface
- Well management
- Maintenance scheduling
- Quality control
- System administration

## 🔧 API Endpoints

### Identity Management
- `POST /api/identity/create-wallet` - Create identity wallet
- `POST /api/identity/issue-credential` - Issue digital credential
- `GET /api/identity/verify-credential` - Verify credential

### Water Management
- `GET /api/wells` - List all wells
- `POST /api/wells` - Register new well
- `GET /api/water-quality` - Get quality data
- `POST /api/water-quality` - Submit quality reading

### DeFi Operations
- `POST /api/defi/create-pool` - Create lending pool
- `POST /api/defi/apply-loan` - Apply for loan
- `POST /api/defi/add-liquidity` - Add liquidity to pool

### Tokenization
- `POST /api/tokenization/tokenize-asset` - Tokenize water asset
- `POST /api/tokenization/transfer-ownership` - Transfer fractional ownership
- `GET /api/tokenization/portfolio` - Get investment portfolio

## 🌍 Impact & Use Cases

### Financial Inclusion
- **Micro-loans** for water infrastructure development
- **Credit scoring** based on water usage patterns
- **Group lending** for community water projects
- **Mobile payments** for water services

### Asset Tokenization
- **Fractional ownership** of water treatment plants
- **Investment opportunities** in water infrastructure
- **Liquidity provision** for water projects
- **Transparent revenue sharing**

### Operational Transparency
- **Immutable records** of water quality
- **Transparent pricing** and billing
- **Audit trails** for regulatory compliance
- **Real-time monitoring** of water systems

## 🏆 Hackathon Submission

### Problem Statement
Africa faces significant water challenges:
- 400 million people lack access to clean water
- Limited financing for water infrastructure
- Lack of transparency in water management
- Inefficient resource allocation

### Our Solution
Waternity leverages Hedera's fast, secure, and low-cost infrastructure to:
- **Democratize access** to water infrastructure investments
- **Provide transparent** water management systems
- **Enable financial inclusion** through DeFi protocols
- **Create verifiable credentials** for water rights

### Technical Innovation
- **THG Identity Integration**: Seamless credential management
- **Multi-layered Architecture**: HCS + HFS + Smart Contracts
- **Real-time Data Processing**: IoT integration with blockchain
- **Fractional Tokenization**: Making water infrastructure investable

### Business Model
- **Transaction fees** on water payments
- **Platform fees** on tokenized asset trades
- **Interest margins** on DeFi lending
- **Subscription fees** for premium features

## 🔮 Future Roadmap

### Phase 1 (Current)
- ✅ Core platform development
- ✅ Hedera integration
- ✅ THG Identity implementation
- ✅ Basic DeFi features

### Phase 2 (Q2 2024)
- 🔄 Mobile application
- 🔄 IoT device integration
- 🔄 Advanced analytics
- 🔄 Multi-language support

### Phase 3 (Q3 2024)
- 📋 Mainnet deployment
- 📋 Partnership integrations
- 📋 Regulatory compliance
- 📋 Scale to multiple countries

## 👥 Team

- **Blockchain Developer**: Hedera integration & smart contracts
- **Full-stack Developer**: Platform development
- **Product Manager**: Strategy & roadmap
- **UI/UX Designer**: User experience design

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📞 Contact

- **Email**: team@waternity.io
- **Twitter**: @WaternityHQ
- **Discord**: [Join our community](https://discord.gg/waternity)

---

**Built with ❤️ for Hedera Hackathon Africa 2024**

*Empowering Africa through decentralized water management*

## 🚀 Deploy ke Vercel (Free Tier)

Tanpa setup server tambahan. Cukup atur Environment Variables di Vercel Project Settings:

Wajib:
- DATABASE_URL: URL Postgres (gunakan Vercel Postgres atau Neon/Supabase). Contoh: postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
- NEXTAUTH_SECRET: string acak minimal 32 karakter
- NEXTAUTH_URL: https://<your-vercel-domain>
- HEDERA_NETWORK: testnet
- HEDERA_ACCOUNT_ID: 0.0.xxxxx (akun Hedera kamu)
- HEDERA_PRIVATE_KEY: kunci privat (DER/HEX) akun tersebut
- HEDERA_DER_PRIVATE_KEY: sama seperti HEDERA_PRIVATE_KEY jika diminta oleh validator env
- HCS_TOPIC_ID: 0.0.6919015
- HTS_TOKEN_ID: 0.0.6919016

Opsional (untuk demo cepat):
- HEDERA_MOCK_MODE: true
- HEDERA_TOPUP_ENABLED: true

Build & runtime akan otomatis:
- prisma generate saat postinstall
- inisialisasi database saat pertama kali endpoint /api/health dipanggil (auto-seed kalau tabel Role kosong)

Tips:
- Untuk Vercel Postgres, gunakan POSTGRES_PRISMA_URL sebagai DATABASE_URL
- Untuk Neon/Supabase, pastikan parameter sslmode=require
- Gunakan vercel env pull untuk menyamakan env lokal

## 👤 Demo Accounts

Untuk juri dan demo, gunakan akun berikut:
- Operator: operator@waternity.com / password123
- Investor 1: investor1@waternity.com / password123
- Investor 2: investor2@waternity.com / password123
- Agent: agent@waternity.com / password123

Akun di atas otomatis dibuat oleh seeding saat pertama kali sistem dijalankan.

### 2. Water Monitoring
- Live water quality data
- Usage analytics
- Well performance tracking
- Alert management

### 3. Investor Portal
- Tokenized asset marketplace
- Investment opportunities
- Portfolio management
- Dividend tracking

### 4. Operator Interface
- Well management
- Maintenance scheduling
- Quality control
- System administration

## 🔧 API Endpoints

### Identity Management
- `POST /api/identity/create-wallet` - Create identity wallet
- `POST /api/identity/issue-credential` - Issue digital credential
- `GET /api/identity/verify-credential` - Verify credential

### Water Management
- `GET /api/wells` - List all wells
- `POST /api/wells` - Register new well
- `GET /api/water-quality` - Get quality data
- `POST /api/water-quality` - Submit quality reading

### DeFi Operations
- `POST /api/defi/create-pool` - Create lending pool
- `POST /api/defi/apply-loan` - Apply for loan
- `POST /api/defi/add-liquidity` - Add liquidity to pool

### Tokenization
- `POST /api/tokenization/tokenize-asset` - Tokenize water asset
- `POST /api/tokenization/transfer-ownership` - Transfer fractional ownership
- `GET /api/tokenization/portfolio` - Get investment portfolio

## 🌍 Impact & Use Cases

### Financial Inclusion
- **Micro-loans** for water infrastructure development
- **Credit scoring** based on water usage patterns
- **Group lending** for community water projects
- **Mobile payments** for water services

### Asset Tokenization
- **Fractional ownership** of water treatment plants
- **Investment opportunities** in water infrastructure
- **Liquidity provision** for water projects
- **Transparent revenue sharing**

### Operational Transparency
- **Immutable records** of water quality
- **Transparent pricing** and billing
- **Audit trails** for regulatory compliance
- **Real-time monitoring** of water systems

## 🏆 Hackathon Submission

### Problem Statement
Africa faces significant water challenges:
- 400 million people lack access to clean water
- Limited financing for water infrastructure
- Lack of transparency in water management
- Inefficient resource allocation

### Our Solution
Waternity leverages Hedera's fast, secure, and low-cost infrastructure to:
- **Democratize access** to water infrastructure investments
- **Provide transparent** water management systems
- **Enable financial inclusion** through DeFi protocols
- **Create verifiable credentials** for water rights

### Technical Innovation
- **THG Identity Integration**: Seamless credential management
- **Multi-layered Architecture**: HCS + HFS + Smart Contracts
- **Real-time Data Processing**: IoT integration with blockchain
- **Fractional Tokenization**: Making water infrastructure investable

### Business Model
- **Transaction fees** on water payments
- **Platform fees** on tokenized asset trades
- **Interest margins** on DeFi lending
- **Subscription fees** for premium features

## 🔮 Future Roadmap

### Phase 1 (Current)
- ✅ Core platform development
- ✅ Hedera integration
- ✅ THG Identity implementation
- ✅ Basic DeFi features

### Phase 2 (Q2 2024)
- 🔄 Mobile application
- 🔄 IoT device integration
- 🔄 Advanced analytics
- 🔄 Multi-language support

### Phase 3 (Q3 2024)
- 📋 Mainnet deployment
- 📋 Partnership integrations
- 📋 Regulatory compliance
- 📋 Scale to multiple countries

## 👥 Team

- **Blockchain Developer**: Hedera integration & smart contracts
- **Full-stack Developer**: Platform development
- **Product Manager**: Strategy & roadmap
- **UI/UX Designer**: User experience design

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📞 Contact

- **Email**: team@waternity.io
- **Twitter**: @WaternityHQ
- **Discord**: [Join our community](https://discord.gg/waternity)

---

**Built with ❤️ for Hedera Hackathon Africa 2024**

*Empowering Africa through decentralized water management*
