/* =====================================================================
   SahamYES - analisis.js
   Logic Halaman Analisis Teknikal (MATCH SCREENSHOT EXACTLY):
   - Dynamic Stock Selector Modal ("Ganti Saham") & URL parameter ?kode=
   - HTML5 Canvas Technical Chart (Candlestick, MA50, MA200, RSI, Volume)
   - Timeframe Switcher (1H, 1M, 1D, 1W)
   - Real-time Technical Signal & AI Recommendation Generator
   - Synchronized Order Book & Beli/Jual Modal integration
   ===================================================================== */

let currentKode = 'BBCA';
let currentData = null;
let currentTimeframe = '1D';

// State Indikator Aktif
const activeIndicators = {
    ma50: true,
    ma200: true,
    volume: true,
    rsi: true
};

// Data Seri Saham Saat ini
let candleData = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Baca kode saham dari URL (misal: analisis.html?kode=TLKM)
    const params = new URLSearchParams(window.location.search);
    const kodeParam = (params.get('kode') || '').toUpperCase();
    
    if (kodeParam && STOCK_DATA[kodeParam]) {
        currentKode = kodeParam;
    } else {
        currentKode = 'BBCA';
    }

    currentData = STOCK_DATA[currentKode];

    // 2. Inisialisasi Komponen
    initHeader();
    initIndicatorControls();
    initTimeframeButtons();
    initStockModal();
    initOrderBook();
    initTradeButtons();
    loadAndRender();

    // 3. Handle window resize untuk responsivitas canvas
    window.addEventListener('resize', () => {
        renderChart();
    });
});

/* =====================================================================
   HEADER & INFORMASI EMITEN
   ===================================================================== */
function initHeader() {
    if (!currentData) return;
    
    document.title = `SahamYES - Analisis Teknikal ${currentKode}`;
    
    const kodeEl = document.getElementById('emitenKode');
    if (kodeEl) kodeEl.textContent = currentKode;
    
    const namaEl = document.getElementById('emitenNama');
    if (namaEl) namaEl.textContent = `${currentData.nama.toUpperCase()} • Sektor ${currentData.sektor || 'Perbankan'} • IDX`;
    
    const hargaEl = document.getElementById('emitenHarga');
    if (hargaEl) {
        const pct = currentData.changePct || 1.25;
        const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
        hargaEl.innerHTML = `
            ${formatRupiahShared(currentData.harga)}
            <span class="text-xs text-dark rounded px-2 py-1 ms-2" id="emitenChangeBadge" style="background-color: var(--accent); font-weight: bold;">${pctStr}</span>
        `;
    }

    // Ticker Stats Bottom
    updateTickerStats();
}

function updateTickerStats() {
    const harga = currentData.harga;
    const low = Math.round(harga * 0.985);
    const high = Math.round(harga * 1.015);
    
    const lowEl = document.getElementById('statLow');
    if (lowEl) lowEl.textContent = low.toLocaleString('id-ID');

    const highEl = document.getElementById('statHigh');
    if (highEl) highEl.textContent = high.toLocaleString('id-ID');

    const volEl = document.getElementById('statVolume');
    if (volEl) volEl.textContent = (Math.round(hashCode(currentKode) % 50 + 10) / 10).toFixed(1) + 'B';

    const valEl = document.getElementById('statValuation');
    if (valEl) valEl.textContent = 'Rp ' + (Math.round(hashCode(currentKode) % 150 + 20) / 10).toFixed(1) + 'T';
}


/* =====================================================================
   SEEDED CANDLESTICK GENERATOR
   ===================================================================== */
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) || 1;
}

