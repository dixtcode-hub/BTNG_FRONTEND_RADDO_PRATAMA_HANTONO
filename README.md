# VELORA — Tugas Akhir BTNG Frontend

Showroom mobil dengan HTML5, CSS3, dan Vanilla JavaScript. Tidak menggunakan framework JavaScript.

## Struktur
- index.html: struktur halaman
- style.css: desain, layout grid/flex, media query
- script.js: fetch API, DOM, pencarian, filter, sorting, modal, favorit

## API wajib
GET https://api-web.dnccudinus.org/api/mobil

`loadCars()` menggunakan `fetch()`, memeriksa HTTP dan `result.data`, lalu memanggil `renderCars()`. `cardFor()` membuat kartu melalui `document.createElement()`. Data API dimasukkan menggunakan `textContent` agar aman. Tidak ada data mobil tiruan saat API gagal. Loading, timeout 20 detik, error, tombol coba lagi, dan hasil kosong ditangani.

## Fitur
Katalog dinamis; pencarian; filter merek, bahan bakar, dan status; urutan harga dan tahun; detail mobil; favorit localStorage; desain responsif desktop/tablet/HP; dialog keyboard dan label aksesibilitas.

Foto mengikuti API dan mungkin tidak cocok dengan model mobil. Harga/status mengikuti API. Website adalah demonstrasi, tidak memproses pembelian.
