# Prompt — Photobooth Web App dengan Filter & Efek AR ala Snapchat

Buatkan sebuah **software photobooth berbasis web** yang modern, profesional, responsif, dan siap dikembangkan menjadi produk komersial.

## Tujuan Utama

Aplikasi harus memungkinkan pengguna:

- Mengakses webcam secara langsung dari browser.
- Melihat live camera preview.
- Memilih filter warna/foto secara real-time.
- Memilih efek wajah AR ala Snapchat secara real-time.
- Menggabungkan filter warna + efek AR + frame/overlay.
- Mengambil foto dengan countdown.
- Menampilkan hasil capture.
- Mengulang foto jika tidak cocok.
- Menyimpan/download hasil foto.
- Mendukung format single photo maupun photo strip.

---

# Tech Stack

Gunakan:

- React atau Next.js
- TypeScript
- Tailwind CSS
- WebRTC / `navigator.mediaDevices.getUserMedia()`
- HTML Canvas
- WebGL jika diperlukan
- MediaPipe Face Landmarker untuk face tracking
- Three.js atau Canvas/WebGL untuk render efek AR
- LUT / shader / CSS filter untuk filter foto

Struktur kode harus modular dan mudah dikembangkan.

Jangan membuat aplikasi monolithic.

---

# Camera

Implementasikan kamera menggunakan:

```js
navigator.mediaDevices.getUserMedia()
```

Kebutuhan:

- Auto detect webcam.
- Bisa memilih camera device jika terdapat lebih dari satu kamera.
- Mendukung front camera dan external USB camera.
- Rasio preview tidak boleh stretch.
- Kamera harus tampil smooth.
- Mirror preview untuk front-facing experience.
- Hasil foto tidak boleh blur.
- Prioritaskan resolusi kamera terbaik yang tersedia.
- Handle permission denied.
- Handle camera unavailable.
- Handle camera disconnected.

Buat camera service / camera hook tersendiri.

Contoh struktur:

```text
/hooks
  useCamera.ts

/services
  cameraService.ts
```

---

# Mode Filter Foto

Buat filter foto yang berjalan real-time.

Filter minimal:

1. Original
2. Warm
3. Cool
4. Vintage
5. Retro
6. Kodak Style
7. Fuji Style
8. Disposable Camera
9. Black & White
10. Sepia
11. Soft
12. Dreamy
13. High Contrast
14. Pastel
15. Cinematic
16. Tokyo
17. Seoul
18. Summer
19. Winter
20. Film Grain

Filter sebaiknya menggunakan kombinasi:

- brightness
- contrast
- saturation
- temperature
- tint
- gamma
- grain
- vignette
- LUT
- WebGL shader

Jangan hanya menggunakan CSS filter sederhana untuk semua preset.

Buat filter engine modular.

Contoh:

```text
filters/
  original.ts
  warm.ts
  vintage.ts
  kodak.ts
  fuji.ts
  dreamy.ts
```

Atau gunakan object configuration:

```ts
{
  id: "kodak",
  name: "Kodak",
  brightness: 1.03,
  contrast: 1.08,
  saturation: 1.12,
  grain: 0.12,
  vignette: 0.08,
  lut: "/filters/kodak.png"
}
```

Filter harus dapat digunakan bersamaan dengan efek AR.

---

# Snapchat-Style Face Effects

Tambahkan sistem efek wajah real-time seperti Snapchat.

Gunakan:

```text
MediaPipe Face Landmarker
```

untuk face tracking.

Deteksi:

- posisi wajah
- mata kiri
- mata kanan
- hidung
- mulut
- alis
- jawline
- forehead
- rotasi kepala
- kemiringan kepala
- ukuran wajah

Efek harus mengikuti posisi, rotasi, dan ukuran wajah secara real-time.

---

# AR Effects

Buat minimal efek:

1. Cat Ears
2. Bunny Ears
3. Dog Ears
4. Crown
5. Retro Sunglasses
6. Heart Glasses
7. Flower Crown
8. Sparkle
9. Love Hearts
10. Angel Halo
11. Devil Horn
12. Cute Blush
13. Freckles
14. Face Tattoo
15. Funny Mustache
16. Clown Nose
17. Butterfly
18. Stars
19. Neon Face
20. Party Confetti

Struktur asset:

```text
/public/effects/

cat/
  ears.png
  nose.png

crown/
  crown.png

glasses/
  retro.png

flower-crown/
  flower.png
```

Setiap effect memiliki config.

Contoh:

