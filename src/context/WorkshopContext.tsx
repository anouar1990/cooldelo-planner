import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export type WorkshopType = 'Laser Cutting' | 'CNC Fabrication' | '3D Printing' | 'Engraving' | 'Mixed Workshop';

export interface MachineInfo {
    name: string;
    brand: string;
    model: string;
    powerWatts: number;
    workingArea: string; // e.g. "600x400 mm"
}

export interface WorkshopProfile {
    logoUrl: string;
    workshopName: string;
    ownerName: string;
    companyName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    taxId: string;
    currency: string;
    workshopType: WorkshopType;
    machine: MachineInfo;
}

export interface MaterialItem {
    id: string;
    name: string;
    type: string;
    thickness: string;
    costPerUnit: number;
    sheetWidth: number;
    sheetHeight: number;
    stock: number;
}

export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'delivered' | 'cancelled';

export interface OrderItem {
    id: string;
    orderNumber: string;
    clientName: string;
    projectName: string;
    dueDate: string;
    price: number;
    status: OrderStatus;
    notes: string;
    createdAt: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Draft' | 'Overdue';

export interface InvoiceItem {
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientEmail?: string;
    amount: number;
    status: InvoiceStatus;
    date: string;
    dueDate?: string;
}

export interface ClientItem {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
}

export interface WorkshopStats {
    totalProjects: number;
    inProgressProjects: number;
    completedProjects: number;
    deliveredProjects: number;

    totalMaterials: number;
    inventoryValue: number;
    lowStockCount: number;

    totalInvoices: number;
    paidInvoicesCount: number;
    pendingInvoicesCount: number;
    totalRevenue: number;

    totalClients: number;
    newClientsThisMonth: number;

    monthlyRevenue: number;
    weeklyRevenue: number;
    averageOrderValue: number;
}

interface WorkshopContextType {
    profile: WorkshopProfile;
    updateProfile: (updates: Partial<WorkshopProfile>) => void;

    materials: MaterialItem[];
    addMaterial: (m: Omit<MaterialItem, 'id'>) => void;
    updateMaterial: (id: string, updates: Partial<MaterialItem>) => void;
    deleteMaterial: (id: string) => void;

    orders: OrderItem[];
    addOrder: (o: Omit<OrderItem, 'id' | 'orderNumber' | 'createdAt'>) => void;
    updateOrder: (id: string, updates: Partial<OrderItem>) => void;
    deleteOrder: (id: string) => void;

    invoices: InvoiceItem[];
    addInvoice: (inv: Omit<InvoiceItem, 'id' | 'invoiceNumber'>) => void;
    updateInvoice: (id: string, updates: Partial<InvoiceItem>) => void;
    deleteInvoice: (id: string) => void;

    clients: ClientItem[];
    addClient: (c: Omit<ClientItem, 'id' | 'createdAt'>) => void;

