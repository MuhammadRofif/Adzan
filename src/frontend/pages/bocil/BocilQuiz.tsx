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

  return (
    <div className="bocil-page">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading mb-2">
          📖 Quiz Keislaman
        </h1>
        <p className="text-gray-500 text-base sm:text-lg">Uji pengetahuan kamu dan dapatkan poin tambahan!</p>
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
            const attempts = getAttemptCount(quiz.id);
            return (
              <div key={quiz.id} className="bocil-quiz-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-4xl mb-3">
                  {i === 0 ? '🕌' : i === 1 ? '📿' : '📚'}
                </div>
                <h3 className="font-bold text-gray-900 font-heading text-lg mb-1">{quiz.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-xl py-2 text-center">
                    <p className="text-base font-extrabold text-gray-800">{quiz.questions.length}</p>
                    <p className="text-[10px] text-gray-500">Soal</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2 text-center">
                    <p className="text-base font-extrabold text-gray-800">{attempts}</p>
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
                    selectedParticipant
                      ? 'bocil-btn-primary'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {selectedParticipant ? 'Mulai Quiz 🚀' : 'Pilih nama dulu 👆'}
                </button>
              </div>
            );
          })}
        </div>
      )}

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
                Bermain sebagai: <span className="font-bold">{activeParticipants.find(p => p.id === selectedParticipant)?.nama}</span>
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
