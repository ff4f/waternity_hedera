# 🌊 Waternity - Decentralized Water Quality & Trading Platform

**Waternity** is a revolutionary decentralized platform built on **Hedera Hashgraph** that transforms water resource management through blockchain technology. Our platform enables transparent water quality monitoring, secure trading, and efficient settlement systems for underbanked regions across Africa.

## 🏆 Hackathon Submission

**Track**: 💸 Onchain Finance & Real-World Assets (RWA)  
**Sub-track**: Financial Inclusion - Bridge gaps across Africa using Hedera's fast, secure, low-cost infrastructure

## 🎯 Problem & Solution

**Problem**: 400+ million people in Africa lack access to clean water due to insufficient funding and poor infrastructure management.

**Solution**: Waternity tokenizes water wells, enabling:
- 💰 **Fractional Ownership** through HTS tokens
- 🔄 **Automated Revenue Sharing** via smart contracts
- 📊 **Transparent Operations** using HCS event logging
- 🌍 **Global Investment** in local water infrastructure

## 🚀 Key Features

- **🏗️ Well Management** - Complete lifecycle management of water wells
- **🪙 Asset Tokenization** - HTS-based ownership tokens for each well
- **💸 Revenue Settlement** - Automated distribution to token holders
- **📋 Compliance Tracking** - Immutable audit trail via HCS
- **📁 Document Management** - Secure storage using HFS
- **🔗 Wallet Integration** - HashConnect for seamless user experience

## 📋 Prerequisites

- **Node.js** >= 20.0.0
- **npm** or **yarn**
- **Hedera Testnet Account** (configured in .env)

## ⚡ Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Run the automated setup script
npm run setup

# Or quick setup without prompts
npm run setup:quick
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# 3. Start development server
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Prisma Studio**: `npm run db:studio`
- **Hedera Explorer**: https://hashscan.io/testnet

## 🔧 Environment Configuration

The `.env` file is pre-configured with optimal settings:

```bash
# Hedera Testnet (Ready to use)
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.6502425
HEDERA_PRIVATE_KEY=afc3be868220472d8b057850d4152a76f763f0ce69d677c14baebaad66f60305

# Database (SQLite for development)
DATABASE_URL="file:./prisma/dev.db"

# Authentication
NEXTAUTH_SECRET=waternity-secret-key-2024-hedera-hackathon
```

> ✅ **Ready to run without additional configuration!**

## 📁 Project Structure

```
react_app/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── styles/         # Global styles and Tailwind configuration
│   ├── App.jsx         # Main application component
│   ├── Routes.jsx      # Application routes
│   └── index.jsx       # Application entry point
├── .env                # Environment variables
├── index.html          # HTML template
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
└── vite.config.js      # Vite configuration
```

## 🧩 Adding Routes

To add new routes to the application, update the `Routes.jsx` file:

```jsx
import { useRoutes } from "react-router-dom";
import HomePage from "pages/HomePage";
import AboutPage from "pages/AboutPage";

const ProjectRoutes = () => {
  let element = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "/about", element: <AboutPage /> },
    // Add more routes as needed
  ]);

  return element;
};
```

## 🎨 Styling

This project uses Tailwind CSS for styling. The configuration includes:

- Forms plugin for form styling
- Typography plugin for text styling
- Aspect ratio plugin for responsive elements
- Container queries for component-specific responsive design
- Fluid typography for responsive text
- Animation utilities

## 📱 Responsive Design

The app is built with responsive design using Tailwind CSS breakpoints.


## 🏗️ Hedera Integration

### Services Used
- **HCS (Hedera Consensus Service)**: Event logging and audit trail
- **HTS (Hedera Token Service)**: Well ownership and revenue tokens
- **HFS (Hedera File Service)**: Document and metadata storage
- **Smart Contracts**: Automated settlement and escrow

### Key Contracts
```javascript
// Well tokenization
const wellToken = await TokenCreateTransaction()
  .setTokenName(`Well-${wellCode}`)
  .setTokenSymbol(wellCode)
  .setTokenType(TokenType.FungibleCommon)
  .execute(client);

// Revenue settlement
const settlement = await new ContractExecuteTransaction()
  .setContractId(settlementContractId)
  .setGas(100000)
  .setFunction("distributeRevenue", new ContractFunctionParameters()
    .addUint256(wellId)
    .addUint256(amount))
  .execute(client);
```

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Setup & Database
npm run setup            # Automated setup with prompts
npm run setup:quick      # Quick setup without prompts
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed with sample data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

# Utilities
npm run test             # Run tests
npm run lint             # Lint code
npm run hedera:check     # Check Hedera configuration
```

## 📚 Documentation

- **[Setup Guide](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[Hackathon Submission](./HACKATHON_SUBMISSION.md)** - Complete project overview
- **[API Documentation](http://localhost:3000/api/docs)** - Interactive API docs
- **[Hedera Docs](https://docs.hedera.com/hedera)** - Official Hedera documentation

## 🎯 Hackathon Track

**Track**: Onchain Finance & Real-World Assets (RWA)  
**Sub-track**: Asset Tokenization

**Why Waternity?**
- ✅ Solves real-world problem (water access in Africa)
- ✅ Full Hedera ecosystem integration
- ✅ Sustainable business model
- ✅ Measurable social impact
- ✅ Technical innovation in RWA tokenization

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run start
```

### Environment Variables for Production
```bash
# Update for production
DATABASE_URL="postgresql://user:pass@host:5432/waternity"
HEDERA_NETWORK=mainnet
NEXTAUTH_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Team

**Ready to revolutionize water access in Africa with Hedera Hashgraph!** 🌍💧

---

*Built with ❤️ for Hedera Hack Africa 2024*

## 🙏 Acknowledgments

- Built with [Rocket.new](https://rocket.new)
- Powered by React and Vite
- Styled with Tailwind CSS

Built with ❤️ on Rocket.new
