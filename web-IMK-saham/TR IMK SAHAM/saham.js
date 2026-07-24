/* =====================================================================
   SahamYES - saham.js
   Fungsi-fungsi KHUSUS HALAMAN SAHAM saja.
   Pastikan common.js sudah di-load duluan (butuh showToast()).
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initBeliButtons();
    initTrendingSection();
    initDividenSection();
    initBacaLaporanButton();
});


/* =====================================================================
   MODAL BELI / JUAL SAHAM
   Klik tombol "Beli" di stock-card atau dividen-row -> buka modal
   dengan 2 tab (Beli / Jual). User atur jumlah lot lewat stepper,
   total pembayaran/penerimaan (harga x lot x 100 lembar + fee)
   dihitung otomatis. Tab Jual divalidasi ke jumlah lot yang beneran
   dimiliki (data mock, selaras sama tabel kepemilikan di portofolio.html).
   ===================================================================== */

// Shared portfolio holdings reference
const PORTFOLIO_HOLDINGS = window.PORTFOLIO_HOLDINGS_SHARED || {
    BBCA: 250,
    TLKM: 1200,
    GOTO: 15000,
};

const FEE_BELI = 0.0015;  // 0.15%
const FEE_JUAL = 0.0025;  // 0.25%

let currentOrder = { kode: '', nama: '', harga: 0, tab: 'beli' };

function initBeliButtons() {
    const buttons = document.querySelectorAll('.btn-beli');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const kode = btn.dataset.kode;
            const nama = btn.dataset.nama;
            const harga = parseInt(btn.dataset.harga, 10);

            if (!kode || !harga) {
                showToast('Data saham nggak lengkap.', 'error');
                return;
            }

            currentOrder = { kode, nama, harga, tab: 'beli' };
            openOrderModal();
        });
    });
}

function formatRupiah(n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
}

function getOrderModalEl() {
    let modalEl = document.getElementById('orderModal');
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.id = 'orderModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="background-color: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main);">
                <div class="modal-header" style="border-color: var(--border-color)!important;">
                    <div>
                        <h6 class="modal-title fw-bold mb-1" id="orderStockName">-</h6>
                        <div class="text-xs text-muted" id="orderStockDesc">-</div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Tutup"></button>
                </div>
                <div class="modal-body">
                    <div class="d-flex gap-2 mb-4">
                        <button type="button" class="order-tab-btn flex-fill rounded" data-tab="beli">Beli</button>
                        <button type="button" class="order-tab-btn flex-fill rounded" data-tab="jual">Jual</button>
                    </div>

                    <div class="d-flex justify-content-between text-sm mb-2">
                        <span class="text-muted">Harga per Lembar</span>
                        <span class="fw-bold" id="orderHargaLembar">-</span>
                    </div>
                    <div class="d-flex justify-content-between text-sm mb-3" id="orderHoldingRow">
                        <span class="text-muted">Lot Dimiliki</span>
                        <span class="fw-bold" id="orderHoldingLot">0 Lot</span>
                    </div>

                    <label class="text-xs text-muted fw-bold mb-2 d-block">Jumlah Lot (1 Lot = 100 Lembar)</label>
                    <div class="d-flex align-items-center gap-2 mb-4">
                        <button type="button" class="order-lot-btn" id="orderLotMinus">&minus;</button>
                        <input type="number" class="form-control form-control-dark text-center" id="orderLotInput" value="1" min="1">
                        <button type="button" class="order-lot-btn" id="orderLotPlus">&plus;</button>
                    </div>

                    <div class="order-summary-box">
                        <div class="d-flex justify-content-between text-sm mb-2">
                            <span class="text-muted">Total Lembar</span>
                            <span id="orderTotalLembar">100</span>
                        </div>
                        <div class="d-flex justify-content-between text-sm mb-2">
                            <span class="text-muted" id="orderFeeLabel">Estimasi Fee (0.15%)</span>
                            <span id="orderFee">-</span>
                        </div>
                        <div class="d-flex justify-content-between fw-bold pt-2 border-top" style="border-color: var(--border-color)!important;">
                            <span id="orderTotalLabel">Total Pembayaran</span>
                            <span class="text-accent" id="orderTotalHarga">-</span>
                        </div>
                    </div>

                    <div class="text-red text-xs mt-3 d-none" id="orderError"></div>
                </div>
                <div class="modal-footer border-0 pt-0">
                    <button type="button" class="btn-buy-neon w-100" id="orderSubmitBtn">Konfirmasi Beli</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalEl);

    // Event listener dipasang sekali aja pas modal dibikin
    modalEl.querySelectorAll('.order-tab-btn').forEach((tabBtn) => {
        tabBtn.addEventListener('click', () => {
            currentOrder.tab = tabBtn.dataset.tab;
            document.getElementById('orderLotInput').value = 1;
            renderOrderModal();
        });
    });

    document.getElementById('orderLotMinus').addEventListener('click', () => {
        const input = document.getElementById('orderLotInput');
        input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
        renderOrderModal();
    });
    document.getElementById('orderLotPlus').addEventListener('click', () => {
        const input = document.getElementById('orderLotInput');
        input.value = (parseInt(input.value, 10) || 0) + 1;
        renderOrderModal();
    });
    document.getElementById('orderLotInput').addEventListener('input', renderOrderModal);
    document.getElementById('orderSubmitBtn').addEventListener('click', submitOrder);

    return modalEl;
}

