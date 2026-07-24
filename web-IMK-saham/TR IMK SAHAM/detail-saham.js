/* =====================================================================
   SahamYES - detail-saham.js
   Logic halaman Detail Saham: baca ?kode= dari URL, render info + grafik
   detail + order book, dan jalanin panel Beli/Jual LANGSUNG di halaman
   ini (bukan modal).
   Butuh stock-data.js (STOCK_DATA dkk) & common.js (showToast) di-load
   duluan.
   ===================================================================== */

let currentKode = null;
let currentData = null;
let panelTab = 'beli';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    currentKode = (params.get('kode') || '').toUpperCase();
    currentData = STOCK_DATA[currentKode];

    if (!currentData) {
        showNotFound();
        return;
    }

    renderHeader();
    initRangeButtons();
    renderChart('1D');
    renderOrderBook();
    initOrderPanel();
});

function showNotFound() {
    const main = document.getElementById('detailMainContent');
    if (!main) return;
    main.innerHTML = `
        <div class="text-center py-5">
            <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
            <h5 class="fw-bold mt-3">Saham Tidak Ditemukan</h5>
            <p class="text-muted text-sm">Kode saham yang kamu buka nggak ada di data kami.</p>
            <a href="saham.html" class="btn-buy-neon text-decoration-none d-inline-block mt-2">Kembali ke Halaman Saham</a>
        </div>
    `;
}


/* =====================================================================
   HEADER (kode, nama, sektor, harga, badge perubahan, lot dimiliki)
   ===================================================================== */
function renderHeader() {
    document.title = `SahamYES - ${currentKode}`;
    document.getElementById('detailInitial').textContent = currentData.icon || currentKode.charAt(0);
    document.getElementById('detailKode').textContent = currentKode;
    document.getElementById('detailNama').textContent = currentData.nama;
    document.getElementById('detailSektor').textContent = currentData.sektor || '-';
    document.getElementById('detailHarga').textContent = formatRupiahShared(currentData.harga);
    document.getElementById('detailOpen').textContent = formatRupiahShared(currentData.open);

    const pct = currentData.changePct;
    const badgeEl = document.getElementById('detailChangeBadge');
    const nominalStr = `${currentData.changeNominal >= 0 ? '+' : ''}${currentData.changeNominal.toLocaleString('id-ID')}`;
    if (pct > 0) {
        badgeEl.className = 'badge-pct-green';
        badgeEl.innerHTML = `<i class="bi bi-arrow-up-short"></i>+${pct.toFixed(2).replace('.', ',')}% (${nominalStr})`;
    } else if (pct < 0) {
        badgeEl.className = 'badge-pct-red';
        badgeEl.innerHTML = `<i class="bi bi-arrow-down-short"></i>${pct.toFixed(2).replace('.', ',')}% (${nominalStr})`;
    } else {
        badgeEl.className = 'badge-pct-grey';
        badgeEl.innerHTML = '- 0,00% (0)';
    }

    const yieldRow = document.getElementById('detailYieldRow');
    if (currentData.yieldPct !== null && currentData.yieldPct !== undefined) {
        yieldRow.classList.remove('d-none');
        document.getElementById('detailYield').textContent = `${currentData.yieldPct}%`;
    } else {
        yieldRow.classList.add('d-none');
    }

    const holdingLot = PORTFOLIO_HOLDINGS_SHARED[currentKode] || 0;
    document.getElementById('detailHoldingLot').textContent = `${holdingLot.toLocaleString('id-ID')} Lot`;
}


