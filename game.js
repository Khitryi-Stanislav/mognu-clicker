// Game State
const gameState = {
    money: 0,
    level: 1,
    perSecond: 0,
    totalClicks: 0,
    upgrades: {}
};

// Game Configuration
const LEVELS = {
    1: {
        name: "Новичок-Могн",
        emoji: "😊",
        clickValue: 1,
        description: "Только начинаешь могнуть"
    },
    5: {
        name: "Уверенный Могн",
        emoji: "💪",
        clickValue: 2,
        description: "Уже знаешь, как это делать"
    },
    10: {
        name: "Могн-Босс",
        emoji: "🔥",
        clickValue: 5,
        description: "Никто не могнит как ты"
    },
    20: {
        name: "Могн-Магнат",
        emoji: "💰",
        clickValue: 10,
        description: "Могны текут рекой"
    },
    50: {
        name: "Космический Могн",
        emoji: "🚀",
        clickValue: 25,
        description: "Ты могнешь везде"
    },
    100: {
        name: "АБСОЛЮТНЫЙ МОГН",
        emoji: "⭐",
        clickValue: 100,
        description: "Ты легенда"
    }
};

const UPGRADE_TYPES = {
    autoClick: {
        name: "Автомогн",
        description: "Помощник, который могнит за тебя",
        baseCost: 10,
        costMultiplier: 1.15,
        incomePerSecond: 0.1,
        maxLevel: 50
    },
    superClick: {
        name: "Супер-Могн",
        description: "Каждый клик дает +50%",
        baseCost: 50,
        costMultiplier: 1.2,
        clickMultiplier: 1.5,
        maxLevel: 30
    },
    clickBoost: {
        name: "Мегамогн",
        description: "Каждый клик дает +100%",
        baseCost: 200,
        costMultiplier: 1.25,
        clickMultiplier: 2,
        maxLevel: 20
    },
    passiveIncome: {
        name: "Пассивный Могн",
        description: "Зарабатывай во сне",
        baseCost: 100,
        costMultiplier: 1.18,
        incomePerSecond: 1,
        maxLevel: 25
    }
};

// Initialize upgrades
function initUpgrades() {
    for (let type in UPGRADE_TYPES) {
        gameState.upgrades[type] = { level: 0 };
    }
}

// Get current level config
function getCurrentLevelConfig() {
    const levels = Object.keys(LEVELS).map(Number).sort((a, b) => b - a);
    for (let level of levels) {
        if (gameState.level >= level) {
            return LEVELS[level];
        }
    }
    return LEVELS[1];
}

// Calculate upgrade cost
function getUpgradeCost(type) {
    const upgrade = UPGRADE_TYPES[type];
    const level = gameState.upgrades[type].level;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}

// Calculate total click value
function getClickValue() {
    let baseValue = getCurrentLevelConfig().clickValue;
    
    if (gameState.upgrades.superClick.level > 0) {
        baseValue *= Math.pow(UPGRADE_TYPES.superClick.clickMultiplier, gameState.upgrades.superClick.level);
    }
    
    if (gameState.upgrades.clickBoost.level > 0) {
        baseValue *= Math.pow(UPGRADE_TYPES.clickBoost.clickMultiplier, gameState.upgrades.clickBoost.level);
    }
    
    return Math.floor(baseValue);
}

// Calculate passive income per second
function calculatePerSecond() {
    let perSec = 0;
    
    if (gameState.upgrades.autoClick.level > 0) {
        perSec += UPGRADE_TYPES.autoClick.incomePerSecond * gameState.upgrades.autoClick.level;
    }
    
    if (gameState.upgrades.passiveIncome.level > 0) {
        perSec += UPGRADE_TYPES.passiveIncome.incomePerSecond * gameState.upgrades.passiveIncome.level;
    }
    
    return parseFloat(perSec.toFixed(2));
}

// Update UI
function updateUI() {
    document.getElementById('money').textContent = Math.floor(gameState.money);
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('per-second').textContent = gameState.perSecond.toFixed(2);
    
    const levelConfig = getCurrentLevelConfig();
    document.getElementById('character').textContent = levelConfig.emoji;
    document.getElementById('character-name').textContent = levelConfig.name;
    
    renderUpgrades();
}

// Render upgrade buttons
function renderUpgrades() {
    const container = document.getElementById('upgrades-container');
    container.innerHTML = '';
    
    for (let type in UPGRADE_TYPES) {
        const upgrade = UPGRADE_TYPES[type];
        const level = gameState.upgrades[type].level;
        const cost = getUpgradeCost(type);
        const canAfford = gameState.money >= cost;
        const isMaxed = level >= upgrade.maxLevel;
        
        const div = document.createElement('div');
        div.className = `upgrade-item ${!canAfford || isMaxed ? 'disabled' : ''}`;
        div.onclick = () => {
            if (canAfford && !isMaxed) {
                buyUpgrade(type);
            }
        };
        
        div.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-cost">${cost} могнов</div>
            <div class="upgrade-level">Уровень: ${level}/${upgrade.maxLevel}</div>
        `;
        
        container.appendChild(div);
    }
}

// Buy upgrade
function buyUpgrade(type) {
    const cost = getUpgradeCost(type);
    if (gameState.money >= cost && gameState.upgrades[type].level < UPGRADE_TYPES[type].maxLevel) {
        gameState.money -= cost;
        gameState.upgrades[type].level++;
        gameState.perSecond = calculatePerSecond();
        updateUI();
        playSound('upgrade');
    }
}

// Handle click
function handleClick() {
    const clickValue = getClickValue();
    gameState.money += clickValue;
    gameState.totalClicks++;
    
    // Update level based on clicks
    gameState.level = Math.floor(gameState.totalClicks / 10) + 1;
    
    // Create floating text
    const rect = document.getElementById('character').getBoundingClientRect();
    createFloatingText(clickValue, rect.x + rect.width / 2, rect.y + rect.height / 2);
    
    updateUI();
    playSound('click');
}

// Create floating damage text
function createFloatingText(value, x, y) {
    const text = document.createElement('div');
    text.className = 'floating-text';
    text.textContent = `+${value}`;
    text.style.left = x + 'px';
    text.style.top = y + 'px';
    document.body.appendChild(text);
    
    setTimeout(() => text.remove(), 1000);
}

// Play sound (placeholder)
function playSound(type) {
    // Will be replaced with actual sounds
    console.log('Sound:', type);
}

// Passive income loop
function passiveIncomeLoop() {
    if (gameState.perSecond > 0) {
        gameState.money += gameState.perSecond / 10; // Update 10 times per second
        updateUI();
    }
}

// Save game
function saveGame() {
    localStorage.setItem('mognu-save', JSON.stringify(gameState));
}

// Load game
function loadGame() {
    const save = localStorage.getItem('mognu-save');
    if (save) {
        Object.assign(gameState, JSON.parse(save));
    }
    updateUI();
}

// Initialize game
function initGame() {
    initUpgrades();
    loadGame();
    
    // Event listeners
    document.getElementById('click-btn').addEventListener('click', handleClick);
    document.getElementById('character').addEventListener('click', handleClick);
    
    // Passive income
    setInterval(passiveIncomeLoop, 100);
    
    // Auto save
    setInterval(saveGame, 5000);
    
    updateUI();
}

// Start game
window.addEventListener('DOMContentLoaded', initGame);