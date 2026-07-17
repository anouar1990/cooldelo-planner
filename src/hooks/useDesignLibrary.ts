import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Design {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    tags: string[];
    thumbnail_url: string | null;
    file_url: string;
    file_type: string;
    downloads_count: number;
    created_at: string;
    updated_at: string;
}

interface DesignLibraryState {
    designs: Design[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
    searchQuery: string;
    selectedCategory: string | null;
    selectedFileType: string | null;
    sortBy: 'newest' | 'downloads' | 'alphabetical';
    
    // Actions
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string | null) => void;
    setSelectedFileType: (type: string | null) => void;
    setSortBy: (sort: 'newest' | 'downloads' | 'alphabetical') => void;
    fetchDesigns: (reset?: boolean) => Promise<void>;
    incrementDownload: (id: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 50;

export const useDesignLibrary = create<DesignLibraryState>((set, get) => ({
    designs: [],
    loading: false,
    error: null,
    hasMore: true,
    page: 0,
    searchQuery: '',
    selectedCategory: null,
    selectedFileType: null,
    sortBy: 'newest',

    setSearchQuery: (query) => {
        set({ searchQuery: query, page: 0, hasMore: true });
        get().fetchDesigns(true);
    },
    
    setSelectedCategory: (category) => {
        set({ selectedCategory: category, page: 0, hasMore: true });
        get().fetchDesigns(true);
    },
    
    setSelectedFileType: (type) => {
        set({ selectedFileType: type, page: 0, hasMore: true });
        get().fetchDesigns(true);
    },
    
    setSortBy: (sort) => {
        set({ sortBy: sort, page: 0, hasMore: true });
        get().fetchDesigns(true);
    },

    fetchDesigns: async (reset = false) => {
        const state = get();
        if (state.loading || (!reset && !state.hasMore)) return;

        set({ loading: true, error: null });

        try {
            const currentPage = reset ? 0 : state.page;
            const start = currentPage * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE - 1;

            let query = supabase.from('designs').select('*', { count: 'exact' });

            // Apply filters
            if (state.searchQuery) {
                // Search title or tags (assuming GIN index on tags)
                query = query.or(`title.ilike.%${state.searchQuery}%,tags.cs.{${state.searchQuery}}`);
            }
            if (state.selectedCategory) {
                query = query.eq('category', state.selectedCategory);
            }
            if (state.selectedFileType) {
                query = query.eq('file_type', state.selectedFileType);
            }

            // Apply sorting
            switch (state.sortBy) {
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'downloads':
                    query = query.order('downloads_count', { ascending: false });
                    break;
                case 'alphabetical':
                    query = query.order('title', { ascending: true });
                    break;
            }

            // Pagination
            query = query.range(start, end);

            const { data, error, count } = await query;

            if (error) throw error;

            const fetchedDesigns = data as Design[];
            const hasMore = count !== null ? start + fetchedDesigns.length < count : fetchedDesigns.length === ITEMS_PER_PAGE;

            set((prev) => ({
                designs: reset ? fetchedDesigns : [...prev.designs, ...fetchedDesigns],
                page: currentPage + 1,
                hasMore,
                loading: false,
            }));
        } catch (err: any) {
            console.error('Error fetching designs:', err);
            set({ error: err.message, loading: false });
        }
    },

    incrementDownload: async (id: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Log the download
            await supabase.from('user_downloads').insert({
                user_id: user.id,
                design_id: id
            });

            // Increment count via RPC
            await supabase.rpc('increment_download_count', { target_design_id: id });

            // Update local state
            set((state) => ({
                designs: state.designs.map(d => 
                    d.id === id ? { ...d, downloads_count: d.downloads_count + 1 } : d
                )
            }));
        } catch (err: any) {
            console.error('Error incrementing download:', err);
        }
    }
}));
