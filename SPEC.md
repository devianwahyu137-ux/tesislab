# SPEC.md — Kontrak Teknis TesisLab

> Dokumen ini merupakan sumber kebenaran tunggal (*Single Source of Truth*) untuk arsitektur, desain, perilaku sistem, dan standar repositori proyek **TesisLab**.

---

## 1. Identitas & Tujuan Produk

**TesisLab** adalah simulator audit keputusan finansial berbasis metode **Pre-Mortem Analysis** yang membantu orang awam dan investor menguji celah risiko sebelum uang dikeluarkan. Alih-alih memberikan saran investasi generik atau konfirmasi bias, TesisLab menempatkan rencana finansial pengguna di hadapan panel agen audit yang membedah asumsi tersembunyi, menguji ketahanan angka secara deterministik, dan memetakan skenario kegagalan (*pre-mortem*).

---

## 2. Tiga Jalur Audit (*Audit Tracks*)

1. **Market & Trading Audit**
   - Fokus metrik: *Risk-to-Reward Ratio* (R:R), risiko modal per posisi (*position sizing* / *max drawdown*), dan sensitivitas volatilitas pasar.
2. **Business & UMKM Audit**
   - Fokus metrik: Margin bersih (*net margin*), *Break-Even Point* (BEP), dan ketahanan kas (*cash runway*).
3. **Personal Cashflow Audit**
   - Fokus metrik: *Debt Service Ratio* (DSR), kecukupan dana darurat (*emergency fund coverage*), dan arus kas bebas (*free cashflow*).

---

## 3. Empat Pilar USP (*Unique Selling Propositions*)

1. **Pre-Mortem Simulator Terkonteks Makro**
   - Simulasi kegagalan keputusan finansial yang terhubung langsung dengan konteks kondisi makroekonomi harian nyata.
2. **Estetika Visual *Swiss Editorial Terminal***
   - Latar utama obsidian: `#0B0D10`
   - Permukaan kartu: `#12161B`
   - Garis batas presisi: `#1E242B`
   - Tipografi editorial tegas yang dipadukan dengan font *monospace* untuk seluruh angka, rasio, dan data finansial.
   - Warna aksen fungsional saja: hijau zamrud (sehat/aman), kuning amber (peringatan/waspada), dan merah karang (kritis/risiko tinggi).
   - **Larangan keras**: Dilarang menggunakan gradasi ungu, cahaya neon generik, atau dekorasi visual khas *AI slop*.
3. **Zero-Cost "What-If" Stress Slider**
   - Seluruh perhitungan ulang sensitivitas skenario (*stress testing*) berjalan secara *real-time* di sisi klien (*client-side*) menggunakan fungsi deterministik tanpa memanggil ulang API LLM.
4. **Dual Mode (Awam vs. X-Ray)**
   - **Tampilan Awam (Default)**: Bersih, komunikatif, berorientasi keputusan, dan bebas jargon teknis AI.
   - **X-Ray Architecture Mode**: Sakelar inspeksi teknis untuk melihat logika agen, skema terstruktur, kontrak prompt, serta alur data di balik layar.

---

## 4. Kontrak Responsif Multi-Device

- **Desktop (`>= 1024px`)**
  - Tata letak *split-screen* asimetris: **35%** panel ruang sidang agen di kiri, **65%** area kerja (*workspace*) di kanan.
- **iPad / Tablet (`768px - 1023px`)**
  - Panggung horizontal berisi 3 kartu agen di bagian atas, area kerja di bagian bawah, dengan *touch target* minimal **44px**.
- **Mobile (`< 768px`)**
  - *Dynamic Active Agent Pill* di bagian atas layar, dengan konten 1 kolom penuh.

---

## 5. Kontrak Lokalisasi (*Bilingual Extensible*)

- Seluruh teks antarmuka wajib tersentralisasi di kamus `locales/id.json` dan `locales/en.json`.
- **Dilarang keras** menulis *hardcoded copy* di dalam komponen UI.
- Struktur kunci kamus dirancang modular agar penambahan bahasa baru di masa depan dapat dilakukan tanpa mengubah logika komponen.

---

## 6. Kontrak Rekayasa Biaya \$0 & Anti-Halusinasi

