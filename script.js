'use strict';
// Seluruh data katalog diambil dari endpoint resmi panitia.
const API_URL = 'https://api-web.dnccudinus.org/api/mobil';
const $ = (selector) => document.querySelector(selector);
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
let cars = [];
let fuel = '';
let onlySaved = false;
let favorites = [];
try { const stored = JSON.parse(localStorage.getItem('velora-favorites') || '[]'); if (Array.isArray(stored)) favorites = stored.map(String); } catch { /* Penyimpanan opsional; katalog tetap berjalan. */ }
const fallbackImage = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#e8eddf"/><text x="50%" y="50%" text-anchor="middle" fill="#153e35" font-family="sans-serif" font-size="28">Foto belum tersedia</text></svg>');
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function imageFor(car, className) {
  const img = element('img', className);
  try { const url = new URL(car.foto); img.src = ['https:', 'http:'].includes(url.protocol) ? url.href : fallbackImage; } catch { img.src = fallbackImage; }
  img.alt = car.nama; img.loading = 'lazy';
  img.addEventListener('error', () => { img.src = fallbackImage; }, { once: true });
  return img;
}
let toastTimer;
function notify(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2200); }
function toggleFavorite(car) {
  const id = String(car.id);
  favorites = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
  try { localStorage.setItem('velora-favorites', JSON.stringify(favorites)); } catch { notify('Favorit tersimpan untuk sesi ini.'); }
  renderCars();
}
function cardFor(car) {
  const card = element('article', 'card');
  const photo = element('div', 'card-image'); photo.append(imageFor(car));
  photo.append(element('span', 'badge' + (car.status === 'sold' ? ' sold' : ''), car.status === 'sold' ? 'TERJUAL' : car.status.toUpperCase()));
  const heart = element('button', 'heart', favorites.includes(String(car.id)) ? '♥' : '♡');
  heart.setAttribute('aria-label', 'Favorit: ' + car.nama); heart.setAttribute('aria-pressed', String(favorites.includes(String(car.id))));
  heart.addEventListener('click', () => toggleFavorite(car)); photo.append(heart);
  const content = element('div', 'card-content'); content.append(element('span', 'brand', car.brand), element('h3', '', car.nama));
  const specs = element('div', 'specs'); [car.tahun, car.transmisi, car.bahan_bakar].forEach(value => specs.append(element('span', '', String(value)))); content.append(specs);
  const bottom = element('div', 'card-bottom'); const price = element('div', 'price'); price.append(element('small', '', 'Harga kendaraan'), document.createTextNode(rupiah(car.harga)));
  const detail = element('button', 'detail-btn', 'Lihat detail ↗'); detail.addEventListener('click', () => openDetail(car)); bottom.append(price, detail); content.append(bottom); card.append(photo, content); return card;
}
function openDetail(car) {
  const container = $('#detail-content'); container.replaceChildren(imageFor(car, 'detail-photo'));
  const body = element('div', 'detail-body'); body.append(element('span', 'brand', car.brand), element('h2', '', car.nama), element('div', 'price', rupiah(car.harga)));
  const specs = element('div', 'detail-specs');
  [['Tahun',car.tahun],['Transmisi',car.transmisi],['Bahan bakar',car.bahan_bakar],['Status',car.status === 'sold' ? 'Terjual' : car.status]].forEach(([label,value]) => { const item = element('div'); item.append(element('small','',label),document.createTextNode(String(value))); specs.append(item); });
  const save = element('button', 'button', favorites.includes(String(car.id)) ? 'Hapus dari favorit ♥' : 'Simpan ke favorit ♡');
  save.addEventListener('click', () => { toggleFavorite(car); save.textContent = favorites.includes(String(car.id)) ? 'Hapus dari favorit ♥' : 'Simpan ke favorit ♡'; });
  body.append(specs, save, element('p','photo-note','Showroom demonstrasi. Foto mengikuti API dan dapat berupa ilustrasi. Tidak ada transaksi atau reservasi nyata.')); container.append(body); $('#detail').showModal();
}
function renderCars() {
  const query = $('#search').value.trim().toLowerCase();
  let result = cars.filter(car => (!query || (car.nama + ' ' + car.brand).toLowerCase().includes(query)) && (!$('#brand').value || car.brand === $('#brand').value) && (!$('#availability').value || car.status === $('#availability').value) && (!fuel || car.bahan_bakar === fuel) && (!onlySaved || favorites.includes(String(car.id))));
  const sort = $('#sort').value;
  if (sort === 'low') result.sort((a,b) => a.harga - b.harga);
  if (sort === 'high') result.sort((a,b) => b.harga - a.harga);
  if (sort === 'year') result.sort((a,b) => b.tahun - a.tahun);
  $('#grid').replaceChildren(...result.map(cardFor));
  $('#result-count').textContent = `${result.length} dari ${cars.length} mobil`;
  $('#empty').hidden = result.length !== 0;
  $('#saved-count').textContent = cars.filter(car => favorites.includes(String(car.id))).length;
  $('#saved-toggle').setAttribute('aria-pressed', String(onlySaved));
}
async function loadCars() {
  $('#error').hidden = true; $('#empty').hidden = true; $('#grid').setAttribute('aria-busy','true');
  $('#grid').replaceChildren(...Array.from({length:6}, () => element('div','skeleton')));
  $('#api-status').textContent = 'Mengambil data mobil terbaru…'; $('#result-count').textContent = 'Memuat koleksi…';
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(API_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Server merespons HTTP ${response.status}.`);
    const result = await response.json();
    if (result.success === false || !Array.isArray(result.data)) throw new Error('Format data API tidak sesuai.');
    cars = result.data.map(car => ({...car, nama:String(car.nama || 'Mobil'), brand:String(car.brand || 'Lainnya'), status:String(car.status || 'Tidak diketahui'), harga:Number(car.harga) || 0}));
    const brandSelect = $('#brand'); const previous = brandSelect.value;
    brandSelect.replaceChildren(new Option('Semua merek',''), ...[...new Set(cars.map(car => car.brand))].sort().map(brand => new Option(brand,brand))); brandSelect.value = previous;
    $('#api-status').textContent = `● Katalog diperbarui · ${cars.length} mobil · ${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}`;
    renderCars();
  } catch (error) {
    cars = []; $('#grid').replaceChildren(); $('#error').hidden = false;
    $('#api-status').textContent = 'Koneksi katalog belum tersedia'; $('#result-count').textContent = 'Katalog belum dimuat';
    $('#error-text').textContent = error.name === 'AbortError' ? 'Koneksi terlalu lama. Periksa internet lalu coba lagi.' : 'Gagal mengambil data. Periksa koneksi internet atau coba beberapa saat lagi. ' + error.message;
  } finally { clearTimeout(timeout); $('#grid').setAttribute('aria-busy','false'); }
}
$('#filters').addEventListener('submit', event => event.preventDefault());
$('#search').addEventListener('input', renderCars);
['brand','availability','sort'].forEach(id => $('#' + id).addEventListener('change', renderCars));
$('.tabs').addEventListener('click', event => { const button = event.target.closest('button'); if (!button) return; fuel = button.dataset.fuel; document.querySelectorAll('.tabs button').forEach(item => item.classList.toggle('active',item === button)); renderCars(); });
$('#reset').addEventListener('click', () => { $('#filters').reset(); fuel = ''; onlySaved = false; document.querySelectorAll('.tabs button').forEach(button => button.classList.toggle('active',button.dataset.fuel === '')); renderCars(); });
$('#saved-toggle').addEventListener('click', () => { onlySaved = !onlySaved; renderCars(); });
$('#saved-nav').addEventListener('click', () => { onlySaved = true; renderCars(); });
$('#retry').addEventListener('click', loadCars);
$('.close').addEventListener('click', () => $('#detail').close());
$('#detail').addEventListener('click', event => { if (event.target === $('#detail')) { const rect = $('#detail').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('#detail').close(); } });
loadCars();
