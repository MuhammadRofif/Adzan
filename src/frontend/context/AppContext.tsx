import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import {
  Participant,
  RedeemHistory,
  QuizAttempt,
  RedeemPackage,
  Quiz,
  ParticipantStatus,
  AttendanceEntry,
  AdzanEntry,
  Season,
  SeasonHistory,
} from "../../shared/types";
import {
  mockRedeemPackages,
  mockBudgetStatus,
} from "../services/mockData";
import { supabase } from "../services/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────────
type ActivityKind = "adzan" | "sholawat_iqomah" | "attendance";

interface AppContextType {
  // Participants
  participants: Participant[];
  addParticipant: (nama: string) => void;
  updateParticipantStatus: (id: string, status: ParticipantStatus) => void;
  updateParticipantAvatar: (id: string, url: string) => Promise<void>;
  uploadAvatar: (file: File, participantId: string) => Promise<string>;
  /** Kecilkan foto lama (bisa MB-an) jadi WebP 256px. File asli tidak dihapus. */
  optimizeAvatars: (onProgress?: (done: number, total: number) => void) => Promise<{ optimized: number; failed: number; savedBytes: number }>;

  // Points (saldo dari server: tabel point_balances)
  points: Record<string, PointValue>;
  /** true bila migrasi ledger (001) sudah terpasang di database */
  ledgerReady: boolean;

  // Attendance
  attendanceLog: AttendanceEntry[];
  recordAttendance: (
    participantId: string,
    prayerTime: string,
    attitude?: string,
    customDate?: string
  ) => void;

  // Adzan
  adzanLog: AdzanEntry[];
  recordAdzan: (
    participantId: string,
    prayerTime: string,
    attitude: string,
    customDate?: string
  ) => void;
  recordSholawatIqomah: (
    participantId: string,
    prayerTime: string,
    attitude: string,
    customDate?: string
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
    answers: (number | null)[],
  ) => Promise<{ score: number; earnedPoints: number }>;
  awardGameWin: (participantId: string, quizId: string) => Promise<number>;
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

  // Season
  activeSeason: Season | null;
  allSeasons: Season[];
  seasonHistory: SeasonHistory[];
  endSeason: (nextSeasonName: string) => Promise<{ success: boolean; message: string }>;
}

export type PointValue = {
  attendance: number;
  attitude: number;
  adzan: number;
  quiz: number;
  /** saldo season berjalan (sudah dikurangi redeem) */
  total: number;
  /** poin sepanjang masa: earned season ini + poin akhir season-season lalu */
  grossTotal: number;
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
  grossTotal: 0,
  adzanCount: 0,
  attendanceCount: 0,
  quizCount: 0,
  sholawatIqomahCount: 0,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────────
// localStorage bisa melempar error (mode privat / storage penuh) → selalu dibungkus.
const cacheGet = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const cacheSet = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* abaikan */
  }
};

const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

/** Tanggal hari ini di zona waktu perangkat, format YYYY-MM-DD. */
const localToday = () => new Date().toLocaleDateString("en-CA");

const isMissingFunction = (err: { code?: string } | null) =>
  !!err && (err.code === "PGRST202" || err.code === "42883");

