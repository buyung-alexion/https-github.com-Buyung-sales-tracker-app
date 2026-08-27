
const fs = require('fs');
let file = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/8b219a72-89e3-4767-b18e-afb126bbb8a2/walkthrough.md';
let content = fs.readFileSync(file, 'utf8');

const additional = 
### 4. Update Tambahan Sesuai Permintaan
- **Menu Navigasi Bawah**: Tampilan disesuaikan agar mirip dengan referensi gambar Anda. Posisi menjadi sejajar (inline), dan saat menu diklik/aktif, akan muncul garis atas hijau dan _background_ hijau muda tipis (*Gojek style*).
- **Tombol Kirim Aktivitas**: Tombol Kirim di modal *ActivityReport* diubah warnanya menggunakan warna hijau branding kita.
- **Header Homepage**: Bar pencarian (Search bar) di Homepage Mobile telah dihapus dan diganti dengan pesan *Welcome* (Selamat Datang) dan menyebutkan nama si Pemilik akun.
;

content = content + additional;
fs.writeFileSync(file, content);
console.log('Walkthrough updated');