```ts
{
  id: "retro-glasses",
  anchor: "eyes",
  scale: 1.2,
  offsetX: 0,
  offsetY: 5,
  rotationTracking: true
}
```

---

# Beauty Filter

Tambahkan beauty enhancement ringan.

Fitur:

- skin smoothing
- slight brightness
- slight eye enhancement
- slight face glow
- blush
- natural skin tone

Beauty filter tidak boleh membuat wajah terlihat berlebihan atau artificial.

Sediakan slider:

```text
Beauty
0 ───────── 100
```

Default sekitar 25–35%.

---

# Effect Composition

Pengguna dapat mengaktifkan sekaligus:

```text
AR Effect
+
Photo Filter
+
Beauty
+
Frame
```

Contoh:

```text
Cat Ears
+
Kodak
+
Beauty 30%
+
Pink Frame
```

semuanya harus terlihat langsung di live preview.

---

# Frames

Tambahkan pilihan frame:

- None
- White
- Black
- Minimal
- Pink
- Blue
- Retro
- Film
- Polaroid
- Event Frame

Frame berupa PNG transparent overlay.

Struktur:

```text
/public/frames/
  white.png
  black.png
  pink.png
  retro.png
  polaroid.png
```

---

# Main UI

Buat UI photobooth yang sangat clean.

Layout desktop:

```text
┌─────────────────────────────────────────────────────┐
│ LOGO                                    SETTINGS    │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                  LIVE CAMERA                        │
│                                                     │
│                  🙂 + AR                            │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ FILTER                                              │
│                                                     │
│ Original Film Warm Cool BW Retro Dreamy Kodak       │
│                                                     │
├─────────────────────────────────────────────────────┤
│ EFFECT                                              │
│                                                     │
│ 😎  🐱  👑  💕  🌸  ✨  😇  😈                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                 [ CAPTURE ]                         │
└─────────────────────────────────────────────────────┘
```

Gunakan horizontal carousel untuk filter dan effect.

Setiap filter mempunyai thumbnail preview.

Effect card juga mempunyai thumbnail.

---

# Bottom Navigation

Untuk tablet/touchscreen:

```text
FILTER
EFFECT
FRAME
BEAUTY
```

Saat ditekan buka panel.

UI harus nyaman untuk touchscreen photobooth.

Minimum touch target sekitar 44–48px.

---

# Capture Button

Buat tombol capture besar di tengah.

Style:

```text
      ◎
```

atau seperti shutter button kamera.

Ketika ditekan:

```text
3
2
1
📸
```

Gunakan animation countdown.

---

# Flash Effect

Saat capture:

```text
WHITE FLASH
```

sekitar 100–200ms.

Tambahkan shutter sound opsional.

---

# Capture Pipeline

Final image harus berasal dari composited canvas:

```text
camera frame
↓
photo filter
↓
beauty processing
↓
AR effect
↓
frame
↓
canvas
↓
export JPEG/PNG
```

Jangan screenshot DOM.

Gunakan Canvas API.

---

# Preview Result

Setelah foto:

```text
┌────────────────────────────┐
│                            │
│       RESULT PHOTO         │
│                            │
│                            │
├────────────────────────────┤
│ RETAKE       USE PHOTO     │
└────────────────────────────┘
```

Button:

- Retake
- Download
- Use Photo

---

# Photo Strip Mode

Tambahkan pilihan:

```text
1 Photo
2 Photos
3 Photos
4 Photos
```

Untuk mode 3 photos:

```text
┌────────────┐
│   PHOTO 1  │
├────────────┤
│   PHOTO 2  │
├────────────┤
│   PHOTO 3  │
├────────────┤
│ BRAND/TEXT │
└────────────┘
```

Untuk mode 4:

```text
┌───────────┐
│ PHOTO 1   │
├───────────┤
│ PHOTO 2   │
├───────────┤
│ PHOTO 3   │
├───────────┤
│ PHOTO 4   │
└───────────┘
```

Berikan countdown setiap capture.

---

# Filter Selection UX

Filter bar:

```text
Original
[thumbnail]

Film
[thumbnail]

Warm
[thumbnail]

BW
[thumbnail]

Retro
[thumbnail]
```

Selected filter mempunyai border/highlight.

Filter berubah tanpa reload.

---

# Effect Selection UX

Effect selector:

```text
NONE
CAT
BUNNY
CROWN
GLASSES
LOVE
FLOWER
SPARKLE
```

Gunakan thumbnail visual.

