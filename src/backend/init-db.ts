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

    // Create points table
    await query(`
      CREATE TABLE IF NOT EXISTS points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        attendance INT DEFAULT 0,
        attitude INT DEFAULT 0,
        adzan INT DEFAULT 0,
        quiz INT DEFAULT 0,
        total INT DEFAULT 0,
        month INT NOT NULL,
        year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(participant_id, month, year)
      );
    `);
    console.log('✓ Points table created');

    // Create transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        points INT NOT NULL,
        reason VARCHAR(255),
        admin_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Transactions table created');

    // Create redeem_packages table
    await query(`
      CREATE TABLE IF NOT EXISTS redeem_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        diamond INT NOT NULL,
        points INT NOT NULL,
        cost_in_rupiah INT NOT NULL,
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
        points_deducted INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Redeem history table created');

    // Create quizzes table
    await query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Quizzes table created');

    // Create questions table
    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        options TEXT[] NOT NULL,
        correct_answer INT NOT NULL,
        "order" INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Questions table created');

    // Create quiz_attempts table
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        quiz_id UUID NOT NULL REFERENCES quizzes(id),
        score INT NOT NULL,
        points_earned INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Quiz attempts table created');

    // Create indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_points_participant_id ON points(participant_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_points_month_year ON points(month, year);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_participant_id ON transactions(participant_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_redeem_history_participant_id ON redeem_history(participant_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_participant_id ON quiz_attempts(participant_id);`);
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
