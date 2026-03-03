import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProjectStatus = 'planned' | 'in-progress' | 'completed';

export interface Material {
    id: string;
    name: string;
    type: string;
    thickness: number;
    costPerUnit: number;
}

export interface TimeLog {
    id: string;
    start: string; // ISO string
    end: string;   // ISO string
    durationSeconds: number;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    status: ProjectStatus;
    imageUri?: string;
    machine?: string;
    materialId?: string;
    materialThickness?: number;    // mm, can override
    materialCostPerUnit?: number;  // $/sqft, can override
    materialQuantity?: number;      // sqft
    timeLogs: TimeLog[];
    timeElapsed: number; // total seconds (sum of timeLogs)
    createdAt: string;
    updatedAt: string;
}

interface AppState {
    projects: Project[];
    materials: Material[];
    hourlyRate: number;
    addProject: (project: Project) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    addTimeLog: (id: string, log: TimeLog) => void;
    deleteTimeLog: (id: string, logId: string) => void;
    addMaterial: (material: Material) => void;
    setHourlyRate: (rate: number) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            projects: [],
            materials: [
                { id: '1', name: 'Birch Plywood', type: 'wood', thickness: 3.2, costPerUnit: 1.2 },
                { id: '2', name: 'Clear Acrylic', type: 'acrylic', thickness: 5.0, costPerUnit: 2.1 },
                { id: '3', name: 'Vegetable Leather', type: 'leather', thickness: 2.0, costPerUnit: 3.5 },
                { id: '4', name: 'MDF Board', type: 'mdf', thickness: 6.0, costPerUnit: 0.8 },
                { id: '5', name: 'Slate Tile', type: 'stone', thickness: 8.0, costPerUnit: 4.2 },
            ],
            hourlyRate: 25.0,

            addProject: (project) =>
                set((state) => ({ projects: [project, ...state.projects] })),

            updateProject: (id, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
                    ),
                })),

            deleteProject: (id) =>
                set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

            addTimeLog: (id, log) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== id) return p;
                        const timeLogs = [...p.timeLogs, log];
                        const timeElapsed = timeLogs.reduce((acc, l) => acc + l.durationSeconds, 0);
                        return { ...p, timeLogs, timeElapsed, updatedAt: new Date().toISOString() };
                    }),
                })),

            deleteTimeLog: (id, logId) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== id) return p;
                        const timeLogs = p.timeLogs.filter((l) => l.id !== logId);
                        const timeElapsed = timeLogs.reduce((acc, l) => acc + l.durationSeconds, 0);
                        return { ...p, timeLogs, timeElapsed, updatedAt: new Date().toISOString() };
                    }),
                })),

            addMaterial: (material) =>
                set((state) => ({ materials: [...state.materials, material] })),

            setHourlyRate: (rate) => set({ hourlyRate: rate }),
        }),
        {
            name: 'lasercut-storage-v2',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
