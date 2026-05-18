import { PlusJakartaSans_400Regular, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { db, ensureXpColumn } from '../db';
import { localUserStats } from '../db/schema';
import { seed } from '../db/seed';
import migrations from '../drizzle/migrations/migrations';
import '../global.css';
import { AuthProvider, useAuth } from '../lib/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'Tenada': require('../assets/fonts/tenada.ttf'),
  });

  const { success: migrationsLoaded, error: migrationError } = useMigrations(db, migrations);

  useEffect(() => {
    if (migrationsLoaded) {
      ensureXpColumn();
      seed().catch(console.error);
    }
  }, [migrationsLoaded]);

  useEffect(() => {
    if ((loaded || error) && (migrationsLoaded || migrationError)) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, migrationsLoaded, migrationError]);

  if ((!loaded && !error) || (!migrationsLoaded && !migrationError)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' }}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{ alignItems: 'center' }}
        >
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 64 }}>🇰🇷</Text>
          </View>

          <Text
            style={{
              color: 'white',
              fontSize: 72,
              fontFamily: 'Tenada',
              fontStyle: 'italic',
              letterSpacing: -2
            }}
          >
            K-SWIPE
          </Text>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 32 }}
          >
            <View style={{ width: 40, height: 1, backgroundColor: '#00FFC2' }} />
            <Text
              style={{
                color: '#00FFC2',
                fontWeight: '900',
                marginHorizontal: 16,
                textTransform: 'uppercase',
                letterSpacing: 6,
                fontSize: 10
              }}
            >
              District 01 / 구역 01
            </Text>
            <View style={{ width: 40, height: 1, backgroundColor: '#00FFC2' }} />
          </MotiView>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ type: 'timing', duration: 1000, loop: true }}
            style={{ marginTop: 48 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10, letterSpacing: 2 }}>INITIALIZING SYNC...</Text>
          </MotiView>
        </MotiView>
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootLayoutNav migrationsLoaded={migrationsLoaded} />
    </AuthProvider>
  );
}

function RootLayoutNav({ migrationsLoaded }: { migrationsLoaded: boolean }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const isRouting = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#0D0D0D');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  useEffect(() => {
    // 1. Reset check state when session changes to ensure new users are re-evaluated
    setHasCheckedOnboarding(false);
  }, [session?.user?.id]);

  useEffect(() => {
    // 2. Silent loading/migrations check
    if (isLoading || migrationsLoaded === false) return;

    const runAuthLogic = async () => {
      if (isRouting.current) return;

      // 2. Auth Guard
      if (!session) {
        const isProtectedRoute = (segments[0] === '(tabs)' || segments[0] === 'game' || segments.length === 0);
        if (isProtectedRoute) {
          isRouting.current = true;
          router.replace('/(auth)/login');
          isRouting.current = false;
        }
        return;
      }

      // 3. Onboarding Lock (Memoized to prevent jank on tab navigation)
      try {
        const inAuthGroup = segments[0] === '(auth)';
        const isOnboarding = segments.length === 0;

        if (!hasCheckedOnboarding) {
          const stats = await db.select().from(localUserStats).where(eq(localUserStats.userId, session.user.id));
          const completed = stats.length > 0;
          setHasCheckedOnboarding(true);

          if (!completed && !isOnboarding) {
            isRouting.current = true;
            router.replace('/');
            isRouting.current = false;
            return;
          }

          if (completed && (inAuthGroup || isOnboarding)) {
            isRouting.current = true;
            router.replace('/(tabs)');
            isRouting.current = false;
            return;
          }
        }
      } catch (e) {
        console.error("Auth Logic Failure", e);
      }
    };

    runAuthLogic();
  }, [session, isLoading, segments, migrationsLoaded, hasCheckedOnboarding]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack screenOptions={{ animation: 'fade' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="game" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
