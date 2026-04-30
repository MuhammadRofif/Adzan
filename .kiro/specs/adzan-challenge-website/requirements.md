# Requirements Document: Adzan Challenge Website

## Introduction

Adzan Challenge Website adalah platform gamifikasi untuk meningkatkan partisipasi peserta dalam kegiatan adzan berjamaah. Sistem ini melacak kehadiran dan kualitas adzan peserta, memberikan poin berdasarkan performa, dan memungkinkan peserta menukar poin dengan hadiah (Free Fire Diamond). Platform dirancang untuk 12 peserta dengan sesi latihan 3x per minggu (~12 sesi/bulan) dan budget terbatas (Rp50.000/bulan).

## Glossary

- **Peserta**: Individu yang mengikuti challenge adzan (total 12 orang)
- **Adzan**: Seruan untuk shalat berjamaah yang dilakukan oleh peserta
- **Sesi**: Satu kali pertemuan latihan adzan (3x per minggu)
- **Poin**: Satuan reward yang dikumpulkan peserta melalui berbagai aktivitas
- **Hadiah**: Free Fire Diamond yang dapat ditukar dengan poin
- **Redeem**: Proses penukaran poin dengan hadiah
- **Sikap Adzan**: Kualitas performa saat melakukan adzan (bagus, kurang fokus, ribut)
- **Tracking**: Pencatatan dan monitoring aktivitas peserta
- **Quiz Keislamanan**: Kuis interaktif tentang pengetahuan Islam
- **Dashboard**: Halaman utama yang menampilkan tabel tracking dan informasi peserta
- **Admin**: Pengguna yang mengelola sistem, mencatat kehadiran, dan memproses redeem
- **Sistem Poin**: Mekanisme perhitungan dan akumulasi poin peserta

## Requirements

### Requirement 1: Tabel Tracking Adzan

**User Story:** Sebagai admin, saya ingin melihat daftar semua peserta dengan tracking adzan mereka, sehingga saya dapat memantau performa dan kehadiran setiap peserta secara real-time.

#### Acceptance Criteria

1. THE Dashboard SHALL display a table containing exactly 12 participants
2. THE Table SHALL have the following columns: Nama Peserta, Jumlah Adzan, Poin, Status
3. WHEN a participant completes an adzan session, THE Jumlah Adzan column SHALL increment by 1
4. THE Poin column SHALL display the total accumulated points for each participant
5. THE Status column SHALL display one of: "Aktif", "Tidak Aktif", atau "Baru"
6. THE Table SHALL be sortable by Nama Peserta, Jumlah Adzan, and Poin columns
7. WHEN the page is loaded, THE Table SHALL display data from the most recent session first
8. THE Dashboard SHALL update in real-time when admin records a new adzan session

---

### Requirement 2: Sistem Poin Kehadiran

**User Story:** Sebagai peserta, saya ingin mendapatkan poin untuk setiap kehadiran saya, sehingga saya termotivasi untuk hadir di setiap sesi latihan.

#### Acceptance Criteria

1. WHEN a participant attends a session, THE System SHALL award +5 points for attendance
2. WHEN a participant is marked as present in a session, THE Poin total SHALL increase by 5
3. WHEN a participant is absent, THE System SHALL not award attendance points
4. THE attendance points SHALL be recorded immediately when admin marks attendance
5. WHILE a session is ongoing, THE System SHALL allow admin to update attendance status until session ends

---

### Requirement 3: Sistem Poin Sikap Adzan

**User Story:** Sebagai admin, saya ingin memberikan poin berdasarkan kualitas sikap adzan peserta, sehingga peserta termotivasi untuk meningkatkan kualitas performa mereka.

#### Acceptance Criteria

1. WHEN a participant performs adzan with "Bagus" attitude, THE System SHALL award +5 points
2. WHEN a participant performs adzan with "Kurang Fokus" attitude, THE System SHALL award +3 points
3. WHEN a participant performs adzan with "Ribut" attitude, THE System SHALL award 0 points
4. THE attitude rating SHALL be recorded by admin for each adzan performance
5. WHEN admin selects an attitude rating, THE corresponding points SHALL be added to participant's total
6. THE attitude options SHALL be limited to exactly three choices: "Bagus", "Kurang Fokus", "Ribut"

---

### Requirement 4: Sistem Poin Jumlah Adzan

**User Story:** Sebagai peserta, saya ingin mendapatkan poin untuk setiap kali saya melakukan adzan, sehingga saya termotivasi untuk melakukan adzan lebih banyak.

#### Acceptance Criteria

