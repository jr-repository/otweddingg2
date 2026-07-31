CREATE DATABASE IF NOT EXISTS `otweddingg_rsvp`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `otweddingg_rsvp`;

CREATE TABLE IF NOT EXISTS `RsvpSubmissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NULL,
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(190) NOT NULL,
  `attending` ENUM('yes', 'no') NOT NULL,
  `guests` TINYINT UNSIGNED NULL,
  `submitted_at` DATETIME NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rsvp_email` (`email`),
  KEY `idx_rsvp_attending_submitted_at` (`attending`, `submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
