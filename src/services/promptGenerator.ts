import { GamePackage, OutputFormat } from '../types/game';

export function formatGameAsOutput(game: GamePackage, format: OutputFormat): string {
  switch (format) {
    case 'prompt_gemini':
      return generateAiPrompt(game);
    case 'prompt_scratch':
      return generateScratchSpec(game);
    case 'prompt_roblox':
      return generateRobloxSpec(game);
    case 'worksheet_print':
      return generateWorksheetText(game);
    case 'playable':
    default:
      return JSON.stringify(game, null, 2);
  }
}

function generateAiPrompt(game: GamePackage): string {
  return `### PROMPT SISTEM GENERATOR GAME EDUKASI SD (KURIKULUM MERDEKA)

**Tujuan**:
Buat sebuah game edukasi interaktif berbasis web/smartboard untuk siswa Sekolah Dasar dengan rincian berikut:

- **Target Siswa**: ${game.grade} Sekolah Dasar (Usia ${getAgeRange(game.grade)} tahun)
- **Mata Pelajaran**: ${game.subject.toUpperCase()}
- **Gaya Game**: ${game.gameType}
- **Tema Cerita Imersif**: ${game.theme}
- **Tingkat Kesulitan**: ${game.difficulty}
- **Judul Misi**: "${game.title}"

---

### BACKGROUND CERITA IMERSIF:
"${game.storyIntro}"

---

### MEKANISME PERMAINAN & REWARD:
1. **Sistem Poin**: Poin dasar 100 per jawaban benar + Speed Bonus (10-50 poin) + Streak Multiplier (x1.5 pada streak 2, x2.0 pada streak 3+).
2. **Badge & Prestasi**:
   - ⭐ Bintang Penjelajah (Menjawab benar pertama)
   - 🔥 Kilat Jenius (Streak 3x tanpa salah)
   - 🏆 Juara Kelas (Menyelesaikan semua misi dengan akurasi > 80%)
3. **Dukungan Smart Board**: Touch-friendly, tombol opsi berukuran besar (minimal tinggi 64px), kontras warna tinggi yang jelas terlihat dari bangku belakang kelas.
4. **Mode Kamera Kinestetik**: Integrasi gesture tangan:
   - Tangan KIRI = Opsi A
   - Tangan KANAN = Opsi B
   - Dua Tangan Diangkat = Opsi C
   - Posisi Tunduk/Jongkok = Opsi D

---

### DAFTAR SOAL & KUNCI JAWABAN:
${game.questions
  .map(
    (q, i) => `
**Soal ${i + 1}**:
Konteks Cerita: ${q.storyContext || 'Misi Petualangan'}
Pertanyaan: ${q.question}
Pilihan:
A. ${q.options[0]}
B. ${q.options[1]}
C. ${q.options[2]}
D. ${q.options[3]}
Kunci Jawaban: ${['A', 'B', 'C', 'D'][q.correctAnswer]}
Penjelasan Edukatif: ${q.explanation}
Hint Gesture: ${q.gestureHint || '-'}
`
  )
  .join('\n')}

---

### TUJUAN PEMBELAJARAN (CAPAIAN KURIKULUM):
${game.learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}
`;
}

