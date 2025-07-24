# Supabase Setup for Draft Collaboration System

This guide walks you through setting up Supabase for the draft blog post collaboration feature.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `notion-blog-drafts` (or your preferred name)
   - **Database Password**: Generate a secure password and save it
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (~2 minutes)

## 2. Get Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Project API Key** → **anon/public** (starts with `eyJ...`)

3. Add these to your `.env.local` file:
```bash
# Add to your existing .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

## 3. Create Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the SQL schema below
4. Click "Run" to execute

## Database Schema

```sql
-- Create draft_tokens table for managing draft access
CREATE TABLE draft_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notion_page_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT, -- Could be email or identifier
  view_count INTEGER DEFAULT 0
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_token_id UUID REFERENCES draft_tokens(id) ON DELETE CASCADE,
  notion_page_id TEXT NOT NULL,
  block_id TEXT, -- Notion block ID that comment is attached to
  block_position INTEGER, -- Position within the block for precise targeting
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  author_color TEXT DEFAULT '#3B82F6', -- Color for author identification
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE -- For replies
);

-- Create comment_sessions table for tracking active users
CREATE TABLE comment_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_token_id UUID REFERENCES draft_tokens(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  author_name TEXT NOT NULL,
  author_color TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_draft_tokens_token ON draft_tokens(token);
CREATE INDEX idx_draft_tokens_notion_page_id ON draft_tokens(notion_page_id);
CREATE INDEX idx_comments_draft_token_id ON comments(draft_token_id);
CREATE INDEX idx_comments_block_id ON comments(block_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comment_sessions_draft_token_id ON comment_sessions(draft_token_id);
CREATE INDEX idx_comment_sessions_session_id ON comment_sessions(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE draft_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for draft_tokens (allow read access for valid tokens)
CREATE POLICY "Allow public read access to active draft tokens" ON draft_tokens
  FOR SELECT USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Allow insert of new draft tokens" ON draft_tokens
  FOR INSERT WITH CHECK (TRUE);

-- RLS Policies for comments (allow read/write for users with valid draft access)
CREATE POLICY "Allow public read access to comments" ON comments
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow public insert of comments" ON comments
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow public update of comments" ON comments
  FOR UPDATE USING (TRUE);

-- RLS Policies for comment_sessions
CREATE POLICY "Allow public read access to comment sessions" ON comment_sessions
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow public insert/update of comment sessions" ON comment_sessions
  FOR ALL USING (TRUE);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE comment_sessions 
  SET is_active = FALSE 
  WHERE last_seen < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create function to update comment timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Enable Realtime

1. Go to **Database** → **Replication** in your Supabase dashboard
2. Find the tables: `comments` and `comment_sessions`
3. Toggle **Enable Realtime** for both tables
4. Click **Save**

## 5. Configure Storage (Optional - for future avatar uploads)

1. Go to **Storage** in your Supabase dashboard
2. Click "Create a new bucket"
3. Name: `avatars`
4. Set as **Public bucket**
5. Click **Save**

## 6. Test Connection

After completing the setup, you can test the connection by running:

```bash
npm run dev
```

And visiting: `http://localhost:3000/api/test-supabase` (we'll create this endpoint)

## Next Steps

1. Complete the Supabase setup above
2. Update your `.env.local` with the credentials
3. We'll create the draft pages and commenting system
4. Test with a real Notion draft post

## Security Notes

- The current setup uses RLS policies that allow public access for simplicity
- In production, you might want to implement JWT-based authentication
- Consider adding rate limiting for comment creation
- The anonymous system uses session-based tracking for now
