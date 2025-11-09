-- Create documents table to store uploaded documents and their analysis
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT, -- URL to stored file in Supabase Storage
    summary TEXT NOT NULL,
    pros JSONB DEFAULT '[]'::jsonb,
    cons JSONB DEFAULT '[]'::jsonb,
    potential_loopholes JSONB DEFAULT '[]'::jsonb,
    potential_challenges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own documents
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create chat_history table to store user chat conversations
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID DEFAULT gen_random_uuid() NOT NULL, -- Groups messages in a conversation session
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session ON chat_history(user_id, session_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own chat history
CREATE POLICY "Users can view own chat history"
    ON chat_history FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat messages
CREATE POLICY "Users can insert own chat messages"
    ON chat_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chat messages
CREATE POLICY "Users can update own chat messages"
    ON chat_history FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own chat messages
CREATE POLICY "Users can delete own chat messages"
    ON chat_history FOR DELETE
    USING (auth.uid() = user_id);

-- Create chat_sessions table to store metadata about chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID UNIQUE NOT NULL,
    title TEXT, -- Optional title for the conversation (e.g., first user message or generated title)
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for chat sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own chat sessions
CREATE POLICY "Users can view own chat sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat sessions
CREATE POLICY "Users can insert own chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chat sessions
CREATE POLICY "Users can update own chat sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
    ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update message_count in chat_sessions
CREATE OR REPLACE FUNCTION update_chat_session_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET message_count = (
        SELECT COUNT(*) FROM chat_history
        WHERE session_id = NEW.session_id
    ),
    updated_at = NOW()
    WHERE session_id = NEW.session_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update chat_sessions when chat_history changes
CREATE TRIGGER update_chat_session_count_after_insert
    AFTER INSERT ON chat_history
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_count();

CREATE TRIGGER update_chat_session_count_after_delete
    AFTER DELETE ON chat_history
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_count();

