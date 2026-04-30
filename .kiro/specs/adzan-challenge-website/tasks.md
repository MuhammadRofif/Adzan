# Implementation Plan: Adzan Challenge Website

## Overview

Implementasi website gamifikasi challenge adzan menggunakan TypeScript + React + Node.js. Sistem akan dibangun dengan fokus UI dulu, kemudian backend nanti. Arsitektur modular dengan mock data untuk development.

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript (nanti)
- **Database**: PostgreSQL (nanti)
- **Authentication**: JWT + bcrypt (nanti)
- **Testing**: Jest + React Testing Library
- **Deployment**: Docker + Vercel/Railway (nanti)

## Tasks

### Phase 1: Project Setup & UI Foundation

- [-] 1. Setup React project dengan TypeScript dan Tailwind CSS
  - Initialize React project dengan Vite atau Create React App
  - Setup TypeScript configuration
  - Configure Tailwind CSS
  - Setup project structure (components, pages, hooks, utils)
  - Configure environment variables (.env.example)
  - _Requirements: 17 (Kompatibilitas Perangkat)_

- [~] 2. Create main dashboard layout dan navigation
  - Build responsive dashboard layout (desktop, tablet, mobile)
  - Implement navigation menu/sidebar
  - Create dashboard header dengan user info dan logout button
  - Build responsive grid system
  - _Requirements: 14 (Antarmuka Admin), 17 (Kompatibilitas Perangkat)_

- [~] 3. Create adzan tracking table component
  - Build React component untuk display tracking table
  - Implement columns: Nama Peserta, Jumlah Adzan, Poin, Status
  - Implement sorting by Nama, Jumlah Adzan, Poin
  - Implement filtering by status
  - Display data dengan mock data
  - _Requirements: 1 (Tabel Tracking Adzan)_

- [~] 4. Create quick-action buttons dan modal forms
  - Build "Record Attendance" button dengan modal form
  - Build "Record Adzan" button dengan modal form (participant + attitude selection)
  - Implement form validation dan error handling
  - Provide immediate visual feedback (success/error messages)
  - _Requirements: 14 (Antarmuka Admin)_

- [~] 5. Checkpoint - Verify UI foundation
  - Test dashboard layout responsiveness
  - Test table rendering dan sorting
  - Test modal forms functionality
  - Test on different screen sizes

---

### Phase 2: Dashboard Features & Statistics

- [~] 6. Implement dashboard statistics section
  - Display current month's total adzan count
  - Display average points per participant
  - Display top 5 performers (leaderboard)
  - Display budget usage status (mock)
  - Implement statistics cards dengan icons
  - _Requirements: 13 (Laporan dan Statistik)_

- [~] 7. Create participant detail view
  - Build participant profile component
  - Display point breakdown by source (attendance, attitude, adzan, quiz)
  - Display redeem history (mock)
  - Display quiz history (mock)
  - Display transaction history (mock)
  - _Requirements: 13 (Laporan dan Statistik), 7 (Integrasi Quiz)_

- [~] 8. Implement filtering dan search functionality
  - Create search by participant name
  - Implement filter by status (Aktif, Tidak Aktif, Baru)
  - Implement filter by month
  - Create advanced filter options
  - _Requirements: 13 (Laporan dan Statistik)_

- [~] 9. Create export functionality UI
  - Implement CSV export button untuk transaction history
  - Implement PDF export button untuk monthly report
  - Create export dengan filtering options
  - _Requirements: 13 (Laporan dan Statistik)_

- [~] 10. Checkpoint - Verify dashboard features
  - Test statistics calculation dengan mock data
  - Test filtering dan search
  - Test export functionality
  - Test participant detail view

---

### Phase 3: Quiz System UI

- [~] 11. Create quiz React component
  - Build Quiz interface component dengan question display
  - Implement answer selection (radio buttons atau multiple choice)
  - Implement quiz timer (optional)
  - Build quiz results component dengan score display
  - Implement quiz history view
  - _Requirements: 6 (Game Quiz Keislamanan)_

- [~] 12. Create quiz management interface (admin)
  - Build form untuk create/edit quiz questions
  - Implement question validation
  - Build quiz list view dengan edit/delete options
  - Implement quiz preview functionality
  - _Requirements: 6 (Game Quiz Keislamanan)_

- [~] 13. Checkpoint - Verify quiz UI
  - Test quiz component rendering
  - Test answer selection
  - Test quiz results display
  - Test quiz management interface

