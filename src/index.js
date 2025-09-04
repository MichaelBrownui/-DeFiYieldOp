require('dotenv').config();
const YieldOptimizer = require('./optimizer');

console.log('DeFi Yield Optimizer starting...');

async function main() {
    try {
        const optimizer = new YieldOptimizer();
        console.log('Optimizer initialized successfully');
    } catch (error) {
        console.error('Error starting optimizer:', error);
    }
}

main();