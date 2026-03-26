import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '../lib/database.types';

export type MaterialRow = Database['public']['Tables']['materials']['Row'];
export type MaterialInsert = Database['public']['Tables']['materials']['Insert'];
export type MaterialUpdate = Database['public']['Tables']['materials']['Update'];

export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];

export function useMaterials() {
    const { user } = useAuth();
    const [materials, setMaterials] = useState<MaterialRow[]>([]);
    const [hourlyRate, setHourlyRate] = useState<number>(25.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) {
            setMaterials([]);
            setHourlyRate(25.0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch materials
            const { data: matsData, error: matsError } = await supabase
                .from('materials')
                .select('*')
                // Filter by user — each user should only see their own material library
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (matsError) throw matsError;

            // If user has no mats, maybe we can inject defaults later, 
            // but for now just set what they have.
            setMaterials(matsData || []);

            // Fetch user settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
                // PGRST116 is "No rows found", which is fine, might happen on first load 
                // before trigger runs or for existing users.
                throw settingsError;
            }

            if (settingsData && settingsData.hourly_rate !== null) {
                setHourlyRate(settingsData.hourly_rate);
            } else if (!settingsData) {
                // Create default settings if not exists (for users created before the trigger was added)
                const { data: newSettings, error: insertError } = await supabase
                    .from('user_settings')
                    .insert({ user_id: user.id, hourly_rate: 25.0 })
                    .select()
                    .single();

                if (!insertError && newSettings) {
                    setHourlyRate(newSettings.hourly_rate);
                }
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addMaterial = async (material: Omit<MaterialInsert, 'user_id'>) => {
        if (!user) return { error: 'Not authenticated' };

        try {
            const { data, error } = await supabase
                .from('materials')
                .insert({ ...material, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setMaterials(prev => [...prev, data]);
            }
            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    };

    const updateMaterial = async (id: string, updates: MaterialUpdate) => {
        try {
            const { data, error } = await supabase
                .from('materials')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setMaterials(prev => prev.map(m => m.id === id ? data : m));
            }
            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    };

    const deleteMaterial = async (id: string) => {
        try {
            const { error } = await supabase
                .from('materials')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMaterials(prev => prev.filter(m => m.id !== id));
            return { error: null };
        } catch (err: any) {
            return { error: err.message };
        }
    };

    const updateHourlyRate = async (rate: number) => {
        if (!user) return { error: 'Not authenticated' };
        try {
            const { error } = await supabase
                .from('user_settings')
                .update({ hourly_rate: rate })
                .eq('user_id', user.id);

            if (error) throw error;
            setHourlyRate(rate);
            return { error: null };
        } catch (err: any) {
            return { error: err.message };
        }
    };

    return {
        materials,
        hourlyRate,
        loading,
        error,
        refetch: fetchData,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        updateHourlyRate
    };
}
