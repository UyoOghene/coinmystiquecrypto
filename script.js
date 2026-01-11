// Configuration
const CONFIG = {
    apiBase: 'https://api.coingecko.com/api/v3',
    updateInterval: 30000, // 30 seconds
    defaultCoins: ['bitcoin', 'ethereum', 'litecoin'],
    currencySymbols: {
        usd: '$',
        gbp: '£',
        ngn: '₦'
    },
    currencyNames: {
        usd: 'US Dollar',
        gbp: 'British Pound',
        ngn: 'Nigerian Naira'
    }
};

// State Management
let state = {
    selectedCoins: new Set(CONFIG.defaultCoins),
    selectedCurrency: 'usd',
    autoUpdateInterval: null,
    priceData: {},
    priceHistory: {},
    marketData: {},
    chart: null,
    theme: 'light'
};

// DOM Elements
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    currencySelect: document.getElementById('currencySelect'),
    coinSelect: document.getElementById('coinSelect'),
    coinSearch: document.getElementById('coinSearch'),
    searchCoinBtn: document.getElementById('searchCoinBtn'),
    searchResult: document.getElementById('searchResult'),
    fetchAllBtn: document.getElementById('fetchAllBtn'),
    startAutoBtn: document.getElementById('startAutoBtn'),
    stopAutoBtn: document.getElementById('stopAutoBtn'),
    priceGrid: document.getElementById('priceGrid'),
    updateStatus: document.getElementById('updateStatus'),
    chartCoinSelect: document.getElementById('chartCoinSelect'),
    chartInterval: document.getElementById('chartInterval'),
    priceChart: document.getElementById('priceChart'),
    totalMarketCap: document.getElementById('totalMarketCap'),
    totalVolume: document.getElementById('totalVolume'),
    btcDominance: document.getElementById('btcDominance'),
    activeCoins: document.getElementById('activeCoins'),
    marketCapChange: document.getElementById('marketCapChange'),
    volumeChange: document.getElementById('volumeChange')
};

// Currency Formatters
const formatters = {
    usd: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    }),
    gbp: new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    }),
    ngn: new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
};

// Format currency amount
function formatCurrency(amount, currency) {
    if (!formatters[currency]) return `--`;
    return formatters[currency].format(amount);
}

// Format percentage
function formatPercentage(value) {
    if (value === null || value === undefined) return '--';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

// Get currency symbol
function getCurrencySymbol(currency) {
    return CONFIG.currencySymbols[currency] || '$';
}

// Update timestamp
function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    elements.updateStatus.textContent = `Last updated: ${timeString}`;
}

// Fetch coin prices
async function fetchCoinPrices() {
    try {
        const coins = Array.from(state.selectedCoins);
        if (coins.length === 0) return;
        
        const url = `${CONFIG.apiBase}/simple/price?ids=${coins.join(',')}&vs_currencies=${state.selectedCurrency}&include_24h_change=true`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch prices');
        
        const data = await response.json();
        state.priceData = data;
        updatePriceDisplay();
        updateTimestamp();
        
        // Update market stats
        await fetchMarketData();
        
    } catch (error) {
        console.error('Error fetching prices:', error);
        showError('Failed to fetch prices. Please try again.');
    }
}

// Update price display
function updatePriceDisplay() {
    elements.priceGrid.innerHTML = '';
    
    if (Object.keys(state.priceData).length === 0) {
        elements.priceGrid.innerHTML = `
            <div class="loading-state">
                <div class="loader"></div>
                <p>Loading cryptocurrency prices...</p>
            </div>
        `;
        return;
    }
    
    for (const [coinId, data] of Object.entries(state.priceData)) {
        const price = data[state.selectedCurrency];
        const change = data[`${state.selectedCurrency}_24h_change`];
        const changePercent = change ? change.toFixed(2) : '0.00';
        
        const priceCard = document.createElement('div');
        priceCard.className = 'price-card';
        priceCard.innerHTML = `
            <div class="card-header">
                <div class="coin-icon">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="coin-info">
                    <h3>${formatCoinName(coinId)}</h3>
                    <p class="symbol">${coinId.toUpperCase()}</p>
                </div>
            </div>
            <div class="price-display">
                <div class="price-amount">
                    ${formatCurrency(price, state.selectedCurrency)}
                </div>
                <div class="price-change ${change >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-arrow-${change >= 0 ? 'up' : 'down'}"></i>
                    ${changePercent}%
                </div>
            </div>
            <div class="card-footer">
                <span>${CONFIG.currencyNames[state.selectedCurrency]}</span>
                <span>24h Change</span>
            </div>
        `;
        
        elements.priceGrid.appendChild(priceCard);
    }
    
    // Update active coins count
    elements.activeCoins.textContent = Object.keys(state.priceData).length;
}

