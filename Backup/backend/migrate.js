/**
 * Database Migration Script
 * Adds new columns and tables to existing database
 */

require('dotenv').config();
const { sequelize } = require('./src/models');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully!\n');
    console.log('Starting migration...');

    // Add lastLoginAt column to users table if it doesn't exist
    try {
      await sequelize.query('ALTER TABLE users ADD COLUMN lastLoginAt DATETIME NULL');
      console.log('✓ Added lastLoginAt column to users table');
    } catch (e) {
      if (e.message.includes('Duplicate')) {
        console.log('✓ lastLoginAt column already exists');
      } else {
        console.log('⚠ Could not add lastLoginAt:', e.message);
      }
    }

    // Create audit_logs table if it doesn't exist
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          userId INT UNSIGNED NULL,
          userName VARCHAR(255),
          userRole VARCHAR(50),
          action VARCHAR(100) NOT NULL,
          resource VARCHAR(100),
          resourceId INT UNSIGNED,
          description TEXT,
          oldValue JSON,
          newValue JSON,
          ipAddress VARCHAR(45),
          userAgent TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ audit_logs table ready');
    } catch (e) {
      console.log('⚠ audit_logs:', e.message);
    }

    // Create api_logs table if it doesn't exist
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS api_logs (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          userId INT UNSIGNED NULL,
          method VARCHAR(10) NOT NULL,
          endpoint VARCHAR(500) NOT NULL,
          statusCode INT,
          responseTime INT,
          requestBody JSON,
          responseBody JSON,
          ipAddress VARCHAR(45),
          userAgent TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ api_logs table ready');
    } catch (e) {
      console.log('⚠ api_logs:', e.message);
    }

    // Create system_configs table if it doesn't exist
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS system_configs (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          maintenanceMode TINYINT(1) DEFAULT 0,
          maintenanceMessage VARCHAR(500) DEFAULT 'System is under maintenance. Please try again later.',
          companyName VARCHAR(255) DEFAULT 'Role Based App',
          companyLogo VARCHAR(500),
          footerText VARCHAR(500) DEFAULT '© 2024 Role Based App. All rights reserved.',
          debugMode TINYINT(1) DEFAULT 0,
          apiLoggingEnabled TINYINT(1) DEFAULT 1,
          errorTrackingEnabled TINYINT(1) DEFAULT 1,
          dataRetentionDays INT DEFAULT 90,
          backupEnabled TINYINT(1) DEFAULT 0,
          backupFrequency VARCHAR(50) DEFAULT 'daily',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ system_configs table ready');
    } catch (e) {
      console.log('⚠ system_configs:', e.message);
    }

    // Insert default system config if not exists
    try {
      const [rows] = await sequelize.query('SELECT COUNT(*) as count FROM system_configs');
      if (rows[0].count === 0) {
        await sequelize.query('INSERT INTO system_configs (maintenanceMode) VALUES (0)');
        console.log('✓ Default system config created');
      } else {
        console.log('✓ System config already exists');
      }
    } catch (e) {
      console.log('⚠ Default config:', e.message);
    }

    console.log('\n✓ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