/* =====================================================================
   GRAFIK DETAIL -- SVG digambar ulang tiap ganti rentang waktu.
   Dibuat deterministik (seeded) biar konsisten tiap dibuka, tapi beda-
   beda antar kode saham & antar rentang.
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

const RANGE_CONFIG = {
    '1H': { points: 24, vol: 0.003 },
    '1D': { points: 30, vol: 0.012 },
    '1M': { points: 22, vol: 0.05 },
    '1T': { points: 26, vol: 0.12 },
};

function generateSeries(rangeKey) {
    const cfg = RANGE_CONFIG[rangeKey] || RANGE_CONFIG['1D'];
    const rand = seededRandom(hashCode(currentKode + rangeKey));
    const harga = currentData.harga;
    const changeFactor = 1 + (currentData.changePct || 0) / 100;
    const startPrice = changeFactor !== 0 ? harga / changeFactor : harga;

    const series = [];
    let price = startPrice;
    for (let i = 0; i < cfg.points; i++) {
        const t = i / (cfg.points - 1);
        const drift = (harga - startPrice) * t;
        const noise = (rand() - 0.5) * harga * cfg.vol;
        price = startPrice + drift + noise;
        series.push(Math.max(price, harga * 0.4));
    }
    series[series.length - 1] = harga; // titik terakhir selalu harga real-time
    return series;
}

function initRangeButtons() {
    document.querySelectorAll('.chip-range').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chip-range').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            renderChart(btn.dataset.range);
        });
    });
}

function renderChart(rangeKey) {
    const series = generateSeries(rangeKey);
    const w = 680, h = 220, pad = 10;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = (max - min) || 1;
    const stepX = (w - pad * 2) / (series.length - 1);

    const points = series.map((p, i) => {
        const x = pad + i * stepX;
        const y = pad + (1 - (p - min) / range) * (h - pad * 2);
        return [x, y];
    });

    const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${h - pad} L ${points[0][0].toFixed(1)} ${h - pad} Z`;

    const isUp = series[series.length - 1] >= series[0];
    const color = isUp ? 'var(--green)' : 'var(--red)';

    const gridLines = [0, 1, 2, 3].map((i) => {
        const y = pad + (i * (h - pad * 2)) / 3;
        return `<line x1="${pad}" y1="${y.toFixed(1)}" x2="${w - pad}" y2="${y.toFixed(1)}" stroke="#222" stroke-width="1"/>`;
    }).join('');

    document.getElementById('detailChartBox').innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="220" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </linearGradient>
            </defs>
            ${gridLines}
            <path d="${areaPath}" fill="url(#chartGrad)" stroke="none"/>
            <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="d-flex justify-content-between text-xs text-muted mt-1">
            <span>${formatRupiahShared(min)}</span>
            <span class="fw-bold text-white">${formatRupiahShared(currentData.harga)}</span>
            <span>${formatRupiahShared(max)}</span>
        </div>
    `;
}


/* =====================================================================
   ORDER BOOK -- mock, deterministik per kode (bukan real-time beneran)
   ===================================================================== */
function renderOrderBook() {
    const harga = currentData.harga;
    const rand = seededRandom(hashCode(currentKode + 'ob'));
    const step = Math.max(1, Math.round(harga * 0.0015));
    const levels = 6;

    const asks = [];
    for (let i = levels; i >= 1; i--) {
        asks.push({ price: harga + step * i, lot: Math.round(5 + rand() * 95) });
    }
    const bids = [];
    for (let i = 1; i <= levels; i++) {
        bids.push({ price: Math.max(1, harga - step * i), lot: Math.round(5 + rand() * 95) });
    }
    const maxLot = Math.max(...asks.map((a) => a.lot), ...bids.map((b) => b.lot));

    document.getElementById('askList').innerHTML = asks.map((a) => `
        <div class="ob-row" style="background: linear-gradient(to left, rgba(255,77,77,0.15) ${((a.lot / maxLot) * 100).toFixed(0)}%, transparent 0%);">
            <span class="text-red fw-bold">${a.price.toLocaleString('id-ID')}</span>
            <span class="text-muted">${a.lot}</span>
        </div>
    `).join('');

    document.getElementById('bidList').innerHTML = bids.map((b) => `
        <div class="ob-row" style="background: linear-gradient(to right, rgba(0,204,102,0.15) ${((b.lot / maxLot) * 100).toFixed(0)}%, transparent 0%);">
            <span class="text-green fw-bold">${b.price.toLocaleString('id-ID')}</span>
            <span class="text-muted">${b.lot}</span>
        </div>
    `).join('');
}


/* =====================================================================
   PANEL BELI / JUAL -- langsung di halaman ini (bukan modal)
   ===================================================================== */
