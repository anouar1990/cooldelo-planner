import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '../lib/database.types';

export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type TimeLogRow = Database['public']['Tables']['project_time_logs']['Row'];
export type TimeLogInsert = Database['public']['Tables']['project_time_logs']['Insert'];

export function useProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<ProjectRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                // Filter by the authenticated user — never expose other users' projects
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const addProject = async (project: Omit<ProjectInsert, 'user_id'>) => {
        if (!user) return { error: 'Not authenticated' };

        try {
            const { data, error } = await supabase
                .from('projects')
                .insert({ ...project, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setProjects(prev => [data, ...prev]);
            }
            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    };

    const updateProject = async (id: string, updates: ProjectUpdate) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setProjects(prev => prev.map(p => p.id === id ? data : p));
            }
            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    };

    const deleteProject = async (id: string) => {
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProjects(prev => prev.filter(p => p.id !== id));
            return { error: null };
        } catch (err: any) {
            return { error: err.message };
        }
    };

    const getProjectTimeLogs = async (projectId: string) => {
        try {
            const { data, error } = await supabase
                .from('project_time_logs')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    };

    const addTimeLog = async (log: TimeLogInsert) => {
        try {
            const { data, error } = await supabase
                .from('project_time_logs')
                .insert(log)
                .select()
                .single();

            if (error) throw error;

            // Note: we should also update the project's time_elapsed
            if (data && log.duration_seconds && log.project_id) {
                const project = projects.find(p => p.id === log.project_id);
                if (project) {
                    const newTotal = (project.time_elapsed || 0) + log.duration_seconds;
                    await updateProject(log.project_id, { time_elapsed: newTotal });
                }
            }

            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        }
    };

    const deleteTimeLog = async (logId: string, projectId: string, durationSeconds: number) => {
        try {
            const { error } = await supabase
                .from('project_time_logs')
                .delete()
                .eq('id', logId);

            if (error) throw error;

            // Update the project's time_elapsed
            const project = projects.find(p => p.id === projectId);
            if (project) {
                const newTotal = Math.max(0, (project.time_elapsed || 0) - durationSeconds);
                await updateProject(projectId, { time_elapsed: newTotal });
            }

            return { error: null };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    return {
        projects,
        loading,
        error,
        refetch: fetchProjects,
        addProject,
        updateProject,
        deleteProject,
        getProjectTimeLogs,
        addTimeLog,
        deleteTimeLog
    };
}
