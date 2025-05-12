const defaultSettings = {
    // Risk settings
    maxRiskTolerance: 0.7,
    minAPY: 0.02,
    maxSlippage: 0.005,
    rebalanceThreshold: 0.1,
    
    // Portfolio settings
    maxPositions: 10,
    minPositionSize: 100,
    maxSingleProtocolAllocation: 0.4,
    
    // Update intervals
    priceUpdateInterval: 300000, // 5 minutes
    protocolDataUpdateInterval: 3600000, // 1 hour
    
    // Default protocols to monitor
    defaultProtocols: [
        'compound',
        'aave',
        'uniswap-v2',
        'curve',
        'yearn'
    ],
    
    // Network settings
    defaultNetwork: 'mainnet',
    rpcTimeout: 30000,
    
    // Notification settings
    enableNotifications: false,
    notificationThreshold: 0.05,
    
    // API limits
    maxApiCalls: 1000,
    apiCallWindow: 3600000,
    
    // Security
    requireConfirmation: true,
    enableTestMode: false
};

class ConfigManager {
    constructor(userConfig = {}) {
        this.config = { ...defaultSettings, ...userConfig };
        this.validate();
    }
    
    get(key) {
        return this.config[key];
    }
    
    set(key, value) {
        this.config[key] = value;
        this.validate();
    }
    
    validate() {
        if (this.config.maxRiskTolerance < 0 || this.config.maxRiskTolerance > 1) {
            throw new Error('maxRiskTolerance must be between 0 and 1');
        }
        
        if (this.config.minAPY < 0) {
            throw new Error('minAPY must be positive');
        }
        
        if (this.config.maxSlippage < 0 || this.config.maxSlippage > 0.1) {
            throw new Error('maxSlippage must be between 0 and 0.1');
        }
    }
    
    getAll() {
        return { ...this.config };
    }
}

module.exports = { ConfigManager, defaultSettings };