1. WHEN a participant completes an adzan performance, THE System SHALL award +10 points per adzan
2. THE adzan count SHALL increment by 1 for each recorded adzan performance
3. WHEN admin records an adzan with an attitude rating, THE System SHALL add both attitude points and adzan points (+10)
4. THE total adzan points per participant SHALL be calculated as: Jumlah Adzan × 10
5. THE adzan points SHALL be added to the participant's total poin immediately upon recording

---

### Requirement 5: Perhitungan Total Poin Bulanan

**User Story:** Sebagai peserta, saya ingin mengetahui total poin saya setiap bulan, sehingga saya dapat merencanakan redeem hadiah saya.

#### Acceptance Criteria

1. THE System SHALL calculate total monthly points as: (Attendance Points) + (Attitude Points) + (Adzan Count × 10)
2. WHEN a month ends, THE System SHALL reset the monthly counter but preserve historical data
3. THE estimated monthly points per participant SHALL be between 200-250 points (based on 12 sessions/month)
4. THE System SHALL display current month's accumulated points separately from previous months
5. WHEN viewing the dashboard, THE Poin column SHALL show current month's total points

---

### Requirement 6: Game Quiz Keislamanan

**User Story:** Sebagai peserta, saya ingin bermain quiz tentang pengetahuan Islam, sehingga saya dapat mengumpulkan poin tambahan dan meningkatkan pengetahuan agama saya.

#### Acceptance Criteria

1. THE Quiz Module SHALL contain interactive questions about Islamic knowledge
2. WHEN a participant completes a quiz, THE System SHALL calculate the score based on correct answers
3. WHEN a participant answers all questions correctly, THE System SHALL award bonus points
4. THE Quiz points SHALL be added to the participant's total poin in the main tracking system
5. WHEN a participant accesses the quiz, THE System SHALL display the quiz interface separately from the main dashboard
6. THE Quiz SHALL have a minimum of 5 questions per session
7. WHEN a participant completes a quiz, THE System SHALL record the completion timestamp and score

---

### Requirement 7: Integrasi Quiz dengan Sistem Poin

**User Story:** Sebagai admin, saya ingin quiz points terintegrasi dengan sistem poin utama, sehingga total poin peserta akurat dan komprehensif.

#### Acceptance Criteria

1. WHEN a participant completes a quiz, THE System SHALL automatically add quiz points to their total poin
2. THE Quiz points SHALL be visible in the main tracking table under the Poin column
3. THE Dashboard SHALL display a breakdown of point sources (attendance, attitude, adzan, quiz)
4. WHEN viewing participant details, THE System SHALL show quiz history and points earned from quizzes
5. THE Quiz points SHALL be included in the monthly total calculation

---

### Requirement 8: Sistem Redeem Hadiah

**User Story:** Sebagai peserta, saya ingin menukar poin saya dengan Free Fire Diamond, sehingga saya dapat mendapatkan reward atas usaha saya.

#### Acceptance Criteria

1. THE System SHALL offer the following redeem packages:
   - 5 Diamond for 50 points
   - 12 Diamond for 110 points
   - 50 Diamond for 400 points
   - 70 Diamond for 550 points
   - 140 Diamond for 950 points
2. WHEN a participant initiates a redeem, THE System SHALL verify they have sufficient points
3. IF a participant has insufficient points, THEN THE System SHALL display an error message and prevent redeem
4. WHEN a participant successfully redeems, THE System SHALL deduct the corresponding points from their total
5. THE System SHALL record the redeem transaction with timestamp and package details
6. WHEN a redeem is completed, THE System SHALL update the participant's poin immediately

---

### Requirement 9: Batasan Redeem Mingguan

**User Story:** Sebagai admin, saya ingin membatasi redeem maksimal 2x per minggu, sehingga budget tetap terkontrol dan sistem tetap adil.

#### Acceptance Criteria

1. WHEN a participant attempts to redeem, THE System SHALL check their redeem count for the current week
2. IF a participant has already redeemed 2 times in the current week, THEN THE System SHALL prevent further redeem and display a message
3. THE System SHALL reset the weekly redeem counter every Monday at 00:00
4. WHEN a participant successfully redeems, THE System SHALL increment their weekly redeem counter by 1
5. THE System SHALL display the remaining redeem quota for the current week to the participant
6. WHEN viewing redeem history, THE System SHALL show redeem count per week

---

### Requirement 10: Fleksibilitas Waktu Redeem

**User Story:** Sebagai peserta, saya ingin bisa menukar poin kapan saja (selama belum mencapai batas mingguan), sehingga saya memiliki fleksibilitas dalam merencanakan hadiah saya.