    stats: WorkshopStats;
    exportBackupData: () => string;
    importBackupData: (jsonData: string) => boolean;
}

const DEFAULT_PROFILE: WorkshopProfile = {
    logoUrl: '',
    workshopName: 'Apex Precision Fab',
    ownerName: 'Ethan Vance',
    companyName: 'Apex Precision Fabrication LLC',
    email: 'contact@apexprecisionfab.com',
    phone: '+1 (512) 890-3421',
    country: 'United States',
    city: 'Austin, TX',
    address: '1042 Industrial Parkway, Suite 100',
    taxId: 'US-987654321',
    currency: '$',
    workshopType: 'Laser Cutting',
    machine: {
        name: 'Thunder Laser Nova 51',
        brand: 'Thunder Laser',
        model: 'Nova 51 (130W)',
        powerWatts: 130,
        workingArea: '1300x900 mm',
    },
};

const SEED_MATERIALS: MaterialItem[] = [
    { id: '1', name: 'Birch Plywood 3mm', type: 'Wood', thickness: '3', costPerUnit: 18, sheetWidth: 600, sheetHeight: 400, stock: 12 },
    { id: '2', name: 'Clear Acrylic 4mm', type: 'Acrylic', thickness: '4', costPerUnit: 24, sheetWidth: 600, sheetHeight: 300, stock: 5 },
    { id: '3', name: 'MDF Sheet 6mm', type: 'Wood', thickness: '6', costPerUnit: 35, sheetWidth: 1200, sheetHeight: 600, stock: 8 },
    { id: '4', name: 'Anodized Aluminum 1.5mm', type: 'Metal', thickness: '1.5', costPerUnit: 48, sheetWidth: 500, sheetHeight: 300, stock: 2 },
];

const SEED_ORDERS: OrderItem[] = [
    { id: '1', orderNumber: 'ORD-001', clientName: 'John Smith', projectName: 'Custom Coaster Set (x50)', dueDate: '2026-08-05', price: 185, status: 'in-progress', notes: 'Birch 3mm, engraved logos', createdAt: '2026-07-20' },
    { id: '2', orderNumber: 'ORD-002', clientName: 'Sarah Lee', projectName: 'Acrylic Signage Box', dueDate: '2026-08-10', price: 340, status: 'pending', notes: 'Clear acrylic 4mm with LED housing', createdAt: '2026-07-24' },
    { id: '3', orderNumber: 'ORD-003', clientName: 'David Miller', projectName: 'Architectural Model Components', dueDate: '2026-07-28', price: 520, status: 'completed', notes: 'MDF 6mm precision cut', createdAt: '2026-07-15' },
    { id: '4', orderNumber: 'ORD-004', clientName: 'Elena Rostova', projectName: 'Custom Leather Badges (x200)', dueDate: '2026-07-25', price: 290, status: 'delivered', notes: 'Laser engraved brown leather', createdAt: '2026-07-10' },
];

const SEED_INVOICES: InvoiceItem[] = [
    { id: '1', invoiceNumber: 'INV-1001', clientName: 'John Smith', amount: 185, status: 'Paid', date: '2026-07-20' },
    { id: '2', invoiceNumber: 'INV-1002', clientName: 'Sarah Lee', amount: 340, status: 'Pending', date: '2026-07-24' },
    { id: '3', invoiceNumber: 'INV-1003', clientName: 'David Miller', amount: 520, status: 'Paid', date: '2026-07-15' },
    { id: '4', invoiceNumber: 'INV-1004', clientName: 'Elena Rostova', amount: 290, status: 'Paid', date: '2026-07-10' },
];

const SEED_CLIENTS: ClientItem[] = [
    { id: '1', name: 'John Smith', email: 'john@smithdesign.com', phone: '+1 415-555-0192', createdAt: '2026-07-20' },
    { id: '2', name: 'Sarah Lee', email: 'sarah@leestudio.co', phone: '+1 212-555-0144', createdAt: '2026-07-24' },
    { id: '3', name: 'David Miller', email: 'david@archmodels.org', phone: '+44 20-7946-0912', createdAt: '2026-07-15' },
    { id: '4', name: 'Elena Rostova', email: 'elena@rostovadesign.com', phone: '+33 1-4268-5500', createdAt: '2026-07-10' },
];

const WorkshopContext = createContext<WorkshopContextType>({} as WorkshopContextType);

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<WorkshopProfile>(DEFAULT_PROFILE);
    const [materials, setMaterials] = useState<MaterialItem[]>(SEED_MATERIALS);
    const [orders, setOrders] = useState<OrderItem[]>(SEED_ORDERS);
    const [invoices, setInvoices] = useState<InvoiceItem[]>(SEED_INVOICES);
    const [clients, setClients] = useState<ClientItem[]>(SEED_CLIENTS);

