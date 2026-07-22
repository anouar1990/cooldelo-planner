import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView
} from 'react-native';
import { Zap, Check, ChevronRight, Award, Cpu, Layers } from 'lucide-react-native';
import { trackEvent } from '../lib/analytics';

const MACHINES = [
    { id: 'xtool', name: 'xTool (D1 / P2 / S1)', type: 'Diode / CO2' },
    { id: 'glowforge', name: 'Glowforge (Plus / Pro)', type: 'CO2 Laser' },
    { id: 'omtech', name: 'OMTech (50W - 100W)', type: 'CO2 Cabinet' },
    { id: 'thunder', name: 'Thunder Laser (Nova)', type: 'CO2 High-Speed' },
    { id: 'custom', name: 'Custom CO2 / Fiber / CNC', type: 'DIY / Industrial' },
];

const MATERIALS = [
    { id: 'birch_3mm', name: 'Birch Plywood 3mm', cost: '$12.00', sheet: '600x400mm' },
    { id: 'acrylic_3mm', name: 'Cast Acrylic 3mm', cost: '$18.50', sheet: '600x400mm' },
    { id: 'mdf_3mm', name: 'MDF Board 3mm', cost: '$6.00', sheet: '600x400mm' },
    { id: 'leather', name: 'Genuine Leather 2mm', cost: '$24.00', sheet: '300x300mm' },
];

interface OnboardingModalProps {
    visible: boolean;
    onComplete: (data: { machine: string; material: string }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onComplete }) => {
    const [step, setStep] = useState<number>(1);
    const [selectedMachine, setSelectedMachine] = useState<string>('xtool');
    const [selectedMaterial, setSelectedMaterial] = useState<string>('birch_3mm');

    const handleFinish = () => {
        trackEvent('activated', {
            machine: selectedMachine,
            material: selectedMaterial,
            onboarding_completed: true,
        });

        onComplete({ machine: selectedMachine, material: selectedMaterial });
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.badge}>
                            <Zap size={14} color="#FF6B35" />
                            <Text style={styles.badgeText}>Quick Setup ({step}/3)</Text>
                        </View>
                        <Text style={styles.title}>
                            {step === 1 && "Select Your Primary Machine"}
                            {step === 2 && "Select Default Stock Material"}
                            {step === 3 && "You're Ready to Calculate!"}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 1 && "We'll configure your laser speeds, power profiles, and hourly rates."}
                            {step === 2 && "Choose the material you cut most often in your workshop."}
                            {step === 3 && "Run your first instant job cost calculation in 1 click."}
                        </Text>
                    </View>

                    {/* Step 1: Machine Selection */}
                    {step === 1 && (
                        <ScrollView style={styles.optionsList}>
                            {MACHINES.map(m => (
                                <TouchableOpacity
                                    key={m.id}
                                    style={[styles.optionCard, selectedMachine === m.id && styles.optionCardSelected]}
                                    onPress={() => setSelectedMachine(m.id)}
                                >
                                    <View style={styles.optionIconContainer}>
                                        <Cpu size={18} color={selectedMachine === m.id ? "#FF6B35" : "#94A3B8"} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.optionName}>{m.name}</Text>
                                        <Text style={styles.optionSub}>{m.type}</Text>
                                    </View>
                                    {selectedMachine === m.id && (
                                        <View style={styles.checkBadge}>
                                            <Check size={12} color="#FFFFFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Step 2: Material Selection */}
                    {step === 2 && (
                        <ScrollView style={styles.optionsList}>
                            {MATERIALS.map(mat => (
                                <TouchableOpacity
                                    key={mat.id}
                                    style={[styles.optionCard, selectedMaterial === mat.id && styles.optionCardSelected]}
                                    onPress={() => setSelectedMaterial(mat.id)}
                                >
                                    <View style={styles.optionIconContainer}>
                                        <Layers size={18} color={selectedMaterial === mat.id ? "#FF6B35" : "#94A3B8"} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.optionName}>{mat.name}</Text>
                                        <Text style={styles.optionSub}>Sheet: {mat.sheet} · Cost: {mat.cost}</Text>
                                    </View>
                                    {selectedMaterial === mat.id && (
                                        <View style={styles.checkBadge}>
                                            <Check size={12} color="#FFFFFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Step 3: Confirmation / First Calculation */}
                    {step === 3 && (
                        <View style={styles.readyCard}>
                            <View style={styles.awardIcon}>
                                <Award size={32} color="#FF6B35" />
                            </View>
                            <Text style={styles.readyTitle}>Setup Complete!</Text>
                            <Text style={styles.readyDesc}>
                                Your machine profile and stock material are locked in. Click below to generate your first job cost estimate.
                            </Text>

                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryLine}>• Machine: <Text style={styles.boldWhite}>{MACHINES.find(m => m.id === selectedMachine)?.name}</Text></Text>
                                <Text style={styles.summaryLine}>• Stock: <Text style={styles.boldWhite}>{MATERIALS.find(m => m.id === selectedMaterial)?.name}</Text></Text>
                                <Text style={styles.summaryLine}>• Account: <Text style={styles.boldAccent}>Free Forever Core Active</Text></Text>
                            </View>
                        </View>
                    )}

                    {/* Footer Buttons */}
                    <View style={styles.footerButtons}>
                        {step > 1 && (
                            <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={() => {
                                if (step < 3) setStep(step + 1);
                                else handleFinish();
                            }}
                        >
                            <Text style={styles.nextButtonText}>
                                {step < 3 ? 'Continue' : '⚡ Run First Calculation'}
                            </Text>
                            {step < 3 && <ChevronRight size={16} color="#FFFFFF" />}
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#13151F',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        marginBottom: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    badgeText: {
        fontSize: 11,
        color: '#FF6B35',
        fontWeight: '700',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 18,
    },
    optionsList: {
        maxHeight: 280,
        marginBottom: 20,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
    },
    optionCardSelected: {
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.08)',
    },
    optionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    optionSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    checkBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    readyCard: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 20,
    },
    awardIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    readyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    readyDesc: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
    },
    summaryBox: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 14,
        padding: 14,
        gap: 6,
    },
    summaryLine: {
        fontSize: 12,
        color: '#94A3B8',
    },
    boldWhite: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    boldAccent: {
        color: '#4ADE80',
        fontWeight: '700',
    },
    footerButtons: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'flex-end',
    },
    backButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    backButtonText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#FF6B35',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    nextButtonText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