function openOrderModal() {
    getOrderModalEl();
    document.getElementById('orderLotInput').value = 1;
    renderOrderModal();

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('orderModal'));
    modal.show();
}

// Dipanggil dari luar (mis. tombol "Beli Saham" di modal detail-saham.js / analisis.html)
// biar halaman lain (watchlist.html, analisis.html, dll) bisa munculin modal Beli/Jual ini juga.
window.openOrderModalFor = function (kode, nama, harga, tab = 'beli') {
    const sharedHoldings = window.PORTFOLIO_HOLDINGS_SHARED || PORTFOLIO_HOLDINGS;
    currentOrder = { kode, nama, harga: parseInt(harga, 10) || 0, tab: tab || 'beli' };
    openOrderModal();
};

function renderOrderModal() {
    const { kode, nama, harga, tab } = currentOrder;
    const holdingLot = PORTFOLIO_HOLDINGS[kode] || 0;
    let lot = parseInt(document.getElementById('orderLotInput').value, 10) || 0;

    document.getElementById('orderStockName').textContent = kode;
    document.getElementById('orderStockDesc').textContent = nama;
    document.getElementById('orderHargaLembar').textContent = formatRupiah(harga);
    document.getElementById('orderHoldingLot').textContent = `${holdingLot.toLocaleString('id-ID')} Lot`;

    // Styling tab aktif
    document.querySelectorAll('.order-tab-btn').forEach((b) => {
        b.classList.remove('active-beli', 'active-jual');
        if (b.dataset.tab === tab) {
            b.classList.add(tab === 'beli' ? 'active-beli' : 'active-jual');
        }
    });

    const totalLembar = lot * 100;
    const subtotal = totalLembar * harga;
    const feeRate = tab === 'beli' ? FEE_BELI : FEE_JUAL;
    const fee = subtotal * feeRate;
    const total = tab === 'beli' ? subtotal + fee : subtotal - fee;

    document.getElementById('orderTotalLembar').textContent = totalLembar.toLocaleString('id-ID');
    document.getElementById('orderFeeLabel').textContent = `Estimasi Fee (${(feeRate * 100).toFixed(2)}%)`;
    document.getElementById('orderFee').textContent = formatRupiah(fee);
    document.getElementById('orderTotalLabel').textContent = tab === 'beli' ? 'Total Pembayaran' : 'Total Diterima';
    document.getElementById('orderTotalHarga').textContent = formatRupiah(total);

    const submitBtn = document.getElementById('orderSubmitBtn');
    submitBtn.textContent = `Konfirmasi ${tab === 'beli' ? 'Beli' : 'Jual'}`;
    submitBtn.className = tab === 'beli' ? 'btn-buy-neon w-100' : 'w-100 btn';
    if (tab === 'jual') {
        submitBtn.style.backgroundColor = 'var(--red)';
        submitBtn.style.color = '#fff';
        submitBtn.style.fontWeight = '600';
        submitBtn.style.borderRadius = '8px';
        submitBtn.style.border = 'none';
    } else {
        submitBtn.removeAttribute('style');
    }

    // Validasi
    const errorEl = document.getElementById('orderError');
    let error = '';
    if (lot < 1) {
        error = 'Jumlah lot minimal 1.';
    } else if (tab === 'jual' && lot > holdingLot) {
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

function submitOrder() {
    const { kode, tab, harga } = currentOrder;
    const lot = parseInt(document.getElementById('orderLotInput').value, 10) || 0;
    const totalLembar = lot * 100;
    const subtotal = totalLembar * harga;
    const feeRate = tab === 'beli' ? FEE_BELI : FEE_JUAL;
    const total = tab === 'beli' ? subtotal + subtotal * feeRate : subtotal - subtotal * feeRate;

    // Update shared kepemilikan biar konsisten di semua halaman (portofolio, detail-saham, analisis)
    const holdings = window.PORTFOLIO_HOLDINGS_SHARED || PORTFOLIO_HOLDINGS;
    if (tab === 'beli') {
        holdings[kode] = (holdings[kode] || 0) + lot;
    } else {
        holdings[kode] = Math.max(0, (holdings[kode] || 0) - lot);
    }

    const modalEl = document.getElementById('orderModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    showToast(`Order ${tab === 'beli' ? 'Beli' : 'Jual'} ${kode} ${lot} lot berhasil disiapkan (${formatRupiah(total)}). Fitur ini bakal nyambung ke backend API lu ntar.`);
    
    // Callback kalau halaman punya handler update (misal: analisis.html, detail-saham.html)
    if (typeof window.onOrderSubmitted === 'function') {
        window.onOrderSubmitted(kode, tab, lot);
    }
}


/* =====================================================================
   SECTION "PALING BANYAK DIBELI"
   ===================================================================== */
function initTrendingSection() {
    const link = document.getElementById('lihatSemuaTrending');
    if (!link) return;

    link.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Menampilkan semua saham trending (segera hadir).');
    });
}


/* =====================================================================
   SECTION "DIVIDEN GEDE"
   - Filter (semua / high yield aja)
   - Sort berdasarkan yield (toggle asc/desc)
   ===================================================================== */
function initDividenSection() {
    const list = document.getElementById('dividenList');
    if (!list) return;

    const getRows = () => Array.from(list.querySelectorAll('.dividen-row'));

    document.querySelectorAll('.filter-dividen').forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = item.dataset.filter;
            getRows().forEach((row) => {
                const show = filter === 'all' || row.dataset.tier === 'high';
                row.style.display = show ? '' : 'none';
            });
            showToast(filter === 'all' ? 'Menampilkan semua saham dividen' : 'Menampilkan saham dividen yield HIGH aja');
        });
    });

    const sortBtn = document.getElementById('dividenSortBtn');
    if (sortBtn) {
        let dir = -1;
        sortBtn.addEventListener('click', () => {
            dir *= -1;
            const rows = getRows();
            rows.sort((a, b) => (parseFloat(a.dataset.yield) - parseFloat(b.dataset.yield)) * dir);
            rows.forEach((row) => list.appendChild(row));
            const icon = sortBtn.querySelector('i');
            if (icon) icon.className = dir === 1 ? 'bi bi-sort-up' : 'bi bi-sort-down';
            showToast(`Diurutkan berdasarkan dividend yield (${dir === 1 ? 'terendah' : 'tertinggi'} dulu)`);
        });
    }
}


/* =====================================================================
   TOMBOL "BACA LAPORAN LENGKAP"
   Arahin ke halaman Analisis.
   ===================================================================== */
function initBacaLaporanButton() {
    const btn = document.getElementById('btnBacaLaporan');
    if (!btn) return;

    btn.addEventListener('click', () => {
        window.location.href = 'analisis.html';
    });
}