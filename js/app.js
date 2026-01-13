// State Capitalism Tracker - Main Application

// Deal data - loaded from data/deals.json
let deals = [];

// Store for stock prices
const stockPrices = {};

// Load deals from JSON file
async function loadDeals() {
  try {
    const response = await fetch('data/deals.json');
    if (!response.ok) throw new Error('Failed to load deals');
    deals = await response.json();
    return deals;
  } catch (error) {
    console.error('Error loading deals:', error);
    return [];
  }
}

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

// Format date short for timeline
function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

// Fetch stock price from Finnhub API
async function fetchStockPrice(ticker) {
  if (!ticker) return null;

  // Check if API key is configured
  if (!CONFIG.FINNHUB_API_KEY || CONFIG.FINNHUB_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('Finnhub API key not configured. Get a free key at https://finnhub.io');
    return null;
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${CONFIG.FINNHUB_API_KEY}`
    );

    if (!response.ok) throw new Error('Failed to fetch');

    const data = await response.json();

    // Finnhub returns: c=current, pc=previous close, h=high, l=low, o=open
    if (!data.c || data.c === 0) return null;

    return {
      price: data.c,
      previousClose: data.pc,
      change: data.c - data.pc,
      changePercent: ((data.c - data.pc) / data.pc) * 100,
      high: data.h,
      low: data.l,
      open: data.o
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${ticker}:`, error);
    return null;
  }
}

// Calculate price change since announcement
function calculateDealChange(currentPrice, announcementPrice) {
  if (!announcementPrice || !currentPrice) return null;
  const change = currentPrice - announcementPrice;
  const changePercent = (change / announcementPrice) * 100;
  return { change, changePercent };
}

// Render stock ticker section
function renderStockTicker(deal, container) {
  if (!deal.ticker) return;

  const tickerDiv = document.createElement('div');
  tickerDiv.className = 'stock-ticker';
  tickerDiv.innerHTML = `
    <span class="ticker-symbol">${deal.ticker}</span>
    <span class="ticker-loading">Loading...</span>
  `;
  container.appendChild(tickerDiv);

  // Fetch and update stock price
  fetchStockPrice(deal.ticker).then(priceData => {
    if (priceData) {
      stockPrices[deal.ticker] = priceData;
      const isPositive = priceData.change >= 0;

      // Calculate change since deal announcement
      const dealChange = calculateDealChange(priceData.price, deal.announcementPrice);
      const dealChangeHtml = dealChange ? `
        <div class="deal-price-change ${dealChange.change >= 0 ? 'positive' : 'negative'}">
          <span class="deal-change-label">Since Deal:</span>
          <span class="deal-change-value">
            ${dealChange.change >= 0 ? '+' : ''}$${dealChange.change.toFixed(2)} (${dealChange.change >= 0 ? '+' : ''}${dealChange.changePercent.toFixed(1)}%)
          </span>
        </div>
      ` : '';

      tickerDiv.innerHTML = `
        <div class="ticker-row">
          <span class="ticker-symbol">${deal.ticker}</span>
          <span class="ticker-price">$${priceData.price.toFixed(2)}</span>
          <span class="ticker-change ${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '+' : ''}${priceData.change.toFixed(2)} (${isPositive ? '+' : ''}${priceData.changePercent.toFixed(2)}%)
          </span>
          <span class="status-dot ${isPositive ? 'green' : 'red'}"></span>
        </div>
        ${dealChangeHtml}
      `;
    } else {
      tickerDiv.innerHTML = `
        <span class="ticker-symbol">${deal.ticker}</span>
        <span class="ticker-loading">Price unavailable</span>
      `;
    }
  });
}

// Create a deal card
function createDealCard(deal) {
  const card = document.createElement('div');
  card.className = 'deal-card';
  card.setAttribute('data-deal-id', deal.id);

  card.innerHTML = `
    <div class="deal-header">
      <span class="deal-name">${deal.name}</span>
      <span class="deal-amount">${deal.amountA}</span>
    </div>
    <div class="deal-date">${formatDate(deal.dateAnnounced)}</div>
    <p class="deal-description">${deal.description}</p>
  `;

  // Add stock ticker if available
  renderStockTicker(deal, card);

  // Click handler to open modal
  card.addEventListener('click', () => openModal(deal));

  return card;
}