// Format coin name
function formatCoinName(coinId) {
    return coinId.charAt(0).toUpperCase() + coinId.slice(1);
}

// Search for a single coin
async function searchCoin() {
    const coinId = elements.coinSearch.value.toLowerCase().trim();
    if (!coinId) return;
    
    try {
        elements.searchResult.innerHTML = `
            <div class="loading-state">
                <div class="loader"></div>
                <p>Searching for ${coinId}...</p>
            </div>
        `;
        
        const url = `${CONFIG.apiBase}/simple/price?ids=${coinId}&vs_currencies=${state.selectedCurrency}&include_24h_change=true`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Coin not found');
        
        const data = await response.json();
        
        if (!data[coinId]) {
            throw new Error('Coin not found');
        }
        
        const priceData = data[coinId];
        const price = priceData[state.selectedCurrency];
        const change = priceData[`${state.selectedCurrency}_24h_change`];
        
        elements.searchResult.innerHTML = `
            <div style="text-align: center; width: 100%;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 20px;">
                    <div class="coin-icon">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div style="text-align: left;">
                        <h3 style="font-size: 1.5rem; margin-bottom: 5px;">${formatCoinName(coinId)}</h3>
                        <p style="color: var(--text-secondary);">${coinId.toUpperCase()}</p>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 10px;">
                        ${formatCurrency(price, state.selectedCurrency)}
                    </div>
                    <div class="price-change ${change >= 0 ? 'positive' : 'negative'}" style="display: inline-flex;">
                        <i class="fas fa-arrow-${change >= 0 ? 'up' : 'down'}"></i>
                        ${change ? change.toFixed(2) : '0.00'}%
                    </div>
                </div>
                <button class="btn-action btn-primary" style="margin-top: 15px;" onclick="addCoinToTrack('${coinId}')">
                    <i class="fas fa-plus"></i> Add to Tracked Coins
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('Search error:', error);
        elements.searchResult.innerHTML = `
            <div style="text-align: center; color: var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <p>${error.message}</p>
                <p style="color: var(--text-muted); margin-top: 10px;">Try: bitcoin, ethereum, dogecoin, etc.</p>
            </div>
        `;
    }
}

// Add coin to tracked coins
function addCoinToTrack(coinId) {
    state.selectedCoins.add(coinId);
    updateCoinSelector();
    fetchCoinPrices();
    
    // Update dropdown options if needed
    const optionExists = Array.from(elements.coinSelect.options)
        .some(option => option.value === coinId);
    
    if (!optionExists) {
        const option = document.createElement('option');
        option.value = coinId;
        option.textContent = `${formatCoinName(coinId)} (${coinId.toUpperCase()})`;
        option.selected = true;
        elements.coinSelect.appendChild(option);
    }
    
    // Show success message
    elements.searchResult.innerHTML = `
        <div style="text-align: center; color: var(--accent);">
            <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 15px;"></i>
            <p>${formatCoinName(coinId)} added to tracked coins!</p>
        </div>
    `;
}

// Update coin selector
function updateCoinSelector() {
    const selectedOptions = Array.from(elements.coinSelect.selectedOptions)
        .map(option => option.value);
    
    // Clear current selection
    state.selectedCoins.clear();
    
    // Add selected coins
    selectedOptions.forEach(coin => {
        state.selectedCoins.add(coin);
    });
}

// Fetch market data
async function fetchMarketData() {
    try {
        const url = `${CONFIG.apiBase}/global`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch market data');
        
        const data = await response.json();
        state.marketData = data.data;
        updateMarketStats();
        
    } catch (error) {
        console.error('Error fetching market data:', error);
    }
}

// Update market statistics
function updateMarketStats() {
    const data = state.marketData;
    if (!data) return;
    
    // Total Market Cap
    const marketCap = data.total_market_cap?.[state.selectedCurrency] || 0;
    const marketCapChange = data.market_cap_change_percentage_24h_usd || 0;
    
    elements.totalMarketCap.textContent = formatCurrency(marketCap, state.selectedCurrency);
    elements.marketCapChange.textContent = formatPercentage(marketCapChange);
    elements.marketCapChange.className = `stat-change ${marketCapChange >= 0 ? 'positive' : 'negative'}`;
    
    // Total Volume
    const volume = data.total_volume?.[state.selectedCurrency] || 0;
    elements.totalVolume.textContent = formatCurrency(volume, state.selectedCurrency);
    
    // BTC Dominance
    const btcDominance = data.market_cap_percentage?.btc || 0;
    elements.btcDominance.textContent = `${btcDominance.toFixed(1)}%`;
}

// Fetch price history for charts
async function fetchPriceHistory(coinId = 'bitcoin', days = 1) {
    try {
        const url = `${CONFIG.apiBase}/coins/${coinId}/market_chart?vs_currency=${state.selectedCurrency}&days=${days}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch price history');
        
        const data = await response.json();
        state.priceHistory[coinId] = data;
        updateChart();
        
    } catch (error) {
        console.error('Error fetching price history:', error);
    }
}

