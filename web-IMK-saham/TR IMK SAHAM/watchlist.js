/* =====================================================================
   SahamYES - watchlist.js
   Fungsi-fungsi KHUSUS HALAMAN WATCHLIST saja.
   Pastikan common.js (butuh showToast()) dan stock-detail.js (buat modal
   detail saham pas baris diklik) sudah di-load duluan.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initFilterChips();
    initLihatSemuaLink();
    initAlertButtons();
});


/* =====================================================================
   FILTER CHIPS (Semua / Naik / Turun / Top Gainer / Top Loser)
   ===================================================================== */
function initFilterChips() {
    const chips = document.querySelectorAll('.chip-filter');
    if (!chips.length) return;

    chips.forEach((chip) => {
        chip.addEventListener('click', function () {
            chips.forEach((c) => c.classList.remove('active'));
            this.classList.add('active');
            if (typeof showToast === 'function') {
                showToast(`Filter diubah ke "${this.textContent.trim()}"`);
            }
        });
    });
}


/* =====================================================================
   LINK "Lihat 21 Saham Lainnya"
   ===================================================================== */
function initLihatSemuaLink() {
    const link = document.querySelector('.card-custom a.text-accent');
    if (!link) return;

    link.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof showToast === 'function') {
            showToast('Menampilkan seluruh saham di watchlist (segera hadir).');
        }
    });
}


/* =====================================================================
   TOMBOL DI ALERT CARD (Tambah Alert Baru / Riwayat Notifikasi)
   ===================================================================== */
function initAlertButtons() {
    const buttons = document.querySelectorAll('.alert-card button');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (typeof showToast === 'function') {
                showToast(`"${btn.textContent.trim()}" segera hadir.`);
            }
        });
    });
}