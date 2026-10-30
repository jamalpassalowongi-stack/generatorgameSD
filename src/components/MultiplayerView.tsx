import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Users,
  Trophy,
  Zap,
  Play,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Smartphone,
  Tv,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { GamePackage, Question } from '../types/game';
import { OFFLINE_GAME_PRESETS } from '../services/offlinePresets';
import { sound } from '../services/sound';

interface MultiplayerViewProps {
  initialGame?: GamePackage;
}

interface SplitPlayer {
  id: number;
  name: string;
  colorName: string;
  bgClass: string;
  btnClass: string;
  score: number;
  streak: number;
  lastAnswer: number | null;
  hasAnswered: boolean;
}

export const MultiplayerView: React.FC<MultiplayerViewProps> = ({ initialGame }) => {
  const [multiMode, setMultiMode] = useState<'split_screen' | 'room_battle'>('split_screen');
  const [selectedGame, setSelectedGame] = useState<GamePackage>(
    initialGame || OFFLINE_GAME_PRESETS[2] // Preset Budaya Nusantara / Buzzer
  );

  // -------------------------------------------------------------
  // Mode 1: Split-screen Smart Board Buzzer State (2 or 4 Players)
  // -------------------------------------------------------------
  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [players, setPlayers] = useState<SplitPlayer[]>([
    {
      id: 1,
      name: 'Tim Merah',
      colorName: 'Merah',
      bgClass: 'bg-rose-50 border-rose-300 text-rose-950',
      btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
      score: 0,
      streak: 0,
      lastAnswer: null,
      hasAnswered: false,
    },
    {
      id: 2,
      name: 'Tim Biru',
      colorName: 'Biru',
      bgClass: 'bg-sky-50 border-sky-300 text-sky-950',
      btnClass: 'bg-sky-600 hover:bg-sky-700 text-white',
      score: 0,
      streak: 0,
      lastAnswer: null,
      hasAnswered: false,
    },
    {
      id: 3,
      name: 'Tim Kuning',
      colorName: 'Kuning',
      bgClass: 'bg-amber-50 border-amber-300 text-amber-950',
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      score: 0,
      streak: 0,
      lastAnswer: null,
      hasAnswered: false,
    },
    {
      id: 4,
      name: 'Tim Hijau',
      colorName: 'Hijau',
      bgClass: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      score: 0,
      streak: 0,
      lastAnswer: null,
      hasAnswered: false,
    },
  ]);

  const [qIndex, setQIndex] = useState(0);
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [fastestPlayerId, setFastestPlayerId] = useState<number | null>(null);

  const currentQ: Question = selectedGame.questions[qIndex] || selectedGame.questions[0];

  const handlePlayerAnswer = (playerId: number, optionIdx: number) => {
    if (isRoundFinished || isGameFinished) return;

    sound.playBuzzer();

    setPlayers((prev) => {
      const isFirst = !prev.some((p) => p.hasAnswered);
      if (isFirst) {
        setFastestPlayerId(playerId);
      }

      const isCorrect = optionIdx === currentQ.correctAnswer;
      const updated = prev.map((p) => {
        if (p.id === playerId && !p.hasAnswered) {
          const newStreak = isCorrect ? p.streak + 1 : 0;
          const speedBonus = isFirst ? 50 : 20;
          const points = isCorrect ? (currentQ.points || 100) + speedBonus : 0;
          return {
            ...p,
            hasAnswered: true,
            lastAnswer: optionIdx,
            streak: newStreak,
            score: p.score + points,
          };
        }
        return p;
      });

      // Check if all active players answered
      const activePlayers = updated.slice(0, playerCount);
      const allDone = activePlayers.every((p) => p.hasAnswered);

      if (allDone) {
        setIsRoundFinished(true);
        if (isCorrect) sound.playCorrect();
        else sound.playWrong();
      }

      return updated;
    });
  };

  const handleNextRound = () => {
    sound.playClick();
    if (qIndex + 1 < selectedGame.questions.length) {
      setQIndex((prev) => prev + 1);
      setIsRoundFinished(false);
      setFastestPlayerId(null);
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          hasAnswered: false,
          lastAnswer: null,
        }))
      );
    } else {
      setIsGameFinished(true);
      sound.playVictory();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleResetDuel = () => {
    sound.playClick();
    setQIndex(0);
    setIsRoundFinished(false);
    setIsGameFinished(false);
    setFastestPlayerId(null);
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        score: 0,
        streak: 0,
        hasAnswered: false,
        lastAnswer: null,
      }))
    );
  };

  // -------------------------------------------------------------
  // Mode 2: Real-time Online PIN Room Battle State
  // -------------------------------------------------------------
  const [roomRole, setRoomRole] = useState<'select' | 'host' | 'student'>('select');
  const [roomPin, setRoomPin] = useState('');
  const [createdRoom, setCreatedRoom] = useState<any>(null);
  const [joinedRoom, setJoinedRoom] = useState<any>(null);
  const [studentNickname, setStudentNickname] = useState('Siswa Cilik');
  const [studentAvatar, setStudentAvatar] = useState('🦁');
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const pollingRef = useRef<any>(null);

  // Poll room status if in host or student view
  useEffect(() => {
    const pin = createdRoom?.pin || joinedRoom?.pin;
    if (!pin) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/rooms/${pin}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.room) {
            if (createdRoom) setCreatedRoom(data.room);
            if (joinedRoom) setJoinedRoom(data.room);
          }
        }
      } catch (e) {
        // quiet error on network/offline
      }
    };

    pollingRef.current = setInterval(fetchStatus, 1500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [createdRoom?.pin, joinedRoom?.pin]);

  const handleCreateRoom = async () => {
    sound.playClick();
    setIsCreatingRoom(true);
    setRoomError(null);

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedGame.title,
          grade: selectedGame.grade,
          subject: selectedGame.subject,
          questions: selectedGame.questions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedRoom(data.room);
        setRoomRole('host');
        sound.playVictory();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setRoomError('Gagal membuat ruangan kuis online. Mode Duel Buzzer Smart Board dapat digunakan secara offline!');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    sound.playClick();
    setRoomError(null);

    if (!roomPin.trim()) {
      setRoomError('Masukkan 4 digit PIN ruangan!');
      return;
    }

    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: roomPin.trim(),
          name: studentNickname.trim(),
          avatar: studentAvatar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setJoinedRoom(data.room);
        setRoomRole('student');
        sound.playVictory();
      } else {
        setRoomError(data.error || 'PIN tidak ditemukan!');
      }
    } catch (e) {
      setRoomError('Gagal terhubung ke server ruangan.');
    }
  };

  const handleHostStart = async () => {
    if (!createdRoom) return;
    sound.playClick();
    await fetch(`/api/rooms/${createdRoom.pin}/start`, { method: 'POST' });
  };

  const handleHostNext = async () => {
    if (!createdRoom) return;
    sound.playClick();
    await fetch(`/api/rooms/${createdRoom.pin}/next`, { method: 'POST' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Multiplayer Kuis & Tantangan Kelas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duel adu ketangkasan di smart board atau multiplayer multi-perangkat via PIN kuis
          </p>
        </div>

        {/* Segmented Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => {
              sound.playClick();
              setMultiMode('split_screen');
            }}
            className={`cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              multiMode === 'split_screen'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Duel Smart Board (Offline)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setMultiMode('room_battle');
            }}
            className={`cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              multiMode === 'room_battle'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>PIN Kamar Kuis (Real-time)</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-VIEW 1: SMARTBOARD SPLIT-SCREEN DUEL (100% OFFLINE) */}
      {/* ============================================================== */}
      {multiMode === 'split_screen' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Jumlah Pemain:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => {
                    sound.playClick();
                    setPlayerCount(2);
                  }}
                  className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-md ${
                    playerCount === 2 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2 Pemain
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setPlayerCount(4);
                  }}
                  className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-md ${
                    playerCount === 4 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4 Pemain
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-bold text-indigo-700">Soal {qIndex + 1}</span>
              <span>/ {selectedGame.questions.length}</span>
            </div>

            <button
              onClick={handleResetDuel}
              className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Ronde</span>
            </button>
          </div>

          {!isGameFinished ? (
            <div className="space-y-6">
              {/* Central Shared Question Board on Smart Board */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 text-center shadow-xl border border-slate-800 space-y-3">
                <div className="inline-block text-xs uppercase tracking-wider text-indigo-300 font-semibold bg-indigo-900/60 px-3 py-1 rounded-full border border-indigo-700">
                  {selectedGame.title} · Ronde {qIndex + 1}
                </div>
                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white max-w-3xl mx-auto">
                  {currentQ.question}
                </h2>

                {fastestPlayerId && (
                  <div className="text-xs text-amber-300 font-bold flex items-center justify-center gap-1.5 pt-1 animate-pulse">
                    <Zap className="w-4 h-4 fill-amber-300" />
                    <span>
                      {players.find((p) => p.id === fastestPlayerId)?.name} menekan buzzer tercepat (+50 Speed Bonus)!
                    </span>
                  </div>
                )}
              </div>

              {/* Split Touch Zones for Players (Left/Right or 4-Quadrant on Smart Board) */}
              <div className={`grid ${playerCount === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
                {players.slice(0, playerCount).map((p) => {
                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl border-2 p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all ${p.bgClass}`}
                    >
                      {/* Player Score Header */}
                      <div className="flex items-center justify-between border-b border-black/10 pb-2">
                        <div>
                          <div className="font-extrabold text-sm md:text-base">{p.name}</div>
                          <div className="text-[11px] text-black/60">Streak: {p.streak}x</div>
                        </div>
                        <div className="text-xl md:text-2xl font-black font-mono tabular-nums">{p.score}</div>
                      </div>

                      {/* 4 Big Touch Buzzer Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {currentQ.options.map((opt, optIdx) => {
                          const letters = ['A', 'B', 'C', 'D'];
                          const isPicked = p.lastAnswer === optIdx;
                          const isCorrect = optIdx === currentQ.correctAnswer;

                          let btnStyle = 'bg-white hover:bg-slate-100 border border-black/15 text-slate-800';
                          if (p.hasAnswered) {
                            if (isPicked && isCorrect) {
                              btnStyle = 'bg-emerald-500 text-white font-black shadow-md';
                            } else if (isPicked && !isCorrect) {
                              btnStyle = 'bg-rose-500 text-white font-bold';
                            } else {
                              btnStyle = 'opacity-40 bg-white/50 text-slate-400 border-transparent';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handlePlayerAnswer(p.id, optIdx)}
                              disabled={p.hasAnswered}
                              className={`cursor-pointer p-3.5 rounded-xl text-left transition-all min-h-16 flex flex-col justify-between ${btnStyle}`}
                            >
                              <div className="font-black text-xs">{letters[optIdx]}</div>
                              <div className="text-xs font-semibold leading-tight line-clamp-2">{opt}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Status indicator */}
                      <div className="text-center text-xs font-semibold">
                        {p.hasAnswered ? (
                          p.lastAnswer === currentQ.correctAnswer ? (
                            <span className="text-emerald-700">✓ Menjawab Benar!</span>
                          ) : (
                            <span className="text-rose-700">✗ Belum Tepat</span>
                          )
                        ) : (
                          <span className="text-slate-500 animate-pulse">Menunggu respon...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advance Round Button (When all have answered) */}
              {isRoundFinished && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fadeIn">
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Kunci Jawaban:</span>{' '}
                    {['A', 'B', 'C', 'D'][currentQ.correctAnswer]}. {currentQ.options[currentQ.correctAnswer]}
                    <div className="text-[11px] text-slate-500 mt-0.5">{currentQ.explanation}</div>
                  </div>

                  <button
                    onClick={handleNextRound}
                    className="cursor-pointer px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 shrink-0 transition-all"
                  >
                    <span>{qIndex + 1 < selectedGame.questions.length ? 'Ronde Berikutnya' : 'Lihat Pemenang'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Split Screen Game Over Podium */
            <div className="bg-white rounded-2xl p-8 max-w-xl mx-auto border border-slate-200 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Pertarungan Duel Selesai!</h2>
                <p className="text-xs text-slate-500 mt-1">Klasemen Poin Akhir Siswa</p>
              </div>

              <div className="space-y-2">
                {[...players.slice(0, playerCount)]
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        idx === 0 ? 'bg-amber-50 border-amber-300 font-bold' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-slate-900">{p.name}</span>
                      </div>
                      <span className="text-base font-black font-mono text-indigo-700 tabular-nums">
                        {p.score} Poin
                      </span>
                    </div>
                  ))}
              </div>

              <button
                onClick={handleResetDuel}
                className="cursor-pointer px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Mulai Duel Baru
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-VIEW 2: REAL-TIME ONLINE PIN ROOM BATTLE */}
      {/* ============================================================== */}
      {multiMode === 'room_battle' && (
        <div className="space-y-6">
          {roomRole === 'select' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto py-8">
              {/* Host Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Tv className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Buka Ruang Kuis (Guru di Smartboard)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tampilkan soal di papan pintar kelas. Hasilkan kode PIN 4 digit agar siswa bisa bergabung dari laptop/tablet masing-masing.
                  </p>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom}
                  className="cursor-pointer w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                >
                  {isCreatingRoom ? 'Membuat Kamar...' : 'Buat Kamar Kuis Baru'}
                </button>
              </div>

              {/* Student Join Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-all">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Gabung Sebagai Siswa</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Masukkan PIN 4 digit yang tampil di papan pintar guru, masukkan namamu, dan pilih karakter avatar!
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={roomPin}
                    onChange={(e) => setRoomPin(e.target.value.toUpperCase())}
                    placeholder="Masukkan PIN (cth: 4892)"
                    maxLength={6}
                    className="w-full text-center text-sm font-mono tracking-widest font-bold py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={studentNickname}
                    onChange={(e) => setStudentNickname(e.target.value)}
                    placeholder="Nama Siswa"
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="cursor-pointer w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                  >
                    Masuk ke Pertandingan
                  </button>
                </div>
              </div>
            </div>
          )}

          {roomError && (
            <div className="max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg text-center font-medium">
              {roomError}
            </div>
          )}

          {/* Host Screen */}
          {roomRole === 'host' && createdRoom && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Layar Utama Smart Board
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">{createdRoom.title}</h2>
                </div>

                {/* Big PIN Display for students to see across classroom */}
                <div className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl shadow-md text-center">
                  <div className="text-[10px] uppercase font-semibold text-indigo-200">KODE PIN SISWA</div>
                  <div className="text-2xl md:text-3xl font-black font-mono tracking-widest">{createdRoom.pin}</div>
                </div>
              </div>

              {/* Waiting Lobby or In-Game */}
              {createdRoom.status === 'waiting' ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-xs font-semibold text-slate-600">
                    Siswa Bergabung ({createdRoom.players.length} Siswa):
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                    {createdRoom.players.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">
                        Menunggu siswa memasukkan PIN dari perangkat mereka...
                      </div>
                    ) : (
                      createdRoom.players.map((pl: any) => (
                        <div
                          key={pl.id}
                          className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                        >
                          <span>{pl.avatar}</span>
                          <span>{pl.name}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleHostStart}
                      className="cursor-pointer px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all"
                    >
                      Mulai Kuis Sekarang!
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Question */}
                  <div className="p-6 bg-slate-900 text-white rounded-xl text-center space-y-2">
                    <div className="text-xs text-indigo-400 font-bold">
                      Soal {createdRoom.currentQuestionIndex + 1} / {createdRoom.questions.length}
                    </div>
                    <div className="text-lg md:text-2xl font-bold">
                      {createdRoom.questions[createdRoom.currentQuestionIndex]?.question}
                    </div>
                  </div>

                  {/* Leaderboard tally */}
                  <div>
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Papan Skor Siswa Real-Time
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {[...createdRoom.players]
                        .sort((a, b) => b.score - a.score)
                        .map((p, i) => (
                          <div
                            key={p.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-500">#{i + 1}</span>
                              <span>{p.avatar}</span>
                              <span className="font-semibold text-slate-900 truncate max-w-28">{p.name}</span>
                            </div>
                            <span className="font-mono font-bold text-indigo-700">{p.score} pt</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleHostNext}
                      className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      Lanjut ke Soal Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Screen */}
          {roomRole === 'student' && joinedRoom && (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-md text-center">
              <div className="space-y-1">
                <div className="text-2xl">{studentAvatar}</div>
                <div className="text-base font-bold text-slate-900">{studentNickname}</div>
                <div className="text-xs text-slate-500">Kamar PIN: {joinedRoom.pin}</div>
              </div>

              {joinedRoom.status === 'waiting' ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
                  <div>Menunggu guru menekan tombol "Mulai Kuis" di papan pintar...</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-indigo-700 font-bold">
                    Soal {joinedRoom.currentQuestionIndex + 1}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {joinedRoom.questions[joinedRoom.currentQuestionIndex]?.question}
                  </div>

                  {/* 4 Answer buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                      <button
                        key={idx}
                        onClick={async () => {
                          sound.playBuzzer();
                          const me = joinedRoom.players.find((p: any) => p.name === studentNickname);
                          if (me) {
                            await fetch(`/api/rooms/${joinedRoom.pin}/answer`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                playerId: me.id,
                                qIndex: joinedRoom.currentQuestionIndex,
                                answerIndex: idx,
                              }),
                            });
                          }
                        }}
                        className="cursor-pointer py-4 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-900 font-black text-lg rounded-xl border border-indigo-200 shadow-xs transition-all"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