---

### Phase 4: Redeem System UI

- [~] 14. Create redeem packages display component
  - Build redeem packages display dengan point requirements
  - Implement redeem button dengan confirmation modal
  - Display error messages untuk insufficient points/quota/budget
  - Show remaining weekly quota
  - Implement redeem history view
  - _Requirements: 8 (Sistem Redeem Hadiah), 10 (Fleksibilitas Waktu Redeem)_

- [~] 15. Create redeem management interface (admin)
  - Build redeem requests list view
  - Implement redeem approval/rejection workflow UI
  - Display budget status dan warnings
  - Build redeem history report
  - Implement redeem statistics
  - _Requirements: 8, 9 (Batasan Redeem Mingguan), 19 (Kontrol Budget)_

- [~] 16. Checkpoint - Verify redeem UI
  - Test redeem packages display
  - Test redeem modal functionality
  - Test redeem management interface
  - Test budget status display

---

### Phase 5: Responsive Design & Mobile Optimization

- [~] 17. Implement responsive design untuk mobile/tablet
  - Optimize table display untuk mobile (horizontal scroll atau card view)
  - Implement touch-friendly buttons dan inputs
  - Test pada berbagai screen sizes (320px, 768px, 1024px, 1440px)
  - Ensure all functionality accessible pada mobile
  - _Requirements: 17 (Kompatibilitas Perangkat)_

- [~] 18. Create mobile-specific components
  - Build mobile navigation drawer
  - Create mobile-optimized forms
  - Implement mobile-friendly modals
  - Test touch interactions
  - _Requirements: 17 (Kompatibilitas Perangkat)_

- [~] 19. Checkpoint - Verify responsive design
  - Test all components pada mobile
  - Test all components pada tablet
  - Test all components pada desktop
  - Verify no layout issues

---

### Phase 6: UI Polish & Documentation

- [~] 20. Create in-app help system
  - Implement tooltips untuk buttons dan fields
  - Create help modal dengan step-by-step guides
  - Implement contextual help messages
  - Create onboarding tutorial untuk new admins
  - _Requirements: 20 (Dokumentasi dan Panduan Pengguna)_

- [~] 21. Implement UI theme dan styling
  - Create consistent color scheme
  - Implement dark mode support (optional)
  - Create reusable component library
  - Implement consistent spacing dan typography
  - _Requirements: 14 (Antarmuka Admin)_

- [~] 22. Create UI documentation
  - Document component library
  - Create Storybook atau component showcase
  - Document design system
  - Create usage examples
  - _Requirements: 20 (Dokumentasi dan Panduan Pengguna)_

- [~] 23. Checkpoint - Verify UI polish
  - Test all components styling
  - Test theme consistency
  - Test help system
  - Verify documentation completeness

---

### Phase 7: Mock Data & State Management

- [~] 24. Create mock data service
  - Create mock participants data
  - Create mock transactions data
  - Create mock quiz data
  - Create mock redeem data
  - _Requirements: 1, 2, 3, 4, 6, 8_

- [~] 25. Implement state management (Context API atau Redux)
  - Setup global state untuk participants
  - Setup global state untuk points
  - Setup global state untuk transactions
  - Setup global state untuk UI state
  - _Requirements: 1, 2, 3, 4_

- [~] 26. Create custom hooks untuk data management
  - Create useParticipants hook
  - Create usePoints hook
  - Create useTransactions hook
  - Create useRedeem hook
  - _Requirements: 1, 2, 3, 4_

- [~] 27. Checkpoint - Verify state management
  - Test state updates
  - Test data flow
  - Test component re-renders
  - Verify no memory leaks

---

### Phase 8: Frontend Testing

- [~] 28. Write React component tests
  - Test dashboard table rendering
  - Test quick-action buttons
  - Test redeem UI dengan various states
  - Test quiz component
  - Test responsive design
  - _Requirements: 1, 14, 17_

- [~] 29. Write integration tests untuk UI flows
  - Test complete attendance recording flow
  - Test complete redeem flow
  - Test complete quiz flow
  - Test dashboard updates
  - _Requirements: 1, 2, 3, 4, 8, 9_

- [~] 30. Write end-to-end tests
  - Test complete user journey
  - Test all UI interactions
  - Test responsive design pada different devices
  - Test error handling
  - _Requirements: 1, 2, 3, 4, 8, 9_

