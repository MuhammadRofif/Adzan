import React, { useState } from 'react';
import { BookOpen, Plus, Play, Eye, Trash2, ToggleLeft, ToggleRight, ChevronRight, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge, SectionHeader, Input, Select, ConfirmDialog, EmptyState } from '../components/ui/index';
import { ChessQuizBoard, ChessPlayer } from '../components/ui/ChessQuizBoard';
import { Quiz, QuizQuestion } from '../../shared/types';
import { cn } from '../utils/cn';

// ─── Quiz Player ──────────────────────────────────────────────────────────────
const QuizPlayer: React.FC<{ quiz: Quiz; participantId: string; onDone: (score: number, pts: number) => void; onClose: () => void }> = ({ quiz, participantId, onDone, onClose }) => {
  const { submitQuiz } = useApp();
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; earnedPoints: number } | null>(null);
  const [step, setStep] = useState(0);

  const handleAnswer = (optIdx: number) => {
    if (submitted) return;
    const a = [...answers]; a[step] = optIdx; setAnswers(a);
  };

  const handleSubmit = async () => {
    const finalAnswers = answers.map(a => a ?? 0);
    const res = await submitQuiz(participantId, quiz.id, finalAnswers);
    setResult(res); setSubmitted(true); onDone(res.score, res.earnedPoints);
  };

  const allAnswered = answers.every(a => a !== null);
  const q = quiz.questions[step];

  if (submitted && result) {
    return (
      <div className="text-center py-4">
        <div className={cn('w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center', result.score >= 70 ? 'bg-emerald-100' : 'bg-red-100')}>
          {result.score >= 70 ? <CheckCircle className="w-10 h-10 text-emerald-500" /> : <XCircle className="w-10 h-10 text-red-500" />}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 font-heading mb-1">Skor: {result.score}%</h3>
        <p className="text-gray-500 mb-4">Kamu mendapat <span className="font-bold text-primary-600">+{result.earnedPoints} poin</span></p>
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-4">
          {quiz.questions.map((q2, i) => {
            const isCorrect = answers[i] === q2.correctAnswer;
            return (
              <div key={i} className={cn('flex items-start gap-2 py-2 text-sm', i > 0 && 'border-t border-gray-200')}>
                {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="font-medium text-gray-700">{q2.text}</p>
                  {!isCorrect && <p className="text-xs text-emerald-600 mt-0.5">Jawaban benar: {q2.options[q2.correctAnswer]}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={onClose} className="w-full">Selesai</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">Soal {step + 1} / {quiz.questions.length}</span>
        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <div key={i} className={cn('w-2 h-2 rounded-full', i === step ? 'bg-primary-500' : answers[i] !== null ? 'bg-primary-200' : 'bg-gray-200')} />
          ))}
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }} />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-4">{q.text}</h3>
      <div className="space-y-3 mb-6">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)}
            className={cn('w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200',
              answers[step] === i ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}>
            <span className="font-bold mr-3 text-gray-400">{String.fromCharCode(65 + i)}.</span>{opt}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        {step > 0 && <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Sebelumnya</Button>}
        {step < quiz.questions.length - 1
          ? <Button onClick={() => setStep(s => s + 1)} className="flex-1" disabled={answers[step] === null}>Selanjutnya <ChevronRight className="w-4 h-4 ml-1" /></Button>
          : <Button onClick={handleSubmit} className="flex-1" disabled={!allAnswered}>Kumpulkan Jawaban</Button>
        }
      </div>
    </div>
  );
};

