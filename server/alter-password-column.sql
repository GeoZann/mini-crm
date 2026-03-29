-- SQL Script to expand Password column for bcrypt hashing
-- Run this in your SQL Server Management Studio

USE MiniCRM;

-- Alter the Users table to increase Password column size
ALTER TABLE Users
ALTER COLUMN Password NVARCHAR(MAX);

-- Verify the column size has been updated
EXEC sp_help 'Users';
