/* =====================================================================
   SahamYES - pengaturan.js
   Fungsi-fungsi KHUSUS HALAMAN PENGATURAN saja.
   Pastikan common.js sudah di-load duluan (butuh showToast()).

   Sebelumnya banyak kontrol di halaman ini (baris keamanan, tombol
   edit foto, copy ID investor, simpan perubahan, hapus akun, switch
   notifikasi, select bahasa/mata uang) nggak punya event handler sama
   sekali -- diklik nggak ngapa-ngapain. Semuanya di-fix di sini.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initThemeSwitch();
    initEditFoto();
    initCopyIdInvestor();
    initSimpanProfil();
    initSecurityRows();
    initNotifToggles();
    initPreferensiSelect();
    initHapusAkun();
});


/* =====================================================================
   TEMA APLIKASI (Dark / Light)
   Catatan: masih demo visual (ganti state tombol aja), karena versi
   Light Mode beneran belum digarap. Dikasih toast biar jelas ini demo,
   nggak keliatan kayak tombolnya rusak/nggak ngapa-ngapain.
   ===================================================================== */
function initThemeSwitch() {
    const btnDark = document.getElementById('btn-dark-mode');
    const btnLight = document.getElementById('btn-light-mode');
    if (!btnDark || !btnLight) return;

    btnDark.addEventListener('click', () => {
        if (btnDark.classList.contains('active')) return;
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
        showToast('Dark Mode diaktifkan.');
    });

    btnLight.addEventListener('click', () => {
        if (btnLight.classList.contains('active')) return;
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
        showToast('Light Mode segera hadir -- tampilan gelap dipertahankan dulu buat sekarang.');
    });
}


/* =====================================================================
   EDIT FOTO PROFIL
   Klik badge pensil -> buka file picker -> preview foto yang dipilih.
   ===================================================================== */
function initEditFoto() {
    const btnEdit = document.getElementById('btnEditFoto');
    const input = document.getElementById('inputFotoProfil');
    const preview = document.getElementById('profilePicPreview');
    if (!btnEdit || !input) return;

    btnEdit.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('Ukuran file maksimal 2MB.', 'error');
            input.value = '';
            return;
        }

        if (preview) {
            const reader = new FileReader();
            reader.onload = (e) => { preview.src = e.target.result; };
            reader.readAsDataURL(file);
        }
        showToast('Foto profil berhasil diganti. Klik "Simpan Perubahan" buat konfirmasi.');
    });
}


/* =====================================================================
   COPY ID INVESTOR
   ===================================================================== */
function initCopyIdInvestor() {
    const btn = document.getElementById('btnCopyIdInvestor');
    const input = document.getElementById('inputIdInvestor');
    if (!btn || !input) return;

    btn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(input.value);
            showToast(`ID Investor "${input.value}" berhasil disalin.`);
        } catch (err) {
            input.select();
            showToast('Nggak bisa akses clipboard, ID udah di-select buat di-copy manual.', 'error');
        }
    });
}


/* =====================================================================
   SIMPAN PERUBAHAN PROFIL
   ===================================================================== */
function initSimpanProfil() {
    const btn = document.getElementById('btnSimpanProfil');
    const nama = document.getElementById('inputNamaLengkap');
    const telepon = document.getElementById('inputTelepon');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (nama && !nama.value.trim()) {
            showToast('Nama lengkap nggak boleh kosong.', 'error');
            nama.focus();
            return;
        }
        if (telepon && !telepon.value.trim()) {
            showToast('Nomor telepon nggak boleh kosong.', 'error');
            telepon.focus();
            return;
        }
        showToast('Perubahan profil berhasil disimpan.');
    });
}


/* =====================================================================
   BARIS KEAMANAN (Kata Sandi, 2FA, Perangkat Terhubung)
   ===================================================================== */
function initSecurityRows() {
    const rowKataSandi = document.getElementById('rowKataSandi');
    if (rowKataSandi) {
        rowKataSandi.addEventListener('click', () => {
            showToast('Fitur ubah kata sandi segera hadir.');
        });
    }

    const rowPerangkat = document.getElementById('rowPerangkatTerhubung');
    if (rowPerangkat) {
        rowPerangkat.addEventListener('click', () => {
            showToast('Menampilkan daftar perangkat aktif (segera hadir).');
        });
    }

    const toggle2FA = document.getElementById('toggle2FA');
    if (toggle2FA) {
        toggle2FA.addEventListener('click', (e) => e.stopPropagation());
        toggle2FA.addEventListener('change', () => {
            showToast(toggle2FA.checked
                ? 'Autentikasi 2 Faktor diaktifkan.'
                : 'Autentikasi 2 Faktor dinonaktifkan.');
        });
    }
}


/* =====================================================================
   SWITCH NOTIFIKASI
   ===================================================================== */
function initNotifToggles() {
    document.querySelectorAll('.notif-toggle').forEach((toggle) => {
        toggle.addEventListener('change', () => {
            const label = toggle.dataset.label || 'Notifikasi';
            showToast(`${label} ${toggle.checked ? 'diaktifkan' : 'dinonaktifkan'}.`);
        });
    });
}


/* =====================================================================
   PREFERENSI APLIKASI (Bahasa & Mata Uang)
   ===================================================================== */
function initPreferensiSelect() {
    const selectBahasa = document.getElementById('selectBahasa');
    if (selectBahasa) {
        selectBahasa.addEventListener('change', () => {
            showToast(`Bahasa diganti ke ${selectBahasa.value}.`);
        });
    }

    const selectMataUang = document.getElementById('selectMataUang');
    if (selectMataUang) {
        selectMataUang.addEventListener('change', () => {
            showToast(`Mata uang tampilan diganti ke ${selectMataUang.value}.`);
        });
    }
}


/* =====================================================================
   ZONA BERBAHAYA: HAPUS AKUN
   ===================================================================== */
function initHapusAkun() {
    const btn = document.getElementById('btnHapusAkun');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const konfirmasi = confirm('Yakin mau menghapus akun SahamYES lu? Semua data investasi & portofolio bakal hilang permanen dan nggak bisa dibatalkan.');
        if (konfirmasi) {
            showToast('Permintaan hapus akun diterima. Tim kami akan proses dalam 1x24 jam.', 'error');
        }
    });
}
