const { ethers } = require('hardhat');
const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting WaterManagement contract deployment to Hedera...');
  
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying contracts with account:', await deployer.getAddress());
  
  const balance = await ethers.provider.getBalance(await deployer.getAddress());
  console.log('💰 Account balance:', ethers.formatEther(balance), 'HBAR');

  // For testnet deployment, we'll use mock token addresses
  // In production, these should be actual HTS token addresses
  const PAYMENT_TOKEN_ADDRESS = process.env.PAYMENT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000001';
  const REWARD_TOKEN_ADDRESS = process.env.REWARD_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000002';

  console.log('🔧 Using token addresses:');
  console.log('  Payment Token:', PAYMENT_TOKEN_ADDRESS);
  console.log('  Reward Token:', REWARD_TOKEN_ADDRESS);

  // Deploy WaterManagement contract
  console.log('\n📦 Deploying WaterManagement contract...');
  const WaterManagement = await ethers.getContractFactory('WaterManagement');
  
  const waterManagement = await WaterManagement.deploy(
    PAYMENT_TOKEN_ADDRESS,
    REWARD_TOKEN_ADDRESS
  );
  
  await waterManagement.waitForDeployment();
  const contractAddress = await waterManagement.getAddress();
  
  console.log('✅ WaterManagement deployed to:', contractAddress);
  console.log('🔗 Transaction hash:', waterManagement.deploymentTransaction().hash);

  // Verify deployment
  console.log('\n🔍 Verifying deployment...');
  try {
    const contractStats = await waterManagement.getContractStats();
    console.log('📊 Contract stats:', {
      totalWells: contractStats[0].toString(),
      totalAllocated: contractStats[1].toString(),
      totalRewards: contractStats[2].toString(),
      contractBalance: contractStats[3].toString()
    });
    console.log('✅ Contract verification successful');
  } catch (error) {
    console.error('❌ Contract verification failed:', error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: await deployer.getAddress(),
    timestamp: new Date().toISOString(),
    contracts: {
      WaterManagement: {
        address: contractAddress,
        transactionHash: waterManagement.deploymentTransaction().hash,
        type: 'Water Resource Management Contract',
        paymentToken: PAYMENT_TOKEN_ADDRESS,
        rewardToken: REWARD_TOKEN_ADDRESS
      }
    },
    gasUsed: {
      WaterManagement: waterManagement.deploymentTransaction().gasLimit?.toString() || 'auto'
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `water-management-deployment-${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('\n📄 Deployment info saved to:', filepath);

  // Update .env.local with contract address
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Add or update contract address
    const contractAddressLine = `WATER_MANAGEMENT_CONTRACT_ADDRESS=${contractAddress}`;
    
    if (envContent.includes('WATER_MANAGEMENT_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /WATER_MANAGEMENT_CONTRACT_ADDRESS=.*/,
        contractAddressLine
      );
    } else {
      envContent += `\n# Smart Contract Addresses\n${contractAddressLine}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('📝 Updated .env.local with contract address');
  }

  console.log('\n📋 Deployment Summary:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contracts on Hashscan (if not local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log('\n🔍 Contract verification on Hashscan...');
    console.log(`🌐 View on Hashscan: https://hashscan.io/${hre.network.name}/contract/${contractAddress}`);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [PAYMENT_TOKEN_ADDRESS, REWARD_TOKEN_ADDRESS],
      });
      console.log('✅ Contract verified on Hashscan');
    } catch (error) {
      console.log('⚠️  Contract verification failed:', error.message);
      console.log('   You can verify manually on Hashscan');
    }
  }

  console.log('\n🎉 Deployment completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Update frontend to use the new contract address');
  console.log('2. Configure HTS tokens for payment and rewards');
  console.log('3. Add authorized operators for well management');
  console.log('4. Test contract functions through the frontend');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });