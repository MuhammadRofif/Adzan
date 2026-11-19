import { Participant, Transaction, RedeemPackage, RedeemHistory, Quiz, QuizAttempt, AttendanceEntry, AdzanEntry, AdzanVideo } from '../../shared/types';

// ─── Participants ───────────────────────────────────────────────────────────────
export const mockParticipants: Participant[] = [
  { id: '1',  nama: 'Akmal', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '2',  nama: 'Nail', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '3',  nama: 'Rizky', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '4',  nama: 'Iqbal', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '5',  nama: 'Adriza', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '6',  nama: 'Iqbal Adek Akmal', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '7',  nama: 'Adit', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '8',  nama: 'Radit', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '9',  nama: 'Hafi', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
  { id: '10', nama: 'Rega', status: 'aktif', createdAt: new Date('2026-05-01'), updatedAt: new Date() },
];

// ─── Points ─────────────────────────────────────────────────────────────────────
export const mockPoints: Record<string, { attendance: number; attitude: number; adzan: number; quiz: number; total: number; adzanCount: number; attendanceCount: number }> = {
  '1':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '2':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '3':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '4':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '5':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '6':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '7':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '8':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '9':  { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
  '10': { attendance: 0, attitude: 0, adzan: 0, quiz: 0, total: 0, adzanCount: 0, attendanceCount: 0 },
};

// ─── Transactions ────────────────────────────────────────────────────────────────
export const mockTransactions: Transaction[] = [];

// ─── Redeem Packages ─────────────────────────────────────────────────────────────
export const mockRedeemPackages: RedeemPackage[] = [
  { id: 'r1', name: 'Paket 5 Diamond', description: 'Dapatkan 5 Diamond untuk game favorit kamu!', pointsRequired: 150,  diamond: 5,   weeklyQuota: 2, remainingQuota: 2, budgetCost: 5000,   isAvailable: true },
  { id: 'r2', name: 'Paket 12 Diamond', description: 'Hemat lebih banyak dengan 12 Diamond sekaligus!', pointsRequired: 300, diamond: 12,  weeklyQuota: 2, remainingQuota: 1, budgetCost: 12000,  isAvailable: true },
  { id: 'r3', name: 'Paket 50 Diamond', description: 'Paket terpopuler! Cocok untuk pembelian item premium.', pointsRequired: 700, diamond: 50,  weeklyQuota: 1, remainingQuota: 1, budgetCost: 50000,  isAvailable: true },
  { id: 'r4', name: 'Paket 70 Diamond', description: 'Nilai terbaik untuk para gamers serius.', pointsRequired: 900, diamond: 70,  weeklyQuota: 1, remainingQuota: 0, budgetCost: 70000,  isAvailable: false },
  { id: 'r5', name: 'Paket 140 Diamond', description: 'Paket terbesar! Untuk pengalaman gaming terbaik.', pointsRequired: 1600, diamond: 140, weeklyQuota: 1, remainingQuota: 1, budgetCost: 140000, isAvailable: true },
];

// ─── Redeem History ──────────────────────────────────────────────────────────────
export const mockRedeemHistory: RedeemHistory[] = [];

// ─── Quiz ────────────────────────────────────────────────────────────────────────
export const mockQuizzes: Quiz[] = [
  {
    id: 'q1',
    title: 'Fiqih Shalat Dasar',
    description: 'Uji pengetahuan kamu tentang tata cara shalat yang benar.',
    questions: [
      { id: 'q1_1', text: 'Berapa rakaat shalat Duhur?', options: ['2', '3', '4', '5'], correctAnswer: 2 },
      { id: 'q1_2', text: 'Apa bacaan pada saat i\'tidal?', options: ['Subhana Rabbiyal Adzim', 'Sami Allahu Liman Hamidah', 'Subhana Rabbiyal A\'la', 'Rabbighfirli'], correctAnswer: 1 },
      { id: 'q1_3', text: 'Gerakan apa yang dilakukan setelah ruku\'?', options: ['Sujud', 'I\'tidal', 'Duduk', 'Salam'], correctAnswer: 1 },
      { id: 'q1_4', text: 'Syarat wajib shalat adalah?', options: ['Islam, berakal, baligh', 'Islam, puasa, baligh', 'Baligh, kaya, sehat', 'Islam, kuat, beragama'], correctAnswer: 0 },
      { id: 'q1_5', text: 'Apa yang membatalkan shalat?', options: ['Batuk', 'Bersin', 'Berbicara sengaja', 'Menangis'], correctAnswer: 2 },
    ],
    createdAt: new Date('2024-04-01'),
    isActive: true,
  },
  {
    id: 'q2',
    title: 'Pengetahuan Adzan & Iqamah',
    description: 'Seberapa dalam pengetahuanmu tentang adzan?',
    questions: [
      { id: 'q2_1', text: 'Berapa kali lafaz "Allahu Akbar" diucapkan di awal adzan?', options: ['2', '4', '6', '8'], correctAnswer: 1 },
      { id: 'q2_2', text: 'Apa doa yang dibaca setelah mendengar adzan?', options: ['Doa masuk masjid', 'Doa setelah adzan', 'Doa qunut', 'Doa buka puasa'], correctAnswer: 1 },
      { id: 'q2_3', text: 'Hayya \'ala artinya?', options: ['Marilah menuju', 'Segera datang', 'Ayo bersama', 'Datanglah sekarang'], correctAnswer: 0 },
    ],
    createdAt: new Date('2024-04-15'),
    isActive: true,
  },
];

export const mockQuizAttempts: QuizAttempt[] = [];

// ─── Budget Status ────────────────────────────────────────────────────────────────
export const mockBudgetStatus = {
  totalBudget: 500000,
  usedBudget: 0,
  usagePercent: 0,
  warning: false,
  month: 'Mei 2026',
};

// ─── Attendance Log ────────────────────────────────────────────────────────────────
export const mockAttendanceLog: AttendanceEntry[] = [];

// ─── Adzan Log ────────────────────────────────────────────────────────────────────
export const mockAdzanLog: AdzanEntry[] = [];

// ─── Adzan Videos ─────────────────────────────────────────────────────────────────
export const mockAdzanVideos: AdzanVideo[] = [
  {
    id: 'v1',
    title: 'NUSSA : ADZAN',
    muadzin: 'Nussa Official',
    category: 'Muadzin Cilik',
    youtubeUrl: 'https://www.youtube.com/watch?v=X1Aec-UC2UI',
    youtubeId: 'X1Aec-UC2UI',
    difficulty: 'Mudah',
    description: 'Animasi edukasi adzan ramah anak dengan irama stabil dan mudah ditirukan.',
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'v2',
    title: 'ADZAN MERDU || Muzammil Hasballah',
    muadzin: 'Muzammil Hasballah',
    category: 'Hijaz',
    youtubeUrl: 'https://www.youtube.com/watch?v=X1wtcLunYVk',
    youtubeId: 'X1wtcLunYVk',
    difficulty: 'Sedang',
    description: 'Lantunan adzan merdu dan fasih dari qari muda panutan anak-anak Indonesia.',
    orderIndex: 2,
    isActive: true,
  },
  {
    id: 'v3',
    title: 'SUARA ADZAN MERDU || UMAR AL FARUQ',
    muadzin: 'Umar Al Faruq',
    category: 'Rost & Nahawand',
    youtubeUrl: 'https://www.youtube.com/watch?v=18r6pTlgFKs',
    youtubeId: '18r6pTlgFKs',
    difficulty: 'Sedang',
    description: 'Kumandang adzan sangat merdu dengan makhraj huruf yang jelas dan tartil.',
    orderIndex: 3,
    isActive: true,
  },
  {
    id: 'v4',
    title: 'ADZAN MERDU || MUHAMMAD VICKRY',
    muadzin: 'Muhammad Vickry',
    category: 'Makkah & Madinah',
    youtubeUrl: 'https://www.youtube.com/watch?v=cJbKGxOq9n8',
    youtubeId: 'cJbKGxOq9n8',
    difficulty: 'Mudah',
    description: 'Irama adzan yang tenang, sejuk, dan tempo stabil cocok untuk latihan anak.',
    orderIndex: 4,
    isActive: true,
  },
  {
    id: 'v5',
    title: 'Adzan Sangat Merdu - Taqy Malik',
    muadzin: 'Taqy Malik',
    category: 'Hijaz',
    youtubeUrl: 'https://www.youtube.com/watch?v=xlVUVnwSU_s',
    youtubeId: 'xlVUVnwSU_s',
    difficulty: 'Mahir',
    description: 'Lantunan nada adzan khas dan menyentuh hati dengan nada tinggi yang mantap.',
    orderIndex: 5,
    isActive: true,
  },
  {
    id: 'v6',
    title: 'Adzan Merdu - Salim Bahanan',
    muadzin: 'Salim Bahanan',
    category: 'Umum',
    youtubeUrl: 'https://www.youtube.com/watch?v=T7s3IFMktLo',
    youtubeId: 'T7s3IFMktLo',
    difficulty: 'Sedang',
    description: 'Kumandang adzan yang syahdu dan khusyuk penyejuk hati.',
    orderIndex: 6,
    isActive: true,
  },
];
