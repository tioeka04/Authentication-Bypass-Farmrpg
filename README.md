# Tugas 2 - FarmRPG: Authentication Bypass via Session Cookie

## Persiapan (manual, cuma kamu yang bisa)

1. Buka farmrpg.com, buat akun, login manual di browser biasa.
2. Tekan F12 -> tab **Application** -> **Cookies** -> `https://farmrpg.com`.
3. Cari cookie session (nama umumnya `HighwindFRPG`), catat **Name** dan **Value**.
4. Buka `index.js`, isi `COOKIE_NAME` dan `COOKIE_VALUE`.
   (atau lewat env: `FRPG_COOKIE_VALUE="xxxx" node index.js`)

## Jalanin

```
npm install
node index.js
```

## Yang terjadi

1. Browser kebuka (headless: false), masuk farmrpg.com dalam keadaan belum login.
2. Cookie di-inject pakai `page.setCookie()`.
3. Halaman game di-reload, script verifikasi tidak diarahkan ke halaman login.
4. Bot pindah ke Town lalu klik menu Farm, dengan jeda supaya terlihat jelas.
5. Screenshot bukti tersimpan: `1-sebelum-login.png` ... `4-aksi-farm.png`.

## Catatan

- Value cookie = akses penuh ke akunmu. Jangan di-share / di-upload / ditampilkan di screenshot laporan.
- Kalau muncul "Belum login": cookie kadaluarsa atau salah nama. Login ulang, ambil cookie baru.
- Puppeteer dipin ke v22 karena `page.setCookie()` dihapus di versi terbaru
  (script tetap punya fallback ke `browser.setCookie()`).
- Kalau aksi klik tidak menemukan tombol, ganti teks di `clickByText(page, [...])`
  sesuai menu yang kamu lihat di game (atau ikuti aksi yang dicontohkan di video).