    // Initialize from LocalStorage with auto-migration of legacy names
    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            try {
                const storedProfile = localStorage.getItem('0machine_workshop_profile');
                if (storedProfile) {
                    const parsed = JSON.parse(storedProfile);
                    // Migrate legacy profile names if found
                    if (
                        parsed.ownerName?.includes('Anouar') ||
                        parsed.workshopName?.includes('Atlas')
                    ) {
                        const migrated = {
                            ...parsed,
                            workshopName: 'Apex Precision Fab',
                            ownerName: 'Ethan Vance',
                            companyName: 'Apex Precision Fabrication LLC',
                            email: 'contact@apexprecisionfab.com',
                            phone: '+1 (512) 890-3421',
                            country: 'United States',
                            city: 'Austin, TX',
                            address: '1042 Industrial Parkway, Suite 100',
                            taxId: 'US-987654321',
                        };
                        setProfile(migrated);
                        localStorage.setItem('0machine_workshop_profile', JSON.stringify(migrated));
                    } else {
                        setProfile(parsed);
                    }
                }

                const storedMats = localStorage.getItem('0machine_materials');
                if (storedMats) setMaterials(JSON.parse(storedMats));

                const storedOrders = localStorage.getItem('0machine_orders');
                if (storedOrders) setOrders(JSON.parse(storedOrders));

                const storedInvoices = localStorage.getItem('0machine_invoices');
                if (storedInvoices) setInvoices(JSON.parse(storedInvoices));

                const storedClients = localStorage.getItem('0machine_clients');
                if (storedClients) setClients(JSON.parse(storedClients));
            } catch (err) {
                console.error('Failed loading workshop local storage cache:', err);
            }
        }
    }, []);

    // Save helpers
    const updateProfile = useCallback((updates: Partial<WorkshopProfile>) => {
        setProfile(prev => {
            const next = { ...prev, ...updates };
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_workshop_profile', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const addMaterial = useCallback((m: Omit<MaterialItem, 'id'>) => {
        setMaterials(prev => {
            const next = [{ id: Date.now().toString(), ...m }, ...prev];
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_materials', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const updateMaterial = useCallback((id: string, updates: Partial<MaterialItem>) => {
        setMaterials(prev => {
            const next = prev.map(m => m.id === id ? { ...m, ...updates } : m);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_materials', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const deleteMaterial = useCallback((id: string) => {
        setMaterials(prev => {
            const next = prev.filter(m => m.id !== id);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_materials', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const addOrder = useCallback((o: Omit<OrderItem, 'id' | 'orderNumber' | 'createdAt'>) => {
        setOrders(prev => {
            const nextNum = `ORD-${String(prev.length + 1).padStart(3, '0')}`;
            const newItem: OrderItem = {
                id: Date.now().toString(),
                orderNumber: nextNum,
                createdAt: new Date().toISOString().slice(0, 10),
                ...o,
            };
            const next = [newItem, ...prev];
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_orders', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const updateOrder = useCallback((id: string, updates: Partial<OrderItem>) => {
        setOrders(prev => {
            const next = prev.map(o => o.id === id ? { ...o, ...updates } : o);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_orders', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const deleteOrder = useCallback((id: string) => {
        setOrders(prev => {
            const next = prev.filter(o => o.id !== id);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_orders', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const addInvoice = useCallback((inv: Omit<InvoiceItem, 'id' | 'invoiceNumber'>) => {
        setInvoices(prev => {
            const nextNum = `INV-${1000 + prev.length + 1}`;
            const newItem: InvoiceItem = {
                id: Date.now().toString(),
                invoiceNumber: nextNum,
                ...inv,
            };
            const next = [newItem, ...prev];
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_invoices', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const updateInvoice = useCallback((id: string, updates: Partial<InvoiceItem>) => {
        setInvoices(prev => {
            const next = prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_invoices', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const deleteInvoice = useCallback((id: string) => {
        setInvoices(prev => {
            const next = prev.filter(inv => inv.id !== id);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_invoices', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    const addClient = useCallback((c: Omit<ClientItem, 'id' | 'createdAt'>) => {
        setClients(prev => {
            const newItem: ClientItem = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString().slice(0, 10),
                ...c,
            };
            const next = [newItem, ...prev];
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                localStorage.setItem('0machine_clients', JSON.stringify(next));
            }
            return next;
        });
    }, []);

    // Real-Time Statistics Calculations
    const stats: WorkshopStats = useMemo(() => {
        // Projects / Orders
        const totalProjects = orders.length;
        const inProgressProjects = orders.filter(o => o.status === 'in-progress').length;
        const completedProjects = orders.filter(o => o.status === 'completed').length;
        const deliveredProjects = orders.filter(o => o.status === 'delivered').length;

        // Inventory
        const totalMaterials = materials.length;
        const inventoryValue = materials.reduce((sum, m) => sum + m.costPerUnit * m.stock, 0);
        const lowStockCount = materials.filter(m => m.stock <= 2).length;

        // Invoices & Revenue
        const totalInvoices = invoices.length;
        const paidInvoicesCount = invoices.filter(inv => inv.status === 'Paid').length;
        const pendingInvoicesCount = invoices.filter(inv => inv.status === 'Pending').length;
        const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);

        // Unique Clients
        const clientSet = new Set<string>();
        clients.forEach(c => clientSet.add(c.name.toLowerCase()));
        orders.forEach(o => clientSet.add(o.clientName.toLowerCase()));
        invoices.forEach(inv => clientSet.add(inv.clientName.toLowerCase()));
        const totalClients = Math.max(clientSet.size, clients.length);

        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const newClientsThisMonth = clients.filter(c => c.createdAt.startsWith(currentMonthPrefix)).length;

        // Revenue Breakdown
        const monthlyRevenue = totalRevenue;
        const weeklyRevenue = Math.round(monthlyRevenue / 4);
        const totalOrderPriceSum = orders.reduce((sum, o) => sum + o.price, 0);
        const averageOrderValue = totalProjects > 0 ? Math.round(totalOrderPriceSum / totalProjects) : 0;

        return {
            totalProjects,
            inProgressProjects,
            completedProjects,
            deliveredProjects,
            totalMaterials,
            inventoryValue,
            lowStockCount,
            totalInvoices,
            paidInvoicesCount,
            pendingInvoicesCount,
            totalRevenue,
            totalClients,
            newClientsThisMonth,
            monthlyRevenue,
            weeklyRevenue,
            averageOrderValue,
        };
    }, [orders, materials, invoices, clients]);

    // Data Export & Import
    const exportBackupData = useCallback(() => {
        const payload = {
            profile,
            materials,
            orders,
            invoices,
            clients,
            exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(payload, null, 2);
    }, [profile, materials, orders, invoices, clients]);

    const importBackupData = useCallback((jsonData: string): boolean => {
        try {
            const parsed = JSON.parse(jsonData);
            if (parsed.profile) updateProfile(parsed.profile);
            if (Array.isArray(parsed.materials)) setMaterials(parsed.materials);
            if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
            if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
            if (Array.isArray(parsed.clients)) setClients(parsed.clients);
            return true;
        } catch (err) {
            console.error('Backup import error:', err);
            return false;
        }
    }, [updateProfile]);

    return (
        <WorkshopContext.Provider value={{
            profile,
            updateProfile,
            materials,
            addMaterial,
            updateMaterial,
            deleteMaterial,
            orders,
            addOrder,
            updateOrder,
            deleteOrder,
            invoices,
            addInvoice,
            updateInvoice,
            deleteInvoice,
            clients,
            addClient,
            stats,
            exportBackupData,
            importBackupData,
        }}>
            {children}
        </WorkshopContext.Provider>
    );
};

export const useWorkshop = () => useContext(WorkshopContext);