#### Acceptance Criteria

1. THE Redeem feature SHALL be available 24/7 without time restrictions
2. WHEN a participant accesses the redeem page, THE System SHALL allow redeem at any time of day
3. WHEN a participant initiates a redeem, THE System SHALL process it immediately regardless of time
4. THE only constraint on redeem SHALL be the weekly limit (2x per week) and sufficient points
5. WHEN a participant completes a redeem, THE System SHALL provide immediate confirmation

---

### Requirement 11: Keamanan dan Validasi Poin

**User Story:** Sebagai admin, saya ingin sistem poin aman dan tidak bisa dimanipulasi, sehingga sistem tetap adil untuk semua peserta.

#### Acceptance Criteria

1. WHEN admin records a transaction (attendance, adzan, redeem), THE System SHALL validate all inputs before processing
2. IF invalid data is detected, THEN THE System SHALL reject the transaction and display an error
3. THE System SHALL maintain an audit log of all point transactions with timestamp and admin who made the change
4. WHEN viewing transaction history, THE System SHALL display all point changes with reason and timestamp
5. THE System SHALL prevent negative point balances (redeem cannot exceed current points)
6. WHEN a redeem is processed, THE System SHALL verify the participant has not exceeded weekly limit before deducting points

---

### Requirement 12: Manajemen Data Peserta

**User Story:** Sebagai admin, saya ingin mengelola data peserta (tambah, edit, hapus), sehingga data peserta selalu akurat dan terkini.

#### Acceptance Criteria

1. THE System SHALL allow admin to add new participants (up to 12 maximum)
2. WHEN admin adds a new participant, THE System SHALL initialize their poin to 0
3. THE System SHALL allow admin to edit participant information (nama, status)
4. WHEN admin edits participant data, THE System SHALL preserve their point history
5. THE System SHALL allow admin to mark participants as "Tidak Aktif" without deleting their data
6. WHEN a participant is marked "Tidak Aktif", THE System SHALL exclude them from active tracking but preserve historical data

---

### Requirement 13: Laporan dan Statistik

**User Story:** Sebagai admin, saya ingin melihat laporan dan statistik performa peserta, sehingga saya dapat mengidentifikasi peserta yang perlu motivasi tambahan.

#### Acceptance Criteria

1. THE System SHALL display monthly statistics including total adzan count, average points per participant, and top performers
2. WHEN viewing the dashboard, THE System SHALL show a summary of current month's performance
3. THE System SHALL allow filtering by participant to view individual performance history
4. WHEN viewing participant details, THE System SHALL display their point breakdown by source (attendance, attitude, adzan, quiz)
5. THE System SHALL display a leaderboard showing top 5 participants by current month's points
6. WHEN exporting data, THE System SHALL provide a CSV or PDF report of all transactions

---

### Requirement 14: Antarmuka Admin

**User Story:** Sebagai admin, saya ingin antarmuka yang sederhana dan mudah digunakan, sehingga saya dapat dengan cepat mencatat kehadiran dan performa peserta.

#### Acceptance Criteria

1. THE Admin Interface SHALL have a simple, clean design with minimal navigation
2. WHEN admin opens the dashboard, THE System SHALL display the tracking table as the primary view
3. THE Admin Interface SHALL provide quick-access buttons for common actions: Record Attendance, Record Adzan, Process Redeem
4. WHEN admin clicks "Record Adzan", THE System SHALL open a form to select participant, attitude rating, and confirm
5. THE Form inputs SHALL be validated in real-time to prevent errors
6. WHEN admin completes an action, THE System SHALL provide immediate visual feedback (success message or error)

---

### Requirement 15: Keamanan Akses

**User Story:** Sebagai admin, saya ingin hanya admin yang bisa mengakses sistem, sehingga data peserta terlindungi dan tidak bisa dimanipulasi oleh peserta.

#### Acceptance Criteria

1. THE System SHALL require admin authentication before accessing any feature
2. WHEN an unauthenticated user tries to access the system, THE System SHALL redirect to login page
3. THE System SHALL use secure password storage (hashed and salted)
4. WHEN admin logs in, THE System SHALL create a session that expires after 24 hours of inactivity
5. THE System SHALL prevent participants from accessing admin features or viewing other participants' detailed data
6. WHEN admin logs out, THE System SHALL clear the session and require re-authentication

---

### Requirement 16: Persistensi Data

