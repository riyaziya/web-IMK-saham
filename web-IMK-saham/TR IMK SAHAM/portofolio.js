/* =====================================================================
   SahamYES - portofolio.js
   Fungsi-fungsi KHUSUS HALAMAN PORTOFOLIO saja.
   Pastikan common.js sudah di-load duluan (butuh showToast()).
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTimeFilter();
    initHoldingTable();
});


/* =====================================================================
   FILTER WAKTU PERFORMA PORTOFOLIO (1W / 1M / 6M / YTD)
   Sebelumnya tombol ini cuma toggle class "active" doang tanpa efek
   apa-apa ke chart. Sekarang tiap periode punya data candlestick
   mock-nya sendiri, jadi chart & subtitle beneran keganti pas diklik.
   ===================================================================== */
const PERFORMA_DATA = {
    '1W': {
        subtitle: 'Pertumbuhan nilai aset 1 minggu terakhir',
        candles: [
            { label: 'Sen', color: 'red',   wickH: 45, wickB: 15, bodyH: 20, bodyB: 25 },
            { label: 'Sel', color: 'green', wickH: 55, wickB: 25, bodyH: 25, bodyB: 30 },
            { label: 'Rab', color: 'red',   wickH: 40, wickB: 20, bodyH: 18, bodyB: 28 },
            { label: 'Kam', color: 'green', wickH: 65, wickB: 25, bodyH: 30, bodyB: 35 },
            { label: 'Jum', color: 'green', wickH: 70, wickB: 30, bodyH: 35, bodyB: 40 },
            { label: 'Sab', color: 'red',   wickH: 35, wickB: 15, bodyH: 15, bodyB: 22 },
            { label: 'Min', color: 'green', wickH: 60, wickB: 30, bodyH: 28, bodyB: 38 },
        ],
    },
    '1M': {
        subtitle: 'Pertumbuhan nilai aset 1 bulan terakhir',
        candles: [
            { label: 'M1', color: 'green', wickH: 55, wickB: 20, bodyH: 28, bodyB: 30 },
            { label: 'M2', color: 'red',   wickH: 45, wickB: 15, bodyH: 20, bodyB: 22 },
            { label: 'M3', color: 'green', wickH: 75, wickB: 30, bodyH: 40, bodyB: 42 },
            { label: 'M4', color: 'green', wickH: 85, wickB: 35, bodyH: 50, bodyB: 45 },
        ],
    },
    '6M': {
        subtitle: 'Pertumbuhan nilai aset 6 bulan terakhir',
        candles: [
            { label: 'JAN', color: 'green', wickH: 60, wickB: 10, bodyH: 30, bodyB: 20 },
            { label: 'FEB', color: 'green', wickH: 70, wickB: 30, bodyH: 40, bodyB: 40 },
            { label: 'MAR', color: 'red',   wickH: 50, wickB: 25, bodyH: 25, bodyB: 30 },
            { label: 'APR', color: 'green', wickH: 80, wickB: 40, bodyH: 45, bodyB: 50 },
            { label: 'MEI', color: 'green', wickH: 60, wickB: 40, bodyH: 35, bodyB: 50 },
            { label: 'JUN', color: 'green', wickH: 90, wickB: 30, bodyH: 60, bodyB: 45, accentLabel: true },
        ],
    },
    'YTD': {
        subtitle: 'Pertumbuhan nilai aset year-to-date (Jan - Jul 2026)',
        candles: [
            { label: 'JAN', color: 'green', wickH: 50, wickB: 10, bodyH: 25, bodyB: 18 },
            { label: 'FEB', color: 'green', wickH: 60, wickB: 25, bodyH: 32, bodyB: 32 },
            { label: 'MAR', color: 'red',   wickH: 45, wickB: 20, bodyH: 20, bodyB: 25 },
            { label: 'APR', color: 'green', wickH: 70, wickB: 35, bodyH: 40, bodyB: 42 },
            { label: 'MEI', color: 'green', wickH: 55, wickB: 35, bodyH: 30, bodyB: 42 },
            { label: 'JUN', color: 'green', wickH: 80, wickB: 25, bodyH: 55, bodyB: 38 },
            { label: 'JUL', color: 'green', wickH: 95, wickB: 30, bodyH: 65, bodyB: 45, accentLabel: true },
        ],
    },
};

