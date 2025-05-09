class PortfolioManager {
    constructor() {
        this.positions = [];
        this.totalValue = 0;
        this.rebalanceThreshold = 0.1;
    }

    addPosition(protocol, amount, entryPrice) {
        const position = {
            id: Date.now(),
            protocol,
            amount,
            entryPrice,
            currentValue: amount * entryPrice,
            timestamp: new Date()
        };
        
        this.positions.push(position);
        this.updateTotalValue();
        console.log(`Added position: ${amount} in ${protocol.name}`);
    }

    removePosition(positionId) {
        this.positions = this.positions.filter(pos => pos.id !== positionId);
        this.updateTotalValue();
    }

    updateTotalValue() {
        this.totalValue = this.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    }

    getPositionsByProtocol(protocolName) {
        return this.positions.filter(pos => pos.protocol.name === protocolName);
    }

    calculateWeights() {
        return this.positions.map(pos => ({
            protocol: pos.protocol.name,
            weight: pos.currentValue / this.totalValue,
            value: pos.currentValue
        }));
    }

    needsRebalancing(targetWeights) {
        const currentWeights = this.calculateWeights();
        
        for (const target of targetWeights) {
            const current = currentWeights.find(w => w.protocol === target.protocol);
            const currentWeight = current ? current.weight : 0;
            
            if (Math.abs(currentWeight - target.weight) > this.rebalanceThreshold) {
                return true;
            }
        }
        
        return false;
    }
}

module.exports = PortfolioManager;