const fetchAll = async <T,>(queryFactory: () => any): Promise<T[]> => {
  let all: T[] = [];
  let from = 0;
  const step = 1000;
  for (;;) {
    const { data, error } = await queryFactory().range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return all;
};

// ─── Mappers (baris DB → tipe frontend) ───────────────────────────────────────────
const mapParticipant = (p: any): Participant => ({
  id: p.id,
  nama: p.nama,
  status: p.status,
  avatar_url: p.avatar_url,
  createdAt: new Date(p.created_at),
  updatedAt: new Date(p.updated_at),
});

const mapAttendance = (a: any): AttendanceEntry => ({
  id: a.id,
  participantId: a.participant_id,
  participantName: "",
  prayerTime: a.prayer_time,
  date: a.date,
  points: a.points,
  createdAt: a.created_at ? new Date(a.created_at) : undefined,
} as AttendanceEntry);

const mapAdzan = (a: any): AdzanEntry => ({
  id: a.id,
  participantId: a.participant_id,
  participantName: "",
  prayerTime: a.prayer_time,
  attitude: a.attitude,
  attitudePoints: a.attitude_points,
  adzanPoints: a.adzan_points,
  total: a.total,
  date: a.date,
  createdAt: a.created_at ? new Date(a.created_at) : undefined,
} as AdzanEntry);

const mapRedeem = (r: any): RedeemHistory => ({
  id: r.id,
  participantId: r.participant_id,
  packageId: r.package_id,
  packageName: r.package_name,
  pointsSpent: r.points_spent,
  status: r.status,
  requestedAt: new Date(r.requested_at),
  processedAt: r.processed_at ? new Date(r.processed_at) : undefined,
  processedBy: r.processed_by,
});

const mapQuiz = (q: any): Quiz => {
  const rawDesc = q.description || "";
  const hasEmbedMode = rawDesc.includes("||mode:");
  const mode = q.mode || (hasEmbedMode ? rawDesc.split("||mode:")[1].trim() : "biasa");
  const description = hasEmbedMode ? rawDesc.split("||mode:")[0].trim() : rawDesc;
  return {
    id: q.id,
    title: q.title,
    description,
    questions: q.questions,
    createdAt: new Date(q.created_at),
    isActive: q.is_active,
    mode: mode as "biasa" | "block_blast",
  };
};

const mapQuizAttempt = (qa: any): QuizAttempt => ({
  id: qa.id,
  participantId: qa.participant_id,
  quizId: qa.quiz_id,
  score: qa.score,
  earnedPoints: qa.earned_points,
  answers: [],
  completedAt: new Date(qa.completed_at),
});

const mapPackage = (rp: any): RedeemPackage => ({
  id: rp.id,
  name: rp.name,
  description: rp.description,
  pointsRequired: rp.points_required,
  diamond: rp.diamond,
  weeklyQuota: rp.weekly_quota,
  remainingQuota: rp.weekly_quota,
  budgetCost: rp.budget_cost,
  isAvailable: rp.is_available,
});

const mapSeason = (s: any): Season => ({
  id: s.id,
  name: s.name,
  startDate: new Date(s.start_date),
  endDate: s.end_date ? new Date(s.end_date) : undefined,
  createdAt: new Date(s.created_at),
});

const mapSeasonHistory = (h: any): SeasonHistory => ({
  id: h.id,
  seasonId: h.season_id,
  participantId: h.participant_id,
  finalPoints: h.final_points,
  rank: h.rank,
  badge: h.badge,
  createdAt: new Date(h.created_at),
});

const mapPointRow = (b: any): PointValue => ({
  attendance: b.attendance_points ?? 0,
  attitude: 0,
  adzan: b.adzan_points ?? 0,
  quiz: b.quiz_points ?? 0,
  total: b.balance ?? 0,
  grossTotal: b.lifetime_points ?? b.earned ?? 0,
  adzanCount: b.adzan_count ?? 0,
  attendanceCount: b.attendance_count ?? 0,
  quizCount: b.quiz_count ?? 0,
  sholawatIqomahCount: b.sholawat_iqomah_count ?? 0,
});

/** Upsert berdasarkan id lalu urutkan — dipakai untuk payload realtime & refresh parsial. */
const upsertById = <T extends { id: any }>(list: T[], item: T, sortKey: (x: T) => number): T[] => {
  const next = list.filter((x) => String(x.id) !== String(item.id));
  next.push(item);
  return next.sort((a, b) => sortKey(b) - sortKey(a));
};
const byDate = (x: { date: string; createdAt?: Date }) =>
  x.createdAt ? x.createdAt.getTime() : new Date(x.date).getTime();

// Kolom yang benar-benar dipakai UI (hindari select("*") untuk tabel besar).
const COLS = {
  adzan: "id,participant_id,prayer_time,attitude,attitude_points,adzan_points,total,date,created_at",
  attendance: "id,participant_id,prayer_time,date,points,created_at",
  quizAttempt: "id,participant_id,quiz_id,score,earned_points,completed_at",
  redeem: "id,participant_id,package_id,package_name,points_spent,status,requested_at,processed_at,processed_by",
};

const CACHE = {
  quizzes: "adzan_cache_quizzes_v1",
  packages: "adzan_cache_packages_v1",
  points: "adzan_cache_points_v1",
};

// ─── Context ──────────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | null>(null);

// Atha nonaktif. Hafi & Rega KHUSUS Shubuh — tidak masuk slot non-Shubuh
// Non-Shubuh: setiap orang maks 2x/minggu
const SHUBUH_ONLY = ["hafi", "rega"]; // nama lowercase untuk comparasi
const DEFAULT_SCHEDULE: Record<string, Record<string, string>> = {
  "Senin":   { "Shubuh": "Hafi",  "Zhuhur": "Radit",            "Ashar": "Irwan",  "Magrib": "Adriza", "Isya": "Ozi"   },
  "Selasa":  { "Shubuh": "Rega",  "Zhuhur": "Iqbal",            "Ashar": "Ozi",    "Magrib": "Adriza", "Isya": "Akmal" }, // Rega Isya → Akmal
  "Rabu":    { "Shubuh": "Hafi",  "Zhuhur": "Adit",             "Ashar": "Kosong", "Magrib": "Abid",   "Isya": "Akmal" }, // Hafi Magrib → Abid
  "Kamis":   { "Shubuh": "Rega",  "Zhuhur": "Iqbal Adek Akmal", "Ashar": "Nail",   "Magrib": "Saka",   "Isya": "Rizky" },
  "Jum'at":  { "Shubuh": "Hafi",  "Zhuhur": "LOCKED",           "Ashar": "Radit",  "Magrib": "Farid",  "Isya": "Deny"  }, // Hafi Magrib → Farid
  "Sabtu":   { "Shubuh": "Rega",  "Zhuhur": "Irwan",            "Ashar": "Kosong", "Magrib": "Danu",   "Isya": "Rizky" }, // Rega Magrib → Danu
  "Minggu":  { "Shubuh": "Hafi",  "Zhuhur": "Iqbal",            "Ashar": "Nail",   "Magrib": "Saka",   "Isya": "Adit"  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [schedule, setScheduleState] = useState<Record<string, Record<string, string>>>(() => {
    const saved = cacheGet<Record<string, Record<string, string>>>('bocil_adzan_schedule');
    const base = saved ?? JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    // Rotasi shubuh hanya 2 orang (Atha sudah nonaktif)
    const SHUBUH_ROTATION = ["Hafi", "Rega"];
    const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"];
    DAYS.forEach((day, dayIndex) => {
      if (!base[day]) base[day] = {};
      const shubuh = base[day]["Shubuh"];
      // Isi slot kosong ATAU ganti "Atha" yang masih tersimpan di localStorage
      if (!shubuh || shubuh === "Kosong" || shubuh === "Atha") {
        base[day]["Shubuh"] = SHUBUH_ROTATION[dayIndex % 2];
      }
      // Migrasi slot yang sudah diubah (hapus nama lama dari localStorage)
      Object.keys(base[day]).forEach(prayer => {
        // Hapus nama-nama yang sudah dinonaktifkan / dihapus dari jadwal
        if (["Deden", "Rama"].includes(base[day][prayer])) {
          base[day][prayer] = "Kosong";
        }
        // Hafi & Rega HANYA boleh di Shubuh — bersihkan dari slot lain
        if (prayer !== "Shubuh" && SHUBUH_ONLY.includes(base[day][prayer]?.toLowerCase())) {
          base[day][prayer] = "Kosong";
        }
      });
      // Perbaiki distribusi: Adriza Sabtu Isya → Rizky, Minggu Isya → Adit
      if (day === "Sabtu" && base[day]["Isya"] === "Adriza") {
        base[day]["Isya"] = "Rizky";
      }
      if (day === "Minggu" && base[day]["Isya"] === "Hafi") {
        base[day]["Isya"] = "Adit";
      }
    });
    // Simpan hasil migrasi kembali ke localStorage
    cacheSet('bocil_adzan_schedule', base);
    return base;
  });
  const scheduleRowId = useRef<string | null>(null);

  const updateSchedule = useCallback((newSchedule: Record<string, Record<string, string>> | ((prev: Record<string, Record<string, string>>) => Record<string, Record<string, string>>)) => {
    setScheduleState(prev => {
      const updated = typeof newSchedule === 'function' ? newSchedule(prev) : newSchedule;
      cacheSet('bocil_adzan_schedule', updated);

      // Sinkronisasi ke Supabase (fire-and-forget agar tidak memblokir UI)
      const rowId = scheduleRowId.current;
      const req = rowId
        ? supabase.from("adzan_schedule").update({ schedule_data: updated, updated_at: new Date() }).eq("id", rowId)
        : supabase.from("adzan_schedule").insert([{ schedule_data: updated }]).select("id").single();
      Promise.resolve(req).then(({ data, error }: any) => {
        if (error) console.error("Gagal sinkronisasi jadwal ke Supabase", error);
        else if (!rowId && data?.id) scheduleRowId.current = data.id;
      });

      return updated;
    });
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [ledgerReady, setLedgerReady] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [points, setPoints] = useState<Record<string, PointValue>>(() => cacheGet(CACHE.points) ?? {});
  const [attendanceLog, setAttendanceLog] = useState<AttendanceEntry[]>([]);
  const [adzanLog, setAdzanLog] = useState<AdzanEntry[]>([]);
  const [redeemPackages, setRedeemPackages] = useState<RedeemPackage[]>(
    () => cacheGet<any[]>(CACHE.packages)?.map(mapPackage) ?? mockRedeemPackages,
  );
  const [redeemHistory, setRedeemHistory] = useState<RedeemHistory[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => cacheGet<any[]>(CACHE.quizzes)?.map(mapQuiz) ?? []);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [budgetStatus] = useState<BudgetStatus>(mockBudgetStatus);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "success" });
  const [quickAbsen, setQuickAbsen] = useState<{
    isOpen: boolean;
    type: "none" | "attendance" | "adzan";
  }>({ isOpen: false, type: "none" });

  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [seasonHistory, setSeasonHistory] = useState<SeasonHistory[]>([]);

  // Ref agar loader & handler realtime selalu membaca nilai terbaru tanpa re-subscribe.
  const seasonRef = useRef<Season | null>(null);
  const ledgerReadyRef = useRef(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(new Set<string>());

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ show: true, message, type });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    },
    [],
  );

  const seasonStartISO = () => {
    const s = seasonRef.current;
    return s ? s.startDate.toISOString() : "1970-01-01T00:00:00Z";
  };
  const seasonStartDate = () => seasonStartISO().slice(0, 10);

  // ─── Loader per bagian data ────────────────────────────────────────────────
  const loadSeasons = useCallback(async () => {
    const [{ data: seasonsData }, { data: hData }] = await Promise.all([
      supabase.from("seasons").select("*").order("start_date", { ascending: false }),
      supabase.from("season_history").select("*"),
    ]);
    if (seasonsData && seasonsData.length > 0) {
      const mapped = seasonsData.map(mapSeason);
      const current = mapped.find((s) => !s.endDate) || mapped[0];
      seasonRef.current = current;
      setActiveSeason(current);
      setAllSeasons(mapped);
    }
    if (hData) setSeasonHistory(hData.map(mapSeasonHistory));
  }, []);

  const loadParticipants = useCallback(async () => {
    const { data } = await supabase.from("participants").select("*").order("nama").limit(1000);
    if (data) setParticipants(data.map(mapParticipant));
  }, []);

  const loadAdzan = useCallback(async () => {
    const rows = await fetchAll<any>(() =>
      supabase.from("adzan_log").select(COLS.adzan).gte("date", seasonStartDate()).order("date", { ascending: false }),
    );
    setAdzanLog(rows.map(mapAdzan));
    return rows;
  }, []);

  const loadAttendance = useCallback(async () => {
    const rows = await fetchAll<any>(() =>
      supabase.from("attendance_log").select(COLS.attendance).gte("date", seasonStartDate()).order("date", { ascending: false }),
    );
    setAttendanceLog(rows.map(mapAttendance));
    return rows;
  }, []);

  const loadQuizAttempts = useCallback(async () => {
    const rows = await fetchAll<any>(() =>
      supabase.from("quiz_attempts").select(COLS.quizAttempt).gte("completed_at", seasonStartISO()).order("completed_at", { ascending: false }),
    );
    setQuizAttempts(rows.map(mapQuizAttempt));
    return rows;
  }, []);

  const loadRedeem = useCallback(async () => {
    const { data } = await supabase.from("redeem_history").select(COLS.redeem).order("requested_at", { ascending: false }).limit(500);
    if (data) setRedeemHistory(data.map(mapRedeem));
    return data ?? [];
  }, []);

  const loadQuizzes = useCallback(async () => {
    const { data } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(200);
    if (data) {
      cacheSet(CACHE.quizzes, data);
      setQuizzes(data.map(mapQuiz));
    }
  }, []);

  const loadPackages = useCallback(async () => {
    const { data } = await supabase.from("redeem_packages").select("*").order("points_required").limit(100);
    if (data) {
      cacheSet(CACHE.packages, data);
      setRedeemPackages(data.map(mapPackage));
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    const { data, error } = await supabase.from("adzan_schedule").select("*").order("updated_at", { ascending: false }).limit(1);
    if (!error && data && data.length > 0) {
      scheduleRowId.current = data[0].id;
      setScheduleState(data[0].schedule_data);
      cacheSet("bocil_adzan_schedule", data[0].schedule_data);
    }
  }, []);

  /**
   * Saldo poin. Sumber utama: view `v_participant_points` (saldo tersimpan di server).
   * Kalau migrasi belum dijalankan, hitung seperti versi lama dari log season aktif.
   */
  const loadPoints = useCallback(async (logs?: { adzan: any[]; attendance: any[]; quiz: any[]; redeem: any[] }) => {
    const { data, error } = await supabase.from("v_participant_points").select("*");
    if (!error && data) {
      ledgerReadyRef.current = true;
      setLedgerReady(true);
      const map: Record<string, PointValue> = {};
      data.forEach((row: any) => { map[String(row.participant_id)] = mapPointRow(row); });
      cacheSet(CACHE.points, map);
      setPoints(map);
      return;
    }

    // ── Fallback mode lama (sebelum migrasi 001) ──
    ledgerReadyRef.current = false;
    setLedgerReady(false);
    const src = logs ?? {
      adzan: await fetchAll<any>(() => supabase.from("adzan_log").select(COLS.adzan).gte("date", seasonStartDate())),
      attendance: await fetchAll<any>(() => supabase.from("attendance_log").select(COLS.attendance).gte("date", seasonStartDate())),
      quiz: await fetchAll<any>(() => supabase.from("quiz_attempts").select(COLS.quizAttempt).gte("completed_at", seasonStartISO())),
      redeem: (await supabase.from("redeem_history").select(COLS.redeem).eq("status", "approved")).data ?? [],
    };
    const adjustments = await fetchAll<any>(() =>
      supabase.from("transactions").select("participant_id,points,timestamp").eq("type", "adjustment").gte("timestamp", seasonStartISO()),
    );
    const map: Record<string, PointValue> = {};
    const get = (id: any) => (map[String(id)] ??= emptyPointValue());
    src.adzan.forEach((a) => {
      const p = get(a.participant_id);
      p.adzan += a.total; p.total += a.total; p.grossTotal += a.total;
      if (a.adzan_points === 8) p.sholawatIqomahCount++; else p.adzanCount++;
    });
    src.attendance.forEach((a) => {
      const p = get(a.participant_id);
      p.attendance += a.points; p.total += a.points; p.grossTotal += a.points; p.attendanceCount++;
    });
    src.quiz.forEach((q) => {
      const p = get(q.participant_id);
      p.quiz += q.earned_points || 0; p.total += q.earned_points || 0; p.grossTotal += q.earned_points || 0; p.quizCount++;
    });
    adjustments.forEach((t) => {
      const p = get(t.participant_id);
      p.total += t.points; if (t.points > 0) p.grossTotal += t.points;
    });
    src.redeem
      .filter((r) => r.status === "approved" && new Date(r.requested_at) >= new Date(seasonStartISO()))
      .forEach((r) => { get(r.participant_id).total -= r.points_spent; });
    setPoints(map);
  }, []);

  // ─── Initial Load ───────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    try {
      // Tahap 1: season dulu (filter log bergantung pada tanggal mulai season).
      await loadSeasons();
      const [, adzan, attendance, quiz, redeem] = await Promise.all([
        loadParticipants(),
        loadAdzan(),
        loadAttendance(),
        loadQuizAttempts(),
        loadRedeem(),
        loadQuizzes(),
        loadPackages(),
        loadSchedule(),
      ]);
      await loadPoints({ adzan, attendance, quiz, redeem });
    } catch (error) {
      console.error("Error loading data from Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadSeasons, loadParticipants, loadAdzan, loadAttendance, loadQuizAttempts, loadRedeem, loadQuizzes, loadPackages, loadSchedule, loadPoints]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ─── Realtime ──────────────────────────────────────────────────────────────
  // Sebelumnya: SEMUA perubahan di skema public → reload SEMUA tabel di SEMUA
  // browser (~360 KB per event per pengunjung). Sekarang: INSERT diterapkan
  // langsung dari payload; perubahan lain me-reload tabel itu saja.
  useEffect(() => {
    const timers: Record<string, ReturnType<typeof setTimeout>> = {};
    let staleWhileHidden = false;

    const debounced = (key: string, fn: () => void, ms = 800) => {
      if (timers[key]) clearTimeout(timers[key]);
      timers[key] = setTimeout(fn, ms);
    };

    const handle = (table: string, payload: any) => {
      if (document.visibilityState === "hidden") {
        staleWhileHidden = true;
        return;
      }
      const row = payload.new;
      const isInsert = payload.eventType === "INSERT" && row;
      switch (table) {
        case "point_balances":
          if (row && seasonRef.current && String(row.season_id) === String(seasonRef.current.id)) {
            // Baris saldo tidak membawa lifetime_points → ambil view lagi (kecil, ±25 baris).
            debounced("points", () => loadPoints());
          }
          break;
        case "adzan_log":
          if (isInsert) setAdzanLog((l) => upsertById(l, mapAdzan(row), byDate));
          else debounced(table, loadAdzan);
          if (!ledgerReadyRef.current) debounced("points", () => loadPoints());
          break;
        case "attendance_log":
          if (isInsert) setAttendanceLog((l) => upsertById(l, mapAttendance(row), byDate));
          else debounced(table, loadAttendance);
          if (!ledgerReadyRef.current) debounced("points", () => loadPoints());
          break;
        case "quiz_attempts":
          if (isInsert) setQuizAttempts((l) => upsertById(l, mapQuizAttempt(row), (x) => x.completedAt.getTime()));
          else debounced(table, loadQuizAttempts);
          if (!ledgerReadyRef.current) debounced("points", () => loadPoints());
          break;
        case "redeem_history":
          if (row && payload.eventType !== "DELETE") setRedeemHistory((l) => upsertById(l, mapRedeem(row), (x) => x.requestedAt.getTime()));
          else debounced(table, loadRedeem);
          break;
        case "participants":
          debounced(table, loadParticipants);
          break;
        case "quizzes":
          debounced(table, loadQuizzes);
          break;
        case "redeem_packages":
          debounced(table, loadPackages);
          break;
        case "adzan_schedule":
          debounced(table, loadSchedule);
          break;
        case "seasons":
        case "season_history":
          debounced("seasons", loadAllData, 1500);
          break;
      }
    };

    const tables = [
      "point_balances", "adzan_log", "attendance_log", "quiz_attempts", "redeem_history",
      "participants", "quizzes", "redeem_packages", "adzan_schedule", "seasons", "season_history",
    ];
    let channel = supabase.channel("app-changes");
    tables.forEach((table) => {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => handle(table, payload));
    });
    channel.subscribe();

    // Tab tidak terlihat → abaikan event; saat kembali terlihat, segarkan sekali.
    const onVisible = () => {
      if (document.visibilityState === "visible" && staleWhileHidden) {
        staleWhileHidden = false;
        loadAllData();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      Object.values(timers).forEach(clearTimeout);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [loadAllData, loadPoints, loadAdzan, loadAttendance, loadQuizAttempts, loadRedeem, loadParticipants, loadQuizzes, loadPackages, loadSchedule]);

  // ─── Mutasi ────────────────────────────────────────────────────────────────
  /** Jalankan aksi sekali saja per tanda tangan (cegah klik ganda). */
  const once = useCallback(async <T,>(signature: string, fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current.has(signature)) return undefined;
    inFlight.current.add(signature);
    try {
      return await fn();
    } finally {
      inFlight.current.delete(signature);
    }
  }, []);

  const rpcError = useCallback((error: any, fallback: string) => {
    console.error(fallback, error);
    if (isMissingFunction(error)) {
      showToast("Database belum diperbarui. Jalankan migrasi 001 di Supabase.", "error");
    } else if (error?.code === "42501") {
      showToast("Sesi admin habis / tidak berhak. Silakan login ulang.", "error");
    } else {
      showToast(error?.message ? `${fallback}: ${error.message}` : fallback, "error");
    }
  }, [showToast]);

  const recordActivity = useCallback(
    async (kind: ActivityKind, participantId: string | number, prayerTime: string, attitude: string, customDate?: string) => {
      const participant = participants.find((p) => String(p.id) === String(participantId));
      if (!participant) return;
      const date = customDate || localToday();
      const signature = `activity:${kind}:${participantId}:${prayerTime}:${date}`;
      await once(signature, async () => {
        const { data, error } = await supabase.rpc("record_activity", {
          p_participant_id: Number(participantId),
          p_kind: kind,
          p_prayer_time: prayerTime || "",
          p_attitude: attitude,
          p_date: date,
          p_idempotency_key: newIdempotencyKey(),
        });
        if (error) {
          rpcError(error, "Gagal mencatat aktivitas");
          return;
        }
        const label = kind === "adzan" ? "Adzan" : kind === "sholawat_iqomah" ? "Sholawat + Iqomah" : "Latihan";
        showToast(`${label} ${participant.nama} berhasil dicatat (+${data?.points ?? 0} poin).`);
        await Promise.all([kind === "attendance" ? loadAttendance() : loadAdzan(), loadPoints()]);
      });
    },
    [participants, once, rpcError, showToast, loadAdzan, loadAttendance, loadPoints],
  );

  const recordAttendance = useCallback(
    (participantId: string, prayerTime: string, attitude: string = "Bagus", customDate?: string) =>
      void recordActivity("attendance", participantId, prayerTime, attitude, customDate),
    [recordActivity],
  );
  const recordAdzan = useCallback(
    (participantId: string, prayerTime: string, attitude: string, customDate?: string) =>
      void recordActivity("adzan", participantId, prayerTime, attitude, customDate),
    [recordActivity],
  );
  const recordSholawatIqomah = useCallback(
    (participantId: string, prayerTime: string, attitude: string, customDate?: string) =>
      void recordActivity("sholawat_iqomah", participantId, prayerTime, attitude, customDate),
    [recordActivity],
  );

  const addParticipant = useCallback(
    async (nama: string) => {
      const { error } = await supabase.from("participants").insert([{ nama }]);
      if (error) {
        showToast("Gagal menambah peserta", "error");
        return;
      }
      showToast(`Peserta "${nama}" berhasil ditambahkan.`);
      loadParticipants();
      loadPoints();
    },
    [showToast, loadParticipants, loadPoints],
  );

  const updateParticipantStatus = useCallback(
    async (id: string | number, status: ParticipantStatus) => {
      const { error } = await supabase.from("participants").update({ status, updated_at: new Date() }).eq("id", id);
      if (error) {
        showToast("Gagal update status", "error");
        return;
      }
      showToast("Status peserta berhasil diperbarui.");
      loadParticipants();
    },
    [showToast, loadParticipants],
  );

  const requestRedeem = useCallback(
    async (participantId: string | number, packageId: string | number) => {
      const pkg = redeemPackages.find((p) => String(p.id) === String(packageId));
      if (!pkg) return { success: false, message: "Data tidak ditemukan." };

      const result = await once(`redeem:${participantId}:${packageId}`, async () => {
        const { data, error } = await supabase.rpc("request_redeem", {
          p_participant_id: Number(participantId),
          p_package_id: Number(packageId),
        });
        if (error) {
          rpcError(error, "Gagal mengirim permintaan redeem");
          return { success: false, message: "Gagal mengirim permintaan redeem." };
        }
        if (!data?.ok) return { success: false, message: data?.message || "Permintaan ditolak." };
        showToast(`Permintaan redeem "${pkg.name}" berhasil dikirim!`);
        await loadRedeem();
        return { success: true, message: "Permintaan redeem berhasil dikirim." };
      });
      return result ?? { success: false, message: "Permintaan sedang diproses..." };
    },
    [redeemPackages, once, rpcError, showToast, loadRedeem],
  );

  const processRedeem = useCallback(
    async (redeemId: string | number, action: "approved" | "rejected") => {
      await once(`process-redeem:${redeemId}`, async () => {
        const { data, error } = await supabase.rpc("process_redeem", { p_redeem_id: Number(redeemId), p_action: action });
        if (error) {
          rpcError(error, "Gagal memproses redeem");
          return;
        }
        if (data && data.ok === false) {
          showToast(data.message || "Redeem tidak bisa diproses", "error");
          return;
        }
        showToast(`Permintaan redeem berhasil ${action === "approved" ? "disetujui" : "ditolak"}.`);
        await Promise.all([loadRedeem(), loadPoints()]);
      });
    },
    [once, rpcError, showToast, loadRedeem, loadPoints],
  );

  const submitQuiz = useCallback(
    async (participantId: string | number, quizId: string | number, answers: (number | null)[]) => {
      const quiz = quizzes.find((q) => String(q.id) === String(quizId));
      if (!quiz) return { score: 0, earnedPoints: 0 };

      const { data, error } = await supabase.rpc("submit_quiz", {
        p_participant_id: Number(participantId),
        p_quiz_id: Number(quizId),
        p_answers: answers.map((a) => (a === undefined ? null : a)),
        p_idempotency_key: newIdempotencyKey(),
      });
      if (error) {
        rpcError(error, "Gagal menyimpan hasil quiz");
        return { score: 0, earnedPoints: 0 };
      }

      const score: number = data?.score ?? 0;
      const earned: number = data?.points ?? 0;
      if (earned > 0) {
        showToast(`Quiz selesai! Skor: ${score}% (+${earned} poin)`);
      } else if ((data?.earned_today ?? 0) >= (data?.max ?? Infinity)) {
        showToast("Kamu sudah mendapatkan poin maksimal untuk kuis ini hari ini! 🏆", "info");
      } else if ((data?.correct ?? 0) > 0) {
        showToast(`Quiz selesai! Skor: ${score}% (Tidak ada poin tambahan, hasil tidak lebih baik dari sebelumnya)`, "info");
      } else {
        showToast(`Quiz selesai! Skor: ${score}% (Tidak ada jawaban benar)`, "info");
      }
      await Promise.all([loadQuizAttempts(), loadPoints()]);
      return { score, earnedPoints: earned };
    },
    [quizzes, rpcError, showToast, loadQuizAttempts, loadPoints],
  );

  const awardGameWin = useCallback(
    async (participantId: string | number, quizId: string | number) => {
      const { data, error } = await supabase.rpc("award_game_win", {
        p_participant_id: Number(participantId),
        p_quiz_id: Number(quizId),
        p_idempotency_key: newIdempotencyKey(),
      });
      if (error) {
        rpcError(error, "Gagal menyimpan poin catur");
        return 0;
      }
      if (data && data.ok === false) showToast(data.message, "info");
      await loadPoints();
      return (data?.points as number) ?? 0;
    },
    [rpcError, showToast, loadPoints],
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
          loadQuizzes();
        }
      } else {
        showToast(`Kuis "${quiz.title}" berhasil ditambahkan.`);
        loadQuizzes();
      }
    },
    [showToast, loadQuizzes],
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
          loadQuizzes();
        }
      } else {
        showToast(`Kuis "${quiz.title}" berhasil diperbarui.`);
        loadQuizzes();
      }
    },
    [showToast, loadQuizzes],
  );

  const toggleQuizActive = useCallback(async (quizId: string | number) => {
    const q = quizzes.find(item => String(item.id) === String(quizId));
    if (!q) return;
    const { error } = await supabase.from("quizzes").update({ is_active: !q.isActive }).eq("id", quizId);
    if (!error) loadQuizzes();
  }, [quizzes, loadQuizzes]);

  const deleteQuiz = useCallback(
    async (quizId: string | number) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
      if (error) showToast("Gagal menghapus quiz", "error");
      else {
        showToast("Quiz berhasil dihapus.", "info");
        loadQuizzes();
      }
    },
    [showToast, loadQuizzes],
  );

  /**
   * Foto diperkecil ke 256px WebP sebelum diunggah (±10–30 KB, sebelumnya foto
   * kamera bisa beberapa MB) dan disimpan dengan nama tetap per anak, sehingga
   * unggah ulang menimpa file lama alih-alih menumpuk di Storage.
   */
  const uploadAvatar = useCallback(async (file: File, participantId: string) => {
    try {
      const blob = await resizeImage(file, 256);
      const filePath = `avatars/${participantId}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, blob, { upsert: true, contentType: 'image/webp', cacheControl: '604800' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      return `${data.publicUrl}?v=${Date.now()}`;
    } catch (error) {
      showToast("Gagal mengupload foto", "error");
      throw error;
    }
  }, [showToast]);

  const optimizeAvatars = useCallback(async (onProgress?: (done: number, total: number) => void) => {
    const targets = participants.filter((p) => p.avatar_url && !p.avatar_url.split("?")[0].endsWith(".webp"));
    let optimized = 0, failed = 0, savedBytes = 0;
    for (const [i, p] of targets.entries()) {
      try {
        const original = await (await fetch(p.avatar_url as string)).blob();
        const small = await resizeImage(original, 256);
        const filePath = `avatars/${p.id}.webp`;
        const { error: upErr } = await supabase.storage.from("media")
          .upload(filePath, small, { upsert: true, contentType: "image/webp", cacheControl: "604800" });
        if (upErr) throw upErr;
        const url = `${supabase.storage.from("media").getPublicUrl(filePath).data.publicUrl}?v=${Date.now()}`;
        const { error: dbErr } = await supabase.from("participants").update({ avatar_url: url }).eq("id", p.id);
        if (dbErr) throw dbErr;
        optimized++;
        savedBytes += Math.max(0, original.size - small.size);
      } catch (err) {
        console.error("Gagal mengoptimalkan foto", p.nama, err);
        failed++;
      }
      onProgress?.(i + 1, targets.length);
    }
    await loadParticipants();
    return { optimized, failed, savedBytes };
  }, [participants, loadParticipants]);

  const updateParticipantAvatar = useCallback(async (id: string, url: string) => {
    const { error } = await supabase.from("participants").update({ avatar_url: url }).eq("id", id);
    if (error) {
      showToast("Gagal memperbarui foto profil", "error");
    } else {
      showToast("Foto profil berhasil diperbarui", "success");
      loadParticipants();
    }
  }, [showToast, loadParticipants]);

  const seedDatabase = useCallback(async () => {
    setIsLoading(true);
    try {
      showToast("Sedang memindahkan data ke Supabase...", "info");

      const {
        mockParticipants,
        mockQuizzes,
        mockRedeemPackages: seedPackages,
        mockBudgetStatus: seedBudget,
      } = await import("../services/mockData");

      // 1. Seed Participants
      await supabase.from("participants").insert(
        mockParticipants.map(p => ({ nama: p.nama, status: p.status }))
      );

      // 2. Seed Packages
      await supabase.from("redeem_packages").insert(
        seedPackages.map(rp => ({
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
        month: seedBudget.month,
        total_budget: seedBudget.totalBudget
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

  const endSeason = useCallback(async (nextSeasonName: string) => {
    if (!activeSeason) {
      return { success: false, message: "Tidak ada season aktif saat ini." };
    }
    const { error } = await supabase.rpc("end_season", { p_next_name: nextSeasonName });
    if (error) {
      rpcError(error, "Gagal mengakhiri season");
      return { success: false, message: error.message || "Gagal mengakhiri season." };
    }
    showToast(`Season ${activeSeason.name} berhasil diakhiri! Pemenang telah disimpan.`, "success");
    await loadAllData();
    return { success: true, message: "Season berhasil diakhiri." };
  }, [activeSeason, rpcError, showToast, loadAllData]);

  // Nama peserta ditempel di sini (bukan di loader) agar baris dari payload realtime juga bernama.
  const namedAttendance = useMemo(() => {
    const names = new Map(participants.map((p) => [String(p.id), p.nama]));
    return attendanceLog.map((a) => ({ ...a, participantName: names.get(String(a.participantId)) || "Unknown" }));
  }, [attendanceLog, participants]);
  const namedAdzan = useMemo(() => {
    const names = new Map(participants.map((p) => [String(p.id), p.nama]));
    return adzanLog.map((a) => ({ ...a, participantName: names.get(String(a.participantId)) || "Unknown" }));
  }, [adzanLog, participants]);

  const contextValue = useMemo(() => ({
    participants,
    addParticipant,
    updateParticipantStatus,
    points,
    ledgerReady,
    attendanceLog: namedAttendance,
    recordAttendance,
    adzanLog: namedAdzan,
    recordAdzan,
    recordSholawatIqomah,
    redeemPackages,
    redeemHistory,
    requestRedeem,
    processRedeem,
    quizzes,
    quizAttempts,
    submitQuiz,
    awardGameWin,
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
    optimizeAvatars,
    updateParticipantAvatar,
    schedule,
    updateSchedule,
    activeSeason,
    allSeasons,
    seasonHistory,
    endSeason,
  }), [
    participants, addParticipant, updateParticipantStatus, points, ledgerReady,
    namedAttendance, recordAttendance,
    namedAdzan, recordAdzan, recordSholawatIqomah, redeemPackages,
    redeemHistory, requestRedeem, processRedeem, quizzes, quizAttempts,
    submitQuiz, awardGameWin, addQuiz, updateQuiz, toggleQuizActive, deleteQuiz,
    budgetStatus, toast, showToast, isLoading, quickAbsen, setQuickAbsen,
    seedDatabase, uploadAvatar, optimizeAvatars, updateParticipantAvatar, schedule, updateSchedule,
    activeSeason, allSeasons, seasonHistory, endSeason,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/** Perkecil gambar ke sisi terpanjang `max` px dan ubah ke WebP. */
async function resizeImage(file: Blob, max: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal memproses gambar"))), "image/webp", 0.85),
  );
}

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
