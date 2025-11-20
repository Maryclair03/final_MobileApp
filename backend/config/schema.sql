-- Little Watch Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS littlewatch_db;
USE littlewatch_db;

-- Users table (parents/guardians)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Children table (babies being monitored)
CREATE TABLE IF NOT EXISTS children (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  blood_type VARCHAR(5),
  allergies TEXT,
  medical_notes TEXT,
  device_id VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_device_id (device_id)
);

-- Vital signs readings
CREATE TABLE IF NOT EXISTS vital_readings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  child_id INT NOT NULL,
  heart_rate INT,
  temperature DECIMAL(4,2),
  oxygen_saturation INT,
  movement_status ENUM('none', 'low', 'normal', 'high') DEFAULT 'normal',
  battery_level INT,
  device_connected BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  INDEX idx_child_timestamp (child_id, timestamp),
  INDEX idx_timestamp (timestamp)
);

-- Sleep patterns
CREATE TABLE IF NOT EXISTS sleep_patterns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  child_id INT NOT NULL,
  sleep_start TIMESTAMP NOT NULL,
  sleep_end TIMESTAMP,
  duration_minutes INT,
  quality ENUM('poor', 'fair', 'good', 'excellent'),
  interruptions INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  INDEX idx_child_sleep (child_id, sleep_start)
);

-- Alerts and notifications
CREATE TABLE IF NOT EXISTS alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  child_id INT NOT NULL,
  alert_type ENUM('heart_rate', 'temperature', 'oxygen', 'movement', 'battery', 'device_disconnected') NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  message TEXT NOT NULL,
  value VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  INDEX idx_child_alerts (child_id, created_at),
  INDEX idx_unread (is_read, created_at)
);

-- Threshold settings (customizable alerts)
CREATE TABLE IF NOT EXISTS threshold_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  child_id INT NOT NULL,
  heart_rate_min INT DEFAULT 90,
  heart_rate_max INT DEFAULT 140,
  temperature_min DECIMAL(4,2) DEFAULT 36.0,
  temperature_max DECIMAL(4,2) DEFAULT 37.5,
  oxygen_min INT DEFAULT 95,
  alert_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  UNIQUE KEY unique_child_threshold (child_id)
);

-- Device information
CREATE TABLE IF NOT EXISTS devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  device_name VARCHAR(100),
  firmware_version VARCHAR(20),
  last_sync TIMESTAMP,
  battery_level INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_device_id (device_id)
);

-- Activity log (for tracking user actions)
CREATE TABLE IF NOT EXISTS activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_activity (user_id, created_at)
);

-- Insert sample data for testing
INSERT INTO users (name, email, password) VALUES
('John Doe', 'john@example.com', '$2a$10$example_hashed_password_here');

-- Note: Password above is a placeholder. Use proper bcrypt hashing in your application.