- [~] 31. Checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify code coverage
  - Fix any failing tests
  - Ensure no regressions

---

### Phase 9: Frontend Deployment & Documentation

- [~] 32. Setup frontend build dan deployment
  - Configure build process
  - Setup environment-based configuration
  - Create deployment scripts
  - Setup CI/CD untuk frontend
  - _Requirements: 17 (Kompatibilitas Perangkat)_

- [~] 33. Create frontend documentation
  - Create admin quick-start guide
  - Create step-by-step guides untuk common tasks
  - Create FAQ section
  - Create troubleshooting guide
  - _Requirements: 20 (Dokumentasi dan Panduan Pengguna)_

- [ ] 34. Deploy frontend to production
  - Deploy ke Vercel atau Netlify
  - Setup custom domain
  - Configure monitoring
  - Setup error tracking
  - _Requirements: 17 (Kompatibilitas Perangkat)_

- [ ] 35. Checkpoint - Verify frontend deployment
  - Test all features pada production
  - Verify responsive design
  - Verify performance
  - Test from different devices/networks

---

### Phase 10: Backend Setup (Nanti)

- [ ] 36. Setup project structure dan dependencies (Backend)
  - Initialize Node.js project dengan TypeScript configuration
  - Setup Express server dengan middleware (CORS, body-parser, error handling)
  - Configure environment variables (.env.example)
  - Setup database connection pool
  - _Requirements: 16 (Persistensi Data)_

- [ ] 37. Setup database schema dan migrations
  - Create PostgreSQL/SQLite database
  - Design and create tables: users, participants, transactions, redeem_history, quiz_history
  - Setup migration system (e.g., Knex.js atau TypeORM)
  - Create indexes untuk performance optimization
  - _Requirements: 16 (Persistensi Data), 11 (Keamanan dan Validasi Poin)_

- [ ] 38. Setup authentication system
  - Implement JWT token generation dan validation
  - Create password hashing dengan bcrypt
  - Setup login endpoint dengan validation
  - Implement session management dengan 24-hour expiry
  - Create logout endpoint yang clears session
  - _Requirements: 15 (Keamanan Akses)_

- [ ] 39. Setup API error handling dan logging
  - Create centralized error handling middleware
  - Implement request/response logging
  - Setup audit log system untuk transaction tracking
  - Create error response standardization
  - _Requirements: 11 (Keamanan dan Validasi Poin), 14 (Antarmuka Admin)_

- [ ] 40. Create participant data model dan API endpoints
  - Design Participant interface (id, nama, status, createdAt, updatedAt)
  - Create POST /api/participants endpoint untuk add participant (max 12)
  - Create GET /api/participants endpoint untuk list all participants
  - Create PUT /api/participants/:id endpoint untuk edit participant
  - Create PATCH /api/participants/:id/status endpoint untuk update status
  - Implement validation: max 12 participants, required fields
  - _Requirements: 12 (Manajemen Data Peserta), 1 (Tabel Tracking Adzan)_

- [ ] 41. Create transaction data model dan audit system
  - Design Transaction interface (id, participantId, type, points, reason, timestamp, adminId)
  - Create database table untuk store all transactions
  - Implement transaction logging untuk setiap point change
  - Create GET /api/transactions endpoint dengan filtering
  - Implement audit trail untuk transparency
  - _Requirements: 11 (Keamanan dan Validasi Poin)_

- [ ] 42. Create points calculation system
  - Design Points interface (participantId, attendance, attitude, adzan, quiz, total, month)
  - Create calculateTotalPoints() function: (attendance × 5) + attitude + (adzan × 10) + quiz
  - Create updateParticipantPoints() function dengan transaction logging
  - Implement monthly reset logic
  - Create GET /api/participants/:id/points endpoint
  - _Requirements: 5 (Perhitungan Total Poin Bulanan), 2, 3, 4_

- [ ] 43. Implement attendance tracking system
  - Create POST /api/attendance endpoint untuk record attendance
  - Implement validation: participant exists, not duplicate for same session
  - Award +5 points untuk attendance
  - Create transaction log entry
  - Update participant's total points
  - _Requirements: 2 (Sistem Poin Kehadiran)_

