import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    created_at: string;
}

export function useClients() {
    const { session } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Renamed from 'fetch' to avoid shadowing the global fetch API
    const fetchClients = useCallback(async () => {
        if (!session?.user) {
            // Clear loading state so callers aren't stuck waiting forever
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('*')
                // Filter by user — each user only sees their own clients
                .eq('user_id', session.user.id)
                .order('name');
            if (fetchError) throw fetchError;
            setClients(data ?? []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session?.user]);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    const addClient = async (input: Omit<Client, 'id' | 'created_at'>) => {
        if (!session?.user) return { error: new Error('Not authenticated') };
        const { data, error } = await supabase
            .from('clients')
            .insert({ ...input, user_id: session.user.id })
            .select()
            .single();
        if (!error && data) setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        return { data, error };
    };

    const updateClient = async (id: string, updates: Partial<Client>) => {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (!error && data) setClients(prev => prev.map(c => c.id === id ? data : c));
        return { data, error };
    };

    const deleteClient = async (id: string) => {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (!error) setClients(prev => prev.filter(c => c.id !== id));
        return { error };
    };

    return { clients, loading, error, refetch: fetchClients, addClient, updateClient, deleteClient };
}
