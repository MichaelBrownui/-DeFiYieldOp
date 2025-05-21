# DeFi Yield Optimizer

A comprehensive tool for optimizing DeFi yields across multiple protocols with advanced analytics and risk management.

## Features

### Core Functionality
- **Real-time yield monitoring** across major DeFi protocols
- **Portfolio optimization** with multiple strategies
- **Advanced risk assessment** and management
- **Performance analytics** with detailed reporting
- **Backtesting engine** for strategy validation

### Supported Protocols
- Compound Finance
- Aave Protocol  
- Uniswap V2 Pools
- Curve Finance
- Yearn Vaults

### Investment Strategies
- **Conservative**: Low risk, stable returns (~2-5% APY)
- **Moderate**: Balanced risk-reward (~5-10% APY)
- **Aggressive**: Maximum yield hunting (~10%+ APY)

## Installation

```bash
# Install dependencies
npm install

# Run the main application
npm start

# Launch interactive CLI
npm run cli

# Install globally for command line usage
npm install -g .
defi-optimizer
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
# API Keys
RPC_URL=https://mainnet.infura.io/v3/your-project-id
DEFIPULSE_API_KEY=your-api-key
COINGECKO_API_KEY=your-api-key

# Risk Management
DEFAULT_RISK_TOLERANCE=medium
MIN_APY_THRESHOLD=0.02
MAX_SLIPPAGE=0.005

# Notifications
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

## Usage

### Command Line Interface

```bash
# Start interactive CLI
npm run cli

# Available commands:
help          # Show available commands
status        # System status overview
fetch         # Update protocol data
analyze       # Run strategy analysis
portfolio     # Portfolio management
risk          # Risk assessment
notify        # Notification management
report        # Generate performance report
```

### Programmatic Usage

```javascript
const { YieldOptimizer, ConfigManager } = require('defi-yield-optimizer');

const config = new ConfigManager({
  maxRiskTolerance: 0.6,
  minAPY: 0.03
});

const optimizer = new YieldOptimizer(config);
await optimizer.initialize();

const recommendation = await optimizer.getOptimalAllocation(10000);
console.log('Recommended allocation:', recommendation);
```

## Architecture

```
src/
├── index.js          # Main application entry
├── optimizer.js      # Core optimization logic
├── fetcher.js        # Protocol data fetching
├── portfolio.js      # Portfolio management
├── risk.js          # Risk assessment
├── strategies.js    # Investment strategies
├── api.js           # API integration layer
├── analytics.js     # Performance analytics
├── notifications.js # Alert system
├── backtest.js      # Strategy backtesting
└── cli.js           # Command line interface

config/
└── settings.js      # Configuration management
```

## Risk Management

The system includes comprehensive risk assessment:
- Smart contract risk scoring
- Liquidity risk evaluation  
- Volatility analysis
- Maximum drawdown monitoring
- Position size limits

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This software is for educational and research purposes. DeFi investments carry significant risks including potential total loss. Always do your own research and never invest more than you can afford to lose.