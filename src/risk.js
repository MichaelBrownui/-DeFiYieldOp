class RiskAssessment {
    constructor() {
        this.riskMetrics = {
            impermanentLoss: 0,
            smartContractRisk: 0,
            liquidityRisk: 0,
            volatilityRisk: 0
        };
    }

    calculateImpermanentLoss(token0Price, token1Price, initialRatio) {
        const currentRatio = token0Price / token1Price;
        const priceRatio = currentRatio / initialRatio;
        
        const ilPercent = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
        return Math.abs(ilPercent);
    }

    assessSmartContractRisk(protocol) {
        let riskScore = 0.5;
        
        if (protocol.audited) riskScore -= 0.2;
        if (protocol.ageInDays > 365) riskScore -= 0.1;
        if (protocol.tvl > 1000000000) riskScore -= 0.1;
        
        return Math.max(0, Math.min(1, riskScore));
    }

    calculateLiquidityRisk(protocol) {
        if (protocol.tvl < 1000000) return 0.8;
        if (protocol.tvl < 10000000) return 0.5;
        if (protocol.tvl < 100000000) return 0.3;
        return 0.1;
    }

    calculateVolatilityRisk(priceHistory) {
        if (!priceHistory || priceHistory.length < 2) return 0.5;
        
        const returns = [];
        for (let i = 1; i < priceHistory.length; i++) {
            const returnRate = (priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1];
            returns.push(returnRate);
        }
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance);
        
        return Math.min(1, volatility * 10);
    }

    generateRiskReport(protocol, priceHistory = null) {
        const risks = {
            smartContract: this.assessSmartContractRisk(protocol),
            liquidity: this.calculateLiquidityRisk(protocol),
            volatility: this.calculateVolatilityRisk(priceHistory)
        };
        
        const overallRisk = (risks.smartContract + risks.liquidity + risks.volatility) / 3;
        
        return {
            protocol: protocol.name,
            risks,
            overallRisk,
            riskLevel: this.getRiskLevel(overallRisk),
            recommendation: this.getRecommendation(overallRisk)
        };
    }

    getRiskLevel(score) {
        if (score < 0.3) return 'Low';
        if (score < 0.6) return 'Medium';
        return 'High';
    }

    getRecommendation(score) {
        if (score < 0.3) return 'Safe for conservative investors';
        if (score < 0.6) return 'Suitable for moderate risk tolerance';
        return 'Only for high-risk investors';
    }
}

module.exports = RiskAssessment;