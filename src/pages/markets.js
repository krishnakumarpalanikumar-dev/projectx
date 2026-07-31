// Live Markets Page

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Sample forex & stock data (real-time API would require paid subscription)
const forexData = [
  { pair: 'EUR/USD', price: '1.0842', change: '+0.12%', high: '1.0868', low: '1.0815', volume: '5.2B', trend: 'up' },
  { pair: 'GBP/USD', price: '1.2654', change: '-0.08%', high: '1.2690', low: '1.2630', volume: '3.8B', trend: 'down' },
  { pair: 'USD/JPY', price: '151.42', change: '+0.25%', high: '151.68', low: '150.95', volume: '4.1B', trend: 'up' },
  { pair: 'USD/CHF', price: '0.8834', change: '-0.15%', high: '0.8862', low: '0.8810', volume: '2.1B', trend: 'down' },
  { pair: 'AUD/USD', price: '0.6578', change: '+0.32%', high: '0.6595', low: '0.6542', volume: '1.9B', trend: 'up' },
  { pair: 'USD/CAD', price: '1.3612', change: '-0.05%', high: '1.3645', low: '1.3588', volume: '2.4B', trend: 'down' },
  { pair: 'NZD/USD', price: '0.6012', change: '+0.18%', high: '0.6028', low: '0.5990', volume: '0.8B', trend: 'up' },
  { pair: 'EUR/GBP', price: '0.8568', change: '+0.05%', high: '0.8580', low: '0.8550', volume: '1.5B', trend: 'up' },
];

const stockData = [
  { pair: 'AAPL', price: '178.52', change: '+1.24%', high: '179.80', low: '176.40', volume: '52.3M', trend: 'up', name: 'Apple Inc.' },
  { pair: 'MSFT', price: '415.80', change: '+0.85%', high: '417.20', low: '412.50', volume: '28.1M', trend: 'up', name: 'Microsoft' },
  { pair: 'GOOGL', price: '155.42', change: '-0.32%', high: '156.80', low: '154.90', volume: '22.4M', trend: 'down', name: 'Alphabet' },
  { pair: 'AMZN', price: '186.15', change: '+2.10%', high: '187.50', low: '182.30', volume: '35.8M', trend: 'up', name: 'Amazon' },
  { pair: 'TSLA', price: '172.80', change: '-1.45%', high: '176.20', low: '171.50', volume: '68.2M', trend: 'down', name: 'Tesla' },
  { pair: 'NVDA', price: '875.40', change: '+3.25%', high: '882.10', low: '860.50', volume: '42.5M', trend: 'up', name: 'NVIDIA' },
  { pair: 'META', price: '505.20', change: '+0.92%', high: '508.90', low: '500.10', volume: '18.7M', trend: 'up', name: 'Meta Platforms' },
  { pair: 'JPM', price: '198.35', change: '-0.18%', high: '199.50', low: '197.20', volume: '8.9M', trend: 'down', name: 'JPMorgan Chase' },
];

let currentMarketTab = 'crypto';
let cryptoData = [];

