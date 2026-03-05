 CoinMystique - Real-time Cryptocurrency Dashboard
 https://coinmystique.netlify.app/

A modern, responsive web application for tracking real-time cryptocurrency prices, market data, and price history. Built with vanilla JavaScript, HTML5, and CSS3, powered by the CoinGecko API.



 Features

### Core Functionality
- **Real-time Price Tracking**: Live cryptocurrency prices with 24-hour change percentages
- **Multi-Currency Support**: USD, GBP, and NGN currency conversion
- **Interactive Charts**: Price history visualization with customizable timeframes (1, 7, 30 days)
- **Market Overview**: Global market statistics including total market cap, volume, and BTC dominance

### User Experience
- **Dark/Light Theme**: Toggle between dark and light modes with persistent state
- **Auto-Update**: Automatic price refresh every 30 seconds with manual control
- **Multi-Coin Selection**: Track multiple cryptocurrencies simultaneously
- **Coin Search**: Look up any cryptocurrency and add it to your tracking list
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile

### Technical Highlights
- **Vanilla JavaScript**: No frameworks, pure JavaScript implementation
- **Chart.js Integration**: Beautiful, interactive price charts
- **CoinGecko API**: Reliable, free cryptocurrency data
- **Modular Architecture**: Clean separation of concerns (HTML, CSS, JavaScript)
- **Error Handling**: Graceful error handling with user-friendly messages

## 📋 Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for API calls
- No API key required (CoinGecko free tier)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/coinmystique.git
cd coinmystique
```

2. **Project Structure**
```
coinmystique/
│
├── index.html          # Main HTML file
├── style.css           # All styles and themes
├── script.js           # Application logic
└── README.md           # Documentation
```

3. **Open the application**
- Simply open `index.html` in your web browser
- Or use a local server (recommended):
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```
- Navigate to `http://localhost:8000`

## 🎯 Usage Guide

### Getting Started
1. **Select Currencies**: Choose your preferred fiat currency (USD/GBP/NGN)
2. **Choose Coins**: Select multiple cryptocurrencies from the dropdown (hold Ctrl/Cmd)
3. **View Prices**: See real-time prices and 24-hour changes
4. **Analyze Charts**: Check price history with interactive charts

### Features in Detail

#### Price Grid
- Displays selected coins with current prices
- Color-coded price changes (green for positive, red for negative)
- Real-time updates with visual indicators

#### Market Overview
- **Total Market Cap**: Global cryptocurrency market capitalization
- **24h Volume**: Total trading volume in the last 24 hours
- **BTC Dominance**: Bitcoin's market dominance percentage
- **Active Coins**: Number of tracked cryptocurrencies

#### Auto-Update
- Click "Auto Update" to start automatic refreshes (30-second intervals)
- Use "Stop" to disable auto-updates
- "Refresh All" for manual updates

#### Coin Search
- Enter any cryptocurrency name (e.g., "bitcoin", "ethereum")
- View detailed price information
- Add found coins to your tracking list

## 🔧 Configuration

### API Configuration
The application uses the CoinGecko API. Configuration can be modified in `script.js`:

```javascript
const CONFIG = {
    apiBase: 'https://api.coingecko.com/api/v3',
    updateInterval: 30000, // Update interval in milliseconds
    defaultCoins: ['bitcoin', 'ethereum', 'litecoin'], // Default tracked coins
    currencySymbols: {
        usd: '$',
        gbp: '£',
        ngn: '₦'
    }
};
```

