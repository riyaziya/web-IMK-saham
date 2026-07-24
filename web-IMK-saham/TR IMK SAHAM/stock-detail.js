/* =====================================================================
   SahamYES - stock-detail.js
   Elemen ber-class .stock-clickable (kartu / baris saham) -> pas diklik,
   diarahin ke halaman detail-saham.html?kode=KODE yang isinya grafik
   lebih detail, order book, dan panel Beli/Jual.
   Dipakai BARENG di saham.html & watchlist.html.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initStockDetailClicks();
});

function initStockDetailClicks() {
    const clickables = document.querySelectorAll('.stock-clickable');
    if (!clickables.length) return;

    clickables.forEach((el) => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
            // Jangan pindah halaman kalau yang diklik tombol Beli atau link lain
            if (e.target.closest('.btn-beli, .no-detail, a')) return;

            const kode = el.dataset.kode;
            if (!kode) return;
            window.location.href = `detail-saham.html?kode=${encodeURIComponent(kode)}`;
        });
    });
}