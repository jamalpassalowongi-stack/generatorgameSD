export type GameGrade = 'Kelas 1' | 'Kelas 2' | 'Kelas 3' | 'Kelas 4' | 'Kelas 5' | 'Kelas 6';

export type GameSubject =
  | 'matematika'
  | 'ipas'
  | 'bahasa_indonesia'
  | 'bahasa_inggris'
  | 'pancasila_ips'
  | 'seni_budaya';

export type GameType =
  | 'story_quest' // Petualangan Misi Cerita RPG
  | 'motion_gesture' // Kamera Gerak Tubuh (Kinesthetic Learning)
  | 'smartboard_buzzer' // Split-screen Duel Buzzer Smart Board
  | 'speed_math' // Balap Angka & Labirin Kilat Waktu
  | 'detective_clues'; // Detektif Misteri & Fakta Penyelidikan

export type StoryTheme =
  | 'galaxy' // Petualangan Galaksi Bintang
  | 'jungle' // Ekspedisi Hutan Rimba Nusantara
  | 'detective' // Laboratorium Waktu Detektif Cilik
  | 'magic_castle'; // Akademi Sihir Sains & Kerajaan Angka

export type OutputFormat =
  | 'playable'
  | 'prompt_gemini'
  | 'prompt_scratch'
  | 'prompt_roblox'
  | 'worksheet_print';

export interface Question {
  id: string;
  question: string;
  storyContext?: string;
  options: string[]; // exactly 4 options
  correctAnswer: number; // 0, 1, 2, 3
  explanation: string;
  gestureHint?: string; // e.g. "Tangan KIRI = Opsi A, Tangan KANAN = Opsi B"
  hint?: string;
  points: number;
}

export interface GamePackage {
  id: string;
  title: string;
  description: string;
  storyIntro: string;
  grade: GameGrade;
  subject: GameSubject;
  gameType: GameType;
  theme: StoryTheme;
  difficulty: 'Mudah' | 'Sedang' | 'Tantangan Juara';
  learningObjectives: string[];
  questions: Question[];
  createdAt?: string;
  isAiGenerated?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'score' | 'speed' | 'motion' | 'social' | 'mastery';
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  score: number;
  streak: number;
  accuracy: number;
  gameTitle: string;
  date: string;
  badges: string[];
}

export interface MotionDetectionState {
  isActive: boolean;
  hasPermission: boolean | null;
  selectedOption: number | null; // 0: Left/A, 1: Right/B, 2: Top/C, 3: Bottom/D
  confidenceProgress: number; // 0 to 100%
  lastTriggeredZone: string | null;
  leftMotionScore: number;
  rightMotionScore: number;
  topMotionScore: number;
}
