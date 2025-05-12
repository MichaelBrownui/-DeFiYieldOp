require('dotenv').config();
const YieldOptimizer = require('./optimizer');
const ProtocolDataFetcher = require('./fetcher');
const PortfolioManager = require('./portfolio');
const RiskAssessment = require('./risk');
const YieldFarmingStrategies = require('./strategies');
const { ConfigManager } = require('../config/settings');

console.log('DeFi Yield Optimizer starting...');

async function main() {
    try {
        const config = new ConfigManager();
        const optimizer = new YieldOptimizer();
        const fetcher = new ProtocolDataFetcher();
        const portfolio = new PortfolioManager();
        const riskAssessment = new RiskAssessment();
        const strategies = new YieldFarmingStrategies(config);
        
        console.log('Fetching protocol data...');
        const protocolData = await fetcher.fetchAllProtocolData();
        
        for (const protocol of protocolData) {
            await optimizer.addProtocol(protocol);
            
            const riskReport = riskAssessment.generateRiskReport(protocol);
            console.log(`Risk assessment for ${protocol.name}:`, riskReport.riskLevel);
        }
        
        console.log('\n=== Strategy Analysis ===');
        const investmentAmount = 5000;
        
        for (const strategy of ['conservative', 'moderate', 'aggressive']) {
            const allocation = strategies.optimizeForStrategy(strategy, protocolData, investmentAmount);
            console.log(`\n${allocation.strategy} Strategy:`);
            console.log(`Expected Yield: ${(allocation.expectedYield * 100).toFixed(2)}%`);
            console.log(`Risk Level: ${(allocation.averageRisk * 100).toFixed(1)}%`);
            console.log(`Protocols: ${allocation.diversification}`);
        }
        
        const allocation = optimizer.calculateOptimalAllocation(1000);
        portfolio.addPosition(allocation.recommended, 500, allocation.recommended.apy);
        
        console.log('\n=== Portfolio Status ===');
        console.log('Portfolio weights:', portfolio.calculateWeights());
        
        console.log('\nOptimizer initialized successfully');
    } catch (error) {
        console.error('Error starting optimizer:', error);
    }
}

main();