function initOrderPanel() {
    document.querySelectorAll('.order-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            panelTab = btn.dataset.tab;
            document.getElementById('panelLotInput').value = 1;
            renderOrderPanel();
        });
    });

    document.getElementById('panelLotMinus').addEventListener('click', () => {
        const input = document.getElementById('panelLotInput');
        input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
        renderOrderPanel();
    });
    document.getElementById('panelLotPlus').addEventListener('click', () => {
        const input = document.getElementById('panelLotInput');
        input.value = (parseInt(input.value, 10) || 0) + 1;
        renderOrderPanel();
    });
    document.getElementById('panelLotInput').addEventListener('input', renderOrderPanel);
    document.getElementById('panelSubmitBtn').addEventListener('click', submitPanelOrder);

    renderOrderPanel();
}

function renderOrderPanel() {
    const harga = currentData.harga;
    const holdingLot = PORTFOLIO_HOLDINGS_SHARED[currentKode] || 0;
    let lot = parseInt(document.getElementById('panelLotInput').value, 10) || 0;

    document.querySelectorAll('.order-tab-btn').forEach((b) => {
        b.classList.remove('active-beli', 'active-jual');
        if (b.dataset.tab === panelTab) {
            b.classList.add(panelTab === 'beli' ? 'active-beli' : 'active-jual');
        }
    });

    const totalLembar = lot * 100;
    const subtotal = totalLembar * harga;
    const feeRate = panelTab === 'beli' ? FEE_BELI_SHARED : FEE_JUAL_SHARED;
    const fee = subtotal * feeRate;
    const total = panelTab === 'beli' ? subtotal + fee : subtotal - fee;

    document.getElementById('panelHargaLembar').textContent = formatRupiahShared(harga);
    document.getElementById('panelHoldingLot').textContent = `${holdingLot.toLocaleString('id-ID')} Lot`;
    document.getElementById('panelTotalLembar').textContent = totalLembar.toLocaleString('id-ID');
    document.getElementById('panelFeeLabel').textContent = `Estimasi Fee (${(feeRate * 100).toFixed(2)}%)`;
    document.getElementById('panelFee').textContent = formatRupiahShared(fee);
    document.getElementById('panelTotalLabel').textContent = panelTab === 'beli' ? 'Total Pembayaran' : 'Total Diterima';
    document.getElementById('panelTotalHarga').textContent = formatRupiahShared(total);

    const submitBtn = document.getElementById('panelSubmitBtn');
    submitBtn.textContent = `Konfirmasi ${panelTab === 'beli' ? 'Beli' : 'Jual'}`;
    if (panelTab === 'jual') {
        submitBtn.style.backgroundColor = 'var(--red)';
        submitBtn.style.color = '#fff';
    } else {
        submitBtn.removeAttribute('style');
    }

    const errorEl = document.getElementById('panelError');
    let error = '';
    if (lot < 1) {
        error = 'Jumlah lot minimal 1.';
    } else if (panelTab === 'jual' && lot > holdingLot) {
        error = `Lot melebihi kepemilikan. Lot yang dimiliki cuma ${holdingLot.toLocaleString('id-ID')}.`;
    }

    if (error) {
        errorEl.textContent = error;
        errorEl.classList.remove('d-none');
        submitBtn.disabled = true;
    } else {
        errorEl.classList.add('d-none');
        submitBtn.disabled = false;
    }
}

function submitPanelOrder() {
    const harga = currentData.harga;
    const lot = parseInt(document.getElementById('panelLotInput').value, 10) || 0;
    const totalLembar = lot * 100;
    const subtotal = totalLembar * harga;
    const feeRate = panelTab === 'beli' ? FEE_BELI_SHARED : FEE_JUAL_SHARED;
    const total = panelTab === 'beli' ? subtotal + subtotal * feeRate : subtotal - subtotal * feeRate;

    if (panelTab === 'beli') {
        PORTFOLIO_HOLDINGS_SHARED[currentKode] = (PORTFOLIO_HOLDINGS_SHARED[currentKode] || 0) + lot;
    } else {
        PORTFOLIO_HOLDINGS_SHARED[currentKode] = Math.max(0, (PORTFOLIO_HOLDINGS_SHARED[currentKode] || 0) - lot);
    }

    document.getElementById('panelLotInput').value = 1;
    renderHeader();
    renderOrderPanel();

    showToast(`Order ${panelTab === 'beli' ? 'Beli' : 'Jual'} ${currentKode} ${lot} lot berhasil disiapkan (${formatRupiahShared(total)}). Fitur ini bakal nyambung ke backend API lu ntar.`);
}
