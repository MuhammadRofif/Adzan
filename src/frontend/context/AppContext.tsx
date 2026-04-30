import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  Participant, Transaction, RedeemHistory, QuizAttempt, RedeemPackage, Quiz, ParticipantStatus,
} from '../../shared/types';
import {
  mockParticipants, mockPoints, mockTransactions,
  mockRedeemHistory, mockQuizAttempts, mockRedeemPackages, mockQuizzes, mockBudgetStatus,
  mockAttendanceLog, mockAdzanLog,
} from '../services/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────────
interface AppContextType {
  // Participants
  participants: Participant[];
  addParticipant: (nama: string) => void;
  updateParticipantStatus: (id: string, status: ParticipantStatus) => void;

  // Points
  points: typeof mockPoints;

  // Transactions
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'timestamp'>) => void;

  // Attendance
  attendanceLog: typeof mockAttendanceLog;
  recordAttendance: (participantId: string, prayerTime: string, attitude?: string) => void;

  // Adzan
  adzanLog: typeof mockAdzanLog;
  recordAdzan: (participantId: string, prayerTime: string, attitude: string) => void;

  // Redeem
  redeemPackages: RedeemPackage[];
  redeemHistory: RedeemHistory[];
  requestRedeem: (participantId: string, packageId: string) => { success: boolean; message: string };
  processRedeem: (redeemId: string, action: 'approved' | 'rejected') => void;

  // Quiz
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  submitQuiz: (participantId: string, quizId: string, answers: number[]) => { score: number; earnedPoints: number };
  addQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => void;
  toggleQuizActive: (quizId: string) => void;
  deleteQuiz: (quizId: string) => void;

  // Budget
  budgetStatus: typeof mockBudgetStatus;

  // UI Toast
  toast: { show: boolean; message: string; type: 'success' | 'error' | 'info' };
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  
  // Quick Absen Global
  quickAbsen: { isOpen: boolean; type: 'none' | 'attendance' | 'adzan' };
  setQuickAbsen: (state: { isOpen: boolean; type: 'none' | 'attendance' | 'adzan' }) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ─── Persistence ─────────────────────────────────────────────────────────────
  const loadFromStorage = (key: string, fallback: any) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  };

  const [participants, setParticipants] = useState<Participant[]>(() => loadFromStorage('adzan_participants', mockParticipants));
  const [points, setPoints] = useState(() => loadFromStorage('adzan_points', mockPoints));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage('adzan_transactions', mockTransactions));
  const [attendanceLog, setAttendanceLog] = useState(() => loadFromStorage('adzan_attendance_log', mockAttendanceLog));
  const [adzanLog, setAdzanLog] = useState(() => loadFromStorage('adzan_adzan_log', mockAdzanLog));
  const [redeemPackages] = useState<RedeemPackage[]>(mockRedeemPackages);
  const [redeemHistory, setRedeemHistory] = useState<RedeemHistory[]>(() => loadFromStorage('adzan_redeem_history', mockRedeemHistory));
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => loadFromStorage('adzan_quizzes', mockQuizzes));
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => loadFromStorage('adzan_quiz_attempts', mockQuizAttempts));
  const [budgetStatus, setBudgetStatus] = useState(() => loadFromStorage('adzan_budget', mockBudgetStatus));
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });
  const [quickAbsen, setQuickAbsen] = useState<{ isOpen: boolean; type: 'none' | 'attendance' | 'adzan' }>({ isOpen: false, type: 'none' });

  // Save to storage
  useEffect(() => localStorage.setItem('adzan_participants', JSON.stringify(participants)), [participants]);
  useEffect(() => localStorage.setItem('adzan_points', JSON.stringify(points)), [points]);
  useEffect(() => localStorage.setItem('adzan_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('adzan_attendance_log', JSON.stringify(attendanceLog)), [attendanceLog]);
  useEffect(() => localStorage.setItem('adzan_adzan_log', JSON.stringify(adzanLog)), [adzanLog]);
  useEffect(() => localStorage.setItem('adzan_redeem_history', JSON.stringify(redeemHistory)), [redeemHistory]);
  useEffect(() => localStorage.setItem('adzan_quizzes', JSON.stringify(quizzes)), [quizzes]);
  useEffect(() => localStorage.setItem('adzan_quiz_attempts', JSON.stringify(quizAttempts)), [quizAttempts]);
  useEffect(() => localStorage.setItem('adzan_budget', JSON.stringify(budgetStatus)), [budgetStatus]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev: any) => ({ ...prev, show: false })), 3000);
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'timestamp'>) => {
    const tx: Transaction = { ...t, id: `t${Date.now()}`, timestamp: new Date() };
    setTransactions(prev => [tx, ...prev]);
  }, []);

  const addParticipant = useCallback((nama: string) => {
    const newP: Participant = {
      id: `p${Date.now()}`, nama, status: 'baru', createdAt: new Date(), updatedAt: new Date(),
    };
    setParticipants(prev => [...prev, newP]);
    setPoints(prev => ({ ...prev, [newP.id]: { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 } }));
    showToast(`Peserta "${nama}" berhasil ditambahkan.`);
  }, [showToast]);

  const updateParticipantStatus = useCallback((id: string, status: ParticipantStatus) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, status, updatedAt: new Date() } : p));
    showToast('Status peserta berhasil diperbarui.');
  }, [showToast]);

  const recordAttendance = useCallback((participantId: string, prayerTime: string, attitude: string = 'Bagus') => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    const attitudePointsMap: Record<string, number> = { 'Bagus': 5, 'Kurang Fokus': 3, 'Ribut': 0 };
    const pointsToAdd = attitudePointsMap[attitude] ?? 5;

    interface AttendanceEntry { id: string; participantId: string; participantName: string; prayerTime: string; date: string; points: number; }
    const entry: AttendanceEntry = {
      id: Math.random().toString(36).substr(2, 9),
      participantId,
      participantName: participant.nama,
      prayerTime,
      date: new Date().toISOString().split('T')[0],
      points: pointsToAdd
    };
    setAttendanceLog((prev: any) => [entry, ...prev]);
    setPoints((prev: any) => {
      const cur = prev[participantId] || { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 };
      return { ...prev, [participantId]: { ...cur, attendance: cur.attendance + pointsToAdd, attendanceCount: cur.attendanceCount + 1, total: cur.total + pointsToAdd } };
    });
    const reason = `Latihan${prayerTime ? ` ${prayerTime}` : ''} - Sikap: ${attitude}`;
    addTransaction({ participantId, type: 'attendance', points: pointsToAdd, reason, adminId: 'admin' });
    showToast(`Latihan ${participant.nama} (Sikap: ${attitude}) berhasil dicatat (+${pointsToAdd} poin).`);
  }, [participants, addTransaction, showToast]);

  const recordAdzan = useCallback((participantId: string, prayerTime: string, attitude: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;
    const attitudePointsMap: Record<string, number> = { 'Bagus': 5, 'Kurang Fokus': 3, 'Ribut': 0 };
    const attitudePoints = attitudePointsMap[attitude] ?? 0;
    const totalPoints = 10 + attitudePoints;
    const entry = {
      id: `az${Date.now()}`, participantId, participantName: participant.nama,
      prayerTime, attitude, attitudePoints, adzanPoints: 10, total: totalPoints,
      date: new Date().toISOString().split('T')[0],
    };
    setAdzanLog((prev: any) => [entry, ...prev]);
    setPoints((prev: any) => {
      const cur = prev[participantId] || { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 };
      return { ...prev, [participantId]: { ...cur, attitude: cur.attitude + attitudePoints, adzan: cur.adzan + 10, total: cur.total + totalPoints, adzanCount: cur.adzanCount + 1 } };
    });
    const reason = `Adzan${prayerTime ? ` ${prayerTime}` : ''} - Sikap: ${attitude}`;
    addTransaction({ participantId, type: 'adzan', points: totalPoints, reason, adminId: 'admin' });
    showToast(`Adzan ${participant.nama}${prayerTime ? ` untuk ${prayerTime}` : ''} (Sikap: ${attitude}) berhasil dicatat (+${totalPoints} poin).`);
  }, [participants, addTransaction, showToast]);

  const requestRedeem = useCallback((participantId: string, packageId: string) => {
    const pkg = redeemPackages.find(p => p.id === packageId);
    const participant = participants.find(p => p.id === participantId);
    if (!pkg || !participant) return { success: false, message: 'Data tidak ditemukan.' };
    const participantPoints = points[participantId]?.total ?? 0;
    if (participantPoints < pkg.pointsRequired) return { success: false, message: 'Poin tidak mencukupi.' };
    const thisWeekRedeems = redeemHistory.filter(r => r.participantId === participantId && r.packageId === packageId && r.status !== 'rejected').length;
    if (thisWeekRedeems >= pkg.weeklyQuota) return { success: false, message: 'Kuota redeem mingguan sudah habis.' };
    if (budgetStatus.usedBudget + pkg.budgetCost > budgetStatus.totalBudget) return { success: false, message: 'Budget bulan ini sudah habis.' };
    const rh: RedeemHistory = { id: `rh${Date.now()}`, participantId, packageId, packageName: pkg.name, pointsSpent: pkg.pointsRequired, status: 'pending', requestedAt: new Date() };
    setRedeemHistory((pp: any) => [rh, ...pp]);
    showToast(`Permintaan redeem "${pkg.name}" berhasil dikirim!`);
    return { success: true, message: 'Permintaan redeem berhasil dikirim.' };
  }, [redeemPackages, participants, points, redeemHistory, budgetStatus, showToast]);

  const processRedeem = useCallback((redeemId: string, action: 'approved' | 'rejected') => {
    setRedeemHistory(prev => prev.map(r => {
      if (r.id !== redeemId) return r;
      const updated = { ...r, status: action, processedAt: new Date(), processedBy: 'admin' };
      if (action === 'approved') {
        const pkg = redeemPackages.find(p => p.id === r.packageId);
        if (pkg) {
          setPoints(pp => {
            const cur = pp[r.participantId];
            return { ...pp, [r.participantId]: { ...cur, total: cur.total - r.pointsSpent } };
          });
          addTransaction({ participantId: r.participantId, type: 'redeem', points: -r.pointsSpent, reason: `Redeem: ${r.packageName}`, adminId: 'admin' });
          setBudgetStatus((bs: any) => ({ ...bs, usedBudget: bs.usedBudget + pkg.budgetCost, usagePercent: Math.round(((bs.usedBudget + pkg.budgetCost) / bs.totalBudget) * 100) }));
        }
      }
      return updated;
    }));
    showToast(`Permintaan redeem berhasil ${action === 'approved' ? 'disetujui' : 'ditolak'}.`, action === 'approved' ? 'success' : 'error');
  }, [redeemPackages, addTransaction, showToast]);

  const submitQuiz = useCallback((participantId: string, quizId: string, answers: number[]) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return { score: 0, earnedPoints: 0 };
    let correct = 0;
    answers.forEach((ans, i) => { if (quiz.questions[i]?.correctAnswer === ans) correct++; });
    const score = Math.round((correct / quiz.questions.length) * 100);
    const earnedPoints = correct;
    const attempt: QuizAttempt = { id: `qa${Date.now()}`, participantId, quizId, score, earnedPoints, answers, completedAt: new Date() };
    setQuizAttempts((prev: any) => [attempt, ...prev]);
    setPoints((prev: any) => {
      const cur = prev[participantId] || { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 };
      return { ...prev, [participantId]: { ...cur, quiz: cur.quiz + earnedPoints, total: cur.total + earnedPoints } };
    });
    addTransaction({ participantId, type: 'quiz', points: earnedPoints, reason: `Quiz: ${quiz.title} - Skor: ${score}%`, adminId: 'system' });
    return { score, earnedPoints };
  }, [quizzes, addTransaction]);

  const addQuiz = useCallback((quiz: Omit<Quiz, 'id' | 'createdAt'>) => {
    const newQuiz: Quiz = { ...quiz, id: `q${Date.now()}`, createdAt: new Date() };
    setQuizzes((prev: any) => [...prev, newQuiz]);
    showToast(`Quiz "${quiz.title}" berhasil ditambahkan.`);
  }, [showToast]);

  const toggleQuizActive = useCallback((quizId: string) => {
    setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, isActive: !q.isActive } : q));
  }, []);

  const deleteQuiz = useCallback((quizId: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    showToast('Quiz berhasil dihapus.', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      participants, addParticipant, updateParticipantStatus,
      points,
      transactions, addTransaction,
      attendanceLog, recordAttendance,
      adzanLog, recordAdzan,
      redeemPackages, redeemHistory, requestRedeem, processRedeem,
      quizzes, quizAttempts, submitQuiz, addQuiz, toggleQuizActive, deleteQuiz,
      budgetStatus,
      toast, showToast,
      quickAbsen, setQuickAbsen,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