- [ ] 44. Implement attitude rating system
  - Create POST /api/adzan endpoint untuk record adzan dengan attitude
  - Implement attitude options: "Bagus" (+5), "Kurang Fokus" (+3), "Ribut" (0)
  - Validate attitude input (exactly 3 choices)
  - Award attitude points + adzan points (+10)
  - Increment jumlah_adzan counter
  - Create transaction log entry
  - _Requirements: 3 (Sistem Poin Sikap Adzan), 4 (Sistem Poin Jumlah Adzan)_

- [ ] 45. Create quiz data model dan API endpoints
  - Design Quiz interface (id, title, questions, createdAt)
  - Design Question interface (id, text, options, correctAnswer)
  - Design QuizAttempt interface (id, participantId, quizId, score, timestamp)
  - Create database tables untuk quizzes, questions, quiz_attempts
  - Create POST /api/quizzes endpoint untuk create quiz (admin only)
  - Create GET /api/quizzes endpoint untuk list available quizzes
  - Create POST /api/quizzes/:id/submit endpoint untuk submit quiz answers
  - _Requirements: 6 (Game Quiz Keislamanan)_

- [ ] 46. Implement quiz scoring dan points integration
  - Create calculateQuizPoints() function (e.g., 1 point per correct answer)
  - Create POST /api/quiz-points endpoint untuk award quiz points
  - Integrate quiz points dengan main points system
  - Create transaction log entry untuk quiz points
  - Update participant's total points
  - _Requirements: 7 (Integrasi Quiz dengan Sistem Poin)_

- [ ] 47. Create redeem packages configuration
  - Define redeem packages: 5D/50pts, 12D/110pts, 50D/400pts, 70D/550pts, 140D/950pts
  - Create database table untuk redeem_packages
  - Create GET /api/redeem-packages endpoint
  - Implement package validation
  - _Requirements: 8 (Sistem Redeem Hadiah)_

- [ ] 48. Implement redeem transaction system
  - Create POST /api/redeem endpoint untuk process redeem
  - Implement validation: sufficient points, weekly limit (2x/week), budget check
  - Deduct points dari participant's total
  - Create redeem transaction log
  - Reset weekly counter every Monday 00:00
  - _Requirements: 8, 9 (Batasan Redeem Mingguan), 19 (Kontrol Budget)_

- [ ] 49. Implement weekly redeem quota system
  - Create weekly_redeem_count tracking per participant
  - Implement automatic reset every Monday
  - Create GET /api/participants/:id/redeem-quota endpoint
  - Validate redeem count before processing
  - Display remaining quota to participant
  - _Requirements: 9 (Batasan Redeem Mingguan)_

- [ ] 50. Implement budget control system
  - Create monthly_budget tracking
  - Calculate total hadiah cost dari redeem transactions
  - Implement 80% warning threshold
  - Implement 100% budget limit (prevent redeem)
  - Create GET /api/budget-status endpoint
  - Display budget usage pada admin dashboard
  - _Requirements: 19 (Kontrol Budget)_

- [ ] 51. Implement comprehensive input validation
  - Create validation functions untuk semua API endpoints
  - Validate participant data (nama, status)
  - Validate point transactions (amount, type)
  - Validate redeem requests (package, points)
  - Implement error messages untuk invalid inputs
  - _Requirements: 11 (Keamanan dan Validasi Poin), 14 (Antarmuka Admin)_

- [ ] 52. Implement authorization checks
  - Create middleware untuk verify admin authentication
  - Implement role-based access control (admin only)
  - Prevent participants dari accessing admin features
  - Prevent unauthorized data access
  - _Requirements: 15 (Keamanan Akses)_

- [ ] 53. Implement data integrity checks
  - Create validation untuk prevent negative point balances
  - Implement transaction atomicity (all-or-nothing)
  - Create validation untuk prevent duplicate transactions
  - Implement consistency checks untuk point calculations
  - _Requirements: 11 (Keamanan dan Validasi Poin)_

- [ ] 54. Implement rate limiting dan security headers
  - Add rate limiting untuk API endpoints
  - Implement CORS security headers
  - Add security headers (CSP, X-Frame-Options, etc.)
  - Implement request validation
  - _Requirements: 15 (Keamanan Akses)_

- [ ] 55. Write backend unit tests
  - Test points calculation functions
  - Test attendance recording logic
  - Test attitude rating logic
  - Test redeem validation logic
  - Test budget calculation logic
  - Achieve minimum 80% code coverage
  - _Requirements: 11 (Keamanan dan Validasi Poin)_