Jangan menggunakan text-only buttons.

---

# Performance

Target:

- preview minimal 30 FPS
- ideal 60 FPS
- tidak freeze saat effect berganti
- MediaPipe inference tidak perlu dilakukan pada setiap frame jika performance buruk
- gunakan requestAnimationFrame
- optimalkan canvas rendering
- asset preload
- lazy load effect
- cleanup camera stream saat component unmount

Gunakan GPU/WebGL apabila memungkinkan.

---

# Multiple Faces

Jika terdapat lebih dari satu wajah:

- minimal support 2 faces
- ideal support hingga 4 faces

Effect harus mengikuti masing-masing wajah.

Contoh:

```text
👑        👑
🙂        🙂
```

bukan hanya satu wajah.

---

# Asset System

Effect tidak boleh hardcoded.

Buat JSON/config system.

Contoh:

```json
{
  "id": "cat",
  "name": "Cute Cat",
  "thumbnail": "/effects/cat/thumb.png",
  "assets": [
    {
      "file": "/effects/cat/ears.png",
      "anchor": "forehead",
      "scale": 1.45
    },
    {
      "file": "/effects/cat/nose.png",
      "anchor": "nose",
      "scale": 0.25
    }
  ]
}
```

Dengan begitu effect baru dapat ditambahkan tanpa mengubah core engine.

---

# Folder Structure

Gunakan struktur seperti:

```text
src/
├── components/
│   ├── Camera/
│   ├── FilterSelector/
│   ├── EffectSelector/
│   ├── FrameSelector/
│   ├── BeautyPanel/
│   ├── Countdown/
│   ├── CaptureButton/
│   └── PhotoPreview/
│
├── hooks/
│   ├── useCamera.ts
│   ├── useFaceTracking.ts
│   └── useCapture.ts
│
├── engines/
│   ├── filterEngine.ts
│   ├── arEngine.ts
│   ├── beautyEngine.ts
│   └── compositionEngine.ts
│
├── effects/
├── filters/
├── config/
├── types/
└── utils/
```

---

# Design Style

Gunakan desain:

- modern
- premium
- minimal
- clean
- tidak terlihat seperti template AI
- whitespace cukup
- rounded corners secukupnya
- visual hierarchy jelas
- typography besar dan mudah dibaca
- nyaman untuk touchscreen
- tidak terlalu banyak teks

Gunakan icon yang konsisten.

Fokus utama UI adalah camera preview.

---

# Responsive

Optimalkan untuk:

```text
Desktop
1920x1080

Laptop
1366x768

Tablet Photobooth
1080x1920

Touchscreen Portrait
1080x1920
```

Mode portrait sangat penting karena aplikasi kemungkinan digunakan pada booth vertikal.

---

# Error Handling

Buat UI yang baik untuk:

```text
Camera permission denied
Camera tidak ditemukan
Camera sedang digunakan aplikasi lain
WebGL tidak tersedia
MediaPipe gagal load
Effect asset gagal load
```

Jangan hanya tampilkan error console.

Berikan pesan kepada user.

---

# Privacy

Semua proses kamera dan filter sebisa mungkin berjalan secara lokal di browser.

Jangan upload image secara otomatis.

Upload hanya dilakukan apabila user memilih fitur cloud/share.

---

# Future-Ready Architecture

Siapkan agar ke depannya mudah ditambahkan:

- QR Code download
- cloud gallery
- event branding
- custom event frame
- email sharing
- WhatsApp sharing
- printing
- payment
- admin dashboard
- event management
- filter marketplace
- AR effect marketplace

Namun untuk versi awal, fokus hanya pada:

```text
Camera
Filter
AR Effect
Beauty
Frame
Capture
Photo Strip
Download
```

---

# Deliverables

Buatkan implementasi lengkap yang:

1. Dapat dijalankan langsung.
2. Tidak hanya berupa mockup UI.
3. Camera benar-benar berfungsi.
4. Filter berubah secara real-time.
5. Face tracking benar-benar berfungsi.
6. Efek mengikuti posisi wajah.
7. Capture menghasilkan composited final image.
8. Photo strip benar-benar dapat dibuat.
9. Bisa didownload sebagai JPG/PNG.
10. Kode modular dan mudah dikembangkan.

Mulai dari membuat struktur project, kemudian implementasi camera engine, filter engine, face tracking, AR renderer, capture pipeline, baru UI.

Prioritaskan **working implementation**, performance, dan maintainability dibanding animasi UI yang berlebihan.
