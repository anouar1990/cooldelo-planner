import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AIConversation {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface AIMessage {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
    created_at: string;
    isOptimistic?: boolean; // client-only flag for optimistic rendering
}

interface SendMessageResult {
    success: boolean;
    conversationId?: string;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useLaserExpert() {
    const { session, user } = useAuth();
    const [conversations, setConversations] = useState<AIConversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [conversationsLoading, setConversationsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // ─── FETCH CONVERSATIONS ───────────────────────────────────────
    const fetchConversations = useCallback(async () => {
        if (!session?.user) {
            setConversations([]);
            setConversationsLoading(false);
            return;
        }
        try {
            setConversationsLoading(true);
            const { data, error: fetchError } = await supabase
                .from('ai_conversations')
                .select('id, title, created_at, updated_at')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false })
                .limit(50);

            if (fetchError) throw fetchError;
            setConversations((data as AIConversation[]) ?? []);
        } catch (err: any) {
            console.warn('Failed to fetch AI conversations:', err.message);
        } finally {
            setConversationsLoading(false);
        }
    }, [session?.user]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // ─── FETCH MESSAGES FOR ACTIVE CONVERSATION ────────────────────
    const fetchMessages = useCallback(async (conversationId: string) => {
        if (!session?.user) return;
        try {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('ai_messages')
                .select('id, conversation_id, role, content, metadata, created_at')
                .eq('conversation_id', conversationId)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: true })
                .limit(200);

            if (fetchError) throw fetchError;
            setMessages((data as AIMessage[]) ?? []);
        } catch (err: any) {
            console.warn('Failed to fetch AI messages:', err.message);
            setError('Failed to load conversation history.');
        } finally {
            setLoading(false);
        }
    }, [session?.user]);

    // ─── SELECT CONVERSATION ───────────────────────────────────────
    const selectConversation = useCallback((conversationId: string | null) => {
        setActiveConversationId(conversationId);
        setMessages([]);
        setError(null);
        if (conversationId) {
            fetchMessages(conversationId);
        }
    }, [fetchMessages]);

    // ─── NEW CONVERSATION ──────────────────────────────────────────
    const newConversation = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
        setError(null);
    }, []);

    // ─── DELETE CONVERSATION ───────────────────────────────────────
    const deleteConversation = useCallback(async (conversationId: string) => {
        if (!session?.user) return;
        try {
            // Delete messages first (cascade should handle this, but be safe)
            await supabase
                .from('ai_messages')
                .delete()
                .eq('conversation_id', conversationId)
                .eq('user_id', session.user.id);

            const { error: delError } = await supabase
                .from('ai_conversations')
                .delete()
                .eq('id', conversationId)
                .eq('user_id', session.user.id);

            if (delError) throw delError;

            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
                setMessages([]);
            }
        } catch (err: any) {
            console.warn('Failed to delete conversation:', err.message);
        }
    }, [session?.user, activeConversationId]);

    // ─── RENAME CONVERSATION ───────────────────────────────────────
    const renameConversation = useCallback(async (conversationId: string, title: string) => {
        if (!session?.user) return;
        try {
            const { error: updateError } = await supabase
                .from('ai_conversations')
                .update({ title: title.trim().slice(0, 255) })
                .eq('id', conversationId)
                .eq('user_id', session.user.id);

            if (updateError) throw updateError;

            setConversations(prev =>
                prev.map(c => c.id === conversationId ? { ...c, title: title.trim().slice(0, 255) } : c)
            );
        } catch (err: any) {
            console.warn('Failed to rename conversation:', err.message);
        }
    }, [session?.user]);

    // ─── SEND MESSAGE ──────────────────────────────────────────────
    const sendMessage = useCallback(async (messageText: string): Promise<SendMessageResult> => {
        if (!session?.user) return { success: false, error: 'Not authenticated' };
        if (!messageText.trim()) return { success: false, error: 'Message is empty' };
        if (sending) return { success: false, error: 'Already sending' };

        setSending(true);
        setError(null);

        // Optimistic user message
        const optimisticUserMsg: AIMessage = {
            id: 'optimistic_user_' + Date.now(),
            conversation_id: activeConversationId || 'pending',
            role: 'user',
            content: messageText.trim(),
            created_at: new Date().toISOString(),
            isOptimistic: true,
        };
        setMessages(prev => [...prev, optimisticUserMsg]);

        try {
            // Cancel any previous in-flight request
            if (abortRef.current) {
                abortRef.current.abort();
            }
            abortRef.current = new AbortController();

            const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
                body: {
                    conversation_id: activeConversationId || undefined,
                    message: messageText.trim(),
                },
            });

            if (fnError) {
                // Parse the error message from the edge function
                let errorMsg = 'The Laser Expert is temporarily unavailable. Please try again in a moment.';
                try {
                    if (typeof fnError.message === 'string') {
                        // Try to extract JSON error from the function response
                        const parsed = JSON.parse(fnError.message);
                        if (parsed.error) errorMsg = parsed.error;
                    }
                } catch {
                    // Check if the context contains a parseable error body
                    if (fnError.context && typeof fnError.context === 'object') {
                        try {
                            const body = await (fnError.context as any).json?.();
                            if (body?.error) errorMsg = body.error;
                        } catch {}
                    }
                }
                // Remove optimistic message on error
                setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
                setError(errorMsg);
                return { success: false, error: errorMsg };
            }

            if (!data || !data.message) {
                setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
                setError('Empty response from AI.');
                return { success: false, error: 'Empty response' };
            }

            const newConversationId = data.conversation_id;

            // If this created a new conversation, update state
            if (!activeConversationId && newConversationId) {
                setActiveConversationId(newConversationId);
                // Refresh conversation list to show the new one
                fetchConversations();
            }

            // Replace optimistic message and add assistant response
            // We need to re-fetch messages from DB to get proper IDs
            if (newConversationId) {
                await fetchMessages(newConversationId);
            }

            return { success: true, conversationId: newConversationId };
        } catch (err: any) {
            console.error('Send message error:', err);
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
            const errorMsg = 'The Laser Expert is temporarily unavailable. Please try again in a moment. Your other 0machine tools are still available.';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setSending(false);
            abortRef.current = null;
        }
    }, [session?.user, activeConversationId, sending, fetchConversations, fetchMessages]);

    // ─── RETRY LAST MESSAGE ────────────────────────────────────────
    const retryLastMessage = useCallback(async () => {
        if (!activeConversationId || messages.length === 0) return;

        // Find the last user message
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) return;

        // Remove the last assistant response (if any) and the user message
        const lastAssistantIdx = messages.length - 1;
        if (messages[lastAssistantIdx]?.role === 'assistant') {
            // Delete assistant message from DB
            await supabase
                .from('ai_messages')
                .delete()
                .eq('id', messages[lastAssistantIdx].id);
        }

        // Delete the user message from DB and resend
        await supabase
            .from('ai_messages')
            .delete()
            .eq('id', lastUserMsg.id);

        // Remove from local state
        setMessages(prev => {
            const filtered = prev.filter(m =>
                m.id !== lastUserMsg.id &&
                (messages[lastAssistantIdx]?.role === 'assistant' ? m.id !== messages[lastAssistantIdx].id : true)
            );
            return filtered;
        });

        // Resend
        await sendMessage(lastUserMsg.content);
    }, [activeConversationId, messages, sendMessage]);

    return {
        // Conversations
        conversations,
        conversationsLoading,
        activeConversationId,
        fetchConversations,
        selectConversation,
        newConversation,
        deleteConversation,
        renameConversation,

        // Messages
        messages,
        loading,
        sending,
        error,
        sendMessage,
        retryLastMessage,
        setError,
    };
}
