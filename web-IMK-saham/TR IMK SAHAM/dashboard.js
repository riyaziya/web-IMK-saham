/* =====================================================================
   SahamYES - dashboard.js
   Fungsi-fungsi KHUSUS HALAMAN DASHBOARD saja.
   Pastikan common.js sudah di-load duluan (butuh showToast()).
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initWatchlistCardActions();
    initNewsItems();
    initBrokerRows();
    initChartTooltip();
    initRiwayatDividen();
});


/* =====================================================================
   CARD WATCHLIST UTAMA
   Dropdown three-dots di-handle Bootstrap. "Lihat Semua (24)" navigasi
   ke halaman watchlist.
   ===================================================================== */
function initWatchlistCardActions() {
    const btnLihatSemua = document.getElementById('btnLihatSemuaWatchlist');
    if (btnLihatSemua) {
        btnLihatSemua.addEventListener('click', () => {
            window.location.href = 'watchlist.html';
        });
    }
}


/* =====================================================================
   BERITA TERKINI
   Klik item berita nampilin toast (demo, belum ada backend artikel).
   ===================================================================== */
function initNewsItems() {
    const items = document.querySelectorAll('.news-item');
    if (!items.length) return;

    items.forEach((item) => {
        item.addEventListener('click', () => {
            const titleEl = item.querySelector('.fw-bold');
            const title = titleEl ? titleEl.textContent.trim() : 'berita ini';
            showToast(`Membuka artikel: "${title}"`);
        });
    });
}


/* =====================================================================
   AKTIVITAS BROKER
   Klik baris broker -> arahin ke halaman Ringkasan Broker.
   ===================================================================== */
function initBrokerRows() {
    const rows = document.querySelectorAll('.broker-row');
    if (!rows.length) return;

    rows.forEach((row) => {
        row.addEventListener('click', () => {
            window.location.href = 'ringkasan.html';
        });
    });
}


/* =====================================================================
   TOOLTIP MOCK CHART MINGGUAN
   Hover di bar chart nampilin hari & persentase perubahan.
   ===================================================================== */
function initChartTooltip() {
    const bars = document.querySelectorAll('.mock-chart .bar-fill');
    if (!bars.length) return;

    let tooltip = document.querySelector('.chart-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        document.body.appendChild(tooltip);
    }

    bars.forEach((bar) => {
        bar.addEventListener('mousemove', (e) => {
            const day = bar.dataset.day || '';
            const value = bar.dataset.value || '';
            tooltip.textContent = `${day}: ${value}`;
            tooltip.style.left = (e.clientX + 14) + 'px';
            tooltip.style.top = (e.clientY - 10) + 'px';
            tooltip.classList.add('show');
        });
        bar.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });
    });
}


/* =====================================================================
   RIWAYAT DIVIDEN TERAKUMULASI (FITUR BARU)
   Klik "Lihat Riwayat" di card "Dividen Terakumulasi" -> nampilin
   modal berisi rincian riwayat dividen yang udah masuk, plus total
   akumulasinya biar sinkron sama angka Rp890.000 di card.
   ===================================================================== */
function initRiwayatDividen() {
    const btn = document.getElementById('btnRiwayatDividen');
    if (!btn) return;

    // Data mock riwayat dividen (nanti tinggal diganti fetch API beneran)
    const riwayat = [
        { kode: 'BBCA', nama: 'Bank Central Asia', tanggal: '15 Jul 2026', jumlah: 320000 },
        { kode: 'TLKM', nama: 'Telkom Indonesia',  tanggal: '02 Jun 2026', jumlah: 275000 },
        { kode: 'ASII', nama: 'Astra International', tanggal: '18 Mei 2026', jumlah: 180000 },
        { kode: 'PTBA', nama: 'Bukit Asam',        tanggal: '04 Apr 2026', jumlah: 115000 },
    ];

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        showRiwayatDividenModal(riwayat);
    });
}

function showRiwayatDividenModal(riwayat) {
    // Pastikan modal cuma dibikin sekali, kalo udah ada tinggal dipake ulang
    let modalEl = document.getElementById('riwayatDividenModal');
    const total = riwayat.reduce((sum, r) => sum + r.jumlah, 0);
    const formatRupiah = (n) => 'Rp' + n.toLocaleString('id-ID');

    const rowsHtml = riwayat.map((r) => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom" style="border-color:#1f1f1f!important;">
            <div class="d-flex align-items-center gap-3">
                <div class="bg-dark rounded px-2 py-1 text-xs fw-bold border" style="border-color:#333!important;">${r.kode}</div>
                <div>
                    <div class="text-sm fw-bold">${r.nama}</div>
                    <div class="text-xs text-muted">${r.tanggal}</div>
                </div>
            </div>
            <div class="text-sm fw-bold text-accent">+${formatRupiah(r.jumlah)}</div>
        </div>
    `).join('');

    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'riwayatDividenModal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="background-color: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main);">
                    <div class="modal-header" style="border-color: var(--border-color)!important;">
                        <h6 class="modal-title fw-bold">Riwayat Dividen Terakumulasi</h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Tutup"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="text-muted text-sm">Total Diterima</span>
                            <span class="fw-bold text-accent" id="riwayatDividenTotal"></span>
                        </div>
                        <div id="riwayatDividenList"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }

    modalEl.querySelector('#riwayatDividenTotal').textContent = formatRupiah(total);
    modalEl.querySelector('#riwayatDividenList').innerHTML = rowsHtml;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}
