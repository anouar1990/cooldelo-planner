import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Modal, Linking, Platform, useWindowDimensions,
} from 'react-native';
import {
    Factory, Play, Pause, CheckCircle, AlertTriangle, Clock,
    ChevronRight, Package, User, DollarSign, Calendar,
    MessageCircle, X, ArrowUpRight, Layers, RotateCcw, Archive,
} from 'lucide-react-native';
import { useWorkshop, OrderItem, OrderStatus } from '../context/WorkshopContext';

// ─── Design tokens (matching existing app palette) ─────────────────────────
const C = {
    bg:       '#0A0C12',
    surface:  '#13151F',
    surface2: '#1C1F2E',
    surface3: '#242840',
    border:   'rgba(255,255,255,0.07)',
    border2:  'rgba(255,255,255,0.12)',
    primary:  '#FF6B35',
    green:    '#10B981',
    amber:    '#F59E0B',
    red:      '#EF4444',
    blue:     '#3B82F6',
    purple:   '#8B5CF6',
    text:     '#F1F5F9',
    sub:      '#8B95A8',
    dim:      '#4B5568',
};

// ─── Production session storage ────────────────────────────────────────────
// Stored separately from orders — additive layer, never overwrites order data
interface ProductionSession {
    orderId: string;
    startedAt: string | null;
    pausedAt: string | null;
    totalElapsedMs: number;
    completedAt: string | null;
}

const STORAGE_KEY = '0machine_production_sessions';

