import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from "react";
import {
  Participant,
  Transaction,
  RedeemHistory,
  QuizAttempt,
  RedeemPackage,
  Quiz,
  ParticipantStatus,
  AttendanceEntry,
  AdzanEntry,
} from "../../shared/types";
import {
  mockRedeemPackages,
  mockBudgetStatus,
} from "../services/mockData";
import { supabase } from "../services/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────────
interface AppContextType {
  // Participants
  participants: Participant[];
  addParticipant: (nama: string) => void;
  updateParticipantStatus: (id: string, status: ParticipantStatus) => void;
  updateParticipantAvatar: (id: string, url: string) => Promise<void>;
  uploadAvatar: (file: File, participantId: string) => Promise<string>;

  // Points
  points: Record<string, PointValue>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id" | "timestamp">) => void;

  // Attendance
  attendanceLog: AttendanceEntry[];
  recordAttendance: (
    participantId: string,
    prayerTime: string,
    attitude?: string,
  ) => void;

  // Adzan
  adzanLog: AdzanEntry[];
  recordAdzan: (
    participantId: string,
    prayerTime: string,
    attitude: string,
  ) => void;
  recordSholawatIqomah: (
    participantId: string,
    prayerTime: string,
    attitude: string,
  ) => void;

  // Redeem
  redeemPackages: RedeemPackage[];
  redeemHistory: RedeemHistory[];
  requestRedeem: (
    participantId: string,
    packageId: string,
  ) => Promise<{ success: boolean; message: string }>;
  processRedeem: (redeemId: string, action: "approved" | "rejected") => void;

  // Quiz
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  submitQuiz: (
    participantId: string,
    quizId: string,
    answers: number[],
  ) => Promise<{ score: number; earnedPoints: number }>;
  addQuiz: (quiz: Omit<Quiz, "id" | "createdAt">) => void;
  updateQuiz: (id: string, quiz: Omit<Quiz, "id" | "createdAt">) => void;
  toggleQuizActive: (quizId: string) => void;
  deleteQuiz: (quizId: string) => void;

  // Budget
  budgetStatus: typeof mockBudgetStatus;

  // UI Toast
  toast: { show: boolean; message: string; type: "success" | "error" | "info" };
  showToast: (message: string, type?: "success" | "error" | "info") => void;

  // Loading
  isLoading: boolean;

  // Quick Absen Global
  quickAbsen: { isOpen: boolean; type: "none" | "attendance" | "adzan" };
  setQuickAbsen: (state: {
    isOpen: boolean;
    type: "none" | "attendance" | "adzan";
  }) => void;

  // Migration
  seedDatabase: () => Promise<void>;

  // Schedule
  schedule: Record<string, Record<string, string>>;
  updateSchedule: (newSchedule: Record<string, Record<string, string>> | ((prev: Record<string, Record<string, string>>) => Record<string, Record<string, string>>)) => void;
}

type PointValue = {
  attendance: number;
  attitude: number;
  adzan: number;
  quiz: number;
  total: number;
  adzanCount: number;
  attendanceCount: number;
  quizCount: number;
  sholawatIqomahCount: number;
};

type BudgetStatus = {
  totalBudget: number;
  usedBudget: number;
  usagePercent: number;
  warning: boolean;
  month: string;
};

const emptyPointValue = (): PointValue => ({
  attendance: 0,
  attitude: 0,
  adzan: 0,
  quiz: 0,
  total: 0,
  adzanCount: 0,
  attendanceCount: 0,
  quizCount: 0,
  sholawatIqomahCount: 0,
});