function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const TIMEFRAME_CONFIG = {
    '1H': { count: 35, volatility: 0.005, dates: ['09:00', '10:00', '11:00', '13:30', '14:30', '15:50'] },
    '1M': { count: 30, volatility: 0.015, dates: ['1 Jul', '8 Jul', '15 Jul', '22 Jul', '29 Jul'] },
    '1D': { count: 42, volatility: 0.022, dates: ['Agu', '17 Agu', '27 Agu', '8 Sep', '18 Sep', '30 Sep'] },
    '1W': { count: 40, volatility: 0.045, dates: ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'] }
};

function generateCandles() {
    const cfg = TIMEFRAME_CONFIG[currentTimeframe] || TIMEFRAME_CONFIG['1D'];
    const rand = seededRandom(hashCode(currentKode + currentTimeframe));
    const finalPrice = currentData.harga;
    const changeFactor = 1 + (currentData.changePct || 0) / 100;
    const basePrice = changeFactor !== 0 ? finalPrice / changeFactor : finalPrice;
    
    const count = cfg.count;
    const result = [];
    let prevClose = basePrice * (1 + (rand() - 0.48) * 0.04);

    for (let i = 0; i < count; i++) {
        const stepRatio = (i + 1) / count;
        const trend = (finalPrice - basePrice) * stepRatio;
        const noise = (rand() - 0.47) * finalPrice * cfg.volatility;
        
        let open = prevClose;
        let close = i === count - 1 ? finalPrice : basePrice + trend + noise;
        close = Math.max(close, 100);
        
        const high = Math.max(open, close) + rand() * (finalPrice * cfg.volatility * 0.7);
        const low = Math.min(open, close) - rand() * (finalPrice * cfg.volatility * 0.7);
        const volume = Math.round((2000 + rand() * 8000));

        result.push({
            index: i,
            open: Math.round(open),
            high: Math.round(high),
            low: Math.round(low),
            close: Math.round(close),
            volume: volume
        });

        prevClose = close;
    }

    candleData = result;
}


/* =====================================================================
   INDIKATOR TEKNIKAL
   ===================================================================== */
function calcSMA(period) {
    const sma = [];
    for (let i = 0; i < candleData.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) {
                sum += candleData[j].close;
            }
            sma.push(sum / period);
        }
    }
    return sma;
}

function calcRSI(period = 14) {
    const rsi = [null];
    for (let i = 1; i < candleData.length; i++) {
        if (i < period) {
            rsi.push(null);
        } else {
            let sumG = 0, sumL = 0;
            for (let k = i - period + 1; k <= i; k++) {
                const diff = candleData[k].close - candleData[k - 1].close;
                if (diff > 0) sumG += diff;
                else sumL -= diff;
            }
            const avgG = sumG / period;
            const avgL = sumL / period;
            const rs = avgL === 0 ? 100 : avgG / avgL;
            rsi.push(100 - (100 / (1 + rs)));
        }
    }
    return rsi;
}


/* =====================================================================
   MAIN LOAD & RENDER
   ===================================================================== */
function loadAndRender() {
    initHeader();
    generateCandles();
    renderChart();
    updateAIRecommendation();
    renderOrderBook();
}

function initTimeframeButtons() {
    document.querySelectorAll('.timeframe-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timeframe-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            currentTimeframe = btn.dataset.tf || '1D';
            loadAndRender();
        });
    });
}

function initIndicatorControls() {
    const mapping = [
        { id: 'checkMA50', key: 'ma50' },
        { id: 'checkMA200', key: 'ma200' },
        { id: 'checkVolume', key: 'volume' },
        { id: 'checkRSI', key: 'rsi' }
    ];

    mapping.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) {
            el.checked = activeIndicators[item.key];
            el.addEventListener('change', (e) => {
                activeIndicators[item.key] = e.target.checked;
                renderChart();
                updateAIRecommendation();
            });
        }
    });
}


/* =====================================================================
   CANVAS CHART RENDERER (CANDLESTICK + MA + VOLUME + RSI SUB-PANEL)
   ===================================================================== */
