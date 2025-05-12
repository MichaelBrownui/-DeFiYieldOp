class YieldFarmingStrategies {
    constructor(configManager) {
        this.config = configManager;
        this.strategies = new Map();
        this.initializeStrategies();
    }

    initializeStrategies() {
        this.strategies.set('conservative', {
            name: 'Conservative Yield',
            description: 'Low risk, stable returns',
            riskTolerance: 0.3,
            minAPY: 0.02,
            maxSingleAllocation: 0.25,
            preferredProtocols: ['compound', 'aave'],
            rebalanceFrequency: 'weekly'
        });

        this.strategies.set('moderate', {
            name: 'Moderate Growth',
            description: 'Balanced risk-reward',
            riskTolerance: 0.6,
            minAPY: 0.05,
            maxSingleAllocation: 0.4,
            preferredProtocols: ['compound', 'aave', 'curve', 'yearn'],
            rebalanceFrequency: 'daily'
        });

        this.strategies.set('aggressive', {
            name: 'High Yield Hunter',
            description: 'Maximum returns, higher risk',
            riskTolerance: 0.9,
            minAPY: 0.1,
            maxSingleAllocation: 0.6,
            preferredProtocols: ['yearn', 'curve', 'uniswap-v2'],
            rebalanceFrequency: 'hourly'
        });
    }

    getStrategy(name) {
        return this.strategies.get(name);
    }

    getAllStrategies() {
        return Array.from(this.strategies.values());
    }

    optimizeForStrategy(strategyName, availableProtocols, amount) {
        const strategy = this.getStrategy(strategyName);
        if (!strategy) {
            throw new Error(`Strategy ${strategyName} not found`);
        }

        const suitableProtocols = availableProtocols.filter(protocol => {
            return protocol.apy >= strategy.minAPY && 
                   strategy.preferredProtocols.includes(protocol.protocol.toLowerCase());
        });

        if (suitableProtocols.length === 0) {
            return { allocations: [], totalYield: 0, risk: 0 };
        }

        const sortedProtocols = suitableProtocols.sort((a, b) => {
            const aRiskAdjustedReturn = a.apy * (1 - this.calculateRisk(a, strategy));
            const bRiskAdjustedReturn = b.apy * (1 - this.calculateRisk(b, strategy));
            return bRiskAdjustedReturn - aRiskAdjustedReturn;
        });

        return this.createAllocation(sortedProtocols, strategy, amount);
    }

    calculateRisk(protocol, strategy) {
        let risk = 0.5;
        
        if (!protocol.audited) risk += 0.2;
        if (protocol.ageInDays < 90) risk += 0.3;
        if (protocol.tvl < 10000000) risk += 0.2;
        
        return Math.min(1, risk);
    }

    createAllocation(protocols, strategy, totalAmount) {
        const allocations = [];
        let remainingAmount = totalAmount;
        let totalYield = 0;
        let totalRisk = 0;

        const maxProtocols = Math.min(protocols.length, 5);
        
        for (let i = 0; i < maxProtocols && remainingAmount > 0; i++) {
            const protocol = protocols[i];
            const maxAllocation = totalAmount * strategy.maxSingleAllocation;
            const allocation = Math.min(remainingAmount, maxAllocation);
            
            allocations.push({
                protocol: protocol.name,
                amount: allocation,
                percentage: (allocation / totalAmount) * 100,
                expectedAPY: protocol.apy,
                risk: this.calculateRisk(protocol, strategy)
            });
            
            totalYield += allocation * protocol.apy;
            totalRisk += (allocation / totalAmount) * this.calculateRisk(protocol, strategy);
            remainingAmount -= allocation;
        }

        return {
            strategy: strategy.name,
            allocations,
            totalAmount,
            expectedYield: totalYield / totalAmount,
            averageRisk: totalRisk,
            diversification: allocations.length
        };
    }

    suggestRebalancing(currentPortfolio, strategy, marketData) {
        const suggestions = [];
        
        for (const position of currentPortfolio.positions) {
            const currentMarket = marketData.find(m => m.name === position.protocol.name);
            if (!currentMarket) continue;

            const performanceChange = (currentMarket.apy - position.protocol.apy) / position.protocol.apy;
            
            if (performanceChange < -0.1) {
                suggestions.push({
                    action: 'reduce',
                    protocol: position.protocol.name,
                    reason: 'Performance declined significantly',
                    recommendation: 'Consider reducing position by 25%'
                });
            }
            
            if (currentMarket.apy > position.protocol.apy * 1.5) {
                suggestions.push({
                    action: 'increase',
                    protocol: position.protocol.name,
                    reason: 'Yield opportunity improved',
                    recommendation: 'Consider increasing position'
                });
            }
        }

        return suggestions;
    }
}

module.exports = YieldFarmingStrategies;