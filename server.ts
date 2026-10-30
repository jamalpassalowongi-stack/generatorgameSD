import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization per gemini-api guidelines
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Multiplayer room state (in-memory)
interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  answers: { [qIndex: number]: { answerIndex: number; isCorrect: boolean; timeSpent: number } };
  isReady: boolean;
}

interface Room {
  pin: string;
  hostId: string;
  title: string;
  grade: string;
  subject: string;
  status: 'waiting' | 'playing' | 'revealed' | 'finished';
  currentQuestionIndex: number;
  players: RoomPlayer[];
  questions: any[];
  createdAt: number;
}

const rooms = new Map<string, Room>();

// Helper to clean up old rooms (> 3 hours)
setInterval(() => {
  const now = Date.now();
  for (const [pin, room] of rooms.entries()) {
    if (now - room.createdAt > 3 * 60 * 60 * 1000) {
      rooms.delete(pin);
    }
  }
}, 15 * 60 * 1000);

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Educational Game Generator
app.post('/api/generate-game', async (req: Request, res: Response) => {
  try {
    const {
      grade = 'Kelas 4',
      subject = 'Matematika',
      topic = 'Operasi Hitung Perkalian & Pembagian',
      gameType = 'story_quest',
      theme = 'galaxy',
      questionCount = 5,
      difficulty = 'Sedang',
      customNotes = '',
    } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY tidak dikonfigurasi. Mode offline tersedia dengan preset kurikulum lengkap.',
        isOfflineFallbackAvailable: true,
      });
    }

    const systemPrompt = `Anda adalah ahli pengembang game edukasi interaktif untuk siswa Sekolah Dasar (SD) di Indonesia sesuai Kurikulum Merdeka.
Buat konten game edukasi yang menyenangkan, ramah anak, berorientasi petualangan, dengan bahasa yang ceria, mudah dipahami, dan mendidik.
Setiap soal harus memiliki konteks cerita singkat yang imersif dan opsi jawaban bergambar/teks yang jelas.`;

    const userPrompt = `Buat 1 set game edukasi interaktif untuk:
- Sasaran: ${grade} Sekolah Dasar
- Mata Pelajaran: ${subject}
- Topik / Materi: ${topic}
- Gaya / Tipe Game: ${gameType}
- Tema Cerita: ${theme}
- Jumlah Soal: ${questionCount} soal
- Tingkat Kesulitan: ${difficulty}
- Catatan Tambahan: ${customNotes || 'Buat seru, interaktif, dan penuh motivasi'}

Kembalikan format data JSON yang terstruktur persis dengan schema yang ditentukan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Judul game yang memikat anak SD' },
            description: { type: Type.STRING, description: 'Deskripsi singkat misi game' },
            storyIntro: { type: Type.STRING, description: 'Pengantar cerita petualangan seru' },
            grade: { type: Type.STRING },
            subject: { type: Type.STRING },
            theme: { type: Type.STRING },
            learningObjectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Tujuan pembelajaran yang dicapai',
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  storyContext: { type: Type.STRING, description: 'Cerita pengantar per ronde/soal' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Tepat 4 pilihan jawaban: [A, B, C, D]',
                  },
                  correctAnswer: { type: Type.INTEGER, description: 'Indeks jawaban benar (0-3)' },
                  explanation: { type: Type.STRING, description: 'Penjelasan edukatif ramah anak' },
                  gestureHint: {
                    type: Type.STRING,
                    description: 'Instruksi gerak tubuh untuk mode kamera (cth: Tangan Kiri = A, Tangan Kanan = B)',
                  },
                  hint: { type: Type.STRING, description: 'Bantuan ramah anak jika kesulitan' },
                  points: { type: Type.INTEGER, description: 'Nilai poin, cth 100' },
                },
                required: ['id', 'question', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['title', 'storyIntro', 'questions'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Respons model kosong');
    }

    const parsed = JSON.parse(text);
    return res.json({ success: true, game: parsed });
  } catch (error: any) {
    console.error('Error generating game with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal memproses generator game dengan AI',
      isOfflineFallbackAvailable: true,
    });
  }
});

// Multiplayer Room Endpoints
app.post('/api/rooms/create', (req: Request, res: Response) => {
  const { hostName = 'Guru Pintar', title = 'Kuis Pintar Kelas SD', grade = 'Kelas 4', subject = 'Matematika', questions = [] } = req.body;
  // Generate a random 4-letter PIN (easy for kids to type on tablets/smartboards)
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const hostId = 'host_' + Math.random().toString(36).substring(2, 9);

  const room: Room = {
    pin,
    hostId,
    title,
    grade,
    subject,
    status: 'waiting',
    currentQuestionIndex: 0,
    players: [],
    questions,
    createdAt: Date.now(),
  };

  rooms.set(pin, room);
  res.json({ success: true, pin, hostId, room });
});

app.post('/api/rooms/join', (req: Request, res: Response) => {
  const { pin, name, avatar } = req.body;
  const cleanPin = (pin || '').trim();
  const room = rooms.get(cleanPin);

  if (!room) {
    return res.status(404).json({ error: 'Kode PIN kamar kuis tidak ditemukan!' });
  }

  const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
  const newPlayer: RoomPlayer = {
    id: playerId,
    name: name || `Siswa ${room.players.length + 1}`,
    avatar: avatar || '🦁',
    score: 0,
    streak: 0,
    answers: {},
    isReady: true,
  };

  room.players.push(newPlayer);
  res.json({ success: true, playerId, player: newPlayer, room });
});

app.get('/api/rooms/:pin/status', (req: Request, res: Response) => {
  const pin = req.params.pin;
  const room = rooms.get(pin);

  if (!room) {
    return res.status(404).json({ error: 'Ruang kuis tidak ditemukan!' });
  }

  res.json({ success: true, room });
});

app.post('/api/rooms/:pin/start', (req: Request, res: Response) => {
  const pin = req.params.pin;
  const room = rooms.get(pin);
  if (!room) return res.status(404).json({ error: 'Kamar tidak ada' });

  room.status = 'playing';
  room.currentQuestionIndex = 0;
  res.json({ success: true, room });
});

app.post('/api/rooms/:pin/answer', (req: Request, res: Response) => {
  const pin = req.params.pin;
  const { playerId, qIndex, answerIndex, timeSpent = 5 } = req.body;
  const room = rooms.get(pin);
  if (!room) return res.status(404).json({ error: 'Kamar tidak ada' });

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return res.status(404).json({ error: 'Pemain tidak ditemukan' });

  const currentQ = room.questions[qIndex];
  if (!currentQ) return res.status(400).json({ error: 'Soal tidak valid' });

  const isCorrect = currentQ.correctAnswer === answerIndex;
  player.answers[qIndex] = { answerIndex, isCorrect, timeSpent };

  if (isCorrect) {
    player.streak += 1;
    // Speed bonus: faster answer gives more points
    const speedBonus = Math.max(10, 50 - Math.floor(timeSpent * 3));
    const streakBonus = Math.min(100, player.streak * 20);
    player.score += (currentQ.points || 100) + speedBonus + streakBonus;
  } else {
    player.streak = 0;
  }

  res.json({ success: true, player, isCorrect });
});

app.post('/api/rooms/:pin/next', (req: Request, res: Response) => {
  const pin = req.params.pin;
  const room = rooms.get(pin);
  if (!room) return res.status(404).json({ error: 'Kamar tidak ada' });

  if (room.currentQuestionIndex + 1 < room.questions.length) {
    room.currentQuestionIndex += 1;
    room.status = 'playing';
  } else {
    room.status = 'finished';
  }

  res.json({ success: true, room });
});

app.post('/api/rooms/:pin/reveal', (req: Request, res: Response) => {
  const pin = req.params.pin;
  const room = rooms.get(pin);
  if (!room) return res.status(404).json({ error: 'Kamar tidak ada' });

  room.status = 'revealed';
  res.json({ success: true, room });
});

// Vite Integration (Dev) vs Static Dist (Prod)
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`EduPlay SD server running on http://0.0.0.0:${port}`);
});
