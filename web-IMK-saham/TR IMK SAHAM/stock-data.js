/* =====================================================================
   SahamYES - stock-data.js
   Sumber data mock saham TERPUSAT -- dipakai di detail-saham.html.
   Kalau nanti nyambung ke backend beneran, tinggal ganti isi STOCK_DATA
   ini jadi hasil fetch API (struktur objeknya dipertahanin aja).
   ===================================================================== */

const STOCK_DATA = {
    BBCA: { nama: 'Bank Central Asia Tbk.', harga: 9850, open: 9550, changePct: 3.1, changeNominal: 300, sektor: 'Perbankan', yieldPct: null, icon: 'BCA' },
    TLKM: { nama: 'Telkom Indonesia Tbk.', harga: 3920, open: 3940, changePct: -0.7, changeNominal: -20, sektor: 'Telekomunikasi', yieldPct: null, icon: 'TLK' },
    ADRO: { nama: 'Adaro Energy Indonesia Tbk.', harga: 2740, open: 2620, changePct: 4.5, changeNominal: 120, sektor: 'Energi', yieldPct: null, icon: 'ADR' },
    GOTO: { nama: 'GoTo Gojek Tokopedia Tbk.', harga: 64, open: 64, changePct: 0, changeNominal: 0, sektor: 'Teknologi', yieldPct: null, icon: 'GTO' },
    ITMG: { nama: 'Indo Tambangraya Megah Tbk.', harga: 25425, open: 25225, changePct: 0.8, changeNominal: 200, sektor: 'Pertambangan', yieldPct: 15.4, icon: 'IT' },
    PTBA: { nama: 'Bukit Asam Tbk.', harga: 2410, open: 2440, changePct: -1.2, changeNominal: -30, sektor: 'Pertambangan', yieldPct: 12.8, icon: 'PT' },
    ASII: { nama: 'Astra International Tbk.', harga: 5125, open: 5050, changePct: 1.5, changeNominal: 75, sektor: 'Otomotif', yieldPct: 8.2, icon: 'AS' },
};

// Mock kepemilikan saham (lot) -- dipakai panel Beli/Jual di detail-saham.html
const PORTFOLIO_HOLDINGS_SHARED = {
    BBCA: 250,
    TLKM: 1200,
    GOTO: 15000,
};

const FEE_BELI_SHARED = 0.0015;  // 0.15%
const FEE_JUAL_SHARED = 0.0025;  // 0.25%

function formatRupiahShared(n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
}