function initTimeFilter() {
    const filters = document.querySelectorAll('.time-filter');
    if (!filters.length) return;

    filters.forEach((btn) => {
        btn.addEventListener('click', function () {
            filters.forEach((f) => f.classList.remove('active'));
            this.classList.add('active');
            const period = this.dataset.period || this.textContent.trim();

            renderPerformaChart(period);
            showToast(`Menampilkan performa portofolio periode ${period}`);
        });
    });
}

function renderPerformaChart(period) {
    const data = PERFORMA_DATA[period];
    const chartEl = document.getElementById('candleChart');
    const subtitleEl = document.getElementById('performaSubtitle');
    if (!data || !chartEl) return;

    chartEl.innerHTML = data.candles.map((c) => `
        <div class="text-center">
            <div class="candle-track">
                <div class="candle-wick ${c.color}" style="height: ${c.wickH}%; bottom: ${c.wickB}%;"></div>
                <div class="candle-body ${c.color}" style="height: ${c.bodyH}%; bottom: ${c.bodyB}%;"></div>
            </div>
            <div class="${c.accentLabel ? 'text-accent fw-bold' : 'text-muted'} text-xs mt-2">${c.label}</div>
        </div>
    `).join('');

    if (subtitleEl) subtitleEl.textContent = data.subtitle;
}


/* =====================================================================
   TABEL KEPEMILIKAN SAHAM
   - Sort by kolom (klik header)
   - Filter (profit / loss / semua)
   - Export ke CSV
   - "Lihat Semua Kepemilikan"
   ===================================================================== */
function initHoldingTable() {
    const table = document.getElementById('holdingTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const getRows = () => Array.from(tbody.querySelectorAll('tr.holding-row'));

    let sortState = { key: null, dir: 1 };
    table.querySelectorAll('.sortable-th').forEach((th) => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            sortState.dir = (sortState.key === key) ? sortState.dir * -1 : 1;
            sortState.key = key;

            const rows = getRows();
            rows.sort((a, b) => {
                let va, vb;
                if (key === 'name') {
                    va = a.dataset.name; vb = b.dataset.name;
                    return va.localeCompare(vb) * sortState.dir;
                }
                va = parseFloat(a.dataset[key]);
                vb = parseFloat(b.dataset[key]);
                return (va - vb) * sortState.dir;
            });
            rows.forEach((row) => tbody.appendChild(row));
            showToast(`Diurutkan berdasarkan ${th.textContent.trim()} (${sortState.dir === 1 ? 'naik' : 'turun'})`);
        });
    });

    document.querySelectorAll('.filter-holding').forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = item.dataset.filter;
            getRows().forEach((row) => {
                const pl = parseFloat(row.dataset.pl);
                let show = true;
                if (filter === 'profit') show = pl >= 0;
                if (filter === 'loss') show = pl < 0;
                row.style.display = show ? '' : 'none';
            });
            showToast(filter === 'all' ? 'Menampilkan semua saham' : `Menampilkan saham yang ${filter === 'profit' ? 'profit' : 'loss'} aja`);
        });
    });

    const exportBtn = document.getElementById('exportHoldingBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const rows = getRows().filter((r) => r.style.display !== 'none');
            if (!rows.length) {
                showToast('Nggak ada data buat di-export.', 'error');
                return;
            }
            let csv = 'Saham,Lot,Current Price,Profit/Loss (%)\n';
            rows.forEach((row) => {
                csv += `${row.dataset.name},${row.dataset.lot},${row.dataset.price},${row.dataset.pl}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kepemilikan-saham-sahamyes.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('File CSV kepemilikan saham berhasil diunduh.');
        });
    }

    const lihatSemua = document.getElementById('lihatSemuaKepemilikan');
    if (lihatSemua) {
        lihatSemua.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Menampilkan seluruh 14 emiten (contoh data cuma 3 emiten).');
        });
    }
}
