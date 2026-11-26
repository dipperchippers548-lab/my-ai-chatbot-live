import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SimulatedAdOverlay } from '../components/SimulatedAdOverlay';
import { COLORS } from '../constants/theme';
import { Ads } from '../services/ads';
import { Sound } from '../utils/soundEffects';

export default function RootLayout() {
  useEffect(() => {
    Sound.init();
    Ads.initialize().catch(() => undefined);
    return () => Sound.release();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg },
            animation: 'fade',
          }}
        />
        <SimulatedAdOverlay />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
});
