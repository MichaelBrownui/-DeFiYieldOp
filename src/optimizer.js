class YieldOptimizer {
    constructor() {
        this.protocols = [];
        this.userPortfolio = {};
        this.riskTolerance = 'medium';
        
        console.log('YieldOptimizer initialized');
    }

    async addProtocol(protocolData) {
        this.protocols.push(protocolData);
        console.log(`Added protocol: ${protocolData.name}`);
    }

    calculateOptimalAllocation(amount) {
        if (this.protocols.length === 0) {
            throw new Error('No protocols available');
        }

        const sortedProtocols = this.protocols.sort((a, b) => b.apy - a.apy);
        
        return {
            recommended: sortedProtocols[0],
            alternatives: sortedProtocols.slice(1, 3)
        };
    }

    assessRisk(protocol) {
        const riskFactors = {
            tvl: protocol.tvl > 100000000 ? 0.1 : 0.3,
            age: protocol.ageInDays > 365 ? 0.1 : 0.4,
            audits: protocol.audited ? 0.1 : 0.5
        };

        const riskScore = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / 3;
        return riskScore;
    }
}

module.exports = YieldOptimizer;