- **Kalkulasi Deterministik di TypeScript**: Seluruh perhitungan finansial wajib deterministik menggunakan TypeScript murni di lingkungan serverless Vercel. Dilarang menggunakan pustaka Python berat seperti `pandas` atau `yfinance` agar bebas dari batas ukuran bundle serverless 250 MB.
- **Data Feed Terpisah (`data-feed`)**: Shift pagi Hermes Agent berjalan terjadwal melalui GitHub Actions gratis dan melakukan *commit* `market_context.json` ke branch terpisah bernama `data-feed` sehingga pembaruan data harian tidak memicu *rebuild* aplikasi utama di Vercel.
- **Single-Pass Multi-Persona & Free-Tier Fallback**: Pemanggilan AI menggunakan pola *Single-Pass Multi-Persona* dengan validasi skema ketat menggunakan **Zod**, serta mekanisme *fallback* otomatis antar-provider gratis (**Gemini Free Tier** → **OpenRouter `:free`**).

---

## 7. Konvensi Standar Hermes & AgentSkills

Ringkasan konvensi hasil inspeksi langsung repositori referensi `NousResearch/hermes-agent` dan `agentskills/agentskills`:

### A. Konvensi `SOUL.md` (`hermes-agent`)
- **Format**: Markdown murni tanpa YAML frontmatter wajib (`SOUL.md` dan `hermes_cli/default_soul.py`).
- **Karakteristik**: Mendefinisikan identitas, nada bicara, dan aturan komunikasi agen secara langsung, padat, dan bebas basa-basi (*zero filler*, *plain claims over adjectives*).
- **Pemuatan**: Dimuat segar pada setiap pesan/sesi untuk disuntikkan ke *system prompt*. Komentar HTML (`<!-- ... -->`) digunakan untuk panduan penyuntingan tanpa mencemari persona aktif.

### B. Konvensi `MEMORY.md` (`hermes-agent`)
- **Format & Pemisah**: Memori kurasi persisten (`MEMORY.md` untuk catatan agen, `USER.md` untuk profil pengguna) menggunakan pemisah entri eksplisit `ENTRY_DELIMITER = "\n§\n"` (`§`).
- **Batas Karakter**: Dibatasi secara deterministik berbasis karakter agar independen terhadap model (bawaan Hermes: `2200` karakter untuk `MEMORY.md` dan `1375` karakter untuk `USER.md`).
- **Frozen Snapshot & Keamanan**: Dimuat ke *system prompt* sebagai *frozen snapshot* di awal sesi (menjaga *prefix cache*), dan setiap konten yang ditulis wajib lolos pemindaian pola injeksi/eksfiltrasi (*strict scope*).

### C. Konvensi `SKILL.md` (`agentskills` & `hermes-agent`)
- **Struktur Direktori**: Satu direktori per skill (`skill-name/SKILL.md`), dengan subdirektori opsional satu tingkat: `scripts/`, `references/`, dan `assets/`.
- **YAML Frontmatter Wajib**:
  - `name`: 1–64 karakter, hanya huruf kecil `a-z`, angka `0-9`, dan tanda hubung `-` (tidak boleh diawali/diakhiri `-` atau mengandung `--`), serta wajib sama dengan nama direktori induknya.
  - `description`: 1–1024 karakter, tidak boleh kosong, menjelaskan fungsi skill dan kapan harus digunakan beserta kata kunci pemicunya.
- **YAML Frontmatter Opsional**: `license`, `compatibility` (maks 500 karakter), `metadata` (peta key-value string; pada `hermes-agent` mencakup `metadata.hermes.tags`, `related_skills`, serta `version`, `author`, `platforms`), dan `allowed-tools` (eksperimental, dipisahkan spasi).
- **Progressive Disclosure**:
  1. *Metadata* (`name` + `description`, ~100 token) dimuat saat startup untuk seluruh skill.
  2. *Body* `SKILL.md` (< 500 baris / < 5000 token direkomendasikan) dimuat penuh hanya saat skill diaktifkan.
  3. *Resources* (`scripts/`, `references/`, `assets/`) dimuat sesuai kebutuhan.
