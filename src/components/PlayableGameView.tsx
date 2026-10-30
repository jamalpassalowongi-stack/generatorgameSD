import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Camera,
  CameraOff,
  Flame,
  Award,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  Trophy,
  Check,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GamePackage, Question, LeaderboardEntry } from '../types/game';
import { ThemeBackdrop } from './ThemeBackdrop';
import { CameraMotionDetector, MotionZones } from '../services/cameraMotion';
import { sound } from '../services/sound';

interface PlayableGameViewProps {
  game: GamePackage;
  onFinishGame?: (score: number, maxStreak: number) => void;
  onBackToGenerator: () => void;
  isSmartboardMode: boolean;
}

export const PlayableGameView: React.FC<PlayableGameViewProps> = ({
  game,
  onBackToGenerator,
  isSmartboardMode,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  // Student player submission
  const [studentName, setStudentName] = useState('Bintang Juara');
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

  // Camera Motion State
  const [isCameraActive, setIsCameraActive] = useState(game.gameType === 'motion_gesture');
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [motionScores, setMotionScores] = useState<MotionZones>({ left: 0, right: 0, top: 0, bottom: 0 });
  const [activeGestureZone, setActiveGestureZone] = useState<number | null>(null);
  const [gestureProgress, setGestureProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<CameraMotionDetector | null>(null);
  const timerRef = useRef<any>(null);

  const currentQ: Question = game.questions[currentQIndex] || game.questions[0];

  // Initialize and run timer
  useEffect(() => {
    if (isGameOver || isAnswerLocked) return;

    setTimeLeft(25);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQIndex, isGameOver, isAnswerLocked]);

  // Camera motion detector setup
  useEffect(() => {
    if (!isCameraActive) {
      if (detectorRef.current) {
        detectorRef.current.stop();
        detectorRef.current = null;
      }
      return;
    }

    const initCamera = async () => {
      if (!videoRef.current) return;
      const detector = new CameraMotionDetector();
      detectorRef.current = detector;

      detector.onStateChange = (scores, activeZone, progress) => {
        setMotionScores(scores);
        setActiveGestureZone(activeZone);
        setGestureProgress(progress);
      };

      detector.onTrigger = (optionIndex) => {
        if (!isAnswerLocked && !isGameOver) {
          sound.playCameraTrigger();
          handleSelectOption(optionIndex);
        }
      };

      const success = await detector.start(videoRef.current);
      if (!success) {
        setCameraPermissionError('Kamera tidak aktif atau izin ditolak. Anda tetap dapat menyentuh layar secara normal!');
        setIsCameraActive(false);
      }
    };

    initCamera();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
        detectorRef.current = null;
      }
    };
  }, [isCameraActive, isAnswerLocked, isGameOver]);

  const handleTimeOut = () => {
    sound.playWrong();
    setIsAnswerLocked(true);
    setStreak(0);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerLocked || isGameOver) return;
    setSelectedOption(idx);
    setIsAnswerLocked(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = idx === currentQ.correctAnswer;

    if (isCorrect) {
      sound.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Multiplier
      const multiplier = newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : newStreak >= 2 ? 1.5 : 1;
      const speedBonus = timeLeft * 3;
      const questionPoints = Math.round(((currentQ.points || 100) + speedBonus) * multiplier);

      setScore((prev) => prev + questionPoints);

      // Confetti burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      // Badges unlocks
      const newBadges = [...earnedBadges];
      if (!newBadges.includes('Bintang Pertama')) {
        newBadges.push('Bintang Pertama');
      }
      if (newStreak >= 3 && !newBadges.includes('Api Streak x3')) {
        newBadges.push('Api Streak x3');
        sound.playStreak();
      }
      if (isCameraActive && !newBadges.includes('Master Gerak Kamera')) {
        newBadges.push('Master Gerak Kamera');
      }
      setEarnedBadges(newBadges);
    } else {
      sound.playWrong();
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    sound.playClick();
    if (currentQIndex + 1 < game.questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerLocked(false);
      setShowHint(false);
      setGestureProgress(0);
    } else {
      setIsGameOver(true);
      sound.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    sound.playClick();
    setCurrentQIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
    setIsAnswerLocked(false);
    setIsGameOver(false);
    setShowHint(false);
    setHasSubmittedScore(false);
  };

  const handleSaveToLeaderboard = () => {
    sound.playVictory();
    try {
      const existing = localStorage.getItem('eduplay_leaderboard');
      const list: LeaderboardEntry[] = existing ? JSON.parse(existing) : [];

      const newEntry: LeaderboardEntry = {
        id: 'lb-' + Date.now(),
        name: studentName.trim() || 'Siswa Berprestasi',
        avatar: '🚀',
        grade: game.grade,
        score,
        streak: maxStreak,
        accuracy: Math.round((score / (game.questions.length * 150)) * 100),
        gameTitle: game.title,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        badges: earnedBadges,
      };

      list.unshift(newEntry);
      localStorage.setItem('eduplay_leaderboard', JSON.stringify(list.slice(0, 30)));
      setHasSubmittedScore(true);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Option Styling Helper
  const getOptionButtonClass = (optIdx: number) => {
    const isChosen = selectedOption === optIdx;
    const isCorrect = optIdx === currentQ.correctAnswer;

    if (!isAnswerLocked) {
      // Hover & active gesture highlight
      const isGestureTarget = activeGestureZone === optIdx;
      return `border-2 ${
        isGestureTarget
          ? 'border-indigo-400 bg-indigo-50/90 scale-[1.02] shadow-md ring-4 ring-indigo-200'
          : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 shadow-xs'
      }`;
    }

    if (isCorrect) {
      return 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 ring-4 ring-emerald-200 font-bold';
    }

    if (isChosen && !isCorrect) {
      return 'border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold';
    }

    return 'border-2 border-slate-200 bg-slate-50 text-slate-400 opacity-60';
  };

  return (
    <ThemeBackdrop theme={game.theme} className="min-h-[calc(100vh-65px)] p-4 md:p-8 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Top Game Bar: Progress, Points, Streak Multiplier, & Camera Toggle */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-white shadow-md">
          {/* Progress & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToGenerator}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Kembali ke Generator
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-xs md:text-sm font-bold">
              Soal {currentQIndex + 1} <span className="text-slate-400 font-normal">/ {game.questions.length}</span>
            </div>
          </div>

          {/* Points & Streak Combo */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-xs uppercase tracking-wider text-slate-400">Skor:</div>
              <div className="text-lg md:text-xl font-mono font-bold text-amber-300 tabular-nums">{score}</div>
            </div>

            {streak >= 2 && (
              <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Streak x{streak}</span>
              </div>
            )}

            {/* Camera Motion Toggle */}
            <button
              onClick={() => {
                sound.playClick();
                setIsCameraActive(!isCameraActive);
              }}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                isCameraActive
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-xs'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isCameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{isCameraActive ? 'Kamera Gerak: ON' : 'Kamera Gerak: OFF'}</span>
            </button>
          </div>
        </div>

        {/* Camera Permission Alert (if any) */}
        {cameraPermissionError && (
          <div className="bg-amber-900/80 border border-amber-600/70 text-amber-100 text-xs p-3 rounded-lg flex items-center justify-between">
            <span>{cameraPermissionError}</span>
            <button
              onClick={() => setCameraPermissionError(null)}
              className="text-amber-200 hover:text-white font-bold px-2 py-0.5"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Main Interactive Stage */}
        {!isGameOver ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Zone: Question Arena (7 or 12 cols depending on camera mode) */}
            <div className={`${isCameraActive ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
              {/* Question Card */}
              <div className="bg-white/95 text-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-white/20 backdrop-blur-md space-y-6">
                {/* Story Context & Timer */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Misi Petualangan: {game.title}</span>
                  </div>

                  {/* Countdown Timer Bar */}
                  <div className="flex items-center gap-2 font-mono text-xs font-bold tabular-nums">
                    <span className={timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-600'}>
                      ⏳ {timeLeft} detik
                    </span>
                  </div>
                </div>

                {/* Question Story Narrative */}
                {currentQ.storyContext && (
                  <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3.5 text-xs md:text-sm text-indigo-900 leading-relaxed italic">
                    "{currentQ.storyContext}"
                  </div>
                )}

                {/* Main Question Text */}
                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                  {currentQ.question}
                </h2>

                {/* Gesture hint for kids if camera is active */}
                {isCameraActive && currentQ.gestureHint && (
                  <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg font-medium flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{currentQ.gestureHint}</span>
                  </div>
                )}

                {/* 4 Interactive Answer Options (Touch & Smartboard optimized) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {currentQ.options.map((opt, idx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const badgeColors = [
                      'bg-rose-500 text-white',
                      'bg-sky-500 text-white',
                      'bg-emerald-500 text-white',
                      'bg-amber-500 text-white',
                    ];

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswerLocked}
                        className={`cursor-pointer p-4 md:p-5 rounded-xl text-left transition-all flex items-start gap-3.5 ${getOptionButtonClass(
                          idx
                        )}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center shrink-0 ${badgeColors[idx]}`}
                        >
                          {letters[idx]}
                        </div>
                        <div className="flex-1 text-sm md:text-base font-semibold text-slate-800 self-center">
                          {opt}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Next Button when locked */}
                {isAnswerLocked && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      {selectedOption === currentQ.correctAnswer ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                          <Check className="w-5 h-5 text-emerald-600" />
                          <span>HEBAT! Jawabanmu Benar!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-sm">
                          <X className="w-5 h-5 text-rose-600" />
                          <span>Belum Tepat, Ayo Pelajari!</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed">{currentQ.explanation}</p>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleNextQuestion}
                        className="cursor-pointer px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all"
                      >
                        <span>
                          {currentQIndex + 1 < game.questions.length ? 'Ronde Berikutnya' : 'Lihat Hasil Akhir'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Zone: Camera Motion HUD (when active) */}
            {isCameraActive && (
              <div className="lg:col-span-4 bg-slate-900/90 border border-slate-700 rounded-2xl p-4 text-white shadow-xl flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Detektor Gerak Kamera</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Cermin Aktif</span>
                </div>

                {/* Live Video Feed Mirror */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-700">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />

                  {/* Interactive HUD Overlay Zones */}
                  <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
                    {/* Top zone: Option C (Kedua Tangan) */}
                    <div
                      className={`h-12 border-2 border-dashed rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                        activeGestureZone === 2 ? 'border-emerald-400 bg-emerald-500/30' : 'border-white/30 text-white/70'
                      }`}
                    >
                      🙌 DUA TANGAN KE ATAS [C]
                    </div>

                    {/* Middle split: Left = Option A, Right = Option B */}
                    <div className="flex-1 flex gap-2 py-2">
                      <div
                        className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
                          activeGestureZone === 0 ? 'border-rose-400 bg-rose-500/30' : 'border-white/30 text-white/70'
                        }`}
                      >
                        <span>👈 TANGAN KIRI</span>
                        <span className="text-xs font-black mt-1">[A]</span>
                      </div>

                      <div
                        className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
                          activeGestureZone === 1 ? 'border-sky-400 bg-sky-500/30' : 'border-white/30 text-white/70'
                        }`}
                      >
                        <span>👉 TANGAN KANAN</span>
                        <span className="text-xs font-black mt-1">[B]</span>
                      </div>
                    </div>

                    {/* Bottom zone: Option D (Jongkok / Tunduk) */}
                    <div
                      className={`h-10 border-2 border-dashed rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                        activeGestureZone === 3 ? 'border-amber-400 bg-amber-500/30' : 'border-white/30 text-white/70'
                      }`}
                    >
                      👇 JONGKOK / TUNDUK [D]
                    </div>
                  </div>

                  {/* Lock-in Dwell Progress Ring */}
                  {gestureProgress > 0 && (
                    <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                      <div className="text-center space-y-1">
                        <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-emerald-400 animate-spin mx-auto" />
                        <div className="text-xs font-black tracking-wide text-emerald-300">
                          TAHAN GERAKAN ({gestureProgress}%)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 leading-snug">
                  Gerakkan tangan atau tubuhmu ke kotak pilihan dan tahan 1.2 detik untuk mengunci jawaban!
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Game Over / Victory Podium Screen */
          <div className="bg-white/95 rounded-2xl p-6 md:p-10 text-slate-900 shadow-2xl border border-white/20 max-w-2xl mx-auto space-y-6 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Misi Selesai! Luar Biasa!</h2>
              <p className="text-xs md:text-sm text-slate-500">
                Kamu telah menyelesaikan petualangan pembelajaran "{game.title}"
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <div className="text-xs text-slate-500">Total Skor</div>
                <div className="text-2xl font-black text-indigo-600 font-mono tabular-nums">{score}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Akurasi</div>
                <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums">
                  {Math.round((score / (game.questions.length * 150)) * 100)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Max Streak</div>
                <div className="text-2xl font-black text-amber-500 font-mono tabular-nums">{maxStreak}x</div>
              </div>
            </div>

            {/* Badges Earned */}
            {earnedBadges.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Medali & Penghargaan Diraih:
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {earnedBadges.map((b, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard Submission */}
            {!hasSubmittedScore ? (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-indigo-900">
                  Simpan Namamu ke Papan Juara Kelas:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Masukkan Nama Lengkap / Panggilan"
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveToLeaderboard}
                    className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm whitespace-nowrap"
                  >
                    Simpan Nilai
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                ✓ Skor berhasil dicatat di Papan Juara Kelas!
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Main Ulang</span>
              </button>
              <button
                onClick={onBackToGenerator}
                className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-sm"
              >
                <span>Pilih Misi Lain</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </ThemeBackdrop>
  );
};
