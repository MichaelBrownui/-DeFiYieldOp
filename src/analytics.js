class PerformanceAnalytics {
    constructor() {
        this.metrics = {
            totalReturns: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            volatility: 0,
            winRate: 0
        };
        
        this.historicalData = [];
        this.benchmarks = new Map();
    }

    addDataPoint(timestamp, portfolioValue, benchmark = null) {
        const dataPoint = {
            timestamp,
            portfolioValue,
            benchmark,
            returns: 0
        };

        if (this.historicalData.length > 0) {
            const lastValue = this.historicalData[this.historicalData.length - 1].portfolioValue;
            dataPoint.returns = (portfolioValue - lastValue) / lastValue;
        }

        this.historicalData.push(dataPoint);
        this.updateMetrics();
    }

    updateMetrics() {
        if (this.historicalData.length < 2) return;

        this.calculateTotalReturns();
        this.calculateVolatility();
        this.calculateSharpeRatio();
        this.calculateMaxDrawdown();
        this.calculateWinRate();
    }

    calculateTotalReturns() {
        const firstValue = this.historicalData[0].portfolioValue;
        const lastValue = this.historicalData[this.historicalData.length - 1].portfolioValue;
        this.metrics.totalReturns = (lastValue - firstValue) / firstValue;
    }

    calculateVolatility() {
        const returns = this.historicalData.slice(1).map(d => d.returns);
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        this.metrics.volatility = Math.sqrt(variance) * Math.sqrt(365); // Annualized
    }

    calculateSharpeRatio() {
        const riskFreeRate = 0.02; // 2% risk-free rate
        const returns = this.historicalData.slice(1).map(d => d.returns);
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length * 365;
        
        if (this.metrics.volatility === 0) {
            this.metrics.sharpeRatio = 0;
            return;
        }
        
        this.metrics.sharpeRatio = (avgReturn - riskFreeRate) / this.metrics.volatility;
    }

    calculateMaxDrawdown() {
        let peak = this.historicalData[0].portfolioValue;
        let maxDrawdown = 0;

        for (const dataPoint of this.historicalData) {
            if (dataPoint.portfolioValue > peak) {
                peak = dataPoint.portfolioValue;
            }
            
            const drawdown = (peak - dataPoint.portfolioValue) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        this.metrics.maxDrawdown = maxDrawdown;
    }

    calculateWinRate() {
        const returns = this.historicalData.slice(1).map(d => d.returns);
        const positiveReturns = returns.filter(r => r > 0).length;
        this.metrics.winRate = returns.length > 0 ? positiveReturns / returns.length : 0;
    }

    generateReport() {
        const report = {
            summary: {
                totalReturns: `${(this.metrics.totalReturns * 100).toFixed(2)}%`,
                annualizedReturn: `${(this.metrics.totalReturns * (365 / this.getDaysInvested()) * 100).toFixed(2)}%`,
                volatility: `${(this.metrics.volatility * 100).toFixed(2)}%`,
                sharpeRatio: this.metrics.sharpeRatio.toFixed(3),
                maxDrawdown: `${(this.metrics.maxDrawdown * 100).toFixed(2)}%`,
                winRate: `${(this.metrics.winRate * 100).toFixed(1)}%`
            },
            
            riskMetrics: {
                riskRating: this.getRiskRating(),
                valueAtRisk: this.calculateVaR(),
                beta: this.calculateBeta()
            },
            
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    getDaysInvested() {
        if (this.historicalData.length < 2) return 1;
        const start = this.historicalData[0].timestamp;
        const end = this.historicalData[this.historicalData.length - 1].timestamp;
        return Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    }

    getRiskRating() {
        if (this.metrics.volatility < 0.1) return 'Low';
        if (this.metrics.volatility < 0.3) return 'Medium';
        return 'High';
    }

    calculateVaR(confidence = 0.05) {
        const returns = this.historicalData.slice(1).map(d => d.returns).sort((a, b) => a - b);
        if (returns.length === 0) return 0;
        
        const index = Math.floor(returns.length * confidence);
        return Math.abs(returns[index] || 0);
    }

    calculateBeta() {
        if (this.historicalData.length < 10) return 1; // Default beta
        
        const portfolioReturns = this.historicalData.slice(1).map(d => d.returns);
        const marketReturns = this.historicalData.slice(1)
            .map(d => d.benchmark || 0.0002) // Daily market return approximation
            .map((_, i, arr) => i === 0 ? 0 : (arr[i] - arr[i-1]) / arr[i-1]);

        if (portfolioReturns.length !== marketReturns.length) return 1;

        const marketVariance = this.calculateVariance(marketReturns);
        const covariance = this.calculateCovariance(portfolioReturns, marketReturns);
        
        return marketVariance === 0 ? 1 : covariance / marketVariance;
    }

    calculateVariance(returns) {
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    }

    calculateCovariance(returns1, returns2) {
        const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
        const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
        
        return returns1.reduce((sum, r1, i) => {
            return sum + (r1 - mean1) * (returns2[i] - mean2);
        }, 0) / returns1.length;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.metrics.sharpeRatio < 0.5) {
            recommendations.push('Consider reducing risk or finding higher-yielding opportunities');
        }

        if (this.metrics.maxDrawdown > 0.2) {
            recommendations.push('Portfolio experienced significant drawdowns - consider diversification');
        }

        if (this.metrics.winRate < 0.4) {
            recommendations.push('Low win rate detected - review strategy effectiveness');
        }

        if (this.metrics.volatility > 0.4) {
            recommendations.push('High volatility - consider position sizing and risk management');
        }

        if (recommendations.length === 0) {
            recommendations.push('Portfolio performance is within acceptable parameters');
        }

        return recommendations;
    }

    exportData(format = 'json') {
        const data = {
            metrics: this.metrics,
            historicalData: this.historicalData,
            report: this.generateReport()
        };

        if (format === 'csv') {
            return this.convertToCSV(data);
        }

        return JSON.stringify(data, null, 2);
    }

    convertToCSV(data) {
        const headers = ['timestamp', 'portfolioValue', 'returns', 'benchmark'];
        const rows = data.historicalData.map(row => 
            headers.map(header => row[header] || '').join(',')
        );
        
        return [headers.join(','), ...rows].join('\n');
    }
}

module.exports = PerformanceAnalytics;