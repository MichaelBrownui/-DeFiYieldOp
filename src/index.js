require('dotenv').config();
const YieldOptimizer = require('./optimizer');
const ProtocolDataFetcher = require('./fetcher');
const PortfolioManager = require('./portfolio');
const RiskAssessment = require('./risk');

console.log('DeFi Yield Optimizer starting...');

async function main() {
    try {
        const optimizer = new YieldOptimizer();
        const fetcher = new ProtocolDataFetcher();
        const portfolio = new PortfolioManager();
        const riskAssessment = new RiskAssessment();
        
        console.log('Fetching protocol data...');
        const protocolData = await fetcher.fetchAllProtocolData();
        
        for (const protocol of protocolData) {
            await optimizer.addProtocol(protocol);
            
            const riskReport = riskAssessment.generateRiskReport(protocol);
            console.log(`Risk assessment for ${protocol.name}:`, riskReport.riskLevel);
        }
        
        const allocation = optimizer.calculateOptimalAllocation(1000);
        console.log('Optimal allocation:', allocation);
        
        portfolio.addPosition(allocation.recommended, 500, allocation.recommended.apy);
        console.log('Portfolio weights:', portfolio.calculateWeights());
        
        console.log('Optimizer initialized successfully');
    } catch (error) {
        console.error('Error starting optimizer:', error);
    }
}

main();