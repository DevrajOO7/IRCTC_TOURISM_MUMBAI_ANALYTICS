-- Add remarks and remarks_updated_at columns to passengers table
ALTER TABLE passengers 
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS remarks_updated_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN passengers.remarks IS 'Notes/remarks for targeting and follow-up';
COMMENT ON COLUMN passengers.remarks_updated_at IS 'Timestamp when remarks were last updated';
