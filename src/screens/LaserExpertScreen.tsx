import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TextInput, TouchableOpacity, Platform, useWindowDimensions,
    KeyboardAvoidingView, ActivityIndicator, Clipboard, Alert,
} from 'react-native';
import {
    Bot, Send, Plus, Trash2, Copy, RotateCcw,
    MessageSquare, ChevronLeft, X, Sparkles, Zap,
    AlertTriangle, Menu, Edit3, Check
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLaserExpert, AIMessage, AIConversation } from '../hooks/useLaserExpert';
import { trackEvent } from '../lib/analytics';

// ═══════════════════════════════════════════════════════════════════
// SUGGESTED PROMPTS
// ═══════════════════════════════════════════════════════════════════

const SUGGESTED_PROMPTS = [
    { icon: '🔥', text: 'How do I cut 6mm plywood on a CO2 laser?' },
    { icon: '⚡', text: 'Why is my engraving too dark?' },
    { icon: '💰', text: 'Help me calculate my project cost' },
    { icon: '🎯', text: 'Best settings for acrylic engraving?' },
    { icon: '📐', text: 'How can I reduce material waste?' },
    { icon: '🔧', text: 'My laser is not cutting through — troubleshoot' },
];

// ═══════════════════════════════════════════════════════════════════
// SIMPLE MARKDOWN RENDERER
// ═══════════════════════════════════════════════════════════════════

function renderMarkdown(text: string, textColor: string, subColor: string, primaryColor: string, surfaceColor: string) {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code block start/end
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                // End code block
                elements.push(
                    <View key={`code-${i}`} style={[mdStyles.codeBlock, { backgroundColor: surfaceColor }]}>
                        {codeBlockLang ? (
                            <Text style={[mdStyles.codeBlockLang, { color: primaryColor }]}>{codeBlockLang}</Text>
                        ) : null}
                        <Text style={[mdStyles.codeText, { color: textColor }]}>{codeBlockContent.join('\n')}</Text>
                    </View>
                );
                inCodeBlock = false;
                codeBlockContent = [];
                codeBlockLang = '';
            } else {
                inCodeBlock = true;
                codeBlockLang = line.trim().replace('```', '').trim();
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Empty line
        if (line.trim() === '') {
            elements.push(<View key={`space-${i}`} style={{ height: 8 }} />);
            continue;
        }

        // Headers
        if (line.startsWith('### ')) {
            elements.push(
                <Text key={`h3-${i}`} style={[mdStyles.h3, { color: textColor }]}>{line.slice(4)}</Text>
            );
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(
                <Text key={`h2-${i}`} style={[mdStyles.h2, { color: textColor }]}>{line.slice(3)}</Text>
            );
            continue;
        }
        if (line.startsWith('# ')) {
            elements.push(
                <Text key={`h1-${i}`} style={[mdStyles.h1, { color: textColor }]}>{line.slice(2)}</Text>
            );
            continue;
        }

        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const indent = line.length - line.trimStart().length;
            const bulletText = line.trim().slice(2);
            elements.push(
                <View key={`bullet-${i}`} style={[mdStyles.bulletRow, { marginLeft: indent * 8 }]}>
                    <Text style={[mdStyles.bulletDot, { color: primaryColor }]}>•</Text>
                    <Text style={[mdStyles.bulletText, { color: textColor }]}>{renderInlineFormatting(bulletText, textColor, primaryColor, surfaceColor)}</Text>
                </View>
            );
            continue;
        }

        // Numbered list
        const numberedMatch = line.trim().match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
            elements.push(
                <View key={`num-${i}`} style={mdStyles.bulletRow}>
                    <Text style={[mdStyles.numDot, { color: primaryColor }]}>{numberedMatch[1]}.</Text>
                    <Text style={[mdStyles.bulletText, { color: textColor }]}>{renderInlineFormatting(numberedMatch[2], textColor, primaryColor, surfaceColor)}</Text>
                </View>
            );
            continue;
        }

        // Regular paragraph
        elements.push(
            <Text key={`p-${i}`} style={[mdStyles.paragraph, { color: textColor }]}>
                {renderInlineFormatting(line, textColor, primaryColor, surfaceColor)}
            </Text>
        );
    }

    // Close unclosed code block
    if (inCodeBlock && codeBlockContent.length > 0) {
        elements.push(
            <View key="code-final" style={[mdStyles.codeBlock, { backgroundColor: surfaceColor }]}>
                <Text style={[mdStyles.codeText, { color: textColor }]}>{codeBlockContent.join('\n')}</Text>
            </View>
        );
    }

    return elements;
}