// Render all deal cards
function renderDeals() {
  const grid = document.getElementById('deals-grid');
  grid.innerHTML = '';

  // Sort deals by date (newest first)
  const sortedDeals = [...deals].sort((a, b) =>
    new Date(b.dateAnnounced) - new Date(a.dateAnnounced)
  );

  sortedDeals.forEach(deal => {
    grid.appendChild(createDealCard(deal));
  });
}

// Open modal with deal details
function openModal(deal) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  const areas = deal.area.split(',').map(a => a.trim());

  content.innerHTML = `
    <h2 class="modal-title">${deal.name}</h2>
    <div class="modal-meta">
      <span>${formatDate(deal.dateAnnounced)}</span>
      <span>${deal.amountA}</span>
      ${deal.ticker ? `<span>${deal.ticker}</span>` : ''}
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title">Description</h3>
      <p class="modal-section-content">${deal.description}</p>
    </div>

    ${deal.structure ? `
    <div class="modal-section">
      <h3 class="modal-section-title">Deal Structure</h3>
      <p class="modal-section-content">${deal.structure}</p>
    </div>
    ` : ''}

    <div class="modal-section">
      <h3 class="modal-section-title">Stakeholders</h3>
      <div class="stakeholder-tags">
        ${deal.stakeholders.map(s => `<span class="stakeholder-tag">${s}</span>`).join('')}
      </div>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title">Sector</h3>
      <div class="area-tags">
        ${areas.map(a => `<span class="area-tag">${a}</span>`).join('')}
      </div>
    </div>

    ${deal.notes ? `
    <div class="modal-section">
      <h3 class="modal-section-title">Notes</h3>
      <p class="modal-section-content">${deal.notes}</p>
    </div>
    ` : ''}

    ${deal.newsLinks ? `
    <div class="modal-section">
      <h3 class="modal-section-title">News Source</h3>
      <p class="modal-section-content">${deal.newsLinks}</p>
    </div>
    ` : ''}
  `;

  overlay.classList.add('active');
}

// Close modal
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
}

// Setup modal event listeners
function setupModal() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Render timeline
function renderTimeline() {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';

  // Sort deals by date (oldest first for timeline)
  const sortedDeals = [...deals].sort((a, b) =>
    new Date(a.dateAnnounced) - new Date(b.dateAnnounced)
  );

  sortedDeals.forEach(deal => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-date">${formatDateShort(deal.dateAnnounced)}</div>
      <div class="timeline-name" data-deal-id="${deal.id}">${deal.name}</div>
    `;

    item.querySelector('.timeline-name').addEventListener('click', () => openModal(deal));

    timeline.appendChild(item);
  });
}

// Create stakeholder network graph using D3
function renderStakeholderGraph() {
  const container = document.getElementById('stakeholder-graph');
  container.innerHTML = `
    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot deal"></span>
        <span>Deal</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot stakeholder"></span>
        <span>Stakeholder</span>
      </div>
    </div>
  `;

  const width = container.clientWidth;
  const height = 360;

  // Build nodes and links
  const nodes = [];
  const links = [];
  const stakeholderSet = new Set();

  // Add deal nodes
  deals.forEach(deal => {
    nodes.push({
      id: `deal-${deal.id}`,
      name: deal.name,
      type: 'deal'
    });

    // Add stakeholder nodes and links
    deal.stakeholders.forEach(stakeholder => {
      const stakeholderId = `stakeholder-${stakeholder.replace(/\s+/g, '-')}`;

      if (!stakeholderSet.has(stakeholder)) {
        stakeholderSet.add(stakeholder);
        nodes.push({
          id: stakeholderId,
          name: stakeholder,
          type: 'stakeholder'
        });
      }

      links.push({
        source: `deal-${deal.id}`,
        target: stakeholderId
      });
    });
  });

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Create simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-150))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30));

  // Create links
  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'link');

  // Create nodes
  const node = svg.append('g')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', d => `node node-${d.type}`)
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  node.append('circle')
    .attr('r', d => d.type === 'deal' ? 10 : 7);

  node.append('text')
    .attr('dx', 12)
    .attr('dy', 4)
    .text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name);

  // Add title for hover
  node.append('title')
    .text(d => d.name);

  // Update positions on tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node.attr('transform', d => {
      // Keep nodes within bounds
      d.x = Math.max(20, Math.min(width - 20, d.x));
      d.y = Math.max(20, Math.min(height - 20, d.y));
      return `translate(${d.x},${d.y})`;
    });
  });

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}

// Initialize application
async function init() {
  await loadDeals();
  renderDeals();
  setupModal();
  renderTimeline();
  renderStakeholderGraph();
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
