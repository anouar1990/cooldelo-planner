import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    children: React.ReactNode;
    maxWidth?: number;
    padded?: boolean;
};

export function ResponsiveContainer({ children, maxWidth = 1100, padded = true }: Props) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // On desktop, the sidebar takes 260px, so we subtract that from the available centering width
    const isDesktop = width > 768;
    const sidebarWidth = isDesktop ? 260 : 0;
    // Actually, wait: if `App.tsx` sceneContainer adds marginLeft: 260, this component just centers within the remaining space!

    return (
        <View style={styles.wrapper}>
            <View
                style={[
                    styles.container,
                    { maxWidth },
                    padded && {
                        paddingHorizontal: isDesktop ? 48 : 20,
                        paddingTop: isDesktop ? insets.top + 24 : insets.top + 16,
                        paddingBottom: insets.bottom + (isDesktop ? 24 : 100) // account for mobile bottom bar
                    }
                ]}
            >
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center', // Centers the inner container
    },
    container: {
        flex: 1,
        width: '100%',
    },
});
