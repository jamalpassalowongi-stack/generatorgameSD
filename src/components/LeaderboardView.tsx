import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, Flame, Printer, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { sound } from '../services/sound';

const INITIAL_SEEDED_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    name: 'Aisyah Putri Rahma',
    avatar: '🚀',
    grade: 'Kelas 4',
    score: 880,
    streak: 5,
    accuracy: 96,
    gameTitle: 'Misi Roket Bintang: Balap Berhitung Galaksi',
    date: '28 Okt',
    badges: ['Bintang Pertama', 'Api Streak x3', 'Cendekiawan Cilik'],
  },
  {
    id: 'seed-2',
    name: 'Muhammad Farhan',
    avatar: '🦁',
    grade: 'Kelas 5',
    score: 790,
    streak: 4,
    accuracy: 92,
    gameTitle: 'Duel Buzzer Smartboard: Budaya Nusantara',
    date: '27 Okt',
    badges: ['Bintang Pertama', 'Juara Duel'],
  },
  {
    id: 'seed-3',
    name: 'Kirana Larasati',
    avatar: '🦊',
    grade: 'Kelas 3',
    score: 740,
    streak: 4,
    accuracy: 90,
    gameTitle: 'Ekspedisi Gerak Rimba: Detektif Hewan',
    date: '26 Okt',
    badges: ['Bintang Pertama', 'Master Gerak Kamera'],
  },
  {
    id: 'seed-4',
    name: 'Bima Satria Wijaya',
    avatar: '🐯',
    grade: 'Kelas 6',
    score: 690,
    streak: 3,
    accuracy: 85,
    gameTitle: 'Detektif Laboratorium Waktu: Misteri Energi',
    date: '25 Okt',
    badges: ['Bintang Pertama', 'Detektif Ulung'],
  },
  {
    id: 'seed-5',
    name: 'Nayla Zahra',
    avatar: '🐼',
    grade: 'Kelas 2',
    score: 620,
    streak: 3,
    accuracy: 88,
    gameTitle: 'Speed Word Quest: English Explorer',
    date: '24 Okt',
    badges: ['Bintang Pertama'],
  },
];

export const LeaderboardView: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertificateStudent, setSelectedCertificateStudent] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('eduplay_leaderboard');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge stored with seeded
        setEntries([...parsed, ...INITIAL_SEEDED_LEADERBOARD]);
      } else {
        setEntries(INITIAL_SEEDED_LEADERBOARD);
        localStorage.setItem('eduplay_leaderboard', JSON.stringify(INITIAL_SEEDED_LEADERBOARD));
      }
    } catch {
      setEntries(INITIAL_SEEDED_LEADERBOARD);
    }
  }, []);

  const filteredEntries = entries.filter((e) => {
    const matchGrade = selectedGradeFilter === 'all' || e.grade === selectedGradeFilter;
    const matchSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.gameTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchSearch;
  });

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>Papan Juara & Prestasi Siswa Kelas SD</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Merekam capaian skor, streak multiplier, dan lencana medali dari setiap misi edukasi
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Ekspor Rapor Juara</span>
        </button>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-4">
        {/* Rank 2 */}
        {filteredEntries[1] && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-xs space-y-2 order-2 md:order-1">
            <div className="w-10 h-10 bg-slate-100 text-slate-700 font-black rounded-full flex items-center justify-center mx-auto text-sm border-2 border-slate-300">
              #2
            </div>
            <div className="text-2xl">{filteredEntries[1].avatar}</div>
            <div className="font-bold text-slate-900 text-sm truncate">{filteredEntries[1].name}</div>
            <div className="text-xs text-slate-500">{filteredEntries[1].grade}</div>
            <div className="text-xl font-black font-mono text-indigo-600 tabular-nums">
              {filteredEntries[1].score} Pts
            </div>
          </div>
        )}

        {/* Rank 1 (Tallest) */}
        {filteredEntries[0] && (
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-400 p-6 text-center shadow-md space-y-3 order-1 md:order-2 md:-translate-y-4">
            <div className="w-12 h-12 bg-amber-400 text-amber-950 font-black rounded-full flex items-center justify-center mx-auto text-base shadow-sm">
              👑 #1
            </div>
            <div className="text-3xl">{filteredEntries[0].avatar}</div>
            <div>
              <div className="font-extrabold text-slate-900 text-base">{filteredEntries[0].name}</div>
              <div className="text-xs text-amber-700 font-semibold">{filteredEntries[0].grade} · Juara Utama</div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-600 tabular-nums">
              {filteredEntries[0].score} Poin
            </div>
            <div className="text-[11px] text-slate-500 italic">{filteredEntries[0].gameTitle}</div>
          </div>
        )}

        {/* Rank 3 */}
        {filteredEntries[2] && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-xs space-y-2 order-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-800 font-black rounded-full flex items-center justify-center mx-auto text-sm border-2 border-amber-300">
              #3
            </div>
            <div className="text-2xl">{filteredEntries[2].avatar}</div>
            <div className="font-bold text-slate-900 text-sm truncate">{filteredEntries[2].name}</div>
            <div className="text-xs text-slate-500">{filteredEntries[2].grade}</div>
            <div className="text-xl font-black font-mono text-indigo-600 tabular-nums">
              {filteredEntries[2].score} Pts
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'Semua Kelas' },
            { id: 'Kelas 1', label: 'Kelas 1' },
            { id: 'Kelas 2', label: 'Kelas 2' },
            { id: 'Kelas 3', label: 'Kelas 3' },
            { id: 'Kelas 4', label: 'Kelas 4' },
            { id: 'Kelas 5', label: 'Kelas 5' },
            { id: 'Kelas 6', label: 'Kelas 6' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setSelectedGradeFilter(tab.id);
              }}
              className={`cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedGradeFilter === tab.id
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa / topik..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Peringkat</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Misi Pembelajaran</th>
                <th className="py-3 px-4 text-center">Streak</th>
                <th className="py-3 px-4 text-right">Skor Total</th>
                <th className="py-3 px-4 text-center">Sertifikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700 tabular-nums">#{idx + 1}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="text-base">{row.avatar}</span>
                    <span>{row.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{row.grade}</td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{row.gameTitle}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{row.streak}x</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600 tabular-nums text-sm">
                    {row.score}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setSelectedCertificateStudent(row);
                      }}
                      className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-semibold underline text-[11px]"
                    >
                      Buka Piagam
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Piagam Penghargaan Siswa (Certificate Award) */}
      {selectedCertificateStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 space-y-6 shadow-2xl border-4 border-amber-300 relative text-center">
            <button
              onClick={() => setSelectedCertificateStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg p-2 cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-8 h-8" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-600">
                PIAGAM PENGHARGAAN JUARA EDUPAY SD
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                Sertifikat Prestasi Belajar Mandiri
              </h2>
            </div>

            <div className="py-3 border-y border-amber-100 space-y-2">
              <div className="text-xs text-slate-500">Diberikan Kepada Siswa Berprestasi:</div>
              <div className="text-xl font-black text-indigo-950">{selectedCertificateStudent.name}</div>
              <div className="text-xs text-slate-600 font-medium">
                {selectedCertificateStudent.grade} Sekolah Dasar
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Telah berhasil menyelesaikan misi pembelajaran interaktif{' '}
              <span className="font-bold text-slate-900">"{selectedCertificateStudent.gameTitle}"</span> dengan skor{' '}
              <span className="font-bold text-indigo-600">{selectedCertificateStudent.score} Poin</span> dan akurasi{' '}
              <span className="font-bold text-emerald-600">{selectedCertificateStudent.accuracy}%</span>.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Piagam Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
