require('dotenv').config();
const YieldOptimizer = require('./optimizer');
const ProtocolDataFetcher = require('./fetcher');

console.log('DeFi Yield Optimizer starting...');

async function main() {
    try {
        const optimizer = new YieldOptimizer();
        const fetcher = new ProtocolDataFetcher();
        
        console.log('Fetching protocol data...');
        const protocolData = await fetcher.fetchAllProtocolData();
        
        for (const protocol of protocolData) {
            await optimizer.addProtocol(protocol);
        }
        
        const allocation = optimizer.calculateOptimalAllocation(1000);
        console.log('Optimal allocation:', allocation);
        
        console.log('Optimizer initialized successfully');
    } catch (error) {
        console.error('Error starting optimizer:', error);
    }
}

main();