// ─── Quiz Form ────────────────────────────────────────────────────────────────
const QuizForm: React.FC<{
  initialQuiz?: Quiz;
  onSave: (quiz: Omit<Quiz, 'id' | 'createdAt'> & { id?: string }) => void;
  onClose: () => void;
}> = ({ initialQuiz, onSave, onClose }) => {
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [mode, setMode] = useState<'biasa' | 'block_blast' | 'catur_duo'>(initialQuiz?.mode || 'biasa');
  const [questions, setQuestions] = useState<(Omit<QuizQuestion, 'id'> & { id?: string })[]>(
    initialQuiz?.questions.map(q => ({ id: q.id, text: q.text, options: q.options, correctAnswer: q.correctAnswer })) || 
    [{ text: '', options: ['', '', '', ''], correctAnswer: 0 }]
  );

  const addQuestion = () => setQuestions(q => [...q, { text: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  const removeQuestion = (i: number) => setQuestions(q => q.filter((_, idx) => idx !== i));
  const updateQuestion = (i: number, field: string, val: any) => setQuestions(q => q.map((q2, idx) => idx === i ? { ...q2, [field]: val } : q2));
  const updateOption = (qi: number, oi: number, val: string) => setQuestions(q => q.map((q2, idx) => idx === qi ? { ...q2, options: q2.options.map((o, oidx) => oidx === oi ? val : o) } : q2));

  const isValid = title.trim() && questions.every(q => q.text.trim() && q.options.every(o => o.trim()));

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      id: initialQuiz?.id,
      title: title.trim(),
      description: description.trim(),
      isActive: initialQuiz ? initialQuiz.isActive : true,
      questions: questions.map((q, i) => ({ ...q, id: q.id || `q_${Date.now()}_${i}` }) as QuizQuestion),
      mode
    });
    onClose();
  };

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
      <Input label="Judul Quiz" placeholder="cth: Fiqih Shalat Dasar" value={title} onChange={e => setTitle(e.target.value)} />
      <Input label="Deskripsi (opsional)" placeholder="Deskripsi singkat quiz..." value={description} onChange={e => setDescription(e.target.value)} />
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Mode Quiz</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('biasa')}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all",
              mode === 'biasa'
                ? "border-primary-500 bg-primary-50/50 text-primary-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            )}
          >
            <p className="font-bold text-sm font-heading">Mode Biasa</p>
            <p className="text-xs text-gray-400 mt-1">Soal kuis langsung muncul dan dijawab berurutan.</p>
          </button>
          <button
            type="button"
            onClick={() => setMode('block_blast')}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all",
              mode === 'block_blast'
                ? "border-primary-500 bg-primary-50/50 text-primary-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            )}
          >
            <p className="font-bold text-sm font-heading">🧩 Mode Block Blast</p>
            <p className="text-xs text-gray-400 mt-1">Main susun block terlebih dahulu, hancurkan baris untuk membuka kuis.</p>
          </button>
          <button
            type="button"
            onClick={() => setMode('catur_duo')}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all col-span-2",
              mode === 'catur_duo'
                ? "border-primary-500 bg-primary-50/50 text-primary-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            )}
          >
            <p className="font-bold text-sm font-heading">♟️ Mode Kuis Catur (Maks 4 Player)</p>
            <p className="text-xs text-gray-400 mt-1">Pemain bergerak di papan catur 7x7. Main face-to-face di satu HP (Landscape).</p>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">Soal {qi + 1}</span>
              {questions.length > 1 && <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
            </div>
            <input className="input mb-3" placeholder="Teks pertanyaan..." value={q.text} onChange={e => updateQuestion(qi, 'text', e.target.value)} />
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="radio" name={`correct_${qi}`} checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, 'correctAnswer', oi)} className="accent-primary-600 w-4 h-4 flex-shrink-0" />
                  <input className="input py-2 text-sm" placeholder={`Opsi ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">🔘 Pilih jawaban yang benar</p>
          </div>
        ))}
        <Button variant="outline" onClick={addQuestion} className="w-full" leftIcon={<Plus className="w-4 h-4" />}>Tambah Soal</Button>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} className="flex-1" disabled={!isValid}>Simpan Quiz</Button>
        <Button variant="ghost" onClick={onClose} className="flex-1">Batal</Button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const QuizPage: React.FC = () => {
  const { quizzes, quizAttempts, participants, addQuiz, updateQuiz, toggleQuizActive, deleteQuiz, addTransaction } = useApp();
  const [playModal, setPlayModal] = useState<{ quiz: Quiz; participantId: string } | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [resultModal, setResultModal] = useState<{ score: number; pts: number } | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [previewQuiz, setPreviewQuiz] = useState<string | null>(null);
  
  // Mode Select State
  const [playModeSelect, setPlayModeSelect] = useState<Quiz | null>(null);

  // Catur Duo State
  const [caturPreviewQuiz, setCaturPreviewQuiz] = useState<Quiz | null>(null);
  const [caturPlayQuiz, setCaturPlayQuiz] = useState<Quiz | null>(null);
  const [caturParticipants, setCaturParticipants] = useState<Record<ChessPlayer, { id: string, name: string, active: boolean }>>({
    p1: { id: '', name: '', active: false },
    p2: { id: '', name: '', active: false },
    p3: { id: '', name: '', active: false },
    p4: { id: '', name: '', active: false }
  });

  const getAttemptCount = (quizId: string) => quizAttempts.filter(a => a.quizId === quizId).length;
  const getAvgScore = (quizId: string) => {
    const attempts = quizAttempts.filter(a => a.quizId === quizId);
    if (!attempts.length) return null;
    return Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <SectionHeader
        title="Quiz Keislaman"
        subtitle="Kelola dan jalankan quiz untuk peserta"
        action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddModal(true)}>Buat Quiz Baru</Button>}
      />

      {quizzes.length === 0 ? (
        <EmptyState icon={<BookOpen className="w-16 h-16" />} title="Belum ada quiz" description="Buat quiz pertama untuk para peserta." action={<Button onClick={() => setAddModal(true)}>Buat Quiz</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {quizzes.map(quiz => {
            const avg = getAvgScore(quiz.id);
            const attempts = getAttemptCount(quiz.id);
            return (
              <div key={quiz.id} className="card p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={quiz.isActive ? 'active' : 'inactive'}>{quiz.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                    </div>
                    <h3 className="font-bold text-gray-900 font-heading leading-snug">{quiz.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{quiz.description}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Soal', value: quiz.questions.length },
                    { label: 'Percobaan', value: attempts },
                    { label: 'Rata Skor', value: avg !== null ? `${avg}%` : '-' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-gray-50 rounded-xl py-2">
                      <p className="text-base font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1" leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={() => setPlayModeSelect(quiz)} disabled={!quiz.isActive}>Mainkan</Button>
                  <button onClick={() => { setEditingQuiz(quiz); setAddModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-primary-600" title="Edit Quiz">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleQuizActive(quiz.id)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
                    {quiz.isActive ? <ToggleRight className="w-5 h-5 text-primary-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => setDeleteConfirm(quiz.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Attempts */}
      {quizAttempts.length > 0 && (
        <div className="card p-0 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 font-heading">Riwayat Pengerjaan Quiz</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>{['Peserta', 'Quiz', 'Skor', 'Poin Diperoleh', 'Waktu'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quizAttempts.slice(0, 10).map(attempt => {
                  const p = participants.find(p => p.id === attempt.participantId);
                  const q = quizzes.find(q => q.id === attempt.quizId);
                  return (
                    <tr key={attempt.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900">{p?.nama ?? 'Unknown'}</td>
                      <td className="px-5 py-3 text-gray-600">{q?.title ?? 'Unknown'}</td>
                      <td className="px-5 py-3">
                        <span className={cn('font-bold', attempt.score >= 70 ? 'text-emerald-600' : 'text-red-500')}>{attempt.score}%</span>
                      </td>
                      <td className="px-5 py-3 font-bold text-primary-600">+{attempt.earnedPoints}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{attempt.completedAt.toLocaleDateString('id-ID')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview / Play Select Participant Modal */}
      {previewQuiz && (
        <Modal isOpen={!!previewQuiz} onClose={() => setPreviewQuiz(null)} title="Pilih Peserta untuk Quiz" size="sm"
          footer={<>
            <Button onClick={() => { if (selectedParticipant && previewQuiz) { const q = quizzes.find(x => x.id === previewQuiz); if (q) { setPlayModal({ quiz: q, participantId: selectedParticipant }); setPreviewQuiz(null); setSelectedParticipant(''); } } }} className="w-full sm:w-auto sm:ml-3" disabled={!selectedParticipant}>Mulai Quiz</Button>
            <Button variant="ghost" onClick={() => setPreviewQuiz(null)} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
          </>}
        >
          <Select label="Nama Peserta" value={selectedParticipant} onChange={e => setSelectedParticipant(e.target.value)}>
            <option value="">Pilih peserta...</option>
            {participants.filter(p => p.status === 'aktif').map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </Select>
        </Modal>
      )}

      {/* Select Mode Modal */}
      {playModeSelect && (
        <Modal isOpen={!!playModeSelect} onClose={() => setPlayModeSelect(null)} title="Pilih Mode Bermain" size="md">
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                setPreviewQuiz(playModeSelect.id);
                setPlayModeSelect(null);
              }}
              className="p-4 rounded-xl border-2 border-gray-200 bg-white text-left hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-primary-100">
                  <span className="text-xl">📝</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Mode Biasa (Solo)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Soal muncul berurutan, dimainkan sendiri.</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setCaturPreviewQuiz(playModeSelect);
                setPlayModeSelect(null);
              }}
              className="p-4 rounded-xl border-2 border-gray-200 bg-white text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100">
                  <span className="text-xl">♟️</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Mode Kuis Catur (2-4 Player)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Bermain adu strategi di papan catur bersama teman.</p>
                </div>
              </div>
            </button>
          </div>
          <Button variant="ghost" onClick={() => setPlayModeSelect(null)} className="w-full mt-4">Batal</Button>
        </Modal>
      )}

      {/* Catur 4-Player Select Modal */}
      {caturPreviewQuiz && (
        <Modal isOpen={!!caturPreviewQuiz} onClose={() => setCaturPreviewQuiz(null)} title="Pilih Peserta (Mode Catur)" size="md"
          footer={<>
            <Button onClick={() => {
              const activeCount = Object.values(caturParticipants).filter(p => p.active).length;
              if (activeCount >= 2) {
                setCaturPlayQuiz(caturPreviewQuiz);
                setCaturPreviewQuiz(null);
              }
            }} className="w-full sm:w-auto sm:ml-3" disabled={Object.values(caturParticipants).filter(p => p.active).length < 2}>
              Mulai Battle (Min 2)
            </Button>
            <Button variant="ghost" onClick={() => setCaturPreviewQuiz(null)} className="mt-3 sm:mt-0 w-full sm:w-auto">Batal</Button>
          </>}
        >
          <div className="space-y-4">
            {(['p1', 'p2', 'p3', 'p4'] as ChessPlayer[]).map((p, idx) => (
              <div key={p} className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={caturParticipants[p].active} 
                  onChange={(e) => setCaturParticipants(prev => ({...prev, [p]: {...prev[p], active: e.target.checked}}))}
                  className="w-5 h-5 accent-primary-600 rounded"
                />
                <div className="flex-1">
                  <Select 
                    value={caturParticipants[p].id} 
                    onChange={e => {
                      const id = e.target.value;
                      const name = participants.find(x => x.id === id)?.nama || '';
                      setCaturParticipants(prev => ({...prev, [p]: { id, name, active: !!id }}));
                    }}
                    disabled={!caturParticipants[p].active}
                  >
                    <option value="">Pilih Player {idx + 1}...</option>
                    {participants.filter(pt => pt.status === 'aktif').map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.nama}</option>
                    ))}
                  </Select>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2">Centang kotak untuk mengaktifkan slot pemain. Minimal butuh 2 pemain untuk bertanding.</p>
          </div>
        </Modal>
      )}

      {/* Quiz Player Modal */}
      {playModal && (
        <Modal isOpen={!!playModal} onClose={() => setPlayModal(null)} title={playModal.quiz.title} size="lg">
          <QuizPlayer quiz={playModal.quiz} participantId={playModal.participantId}
            onDone={(score, pts) => { setResultModal({ score, pts }); setPlayModal(null); }}
            onClose={() => setPlayModal(null)} />
        </Modal>
      )}

      {/* Catur Game Full Screen Overlay */}
      {caturPlayQuiz && (
        <ChessQuizBoard 
          quiz={caturPlayQuiz}
          participants={caturParticipants}
          onFinish={(winner) => {
            setCaturPlayQuiz(null);
            if (winner !== 'draw') {
              const winnerName = caturParticipants[winner].name;
              const winnerId = caturParticipants[winner].id;
              alert(`Permainan Selesai! Pemenangnya adalah: ${winnerName} 🏆\nSelamat! ${winnerName} mendapatkan +5 Poin!`);
              
              // Memberikan poin 5 ke pemenang
              addTransaction({
                participantId: winnerId,
                adminId: 'system',
                type: "adjustment",
                points: 5,
                reason: `Menang Battle Royale Catur: ${caturPlayQuiz.title}`
              });
              
              setResultModal({ score: 100, pts: 5 });
            } else {
              alert('Permainan Seri!');
            }
          }}
          onClose={() => setCaturPlayQuiz(null)}
        />
      )}

      {/* Result */}
      {resultModal && (
        <Modal isOpen={!!resultModal} onClose={() => setResultModal(null)} title="Hasil Quiz" size="sm"
          footer={<Button onClick={() => setResultModal(null)} className="w-full">Tutup</Button>}
        >
          <div className="text-center">
            <div className={cn('w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center', resultModal.score >= 70 ? 'bg-emerald-100' : 'bg-red-100')}>
              {resultModal.score >= 70 ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <XCircle className="w-8 h-8 text-red-400" />}
            </div>
            <p className="text-3xl font-bold font-heading text-gray-900 mb-1">{resultModal.score}%</p>
            <p className="text-gray-500">Poin diperoleh: <span className="font-bold text-primary-600">+{resultModal.pts}</span></p>
          </div>
        </Modal>
      )}

      {/* Add / Edit Quiz Modal */}
      <Modal isOpen={addModal} onClose={() => { setAddModal(false); setEditingQuiz(null); }} title={editingQuiz ? "Edit Quiz" : "Buat Quiz Baru"} size="xl">
        <QuizForm initialQuiz={editingQuiz || undefined} onSave={(quiz) => {
          const { id, ...quizData } = quiz;
          if (id) {
            updateQuiz(id, quizData);
          } else {
            addQuiz(quizData);
          }
          setAddModal(false);
          setEditingQuiz(null);
        }} onClose={() => { setAddModal(false); setEditingQuiz(null); }} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) deleteQuiz(deleteConfirm); }}
        title="Hapus Quiz" message="Yakin ingin menghapus quiz ini? Data percobaan juga akan hilang." confirmText="Hapus" variant="danger" />
    </div>
  );
};
