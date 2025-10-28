import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const d = (n:number)=>new Date(Date.now()-n*86400000);
async function main(){
  console.log('Start comprehensive seeding...');
  // Clear in dependency order
  await prisma.payout.deleteMany();await prisma.settlement.deleteMany();await prisma.waterQuality.deleteMany();await prisma.document.deleteMany();await prisma.anchor.deleteMany();await prisma.hcsEvent.deleteMany();await prisma.token.deleteMany();await prisma.wellMembership.deleteMany();await prisma.repaymentSchedule.deleteMany();await prisma.loan.deleteMany();await prisma.liquidityProvider.deleteMany();await prisma.lendingPool.deleteMany();await prisma.fractionalOwnership.deleteMany();await prisma.assetPerformance.deleteMany();await prisma.tokenizedAsset.deleteMany();await prisma.creditScore.deleteMany();await prisma.digitalCredential.deleteMany();await prisma.identityWallet.deleteMany();await prisma.mirrorCursor.deleteMany();await prisma.idempotency.deleteMany();await prisma.well.deleteMany();await prisma.user.deleteMany();await prisma.role.deleteMany();
  // Roles
  const [INVESTOR,OPERATOR,AGENT,ADMIN]=await Promise.all([
    prisma.role.create({data:{name:'INVESTOR'}}),
    prisma.role.create({data:{name:'OPERATOR'}}),
    prisma.role.create({data:{name:'AGENT'}}),
    prisma.role.create({data:{name:'ADMIN'}})
  ]);
  // Users
  const salt=await bcrypt.genSalt(10);const pass=await bcrypt.hash('password123',salt);
  const [opNG,opKE,inv1,inv2,agent,admin]=await Promise.all([
    prisma.user.create({data:{email:'operator.ng@waternity.com',name:'Ngozi Operator',hashedPassword:pass,salt,hederaAccountId:'0.0.100001',roleId:OPERATOR.id}}),
    prisma.user.create({data:{email:'operator.ke@waternity.com',name:'Amina Operator',hashedPassword:pass,salt,hederaAccountId:'0.0.100002',roleId:OPERATOR.id}}),
    prisma.user.create({data:{email:'investor1@waternity.com',name:'Alice Investor',hashedPassword:pass,salt,hederaAccountId:'0.0.200001',roleId:INVESTOR.id}}),
    prisma.user.create({data:{email:'investor2@waternity.com',name:'Bob Investor',hashedPassword:pass,salt,hederaAccountId:'0.0.200002',roleId:INVESTOR.id}}),
    prisma.user.create({data:{email:'agent@waternity.com',name:'Sarah Agent',hashedPassword:pass,salt,hederaAccountId:'0.0.300001',roleId:AGENT.id}}),
    prisma.user.create({data:{email:'admin@waternity.com',name:'Super Admin',hashedPassword:pass,salt,hederaAccountId:'0.0.400001',roleId:ADMIN.id}})
  ]);
  // Wells
  const [wNG,wKE]=await Promise.all([
    prisma.well.create({data:{code:'WTR-001',name:'Lagos Community Well',location:'Lagos, Nigeria',topicId:'0.0.500001',tokenId:'0.0.700001',operatorUserId:opNG.id}}),
    prisma.well.create({data:{code:'WTR-002',name:'Nairobi Community Well',location:'Nairobi, Kenya',topicId:'0.0.500002',tokenId:'0.0.700002',operatorUserId:opKE.id}})
  ]);
  // Memberships
  await prisma.wellMembership.createMany({data:[
    {userId:opNG.id,wellId:wNG.id,roleName:'OPERATOR',shareBps:1200},
    {userId:inv1.id,wellId:wNG.id,roleName:'INVESTOR',shareBps:4500},
    {userId:inv2.id,wellId:wNG.id,roleName:'INVESTOR',shareBps:3000},
    {userId:agent.id,wellId:wNG.id,roleName:'AGENT',shareBps:500},
    {userId:opKE.id,wellId:wKE.id,roleName:'OPERATOR',shareBps:1200},
    {userId:inv2.id,wellId:wKE.id,roleName:'INVESTOR',shareBps:4000},
    {userId:inv1.id,wellId:wKE.id,roleName:'INVESTOR',shareBps:3000},
    {userId:agent.id,wellId:wKE.id,roleName:'AGENT',shareBps:500}
  ]});
  // Tokens
  await prisma.token.createMany({data:[
    {wellId:wNG.id,tokenId:'0.0.700001',type:'HTS_FT',treasuryAccount:'0.0.100001',decimals:2},
    {wellId:wKE.id,tokenId:'0.0.700002',type:'HTS_FT',treasuryAccount:'0.0.100002',decimals:2}
  ]});
  // HCS Events
  await prisma.hcsEvent.createMany({data:[
    {wellId:wNG.id,type:'WELL_CREATED',messageId:'msg-wtr001-created',consensusTime:d(25),sequenceNumber:BigInt(1),txId:'0xTX001',payloadJson:JSON.stringify({details:'Well created',by:'opNG'})},
    {wellId:wNG.id,type:'MILESTONE_VERIFIED',messageId:'msg-wtr001-mv1',consensusTime:d(10),sequenceNumber:BigInt(2),txId:'0xTX002',payloadJson:JSON.stringify({details:'Milestone verified',liters:5200})},
    {wellId:wNG.id,type:'PAYOUT_EXECUTED',messageId:'msg-wtr001-pay1',consensusTime:d(5),sequenceNumber:BigInt(3),txId:'0xTX003',payloadJson:JSON.stringify({details:'Monthly payout',amount:250,currency:'HBAR'})},
    {wellId:wKE.id,type:'WELL_CREATED',messageId:'msg-wtr002-created',consensusTime:d(20),sequenceNumber:BigInt(1),txId:'0xTX101',payloadJson:JSON.stringify({details:'Well created',by:'opKE'})}
  ]});
  const mvNG=await prisma.hcsEvent.findFirst({where:{messageId:'msg-wtr001-mv1'}});
  // Documents
  const docNG=await prisma.document.create({data:{wellId:wNG.id,type:'COMPLIANCE_REPORT',name:'Compliance Jan',cid:'bafy-compliance-ng-jan',digestAlgo:'sha256',digestHex:'deadbeef001',anchoredEventId:mvNG?.id}});
  const docKE=await prisma.document.create({data:{wellId:wKE.id,type:'MAINTENANCE_LOG',name:'Maintenance Q1',cid:'bafy-maint-ke-q1',digestAlgo:'sha256',digestHex:'deadbeef002'}});
  // Anchors
  await prisma.anchor.createMany({data:[
    {sourceType:'DOCUMENT',sourceId:docNG.id,hcsEventId:mvNG?.id,digestAlgo:'sha256',digestHex:'deadbeef001',cid:'bafy-compliance-ng-jan'},
    {sourceType:'DOCUMENT',sourceId:docKE.id,digestAlgo:'sha256',digestHex:'deadbeef002',cid:'bafy-maint-ke-q1'}
  ]});
  // Water Quality
  await prisma.waterQuality.createMany({data:[
    {wellId:wNG.id,ph:7.2,turbidity:0.8,tds:120,temperature:25.5,chlorine:0.3,bacteria:0,compliance:true,testedBy:'Lab NG',certificationBody:'NIS',hcsEventId:mvNG?.id},
    {wellId:wKE.id,ph:7.0,turbidity:1.1,tds:150,temperature:24.2,chlorine:0.2,bacteria:0,compliance:true,testedBy:'Lab KE',certificationBody:'KEBS'}
  ]});
  // Settlements
  const stNG=await prisma.settlement.create({data:{wellId:wNG.id,periodStart:d(30),periodEnd:d(1),kwhTotal:1234.5,grossRevenue:500,status:'EXECUTED',executeEventId:(await prisma.hcsEvent.findFirst({where:{messageId:'msg-wtr001-pay1'}}))?.id}});
  const stKE=await prisma.settlement.create({data:{wellId:wKE.id,periodStart:d(30),periodEnd:d(3),kwhTotal:987.6,grossRevenue:800,status:'EXECUTED'}});
  // Payouts
  async function distribute(settlementId:string,wellId:string,gross:number){
    const ms=await prisma.wellMembership.findMany({where:{wellId}});
    for(const m of ms){const u=await prisma.user.findUnique({where:{id:m.userId}});if(!u?.hederaAccountId)continue;const amount=Number(((gross*((m.shareBps||0)))/10000).toFixed(2));await prisma.payout.create({data:{settlementId,recipientAccount:u.hederaAccountId,assetType:'HBAR',amount,status:'COMPLETED'}});}
  }
  await distribute(stNG.id,wNG.id,stNG.grossRevenue);await distribute(stKE.id,wKE.id,stKE.grossRevenue);
  // Identity Wallets & Credentials
  const wid1=await prisma.identityWallet.create({data:{did:'did:hedera:0.0.200001',accountId:'0.0.200001',publicKey:'PUBKEY_INV1'}});
  const wopNG=await prisma.identityWallet.create({data:{did:'did:hedera:0.0.100001',accountId:'0.0.100001',publicKey:'PUBKEY_OP_NG'}});
  await prisma.digitalCredential.createMany({data:[
    {type:'KYC_VERIFIED',issuer:'Waternity KYC',subject:wid1.did,issuanceDate:d(60),credentialData:JSON.stringify({level:'basic'}),signature:'SIG1'},
    {type:'OPERATOR_CERTIFIED',issuer:'Waternity Compliance',subject:wopNG.did,issuanceDate:d(45),credentialData:JSON.stringify({region:'NG'}),signature:'SIG2'}
  ]});
  // Tokenized Asset, Ownership, Performance
  const asset=await prisma.tokenizedAsset.create({data:{tokenId:'0.0.800001',assetType:'REAL_WORLD_ASSET',metadata:JSON.stringify({symbol:'WATER-NG-001',wellCode:'WTR-001'}),metadataHash:'hash-ng-001',totalSupply:100000,circulatingSupply:60000,owner:opNG.hederaAccountId||'0.0.100001',fractional:true,tradeable:true}});
  await prisma.fractionalOwnership.createMany({data:[
    {assetId:asset.id,tokenId:'0.0.800001',owner:inv1.hederaAccountId||'0.0.200001',shares:30000,percentage:30,purchasePrice:10,purchaseDate:d(90)},
    {assetId:asset.id,tokenId:'0.0.800001',owner:inv2.hederaAccountId||'0.0.200002',shares:20000,percentage:20,purchasePrice:10,purchaseDate:d(85)}
  ]});
  await prisma.assetPerformance.createMany({data:[
    {assetId:asset.id,revenue:1200,expenses:300,netIncome:900,roi:0.075,period:'2024-08',waterProduced:15000,waterSold:12000,conservationImpact:0.2},
    {assetId:asset.id,revenue:1500,expenses:400,netIncome:1100,roi:0.085,period:'2024-09',waterProduced:18000,waterSold:14000,conservationImpact:0.25}
  ]});
  // Lending Pool, Providers, Loan, Repayments
  const pool=await prisma.lendingPool.create({data:{name:'Africa Water Impact Pool',description:'Microfinance for water wells',totalCapacity:1000000,availableLiquidity:700000,totalLoaned:300000,averageAPY:12.5,minimumLoanAmount:5000,maximumLoanAmount:50000,riskLevel:'MEDIUM',tokenId:'0.0.900001'}});
  await prisma.liquidityProvider.createMany({data:[
    {provider:'0.0.200001',poolId:pool.id,amount:200000,shares:2000,earnedInterest:5000},
    {provider:'0.0.200002',poolId:pool.id,amount:100000,shares:1000,earnedInterest:2500}
  ]});
  const loan=await prisma.loan.create({data:{borrower:'Nairobi Water Cooperative',lender:pool.id,amount:30000,purpose:'Well maintenance & expansion',duration:12,interestRate:10.5,collateralType:'TOKEN',collateralValue:50000,collateralTokenId:'0.0.800001',status:'ACTIVE',disbursedAt:d(40),dueDate:d(-320),repaidAmount:5000,remainingAmount:25000,groupMembers:JSON.stringify(['member1','member2']),creditScore:720}});
  await prisma.repaymentSchedule.createMany({data:[
    {loanId:loan.id,installmentNumber:1,dueDate:d(10),principalAmount:2000,interestAmount:250,totalAmount:2250,paidAmount:2250,isPaid:true,paidAt:d(9)},
    {loanId:loan.id,installmentNumber:2,dueDate:d(-20),principalAmount:2000,interestAmount:220,totalAmount:2220,paidAmount:0,isPaid:false}
  ]});
  // Credit Score
  await prisma.creditScore.create({data:{userId:inv1.id,score:730,paymentHistory:0.85,creditUtilization:0.20,lengthOfHistory:0.75,typesOfCredit:0.60,newCredit:0.40}});
  // Mirror Cursor & Idempotency
  await prisma.mirrorCursor.createMany({data:[{topicId:wNG.topicId,lastConsensusTime:'1700000000.000000001'},{topicId:wKE.topicId,lastConsensusTime:'1700000000.000000002'}]});
  await prisma.idempotency.createMany({data:[{key:'seed:init:wtr-001',scope:'SEED',status:'COMPLETED',resultJson:JSON.stringify({ok:true}),resultHash:'hash-001'},{key:'seed:init:wtr-002',scope:'SEED',status:'COMPLETED',resultJson:JSON.stringify({ok:true}),resultHash:'hash-002'}]});
  console.log('Seeding finished.');
}
main().catch(e=>{console.error(e);process.exit(1);}).finally(async()=>{await prisma.$disconnect();});