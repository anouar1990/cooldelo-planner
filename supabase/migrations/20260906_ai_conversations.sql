-- Migration: 20260906_ai_conversations.sql
-- Description: Create tables for 0machine Laser Expert AI chatbot
-- Tables: ai_conversations, ai_messages, ai_usage

-- ═══════════════════════════════════════════════════════════════════
-- 1. AI CONVERSATIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON public.ai_conversations(updated_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.ai_conversations;

CREATE POLICY "Users can read own conversations"
ON public.ai_conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
ON public.ai_conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.ai_conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.ai_conversations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 2. AI MESSAGES
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON public.ai_messages(user_id);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.ai_messages;

CREATE POLICY "Users can read own messages"
ON public.ai_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
ON public.ai_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
ON public.ai_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 3. AI USAGE TRACKING
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
    request_id VARCHAR(64) NOT NULL,
    model VARCHAR(100) NOT NULL,
    provider VARCHAR(50) DEFAULT 'deepseek',
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    input_cost NUMERIC(12,8) DEFAULT 0,
    output_cost NUMERIC(12,8) DEFAULT 0,
    total_cost NUMERIC(12,8) DEFAULT 0,
    feature VARCHAR(50) DEFAULT 'laser_expert',
    latency_ms INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_conversation ON public.ai_usage(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly ON public.ai_usage(user_id, created_at);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own usage" ON public.ai_usage;

CREATE POLICY "Users can read own usage"
ON public.ai_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can insert usage records (from edge function)
-- No insert policy for authenticated users — only the edge function (service role) writes usage

-- ═══════════════════════════════════════════════════════════════════
-- 4. AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_ai_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.ai_conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_message_update_conversation ON public.ai_messages;

CREATE TRIGGER trg_ai_message_update_conversation
AFTER INSERT ON public.ai_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_conversation_timestamp();
