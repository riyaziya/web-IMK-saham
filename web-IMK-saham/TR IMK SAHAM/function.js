/* =====================================================================
   SahamYES - common.js
   Fungsi-fungsi yang DIPAKE DI SEMUA HALAMAN: toast system, search bar
   header, dropdown notifikasi, dropdown profile. File ini WAJIB
   di-load duluan sebelum JS khusus tiap halaman (dashboard.js,
   portofolio.js, saham.js, pengaturan.js), karena mereka pake
   showToast() dari sini.

   Setiap fungsi di-guard pake pengecekan "elemen ada apa nggak"
   (if (el) {...}), jadi aman dipanggil di halaman mana pun.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initToastSystem();
    initGlobalSearch();
    initNotifDropdown();
    initProfileDropdown();
});


/* =====================================================================
   TOAST SYSTEM
   Notifikasi ringan pojok kanan bawah, dipake gantiin alert() polos
   biar nggak ngeblok interaksi & lebih matching sama tema gelap.
   ===================================================================== */
function initToastSystem() {
    if (!document.getElementById('toast-stack')) {
        const stack = document.createElement('div');
        stack.id = 'toast-stack';
        document.body.appendChild(stack);
    }
}

function showToast(message, type = 'info') {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = 'app-toast' + (type === 'error' ? ' toast-error' : '');
    toast.textContent = message;
    stack.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}


/* =====================================================================
   HEADER: SEARCH BAR
   Tekan Enter di search bar header buat "nyari".
   ===================================================================== */
function initGlobalSearch() {
    const input = document.getElementById('globalSearchInput');
    if (!input) return;

    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const query = input.value.trim();
        if (!query) return;
        showToast(`Mencari "${query}"... (fitur pencarian real-time segera hadir)`);
        input.value = '';
    });
}


/* =====================================================================
   HEADER: NOTIFIKASI DROPDOWN
   Toggle dropdown-nya sendiri udah di-handle Bootstrap (data-bs-toggle).
   Di sini cuma nambahin feedback pas item notifikasi diklik.
   ===================================================================== */
function initNotifDropdown() {
    const bell = document.getElementById('notifBell');
    if (!bell) return;

    const menu = bell.nextElementSibling;
    if (!menu) return;

    menu.querySelectorAll('.dropdown-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Fitur pusat notifikasi lengkap segera hadir.');
        });
    });
}


/* =====================================================================
   HEADER: PROFILE DROPDOWN
   "Profil Saya" & "Pengaturan" udah beneran navigasi ke pengaturan.html
   lewat href, jadi cuma perlu handle tombol "Keluar".
   ===================================================================== */
function initProfileDropdown() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const confirmLogout = confirm('Yakin mau keluar dari akun SahamYES?');
        if (confirmLogout) {
            showToast('Berhasil keluar. Sampai jumpa lagi!');
        }
    });
}