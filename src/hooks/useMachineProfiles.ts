import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface MachineProfile {
    id: string;
    name: string;
    type: 'laser' | 'cnc' | 'vinyl' | 'other';
    speed?: number;
    power?: number;
    notes?: string;
    created_at: string;
}

export function useMachineProfiles() {
    const { session } = useAuth();
    const [machines, setMachines] = useState<MachineProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Renamed from 'fetch' to avoid shadowing the global fetch API
    const fetchMachines = useCallback(async () => {
        if (!session?.user) {
            // Clear loading state so callers aren't stuck waiting forever
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('machine_profiles')
                .select('*')
                // Filter by user — each user only sees their own machines
                .eq('user_id', session.user.id)
                .order('name');
            if (fetchError) throw fetchError;
            setMachines((data as MachineProfile[]) ?? []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session?.user]);

    useEffect(() => { fetchMachines(); }, [fetchMachines]);

    const addMachine = async (input: Omit<MachineProfile, 'id' | 'created_at'>) => {
        if (!session?.user) return { error: new Error('Not authenticated') };
        const { data, error } = await supabase
            .from('machine_profiles')
            .insert({ ...input, user_id: session.user.id })
            .select()
            .single();
        if (!error && data) setMachines(prev => [...prev, data as MachineProfile]);
        return { data, error };
    };

    const updateMachine = async (id: string, updates: Partial<MachineProfile>) => {
        const { data, error } = await supabase
            .from('machine_profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (!error && data) setMachines(prev => prev.map(m => m.id === id ? data as MachineProfile : m));
        return { data, error };
    };

    const deleteMachine = async (id: string) => {
        const { error } = await supabase.from('machine_profiles').delete().eq('id', id);
        if (!error) setMachines(prev => prev.filter(m => m.id !== id));
        return { error };
    };

    return { machines, loading, error, refetch: fetchMachines, addMachine, updateMachine, deleteMachine };
}
