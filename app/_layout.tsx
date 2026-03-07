import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from "@/contexts/AuthContext";
import { ColorSchemeProvider, useColorScheme } from '@/hooks/useColorScheme';
import { LocalStorageService } from '@/services/localStorage';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        headerShown: false,
        contentStyle: {
          paddingTop: Platform.OS === 'android' ? 0 : 0,
        }
      }}>
        <Stack.Screen name="(tabs)" options={{ title: "" }} />
        <Stack.Screen name="patient-history" options={{ title: "病人历史" }} />
      </Stack>
      <Toast />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    LocalStorageService.initialize();
  }, []);

  return (
    <AuthProvider>
      <ColorSchemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </ColorSchemeProvider>
    </AuthProvider>
  );
}
