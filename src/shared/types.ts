// Shared type definitions (frontend-compatible, no circular imports)

export type ParticipantStatus = 'aktif' | 'tidak_aktif' | 'baru';

export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface SeasonHistory {
  id: string;
  seasonId: string;
  participantId: string;
  finalPoints: number;
  rank: number;
  badge?: 'gold' | 'silver' | 'bronze' | null;
  createdAt: Date;
}

export interface Participant {
  id: string;
  nama: string;
  status: ParticipantStatus;
  avatar_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'attendance' | 'adzan' | 'quiz' | 'redeem' | 'adjustment';

export interface Transaction {
  id: string;
  participantId: string;
  type: TransactionType;
  points: number;
  reason: string;
  timestamp: Date;
  adminId: string;
}

export interface RedeemPackage {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  diamond: number;
  weeklyQuota: number;
  remainingQuota: number;
  budgetCost: number;
  isAvailable: boolean;
}

export type RedeemStatus = 'pending' | 'approved' | 'rejected';

export interface RedeemHistory {
  id: string;
  participantId: string;
  packageId: string;
  packageName: string;
  pointsSpent: number;
  status: RedeemStatus;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index of correct option
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdAt: Date;
  isActive: boolean;
  mode?: 'biasa' | 'block_blast' | 'catur_duo';
}

export interface QuizAttempt {
  id: string;
  participantId: string;
  quizId: string;
  score: number; // percentage
  earnedPoints: number;
  answers: number[];
  completedAt: Date;
}

export interface AttendanceEntry {
  id: string;
  participantId: string;
  participantName: string;
  prayerTime?: string;
  date: string;
  points: number;
  createdAt?: Date;
}

export interface AdzanEntry {
  id: string;
  participantId: string;
  participantName: string;
  prayerTime?: string;
  attitude: string;
  attitudePoints: number;
  adzanPoints: number;
  total: number;
  date: string;
  createdAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const PANGKAT_LEVELS = [
  {
    min: 0,
    title: "Prajurit Masjid",
    emoji: "🪖",
    color: "from-gray-400 to-gray-500",
    border: "border-gray-200",
    bg: "bg-gray-50",
    bonus: 0,
  },
  {
    min: 50,
    title: "Kopral Adzan",
    emoji: "⭐",
    color: "from-blue-400 to-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50",
    bonus: 10,
  },
  {
    min: 100,
    title: "Sersan Sholat",
    emoji: "⭐⭐",
    color: "from-teal-400 to-teal-600",
    border: "border-teal-200",
    bg: "bg-teal-50",
    bonus: 20,
  },
  {
    min: 200,
    title: "Letnan Ibadah",
    emoji: "🌟",
    color: "from-emerald-400 to-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    bonus: 30,
  },
  {
    min: 300,
    title: "Kapten Dakwah",
    emoji: "🌟🌟",
    color: "from-purple-400 to-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
    bonus: 40,
  },
  {
    min: 400,
    title: "Mayor Muadzin",
    emoji: "🏅",
    color: "from-orange-400 to-orange-600",
    border: "border-orange-200",
    bg: "bg-orange-50",
    bonus: 50,
  },
  {
    min: 500,
    title: "Jenderal Masjid",
    emoji: "👑",
    color: "from-yellow-400 to-amber-500",
    border: "border-yellow-200",
    bg: "bg-yellow-50",
    bonus: 100,
  },
  {
    min: 750,
    title: "Panglima Subuh",
    emoji: "🌅",
    color: "from-rose-400 to-rose-600",
    border: "border-rose-200",
    bg: "bg-rose-50",
    bonus: 150,
  },
  {
    min: 1000,
    title: "Ksatria Masjid",
    emoji: "⚔️",
    color: "from-indigo-400 to-indigo-600",
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    bonus: 200,
  },
  {
    min: 1500,
    title: "Pahlawan Masjid",
    emoji: "🦸‍♂️",
    color: "from-cyan-400 to-cyan-600",
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    bonus: 300,
  },
  {
    min: 2000,
    title: "Legenda Muadzin",
    emoji: "🏆",
    color: "from-fuchsia-400 to-fuchsia-600",
    border: "border-fuchsia-200",
    bg: "bg-fuchsia-50",
    bonus: 500,
  },
];

export const getPangkat = (totalPoints: number) => {
  let current = PANGKAT_LEVELS[0];
  let next = PANGKAT_LEVELS[1] || null;
  for (let i = PANGKAT_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= PANGKAT_LEVELS[i].min) {
      current = PANGKAT_LEVELS[i];
      next = PANGKAT_LEVELS[i + 1] || null;
      break;
    }
  }
  return { current, next };
};
