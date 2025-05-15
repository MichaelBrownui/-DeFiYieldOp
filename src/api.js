const axios = require('axios');

class APIManager {
    constructor() {
        this.apiLimits = new Map();
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        this.endpoints = {
            coingecko: 'https://api.coingecko.com/api/v3',
            defipulse: 'https://data-api.defipulse.com/api/v1',
            thegraph: 'https://api.thegraph.com/subgraphs/name',
            etherscan: 'https://api.etherscan.io/api'
        };
    }

    async makeRequest(url, options = {}) {
        const cacheKey = `${url}:${JSON.stringify(options)}`;
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            await this.checkRateLimit(url);
            const response = await axios.get(url, options);
            
            this.setCache(cacheKey, response.data);
            this.updateRateLimit(url);
            
            return response.data;
        } catch (error) {
            console.error(`API request failed for ${url}:`, error.message);
            throw error;
        }
    }

    async fetchTokenPrice(tokenId) {
        const url = `${this.endpoints.coingecko}/simple/price`;
        const params = {
            ids: tokenId,
            vs_currencies: 'usd',
            include_24hr_change: true
        };

        try {
            const data = await this.makeRequest(url, { params });
            return {
                price: data[tokenId]?.usd || 0,
                change24h: data[tokenId]?.usd_24h_change || 0
            };
        } catch (error) {
            console.error(`Failed to fetch price for ${tokenId}:`, error);
            return { price: 0, change24h: 0 };
        }
    }

    async fetchProtocolTVL(protocolId) {
        const url = `${this.endpoints.defipulse}/projects/${protocolId}`;
        
        try {
            const data = await this.makeRequest(url);
            return {
                tvl: data.value?.tvl?.USD || 0,
                change24h: data.value?.tvl?.USD_change_24h || 0,
                chains: data.chains || []
            };
        } catch (error) {
            console.error(`Failed to fetch TVL for ${protocolId}:`, error);
            return { tvl: 0, change24h: 0, chains: [] };
        }
    }

    async fetchUniswapPools() {
        const query = `
        {
            pairs(first: 50, orderBy: volumeUSD, orderDirection: desc) {
                id
                token0 { symbol }
                token1 { symbol }
                reserve0
                reserve1
                reserveUSD
                volumeUSD
                apy: dailyVolumeUSD
            }
        }`;

        try {
            const url = `${this.endpoints.thegraph}/uniswap/uniswap-v2`;
            const response = await axios.post(url, { query });
            
            return response.data.data.pairs.map(pair => ({
                name: `${pair.token0.symbol}-${pair.token1.symbol}`,
                protocol: 'Uniswap V2',
                tvl: parseFloat(pair.reserveUSD),
                volume24h: parseFloat(pair.volumeUSD),
                apy: this.calculateLPAPY(pair.volumeUSD, pair.reserveUSD),
                audited: true,
                ageInDays: 365
            }));
        } catch (error) {
            console.error('Failed to fetch Uniswap data:', error);
            return [];
        }
    }

    calculateLPAPY(volume24h, tvl) {
        if (tvl === 0) return 0;
        const feeRate = 0.003; // 0.3% fee
        const dailyFees = volume24h * feeRate;
        const annualFees = dailyFees * 365;
        return annualFees / tvl;
    }

    async fetchGasPrice() {
        const url = `${this.endpoints.etherscan}`;
        const params = {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'
        };

        try {
            const data = await this.makeRequest(url, { params });
            return {
                standard: parseInt(data.result.SafeGasPrice),
                fast: parseInt(data.result.ProposeGasPrice),
                fastest: parseInt(data.result.FastGasPrice)
            };
        } catch (error) {
            console.error('Failed to fetch gas prices:', error);
            return { standard: 20, fast: 25, fastest: 30 };
        }
    }

    checkRateLimit(url) {
        const domain = new URL(url).hostname;
        const limit = this.apiLimits.get(domain);
        
        if (!limit) return Promise.resolve();
        
        const now = Date.now();
        const timeSinceLastCall = now - limit.lastCall;
        const minInterval = limit.interval || 1000;
        
        if (timeSinceLastCall < minInterval) {
            const delay = minInterval - timeSinceLastCall;
            return new Promise(resolve => setTimeout(resolve, delay));
        }
        
        return Promise.resolve();
    }

    updateRateLimit(url) {
        const domain = new URL(url).hostname;
        this.apiLimits.set(domain, {
            lastCall: Date.now(),
            interval: this.getRateLimitInterval(domain)
        });
    }

    getRateLimitInterval(domain) {
        const intervals = {
            'api.coingecko.com': 1000,
            'data-api.defipulse.com': 2000,
            'api.thegraph.com': 500,
            'api.etherscan.io': 200
        };
        return intervals[domain] || 1000;
    }

    getFromCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = APIManager;