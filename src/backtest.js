class BacktestEngine {
    constructor(strategies, historicalData) {
        this.strategies = strategies;
        this.historicalData = historicalData;
        this.results = new Map();
    }

    async runBacktest(strategy, startDate, endDate, initialCapital = 10000) {
        console.log(`Running backtest for ${strategy} strategy...`);
        
        const filteredData = this.filterDataByDate(startDate, endDate);
        const positions = [];
        let currentCapital = initialCapital;
        let portfolio = {};
        
        const results = {
            strategy,
            initialCapital,
            finalCapital: 0,
            totalReturn: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            trades: [],
            dailyReturns: [],
            portfolioHistory: []
        };

        for (let i = 0; i < filteredData.length; i++) {
            const currentData = filteredData[i];
            const date = new Date(currentData.timestamp);
            
            // Strategy decision making
            const decision = this.makeStrategyDecision(strategy, currentData, portfolio);
            
            if (decision.action === 'buy') {
                const trade = this.executeBuy(decision.protocol, decision.amount, currentData.prices);
                if (trade) {
                    positions.push(trade);
                    currentCapital -= trade.cost;
                    portfolio[decision.protocol] = (portfolio[decision.protocol] || 0) + trade.amount;
                    results.trades.push({ ...trade, date, type: 'buy' });
                }
            } else if (decision.action === 'sell') {
                const trade = this.executeSell(decision.protocol, decision.amount, currentData.prices);
                if (trade) {
                    currentCapital += trade.proceeds;
                    portfolio[decision.protocol] -= trade.amount;
                    results.trades.push({ ...trade, date, type: 'sell' });
                }
            }
            
            // Calculate portfolio value
            const portfolioValue = this.calculatePortfolioValue(portfolio, currentData.prices);
            const totalValue = currentCapital + portfolioValue;
            
            results.portfolioHistory.push({
                date,
                capital: currentCapital,
                portfolioValue,
                totalValue
            });
            
            // Calculate daily return
            if (i > 0) {
                const previousValue = results.portfolioHistory[i - 1].totalValue;
                const dailyReturn = (totalValue - previousValue) / previousValue;
                results.dailyReturns.push(dailyReturn);
            }
        }
        
        // Final calculations
        const lastPortfolioValue = results.portfolioHistory[results.portfolioHistory.length - 1];
        results.finalCapital = lastPortfolioValue.totalValue;
        results.totalReturn = (results.finalCapital - initialCapital) / initialCapital;
        results.maxDrawdown = this.calculateMaxDrawdown(results.portfolioHistory);
        results.sharpeRatio = this.calculateSharpeRatio(results.dailyReturns);
        
        this.results.set(strategy, results);
        return results;
    }

    makeStrategyDecision(strategyName, marketData, currentPortfolio) {
        const strategyConfig = this.strategies.getStrategy(strategyName);
        if (!strategyConfig) return { action: 'hold' };

        // Simple momentum strategy implementation
        if (marketData.signals && marketData.signals.momentum > 0.05) {
            const bestProtocol = this.findBestProtocol(marketData.protocols, strategyConfig);
            if (bestProtocol && bestProtocol.apy > strategyConfig.minAPY) {
                return {
                    action: 'buy',
                    protocol: bestProtocol.name,
                    amount: Math.min(1000, this.getAvailableCapital() * 0.1)
                };
            }
        }
        
        // Risk management - sell if risk too high
        for (const [protocol, amount] of Object.entries(currentPortfolio)) {
            const protocolData = marketData.protocols.find(p => p.name === protocol);
            if (protocolData && this.assessRisk(protocolData) > strategyConfig.riskTolerance) {
                return {
                    action: 'sell',
                    protocol,
                    amount: amount * 0.5 // Sell half
                };
            }
        }

        return { action: 'hold' };
    }

    findBestProtocol(protocols, strategyConfig) {
        return protocols
            .filter(p => strategyConfig.preferredProtocols.includes(p.protocol.toLowerCase()))
            .filter(p => p.apy >= strategyConfig.minAPY)
            .sort((a, b) => {
                const aScore = a.apy * (1 - this.assessRisk(a));
                const bScore = b.apy * (1 - this.assessRisk(b));
                return bScore - aScore;
            })[0];
    }

    assessRisk(protocol) {
        let risk = 0.3; // Base risk
        if (!protocol.audited) risk += 0.2;
        if (protocol.ageInDays < 90) risk += 0.3;
        if (protocol.tvl < 10000000) risk += 0.2;
        return Math.min(1, risk);
    }

    executeBuy(protocol, amount, prices) {
        const price = prices[protocol] || 1;
        const cost = amount * price;
        
        return {
            protocol,
            amount,
            price,
            cost,
            timestamp: Date.now()
        };
    }

    executeSell(protocol, amount, prices) {
        const price = prices[protocol] || 1;
        const proceeds = amount * price;
        
        return {
            protocol,
            amount,
            price,
            proceeds,
            timestamp: Date.now()
        };
    }

    calculatePortfolioValue(portfolio, prices) {
        let totalValue = 0;
        
        for (const [protocol, amount] of Object.entries(portfolio)) {
            const price = prices[protocol] || 1;
            totalValue += amount * price;
        }
        
        return totalValue;
    }

    calculateMaxDrawdown(portfolioHistory) {
        let maxDrawdown = 0;
        let peak = portfolioHistory[0]?.totalValue || 0;
        
        for (const entry of portfolioHistory) {
            if (entry.totalValue > peak) {
                peak = entry.totalValue;
            }
            
            const drawdown = (peak - entry.totalValue) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        
        return maxDrawdown;
    }

    calculateSharpeRatio(dailyReturns) {
        if (dailyReturns.length === 0) return 0;
        
        const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
        const riskFreeRate = 0.02 / 365; // Daily risk-free rate
        const excessReturn = avgReturn - riskFreeRate;
        
        const variance = dailyReturns.reduce((sum, r) => {
            return sum + Math.pow(r - avgReturn, 2);
        }, 0) / dailyReturns.length;
        
        const volatility = Math.sqrt(variance);
        return volatility === 0 ? 0 : excessReturn / volatility * Math.sqrt(365);
    }

    filterDataByDate(startDate, endDate) {
        return this.historicalData.filter(data => {
            const timestamp = new Date(data.timestamp);
            return timestamp >= startDate && timestamp <= endDate;
        });
    }

    compareStrategies() {
        const comparison = [];
        
        for (const [strategy, results] of this.results) {
            comparison.push({
                strategy,
                totalReturn: results.totalReturn,
                maxDrawdown: results.maxDrawdown,
                sharpeRatio: results.sharpeRatio,
                trades: results.trades.length,
                finalValue: results.finalCapital
            });
        }
        
        return comparison.sort((a, b) => b.totalReturn - a.totalReturn);
    }

    generateReport(strategy) {
        const results = this.results.get(strategy);
        if (!results) return null;

        return {
            strategy: results.strategy,
            performance: {
                initialCapital: results.initialCapital,
                finalCapital: results.finalCapital,
                totalReturn: `${(results.totalReturn * 100).toFixed(2)}%`,
                maxDrawdown: `${(results.maxDrawdown * 100).toFixed(2)}%`,
                sharpeRatio: results.sharpeRatio.toFixed(3)
            },
            trading: {
                totalTrades: results.trades.length,
                avgTradeSize: results.trades.length > 0 
                    ? (results.trades.reduce((sum, t) => sum + (t.cost || t.proceeds || 0), 0) / results.trades.length).toFixed(2)
                    : '0',
                winRate: this.calculateWinRate(results.trades)
            },
            timeline: results.portfolioHistory.length
        };
    }

    calculateWinRate(trades) {
        if (trades.length === 0) return '0%';
        
        const winningTrades = trades.filter(trade => {
            if (trade.type === 'sell') {
                // Find corresponding buy trade to calculate profit
                return trade.proceeds > trade.cost;
            }
            return false;
        });
        
        return `${(winningTrades.length / trades.length * 100).toFixed(1)}%`;
    }

    exportResults(format = 'json') {
        const allResults = {};
        
        for (const [strategy, results] of this.results) {
            allResults[strategy] = this.generateReport(strategy);
        }
        
        if (format === 'csv') {
            return this.convertToCSV(allResults);
        }
        
        return JSON.stringify(allResults, null, 2);
    }

    convertToCSV(results) {
        const headers = ['Strategy', 'Total Return', 'Max Drawdown', 'Sharpe Ratio', 'Total Trades'];
        const rows = Object.entries(results).map(([strategy, data]) => [
            strategy,
            data.performance.totalReturn,
            data.performance.maxDrawdown,
            data.performance.sharpeRatio,
            data.trading.totalTrades
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
}

module.exports = BacktestEngine;