function generateScratchSpec(game: GamePackage): string {
  return `### BLUEPRINT LOGIKA SCRATCH / BLOCKLY (EDUKASI SD)
Proyek: ${game.title} (${game.grade})

1. VARIABEL UTAMA (Data):
   - [skor] : Angka awal 0
   - [streak] : Angka awal 0
   - [nomor_soal] : Angka awal 1
   - [waktu_sisa] : Timer 15 detik

2. SPRITE UTAMA:
   - Sprite "Karakter Petualang" (Astro / Detektif / Hewan Rimba)
   - Sprite Tombol "Pilihan A" (Warna Merah Coral)
   - Sprite Tombol "Pilihan B" (Warna Biru Langit)
   - Sprite Tombol "Pilihan C" (Warna Hijau Daun)
   - Sprite Tombol "Pilihan D" (Warna Kuning Emas)
   - Sprite "Papan Skor & Bintang"

3. ALUR SKRIP SCRATCH:
   [Ketika bendera hijau diklik]
   -> Atur [skor] ke 0
   -> Katakan "${game.storyIntro.slice(0, 80)}..." selama 3 detik
   -> Siarkan pesan [mulai_soal_1]

   [Ketika menerima pesan [cek_jawaban]]
   -> JIKA <jawaban_dipilih = kunci_jawaban> MAKA:
        Ubah [skor] sebesar (100 + (streak * 20))
        Ubah [streak] sebesar 1
        Mainkan suara [magic_chime]
        Katakan "Luar Biasa! Jawabanmu Benar!" selama 1.5 detik
      SELAIN ITU:
        Atur [streak] ke 0
        Mainkan suara [soft_buzz]
        Katakan "Coba lagi ya, kamu pasti bisa!" selama 1.5 detik

4. SOAL PERTAMA (${game.questions[0]?.question || 'Kuis'}):
   - Kunci Jawaban: ${['A', 'B', 'C', 'D'][game.questions[0]?.correctAnswer || 0]}
   - Penjelasan: ${game.questions[0]?.explanation || ''}
`;
}

function generateRobloxSpec(game: GamePackage): string {
  return `-- ROBLOX STUDIO QUIZ RUNNER SCRIPT (LUA)
-- Judul: ${game.title}
-- Sasaran: ${game.grade} SD

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local currentQuestionIndex = 1
local questions = {
${game.questions
  .map(
    (q, i) => `  {
    id = ${i + 1},
    question = "${q.question.replace(/"/g, '\\"')}",
    options = {"${q.options[0]}", "${q.options[1]}", "${q.options[2]}", "${q.options[3]}"},
    correctAnswer = ${q.correctAnswer + 1},
    points = 100
  }`
  )
  .join(',\n')}
}

local function onPlayerTouchAnswerPad(player, padNumber)
  local leaderstats = player:FindFirstChild("leaderstats")
  if not leaderstats then return end
  local points = leaderstats:FindFirstChild("Poin")

  local q = questions[currentQuestionIndex]
  if padNumber == q.correctAnswer then
    points.Value = points.Value + q.points
    -- Play particle confetti & reward sound
    print(player.Name .. " menjawab BENAR! Poin sekarang: " .. points.Value)
  else
    print(player.Name .. " menjawab salah!")
  end
end
`;
}

function generateWorksheetText(game: GamePackage): string {
  return `==========================================================
LEMBAR KERJA KUIS PINTAR KELAS (OFFLINE PRINT / SMARTBOARD)
==========================================================
Nama Siswa / Kelompok : ___________________________
Kelas / No. Absen     : ${game.grade} / _________
Mata Pelajaran        : ${game.subject.toUpperCase()}
Misi Petualangan      : ${game.title}
Skor Total            : _____ / 100
==========================================================

CERITA MISI:
${game.storyIntro}

----------------------------------------------------------
PETUNJUK PENGERJAAN:
1. Bacalah setiap pertanyaan dengan teliti.
2. Berikan tanda silang (X) pada pilihan A, B, C, atau D yang paling benar.
3. Untuk mode Smart Board: sentuh layar langsung atau gunakan gerakan kamera!
----------------------------------------------------------

${game.questions
  .map(
    (q, i) => `
[ SOAL ${i + 1} ]
${q.storyContext ? `Konteks: ${q.storyContext}\n` : ''}${q.question}

   [ A ] ${q.options[0]}
   [ B ] ${q.options[1]}
   [ C ] ${q.options[2]}
   [ D ] ${q.options[3]}

Kunci & Pembahasan Guru:
Jawaban Benar: [ ${['A', 'B', 'C', 'D'][q.correctAnswer]} ]
Penjelasan: ${q.explanation}
----------------------------------------------------------`
  )
  .join('\n')}

Catatan Guru / Pembimbing:
__________________________________________________________
`;
}

function getAgeRange(grade: string): string {
  switch (grade) {
    case 'Kelas 1':
      return '6-7';
    case 'Kelas 2':
      return '7-8';
    case 'Kelas 3':
      return '8-9';
    case 'Kelas 4':
      return '9-10';
    case 'Kelas 5':
      return '10-11';
    case 'Kelas 6':
      return '11-12';
    default:
      return '7-12';
  }
}