// Update chart
function updateChart() {
    const selectedCoin = elements.chartCoinSelect.value;
    const days = parseInt(elements.chartInterval.value);
    const history = state.priceHistory[selectedCoin];
    
    if (!history || !history.prices) return;
    
    const ctx = elements.priceChart.getContext('2d');
    
    // Destroy existing chart
    if (state.chart) {
        state.chart.destroy();
    }
    
    // Prepare data
    const prices = history.prices.slice(-24 * days); // Last N days of hourly data
    const labels = prices.map(([timestamp]) => {
        const date = new Date(timestamp);
        if (days === 1) {
            return date.toLocaleTimeString([], { hour: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    });
    
    const dataPoints = prices.map(([, price]) => price);
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.3)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.05)');
    
    // Create chart
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${formatCoinName(selectedCoin)} Price`,
                data: dataPoints,
                borderColor: 'rgb(124, 58, 237)',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => {
                            return `${formatCurrency(context.raw, state.selectedCurrency)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        callback: (value) => {
                            return formatCurrency(value, state.selectedCurrency);
                        }
                    }
                }
            }
        }
    });
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    
    if (isDark) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
        state.theme = 'light';
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
        state.theme = 'dark';
    }
    
    // Update chart colors if chart exists
    if (state.chart) {
        state.chart.update();
    }
}

// Start auto-update
function startAutoUpdate() {
    if (state.autoUpdateInterval) {
        clearInterval(state.autoUpdateInterval);
    }
    
    fetchCoinPrices();
    state.autoUpdateInterval = setInterval(fetchCoinPrices, CONFIG.updateInterval);
    
    elements.startAutoBtn.disabled = true;
    elements.stopAutoBtn.disabled = false;
}

// Stop auto-update
function stopAutoUpdate() {
    if (state.autoUpdateInterval) {
        clearInterval(state.autoUpdateInterval);
        state.autoUpdateInterval = null;
        
        elements.startAutoBtn.disabled = false;
        elements.stopAutoBtn.disabled = true;
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: var(--danger);
        color: white;
        padding: 15px;
        border-radius: var(--radius-sm);
        margin: 20px 0;
        text-align: center;
    `;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    
    elements.priceGrid.parentNode.insertBefore(errorDiv, elements.priceGrid);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Currency change
    elements.currencySelect.addEventListener('change', (e) => {
        state.selectedCurrency = e.target.value;
        fetchCoinPrices();
        fetchMarketData();
        fetchPriceHistory();
    });
    
    // Coin selection
    elements.coinSelect.addEventListener('change', () => {
        updateCoinSelector();
        fetchCoinPrices();
    });
    
    // Search
    elements.searchCoinBtn.addEventListener('click', searchCoin);
    elements.coinSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCoin();
    });
    
    // Buttons
    elements.fetchAllBtn.addEventListener('click', fetchCoinPrices);
    elements.startAutoBtn.addEventListener('click', startAutoUpdate);
    elements.stopAutoBtn.addEventListener('click', stopAutoUpdate);
    
    // Chart controls
    elements.chartCoinSelect.addEventListener('change', () => {
        fetchPriceHistory(elements.chartCoinSelect.value, elements.chartInterval.value);
    });
    
    elements.chartInterval.addEventListener('change', () => {
        fetchPriceHistory(elements.chartCoinSelect.value, elements.chartInterval.value);
    });
}

// Initialize application
async function init() {
    setupEventListeners();
    
    // Initialize with default coins
    updateCoinSelector();
    
    // Fetch initial data
    await fetchCoinPrices();
    await fetchMarketData();
    await fetchPriceHistory();
    
    // Set up initial chart
    updateChart();
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Global functions for HTML onclick
window.addCoinToTrack = addCoinToTrack;

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.autoUpdateInterval) {
        // Refresh data when returning to tab
        fetchCoinPrices();
    }
});