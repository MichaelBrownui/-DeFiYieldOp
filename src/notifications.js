const axios = require('axios');

class NotificationManager {
    constructor(config) {
        this.config = config;
        this.channels = new Map();
        this.alertHistory = [];
        
        this.setupChannels();
    }

    setupChannels() {
        if (process.env.DISCORD_WEBHOOK) {
            this.channels.set('discord', {
                type: 'webhook',
                url: process.env.DISCORD_WEBHOOK,
                enabled: true
            });
        }

        if (process.env.TELEGRAM_BOT_TOKEN) {
            this.channels.set('telegram', {
                type: 'bot',
                token: process.env.TELEGRAM_BOT_TOKEN,
                chatId: process.env.TELEGRAM_CHAT_ID,
                enabled: true
            });
        }

        this.channels.set('console', {
            type: 'console',
            enabled: true
        });
    }

    async sendAlert(type, title, message, priority = 'medium') {
        const alert = {
            id: Date.now(),
            type,
            title,
            message,
            priority,
            timestamp: new Date(),
            sent: false
        };

        this.alertHistory.push(alert);

        for (const [channelName, channel] of this.channels) {
            if (!channel.enabled) continue;

            try {
                await this.sendToChannel(channelName, channel, alert);
                alert.sent = true;
            } catch (error) {
                console.error(`Failed to send alert via ${channelName}:`, error.message);
            }
        }

        return alert;
    }

    async sendToChannel(channelName, channel, alert) {
        switch (channel.type) {
            case 'webhook':
                await this.sendDiscordWebhook(channel.url, alert);
                break;
            case 'bot':
                await this.sendTelegram(channel, alert);
                break;
            case 'console':
                this.sendConsole(alert);
                break;
            default:
                console.warn(`Unknown channel type: ${channel.type}`);
        }
    }

    async sendDiscordWebhook(webhookUrl, alert) {
        const color = this.getAlertColor(alert.priority);
        const embed = {
            title: alert.title,
            description: alert.message,
            color: color,
            timestamp: alert.timestamp.toISOString(),
            footer: {
                text: 'DeFi Yield Optimizer'
            },
            fields: [
                {
                    name: 'Alert Type',
                    value: alert.type,
                    inline: true
                },
                {
                    name: 'Priority',
                    value: alert.priority.toUpperCase(),
                    inline: true
                }
            ]
        };

        await axios.post(webhookUrl, {
            embeds: [embed]
        });
    }

    async sendTelegram(channel, alert) {
        const text = `🚨 *${alert.title}*\n\n${alert.message}\n\n*Type:* ${alert.type}\n*Priority:* ${alert.priority.toUpperCase()}`;
        
        const url = `https://api.telegram.org/bot${channel.token}/sendMessage`;
        await axios.post(url, {
            chat_id: channel.chatId,
            text: text,
            parse_mode: 'Markdown'
        });
    }

    sendConsole(alert) {
        const priority = alert.priority.toUpperCase();
        const timestamp = alert.timestamp.toLocaleString();
        
        console.log(`\n[${timestamp}] ${priority} ALERT: ${alert.title}`);
        console.log(`Type: ${alert.type}`);
        console.log(`Message: ${alert.message}`);
        console.log('---');
    }

    getAlertColor(priority) {
        const colors = {
            low: 0x00FF00,      // Green
            medium: 0xFFFF00,   // Yellow
            high: 0xFF0000,     // Red
            critical: 0x8B0000  // Dark Red
        };
        return colors[priority] || colors.medium;
    }

    // Alert types for different scenarios
    async alertYieldChange(protocol, oldYield, newYield) {
        const change = ((newYield - oldYield) / oldYield * 100).toFixed(2);
        const priority = Math.abs(change) > 20 ? 'high' : 'medium';
        
        await this.sendAlert(
            'yield_change',
            `Yield Change Detected: ${protocol}`,
            `${protocol} yield changed from ${(oldYield * 100).toFixed(2)}% to ${(newYield * 100).toFixed(2)}% (${change > 0 ? '+' : ''}${change}%)`,
            priority
        );
    }

    async alertRiskIncrease(protocol, riskScore) {
        await this.sendAlert(
            'risk_alert',
            `Risk Level Increased: ${protocol}`,
            `${protocol} risk score increased to ${(riskScore * 100).toFixed(1)}%. Consider reducing exposure.`,
            'high'
        );
    }

    async alertRebalanceNeeded(portfolioWeights, targetWeights) {
        const drifts = portfolioWeights.map((current, i) => {
            const target = targetWeights[i] || { weight: 0 };
            return {
                protocol: current.protocol,
                drift: Math.abs(current.weight - target.weight)
            };
        }).filter(d => d.drift > 0.1);

        if (drifts.length > 0) {
            const message = drifts.map(d => 
                `${d.protocol}: ${(d.drift * 100).toFixed(1)}% drift`
            ).join('\n');

            await this.sendAlert(
                'rebalance',
                'Portfolio Rebalancing Needed',
                `The following positions have drifted significantly:\n${message}`,
                'medium'
            );
        }
    }

    async alertPriceImpact(protocol, expectedPrice, actualPrice) {
        const impact = Math.abs((actualPrice - expectedPrice) / expectedPrice * 100);
        
        if (impact > 2) {
            await this.sendAlert(
                'price_impact',
                `High Price Impact: ${protocol}`,
                `Expected price impact: ${impact.toFixed(2)}%. Consider adjusting position size.`,
                'medium'
            );
        }
    }

    async alertPerformanceReport(metrics) {
        const message = `
Portfolio Performance Summary:
• Total Returns: ${(metrics.totalReturns * 100).toFixed(2)}%
• Sharpe Ratio: ${metrics.sharpeRatio.toFixed(3)}
• Max Drawdown: ${(metrics.maxDrawdown * 100).toFixed(2)}%
• Win Rate: ${(metrics.winRate * 100).toFixed(1)}%`;

        await this.sendAlert(
            'performance_report',
            'Weekly Performance Report',
            message,
            'low'
        );
    }

    getAlertHistory(limit = 50) {
        return this.alertHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    clearHistory() {
        this.alertHistory = [];
    }

    enableChannel(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            channel.enabled = true;
        }
    }

    disableChannel(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            channel.enabled = false;
        }
    }

    getChannelStatus() {
        const status = {};
        for (const [name, channel] of this.channels) {
            status[name] = {
                type: channel.type,
                enabled: channel.enabled
            };
        }
        return status;
    }
}

module.exports = NotificationManager;