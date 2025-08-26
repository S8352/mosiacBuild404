-- Job Copilot Database Initialization Script
-- This script sets up the database schema for the Job Copilot application

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create question_answers table for the learning loop
CREATE TABLE IF NOT EXISTS question_answers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
    question_text TEXT NOT NULL,
    question_embedding vector(1536),
    answer_text TEXT NOT NULL,
    canonical_field_name VARCHAR(255),
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS question_answers_embedding_idx 
ON question_answers USING ivfflat (question_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS question_answers_user_idx ON question_answers(user_id);
CREATE INDEX IF NOT EXISTS question_answers_field_idx ON question_answers(canonical_field_name);

-- Create applications table for tracking
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
    job_title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    job_url TEXT,
    status VARCHAR(50) DEFAULT 'applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create index for applications
CREATE INDEX IF NOT EXISTS applications_user_idx ON applications(user_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS applications_date_idx ON applications(applied_at);

-- Create user_profiles table (for future use)
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    profile_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user profiles
CREATE INDEX IF NOT EXISTS user_profiles_user_idx ON user_profiles(user_id);

-- Insert some sample data for testing
INSERT INTO question_answers (question_text, question_embedding, answer_text, canonical_field_name) VALUES
('What is your expected salary?', '[0.1, 0.2, 0.3]', '$80,000 - $100,000', 'salary'),
('When can you start?', '[0.2, 0.3, 0.4]', 'I can start in 2 weeks', 'availability'),
('Do you have work authorization?', '[0.3, 0.4, 0.5]', 'Yes, I am authorized to work in the US', 'visa')
ON CONFLICT DO NOTHING;
