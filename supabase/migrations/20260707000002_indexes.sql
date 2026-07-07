-- Create database indexes to optimize query speed and efficiency
CREATE INDEX IF NOT EXISTS idx_complaints_tracking_id ON complaints (tracking_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints (category);
