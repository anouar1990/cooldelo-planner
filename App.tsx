import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { trackPageView } from './src/lib/analytics';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, StyleSheet, ActivityIndicator, Text, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import ProjectsListScreen from './src/screens/ProjectsListScreen';
import AddProjectScreen from './src/screens/AddProjectScreen';
import ProjectDetailsScreen from './src/screens/ProjectDetailsScreen';
import StatsScreen from './src/screens/StatsScreen';
import CostCalculatorScreen from './src/screens/CostCalculatorScreen';
import MaterialsScreen from './src/screens/MaterialsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import LaserPresetsScreen from './src/screens/LaserPresetsScreen';
import QuoteGeneratorScreen from './src/screens/QuoteGeneratorScreen';
import NestingEstimatorScreen from './src/screens/NestingEstimatorScreen';
import AuthScreen from './src/screens/AuthScreen';
import DesktopAuthScreen from './src/screens/DesktopAuthScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import MachineProfilesScreen from './src/screens/MachineProfilesScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import TemplatesScreen from './src/screens/TemplatesScreen';
import { useAuth } from './src/hooks/useAuth';
import { useSubscription } from './src/hooks/useSubscription';
import { ResponsiveTabBar } from './src/components/ResponsiveTabBar';

const Tab = createBottomTabNavigator();
const DashStack = createNativeStackNavigator();
const ProjectStack = createNativeStackNavigator();

const COLORS = {
  bg: '#0A0C12',
  surface: '#13151F',
  border: 'rgba(255,255,255,0.08)',
  primary: '#FF6B35',
  textSub: '#8B95A8',
};

function DashboardNavigator() {
  return (
    <DashStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <DashStack.Screen name="DashboardMain" component={DashboardScreen} />
      <DashStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
    </DashStack.Navigator>
  );
}

function ProjectsNavigator() {
  return (
    <ProjectStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <ProjectStack.Screen name="ProjectsList" component={ProjectsListScreen} />
      <ProjectStack.Screen name="AddProject" component={AddProjectScreen} options={{ presentation: 'modal' }} />
      <ProjectStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
      <ProjectStack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
      <ProjectStack.Screen name="MachineProfiles" component={MachineProfilesScreen} />
      <ProjectStack.Screen name="Clients" component={ClientsScreen} />
      <ProjectStack.Screen name="Templates" component={TemplatesScreen} />
    </ProjectStack.Navigator>
  );
}

export default function App() {
  const { session, loading } = useAuth();
  const { isPro } = useSubscription();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string | undefined>(undefined);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingBrand}>⚡ 0machine</Text>
        <ActivityIndicator color="#FF6B35" size="large" style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        {isDesktop ? <DesktopAuthScreen /> : <AuthScreen />}
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
          const currentRouteName = routeNameRef.current;
          if (currentRouteName) trackPageView(currentRouteName);
        }}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
          
          if (previousRouteName !== currentRouteName && currentRouteName) {
            trackPageView(currentRouteName);
          }
          routeNameRef.current = currentRouteName;
        }}
        theme={{
          dark: true,
          colors: {
            primary: COLORS.primary,
            background: COLORS.bg,
            card: COLORS.surface,
            text: '#FFFFFF',
            border: COLORS.border,
            notification: COLORS.primary,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' as const },
            medium: { fontFamily: 'System', fontWeight: '500' as const },
            bold: { fontFamily: 'System', fontWeight: '700' as const },
            heavy: { fontFamily: 'System', fontWeight: '900' as const },
          },
        }}
      >
        <Tab.Navigator
          tabBar={(props) => <ResponsiveTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            sceneStyle: {
              backgroundColor: COLORS.bg,
              marginLeft: isDesktop ? 260 : 0,
              flex: 1
            }
          }}
        >
          <Tab.Screen name="Dashboard" component={DashboardNavigator} />
          <Tab.Screen name="Cost Calculator" component={CostCalculatorScreen} />
          <Tab.Screen name="Materials" component={MaterialsScreen} />
          <Tab.Screen name="Orders" component={OrdersScreen} />
          <Tab.Screen name="Laser Presets" component={LaserPresetsScreen} />
          <Tab.Screen name="Quote Generator" component={QuoteGeneratorScreen} />
          <Tab.Screen name="Nesting Estimator" component={NestingEstimatorScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1, backgroundColor: '#0A0C12',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingBrand: {
    fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2,
  },
});