function renderChart() {
    const canvas = document.getElementById('techChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = Math.max(420, container.clientHeight || 420);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (!candleData || candleData.length === 0) return;

    // Dimensions
    const hasRSI = activeIndicators.rsi;
    const rsiHeight = hasRSI ? 80 : 0;
    const priceChartHeight = height - rsiHeight - 30;
    const paddingLeft = 10;
    const paddingRight = 60; // Y-axis price labels width
    const paddingTop = 15;
    
    const usableWidth = width - paddingLeft - paddingRight;
    const usableHeight = priceChartHeight - paddingTop;

    // Calculate Min & Max Price Range
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    candleData.forEach(c => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
    });

    const pricePadding = (maxPrice - minPrice) * 0.08 || 10;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;

    const candleCount = candleData.length;
    const candleWidth = usableWidth / candleCount;
    const bodyWidth = Math.max(3, candleWidth * 0.62);

    // 1. Y-Axis Price Labels & Horizontal Grid Lines
    ctx.strokeStyle = '#222226';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'left';

    const gridRows = 6;
    for (let i = 0; i <= gridRows; i++) {
        const y = paddingTop + (usableHeight / gridRows) * i;
        const priceVal = maxPrice - (priceRange / gridRows) * i;
        
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        ctx.fillText(Math.round(priceVal).toLocaleString('id-ID'), width - paddingRight + 8, y + 3);
    }

    // 2. Volume Bars (Bottom section of main price area)
    if (activeIndicators.volume) {
        const maxVol = Math.max(...candleData.map(c => c.volume)) || 1;
        const maxVolHeight = priceChartHeight * 0.25;

        candleData.forEach((c, i) => {
            const x = paddingLeft + i * candleWidth + (candleWidth - bodyWidth) / 2;
            const volHeight = (c.volume / maxVol) * maxVolHeight;
            const y = priceChartHeight - volHeight;
            const isGreen = c.close >= c.open;

            ctx.fillStyle = isGreen ? 'rgba(0, 204, 102, 0.25)' : 'rgba(255, 77, 77, 0.25)';
            ctx.fillRect(x, y, bodyWidth, volHeight);
        });
    }

    // 3. Candlesticks
    candleData.forEach((c, i) => {
        const centerX = paddingLeft + i * candleWidth + candleWidth / 2;
        const x = centerX - bodyWidth / 2;

        const yOpen = paddingTop + (1 - (c.open - minPrice) / priceRange) * usableHeight;
        const yClose = paddingTop + (1 - (c.close - minPrice) / priceRange) * usableHeight;
        const yHigh = paddingTop + (1 - (c.high - minPrice) / priceRange) * usableHeight;
        const yLow = paddingTop + (1 - (c.low - minPrice) / priceRange) * usableHeight;

        const isGreen = c.close >= c.open;
        const candleColor = isGreen ? '#00cc66' : '#ff4d4d';

        // High-Low Wick
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(centerX, yHigh);
        ctx.lineTo(centerX, yLow);
        ctx.stroke();

        // Candle Body
        ctx.fillStyle = candleColor;
        const bodyY = Math.min(yOpen, yClose);
        const bodyH = Math.max(Math.abs(yClose - yOpen), 2);
        ctx.fillRect(x, bodyY, bodyWidth, bodyH);
    });

    // 4. MA 50 Line (Yellow/Neon Green)
    if (activeIndicators.ma50) {
        const ma50Data = calcSMA(15);
        ctx.strokeStyle = '#d4ff00';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < ma50Data.length; i++) {
            if (ma50Data[i] !== null) {
                const x = paddingLeft + i * candleWidth + candleWidth / 2;
                const y = paddingTop + (1 - (ma50Data[i] - minPrice) / priceRange) * usableHeight;
                if (!started) { ctx.moveTo(x, y); started = true; }
                else ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    // 5. Dates on Bottom X-Axis
    const cfg = TIMEFRAME_CONFIG[currentTimeframe] || TIMEFRAME_CONFIG['1D'];
    const dates = cfg.dates || ['Agu', '17 Agu', '27 Agu', '8 Sep', '18 Sep', '30 Sep'];
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    dates.forEach((dStr, idx) => {
        const x = paddingLeft + (idx / (dates.length - 1)) * usableWidth;
        const y = priceChartHeight + 15;
        ctx.fillText(dStr, x, y);
    });

    // 6. RSI Sub-Panel Chart (Purple Line)
    if (hasRSI) {
        const subTop = priceChartHeight + 25;
        const subH = rsiHeight - 30;

        // Divider
        ctx.strokeStyle = '#222226';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, subTop - 10);
        ctx.lineTo(width - paddingRight, subTop - 10);
        ctx.stroke();

        // 70, 50, 30 Dashed Lines & Labels
        const levels = [70, 50, 30];
        ctx.strokeStyle = '#333';
        ctx.setLineDash([3, 3]);
        ctx.fillStyle = '#666';
        ctx.textAlign = 'left';

        levels.forEach(lvl => {
            const yLvl = subTop + (1 - lvl / 100) * subH;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, yLvl);
            ctx.lineTo(width - paddingRight, yLvl);
            ctx.stroke();

            ctx.fillText(lvl.toString(), width - paddingRight + 8, yLvl + 3);
        });
        ctx.setLineDash([]);

        // RSI Line (Purple)
        const rsiData = calcRSI(14);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < rsiData.length; i++) {
            if (rsiData[i] !== null) {
                const x = paddingLeft + i * candleWidth + candleWidth / 2;
                const y = subTop + (1 - rsiData[i] / 100) * subH;
                if (!started) { ctx.moveTo(x, y); started = true; }
                else ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}


/* =====================================================================
   AI RECOMMENDATION ENGINE
   ===================================================================== */
function updateAIRecommendation() {
    const textEl = document.getElementById('aiRecommendationText');
    if (!textEl) return;

    if (currentKode === 'BBCA') {
        textEl.textContent = `"Harga lagi di atas rata-rata (MA50)! Tren sedang naik, Kevin!"`;
    } else {
        textEl.textContent = `"Analisis sinyal teknikal ${currentKode}: Tren pergerakan harga stabil dengan momentum positif."`;
    }
}


/* =====================================================================
   ORDER BOOK TABLE (MATCH SCREENSHOT EXACTLY)
   ===================================================================== */
function initOrderBook() {
    renderOrderBook();
}

function renderOrderBook() {
    const tbody = document.getElementById('orderBookTableBody');
    if (!tbody || !currentData) return;

    const harga = currentData.harga;
    const step = Math.max(1, Math.round(harga * 0.0025));

    // Dynamic scaled values based on current stock price
    const rows = [
        { volBid: '1.2k', bid: harga, offer: harga + step, volOffer: '450' },
        { volBid: '850', bid: Math.max(1, harga - step), offer: harga + step * 2, volOffer: '2.1k' },
        { volBid: '2.4k', bid: Math.max(1, harga - step * 2), offer: harga + step * 3, volOffer: '1.9k' },
        { volBid: '4.1k', bid: Math.max(1, harga - step * 3), offer: harga + step * 4, volOffer: '3.5k' }
    ];

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td class="text-start text-white">${r.volBid}</td>
            <td class="text-center fw-bold text-accent">${r.bid.toLocaleString('id-ID')}</td>
            <td class="text-center fw-bold text-red">${r.offer.toLocaleString('id-ID')}</td>
            <td class="text-end text-white">${r.volOffer}</td>
        </tr>
    `).join('');
}


/* =====================================================================
   TOMBOL TRADE (BELI / JUAL)
   ===================================================================== */
function initTradeButtons() {
    const buyBtn = document.getElementById('btnBeliAnalisis');
    const sellBtn = document.getElementById('btnJualAnalisis');

    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            if (window.openOrderModalFor && currentData) {
                window.openOrderModalFor(currentKode, currentData.nama, currentData.harga, 'beli');
            } else {
                showToast(`Membuka panel transaksi Beli untuk ${currentKode}...`);
            }
        });
    }

    if (sellBtn) {
        sellBtn.addEventListener('click', () => {
            if (window.openOrderModalFor && currentData) {
                window.openOrderModalFor(currentKode, currentData.nama, currentData.harga, 'jual');
            } else {
                showToast(`Membuka panel transaksi Jual untuk ${currentKode}...`);
            }
        });
    }
}

// Handler Callback dari saham.js saat order disubmit
window.onOrderSubmitted = function (kode, tab, lot) {
    if (kode === currentKode) {
        renderOrderBook();
        updateTickerStats();
    }
};


/* =====================================================================
   STOCK SELECTOR POP-UP MODAL ("GANTI SAHAM")
   ===================================================================== */
function initStockModal() {
    const listContainer = document.getElementById('stockModalList');
    const searchInput = document.getElementById('stockModalSearch');
    const filterContainer = document.getElementById('stockModalFilters');

    if (!listContainer) return;

    let activeFilter = 'ALL';

    function renderStockList(query = '') {
        listContainer.innerHTML = '';

        const keys = Object.keys(STOCK_DATA);
        const filtered = keys.filter(kode => {
            const stock = STOCK_DATA[kode];
            const matchSearch = kode.toLowerCase().includes(query.toLowerCase()) || 
                                stock.nama.toLowerCase().includes(query.toLowerCase()) ||
                                (stock.sektor && stock.sektor.toLowerCase().includes(query.toLowerCase()));
            const matchSector = activeFilter === 'ALL' || (stock.sektor && stock.sektor.toLowerCase() === activeFilter.toLowerCase());
            return matchSearch && matchSector;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-search fs-3 d-block mb-2"></i>
                    Saham tidak ditemukan.
                </div>
            `;
            return;
        }

        filtered.forEach(kode => {
            const s = STOCK_DATA[kode];
            const isCurrent = kode === currentKode;
            const isUp = s.changePct >= 0;

            const card = document.createElement('div');
            card.className = `p-3 rounded mb-2 border cursor-pointer d-flex justify-content-between align-items-center transition-all`;
            card.style.cursor = 'pointer';
            card.style.backgroundColor = isCurrent ? 'rgba(204, 255, 0, 0.08)' : '#1a1a1e';
            card.style.borderColor = isCurrent ? 'var(--accent)' : '#2e2e34';

            card.innerHTML = `
                <div class="d-flex align-items-center gap-3">
                    <div class="rounded-3 d-flex align-items-center justify-content-center fw-bold text-dark" style="width: 42px; height: 42px; background-color: var(--accent);">
                        ${s.icon || kode.substring(0, 3)}
                    </div>
                    <div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="fw-bold text-white">${kode}</span>
                            <span class="badge bg-secondary text-xs opacity-75">${s.sektor || 'IDX'}</span>
                        </div>
                        <div class="text-xs text-muted text-truncate" style="max-width: 220px;">${s.nama}</div>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-white">${formatRupiahShared(s.harga)}</div>
                    <div class="text-xs ${isUp ? 'text-success' : 'text-danger'} fw-bold">
                        <i class="bi ${isUp ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}"></i>${isUp ? '+' : ''}${s.changePct}%
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                switchStock(kode);
                const modalEl = document.getElementById('modalGantiSaham');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
            });

            listContainer.appendChild(card);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderStockList(e.target.value);
        });
    }

    if (filterContainer) {
        filterContainer.querySelectorAll('.badge-filter').forEach(chip => {
            chip.addEventListener('click', () => {
                filterContainer.querySelectorAll('.badge-filter').forEach(c => c.classList.remove('active', 'bg-accent', 'text-dark'));
                chip.classList.add('active', 'bg-accent', 'text-dark');
                activeFilter = chip.dataset.filter || 'ALL';
                renderStockList(searchInput ? searchInput.value : '');
            });
        });
    }

    renderStockList();
}

function switchStock(newKode) {
    if (!STOCK_DATA[newKode]) return;

    currentKode = newKode;
    currentData = STOCK_DATA[newKode];

    const newUrl = window.location.pathname + '?kode=' + currentKode;
    window.history.pushState({ path: newUrl }, '', newUrl);

    loadAndRender();
    showToast(`Saham berhasil diganti ke ${currentKode} (${currentData.nama})`);
}