**User Story:** Sebagai admin, saya ingin semua data tersimpan dengan aman, sehingga data tidak hilang jika sistem restart atau terjadi masalah teknis.

#### Acceptance Criteria

1. THE System SHALL persist all data (participants, points, transactions) in a database
2. WHEN the system restarts, THE System SHALL load all data from the database without loss
3. THE System SHALL create automatic backups of data at least once per day
4. WHEN a transaction is recorded, THE System SHALL immediately save it to persistent storage
5. THE System SHALL maintain data integrity and prevent corruption
6. WHEN viewing historical data, THE System SHALL retrieve accurate information from the database

---

### Requirement 17: Kompatibilitas Perangkat

**User Story:** Sebagai admin, saya ingin mengakses sistem dari berbagai perangkat (desktop, tablet, mobile), sehingga saya dapat mencatat kehadiran dari mana saja.

#### Acceptance Criteria

1. THE System SHALL be responsive and work on desktop, tablet, and mobile devices
2. WHEN accessed on mobile, THE System SHALL display the table in a mobile-friendly format
3. WHEN accessed on tablet, THE System SHALL display the full table with optimized spacing
4. WHEN accessed on desktop, THE System SHALL display the full table with all columns visible
5. THE System SHALL maintain full functionality across all device types
6. WHEN using touch input on mobile/tablet, THE System SHALL provide appropriate touch-friendly buttons and inputs

---

### Requirement 18: Notifikasi dan Reminder

**User Story:** Sebagai peserta, saya ingin menerima notifikasi tentang poin saya dan redeem status, sehingga saya selalu update dengan progress saya.

#### Acceptance Criteria

1. WHEN a participant earns points, THE System SHALL send a notification with the amount and source
2. WHEN a participant successfully redeems, THE System SHALL send a confirmation notification
3. WHEN a participant reaches a milestone (e.g., 500 points), THE System SHALL send a congratulation notification
4. WHEN a participant's weekly redeem quota resets, THE System SHALL send a reminder notification
5. THE System SHALL allow participants to opt-in/opt-out of notifications
6. WHEN a notification is sent, THE System SHALL record it in the notification history

---

### Requirement 19: Kontrol Budget

**User Story:** Sebagai admin, saya ingin memastikan total hadiah yang ditukar tidak melebihi budget Rp50.000/bulan, sehingga sistem tetap sustainable.

#### Acceptance Criteria

1. THE System SHALL calculate total hadiah cost based on current month's redeem transactions
2. WHEN admin views the dashboard, THE System SHALL display current month's budget usage
3. IF total redeem cost reaches 80% of budget, THEN THE System SHALL display a warning to admin
4. IF total redeem cost reaches 100% of budget, THEN THE System SHALL prevent further redeem and display a message
5. WHEN a new month starts, THE System SHALL reset the budget counter
6. WHEN viewing budget report, THE System SHALL show breakdown of hadiah cost by package type

---

### Requirement 20: Dokumentasi dan Panduan Pengguna

**User Story:** Sebagai admin baru, saya ingin memiliki panduan penggunaan sistem, sehingga saya dapat dengan cepat memahami cara menggunakan sistem.

#### Acceptance Criteria

1. THE System SHALL provide an in-app help section with step-by-step guides
2. WHEN admin hovers over a button or field, THE System SHALL display a tooltip with explanation
3. THE System SHALL include a FAQ section addressing common questions
4. WHEN admin encounters an error, THE System SHALL provide a helpful error message with suggested solutions
5. THE System SHALL provide a quick-start guide for new admins
6. WHEN admin accesses the system for the first time, THE System SHALL display an onboarding tutorial

---

## Constraints and Assumptions

### Technical Constraints
- Budget: Rp50.000/bulan (approximately $3.33 USD)
- Participants: Exactly 12 people
- Sessions: 3x per week (~12 sessions/month)
- Total adzan: ~150 per month (5 per day)
- Estimated points per person: 200-250 points/month

### Business Constraints
- Redeem limited to 2x per week per participant
- Maximum monthly budget for hadiah: Rp50.000
- Hadiah packages fixed (cannot be modified without admin approval)
- System must be fair and transparent to all participants

### Functional Constraints
- System must support exactly 12 participants (no more, no less)
- All point calculations must be deterministic and auditable
- All transactions must be logged for transparency
- System must prevent negative point balances

### Non-Functional Constraints
- System must be simple and easy to use (minimal training required)
- System must be responsive on mobile, tablet, and desktop
- System must maintain data integrity and prevent corruption
- System must be secure and prevent unauthorized access
- System must be available 24/7 for redeem (except during maintenance)