- [ ] 56. Write backend integration tests
  - Test attendance endpoint dengan various inputs
  - Test adzan endpoint dengan all attitude options
  - Test redeem endpoint dengan quota/budget limits
  - Test quiz submission endpoint
  - Test participant management endpoints
  - _Requirements: 1, 2, 3, 4, 8, 9_

- [ ] 57. Setup Docker containerization
  - Create Dockerfile untuk backend
  - Create Dockerfile untuk frontend
  - Create docker-compose.yml untuk local development
  - Setup environment configuration
  - _Requirements: 16 (Persistensi Data)_

- [ ] 58. Setup CI/CD pipeline
  - Configure GitHub Actions (atau equivalent)
  - Setup automated testing pada push
  - Setup automated linting
  - Setup automated deployment
  - _Requirements: 16 (Persistensi Data)_

- [ ] 59. Deploy backend to production
  - Deploy backend ke Railway/Heroku/AWS
  - Setup database backups
  - Configure monitoring dan logging
  - Setup error tracking (Sentry)
  - _Requirements: 16 (Persistensi Data)_

- [ ] 60. Implement notification system
  - Setup email/SMS notifications
  - Send notification saat participant earn points
  - Send notification saat redeem successful
  - Send notification saat reach milestone
  - Send weekly quota reset reminder
  - _Requirements: 18 (Notifikasi dan Reminder)_

---

## Requirements Coverage Matrix

| Requirement | Tasks |
|---|---|
| 1. Tabel Tracking Adzan | 3, 6, 7, 24, 25, 26 |
| 2. Sistem Poin Kehadiran | 4, 24, 43 |
| 3. Sistem Poin Sikap Adzan | 4, 24, 44 |
| 4. Sistem Poin Jumlah Adzan | 4, 24, 44 |
| 5. Perhitungan Total Poin Bulanan | 6, 24, 42 |
| 6. Game Quiz Keislamanan | 11, 12, 45 |
| 7. Integrasi Quiz dengan Sistem Poin | 7, 46 |
| 8. Sistem Redeem Hadiah | 14, 15, 47, 48 |
| 9. Batasan Redeem Mingguan | 14, 15, 49 |
| 10. Fleksibilitas Waktu Redeem | 14 |
| 11. Keamanan dan Validasi Poin | 39, 51, 53, 55 |
| 12. Manajemen Data Peserta | 40 |
| 13. Laporan dan Statistik | 6, 7, 8, 9 |
| 14. Antarmuka Admin | 2, 4, 21, 51 |
| 15. Keamanan Akses | 38, 52, 54 |
| 16. Persistensi Data | 36, 37, 57, 58, 59 |
| 17. Kompatibilitas Perangkat | 1, 2, 17, 18, 32, 34 |
| 18. Notifikasi dan Reminder | 60 |
| 19. Kontrol Budget | 15, 50 |
| 20. Dokumentasi dan Panduan Pengguna | 20, 22, 33 |

## Implementation Notes

### Key Principles
1. **UI-First Development**: Fokus pada UI dulu dengan mock data
2. **Responsive Design**: Mobile-first approach
3. **Component Reusability**: Modular component architecture
4. **User-Centric**: Admin interface simple dan mudah digunakan
5. **Incremental Development**: Setiap phase menghasilkan working feature

### Technology Decisions
- **React**: Modern UI framework dengan component reusability
- **TypeScript**: Type safety dan better developer experience
- **Tailwind CSS**: Utility-first CSS framework untuk rapid development
- **Mock Data**: Untuk development tanpa backend dependency
- **Jest + React Testing Library**: Comprehensive testing framework

### Performance Considerations
- Lazy loading untuk components
- Memoization untuk expensive computations
- Pagination untuk large datasets
- Caching untuk static data
- Optimized images dan assets

### Deployment Strategy
- Frontend deployment ke Vercel atau Netlify
- Environment-based configuration
- CI/CD pipeline untuk automated testing dan deployment
- Monitoring dan error tracking

## Success Criteria

- [ ] All 35 core UI tasks completed
- [ ] All UI requirements covered by implementation
- [ ] Responsive design working pada mobile/tablet/desktop
- [ ] All UI tests passing
- [ ] Zero accessibility issues
- [ ] Admin can record attendance/adzan dalam < 30 seconds
- [ ] Dashboard loads dalam < 2 seconds
- [ ] All features work pada mobile/tablet/desktop
- [ ] Frontend deployed dan accessible 24/7
