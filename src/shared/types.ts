// Shared type definitions (frontend-compatible, no circular imports)

export type ParticipantStatus = 'aktif' | 'tidak_aktif' | 'baru';

export interface Participant {
  id: string;
  nama: string;
  status: ParticipantStatus;
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
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
