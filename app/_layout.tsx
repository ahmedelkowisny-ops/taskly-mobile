import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { NotificationDeepLinkHandler } from '@/src/components/taskly/NotificationDeepLinkHandler';
import { AuthProvider } from '@/src/lib/auth/AuthProvider';
import { I18nProvider } from '@/src/lib/i18n';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StripeProvider publishableKey={stripePublishableKey}>
        <I18nProvider>
          <AuthProvider>
            <NotificationDeepLinkHandler />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="customer" options={{ headerShown: false }} />
              <Stack.Screen name="provider" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </AuthProvider>
        </I18nProvider>
      </StripeProvider>
    </ThemeProvider>
  );
}
