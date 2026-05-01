import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Quiz } from '../../../shared/types';
import { cn } from '../../utils/cn';

// ─── Quiz Player for Bocil ───────────────────────────────────────────────────
const BocilQuizPlayer: React.FC<{
  quiz: Quiz;
  participantId: string;
  onDone: (score: number, pts: number) => void;
  onClose: () => void;
}> = ({ quiz, participantId, onDone, onClose }) => {
  const { submitQuiz } = useApp();
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; earnedPoints: number } | null>(null);
  const [step, setStep] = useState(0);

  const handleAnswer = (optIdx: number) => {
    if (submitted) return;
    const a = [...answers]; a[step] = optIdx; setAnswers(a);
  };

  const handleSubmit = () => {
    const finalAnswers = answers.map(a => a ?? 0);
    const res = submitQuiz(participantId, quiz.id, finalAnswers);
    setResult(res); setSubmitted(true); onDone(res.score, res.earnedPoints);
  };

  const allAnswered = answers.every(a => a !== null);
  const q = quiz.questions[step];

  if (submitted && result) {
    const emoji = result.score >= 80 ? '🎉' : result.score >= 60 ? '👍' : '💪';
    const message = result.score >= 80 ? 'Keren banget!' : result.score >= 60 ? 'Lumayan bagus!' : 'Ayo belajar lagi!';
    return (
      <div className="text-center py-6">
        <div className="text-6xl mb-4 animate-bounce">{emoji}</div>
        <h3 className="text-3xl font-extrabold text-gray-900 font-heading mb-2">Skor: {result.score}%</h3>
        <p className="text-lg text-gray-600 mb-2">{message}</p>
        <p className="text-primary-600 font-bold text-xl mb-6">+{result.earnedPoints} poin! 🌟</p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 max-h-60 overflow-y-auto">
          {quiz.questions.map((q2, i) => {
            const isCorrect = answers[i] === q2.correctAnswer;
            return (
              <div key={i} className={cn('flex items-start gap-2 py-2 text-sm', i > 0 && 'border-t border-gray-200')}>
                <span className="text-lg flex-shrink-0">{isCorrect ? '✅' : '❌'}</span>
                <div>
                  <p className="font-medium text-gray-700">{q2.text}</p>
                  {!isCorrect && <p className="text-xs text-emerald-600 mt-0.5">Jawaban benar: {q2.options[q2.correctAnswer]}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="bocil-btn-primary w-full">Selesai ✨</button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-primary-600">
          Soal {step + 1} / {quiz.questions.length}
        </span>
        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <div key={i} className={cn(
              'w-3 h-3 rounded-full transition-all',
              i === step ? 'bg-primary-500 scale-125' : answers[i] !== null ? 'bg-primary-200' : 'bg-gray-200'
            )} />
          ))}
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
        <div className="bg-gradient-to-r from-primary-400 to-teal-400 h-2 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-gradient-to-br from-primary-50 to-teal-50 rounded-2xl p-5 mb-5 border border-primary-100">
        <p className="text-lg font-bold text-gray-800">❓ {q.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {q.options.map((opt, i) => {
          const letters = ['A', 'B', 'C', 'D'];
          const isSelected = answers[step] === i;
          return (
            <button key={i} onClick={() => handleAnswer(i)}
              className={cn(
                'w-full text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all duration-200',
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md shadow-primary-100 scale-[1.02]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              )}>
              <span className={cn(
                'inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-xs font-bold',
                isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
              )}>{letters[i]}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="bocil-btn-secondary flex-1">
            ⬅️ Sebelumnya
          </button>
        )}
        {step < quiz.questions.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="bocil-btn-primary flex-1" disabled={answers[step] === null}>
            Selanjutnya ➡️
          </button>
        ) : (
          <button onClick={handleSubmit} className="bocil-btn-primary flex-1" disabled={!allAnswered}>
            Kumpulkan! 🚀
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Bocil Quiz Page ─────────────────────────────────────────────────────
export const BocilQuiz: React.FC = () => {
  const { quizzes, quizAttempts, participants } = useApp();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState(() => localStorage.getItem('bocil_id') || '');
  const [playing, setPlaying] = useState(false);
  const [resultPopup, setResultPopup] = useState<{ score: number; pts: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bocil_id');
    if (saved) setSelectedParticipant(saved);
  }, []);

  const activeQuizzes = quizzes.filter(q => q.isActive);
  const activeParticipants = participants.filter(p => p.status === 'aktif');

  const getAttemptCount = (quizId: string) => quizAttempts.filter(a => a.quizId === quizId).length;
  const getAvgScore = (quizId: string) => {
    const attempts = quizAttempts.filter(a => a.quizId === quizId);
    if (!attempts.length) return null;
    return Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
  };

  const startQuiz = () => {
    if (selectedQuiz && selectedParticipant) {
      setPlaying(true);
    }
  };

  if (playing && selectedQuiz) {
    return (
      <div className="bocil-page">
        <div className="max-w-2xl mx-auto">
          <div className="bocil-card">
            <div className="bocil-card-header mb-4">
              <h2 className="bocil-card-title">📝 {selectedQuiz.title}</h2>
            </div>
            <BocilQuizPlayer
              quiz={selectedQuiz}
              participantId={selectedParticipant}
              onDone={(score, pts) => setResultPopup({ score, pts })}
              onClose={() => { setPlaying(false); setSelectedQuiz(null); setSelectedParticipant(''); setResultPopup(null); }}
            />
          </div>
        </div>
      </div>
    );
  }

    const today = new Date().toISOString().split("T")[0];
    
    const hasAttemptedToday = (quizId: string) =>
      quizAttempts.some(a => 
        String(a.quizId) === String(quizId) && 
        String(a.participantId) === String(selectedParticipant) &&
        new Date(a.completedAt).toISOString().split("T")[0] === today &&
        a.earnedPoints > 0
      );

    const getBestScore = (quizId: string) => {
      const myAttempts = quizAttempts.filter(a => String(a.quizId) === String(quizId) && String(a.participantId) === String(selectedParticipant));
      if (myAttempts.length === 0) return null;
      return Math.max(...myAttempts.map(a => a.score));
    };

    return (
      <div className="bocil-page">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading mb-2">
            📖 Quiz Keislaman
          </h1>
          <p className="text-gray-500 text-base sm:text-lg">Dapatkan poin baru setiap hari! ✨</p>
        </div>
  
        {/* Select participant */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">👤 Pilih Nama Kamu:</label>
          <select
            value={selectedParticipant}
            onChange={e => setSelectedParticipant(e.target.value)}
            className="bocil-select"
          >
            <option value="">Pilih nama...</option>
            {activeParticipants.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
  
        {/* Quiz Cards */}
        {activeQuizzes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Belum ada quiz aktif</h3>
            <p className="text-gray-400">Tunggu admin membuat quiz baru ya!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeQuizzes.map((quiz, i) => {
              const avg = getAvgScore(quiz.id);
              const totalAttempts = getAttemptCount(quiz.id);
              const doneToday = hasAttemptedToday(quiz.id);
              const best = getBestScore(quiz.id);
              const myTotalTries = quizAttempts.filter(a => String(a.quizId) === String(quiz.id) && String(a.participantId) === String(selectedParticipant)).length;
              
              let medal = null;
              if (best !== null) {
                if (best === 100) medal = { icon: '🥇', label: 'Sempurna!' };
                else if (best >= 80) medal = { icon: '🥈', label: 'Hebat!' };
                else if (best >= 60) medal = { icon: '🥉', label: 'Bagus!' };
              }
  
              return (
                <div key={quiz.id} className="bocil-quiz-card animate-fade-in relative overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
                  {medal && (
                    <div className="absolute -top-1 -right-1 bg-white shadow-md rounded-bl-2xl p-2 px-3 flex flex-col items-center border-b border-l border-gray-100 z-10">
                      <span className="text-2xl">{medal.icon}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{medal.label}</span>
                    </div>
                  )}

                  <div className="text-4xl mb-3">
                    {i === 0 ? '🕌' : i === 1 ? '📿' : '📚'}
                  </div>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-gray-900 font-heading text-lg leading-tight">{quiz.title}</h3>
                    {selectedParticipant && myTotalTries > 0 && (
                      <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {myTotalTries}x PERCOBAAN
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-xl py-2 text-center">
                      <p className="text-base font-extrabold text-gray-800">{quiz.questions.length}</p>
                      <p className="text-[10px] text-gray-500">Soal</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-2 text-center">
                      <p className="text-base font-extrabold text-gray-800">{totalAttempts}</p>
                      <p className="text-[10px] text-gray-500">Dimainkan</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-2 text-center">
                      <p className="text-base font-extrabold text-gray-800">{avg !== null ? `${avg}%` : '-'}</p>
                      <p className="text-[10px] text-gray-500">Rata-rata</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedQuiz(quiz); if (selectedParticipant) startQuiz(); }}
                    disabled={!selectedParticipant}
                    className={cn(
                      'w-full py-3 rounded-xl font-bold text-sm transition-all duration-200',
                      !selectedParticipant 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : doneToday
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                          : 'bocil-btn-primary'
                    )}
                  >
                    {!selectedParticipant 
                      ? 'Pilih nama dulu 👆' 
                      : doneToday 
                        ? 'Sudah Selesai Hari Ini ✅' 
                        : 'Mulai Quiz 🚀'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      {/* Daily Leaderboard - Battle Arena Style */}
      <div className="mt-16 mb-12">
        <div className="bg-slate-900 rounded-[40px] p-8 relative overflow-hidden shadow-2xl border-4 border-red-500/30">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-600/10 rounded-full -ml-24 -mb-24 blur-3xl animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div className="text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white font-heading flex items-center justify-center md:justify-start gap-3 italic tracking-tighter">
                  <span className="text-red-500 animate-bounce">⚔️</span> 
                  ARENA PEJUANG KUIS
                  <span className="text-red-500 animate-bounce">⚔️</span>
                </h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Siapa yang paling tangguh hari ini?</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse">
                   LIVE BATTLE 🔥
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {participants
                .filter(p => p.status === 'aktif')
                .map(p => {
                  const todayAttempts = quizAttempts.filter(a => 
                    String(a.participantId) === String(p.id) && 
                    new Date(a.completedAt).toISOString().split("T")[0] === today
                  );
                  const todayPts = todayAttempts.reduce((sum, a) => sum + a.earnedPoints, 0);
                  const maxScore = todayAttempts.length > 0 ? Math.max(...todayAttempts.map(a => a.score)) : 0;
                  const powerLevel = todayAttempts.length;
                  return { ...p, todayPts, maxScore, powerLevel };
                })
                .filter(p => p.powerLevel > 0)
                .sort((a, b) => b.powerLevel - a.powerLevel || b.maxScore - a.maxScore)
                .slice(0, 4)
                .map((p, idx) => (
                  <div key={p.id} className={cn(
                    "group relative bg-white/5 backdrop-blur-sm border-2 p-5 rounded-[32px] transition-all hover:-translate-y-2 duration-300 flex flex-col items-center text-center",
                    idx === 0 ? "border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] bg-yellow-500/5" : "border-white/10 hover:border-red-500/50"
                  )}>
                    {/* Rank Badge */}
                    <div className={cn(
                      "absolute -top-4 w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg z-20",
                      idx === 0 ? "bg-yellow-500 rotate-12" : idx === 1 ? "bg-slate-300 -rotate-12" : "bg-orange-600 rotate-6"
                    )}>
                      {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🛡️'}
                    </div>

                    {/* Avatar with Aura for #1 */}
                    <div className="relative mb-4">
                      {idx === 0 && (
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl animate-pulse scale-150 opacity-20" />
                      )}
                      <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-inner relative z-10 overflow-hidden",
                        idx === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-600" : "bg-gradient-to-br from-gray-700 to-gray-800"
                      )}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.nama} className="w-full h-full object-cover" />
                        ) : (
                          p.nama.charAt(0)
                        )}
                      </div>
                    </div>

                    <h4 className="font-black text-white text-lg mb-1 truncate w-full">{p.nama.split(' ')[0]}</h4>
                    
                    <div className="w-full space-y-3">
                      {/* Kekuatan Display */}
                      <div className="bg-red-600 rounded-2xl py-2 px-3 shadow-lg shadow-red-900/40 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                         <p className="text-[10px] font-black text-red-100 uppercase tracking-tighter leading-none mb-1">Kekuatan Pejuang</p>
                         <p className="text-xl font-black text-white leading-none">{p.powerLevel * 100}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 px-1">
                        <div className="flex flex-col items-start">
                          <span className="text-[8px] font-bold text-gray-500 uppercase leading-none">Skor</span>
                          <span className="text-xs font-black text-white">{p.maxScore}%</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-bold text-gray-500 uppercase leading-none">Percobaan</span>
                          <span className="text-xs font-black text-red-400">{p.powerLevel}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              
              {participants.filter(p => quizAttempts.some(a => String(a.participantId) === String(p.id) && new Date(a.completedAt).toISOString().split("T")[0] === today)).length === 0 && (
                <div className="col-span-full py-16 text-center bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
                  <span className="text-5xl block mb-4 animate-pulse">⚔️</span>
                  <p className="text-white/40 font-black italic uppercase tracking-widest">Arena masih sepi... Jadilah petarung pertama! 🔥</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quiz Results */}
      {quizAttempts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 font-heading mb-4">🏆 Hasil Quiz Terbaru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quizAttempts.slice(0, 6).map((attempt, i) => {
              const p = participants.find(x => x.id === attempt.participantId);
              const q = quizzes.find(x => x.id === attempt.quizId);
              const emoji = attempt.score >= 80 ? '🌟' : attempt.score >= 60 ? '👍' : '💪';
              return (
                <div key={attempt.id} className="bocil-result-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-800 truncate">{p?.nama ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400 truncate">{q?.title ?? 'Unknown'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-lg font-extrabold', attempt.score >= 70 ? 'text-emerald-600' : 'text-orange-500')}>
                        {attempt.score}%
                      </p>
                      <p className="text-xs text-primary-600 font-bold">+{attempt.earnedPoints}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quiz Selection Modal */}
      {selectedQuiz && selectedParticipant && !playing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedQuiz(null)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📝</div>
              <h3 className="text-xl font-bold text-gray-900 font-heading mb-1">{selectedQuiz.title}</h3>
              <p className="text-sm text-gray-500">{selectedQuiz.questions.length} soal • {selectedQuiz.description}</p>
            </div>
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center mb-6">
              <p className="text-sm text-primary-700 font-medium">
                Bermain sebagai: <span className="font-bold">{activeParticipants.find(p => String(p.id) === String(selectedParticipant))?.nama}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedQuiz(null)} className="bocil-btn-secondary flex-1">Batal</button>
              <button onClick={() => setPlaying(true)} className="bocil-btn-primary flex-1">Mulai! 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
