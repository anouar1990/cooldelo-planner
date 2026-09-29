import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Animated, Platform, useWindowDimensions,
    ActivityIndicator, Modal, KeyboardAvoidingView, PanResponder
} from 'react-native';
import { Bot, Sparkles, X, Send, Maximize2, Trash2, Zap, MessageSquare, RefreshCw } from 'lucide-react-native';
import { useLaserExpert } from '../hooks/useLaserExpert';

const COLORS = {
    bg: '#0A0C12',
    surface: '#13151F',
    surfaceSubtle: '#1C1F2E',
    border: 'rgba(255, 107, 53, 0.25)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    primary: '#FF6B35',
    primaryGlow: 'rgba(255, 107, 53, 0.35)',
    text: '#FFFFFF',
    textSub: '#8B95A8',
    assistantBubble: '#191C29',
    userBubble: '#FF6B35',
    success: '#10B981',
};

const QUICK_PROMPTS = [
    '🔥 6mm Plywood cutting settings',
    '⚡ Why is my engraving burning?',
    '💰 How to price laser projects?',
    '🎯 Acrylic engraving speed & power',
];

interface LaserExpertBubbleProps {
    onOpenFullScreen?: () => void;
}

export function LaserExpertBubble({ onOpenFullScreen }: LaserExpertBubbleProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const { width, height } = useWindowDimensions();
    const isMobile = width < 640;

    const {
        messages,
        sending,
        sendMessage,
        newConversation,
    } = useLaserExpert();

    const scrollViewRef = useRef<ScrollView>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pan = useRef(new Animated.ValueXY()).current;
    const isDraggingRef = useRef(false);

    // Draggable PanResponder
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
            },
            onPanResponderGrant: () => {
                isDraggingRef.current = false;
                pan.extractOffset();
            },
            onPanResponderMove: (e, gestureState) => {
                if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
                    isDraggingRef.current = true;
                }
                Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(e, gestureState);
            },
            onPanResponderRelease: (_, gestureState) => {
                pan.flattenOffset();
                if (!isDraggingRef.current && Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
                    setIsOpen(true);
                }
            },
        })
    ).current;

    // Pulse animation for the bubble dot
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.25,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (isOpen && messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, isOpen]);

    const handleSend = async (textToSend?: string) => {
        const content = textToSend || inputText;
        if (!content.trim() || sending) return;

        setInputText('');
        await sendMessage(content);
    };

    return (
        <>
            {/* FLOATING DRAGGABLE BUBBLE BUTTON */}
            {!isOpen && (
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                        styles.bubblePositioner,
                        isMobile && styles.bubblePositionerMobile,
                        { transform: pan.getTranslateTransform() }
                    ]}
                >
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                            if (!isDraggingRef.current) {
                                setIsOpen(true);
                            }
                        }}
                        style={styles.bubbleButton}
                    >
                        <View style={styles.bubbleIconWrapper}>
                            <Bot color="#FFFFFF" size={26} />
                            <Animated.View
                                style={[
                                    styles.pulseDot,
                                    { transform: [{ scale: pulseAnim }] }
                                ]}
                            />
                        </View>
                        <View style={styles.bubbleTextContainer}>
                            <Text style={styles.bubbleTitle}>0machine AI</Text>
                            <Text style={styles.bubbleSubtitle}>Laser & CNC Expert</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* FLOATING CHAT MODAL / POPUP */}
            {isOpen && (
                <View style={[styles.chatModalOverlay, isMobile && styles.chatModalMobile]}>
                    <View style={styles.chatContainer}>
                        {/* CHAT HEADER */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={styles.headerAvatar}>
                                    <Bot color="#FF6B35" size={20} />
                                </View>
                                <View>
                                    <View style={styles.headerTitleRow}>
                                        <Text style={styles.headerTitle}>Laser Expert AI</Text>
                                        <View style={styles.onlineBadge}>
                                            <View style={styles.onlineDot} />
                                            <Text style={styles.onlineText}>Online</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.headerSubtitle}>0machine Woodworking & CNC Assistant</Text>
                                </View>
                            </View>

                            <View style={styles.headerRight}>
                                {onOpenFullScreen && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsOpen(false);
                                            onOpenFullScreen();
                                        }}
                                        style={styles.iconBtn}
                                    >
                                        <Maximize2 color="#8B95A8" size={18} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={newConversation}
                                    style={styles.iconBtn}
                                >
                                    <RefreshCw color="#8B95A8" size={18} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setIsOpen(false)}
                                    style={styles.iconBtnClose}
                                >
                                    <X color="#FFFFFF" size={20} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* MESSAGES LIST / EMPTY STATE */}
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.messagesList}
                            contentContainerStyle={styles.messagesContent}
                            showsVerticalScrollIndicator={true}
                        >
                            {messages.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconCircle}>
                                        <Sparkles color="#FF6B35" size={28} />
                                    </View>
                                    <Text style={styles.emptyTitle}>Ask me anything about Laser & Woodworking!</Text>
                                    <Text style={styles.emptySub}>
                                        I can optimize speeds & power, troubleshoot laser burn, estimate job costs, or guide your 0machine setup.
                                    </Text>

                                    <View style={styles.quickPromptsGrid}>
                                        {QUICK_PROMPTS.map((prompt, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.quickPromptBtn}
                                                onPress={() => handleSend(prompt)}
                                            >
                                                <Text style={styles.quickPromptText}>{prompt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                messages.map((msg) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <View
                                            key={msg.id}
                                            style={[
                                                styles.messageRow,
                                                isUser ? styles.userRow : styles.assistantRow
                                            ]}
                                        >
                                            {!isUser && (
                                                <View style={styles.miniAvatar}>
                                                    <Zap color="#FF6B35" size={14} />
                                                </View>
                                            )}
                                            <View
                                                style={[
                                                    styles.messageBubble,
                                                    isUser ? styles.userBubble : styles.assistantBubble
                                                ]}
                                            >
                                                <Text style={styles.messageText}>
                                                    {msg.content}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}

                            {sending && (
                                <View style={[styles.messageRow, styles.assistantRow]}>
                                    <View style={styles.miniAvatar}>
                                        <Zap color="#FF6B35" size={14} />
                                    </View>
                                    <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                                        <ActivityIndicator size="small" color="#FF6B35" />
                                        <Text style={styles.loadingText}>Thinking...</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* INPUT BAR */}
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        >
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type your question..."
                                    placeholderTextColor="#64748B"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    onSubmitEditing={() => handleSend()}
                                    editable={!sending}
                                    multiline={false}
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.sendBtn,
                                        (!inputText.trim() || sending) && styles.sendBtnDisabled
                                    ]}
                                    onPress={() => handleSend()}
                                    disabled={!inputText.trim() || sending}
                                >
                                    <Send color="#FFFFFF" size={18} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.disclaimerText}>
                                Restricted strictly to 0machine, Woodworking, Laser Cutting & CNC.
                            </Text>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    /* FLOATING BUBBLE */
    bubblePositioner: {
        position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 9999,
    },
    bubblePositionerMobile: {
        bottom: 85,
        right: 16,
    },
    bubbleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#13151F',
        borderWidth: 1.5,
        borderColor: '#FF6B35',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        ...Platform.select({
            web: {
                boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)',
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
            } as any,
            default: {
                elevation: 10,
                shadowColor: '#FF6B35',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
            },
        }),
    },
    bubbleIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        position: 'relative',
    },
    pulseDot: {
        position: 'absolute',
        top: -1,
        right: -1,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
        borderWidth: 1.5,
        borderColor: '#13151F',
    },
    bubbleTextContainer: {
        justifyContent: 'center',
    },
    bubbleTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    bubbleSubtitle: {
        color: '#8B95A8',
        fontSize: 11,
        fontWeight: '500',
    },

    /* FLOATING CHAT POPUP */
    chatModalOverlay: {
        position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
        bottom: 24,
        right: 24,
        width: 400,
        height: 580,
        maxHeight: '82%',
        zIndex: 10000,
    },
    chatModalMobile: {
        bottom: 0,
        right: 0,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        maxHeight: '100%',
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#13151F',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 107, 53, 0.35)',
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 107, 53, 0.2)',
            },
            default: {
                elevation: 20,
            },
        }),
    },

    /* HEADER */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#191C29',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        gap: 4,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    onlineText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '600',
    },
    headerSubtitle: {
        color: '#8B95A8',
        fontSize: 11,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconBtnClose: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        marginLeft: 4,
    },

    /* MESSAGES */
    messagesList: {
        flex: 1,
        paddingHorizontal: 14,
    },
    messagesContent: {
        paddingVertical: 14,
        gap: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 12,
    },
    emptyIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 6,
    },
    emptySub: {
        color: '#8B95A8',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 18,
    },
    quickPromptsGrid: {
        width: '100%',
        gap: 8,
    },
    quickPromptBtn: {
        backgroundColor: '#1C1F2E',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    quickPromptText: {
        color: '#CBD5E1',
        fontSize: 12,
        fontWeight: '500',
    },

    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 4,
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    assistantRow: {
        justifyContent: 'flex-start',
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
        marginBottom: 2,
    },
    messageBubble: {
        maxWidth: '82%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: '#FF6B35',
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: '#1C1F2E',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    messageText: {
        color: '#FFFFFF',
        fontSize: 13,
        lineHeight: 19,
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        color: '#8B95A8',
        fontSize: 12,
    },

    /* INPUT CONTAINER */
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#191C29',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#0A0C12',
        color: '#FFFFFF',
        fontSize: 13,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(255, 107, 53, 0.4)',
    },
    disclaimerText: {
        color: '#64748B',
        fontSize: 10,
        textAlign: 'center',
        paddingVertical: 4,
        backgroundColor: '#191C29',
    },
});
