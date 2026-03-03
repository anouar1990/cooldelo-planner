import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutDashboard, FolderOpen, BarChart2 } from 'lucide-react-native';

import DashboardScreen from './src/screens/DashboardScreen';
import ProjectsListScreen from './src/screens/ProjectsListScreen';
import AddProjectScreen from './src/screens/AddProjectScreen';
import ProjectDetailsScreen from './src/screens/ProjectDetailsScreen';
import StatsScreen from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();
const DashStack = createNativeStackNavigator();
const ProjectStack = createNativeStackNavigator();

const COLORS = {
  bg: '#0F1117',
  surface: '#1C2030',
  border: 'rgba(255,255,255,0.07)',
  primary: '#FF6B35',
  textSub: '#8B95A8',
};

function DashboardNavigator() {
  return (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
      <DashStack.Screen name="DashboardMain" component={DashboardScreen} />
      <DashStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
    </DashStack.Navigator>
  );
}

function ProjectsNavigator() {
  return (
    <ProjectStack.Navigator screenOptions={{ headerShown: false }}>
      <ProjectStack.Screen name="ProjectsList" component={ProjectsListScreen} />
      <ProjectStack.Screen
        name="AddProject"
        component={AddProjectScreen}
        options={{ presentation: 'modal' }}
      />
      <ProjectStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
    </ProjectStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <NavigationContainer
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
        } as any}
      >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textSub,
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: ({ color, size }) => {
              if (route.name === 'Dashboard') return <LayoutDashboard color={color} size={size} />;
              if (route.name === 'Projects') return <FolderOpen color={color} size={size} />;
              if (route.name === 'Stats') return <BarChart2 color={color} size={size} />;
              return null;
            },
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardNavigator} />
          <Tab.Screen name="Projects" component={ProjectsNavigator} />
          <Tab.Screen name="Stats" component={StatsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 84,
    paddingBottom: 24,
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