export async function renderMarkets(container) {
  container.innerHTML = `
    <div class="market-tabs">
      <button class="market-tab active" data-tab="crypto" id="tab-crypto">🪙 Crypto</button>
      <button class="market-tab" data-tab="forex" id="tab-forex">💱 Forex</button>
      <button class="market-tab" data-tab="stocks" id="tab-stocks">📈 Stocks</button>
    </div>

    <div class="card">
      <div id="market-table-container">
        <div style="text-align:center;padding:40px;">
          <div class="spinner" style="width:32px;height:32px;border:3px solid var(--purple-100);border-top-color:var(--purple-600);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
          <p style="color:var(--gray-500);font-size:0.88rem;">Loading market data...</p>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  document.querySelectorAll('.market-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMarketTab = tab.dataset.tab;
      renderTable();
    });
  });

  // Fetch crypto data
  await fetchCryptoData();
  renderTable();
}

async function fetchCryptoData() {
  try {
    const response = await fetch(`${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false`);
    
    if (response.ok) {
      const data = await response.json();
      cryptoData = data.map(coin => ({
        pair: `${coin.symbol.toUpperCase()}/USD`,
        price: coin.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) || 'N/A',
        change: `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || '0.00'}%`,
        high: coin.high_24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) || 'N/A',
        low: coin.low_24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) || 'N/A',
        volume: formatVolume(coin.total_volume),
        trend: coin.price_change_percentage_24h >= 0 ? 'up' : 'down',
        name: coin.name,
        image: coin.image
      }));
    } else {
      // Use fallback data
      cryptoData = [
        { pair: 'BTC/USD', price: '68,245.00', change: '+2.45%', high: '69,100.00', low: '66,800.00', volume: '28.5B', trend: 'up', name: 'Bitcoin' },
        { pair: 'ETH/USD', price: '3,542.80', change: '+1.82%', high: '3,600.00', low: '3,480.00', volume: '15.2B', trend: 'up', name: 'Ethereum' },
        { pair: 'BNB/USD', price: '585.40', change: '-0.45%', high: '592.00', low: '580.00', volume: '1.8B', trend: 'down', name: 'BNB' },
        { pair: 'SOL/USD', price: '142.65', change: '+4.12%', high: '145.80', low: '136.20', volume: '3.2B', trend: 'up', name: 'Solana' },
        { pair: 'XRP/USD', price: '0.6248', change: '+0.92%', high: '0.6320', low: '0.6180', volume: '2.1B', trend: 'up', name: 'XRP' },
        { pair: 'ADA/USD', price: '0.4825', change: '-1.20%', high: '0.4920', low: '0.4780', volume: '0.5B', trend: 'down', name: 'Cardano' },
        { pair: 'DOGE/USD', price: '0.1245', change: '+3.55%', high: '0.1280', low: '0.1195', volume: '1.2B', trend: 'up', name: 'Dogecoin' },
        { pair: 'DOT/USD', price: '7.42', change: '-0.68%', high: '7.58', low: '7.35', volume: '0.4B', trend: 'down', name: 'Polkadot' },
      ];
    }
  } catch {
    // Use fallback data on network error
    cryptoData = [
      { pair: 'BTC/USD', price: '68,245.00', change: '+2.45%', high: '69,100.00', low: '66,800.00', volume: '28.5B', trend: 'up', name: 'Bitcoin' },
      { pair: 'ETH/USD', price: '3,542.80', change: '+1.82%', high: '3,600.00', low: '3,480.00', volume: '15.2B', trend: 'up', name: 'Ethereum' },
      { pair: 'SOL/USD', price: '142.65', change: '+4.12%', high: '145.80', low: '136.20', volume: '3.2B', trend: 'up', name: 'Solana' },
      { pair: 'XRP/USD', price: '0.6248', change: '+0.92%', high: '0.6320', low: '0.6180', volume: '2.1B', trend: 'up', name: 'XRP' },
      { pair: 'DOGE/USD', price: '0.1245', change: '+3.55%', high: '0.1280', low: '0.1195', volume: '1.2B', trend: 'up', name: 'Dogecoin' },
    ];
  }
}

function formatVolume(vol) {
  if (!vol) return 'N/A';
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return vol.toString();
}

function renderTable() {
  const tableContainer = document.getElementById('market-table-container');
  let data;

  switch (currentMarketTab) {
    case 'crypto': data = cryptoData; break;
    case 'forex': data = forexData; break;
    case 'stocks': data = stockData; break;
  }

  if (!data || data.length === 0) {
    tableContainer.innerHTML = `
      <div class="empty-state">
        <h3>No data available</h3>
        <p>Market data could not be loaded.</p>
      </div>
    `;
    return;
  }

  tableContainer.innerHTML = `
    <div class="market-table-wrapper">
      <table class="market-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Pair</th>
            <th>Price (USD)</th>
            <th>24h Change</th>
            <th>24h High</th>
            <th>24h Low</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((item, i) => `
            <tr>
              <td style="color:var(--gray-400);font-weight:600;">${i + 1}</td>
              <td>
                <div class="pair-info">
                  ${item.image ? `<img src="${item.image}" style="width:28px;height:28px;border-radius:50%;" alt="${item.pair}"/>` :
                    `<div class="pair-icon">${item.pair.substring(0, 2)}</div>`}
                  <div>
                    <div class="symbol">${item.pair}</div>
                    ${item.name ? `<div style="font-size:0.75rem;color:var(--gray-400);">${item.name}</div>` : ''}
                  </div>
                </div>
              </td>
              <td class="market-price">$${item.price}</td>
              <td class="${item.trend === 'up' ? 'price-up' : 'price-down'}">
                ${item.trend === 'up' ? '▲' : '▼'} ${item.change}
              </td>
              <td class="market-meta">$${item.high}</td>
              <td class="market-meta">$${item.low}</td>
              <td class="market-meta" style="color:var(--gray-600);">${item.volume}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