function renderInlineFormatting(text: string, textColor: string, primaryColor: string, surfaceColor: string): React.ReactNode {
    // Bold + inline code
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        if (match[2]) {
            // Bold
            parts.push(
                <Text key={`bold-${match.index}`} style={{ fontWeight: '700', color: textColor }}>{match[2]}</Text>
            );
        } else if (match[4]) {
            // Inline code
            parts.push(
                <Text key={`code-${match.index}`} style={[mdStyles.inlineCode, { backgroundColor: surfaceColor, color: primaryColor }]}>{match[4]}</Text>
            );
        }
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}

const mdStyles = StyleSheet.create({
    h1: { fontSize: 20, fontWeight: '800', marginBottom: 8, marginTop: 4 },
    h2: { fontSize: 17, fontWeight: '700', marginBottom: 6, marginTop: 4 },
    h3: { fontSize: 15, fontWeight: '700', marginBottom: 4, marginTop: 4 },
    paragraph: { fontSize: 14.5, lineHeight: 22, marginBottom: 2 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, paddingRight: 8 },
    bulletDot: { fontSize: 14, fontWeight: '700', marginRight: 8, marginTop: 2, width: 12 },
    numDot: { fontSize: 14, fontWeight: '700', marginRight: 8, marginTop: 1, minWidth: 18 },
    bulletText: { fontSize: 14.5, lineHeight: 22, flex: 1 },
    codeBlock: { borderRadius: 10, padding: 14, marginVertical: 6 },
    codeBlockLang: { fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    codeText: { fontSize: 13, fontFamily: Platform.OS === 'web' ? 'Menlo, monospace' : 'monospace', lineHeight: 20 },
    inlineCode: { fontSize: 13, fontFamily: Platform.OS === 'web' ? 'Menlo, monospace' : 'monospace', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
});

// ═══════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE COMPONENT
// ═══════════════════════════════════════════════════════════════════

function MessageBubble({
    message, colors, primaryColor, isLast, onCopy, onRetry,
}: {
    message: AIMessage; colors: any; primaryColor: string; isLast: boolean;
    onCopy: () => void; onRetry: () => void;
}) {
    const isUser = message.role === 'user';
    const [showActions, setShowActions] = useState(false);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => setShowActions(v => !v)}
            onPress={() => showActions && setShowActions(false)}
            style={[
                bubbleStyles.container,
                isUser ? bubbleStyles.userContainer : bubbleStyles.assistantContainer,
            ]}
        >
            {/* Avatar */}
            {!isUser && (
                <View style={[bubbleStyles.avatar, { backgroundColor: primaryColor + '20' }]}>
                    <Bot color={primaryColor} size={16} />
                </View>
            )}

            <View style={[
                bubbleStyles.bubble,
                isUser
                    ? [bubbleStyles.userBubble, { backgroundColor: primaryColor }]
                    : [bubbleStyles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
            ]}>
                {isUser ? (
                    <Text style={[bubbleStyles.userText]}>{message.content}</Text>
                ) : (
                    <View>{renderMarkdown(message.content, colors.text, colors.sub, primaryColor, colors.surface2 || colors.bg)}</View>
                )}

                {message.isOptimistic && (
                    <View style={bubbleStyles.sendingIndicator}>
                        <ActivityIndicator size="small" color={isUser ? '#fff' : primaryColor} />
                    </View>
                )}
            </View>

            {/* Action buttons on long press or for assistant's last message */}
            {(showActions || (isLast && !isUser && !message.isOptimistic)) && (
                <View style={[bubbleStyles.actions, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity onPress={onCopy} style={bubbleStyles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Copy color={colors.sub} size={14} />
                    </TouchableOpacity>
                    {isLast && !isUser && (
                        <TouchableOpacity onPress={onRetry} style={bubbleStyles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <RotateCcw color={colors.sub} size={14} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

const bubbleStyles = StyleSheet.create({
    container: { marginBottom: 12, paddingHorizontal: 16, maxWidth: '100%' },
    userContainer: { alignItems: 'flex-end' },
    assistantContainer: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
    avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    bubble: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, maxWidth: '85%' },
    userBubble: { borderBottomRightRadius: 4 },
    assistantBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
    userText: { color: '#FFFFFF', fontSize: 14.5, lineHeight: 22 },
    sendingIndicator: { marginTop: 4, alignSelf: 'flex-end' },
    actions: { flexDirection: 'row', gap: 4, marginTop: 4, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
    actionBtn: { padding: 4 },
});

// ═══════════════════════════════════════════════════════════════════
// CONVERSATION LIST ITEM
// ═══════════════════════════════════════════════════════════════════

function ConversationItem({
    conversation, isActive, colors, primaryColor,
    onSelect, onDelete, onRename,
}: {
    conversation: AIConversation; isActive: boolean; colors: any; primaryColor: string;
    onSelect: () => void; onDelete: () => void; onRename: (title: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(conversation.title);

    const handleRename = () => {
        if (editTitle.trim()) {
            onRename(editTitle.trim());
        }
        setEditing(false);
    };

    return (
        <TouchableOpacity
            onPress={onSelect}
            style={[
                convStyles.item,
                { borderColor: colors.border },
                isActive && { backgroundColor: primaryColor + '15', borderColor: primaryColor + '30' },
            ]}
            activeOpacity={0.7}
        >
            <MessageSquare color={isActive ? primaryColor : colors.sub} size={16} />
            {editing ? (
                <View style={convStyles.editRow}>
                    <TextInput
                        value={editTitle}
                        onChangeText={setEditTitle}
                        style={[convStyles.editInput, { color: colors.text, borderColor: colors.border }]}
                        autoFocus
                        onSubmitEditing={handleRename}
                        onBlur={handleRename}
                    />
                    <TouchableOpacity onPress={handleRename} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Check color={primaryColor} size={14} />
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={[convStyles.title, { color: isActive ? colors.text : colors.sub }]} numberOfLines={1}>
                    {conversation.title}
                </Text>
            )}
            <View style={convStyles.actions}>
                {!editing && (
                    <TouchableOpacity
                        onPress={() => { setEditTitle(conversation.title); setEditing(true); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={convStyles.actionBtn}
                    >
                        <Edit3 color={colors.dim} size={12} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={onDelete}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={convStyles.actionBtn}
                >
                    <Trash2 color={colors.dim} size={12} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const convStyles = StyleSheet.create({
    item: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 4 },
    title: { flex: 1, fontSize: 13, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 4 },
    actionBtn: { padding: 4 },
    editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    editInput: { flex: 1, fontSize: 13, fontWeight: '600', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
});

// ═══════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════

function EmptyState({ colors, primaryColor, onPromptSelect }: {
    colors: any; primaryColor: string; onPromptSelect: (text: string) => void;
}) {
    return (
        <ScrollView
            contentContainerStyle={emptyStyles.container}
            showsVerticalScrollIndicator={false}
        >
            <View style={[emptyStyles.iconWrap, { backgroundColor: primaryColor + '15' }]}>
                <Bot color={primaryColor} size={40} />
            </View>
            <Text style={[emptyStyles.title, { color: colors.text }]}>
                0machine Laser Expert
            </Text>
            <Text style={[emptyStyles.subtitle, { color: colors.sub }]}>
                Specialized AI assistant exclusively for Woodworking, Laser Cutting, CNC Fabrication, and 0machine Tools
            </Text>

            <View style={emptyStyles.capabilities}>
                {[
                    { icon: '⚡', label: 'Machine Settings' },
                    { icon: '🧪', label: 'Materials' },
                    { icon: '🔧', label: 'Troubleshooting' },
                    { icon: '📐', label: 'SVG / DXF' },
                    { icon: '💰', label: 'Cost Calculation' },
                    { icon: '📦', label: 'Production' },
                ].map((cap, i) => (
                    <View key={i} style={[emptyStyles.capBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={emptyStyles.capIcon}>{cap.icon}</Text>
                        <Text style={[emptyStyles.capLabel, { color: colors.sub }]}>{cap.label}</Text>
                    </View>
                ))}
            </View>

            <Text style={[emptyStyles.promptsTitle, { color: colors.dim }]}>
                Try asking
            </Text>

            <View style={emptyStyles.prompts}>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => onPromptSelect(prompt.text)}
                        style={[emptyStyles.promptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        activeOpacity={0.7}
                    >
                        <Text style={emptyStyles.promptIcon}>{prompt.icon}</Text>
                        <Text style={[emptyStyles.promptText, { color: colors.text }]}>{prompt.text}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const emptyStyles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
    iconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24, maxWidth: 340 },
    capabilities: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 32 },
    capBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    capIcon: { fontSize: 14 },
    capLabel: { fontSize: 12, fontWeight: '600' },
    promptsTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    prompts: { width: '100%', maxWidth: 500, gap: 8 },
    promptCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
    promptIcon: { fontSize: 18 },
    promptText: { fontSize: 14, fontWeight: '500', flex: 1 },
});

// ═══════════════════════════════════════════════════════════════════
// THINKING INDICATOR
// ═══════════════════════════════════════════════════════════════════

function ThinkingIndicator({ colors, primaryColor }: { colors: any; primaryColor: string }) {
    return (
        <View style={[thinkStyles.container, { paddingHorizontal: 16 }]}>
            <View style={[bubbleStyles.avatar, { backgroundColor: primaryColor + '20' }]}>
                <Bot color={primaryColor} size={16} />
            </View>
            <View style={[thinkStyles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={thinkStyles.dots}>
                    {[0, 1, 2].map(i => (
                        <View key={i} style={[thinkStyles.dot, { backgroundColor: primaryColor }]} />
                    ))}
                </View>
                <Text style={[thinkStyles.label, { color: colors.sub }]}>Laser Expert is thinking...</Text>
            </View>
        </View>
    );
}

const thinkStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
    bubble: { borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
    dots: { flexDirection: 'row', gap: 6, marginBottom: 4 },
    dot: { width: 8, height: 8, borderRadius: 4, opacity: 0.6 },
    label: { fontSize: 13, fontStyle: 'italic' },
});

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════

export default function LaserExpertScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const {
        conversations, conversationsLoading, activeConversationId,
        selectConversation, newConversation, deleteConversation, renameConversation,
        messages, loading, sending, error, sendMessage, retryLastMessage, setError,
    } = useLaserExpert();

    const [inputText, setInputText] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const primaryColor = colors.primary || '#FE7733';

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length, sending]);

    // Send handler
    const handleSend = useCallback(async () => {
        if (!inputText.trim() || sending) return;
        const text = inputText;
        setInputText('');
        trackEvent('ai_message_sent', { feature: 'laser_expert' });
        await sendMessage(text);
    }, [inputText, sending, sendMessage]);

    // Keyboard handler for web
    const handleKeyPress = useCallback((e: any) => {
        if (Platform.OS === 'web' && e.nativeEvent) {
            if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault?.();
                handleSend();
            }
        }
    }, [handleSend]);

    const handlePromptSelect = useCallback((text: string) => {
        setInputText(text);
        // Auto-send
        setTimeout(async () => {
            trackEvent('ai_suggested_prompt_used', { feature: 'laser_expert', prompt: text });
            await sendMessage(text);
            setInputText('');
        }, 50);
    }, [sendMessage]);

    const handleCopy = useCallback((content: string) => {
        if (Platform.OS === 'web') {
            navigator.clipboard?.writeText(content).catch(() => {});
        } else {
            Clipboard.setString(content);
        }
    }, []);

    // ─── SIDEBAR (conversations list) ──────────────────────────────
    const renderSidebar = () => (
        <View style={[
            sidebarStyles.container,
            {
                backgroundColor: colors.surface,
                borderColor: colors.border,
            },
            !isDesktop && showSidebar && sidebarStyles.mobileOverlay,
        ]}>
            <View style={sidebarStyles.header}>
                <Text style={[sidebarStyles.headerTitle, { color: colors.text }]}>Conversations</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => { newConversation(); setShowSidebar(false); }}
                        style={[sidebarStyles.newBtn, { backgroundColor: primaryColor }]}
                        activeOpacity={0.8}
                    >
                        <Plus color="#FFF" size={16} />
                    </TouchableOpacity>
                    {!isDesktop && (
                        <TouchableOpacity onPress={() => setShowSidebar(false)} style={sidebarStyles.closeBtn}>
                            <X color={colors.sub} size={18} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={sidebarStyles.list}>
                {conversationsLoading ? (
                    <ActivityIndicator color={primaryColor} style={{ marginTop: 20 }} />
                ) : conversations.length === 0 ? (
                    <Text style={[sidebarStyles.emptyText, { color: colors.dim }]}>
                        No conversations yet
                    </Text>
                ) : (
                    conversations.map(conv => (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={conv.id === activeConversationId}
                            colors={colors}
                            primaryColor={primaryColor}
                            onSelect={() => { selectConversation(conv.id); setShowSidebar(false); }}
                            onDelete={() => deleteConversation(conv.id)}
                            onRename={(title) => renameConversation(conv.id, title)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );

    // ─── MAIN CHAT AREA ────────────────────────────────────────────
    const renderChat = () => (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View style={[chatStyles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {!isDesktop && (
                    <TouchableOpacity onPress={() => setShowSidebar(true)} style={chatStyles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Menu color={colors.sub} size={20} />
                    </TouchableOpacity>
                )}
                <View style={[chatStyles.headerIcon, { backgroundColor: primaryColor + '15' }]}>
                    <Bot color={primaryColor} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[chatStyles.headerTitle, { color: colors.text }]}>Laser Expert</Text>
                    <Text style={[chatStyles.headerSub, { color: colors.sub }]}>AI assistant for laser cutting & engraving</Text>
                </View>
                <TouchableOpacity
                    onPress={() => { newConversation(); }}
                    style={[chatStyles.newChatBtn, { borderColor: colors.border }]}
                    activeOpacity={0.7}
                >
                    <Plus color={primaryColor} size={16} />
                </TouchableOpacity>
            </View>

            {/* Messages or Empty State */}
            {messages.length === 0 && !loading ? (
                <EmptyState colors={colors} primaryColor={primaryColor} onPromptSelect={handlePromptSelect} />
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    style={chatStyles.messageArea}
                    contentContainerStyle={chatStyles.messageContent}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                >
                    {loading && messages.length === 0 ? (
                        <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
                    ) : (
                        messages.filter(m => m.role !== 'system').map((msg, idx) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                colors={colors}
                                primaryColor={primaryColor}
                                isLast={idx === messages.filter(m => m.role !== 'system').length - 1}
                                onCopy={() => handleCopy(msg.content)}
                                onRetry={retryLastMessage}
                            />
                        ))
                    )}
                    {sending && <ThinkingIndicator colors={colors} primaryColor={primaryColor} />}
                </ScrollView>
            )}

            {/* Error banner */}
            {error && (
                <View style={[chatStyles.errorBanner, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}>
                    <AlertTriangle color="#EF4444" size={14} />
                    <Text style={[chatStyles.errorText, { color: '#EF4444' }]} numberOfLines={2}>{error}</Text>
                    <TouchableOpacity onPress={() => setError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <X color="#EF4444" size={14} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Input */}
            <View style={[chatStyles.inputArea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Ask about laser cutting, settings, materials..."
                    placeholderTextColor={colors.dim}
                    style={[
                        chatStyles.input,
                        {
                            color: colors.text,
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                        },
                    ]}
                    multiline
                    maxLength={8000}
                    editable={!sending}
                    onKeyPress={handleKeyPress}
                    {...(Platform.OS === 'web' ? { onSubmitEditing: handleSend } : {})}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                    style={[
                        chatStyles.sendBtn,
                        {
                            backgroundColor: inputText.trim() && !sending ? primaryColor : colors.surface2 || colors.dim + '30',
                        },
                    ]}
                    activeOpacity={0.7}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Send color={inputText.trim() ? '#FFF' : colors.dim} size={18} />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );

    // ─── LAYOUT ────────────────────────────────────────────────────
    return (
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
            <View style={styles.layout}>
                {/* Desktop sidebar always visible */}
                {isDesktop && renderSidebar()}

                {/* Mobile sidebar overlay */}
                {!isDesktop && showSidebar && (
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setShowSidebar(false)}
                    >
                        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                            {renderSidebar()}
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}

                {/* Main chat */}
                <View style={styles.chatArea}>
                    {renderChat()}
                </View>
            </View>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    screen: { flex: 1 },
    layout: { flex: 1, flexDirection: 'row' },
    chatArea: { flex: 1 },
    overlay: {
        ...Platform.select({
            web: { position: 'fixed' as any },
            default: { position: 'absolute' },
        }),
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 200,
    },
});

const sidebarStyles = StyleSheet.create({
    container: {
        width: 280,
        borderRightWidth: 1,
        padding: 16,
        ...Platform.select({ web: { height: '100%' as any } }),
    },
    mobileOverlay: {
        ...Platform.select({
            web: { position: 'fixed' as any },
            default: { position: 'absolute' },
        }),
        top: 0, left: 0, bottom: 0,
        zIndex: 201,
        width: 300,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    newBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    closeBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    list: { flex: 1 },
    emptyText: { fontSize: 13, textAlign: 'center', marginTop: 32 },
});

const chatStyles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1,
    },
    menuBtn: { marginRight: 4 },
    headerIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    headerSub: { fontSize: 11, marginTop: 1 },
    newChatBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    messageArea: { flex: 1 },
    messageContent: { paddingVertical: 16 },
    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginBottom: 8,
        padding: 12, borderRadius: 10, borderWidth: 1,
    },
    errorText: { flex: 1, fontSize: 13, fontWeight: '500' },
    inputArea: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1, minHeight: 42, maxHeight: 120,
        borderRadius: 14, borderWidth: 1,
        paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 14.5, lineHeight: 20,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },
});