function loadSessions(): Record<string, ProductionSession> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveSessions(sessions: Record<string, ProductionSession>) {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {}
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatElapsed(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function isOverdue(dueDate: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
}

function isDueToday(dueDate: string): boolean {
    if (!dueDate) return false;
    return dueDate === new Date().toISOString().slice(0, 10);
}

// ─── Small reusable components ─────────────────────────────────────────────
function SectionHeader({ title, count, color = C.sub }: { title: string; count?: number; color?: string }) {
    return (
        <View style={ss.sectionHeader}>
            <Text style={ss.sectionTitle}>{title}</Text>
            {count !== undefined && (
                <View style={[ss.sectionBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[ss.sectionBadgeText, { color }]}>{count}</Text>
                </View>
            )}
        </View>
    );
}

function StatusPill({ status }: { status: OrderStatus }) {
    const map: Record<OrderStatus, { label: string; color: string }> = {
        'pending':     { label: 'Queue',       color: C.amber },
        'in-progress': { label: 'In Progress', color: C.blue },
        'completed':   { label: 'Completed',   color: C.green },
        'delivered':   { label: 'Delivered',   color: C.purple },
        'cancelled':   { label: 'Cancelled',   color: C.red },
    };
    const cfg = map[status] ?? map['pending'];
    return (
        <View style={[ss.pill, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
            <Text style={[ss.pillText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function ProductionScreen() {
    const { orders, updateOrder, materials, profile, clients } = useWorkshop();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    // Production session state
    const [sessions, setSessions] = useState<Record<string, ProductionSession>>(loadSessions);
    const [tick, setTick] = useState(0); // force re-render for live timer
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    // Live timer — ticks every second when there's an active job
    useEffect(() => {
        const activeOrder = orders.find(o => o.status === 'in-progress');
        const session = activeOrder ? sessions[activeOrder.id] : null;
        const isRunning = session?.startedAt && !session?.pausedAt;

        if (isRunning) {
            timerRef.current = setInterval(() => setTick(t => t + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [orders, sessions]);

    // Persist sessions whenever they change
    useEffect(() => { saveSessions(sessions); }, [sessions]);

    // ── Computed data ─────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);

    const queueOrders   = useMemo(() => orders.filter(o => o.status === 'pending'),     [orders]);
    const activeOrders  = useMemo(() => orders.filter(o => o.status === 'in-progress'), [orders]);
    const doneOrders    = useMemo(() => orders.filter(o => o.status === 'completed'),   [orders]);
    const deliveredOrders = useMemo(() => orders.filter(o => o.status === 'delivered'), [orders]);

    // "Today's jobs" = anything not cancelled & not delivered more than today
    const todaysJobs = useMemo(() =>
        orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered'),
    [orders]);

    // Sort queue by due date (overdue first, then soonest)
    const sortedQueue = useMemo(() =>
        [...queueOrders].sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }),
    [queueOrders]);

    // Material blockers: find queue orders where notes mention a material name
    // that has stock <= 2
    const lowStockMaterials = useMemo(() =>
        materials.filter(m => m.stock <= 2),
    [materials]);

    const blockedOrders = useMemo(() => {
        if (lowStockMaterials.length === 0) return [];
        return queueOrders.filter(order => {
            const notesLower = (order.notes || '').toLowerCase();
            return lowStockMaterials.some(m => notesLower.includes(m.name.toLowerCase().split(' ')[0]));
        }).map(order => {
            const matchedMaterial = lowStockMaterials.find(m =>
                (order.notes || '').toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
            );
            return { order, material: matchedMaterial };
        });
    }, [queueOrders, lowStockMaterials]);

    // ── Session helpers ───────────────────────────────────────────────────
    const getElapsed = useCallback((orderId: string): number => {
        const s = sessions[orderId];
        if (!s) return 0;
        let total = s.totalElapsedMs;
        if (s.startedAt && !s.pausedAt) {
            total += Date.now() - new Date(s.startedAt).getTime();
        }
        return total;
    }, [sessions, tick]); // tick forces recalc every second

    const handleStart = useCallback((order: OrderItem) => {
        // Only one job in-progress at a time — pause any existing
        const currentActive = orders.find(o => o.status === 'in-progress' && o.id !== order.id);
        if (currentActive) {
            setSessions(prev => {
                const existing = prev[currentActive.id] ?? { orderId: currentActive.id, startedAt: null, pausedAt: null, totalElapsedMs: 0, completedAt: null };
                const elapsed = existing.startedAt && !existing.pausedAt
                    ? existing.totalElapsedMs + Date.now() - new Date(existing.startedAt).getTime()
                    : existing.totalElapsedMs;
                return {
                    ...prev,
                    [currentActive.id]: { ...existing, pausedAt: new Date().toISOString(), totalElapsedMs: elapsed },
                };
            });
            updateOrder(currentActive.id, { status: 'pending' });
        }

        // Start this order
        setSessions(prev => {
            const existing = prev[order.id] ?? { orderId: order.id, startedAt: null, pausedAt: null, totalElapsedMs: 0, completedAt: null };
            return {
                ...prev,
                [order.id]: { ...existing, startedAt: new Date().toISOString(), pausedAt: null },
            };
        });
        updateOrder(order.id, { status: 'in-progress' });
    }, [orders, updateOrder]);

    const handlePause = useCallback((order: OrderItem) => {
        setSessions(prev => {
            const s = prev[order.id] ?? { orderId: order.id, startedAt: null, pausedAt: null, totalElapsedMs: 0, completedAt: null };
            const elapsed = s.startedAt && !s.pausedAt
                ? s.totalElapsedMs + Date.now() - new Date(s.startedAt).getTime()
                : s.totalElapsedMs;
            return { ...prev, [order.id]: { ...s, pausedAt: new Date().toISOString(), totalElapsedMs: elapsed } };
        });
        updateOrder(order.id, { status: 'pending' });
    }, [updateOrder]);

    const handleResume = useCallback((order: OrderItem) => {
        setSessions(prev => {
            const s = prev[order.id] ?? { orderId: order.id, startedAt: null, pausedAt: null, totalElapsedMs: 0, completedAt: null };
            return { ...prev, [order.id]: { ...s, startedAt: new Date().toISOString(), pausedAt: null } };
        });
        updateOrder(order.id, { status: 'in-progress' });
    }, [updateOrder]);

    const handleComplete = useCallback((order: OrderItem) => {
        setSessions(prev => {
            const s = prev[order.id] ?? { orderId: order.id, startedAt: null, pausedAt: null, totalElapsedMs: 0, completedAt: null };
            const elapsed = s.startedAt && !s.pausedAt
                ? s.totalElapsedMs + Date.now() - new Date(s.startedAt).getTime()
                : s.totalElapsedMs;
            return { ...prev, [order.id]: { ...s, totalElapsedMs: elapsed, pausedAt: s.pausedAt ?? new Date().toISOString(), completedAt: new Date().toISOString() } };
        });
        updateOrder(order.id, { status: 'completed' });
        setShowDetail(false);
    }, [updateOrder]);

    const handleWhatsApp = useCallback((order: OrderItem) => {
        const clientObj = clients.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
        const phone = clientObj?.phone?.replace(/[^\d+]/g, '') ?? '';
        const msg = encodeURIComponent(
            `Hi ${order.clientName} 👋\n\nYour order is ready for pickup!\n\n` +
            `📦 *${order.projectName}*\n` +
            `🔢 Order: ${order.orderNumber}\n` +
            `💰 Total: ${profile.currency}${order.price.toFixed(2)}\n\n` +
            `Workshop: ${profile.workshopName}\n` +
            `Thank you for your business! 🙏`
        );
        const url = phone
            ? `https://wa.me/${phone}?text=${msg}`
            : `https://wa.me/?text=${msg}`;
        Linking.openURL(url);
    }, [clients, profile]);

    const openDetail = (order: OrderItem) => {
        setSelectedOrder(order);
        setShowDetail(true);
    };

    // ── Render helpers ────────────────────────────────────────────────────

    const activeJob = activeOrders[0] ?? null; // Only show first active

    // ── RENDER ────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={ss.safe}>
            <ScrollView
                contentContainerStyle={[ss.scroll, isDesktop && ss.scrollDesktop]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View style={ss.header}>
                    <View style={ss.headerLeft}>
                        <View style={ss.headerIconWrap}>
                            <Factory color={C.primary} size={20} />
                        </View>
                        <View>
                            <Text style={ss.headerTitle}>Production</Text>
                            <Text style={ss.headerSub}>Today's work floor</Text>
                        </View>
                    </View>
                    <View style={ss.headerDate}>
                        <Text style={ss.headerDateText}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                </View>

                {/* ── TODAY STATS BAR ── */}
                <View style={ss.statsRow}>
                    <StatChip value={todaysJobs.length} label="Total Jobs" color={C.primary} />
                    <StatChip value={activeOrders.length} label="In Progress" color={C.blue} />
                    <StatChip value={queueOrders.length} label="Queue" color={C.amber} />
                    <StatChip value={doneOrders.length} label="Done" color={C.green} />
                </View>

                {/* ── CURRENTLY IN PRODUCTION ── */}
                <View style={ss.section}>
                    <SectionHeader
                        title="Currently In Production"
                        count={activeOrders.length}
                        color={C.blue}
                    />

                    {activeJob ? (
                        <ActiveJobCard
                            order={activeJob}
                            elapsed={getElapsed(activeJob.id)}
                            isPaused={!!sessions[activeJob.id]?.pausedAt && !sessions[activeJob.id]?.startedAt}
                            onPause={() => handlePause(activeJob)}
                            onResume={() => handleResume(activeJob)}
                            onComplete={() => handleComplete(activeJob)}
                            onOpen={() => openDetail(activeJob)}
                        />
                    ) : (
                        <EmptyCard
                            icon={<Factory color={C.dim} size={28} />}
                            title="No job running"
                            sub="Start a job from the queue below"
                        />
                    )}
                </View>

                {/* ── BLOCKERS ── */}
                {blockedOrders.length > 0 && (
                    <View style={ss.section}>
                        <SectionHeader title="Production Blockers" count={blockedOrders.length} color={C.red} />
                        {blockedOrders.map(({ order, material }) => (
                            <BlockerCard
                                key={order.id}
                                order={order}
                                material={material}
                                onOpen={() => openDetail(order)}
                            />
                        ))}
                    </View>
                )}

                {/* ── NEXT UP (Queue) ── */}
                <View style={ss.section}>
                    <SectionHeader
                        title={activeJob ? 'Next Up' : 'Production Queue'}
                        count={sortedQueue.length}
                        color={C.amber}
                    />

                    {sortedQueue.length === 0 ? (
                        <EmptyCard
                            icon={<CheckCircle color={C.green} size={28} />}
                            title="You're all caught up 🎉"
                            sub="No pending jobs in the queue"
                        />
                    ) : (
                        sortedQueue.map((order, i) => {
                            const isBlocked = blockedOrders.some(b => b.order.id === order.id);
                            const isPaused = !!sessions[order.id]?.totalElapsedMs && sessions[order.id]?.totalElapsedMs > 0;
                            return (
                                <QueueCard
                                    key={order.id}
                                    order={order}
                                    position={i + 1}
                                    isBlocked={isBlocked}
                                    isPaused={isPaused}
                                    elapsed={isPaused ? sessions[order.id]?.totalElapsedMs ?? 0 : 0}
                                    onStart={() => handleStart(order)}
                                    onOpen={() => openDetail(order)}
                                />
                            );
                        })
                    )}
                </View>

                {/* ── PRODUCTION HISTORY ── */}
                {(doneOrders.length > 0 || deliveredOrders.length > 0) && (
                    <View style={ss.section}>
                        <SectionHeader
                            title="Completed"
                            count={doneOrders.length + deliveredOrders.length}
                            color={C.green}
                        />
                        {[...doneOrders, ...deliveredOrders].map(order => (
                            <HistoryCard
                                key={order.id}
                                order={order}
                                elapsed={sessions[order.id]?.totalElapsedMs ?? 0}
                                onWhatsApp={() => handleWhatsApp(order)}
                                onOpen={() => openDetail(order)}
                            />
                        ))}
                    </View>
                )}

                {/* Empty state — no orders at all */}
                {orders.filter(o => o.status !== 'cancelled').length === 0 && (
                    <View style={ss.fullEmpty}>
                        <Factory color={C.dim} size={48} opacity={0.4} />
                        <Text style={ss.fullEmptyTitle}>No production jobs yet</Text>
                        <Text style={ss.fullEmptySub}>
                            Create an order in the Orders section and it will appear here
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── JOB DETAIL MODAL ── */}
            <Modal
                visible={showDetail}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDetail(false)}
            >
                <View style={ss.modalOverlay}>
                    <View style={ss.modalSheet}>
                        {selectedOrder && (
                            <DetailModal
                                order={selectedOrder}
                                session={sessions[selectedOrder.id] ?? null}
                                elapsed={getElapsed(selectedOrder.id)}
                                onClose={() => setShowDetail(false)}
                                onStart={() => { handleStart(selectedOrder); }}
                                onPause={() => { handlePause(selectedOrder); }}
                                onResume={() => { handleResume(selectedOrder); }}
                                onComplete={() => { handleComplete(selectedOrder); }}
                                onWhatsApp={() => handleWhatsApp(selectedOrder)}
                                activeOrder={activeJob}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatChip({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <View style={[ss.statChip, { borderColor: color + '30', backgroundColor: color + '0D' }]}>
            <Text style={[ss.statChipValue, { color }]}>{value}</Text>
            <Text style={ss.statChipLabel}>{label}</Text>
        </View>
    );
}

function EmptyCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
    return (
        <View style={ss.emptyCard}>
            {icon}
            <Text style={ss.emptyTitle}>{title}</Text>
            <Text style={ss.emptySub}>{sub}</Text>
        </View>
    );
}

function ActiveJobCard({
    order, elapsed, isPaused, onPause, onResume, onComplete, onOpen,
}: {
    order: OrderItem;
    elapsed: number;
    isPaused: boolean;
    onPause: () => void;
    onResume: () => void;
    onComplete: () => void;
    onOpen: () => void;
}) {
    const due = order.dueDate ? isOverdue(order.dueDate) ? '⚠️ Overdue' : isDueToday(order.dueDate) ? '📅 Due Today' : `Due ${order.dueDate}` : null;

    return (
        <View style={ss.activeCard}>
            {/* Glow bar */}
            <View style={ss.activeGlow} />

            <View style={ss.activeTop}>
                <View style={ss.activePulse}>
                    <View style={ss.activePulseInner} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={ss.activeOrderNum}>{order.orderNumber}</Text>
                    <Text style={ss.activeProjectName} numberOfLines={2}>{order.projectName}</Text>
                </View>
                <TouchableOpacity onPress={onOpen} style={ss.openBtn}>
                    <ArrowUpRight color={C.sub} size={16} />
                </TouchableOpacity>
            </View>

            <View style={ss.activeMeta}>
                <View style={ss.activeMetaItem}>
                    <User color={C.sub} size={13} />
                    <Text style={ss.activeMetaText}>{order.clientName}</Text>
                </View>
                {order.dueDate && (
                    <View style={ss.activeMetaItem}>
                        <Calendar color={isOverdue(order.dueDate) ? C.red : C.sub} size={13} />
                        <Text style={[ss.activeMetaText, isOverdue(order.dueDate) && { color: C.red }]}>{due}</Text>
                    </View>
                )}
                <View style={ss.activeMetaItem}>
                    <DollarSign color={C.sub} size={13} />
                    <Text style={ss.activeMetaText}>{order.price.toFixed(2)}</Text>
                </View>
            </View>

            {/* Timer */}
            <View style={ss.timerBox}>
                <Clock color={isPaused ? C.amber : C.blue} size={16} />
                <Text style={[ss.timerText, { color: isPaused ? C.amber : C.blue }]}>
                    {formatElapsed(elapsed)}
                </Text>
                <Text style={ss.timerLabel}>{isPaused ? 'Paused' : 'Running'}</Text>
            </View>

            {/* Controls */}
            <View style={ss.activeControls}>
                {isPaused ? (
                    <TouchableOpacity style={[ss.ctaBtn, { backgroundColor: C.blue }]} onPress={onResume}>
                        <Play color="#fff" size={16} fill="#fff" />
                        <Text style={ss.ctaBtnText}>Resume</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[ss.ctaBtn, { backgroundColor: C.surface3 }]} onPress={onPause}>
                        <Pause color={C.amber} size={16} />
                        <Text style={[ss.ctaBtnText, { color: C.amber }]}>Pause</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[ss.ctaBtn, { backgroundColor: C.green }]} onPress={onComplete}>
                    <CheckCircle color="#fff" size={16} />
                    <Text style={ss.ctaBtnText}>Complete</Text>
                </TouchableOpacity>
            </View>

            {order.notes ? (
                <Text style={ss.activeNotes} numberOfLines={2}>{order.notes}</Text>
            ) : null}
        </View>
    );
}

function QueueCard({
    order, position, isBlocked, isPaused, elapsed, onStart, onOpen,
}: {
    order: OrderItem;
    position: number;
    isBlocked: boolean;
    isPaused: boolean;
    elapsed: number;
    onStart: () => void;
    onOpen: () => void;
}) {
    const overdue = order.dueDate ? isOverdue(order.dueDate) : false;
    const dueToday = order.dueDate ? isDueToday(order.dueDate) : false;

    return (
        <TouchableOpacity style={ss.queueCard} activeOpacity={0.75} onPress={onOpen}>
            <View style={ss.queuePos}>
                <Text style={ss.queuePosText}>{position}</Text>
            </View>

            <View style={ss.queueBody}>
                <View style={ss.queueTop}>
                    <Text style={ss.queueNum}>{order.orderNumber}</Text>
                    {isBlocked && (
                        <View style={ss.blockerBadge}>
                            <AlertTriangle color={C.red} size={10} />
                            <Text style={ss.blockerBadgeText}>Blocked</Text>
                        </View>
                    )}
                    {isPaused && (
                        <View style={[ss.blockerBadge, { backgroundColor: C.amber + '18', borderColor: C.amber + '40' }]}>
                            <Pause color={C.amber} size={10} />
                            <Text style={[ss.blockerBadgeText, { color: C.amber }]}>Paused · {formatElapsed(elapsed)}</Text>
                        </View>
                    )}
                </View>
                <Text style={ss.queueName} numberOfLines={1}>{order.projectName}</Text>
                <View style={ss.queueMeta}>
                    <View style={ss.queueMetaItem}><User color={C.dim} size={11} /><Text style={ss.queueMetaText}>{order.clientName}</Text></View>
                    {order.dueDate && (
                        <View style={ss.queueMetaItem}>
                            <Calendar color={overdue ? C.red : dueToday ? C.amber : C.dim} size={11} />
                            <Text style={[ss.queueMetaText, overdue && { color: C.red }, dueToday && { color: C.amber }]}>
                                {overdue ? 'Overdue' : dueToday ? 'Today' : order.dueDate}
                            </Text>
                        </View>
                    )}
                    <View style={ss.queueMetaItem}><DollarSign color={C.dim} size={11} /><Text style={ss.queueMetaText}>{order.price.toFixed(0)}</Text></View>
                </View>
            </View>

            <TouchableOpacity
                style={[ss.startBtn, isBlocked && ss.startBtnBlocked]}
                onPress={isBlocked ? undefined : onStart}
                activeOpacity={isBlocked ? 1 : 0.7}
            >
                {isPaused
                    ? <RotateCcw color={isBlocked ? C.dim : C.amber} size={16} />
                    : <Play color={isBlocked ? C.dim : '#fff'} size={16} fill={isBlocked ? 'none' : '#fff'} />
                }
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

function BlockerCard({
    order, material, onOpen,
}: {
    order: OrderItem;
    material: any;
    onOpen: () => void;
}) {
    return (
        <TouchableOpacity style={ss.blockerCard} activeOpacity={0.85} onPress={onOpen}>
            <View style={ss.blockerIcon}>
                <AlertTriangle color={C.red} size={18} />
            </View>
            <View style={ss.blockerBody}>
                <Text style={ss.blockerTitle}>{order.orderNumber} — {order.projectName}</Text>
                {material && (
                    <Text style={ss.blockerSub}>
                        <Package color={C.sub} size={11} /> {material.name} — Only {material.stock} in stock
                    </Text>
                )}
                <Text style={ss.blockerHint}>Check Materials or update order to proceed</Text>
            </View>
            <ChevronRight color={C.dim} size={16} />
        </TouchableOpacity>
    );
}

function HistoryCard({
    order, elapsed, onWhatsApp, onOpen,
}: {
    order: OrderItem;
    elapsed: number;
    onWhatsApp: () => void;
    onOpen: () => void;
}) {
    return (
        <TouchableOpacity style={ss.historyCard} activeOpacity={0.75} onPress={onOpen}>
            <View style={[ss.historyDot, { backgroundColor: order.status === 'delivered' ? C.purple : C.green }]} />
            <View style={ss.historyBody}>
                <Text style={ss.historyNum}>{order.orderNumber}</Text>
                <Text style={ss.historyName} numberOfLines={1}>{order.projectName}</Text>
                <View style={ss.historyMeta}>
                    <Text style={ss.historyMetaText}>{order.clientName}</Text>
                    {elapsed > 0 && <Text style={ss.historyMetaText}>· {formatElapsed(elapsed)}</Text>}
                    <Text style={[ss.historyMetaText, { color: order.status === 'delivered' ? C.purple : C.green, fontWeight: '700' }]}>
                        · {order.status === 'delivered' ? 'Delivered' : 'Ready'}
                    </Text>
                </View>
            </View>
            {order.status === 'completed' && (
                <TouchableOpacity style={ss.waBtn} onPress={onWhatsApp}>
                    <MessageCircle color={C.green} size={16} />
                    <Text style={ss.waBtnText}>Notify</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

function DetailModal({
    order, session, elapsed, onClose, onStart, onPause, onResume, onComplete, onWhatsApp, activeOrder,
}: {
    order: OrderItem;
    session: ProductionSession | null;
    elapsed: number;
    onClose: () => void;
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onComplete: () => void;
    onWhatsApp: () => void;
    activeOrder: OrderItem | null;
}) {
    const isActive = order.status === 'in-progress';
    const isPending = order.status === 'pending';
    const isCompleted = order.status === 'completed' || order.status === 'delivered';
    const isPaused = isPending && !!session?.totalElapsedMs && session.totalElapsedMs > 0;
    const isRunning = isActive && !!session?.startedAt && !session?.pausedAt;
    const isDifferentJobActive = activeOrder !== null && activeOrder.id !== order.id;

    return (
        <>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
                <View>
                    <Text style={ss.modalOrderNum}>{order.orderNumber}</Text>
                    <Text style={ss.modalProjectName}>{order.projectName}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={ss.modalCloseBtn}>
                    <X color={C.sub} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView style={ss.modalBody} showsVerticalScrollIndicator={false}>
                <StatusPill status={order.status} />

                {/* Info rows */}
                <View style={ss.infoGrid}>
                    <InfoRow icon={<User color={C.primary} size={15} />} label="Customer" value={order.clientName} />
                    <InfoRow icon={<DollarSign color={C.green} size={15} />} label="Order Value" value={`${order.price.toFixed(2)}`} />
                    {order.dueDate && (
                        <InfoRow
                            icon={<Calendar color={isOverdue(order.dueDate) ? C.red : C.amber} size={15} />}
                            label="Due Date"
                            value={order.dueDate}
                            valueColor={isOverdue(order.dueDate) ? C.red : undefined}
                        />
                    )}
                    {elapsed > 0 && (
                        <InfoRow icon={<Clock color={C.blue} size={15} />} label="Production Time" value={formatElapsed(elapsed)} valueColor={C.blue} />
                    )}
                    {session?.startedAt && (
                        <InfoRow icon={<Play color={C.sub} size={15} />} label="First Started" value={new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    )}
                    {session?.completedAt && (
                        <InfoRow icon={<CheckCircle color={C.green} size={15} />} label="Completed At" value={new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    )}
                </View>

                {order.notes ? (
                    <View style={ss.notesBox}>
                        <Text style={ss.notesLabel}>Notes</Text>
                        <Text style={ss.notesText}>{order.notes}</Text>
                    </View>
                ) : null}

                {isDifferentJobActive && !isCompleted && (
                    <View style={ss.warningBox}>
                        <AlertTriangle color={C.amber} size={15} />
                        <Text style={ss.warningText}>
                            Starting this job will pause {activeOrder!.orderNumber}
                        </Text>
                    </View>
                )}

                {/* Production controls */}
                {!isCompleted && (
                    <View style={ss.modalControls}>
                        {isPending && !isPaused && (
                            <TouchableOpacity style={[ss.modalCtaBtn, { backgroundColor: C.primary }]} onPress={onStart}>
                                <Play color="#fff" size={18} fill="#fff" />
                                <Text style={ss.modalCtaBtnText}>Start Production</Text>
                            </TouchableOpacity>
                        )}
                        {isPaused && (
                            <TouchableOpacity style={[ss.modalCtaBtn, { backgroundColor: C.blue }]} onPress={onResume}>
                                <Play color="#fff" size={18} fill="#fff" />
                                <Text style={ss.modalCtaBtnText}>Resume · {formatElapsed(elapsed)}</Text>
                            </TouchableOpacity>
                        )}
                        {isActive && (
                            <View style={{ gap: 10 }}>
                                <TouchableOpacity style={[ss.modalCtaBtn, { backgroundColor: C.green }]} onPress={onComplete}>
                                    <CheckCircle color="#fff" size={18} />
                                    <Text style={ss.modalCtaBtnText}>Mark as Complete</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[ss.modalCtaBtn, { backgroundColor: C.surface3, borderWidth: 1, borderColor: C.border2 }]} onPress={onPause}>
                                    <Pause color={C.amber} size={18} />
                                    <Text style={[ss.modalCtaBtnText, { color: C.amber }]}>Pause</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Notify customer (completed) */}
                {order.status === 'completed' && (
                    <View style={ss.modalControls}>
                        <TouchableOpacity style={[ss.modalCtaBtn, { backgroundColor: '#128C7E' }]} onPress={onWhatsApp}>
                            <MessageCircle color="#fff" size={18} />
                            <Text style={ss.modalCtaBtnText}>Notify Customer via WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </>
    );
}

function InfoRow({
    icon, label, value, valueColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <View style={ss.infoRow}>
            <View style={ss.infoRowIcon}>{icon}</View>
            <View style={ss.infoRowContent}>
                <Text style={ss.infoLabel}>{label}</Text>
                <Text style={[ss.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
            </View>
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 60 },
    scrollDesktop: { paddingHorizontal: 32, maxWidth: 860, alignSelf: 'center', width: '100%' },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, marginBottom: 4 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary + '18', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
    headerSub: { fontSize: 12, color: C.sub, marginTop: 1 },
    headerDate: { backgroundColor: C.surface2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border },
    headerDateText: { fontSize: 12, fontWeight: '600', color: C.sub },

    // Stats row
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    statChip: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
    statChipValue: { fontSize: 20, fontWeight: '800' },
    statChipLabel: { fontSize: 10, color: C.sub, fontWeight: '600', marginTop: 1, textAlign: 'center' },

    // Section
    section: { marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: C.sub, letterSpacing: 0.8, textTransform: 'uppercase' },
    sectionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    sectionBadgeText: { fontSize: 11, fontWeight: '800' },

    // Empty
    emptyCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 32, alignItems: 'center', gap: 8 },
    emptyTitle: { fontSize: 15, fontWeight: '700', color: C.sub },
    emptySub: { fontSize: 12, color: C.dim, textAlign: 'center' },

    // Full empty
    fullEmpty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
    fullEmptyTitle: { fontSize: 18, fontWeight: '700', color: C.sub },
    fullEmptySub: { fontSize: 13, color: C.dim, textAlign: 'center', maxWidth: 280 },

    // Active job card
    activeCard: {
        backgroundColor: C.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.blue + '40',
        overflow: 'hidden',
        padding: 20,
        gap: 14,
    },
    activeGlow: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        backgroundColor: C.blue,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
    },
    activeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    activePulse: {
        width: 14, height: 14, borderRadius: 7,
        backgroundColor: C.blue + '30',
        justifyContent: 'center', alignItems: 'center',
        marginTop: 4,
    },
    activePulseInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue },
    activeOrderNum: { fontSize: 11, fontWeight: '700', color: C.blue, letterSpacing: 0.6, marginBottom: 2 },
    activeProjectName: { fontSize: 18, fontWeight: '800', color: C.text, lineHeight: 24 },
    openBtn: { padding: 6, backgroundColor: C.surface3, borderRadius: 8, borderWidth: 1, borderColor: C.border },
    activeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    activeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    activeMetaText: { fontSize: 12, color: C.sub, fontWeight: '500' },
    timerBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: C.surface2, borderRadius: 10, padding: 12,
        borderWidth: 1, borderColor: C.border,
    },
    timerText: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] as any, letterSpacing: 1 },
    timerLabel: { fontSize: 11, color: C.sub, fontWeight: '600', marginLeft: 'auto' },
    activeControls: { flexDirection: 'row', gap: 10 },
    ctaBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 46, borderRadius: 12,
    },
    ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    activeNotes: { fontSize: 12, color: C.dim, fontStyle: 'italic', marginTop: -4 },

    // Queue card
    queueCard: {
        backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8,
    },
    queuePos: {
        width: 28, height: 28, borderRadius: 8, backgroundColor: C.surface3,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    queuePosText: { fontSize: 12, fontWeight: '800', color: C.sub },
    queueBody: { flex: 1, minWidth: 0 },
    queueTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    queueNum: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.4 },
    blockerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: C.red + '18', borderWidth: 1, borderColor: C.red + '40',
        borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2,
    },
    blockerBadgeText: { fontSize: 10, fontWeight: '700', color: C.red },
    queueName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 5 },
    queueMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    queueMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    queueMetaText: { fontSize: 11, color: C.dim },
    startBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    startBtnBlocked: { backgroundColor: C.surface3, borderWidth: 1, borderColor: C.border },

    // Blocker card
    blockerCard: {
        backgroundColor: C.red + '0A', borderRadius: 14, borderWidth: 1, borderColor: C.red + '30',
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8,
    },
    blockerIcon: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: C.red + '18',
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    blockerBody: { flex: 1 },
    blockerTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
    blockerSub: { fontSize: 12, color: C.red, marginBottom: 2 },
    blockerHint: { fontSize: 11, color: C.dim },

    // History card
    historyCard: {
        backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8,
    },
    historyDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    historyBody: { flex: 1, minWidth: 0 },
    historyNum: { fontSize: 10, fontWeight: '700', color: C.sub, letterSpacing: 0.4, marginBottom: 2 },
    historyName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
    historyMeta: { flexDirection: 'row', gap: 4 },
    historyMetaText: { fontSize: 11, color: C.dim },
    waBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#128C7E18', borderRadius: 10, borderWidth: 1, borderColor: '#128C7E40',
        paddingHorizontal: 10, paddingVertical: 7,
    },
    waBtnText: { fontSize: 12, fontWeight: '700', color: '#25D366' },

    // Detail Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        maxHeight: '92%', paddingHorizontal: 20, paddingBottom: 0,
        borderTopWidth: 1, borderColor: C.border2,
    },
    modalHandle: { width: 40, height: 4, backgroundColor: C.dim, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    modalOrderNum: { fontSize: 12, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 3 },
    modalProjectName: { fontSize: 20, fontWeight: '800', color: C.text, maxWidth: 280 },
    modalCloseBtn: { padding: 8, backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: C.border },
    modalBody: { paddingTop: 16 },
    infoGrid: { gap: 2, marginTop: 16, marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    infoRowIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center' },
    infoRowContent: { flex: 1 },
    infoLabel: { fontSize: 11, color: C.sub, fontWeight: '600', marginBottom: 1 },
    infoValue: { fontSize: 14, fontWeight: '700', color: C.text },
    notesBox: { backgroundColor: C.surface2, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border },
    notesLabel: { fontSize: 11, fontWeight: '700', color: C.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    notesText: { fontSize: 13, color: C.text, lineHeight: 20 },
    warningBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: C.amber + '12', borderRadius: 10, padding: 12,
        borderWidth: 1, borderColor: C.amber + '30', marginBottom: 16,
    },
    warningText: { fontSize: 12, color: C.amber, fontWeight: '600', flex: 1 },
    modalControls: { gap: 10, marginBottom: 16 },
    modalCtaBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 52, borderRadius: 14,
    },
    modalCtaBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    // Status pill
    pill: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
    pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
});
