import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => ({
  ...config,
  android: {
    ...config.android,
    package: 'com.tasklyco.app',
    config: {
      ...config.android?.config,
      googleMaps: {
        ...config.android?.config?.googleMaps,
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY,
      },
    },
  },
  ios: {
    ...config.ios,
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Taskly uses your location to confirm the service area for your task.',
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY,
      },
    ],
    '@react-native-community/datetimepicker',
  ],
});
