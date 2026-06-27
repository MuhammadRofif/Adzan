/**
 * Database initialization script
 * Creates necessary tables and indexes for the Adzan Challenge Website
 */

import { query } from './database';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Create participants table
    await query(`
      CREATE TABLE IF NOT EXISTS participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nama VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Baru',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Participants table created');

    // Create adzan_schedule table
    await query(`
      CREATE TABLE IF NOT EXISTS adzan_schedule (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Adzan schedule table created');

    // Create adzan_log table
    await query(`
      CREATE TABLE IF NOT EXISTS adzan_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        prayer_time VARCHAR(50) NOT NULL,
        attitude VARCHAR(50),
        attitude_points INT DEFAULT 0,
        adzan_points INT DEFAULT 0,
        total INT DEFAULT 0,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Adzan log table created');

    // Create attendance_log table
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        prayer_time VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Attendance log table created');

    // Create budget_settings table
    await query(`
      CREATE TABLE IF NOT EXISTS budget_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        total_budget INT NOT NULL DEFAULT 500000,
        month VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Budget settings table created');

    // Create transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        points INT NOT NULL,
        reason VARCHAR(255),
        admin_id UUID REFERENCES users(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Transactions table created');

    // Create redeem_packages table
    await query(`
      CREATE TABLE IF NOT EXISTS redeem_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        diamond INT NOT NULL,
        points_required INT NOT NULL,
        weekly_quota INT NOT NULL DEFAULT 1,
        budget_cost INT NOT NULL DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Redeem packages table created');

    // Create redeem_history table
    await query(`
      CREATE TABLE IF NOT EXISTS redeem_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        package_id UUID NOT NULL REFERENCES redeem_packages(id),
        package_name VARCHAR(255) NOT NULL,
        points_spent INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processed_by VARCHAR(255)
      );
    `);
    console.log('✓ Redeem history table created');

    // Create quizzes table
    await query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        questions JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Quizzes table created');

    // Create quiz_attempts table
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        quiz_id UUID NOT NULL REFERENCES quizzes(id),
        score INT NOT NULL,
        earned_points INT NOT NULL,
        answers JSONB NOT NULL DEFAULT '[]',
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Quiz attempts table created');

    // Create seasons table
    await query(`
      CREATE TABLE IF NOT EXISTS seasons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Seasons table created');

    // Create season_history table
    await query(`
      CREATE TABLE IF NOT EXISTS season_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        final_points INT NOT NULL,
        rank INT NOT NULL,
        badge VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(season_id, participant_id)
      );
    `);
    console.log('✓ Season history table created');

    // Create indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_points_participant_id ON points(participant_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_points_month_year ON points(month, year);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_participant_id ON transactions(participant_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_redeem_history_participant_id ON redeem_history(participant_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_participant_id ON quiz_attempts(participant_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_season_history_participant_id ON season_history(participant_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_season_history_season_id ON season_history(season_id);`);
    console.log('✓ Indexes created');

    console.log('✓ Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database ready');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}
