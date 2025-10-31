/**
 * 前端延迟配置文件
 * Frontend Timing Configuration
 */

// 从后端配置加载的延迟配置
const TIMING_CONFIG = {
    // 游戏流程延迟 (毫秒)
    ACTION_DELAY: 2000,           // 基础动作延迟
    DEBATE_DELAY: 3000,           // 发言延迟
    NIGHT_ACTION_DELAY: 5000,     // 夜间行动延迟
    SUMMARY_DELAY: 3000,          // 总结延迟

    // 前端刷新间隔 (毫秒)
    FRONTEND_REFRESH_INTERVAL: 5000,        // 界面刷新间隔
    GAME_STATUS_REFRESH_INTERVAL: 2000,     // 游戏状态检查间隔

    // 动画和UI延迟 (毫秒)
    UI_ANIMATION_DELAY: 300,              // UI动画效果延迟
    MESSAGE_DISPLAY_DELAY: 1000,          // 消息显示延迟
    PAGE_TRANSITION_DELAY: 500,           // 页面切换延迟

    // API和网络配置
    API_REQUEST_TIMEOUT: 30000,           // API请求超时 (毫秒)
    RETRY_DELAY: 2000,                    // 重试延迟 (毫秒)
    HEARTBEAT_INTERVAL: 30000,            // 心跳间隔 (毫秒)

    // 开发调试配置 (毫秒)
    DEV_FAST_REFRESH: 1000,               // 开发模式快速刷新
    DEBUG_INFO_INTERVAL: 500,             // 调试信息显示间隔

    // 特殊游戏模式倍数
    FAST_GAME_MULTIPLIER: 0.5,            // 快速游戏延迟倍数
    SLOW_GAME_MULTIPLIER: 2.0,            // 慢速游戏延迟倍数
    DEMO_MODE_MULTIPLIER: 1.5,            // 演示模式延迟倍数
};

/**
 * 延迟配置管理类
 */
class TimingManager {
    constructor() {
        this.gameMode = 'normal'; // normal, fast, slow, demo
        this.multiplier = 1.0;
        this.loadConfig();
    }

    /**
     * 从API加载延迟配置
     */
    async loadConfig() {
        try {
            // v1系统不支持此API端点，使用默认配置
            console.log('✅ 使用默认延迟配置 (v1系统)');
        } catch (error) {
            console.warn('⚠️ 无法加载服务器延迟配置，使用默认配置', error);
        }
    }

    /**
     * 设置游戏模式
     * @param {string} mode - 游戏模式 (normal, fast, slow, demo)
     */
    setGameMode(mode) {
        const multipliers = {
            'normal': 1.0,
            'fast': TIMING_CONFIG.FAST_GAME_MULTIPLIER,
            'slow': TIMING_CONFIG.SLOW_GAME_MULTIPLIER,
            'demo': TIMING_CONFIG.DEMO_MODE_MULTIPLIER
        };

        this.gameMode = mode;
        this.multiplier = multipliers[mode] || 1.0;
        console.log(`🎮 游戏模式设置为 ${mode}，延迟倍数: ${this.multiplier}x`);
    }

    /**
     * 获取延迟时间
     * @param {string} delayType - 延迟类型
     * @param {number} customMultiplier - 自定义倍数
     * @returns {number} 延迟时间（毫秒）
     */
    getDelay(delayType, customMultiplier = null) {
        const configKey = delayType.toUpperCase() + '_DELAY';
        const baseDelay = TIMING_CONFIG[configKey] || 1000;
        const multiplier = customMultiplier !== null ? customMultiplier : this.multiplier;
        return Math.max(baseDelay * multiplier, 100); // 最小100ms延迟
    }

    /**
     * 获取间隔时间
     * @param {string} intervalType - 间隔类型
     * @returns {number} 间隔时间（毫秒）
     */
    getInterval(intervalType) {
        const configKey = intervalType.toUpperCase() + '_INTERVAL';
        return TIMING_CONFIG[configKey] || 1000;
    }

    /**
     * 延迟执行函数
     * @param {Function} callback - 回调函数
     * @param {string} delayType - 延迟类型
     * @param {number} customMultiplier - 自定义倍数
     * @returns {Promise} Promise对象
     */
    async delay(callback, delayType = 'action', customMultiplier = null) {
        const delayTime = this.getDelay(delayType, customMultiplier);
        return new Promise(resolve => {
            setTimeout(() => {
                if (callback) callback();
                resolve();
            }, delayTime);
        });
    }

    /**
     * 创建节流函数
     * @param {Function} func - 要节流的函数
     * @param {string} intervalType - 间隔类型
     * @returns {Function} 节流后的函数
     */
    throttle(func, intervalType = 'frontend_refresh') {
        const interval = this.getInterval(intervalType);
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= interval) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }

    /**
     * 创建防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {string} delayType - 延迟类型
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delayType = 'message_display') {
        const delay = this.getDelay(delayType);
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * 获取当前配置摘要
     * @returns {Object} 配置摘要
     */
    getConfigSummary() {
        return {
            gameMode: this.gameMode,
            multiplier: this.multiplier,
            currentDelays: {
                action: this.getDelay('action'),
                debate: this.getDelay('debate'),
                night_action: this.getDelay('night_action'),
                summary: this.getDelay('summary')
            },
            currentIntervals: {
                frontend_refresh: this.getInterval('frontend_refresh'),
                game_status: this.getInterval('game_status')
            }
        };
    }
}

// 创建全局延迟管理器实例
window.timingManager = new TimingManager();

// 向后兼容的全局函数
window.getDelay = (type, multiplier = null) => window.timingManager.getDelay(type, multiplier);
window.getInterval = (type) => window.timingManager.getInterval(type);
window.setGameMode = (mode) => window.timingManager.setGameMode(mode);

// 导出配置（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TIMING_CONFIG, TimingManager };
}