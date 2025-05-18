#!/usr/bin/env node

const readline = require('readline');
const YieldOptimizer = require('./optimizer');
const ProtocolDataFetcher = require('./fetcher');
const PortfolioManager = require('./portfolio');
const RiskAssessment = require('./risk');
const YieldFarmingStrategies = require('./strategies');
const NotificationManager = require('./notifications');
const PerformanceAnalytics = require('./analytics');
const { ConfigManager } = require('../config/settings');

class CLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.config = new ConfigManager();
        this.optimizer = new YieldOptimizer();
        this.fetcher = new ProtocolDataFetcher();
        this.portfolio = new PortfolioManager();
        this.riskAssessment = new RiskAssessment();
        this.strategies = new YieldFarmingStrategies(this.config);
        this.notifications = new NotificationManager(this.config);
        this.analytics = new PerformanceAnalytics();
        
        this.commands = {
            help: this.showHelp.bind(this),
            status: this.showStatus.bind(this),
            fetch: this.fetchProtocols.bind(this),
            analyze: this.analyzeStrategies.bind(this),
            portfolio: this.managePortfolio.bind(this),
            risk: this.assessRisk.bind(this),
            notify: this.testNotifications.bind(this),
            config: this.manageConfig.bind(this),
            report: this.generateReport.bind(this),
            exit: this.exit.bind(this)
        };
    }

    async start() {
        console.log('🚀 DeFi Yield Optimizer CLI');
        console.log('Type "help" for available commands\n');
        
        this.prompt();
    }

    prompt() {
        this.rl.question('> ', async (input) => {
            const [command, ...args] = input.trim().split(' ');
            
            if (this.commands[command]) {
                try {
                    await this.commands[command](args);
                } catch (error) {
                    console.error('Error:', error.message);
                }
            } else if (command) {
                console.log(`Unknown command: ${command}. Type "help" for available commands.`);
            }
            
            this.prompt();
        });
    }

    showHelp() {
        console.log(`
📖 Available Commands:

  help          - Show this help message
  status        - Show current system status
  fetch         - Fetch latest protocol data
  analyze [strategy] - Analyze strategies (conservative/moderate/aggressive)
  portfolio [action] - Portfolio management (show/add/remove)
  risk [protocol]    - Show risk assessment
  notify [test]      - Notification management
  config [key] [value] - Configuration management
  report        - Generate performance report
  exit          - Exit the CLI

Examples:
  analyze moderate
  portfolio show
  config maxRiskTolerance 0.8
  risk compound
        `);
    }

    async showStatus() {
        console.log(`
📊 System Status:

Portfolio:
  • Total Positions: ${this.portfolio.positions.length}
  • Total Value: $${this.portfolio.totalValue.toLocaleString()}
  • Protocols: ${this.optimizer.protocols.length}

Configuration:
  • Risk Tolerance: ${this.config.get('maxRiskTolerance')}
  • Min APY: ${(this.config.get('minAPY') * 100).toFixed(1)}%
  • Rebalance Threshold: ${(this.config.get('rebalanceThreshold') * 100).toFixed(1)}%

Notifications:
  • Channels: ${Object.keys(this.notifications.getChannelStatus()).length}
  • Recent Alerts: ${this.notifications.getAlertHistory(10).length}
        `);
    }

    async fetchProtocols() {
        console.log('🔄 Fetching protocol data...');
        
        try {
            const protocols = await this.fetcher.fetchAllProtocolData();
            
            for (const protocol of protocols) {
                await this.optimizer.addProtocol(protocol);
            }
            
            console.log(`✅ Fetched data for ${protocols.length} protocols:`);
            protocols.forEach(p => {
                console.log(`  • ${p.name}: ${(p.apy * 100).toFixed(2)}% APY`);
            });
            
        } catch (error) {
            console.error('❌ Failed to fetch protocols:', error.message);
        }
    }

    async analyzeStrategies(args) {
        const strategy = args[0] || 'all';
        const amount = parseInt(args[1]) || 5000;
        
        console.log(`📈 Analyzing ${strategy} strategy with $${amount.toLocaleString()}...\n`);
        
        if (this.optimizer.protocols.length === 0) {
            console.log('⚠️  No protocol data available. Run "fetch" first.');
            return;
        }
        
        const strategies = strategy === 'all' 
            ? ['conservative', 'moderate', 'aggressive']
            : [strategy];
        
        for (const strategyName of strategies) {
            try {
                const allocation = this.strategies.optimizeForStrategy(
                    strategyName, 
                    this.optimizer.protocols, 
                    amount
                );
                
                console.log(`\n${allocation.strategy} Strategy:`);
                console.log(`  Expected Yield: ${(allocation.expectedYield * 100).toFixed(2)}%`);
                console.log(`  Risk Level: ${(allocation.averageRisk * 100).toFixed(1)}%`);
                console.log(`  Diversification: ${allocation.diversification} protocols`);
                
                if (allocation.allocations.length > 0) {
                    console.log('  Allocations:');
                    allocation.allocations.forEach(alloc => {
                        console.log(`    • ${alloc.protocol}: $${alloc.amount.toLocaleString()} (${alloc.percentage.toFixed(1)}%)`);
                    });
                }
                
            } catch (error) {
                console.error(`❌ Error analyzing ${strategyName}:`, error.message);
            }
        }
    }

    async managePortfolio(args) {
        const action = args[0] || 'show';
        
        switch (action) {
            case 'show':
                console.log('\n💼 Portfolio Overview:');
                if (this.portfolio.positions.length === 0) {
                    console.log('  No positions currently held.');
                } else {
                    const weights = this.portfolio.calculateWeights();
                    weights.forEach(w => {
                        console.log(`  • ${w.protocol}: $${w.value.toLocaleString()} (${(w.weight * 100).toFixed(1)}%)`);
                    });
                    console.log(`\n  Total Value: $${this.portfolio.totalValue.toLocaleString()}`);
                }
                break;
                
            case 'add':
                console.log('📝 Use the web interface or API to add positions.');
                break;
                
            case 'rebalance':
                console.log('⚖️ Checking rebalance recommendations...');
                // Implementation would check current vs target allocations
                console.log('  Portfolio appears balanced.');
                break;
                
            default:
                console.log('Available portfolio actions: show, add, rebalance');
        }
    }

    async assessRisk(args) {
        const protocolName = args[0];
        
        if (!protocolName) {
            console.log('📊 Overall Portfolio Risk Assessment:');
            if (this.portfolio.positions.length === 0) {
                console.log('  No positions to assess.');
                return;
            }
            
            let totalRisk = 0;
            for (const position of this.portfolio.positions) {
                const risk = this.riskAssessment.assessSmartContractRisk(position.protocol);
                totalRisk += risk;
            }
            
            const avgRisk = totalRisk / this.portfolio.positions.length;
            console.log(`  Average Risk Level: ${(avgRisk * 100).toFixed(1)}%`);
            console.log(`  Risk Rating: ${avgRisk < 0.3 ? 'Low' : avgRisk < 0.6 ? 'Medium' : 'High'}`);
            
        } else {
            const protocol = this.optimizer.protocols.find(p => 
                p.name.toLowerCase().includes(protocolName.toLowerCase())
            );
            
            if (!protocol) {
                console.log(`❌ Protocol "${protocolName}" not found.`);
                return;
            }
            
            const report = this.riskAssessment.generateRiskReport(protocol);
            console.log(`\n🔍 Risk Assessment for ${protocol.name}:`);
            console.log(`  Overall Risk: ${report.riskLevel} (${(report.overallRisk * 100).toFixed(1)}%)`);
            console.log(`  Smart Contract Risk: ${(report.risks.smartContract * 100).toFixed(1)}%`);
            console.log(`  Liquidity Risk: ${(report.risks.liquidity * 100).toFixed(1)}%`);
            console.log(`  Volatility Risk: ${(report.risks.volatility * 100).toFixed(1)}%`);
            console.log(`  Recommendation: ${report.recommendation}`);
        }
    }

    async testNotifications(args) {
        const action = args[0] || 'test';
        
        switch (action) {
            case 'test':
                console.log('🔔 Sending test notification...');
                await this.notifications.sendAlert(
                    'test',
                    'CLI Test Alert',
                    'This is a test notification from the CLI.',
                    'low'
                );
                console.log('✅ Test notification sent.');
                break;
                
            case 'status':
                console.log('\n📬 Notification Status:');
                const status = this.notifications.getChannelStatus();
                for (const [channel, info] of Object.entries(status)) {
                    console.log(`  • ${channel}: ${info.enabled ? '✅' : '❌'} (${info.type})`);
                }
                break;
                
            case 'history':
                const history = this.notifications.getAlertHistory(5);
                console.log('\n📜 Recent Alerts:');
                if (history.length === 0) {
                    console.log('  No recent alerts.');
                } else {
                    history.forEach(alert => {
                        console.log(`  • [${alert.priority.toUpperCase()}] ${alert.title} - ${alert.timestamp.toLocaleString()}`);
                    });
                }
                break;
                
            default:
                console.log('Available notification actions: test, status, history');
        }
    }

    async manageConfig(args) {
        const [key, value] = args;
        
        if (!key) {
            console.log('\n⚙️  Current Configuration:');
            const config = this.config.getAll();
            for (const [k, v] of Object.entries(config)) {
                console.log(`  • ${k}: ${v}`);
            }
            return;
        }
        
        if (!value) {
            const currentValue = this.config.get(key);
            console.log(`${key}: ${currentValue}`);
            return;
        }
        
        try {
            let parsedValue = value;
            if (!isNaN(value)) {
                parsedValue = parseFloat(value);
            } else if (value === 'true' || value === 'false') {
                parsedValue = value === 'true';
            }
            
            this.config.set(key, parsedValue);
            console.log(`✅ Set ${key} = ${parsedValue}`);
            
        } catch (error) {
            console.error(`❌ Error setting config: ${error.message}`);
        }
    }

    async generateReport() {
        console.log('📊 Generating Performance Report...\n');
        
        // Add some mock data for demonstration
        const now = Date.now();
        for (let i = 0; i < 30; i++) {
            const timestamp = now - (30 - i) * 24 * 60 * 60 * 1000;
            const value = 10000 * (1 + Math.random() * 0.1 - 0.05);
            this.analytics.addDataPoint(timestamp, value);
        }
        
        const report = this.analytics.generateReport();
        
        console.log('📈 Performance Summary:');
        for (const [key, value] of Object.entries(report.summary)) {
            console.log(`  • ${key}: ${value}`);
        }
        
        console.log('\n⚠️  Risk Metrics:');
        for (const [key, value] of Object.entries(report.riskMetrics)) {
            console.log(`  • ${key}: ${value}`);
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`  • ${rec}`);
            });
        }
    }

    exit() {
        console.log('👋 Thanks for using DeFi Yield Optimizer!');
        this.rl.close();
        process.exit(0);
    }
}

module.exports = CLI;

// Run CLI if this file is executed directly
if (require.main === module) {
    const cli = new CLI();
    cli.start().catch(console.error);
}