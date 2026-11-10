-- Migration 013: Add TRAINEE to user_role ENUM for Granular Intern Access Control
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TRAINEE';

