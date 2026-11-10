-- Migration 005: Add Tenant-Specific Google Sheet & Calendar Booking Integrations

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS google_sheet_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS booking_calendar_url TEXT,
ADD COLUMN IF NOT EXISTS calendar_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS notification_email VARCHAR(255);

