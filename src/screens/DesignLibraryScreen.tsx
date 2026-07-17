import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, TextInput, FlatList, 
    TouchableOpacity, Image, ActivityIndicator, useWindowDimensions,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Download, FileType2, X } from 'lucide-react-native';
import { useDesignLibrary, Design } from '../hooks/useDesignLibrary';
import { AssetDetailsModal } from '../components/AssetDetailsModal';
import { useAuth } from '../hooks/useAuth';
import AdminUploadScreen from './AdminUploadScreen';

const COLORS = {
    bg: '#0A0C12',
    surface: '#13151F',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    textSub: '#8B95A8',
    text: '#F1F5F9',
};

const CATEGORIES = ['All', 'Ramadan', 'Eid', 'Wedding', 'Kids', 'School', 'Islamic', 'Business', 'Crafts', 'Laser Cutting', 'CNC'];
const FILE_TYPES = ['All', 'svg', 'dxf', 'pdf', 'png', 'ai'];

export default function DesignLibraryScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const numColumns = isDesktop ? 4 : 2;

    const { 
        designs, loading, hasMore, searchQuery, 
        selectedCategory, selectedFileType,
        setSearchQuery, setSelectedCategory, setSelectedFileType, 
        fetchDesigns 
    } = useDesignLibrary();

    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
    const { session } = useAuth();
    const isAdmin = session?.user?.user_metadata?.is_admin === true || session?.user?.user_metadata?.is_admin === 'true';
    const [showAdminModal, setShowAdminModal] = useState(false);

    // Initial load
    useEffect(() => {
        fetchDesigns(true);
    }, []);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
    };

    const renderDesignCard = ({ item }: { item: Design }) => (
        <TouchableOpacity 
            style={[styles.card, { flex: 1 / numColumns }]}
            onPress={() => setSelectedDesign(item)}
            activeOpacity={0.7}
        >
            <View style={styles.thumbnailContainer}>
                {item.thumbnail_url ? (
                    <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderThumbnail}>
                        <FileType2 color={COLORS.textSub} size={32} />
                    </View>
                )}
                <View style={styles.fileTypeBadge}>
                    <Text style={styles.fileTypeText}>{item.file_type.toUpperCase()}</Text>
                </View>
            </View>
            
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardMeta}>
                    <Text style={styles.cardCategory} numberOfLines={1}>
                        {item.category || 'Uncategorized'}
                    </Text>
                    <View style={styles.downloadStat}>
                        <Download size={12} color={COLORS.textSub} />
                        <Text style={styles.downloadText}>{item.downloads_count}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <FlatList
                horizontal
                data={CATEGORIES}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                    const isSelected = (item === 'All' && !selectedCategory) || item === selectedCategory;
                    return (
                        <TouchableOpacity
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() => setSelectedCategory(item === 'All' ? null : item)}
                        >
                            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
                contentContainerStyle={styles.filterList}
            />
            <FlatList
                horizontal
                data={FILE_TYPES}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                    const isSelected = (item === 'All' && !selectedFileType) || item === selectedFileType;
                    return (
                        <TouchableOpacity
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() => setSelectedFileType(item === 'All' ? null : item)}
                        >
                            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                                {item.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
                contentContainerStyle={[styles.filterList, { marginTop: 8 }]}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <View>
                        <Text style={styles.headerTitle}>Design Library</Text>
                        <Text style={styles.headerSubtitle}>Discover 20,000+ premium vector designs</Text>
                    </View>
                    {isAdmin && (
                        <TouchableOpacity 
                            style={styles.adminButton}
                            onPress={() => setShowAdminModal(true)}
                        >
                            <Text style={styles.adminButtonText}>⚙️ Manage Library</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Search color={COLORS.textSub} size={20} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search designs, tags, or categories..."
                    placeholderTextColor={COLORS.textSub}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    onSubmitEditing={() => fetchDesigns(true)}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearSearch}>
                        <X color={COLORS.textSub} size={16} />
                    </TouchableOpacity>
                )}
            </View>

            {renderFilters()}

            {designs.length === 0 && !loading ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No designs found</Text>
                    <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
                </View>
            ) : (
                <FlatList
                    data={designs}
                    key={numColumns} // Force re-render on grid size change
                    numColumns={numColumns}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDesignCard}
                    contentContainerStyle={styles.gridContainer}
                    columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
                    onEndReached={() => {
                        if (hasMore && !loading) {
                            fetchDesigns();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => 
                        loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ margin: 20 }} /> : null
                    }
                />
            )}

            {selectedDesign && (
                <AssetDetailsModal 
                    design={selectedDesign} 
                    visible={!!selectedDesign} 
                    onClose={() => setSelectedDesign(null)} 
                />
            )}

            <Modal 
                visible={showAdminModal} 
                animationType="slide" 
                onRequestClose={() => setShowAdminModal(false)}
            >
                <AdminUploadScreen onClose={() => { setShowAdminModal(false); fetchDesigns(true); }} />
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSub,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: 20,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 48,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        outlineStyle: 'none', // Web outline fix
    },
    clearSearch: {
        padding: 4,
    },
    filtersContainer: {
        marginBottom: 16,
    },
    filterList: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        color: COLORS.textSub,
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    gridContainer: {
        padding: 12,
    },
    gridRow: {
        justifyContent: 'flex-start',
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        margin: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    thumbnailContainer: {
        aspectRatio: 1,
        width: '100%',
        backgroundColor: '#1A1D27',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    placeholderThumbnail: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileTypeBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    fileTypeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    cardInfo: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6,
    },
    cardMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardCategory: {
        fontSize: 12,
        color: COLORS.textSub,
        flex: 1,
        marginRight: 8,
    },
    downloadStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    downloadText: {
        fontSize: 12,
        color: COLORS.textSub,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSub,
        textAlign: 'center',
    },
    adminButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    adminButtonText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '700',
    },
});