// ─── Context ──────────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_SCHEDULE: Record<string, Record<string, string>> = {
  "Senin": { "Shubuh": "Atha", "Zhuhur": "Radit", "Ashar": "Irwan", "Magrib": "Adriza", "Isya": "Ozi" },
  "Selasa": { "Shubuh": "Hafi", "Zhuhur": "Iqbal", "Ashar": "Ozi", "Magrib": "Adriza", "Isya": "Rega" },
  "Rabu": { "Shubuh": "Rega", "Zhuhur": "Adit", "Ashar": "Deden", "Magrib": "Hafi", "Isya": "Akmal" },
  "Kamis": { "Shubuh": "Atha", "Zhuhur": "Iqbal Adek Akmal", "Ashar": "Nail", "Magrib": "Saka", "Isya": "Rizky" },
  "Jum'at": { "Shubuh": "Hafi", "Zhuhur": "LOCKED", "Ashar": "Radit", "Magrib": "Hafi", "Isya": "Akmal" },
  "Sabtu": { "Shubuh": "Rega", "Zhuhur": "Irwan", "Ashar": "Deden", "Magrib": "Rega", "Isya": "Adriza" },
  "Minggu": { "Shubuh": "Atha", "Zhuhur": "Iqbal", "Ashar": "Nail", "Magrib": "Saka", "Isya": "Hafi" }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [schedule, setScheduleState] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem('bocil_adzan_schedule');
    const base = saved ? JSON.parse(saved) : DEFAULT_SCHEDULE;
    const SHUBUH_ROTATION = ["Atha", "Hafi", "Rega"];
    const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"];
    DAYS.forEach((day, dayIndex) => {
      if (!base[day]) base[day] = {};
      if (!base[day]["Shubuh"] || base[day]["Shubuh"] === "Kosong") {
        base[day]["Shubuh"] = SHUBUH_ROTATION[dayIndex % 3];
      }
    });
    return base;
  });

  const updateSchedule = useCallback((newSchedule: Record<string, Record<string, string>> | ((prev: Record<string, Record<string, string>>) => Record<string, Record<string, string>>)) => {
    setScheduleState(prev => {
      const updated = typeof newSchedule === 'function' ? newSchedule(prev) : newSchedule;
      localStorage.setItem('bocil_adzan_schedule', JSON.stringify(updated));
      return updated;
    });
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [points, setPoints] = useState<Record<string, PointValue>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [attendanceLog, setAttendanceLog] = useState<AttendanceEntry[]>([]);
  const [adzanLog, setAdzanLog] = useState<AdzanEntry[]>([]);
  const [redeemPackages, setRedeemPackages] = useState<RedeemPackage[]>(mockRedeemPackages);
  const [redeemHistory, setRedeemHistory] = useState<RedeemHistory[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>(mockBudgetStatus);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "success" });
  const [quickAbsen, setQuickAbsen] = useState<{
    isOpen: boolean;
    type: "none" | "attendance" | "adzan";
  }>({ isOpen: false, type: "none" });

  // ─── Initial Load ───────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: pData },
        { data: tData },
        { data: attData },
        { data: adzData },
        { data: rpData },
        { data: rhData },
        { data: qData },
        { data: qaData },
        { data: bData },
      ] = await Promise.all([
        supabase.from("participants").select("*").order("nama"),
        supabase.from("transactions").select("*").order("timestamp", { ascending: false }),
        supabase.from("attendance_log").select("*").order("date", { ascending: false }),
        supabase.from("adzan_log").select("*").order("date", { ascending: false }),
        supabase.from("redeem_packages").select("*").order("points_required"),
        supabase.from("redeem_history").select("*").order("requested_at", { ascending: false }),
        supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
        supabase.from("quiz_attempts").select("*").order("completed_at", { ascending: false }),
        supabase.from("budget_settings").select("*").limit(1),
      ]);

      const mappedParticipants = (pData || []).map((p: any) => ({
        id: p.id,
        nama: p.nama,
        status: p.status,
        avatar_url: p.avatar_url,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      }));

      const mappedTransactions = (tData || []).map((t: any) => ({
        id: t.id,
        participantId: t.participant_id,
        type: t.type,
        points: t.points,
        reason: t.reason,
        timestamp: new Date(t.timestamp),
        adminId: t.admin_id
      }));

      const mappedAttendance = (attData || []).map((a: any) => ({
        id: a.id,
        participantId: a.participant_id,
        participantName: mappedParticipants.find((p: any) => p.id === a.participant_id)?.nama || 'Unknown',
        prayerTime: a.prayer_time,
        date: a.date,
        points: a.points
      }));

      const mappedAdzan = (adzData || []).map((a: any) => ({
        id: a.id,
        participantId: a.participant_id,
        participantName: mappedParticipants.find((p: any) => p.id === a.participant_id)?.nama || 'Unknown',
        prayerTime: a.prayer_time,
        attitude: a.attitude,
        attitudePoints: a.attitude_points,
        adzanPoints: a.adzan_points,
        total: a.total,
        date: a.date
      }));

      const mappedRedeemHistory = (rhData || []).map((r: any) => ({
        id: r.id,
        participantId: r.participant_id,
        packageId: r.package_id,
        packageName: r.package_name,
        pointsSpent: r.points_spent,
        status: r.status,
        requestedAt: new Date(r.requested_at),
        processedAt: r.processed_at ? new Date(r.processed_at) : undefined,
        processedBy: r.processed_by
      }));

      const mappedQuizzes = (qData || []).map((q: any) => {
        const rawDesc = q.description || "";
        const hasEmbedMode = rawDesc.includes("||mode:");
        const mode = q.mode || (hasEmbedMode ? rawDesc.split("||mode:")[1].trim() : 'biasa');
        const description = hasEmbedMode ? rawDesc.split("||mode:")[0].trim() : rawDesc;
        return {
          id: q.id,
          title: q.title,
          description: description,
          questions: q.questions,
          createdAt: new Date(q.created_at),
          isActive: q.is_active,
          mode: mode as 'biasa' | 'block_blast'
        };
      });

      const mappedQuizAttempts = (qaData || []).map((qa: any) => ({
        id: qa.id,
        participantId: qa.participant_id,
        quizId: qa.quiz_id,
        score: qa.score,
        earnedPoints: qa.earned_points,
        answers: qa.answers,
        completedAt: new Date(qa.completed_at)
      }));

      setParticipants(mappedParticipants);
      setTransactions(mappedTransactions);
      setAttendanceLog(mappedAttendance);
      setAdzanLog(mappedAdzan);
      setRedeemHistory(mappedRedeemHistory);
      setQuizzes(mappedQuizzes);
      setQuizAttempts(mappedQuizAttempts);

      if (rpData) {
        setRedeemPackages(rpData.map((rp: any) => ({
          id: rp.id,
          name: rp.name,
          description: rp.description,
          pointsRequired: rp.points_required,
          diamond: rp.diamond,
          weeklyQuota: rp.weekly_quota,
          remainingQuota: rp.weekly_quota, // Simplified
          budgetCost: rp.budget_cost,
          isAvailable: rp.is_available
        })));
      }

      // Aggregating points
      const pointMap: Record<string, PointValue> = {};
      mappedParticipants.forEach((p: any) => { pointMap[p.id] = emptyPointValue(); });
      
      mappedTransactions.forEach((t: any) => {
        if (!pointMap[t.participantId]) pointMap[t.participantId] = emptyPointValue();
        const p = pointMap[t.participantId];
        if (t.type === 'attendance') p.attendance += t.points;
        if (t.type === 'adzan') p.adzan += t.points;
        if (t.type === 'quiz') p.quiz += t.points;
        p.total += t.points;
      });

      mappedAttendance.forEach((a: any) => {
        if (pointMap[a.participantId]) pointMap[a.participantId].attendanceCount++;
      });

      mappedAdzan.forEach((a: any) => {
        if (pointMap[a.participantId]) {
          if (a.adzanPoints === 8) {
            pointMap[a.participantId].sholawatIqomahCount++;
          } else {
            pointMap[a.participantId].adzanCount++;
          }
        }
      });

      mappedQuizAttempts.forEach((qa: any) => {
        if (pointMap[qa.participantId]) pointMap[qa.participantId].quizCount++;
      });

      setPoints(pointMap);

      if (bData && bData[0]) {
        const usedBudget = mappedRedeemHistory.filter((r: any) => r.status === 'approved')
          .reduce((sum: number, r: any) => {
            const pkg = rpData?.find((pkg: any) => pkg.id === r.packageId);
            return sum + (pkg?.budget_cost ?? 0);
          }, 0);
        
        setBudgetStatus({
          totalBudget: bData[0].total_budget,
          usedBudget,
          usagePercent: Math.round((usedBudget / bData[0].total_budget) * 100),
          warning: (usedBudget / bData[0].total_budget) >= 0.8,
          month: bData[0].month,
        });
      }

    } catch (error) {
      console.error("Error loading data from Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ─── Realtime Subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        loadAllData(); // Refresh on any change for consistency
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAllData]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    },
    [],
  );

  const addTransaction = useCallback(
    async (t: Omit<Transaction, "id" | "timestamp">) => {
      const { error } = await supabase.from("transactions").insert([
        { 
          participant_id: t.participantId,
          type: t.type,
          points: t.points,
          reason: t.reason,
          admin_id: t.adminId
        }
      ]);
      if (error) console.error("Error adding transaction:", error);
    },
    [],
  );

  const addParticipant = useCallback(
    async (nama: string) => {
      const { error } = await supabase.from("participants").insert([{ nama }]);
      if (error) {
        showToast("Gagal menambah peserta", "error");
        return;
      }
      showToast(`Peserta "${nama}" berhasil ditambahkan.`);
      loadAllData();
    },
    [showToast, loadAllData],
  );

  const updateParticipantStatus = useCallback(
    async (id: string | number, status: ParticipantStatus) => {
      const { error } = await supabase.from("participants").update({ status, updated_at: new Date() }).eq("id", id);
      if (error) {
        showToast("Gagal update status", "error");
        return;
      }
      showToast("Status peserta berhasil diperbarui.");
      loadAllData();
    },
    [showToast, loadAllData],
  );

  const recordAttendance = useCallback(
    async (participantId: string | number, prayerTime: string, attitude: string = "Bagus") => {
      const participant = participants.find((p) => String(p.id) === String(participantId));
      if (!participant) return;

      const attitudePointsMap: Record<string, number> = {
        Bagus: 5,
        "Cukup Bagus": 3,
        Ribut: 1,
      };
      const pointsToAdd = attitudePointsMap[attitude] ?? 5;

      const { error } = await supabase.from("attendance_log").insert([{
        participant_id: participantId,
        prayer_time: prayerTime,
        points: pointsToAdd,
        date: new Date().toISOString().split("T")[0]
      }]);

      if (error) {
        showToast("Gagal mencatat latihan", "error");
        return;
      }

      const reason = `Latihan${prayerTime ? ` ${prayerTime}` : ""} - Sikap: ${attitude}`;
      await addTransaction({
        participantId: String(participantId),
        type: "attendance",
        points: pointsToAdd,
        reason,
        adminId: "admin",
      });
      showToast(`Latihan ${participant.nama} berhasil dicatat (+${pointsToAdd} poin).`);
      loadAllData();
    },
    [participants, addTransaction, showToast, loadAllData],
  );

  const recordAdzan = useCallback(
    async (participantId: string | number, prayerTime: string, attitude: string) => {
      const participant = participants.find((p) => String(p.id) === String(participantId));
      if (!participant) return;
      
      const totalPoints = 10;
      const { error } = await supabase.from("adzan_log").insert([{
        participant_id: participantId,
        prayer_time: prayerTime,
        attitude: attitude,
        attitude_points: 0,
        adzan_points: 10,
        total: totalPoints,
        date: new Date().toISOString().split("T")[0]
      }]);

      if (error) {
        showToast("Gagal mencatat adzan", "error");
        return;
      }

      const reason = `Adzan${prayerTime ? ` ${prayerTime}` : ""} - Sikap: ${attitude}`;
      await addTransaction({
        participantId: String(participantId),
        type: "adzan",
        points: totalPoints,
        reason,
        adminId: "admin",
      });
      showToast(`Adzan ${participant.nama} berhasil dicatat (+10 poin).`);
      loadAllData();
    },
    [participants, addTransaction, showToast, loadAllData],
  );

  const recordSholawatIqomah = useCallback(
    async (participantId: string | number, prayerTime: string, attitude: string) => {
      const participant = participants.find((p) => String(p.id) === String(participantId));
      if (!participant) return;
      
      const totalPoints = 8;
      const { error } = await supabase.from("adzan_log").insert([{
        participant_id: participantId,
        prayer_time: prayerTime,
        attitude: attitude,
        attitude_points: 0,
        adzan_points: 8,
        total: totalPoints,
        date: new Date().toISOString().split("T")[0]
      }]);

      if (error) {
        showToast("Gagal mencatat sholawat + iqomah", "error");
        return;
      }

      const reason = `Sholawat + Iqomah${prayerTime ? ` ${prayerTime}` : ""} - Sikap: ${attitude}`;
      await addTransaction({
        participantId: String(participantId),
        type: "adzan",
        points: totalPoints,
        reason,
        adminId: "admin",
      });
      showToast(`Sholawat + Iqomah ${participant.nama} berhasil dicatat (+8 poin).`);
      loadAllData();
    },
    [participants, addTransaction, showToast, loadAllData],
  );

  const requestRedeem = useCallback(
    async (participantId: string | number, packageId: string | number) => {
      const pkg = redeemPackages.find((p) => String(p.id) === String(packageId));
      const participant = participants.find((p) => String(p.id) === String(participantId));
      if (!pkg || !participant)
        return { success: false, message: "Data tidak ditemukan." };
      
      const participantPoints = points[String(participantId)]?.total ?? 0;
      if (participantPoints < pkg.pointsRequired)
        return { success: false, message: "Poin tidak mencukupi." };
      
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);

      const thisWeekRedeems = redeemHistory.filter(
        (r) =>
          String(r.participantId) === String(participantId) &&
          String(r.packageId) === String(packageId) &&
          r.status !== "rejected" &&
          new Date(r.requestedAt) >= startOfWeek
      ).length;
      
      if (thisWeekRedeems >= pkg.weeklyQuota)
        return { success: false, message: "Kuota redeem mingguan kamu sudah habis. Coba lagi minggu depan!" };
      
      if (budgetStatus.usedBudget + pkg.budgetCost > budgetStatus.totalBudget)
        return { success: false, message: "Budget bulan ini sudah habis." };

      const { error } = await supabase.from("redeem_history").insert([{
        participant_id: participantId,
        package_id: packageId,
        package_name: pkg.name,
        points_spent: pkg.pointsRequired,
        status: "pending"
      }]);

      if (error) return { success: false, message: "Gagal mengirim permintaan redeem." };

      showToast(`Permintaan redeem "${pkg.name}" berhasil dikirim!`);
      await loadAllData();
      return { success: true, message: "Permintaan redeem berhasil dikirim." };
    },
    [redeemPackages, participants, points, redeemHistory, budgetStatus, showToast, loadAllData],
  );

  const processRedeem = useCallback(
    async (redeemId: string | number, action: "approved" | "rejected") => {
      const r = redeemHistory.find(item => String(item.id) === String(redeemId));
      if (!r || r.status !== 'pending') return;

      const { error } = await supabase.from("redeem_history").update({
        status: action,
        processed_at: new Date(),
        processed_by: "admin"
      }).eq("id", redeemId);

      if (error) {
        showToast("Gagal memproses redeem", "error");
        return;
      }

      if (action === "approved") {
        await addTransaction({
          participantId: String(r.participantId),
          type: "redeem",
          points: -r.pointsSpent,
          reason: `Redeem: ${r.packageName}`,
          adminId: "admin",
        });
      }

      showToast(`Permintaan redeem berhasil ${action === "approved" ? "disetujui" : "ditolak"}.`);
      await loadAllData();
    },
    [redeemHistory, addTransaction, showToast, loadAllData],
  );

  const submitQuiz = useCallback(
    async (participantId: string | number, quizId: string | number, answers: number[]) => {
      const quiz = quizzes.find((q) => String(q.id) === String(quizId));
      if (!quiz) return { score: 0, earnedPoints: 0 };
      
      let correct = 0;
      answers.forEach((ans, i) => {
        if (quiz.questions[i]?.correctAnswer === ans) correct++;
      });
      const score = Math.round((correct / quiz.questions.length) * 100);
      const earnedPoints = correct;

      // Use local date for "today" to avoid UTC rollover issues
      const today = new Date().toLocaleDateString('en-CA');
      
      // Logic: Points can be earned incrementally up to the maximum correct answers for today.
      const pointsEarnedToday = quizAttempts
        .filter(
          (a) =>
            String(a.participantId) === String(participantId) &&
            String(a.quizId) === String(quizId) &&
            new Date(a.completedAt).toLocaleDateString('en-CA') === today
        )
        .reduce((sum, a) => sum + (a.earnedPoints || 0), 0);

      const finalEarnedPoints = Math.max(0, earnedPoints - pointsEarnedToday);

      const { error } = await supabase.from("quiz_attempts").insert([{
        participant_id: participantId,
        quiz_id: quizId,
        score,
        earned_points: finalEarnedPoints,
        answers,
        completed_at: new Date()
      }]);

      if (error) {
        showToast("Gagal menyimpan hasil quiz", "error");
        return { score, earnedPoints: 0 };
      }

      if (finalEarnedPoints > 0) {
        await addTransaction({
          participantId: String(participantId),
          type: "quiz",
          points: finalEarnedPoints,
          reason: `Quiz: ${quiz.title} - Skor: ${score}%`,
          adminId: "system",
        });
      } else if (earnedPoints > 0 && pointsEarnedToday > 0) {
        if (pointsEarnedToday >= quiz.questions.length) {
          showToast("Kamu sudah mendapatkan poin maksimal untuk kuis ini hari ini!", "info");
        } else {
          showToast("Terus tingkatkan benarmu untuk mendapat sisa poin!", "info");
        }
      }

      await loadAllData();
      return { score, earnedPoints: finalEarnedPoints };
    },
    [quizzes, quizAttempts, addTransaction, showToast, loadAllData],
  );

  const addQuiz = useCallback(
    async (quiz: Omit<Quiz, "id" | "createdAt">) => {
      const finalMode = quiz.mode || 'biasa';
      const { error } = await supabase.from("quizzes").insert([{
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        is_active: quiz.isActive,
        mode: finalMode
      }]);
      
      if (error) {
        // Fallback: store mode in description
        const fallbackDescription = `${quiz.description} ||mode:${finalMode}`;
        const { error: fallbackError } = await supabase.from("quizzes").insert([{
          title: quiz.title,
          description: fallbackDescription,
          questions: quiz.questions,
          is_active: quiz.isActive
        }]);
        
        if (fallbackError) {
          showToast("Gagal menambah kuis", "error");
        } else {
          showToast(`Kuis "${quiz.title}" berhasil ditambahkan.`);
          loadAllData();
        }
      } else {
        showToast(`Kuis "${quiz.title}" berhasil ditambahkan.`);
        loadAllData();
      }
    },
    [showToast, loadAllData],
  );

  const updateQuiz = useCallback(
    async (id: string, quiz: Omit<Quiz, "id" | "createdAt">) => {
      const finalMode = quiz.mode || 'biasa';
      const { error } = await supabase.from("quizzes").update({
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        is_active: quiz.isActive,
        mode: finalMode
      }).eq("id", id);
      
      if (error) {
        // Fallback: store mode in description
        const fallbackDescription = `${quiz.description} ||mode:${finalMode}`;
        const { error: fallbackError } = await supabase.from("quizzes").update({
          title: quiz.title,
          description: fallbackDescription,
          questions: quiz.questions,
          is_active: quiz.isActive
        }).eq("id", id);
        
        if (fallbackError) {
          showToast("Gagal memperbarui kuis", "error");
        } else {
          showToast(`Kuis "${quiz.title}" berhasil diperbarui.`);
          loadAllData();
        }
      } else {
        showToast(`Kuis "${quiz.title}" berhasil diperbarui.`);
        loadAllData();
      }
    },
    [showToast, loadAllData],
  );

  const toggleQuizActive = useCallback(async (quizId: string | number) => {
    const q = quizzes.find(item => String(item.id) === String(quizId));
    if (!q) return;
    const { error } = await supabase.from("quizzes").update({ is_active: !q.isActive }).eq("id", quizId);
    if (!error) loadAllData();
  }, [quizzes, loadAllData]);

  const deleteQuiz = useCallback(
    async (quizId: string | number) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
      if (error) showToast("Gagal menghapus quiz", "error");
      else {
        showToast("Quiz berhasil dihapus.", "info");
        loadAllData();
      }
    },
    [showToast, loadAllData],
  );

  const uploadAvatar = useCallback(async (file: File, participantId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${participantId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      showToast("Gagal mengupload foto", "error");
      throw error;
    }
  }, [showToast]);

  const updateParticipantAvatar = useCallback(async (id: string, url: string) => {
    const { error } = await supabase.from("participants").update({ avatar_url: url }).eq("id", id);
    if (error) {
      showToast("Gagal memperbarui foto profil", "error");
    } else {
      showToast("Foto profil berhasil diperbarui", "success");
      loadAllData();
    }
  }, [showToast, loadAllData]);

  const seedDatabase = useCallback(async () => {
    setIsLoading(true);
    try {
      showToast("Sedang memindahkan data ke Supabase...", "info");
      
      // Import mock data dynamically to avoid clutter
      const { 
        mockParticipants, 
        mockQuizzes, 
        mockRedeemPackages, 
        mockBudgetStatus 
      } = await import("../services/mockData");

      // 1. Seed Participants
      await supabase.from("participants").insert(
        mockParticipants.map(p => ({ nama: p.nama, status: p.status }))
      );

      // 2. Seed Packages
      await supabase.from("redeem_packages").insert(
        mockRedeemPackages.map(rp => ({
          name: rp.name,
          description: rp.description,
          points_required: rp.pointsRequired,
          diamond: rp.diamond,
          weekly_quota: rp.weeklyQuota,
          budget_cost: rp.budgetCost,
          is_available: rp.isAvailable
        }))
      );

      // 3. Seed Quizzes
      await supabase.from("quizzes").insert(
        mockQuizzes.map(q => ({
          title: q.title,
          description: q.description,
          questions: q.questions,
          is_active: q.isActive
        }))
      );

      // 4. Seed Budget
      await supabase.from("budget_settings").insert([{
        month: mockBudgetStatus.month,
        total_budget: mockBudgetStatus.totalBudget
      }]);

      showToast("Berhasil memindahkan data! Silakan refresh halaman.", "success");
      loadAllData();
    } catch (error) {
      console.error("Seeding error:", error);
      showToast("Gagal memindahkan data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [loadAllData, showToast]);

  const contextValue = useMemo(() => ({
    participants,
    addParticipant,
    updateParticipantStatus,
    points,
    transactions,
    addTransaction,
    attendanceLog,
    recordAttendance,
    adzanLog,
    recordAdzan,
    recordSholawatIqomah,
    redeemPackages,
    redeemHistory,
    requestRedeem,
    processRedeem,
    quizzes,
    quizAttempts,
    submitQuiz,
    addQuiz,
    updateQuiz,
    toggleQuizActive,
    deleteQuiz,
    budgetStatus,
    toast,
    showToast,
    isLoading,
    quickAbsen,
    setQuickAbsen,
    seedDatabase,
    uploadAvatar,
    updateParticipantAvatar,
    schedule,
    updateSchedule,
  }), [
    participants, addParticipant, updateParticipantStatus, points,
    transactions, addTransaction, attendanceLog, recordAttendance,
    adzanLog, recordAdzan, recordSholawatIqomah, redeemPackages,
    redeemHistory, requestRedeem, processRedeem, quizzes, quizAttempts,
    submitQuiz, addQuiz, updateQuiz, toggleQuizActive, deleteQuiz,
    budgetStatus, toast, showToast, isLoading, quickAbsen, setQuickAbsen,
    seedDatabase, uploadAvatar, updateParticipantAvatar, schedule, updateSchedule,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
