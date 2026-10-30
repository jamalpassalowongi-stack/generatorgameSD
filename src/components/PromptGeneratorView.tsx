import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Copy,
  Download,
  BookOpen,
  Camera,
  Users,
  Compass,
  CheckCircle2,
  RefreshCw,
  FileText,
  Code,
  Flame,
} from 'lucide-react';
import { GameGrade, GameSubject, GameType, StoryTheme, OutputFormat, GamePackage } from '../types/game';
import { OFFLINE_GAME_PRESETS } from '../services/offlinePresets';
import { formatGameAsOutput } from '../services/promptGenerator';
import { sound } from '../services/sound';

interface PromptGeneratorViewProps {
  onPlayGame: (game: GamePackage) => void;
}

export const PromptGeneratorView: React.FC<PromptGeneratorViewProps> = ({ onPlayGame }) => {
  const [selectedGrade, setSelectedGrade] = useState<GameGrade>('Kelas 4');
  const [selectedSubject, setSelectedSubject] = useState<GameSubject>('matematika');
  const [selectedGameType, setSelectedGameType] = useState<GameType>('story_quest');
  const [selectedTheme, setSelectedTheme] = useState<StoryTheme>('galaxy');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('prompt_gemini');
  const [customTopic, setCustomTopic] = useState('Operasi Perkalian Bilangan Cacah & Geometri Luas');
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Tantangan Juara'>('Sedang');
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active loaded game package
  const [currentGame, setCurrentGame] = useState<GamePackage>(OFFLINE_GAME_PRESETS[0]);

  // Load an offline preset
  const handleSelectPreset = (presetId: string) => {
    sound.playClick();
    const found = OFFLINE_GAME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setCurrentGame(found);
      setSelectedGrade(found.grade);
      setSelectedSubject(found.subject);
      setSelectedGameType(found.gameType);
      setSelectedTheme(found.theme);
      setCustomTopic(found.title);
      setErrorMessage(null);
    }
  };

  // Generate with Gemini AI via /api/generate-game
  const handleGenerateWithAi = async () => {
    sound.playClick();
    setIsLoadingAi(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade,
          subject: selectedSubject,
          topic: customTopic,
          gameType: selectedGameType,
          theme: selectedTheme,
          difficulty,
          questionCount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses generator AI. Beralih ke mesin kurikulum instan.');
      }

      const generatedGame: GamePackage = {
        id: 'ai-' + Date.now(),
        title: data.game.title || `${selectedSubject.toUpperCase()} ${selectedGrade}`,
        description: data.game.description || 'Petualangan edukasi seru untuk siswa SD.',
        storyIntro: data.game.storyIntro || 'Misi belajar dimulai!',
        grade: selectedGrade,
        subject: selectedSubject,
        gameType: selectedGameType,
        theme: selectedTheme,
        difficulty,
        learningObjectives: data.game.learningObjectives || ['Meningkatkan pemahaman konsep pelajaran'],
        questions: data.game.questions || [],
        isAiGenerated: true,
      };

      setCurrentGame(generatedGame);
      sound.playVictory();
    } catch (err: any) {
      console.warn('AI generator issue, falling back to smart curriculum preset:', err);
      setErrorMessage(
        err.message || 'Koneksi AI tidak tersedia. Anda tetap dapat menggunakan preset kurikulum lengkap offline!'
      );
      // Fallback: use an appropriate offline preset or create a custom curated one
      const matching =
        OFFLINE_GAME_PRESETS.find((p) => p.subject === selectedSubject) || OFFLINE_GAME_PRESETS[0];
      setCurrentGame({
        ...matching,
        id: 'fallback-' + Date.now(),
        grade: selectedGrade,
        title: `Misi Pintar ${selectedSubject.toUpperCase()}: ${customTopic.slice(0, 30)}`,
        gameType: selectedGameType,
        theme: selectedTheme,
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Copy output
  const handleCopy = () => {
    sound.playClick();
    const text = formatGameAsOutput(currentGame, outputFormat);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download output
  const handleDownload = () => {
    sound.playClick();
    const text = formatGameAsOutput(currentGame, outputFormat);
    const ext = outputFormat === 'playable' ? 'json' : outputFormat === 'prompt_roblox' ? 'lua' : 'txt';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduPlay-${currentGame.title.replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const outputText = formatGameAsOutput(currentGame, outputFormat);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Hero Intro Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 text-xs md:text-sm text-indigo-200 font-medium">
            <Compass className="w-4 h-4 text-amber-300" />
            <span>Kurikulum Merdeka SD · Interaktif · Smart Board & Offline Ready</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Generator Prompt & Game Edukasi Interaktif SD
          </h1>
          <p className="text-sm md:text-base text-indigo-100 leading-relaxed">
            Rancang game pembelajaran dengan narasi cerita imersif, sistem reward poin & streak, deteksi kamera gesture tangan/tubuh, dan mode duel multiplayer untuk papan pintar kelas.
          </p>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main 2-Column Split: Controls Deck & Output Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generator Configuration Deck (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Konfigurasi Game Pembelajaran</h2>
            <p className="text-xs text-slate-500 mt-1">Sesuaikan tingkatan kelas, mata pelajaran, dan mekanisme interaktif</p>
          </div>

          {/* Quick Presets Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Contoh Game Kurikulum Instan
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {OFFLINE_GAME_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`cursor-pointer text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between border ${
                    currentGame.id === p.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="truncate pr-2">{p.title}</span>
                  <span className="text-[11px] text-slate-600 shrink-0 font-medium">{p.grade}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Grade Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Target Tingkat Kelas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'] as GameGrade[]).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    sound.playClick();
                    setSelectedGrade(g);
                  }}
                  className={`cursor-pointer py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                    selectedGrade === g
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Mata Pelajaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'matematika', label: 'Matematika' },
                { id: 'ipas', label: 'IPA / Sains' },
                { id: 'bahasa_indonesia', label: 'B. Indonesia' },
                { id: 'bahasa_inggris', label: 'B. Inggris' },
                { id: 'pancasila_ips', label: 'Pancasila & Budaya' },
                { id: 'seni_budaya', label: 'Seni & Prakarya' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedSubject(sub.id as GameSubject);
                  }}
                  className={`cursor-pointer py-2 px-3 text-xs font-medium rounded-lg border text-left transition-all ${
                    selectedSubject === sub.id
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {/* Game Type (Mechanics) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Tipe Permainan & Interaksi
            </label>
            <div className="space-y-2">
              {[
                { id: 'story_quest', label: 'Petualangan RPG & Misi Cerita', icon: BookOpen, desc: 'Anak menyelesaikan babak cerita dengan kuis' },
                { id: 'motion_gesture', label: 'Kamera Gerak Tubuh (Gesture)', icon: Camera, desc: 'Gunakan kamera internal: tangan kiri/kanan untuk jawab' },
                { id: 'smartboard_buzzer', label: 'Duel Buzzer Smart Board', icon: Users, desc: 'Adu cepat 2-4 pemain di papan interaktif' },
                { id: 'speed_math', label: 'Balap Angka & Kilat Waktu', icon: Flame, desc: 'Tantangan batas waktu dengan kombo multiplier' },
              ].map((mech) => {
                const Icon = mech.icon;
                const isSelected = selectedGameType === mech.id;
                return (
                  <button
                    key={mech.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedGameType(mech.id as GameType);
                    }}
                    className={`cursor-pointer w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {mech.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{mech.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Story Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Background Cerita Imersif
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'galaxy', label: 'Galaksi Bintang' },
                { id: 'jungle', label: 'Hutan Rimba Tropis' },
                { id: 'detective', label: 'Detektif Waktu' },
                { id: 'magic_castle', label: 'Akademi Sains' },
              ].map((thm) => (
                <button
                  key={thm.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedTheme(thm.id as StoryTheme);
                  }}
                  className={`cursor-pointer py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    selectedTheme === thm.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {thm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Custom Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Topik / Materi Khusus
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Contoh: Rantai Makanan Sawah, Pecahan Senilai, Pahlawan Nasional"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          {/* Generation Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleGenerateWithAi}
              disabled={isLoadingAi}
              className="cursor-pointer w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Merancang dengan Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Game dengan Gemini AI</span>
                </>
              )}
            </button>

            {errorMessage && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-relaxed">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Output Inspector & Live Play Deck (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Action Banner: PLAY INSTANTLY */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Playable Engine Siap Dimainkan
              </div>
              <div className="text-lg font-bold">{currentGame.title}</div>
              <div className="text-xs text-emerald-100 flex items-center gap-2 justify-center sm:justify-start">
                <span>{currentGame.grade}</span>
                <span>·</span>
                <span>{currentGame.questions.length} Soal Interaktif</span>
                <span>·</span>
                <span>Poin & Reward Aktif</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playVictory();
                onPlayGame(currentGame);
              }}
              className="cursor-pointer px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2 shrink-0 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-emerald-800" />
              <span>Mainkan Game Sekarang!</span>
            </button>
          </div>

          {/* Game Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Latar Belakang Cerita</div>
              <p className="text-sm text-slate-800 mt-1.5 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                "{currentGame.storyIntro}"
              </p>
            </div>

            {/* Learning Objectives */}
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Tujuan Pembelajaran</div>
              <ul className="space-y-1.5">
                {currentGame.learningObjectives.map((obj, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions Teaser Cards */}
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Daftar Soal ({currentGame.questions.length} Ronde)
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {currentGame.questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="font-semibold text-indigo-700">Ronde {idx + 1}</span>
                      <span>{q.points} Poin</span>
                    </div>
                    <div className="font-medium text-slate-900">{q.question}</div>
                    {q.gestureHint && (
                      <div className="text-[11px] text-amber-700 font-medium">📷 Gesture: {q.gestureHint}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export & Prompt Formats Segmented Tab */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Format Ekspor Prompt & Kode</h3>
                <p className="text-xs text-slate-500">Salin untuk AI Studio, Scratch, Roblox, atau lembar kerja cetak</p>
              </div>

              {/* Segmented controls */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
                {[
                  { id: 'prompt_gemini', label: 'Prompt AI' },
                  { id: 'prompt_scratch', label: 'Scratch' },
                  { id: 'prompt_roblox', label: 'Roblox Lua' },
                  { id: 'worksheet_print', label: 'Worksheet' },
                  { id: 'playable', label: 'JSON' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => {
                      sound.playClick();
                      setOutputFormat(fmt.id as OutputFormat);
                    }}
                    className={`cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                      outputFormat === fmt.id
                        ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Codebox Display */}
            <div className="relative">
              <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto max-h-72 leading-relaxed selection:bg-indigo-500 selection:text-white">
                {outputText}
              </pre>

              {/* Action buttons inside codebox */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="cursor-pointer px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md shadow-xs flex items-center gap-1.5 transition-all"
                  title="Salin ke Clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="cursor-pointer px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md shadow-xs flex items-center gap-1.5 transition-all"
                  title="Unduh File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
