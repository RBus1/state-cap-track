// State Capitalism Tracker - Main Application

// Deal data - newsLinks can be an array of {title, url} objects for hyperlinks
const deals = [
  {
    id: 1,
    name: "MP Materials",
    ticker: "MP",
    dateAnnounced: "2025-07-10",
    description: "15% stake for $400 million from the Department of Defense, making it the company's largest shareholder. Guaranteed offtake agreements and price floor agreement also included.",
    amountA: "$400 Million",
    amountB: "",
    structure: "Price floor: $110 / kilo for 10 years (current market price = ~$60). Profit sharing of 30% if > $110. Offtake: DoD guaranteed purchase of all NdFEB magnets for 10 years at cost of production + $140M / year. Equity: convertible stock and warrants of 15%. Loans: $150M loan to expand mountain pass processing facility",
    stakeholders: ["Department of Defense", "Office of Strategic Capital", "MP Materials", "Department of Energy"],
    area: "Critical Minerals, Rare Earths, Neodymium, Praseodymium",
    newsLinks: [
      { title: "Bloomberg", url: "https://www.bloomberg.com" }
    ],
    officialStatement: "",
    outcome: "",
    notes: ""
  },
  {
    id: 2,
    name: "Intel",
    ticker: "INTC",
    dateAnnounced: "2025-08-22",
    description: "10% stake for $8.9 billion",
    amountA: "$8.9 Billion",
    amountB: "",
    structure: "",
    stakeholders: ["Intel", "Department of Commerce", "Department of Defense"],
    area: "Semiconductors",
    newsLinks: [
      { title: "CNBC", url: "https://www.cnbc.com" }
    ],
    officialStatement: "",
    outcome: "",
    notes: "$5.7 billion from remaining CHIPS Act grants plus $3.2 billion from Secure Enclave program"
  },
  {
    id: 3,
    name: "US Steel / Nippon Steel",
    ticker: "X",
    dateAnnounced: "2025-06-18",
    description: "Golden share (non-equity stake) giving the federal government veto power over key corporate decisions as part of the Nippon Steel acquisition approval",
    amountA: "N/A",
    amountB: "",
    structure: "",
    stakeholders: ["US Steel", "Nippon Steel", "Federal Government"],
    area: "Steel",
    newsLinks: [],
    officialStatement: "",
    outcome: "",
    notes: ""
  },
  {
    id: 4,
    name: "Lithium Americas Corporation",
    ticker: "LAC",
    dateAnnounced: "2025-10-01",
    description: "5% stake in the company plus a separate 5% stake in the Thacker Pass joint venture with General Motors, as part of restructuring a $2.26 billion loan",
    amountA: "$2.26 Billion",
    amountB: "",
    structure: "",
    stakeholders: ["General Motors", "Department of Energy", "Lithium Americas Corporation"],
    area: "Critical Minerals, Lithium",
    newsLinks: [],
    officialStatement: "",
    outcome: "",
    notes: ""
  },
  {
    id: 5,
    name: "Trilogy Metals Inc.",
    ticker: "TMQ",
    dateAnnounced: "2025-10-07",
    description: "10% stake for $35.6 million investment, plus warrants for an additional 7.5%",
    amountA: "$35.6 Million",
    amountB: "",
    structure: "",
    stakeholders: ["Department of Defense", "Office of Strategic Capital", "Interior Department", "South32", "Ambler Metals", "Trilogy Metals Inc."],
    area: "Critical Minerals",
    newsLinks: [],
    officialStatement: "",
    outcome: "",
    notes: ""
  },
  {
    id: 6,
    name: "Vulcan Elements / ReElement Technologies",
    ticker: null,
    dateAnnounced: "2025-11-03",
    description: "$50 million equity stake from the Department of Commerce as part of a $1.4 billion partnership; the Department of Defense also received warrants",
    amountA: "$50 Million",
    amountB: "",
    structure: "",
    stakeholders: ["Department of Defense", "Department of Commerce", "Vulcan Elements", "ReElement Technologies"],
    area: "Critical Minerals, Rare Earths",
    newsLinks: [],
    officialStatement: "",
    outcome: "",
    notes: ""
  },
  {
    id: 7,
    name: "Korea Zinc",
    ticker: "KZAAY",
    dateAnnounced: "2025-12-15",
    description: "$1.9B of shares sold to a joint venture with 40% Department of Defense ownership and 60% unnamed investors yielding a 10% total stake in Korea Zinc",
    amountA: "$1.94 Billion",
    amountB: "",
    structure: "",
    stakeholders: ["Department of Defense", "Korea Zinc", "Unnamed Investors"],
    area: "Critical Minerals, Zinc",
    newsLinks: [
      { title: "CNBC", url: "https://www.cnbc.com" }
    ],
    officialStatement: "",
    outcome: "",
    notes: ""
  }
];

// Store for stock prices
const stockPrices = {};

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format date short for timeline
function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Fetch stock price from Yahoo Finance API
async function fetchStockPrice(ticker) {
  if (!ticker) return null;

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    );

    if (!response.ok) throw new Error('Failed to fetch');

    const data = await response.json();
    const result = data.chart.result[0];
    const meta = result.meta;

    return {
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${ticker}:`, error);
    return null;
  }
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
      tickerDiv.innerHTML = `
        <span class="ticker-symbol">${deal.ticker}</span>
        <span class="ticker-price">$${priceData.price.toFixed(2)}</span>
        <span class="ticker-change ${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '+' : ''}${priceData.change.toFixed(2)} (${isPositive ? '+' : ''}${priceData.changePercent.toFixed(2)}%)
        </span>
        <span class="status-dot ${isPositive ? 'green' : 'red'}"></span>
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

// Render news links as hyperlinks
function renderNewsLinks(newsLinks) {
  if (!newsLinks || newsLinks.length === 0) {
    return '<span class="modal-section-content">No links available</span>';
  }

  const links = newsLinks.map(link => {
    if (typeof link === 'object' && link.url) {
      return `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="news-link">${link.title}</a>`;
    } else if (typeof link === 'string') {
      return `<span class="modal-section-content">${link}</span>`;
    }
    return '';
  }).join('');

  return `<div class="news-links">${links}</div>`;
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

    ${deal.newsLinks && deal.newsLinks.length > 0 ? `
    <div class="modal-section">
      <h3 class="modal-section-title">News Sources</h3>
      ${renderNewsLinks(deal.newsLinks)}
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
function init() {
  renderDeals();
  setupModal();
  renderTimeline();
  renderStakeholderGraph();
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
