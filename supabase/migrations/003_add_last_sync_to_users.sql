-- Add last_sync column to users table
-- Migration: 003_add_last_sync_to_users.sql
-- Use this if the users table already exists without the last_sync column

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_sync') THEN
        ALTER TABLE users ADD COLUMN last_sync TIMESTAMPTZ;
    END IF;
END $$; 