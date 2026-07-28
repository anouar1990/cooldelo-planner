import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, TextInput, FlatList, 
    TouchableOpacity, Image, ActivityIndicator, useWindowDimensions,
    Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Download, FileType2, X, Lock, Zap, Library, Heart, TrendingUp, Sparkles } from 'lucide-react-native';
import { useDesignLibrary, Design } from '../hooks/useDesignLibrary';
import { AssetDetailsModal } from '../components/AssetDetailsModal';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../context/LanguageContext';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { trackEvent } from '../lib/analytics';
import AdminUploadScreen from './AdminUploadScreen';

const COLORS = {
    bg: '#0A0C12',
    surface: '#13151F',
    surfaceHover: '#1A1D27',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    textSub: '#8B95A8',
    text: '#F1F5F9',
    gold: '#F59E0B',
};

const CATEGORIES = [
  'All', 'Wall Art', 'Signs', 'Boxes', 'Lamps', 'Earrings', 'Christmas', 'Ramadan', 'Eid',
  'Home Decor', 'Kitchen', 'Furniture', 'Kids', 'Business Signs', 'Animals', 'Vehicles',
  'Industrial', '3D Layered Art', 'DXF', 'SVG', 'AI'
];

const FILE_TYPES = ['All', 'svg', 'dxf', 'pdf', 'png', 'ai'];

export default function DesignLibraryScreen() {
    const { width } = useWindowDimensions();
    const { isFree, isStarter, isPro } = useSubscription();
    const { t } = useLanguage();
    const isDesktop = width > 768;
    const numColumns = isDesktop ? 4 : 2;

    const { 
        designs, loading, hasMore, searchQuery, 
        selectedCategory, selectedFileType,
        setSearchQuery, setSelectedCategory, setSelectedFileType, 
        fetchDesigns 
    } = useDesignLibrary();

    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
    const [showProModal, setShowProModal] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'featured'>('all');
    const { session } = useAuth();
    const isAdmin = session?.user?.user_metadata?.is_admin === true || session?.user?.user_metadata?.is_admin === 'true';
    const [showAdminModal, setShowAdminModal] = useState(false);

    useEffect(() => {
        fetchDesigns(true);
        trackEvent('pro_feature_viewed', { feature: 'design_library' });
    }, []);

    const toggleFavorite = (id: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectDesign = (design: Design) => {
        if (isFree) {
            setShowProModal(true);
            return;
        }
        setSelectedDesign(design);
    };

    const renderDesignCard = ({ item }: { item: Design }) => {
        const isFav = favorites.has(item.id);
        const downloadCount = item.downloads_count ?? Math.floor(Math.abs(item.id.charCodeAt(0) * 12) % 450 + 15);
        const isPremium = (item as any).is_premium ?? true;
        const isLocked = isFree && isPremium;

        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => handleSelectDesign(item)}
                activeOpacity={0.8}
            >
                <View style={styles.thumbnailContainer}>
                    {item.thumbnail_url ? (
                        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
                    ) : (
                        <View style={styles.placeholderThumbnail}>
                            <FileType2 color={COLORS.textSub} size={32} />
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.favBtn}
                        onPress={() => toggleFavorite(item.id)}
                    >
                        <Heart size={16} color={isFav ? COLORS.primary : '#FFF'} fill={isFav ? COLORS.primary : 'transparent'} />
                    </TouchableOpacity>

                    {isLocked ? (
                        <View style={styles.lockBadge}>
                            <Lock size={12} color="#FFF" />
                            <Text style={styles.lockText}>PRO</Text>
                        </View>
                    ) : (
                        <View style={styles.fileTypeBadge}>
                            <Text style={styles.fileTypeText}>{item.file_type.toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.cardMeta}>
                        <Text style={styles.categoryBadge}>{item.category || 'Vector'}</Text>
                        <View style={styles.downloadStat}>
                            <Download size={12} color={COLORS.textSub} />
                            <Text style={styles.downloadStatText}>{downloadCount}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Laser & CNC Vector Vault</Text>
                    <Text style={styles.subtitle}>Curated production-ready DXF, SVG & AI design files</Text>
                </View>
                {isAdmin && (
                    <TouchableOpacity style={styles.adminBtn} onPress={() => setShowAdminModal(true)}>
                        <Text style={styles.adminBtnText}>+ Upload Design</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Quick Filters / Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search color={COLORS.textSub} size={18} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search vector designs (e.g. Wall Art, Box, Sign)..."
                        placeholderTextColor={COLORS.textSub}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X color={COLORS.textSub} size={16} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories Horizontal Selector */}
            <View style={styles.categoriesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                    {CATEGORIES.map(cat => {
                        const isSelected = (cat === 'All' && !selectedCategory) || selectedCategory === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.catChip, isSelected && styles.activeCatChip]}
                                onPress={() => setSelectedCategory(cat === 'All' ? null : cat)}
                            >
                                <Text style={[styles.catChipText, isSelected && styles.activeCatChipText]}>{cat}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Designs Grid */}
            {loading && designs.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={designs}
                    renderItem={renderDesignCard}
                    keyExtractor={item => item.id}
                    numColumns={numColumns}
                    key={numColumns} // Force re-render on orientation change
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Design Asset Modal */}
            {selectedDesign && (
                <AssetDetailsModal
                    visible={!!selectedDesign}
                    design={selectedDesign}
                    onClose={() => setSelectedDesign(null)}
                />
            )}

            {/* Pro Upgrade Modal */}
            <ProUpgradeModal
                visible={showProModal}
                onClose={() => setShowProModal(false)}
                featureName="Vector Design Library"
                actionTitle="Unlock Premium Design Files"
                description="Upgrade to Starter ($9/mo) or Pro ($19/mo) to download production-ready DXF, SVG, and AI design vectors!"
            />

            {/* Admin Upload Modal */}
            {isAdmin && (
                <Modal visible={showAdminModal} animationType="slide">
                    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: COLORS.border }}>
                            <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 18 }}>Admin Upload</Text>
                            <TouchableOpacity onPress={() => setShowAdminModal(false)}>
                                <X color={COLORS.textSub} size={24} />
                            </TouchableOpacity>
                        </View>
                        <AdminUploadScreen />
                    </SafeAreaView>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    subtitle: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
    adminBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    adminBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

    searchSection: { paddingHorizontal: 16, marginBottom: 10 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: COLORS.border },
    searchInput: { flex: 1, color: COLORS.text, marginLeft: 8, fontSize: 13 },

    categoriesContainer: { marginBottom: 12 },
    categoriesScroll: { paddingHorizontal: 16, gap: 8 },
    catChip: { backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
    activeCatChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    catChipText: { fontSize: 12, color: COLORS.textSub, fontWeight: '600' },
    activeCatChipText: { color: '#FFF', fontWeight: '700' },

    listContent: { paddingHorizontal: 12, paddingBottom: 40 },
    card: { flex: 1, margin: 6, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
    thumbnailContainer: { height: 140, width: '100%', backgroundColor: '#181A26', position: 'relative' },
    thumbnail: { width: '100%', height: '100%' },
    placeholderThumbnail: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    favBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 6 },
    fileTypeBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    fileTypeText: { fontSize: 9, fontWeight: '800', color: COLORS.primary },
    lockBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
    lockText: { fontSize: 9, fontWeight: '900', color: '#FFF' },

    cardInfo: { padding: 10 },
    cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoryBadge: { fontSize: 11, color: COLORS.textSub },
    downloadStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    downloadStatText: { fontSize: 11, color: COLORS.textSub },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
