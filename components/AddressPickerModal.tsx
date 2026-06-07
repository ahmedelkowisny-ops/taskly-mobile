import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

interface AddressPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (address: string, latitude: number, longitude: number) => void;
  initialCity?: string;
  initialAddress?: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  title?: string;
}

type AddressSuggestion = {
  mainText: string;
  placeId: string;
  secondaryText: string;
  text: string;
};

type PlacesAutocompleteResponse = {
  error_message?: string;
  predictions?: {
    description?: string;
    place_id?: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }[];
  status?: string;
};

type PlaceDetailsResponse = {
  error_message?: string;
  result?: {
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  };
  status?: string;
};

type GeocodingResponse = {
  error_message?: string;
  results?: {
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }[];
  status?: string;
};

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const STREET_ZOOM = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  sofia: { latitude: 42.6977, longitude: 23.3219 },
  plovdiv: { latitude: 42.1354, longitude: 24.7453 },
  varna: { latitude: 43.2141, longitude: 27.9147 },
  burgas: { latitude: 42.5048, longitude: 27.4626 },
  'stara-zagora': { latitude: 42.4258, longitude: 25.6345 },
  ruse: { latitude: 43.8356, longitude: 25.9657 },
  pleven: { latitude: 43.417, longitude: 24.6167 },
  'veliko-tarnovo': { latitude: 43.0757, longitude: 25.6172 },
  blagoevgrad: { latitude: 42.0121, longitude: 23.0942 },
};

function normalizeCitySlug(value?: string) {
  return value?.trim().toLocaleLowerCase().replaceAll('_', '-');
}

function getFallbackCoordinates(initialCity?: string) {
  const cityCoordinates = CITY_COORDINATES[normalizeCitySlug(initialCity) ?? ''];
  return cityCoordinates ?? CITY_COORDINATES.sofia;
}

export default function AddressPickerModal({
  visible,
  onClose,
  onConfirm,
  initialCity,
  initialAddress,
  initialLatitude,
  initialLongitude,
  title = 'Choose Location',
}: AddressPickerModalProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(48)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fallbackCoordinates = useMemo(() => getFallbackCoordinates(initialCity), [initialCity]);
  const [query, setQuery] = useState(initialAddress ?? '');
  const [selectedAddress, setSelectedAddress] = useState(initialAddress ?? '');
  const [selectedLatitude, setSelectedLatitude] = useState<number | null>(initialLatitude ?? null);
  const [selectedLongitude, setSelectedLongitude] = useState<number | null>(initialLongitude ?? null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isCurrentLocationLoading, setIsCurrentLocationLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLocationResolved, setIsLocationResolved] = useState(
    typeof initialLatitude === 'number' && typeof initialLongitude === 'number',
  );

  const selectedCoordinate =
    typeof selectedLatitude === 'number' && typeof selectedLongitude === 'number'
      ? { latitude: selectedLatitude, longitude: selectedLongitude }
      : null;

  const initialRegion = {
    latitude: selectedCoordinate?.latitude ?? fallbackCoordinates.latitude,
    longitude: selectedCoordinate?.longitude ?? fallbackCoordinates.longitude,
    latitudeDelta: selectedCoordinate ? STREET_ZOOM.latitudeDelta : 0.1,
    longitudeDelta: selectedCoordinate ? STREET_ZOOM.longitudeDelta : 0.1,
  };

  const animateToCoordinates = useCallback((latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        ...STREET_ZOOM,
      },
      500,
    );
  }, []);

  const updateLocation = useCallback(
    (address: string, latitude: number, longitude: number) => {
      setSelectedAddress(address);
      setQuery(address);
      setSelectedLatitude(latitude);
      setSelectedLongitude(longitude);
      setIsLocationResolved(true);
      setLookupError(null);
      animateToCoordinates(latitude, longitude);
    },
    [animateToCoordinates],
  );

  const reportGoogleLookupFailure = useCallback((operation: string, status?: string, errorMessage?: string) => {
    const detail = [status, errorMessage].filter(Boolean).join(': ');
    console.warn(`[AddressPickerModal] Google ${operation} failed${detail ? ` - ${detail}` : ''}`);
    setLookupError(status === 'REQUEST_DENIED' ? t('addressLookupAuthorizationError') : t('addressLookupFailed'));
  }, []);

  const geocodeTypedAddress = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsResolving(true);
    setSuggestions([]);
    setLookupError(null);

    try {
      if (!GOOGLE_PLACES_API_KEY) {
        reportGoogleLookupFailure('Geocoding', 'MISSING_API_KEY');
        return;
      }

      const params = new URLSearchParams({
        address: trimmedQuery,
        components: 'country:bg',
        key: GOOGLE_PLACES_API_KEY,
      });
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
      const data = (await response.json()) as GeocodingResponse;
      const result = data.results?.[0];
      const latitude = result?.geometry?.location?.lat;
      const longitude = result?.geometry?.location?.lng;

      if (data.status !== 'OK' || typeof latitude !== 'number' || typeof longitude !== 'number') {
        reportGoogleLookupFailure('Geocoding', data.status, data.error_message);
        return;
      }

      updateLocation(result?.formatted_address || trimmedQuery, latitude, longitude);
    } catch (error) {
      console.warn('[AddressPickerModal] Google Geocoding request failed', error);
      setLookupError(t('addressLookupFailed'));
    } finally {
      setIsResolving(false);
    }
  }, [query, reportGoogleLookupFailure, updateLocation]);

  const reverseGeocodeCoordinates = useCallback(
    async (latitude: number, longitude: number) => {
      const fallbackAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setIsResolving(true);
      setSuggestions([]);
      setLookupError(null);
      setSelectedLatitude(latitude);
      setSelectedLongitude(longitude);
      setIsLocationResolved(true);
      animateToCoordinates(latitude, longitude);

      try {
        if (!GOOGLE_PLACES_API_KEY) throw new Error('Missing Google Places API key');

        const params = new URLSearchParams({
          key: GOOGLE_PLACES_API_KEY,
          latlng: `${latitude},${longitude}`,
        });
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
        const data = (await response.json()) as GeocodingResponse;
        const resolvedAddress = data.status === 'OK' ? data.results?.[0]?.formatted_address : null;
        updateLocation(resolvedAddress || fallbackAddress, latitude, longitude);
        if (data.status !== 'OK') {
          reportGoogleLookupFailure('reverse geocoding', data.status, data.error_message);
        }
      } catch (error) {
        console.warn('[AddressPickerModal] Google reverse geocoding request failed', error);
        updateLocation(fallbackAddress, latitude, longitude);
      } finally {
        setIsResolving(false);
      }
    },
    [animateToCoordinates, reportGoogleLookupFailure, updateLocation],
  );

  const handleSuggestionPress = useCallback(
    async (suggestion: AddressSuggestion) => {
      setSuggestions([]);
      setIsResolving(true);
      setLookupError(null);

      try {
        if (!GOOGLE_PLACES_API_KEY) throw new Error('Missing Google Places API key');

        const params = new URLSearchParams({
          fields: 'geometry,formatted_address',
          key: GOOGLE_PLACES_API_KEY,
          place_id: suggestion.placeId,
        });
        const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
        const data = (await response.json()) as PlaceDetailsResponse;
        if (data.status !== 'OK') {
          reportGoogleLookupFailure('Place Details', data.status, data.error_message);
          return;
        }
        const latitude = data.result?.geometry?.location?.lat;
        const longitude = data.result?.geometry?.location?.lng;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          reportGoogleLookupFailure('Place Details', data.status, 'Response did not include coordinates');
          return;
        }

        updateLocation(data.result?.formatted_address || suggestion.text, latitude, longitude);
      } catch (error) {
        console.warn('[AddressPickerModal] Google Place Details request failed', error);
        setLookupError(t('addressLookupFailed'));
      } finally {
        setIsResolving(false);
      }
    },
    [reportGoogleLookupFailure, updateLocation],
  );

  const handleCurrentLocationPress = useCallback(async () => {
    setIsCurrentLocationLoading(true);
    setSuggestions([]);
    setLookupError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) return;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await reverseGeocodeCoordinates(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.log('Current location error:', error);
    } finally {
      setIsCurrentLocationLoading(false);
    }
  }, [reverseGeocodeCoordinates]);

  useEffect(() => {
    if (!visible) return;

    const nextLatitude = initialLatitude ?? null;
    const nextLongitude = initialLongitude ?? null;
    setQuery(initialAddress ?? '');
    setSelectedAddress(initialAddress ?? '');
    setSelectedLatitude(nextLatitude);
    setSelectedLongitude(nextLongitude);
    setIsLocationResolved(typeof nextLatitude === 'number' && typeof nextLongitude === 'number');
    setSuggestions([]);

    Animated.parallel([
      Animated.timing(slideAnim, {
        duration: 260,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    const focusTimer = setTimeout(() => inputRef.current?.focus(), 320);
    const mapTimer = setTimeout(() => {
      if (typeof nextLatitude === 'number' && typeof nextLongitude === 'number') {
        animateToCoordinates(nextLatitude, nextLongitude);
        return;
      }

      mapRef.current?.animateToRegion(
        {
          ...fallbackCoordinates,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        },
        500,
      );
    }, 450);

    return () => {
      clearTimeout(focusTimer);
      clearTimeout(mapTimer);
    };
  }, [
    animateToCoordinates,
    fallbackCoordinates,
    initialAddress,
    initialLatitude,
    initialLongitude,
    opacityAnim,
    slideAnim,
    visible,
  ]);

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(48);
      opacityAnim.setValue(0);
    }
  }, [opacityAnim, slideAnim, visible]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!visible || trimmedQuery.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    if (!GOOGLE_PLACES_API_KEY) {
      setSuggestions([]);
      setIsSearching(false);
      reportGoogleLookupFailure('Places Autocomplete', 'MISSING_API_KEY');
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsSearching(true);

      try {
        const params = new URLSearchParams({
          components: 'country:bg',
          input: trimmedQuery,
          key: GOOGLE_PLACES_API_KEY,
        });
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
        );
        const data = (await response.json()) as PlacesAutocompleteResponse;
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          if (!cancelled) reportGoogleLookupFailure('Places Autocomplete', data.status, data.error_message);
          return;
        }
        const nextSuggestions =
          data.predictions?.flatMap((prediction) => {
            const placeId = prediction.place_id;
            const text = prediction.description;
            if (!placeId || !text) return [];

            return [
              {
                mainText: prediction.structured_formatting?.main_text || text,
                placeId,
                secondaryText: prediction.structured_formatting?.secondary_text || '',
                text,
              },
            ];
          }) ?? [];

        if (!cancelled) setSuggestions(nextSuggestions);
      } catch (error) {
        console.warn('[AddressPickerModal] Google Places Autocomplete request failed', error);
        if (!cancelled) setLookupError(t('addressLookupFailed'));
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, reportGoogleLookupFailure, visible]);

  return (
    <Modal animationType="none" onRequestClose={onClose} visible={visible}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
          <AppText color={colors.white} style={styles.headerTitle}>
            {title}
          </AppText>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Ionicons color={colors.white} name="close" size={22} />
          </Pressable>
        </View>

        <View style={styles.searchLayer}>
          <View style={styles.searchBar}>
            <Ionicons color={colors.slate500} name="search-outline" size={20} />
            <TextInput
              autoCorrect={false}
              ref={inputRef}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedAddress(value);
                setIsLocationResolved(false);
                setSuggestions([]);
                setLookupError(null);
              }}
              onSubmitEditing={() => {
                void geocodeTypedAddress();
              }}
              placeholder="Search address..."
              placeholderTextColor={colors.slate500}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            {isSearching || isResolving ? <ActivityIndicator color="#2563EB" size="small" /> : null}
            {!isSearching && !isResolving ? (
              <Pressable
                accessibilityLabel={t('findAddress')}
                accessibilityRole="button"
                onPress={() => {
                  void geocodeTypedAddress();
                }}
                style={styles.searchButton}>
                <Ionicons color={colors.white} name="arrow-forward" size={18} />
              </Pressable>
            ) : null}
          </View>

          {lookupError ? (
            <View style={styles.lookupError}>
              <Ionicons color={colors.danger600} name="alert-circle-outline" size={18} />
              <AppText color={colors.danger600} style={styles.lookupErrorText} variant="small">
                {lookupError}
              </AppText>
            </View>
          ) : null}

          {suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              <FlatList
                data={suggestions}
                keyboardShouldPersistTaps="always"
                keyExtractor={(item) => item.placeId}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void handleSuggestionPress(item);
                    }}
                    style={({ pressed }) => [styles.suggestion, pressed ? styles.suggestionPressed : null]}>
                    <Ionicons color="#2563EB" name="location-outline" size={20} />
                    <View style={styles.suggestionText}>
                      <AppText numberOfLines={1} style={styles.suggestionTitle}>
                        {item.mainText}
                      </AppText>
                      {item.secondaryText ? (
                        <AppText color={colors.slate500} numberOfLines={1} variant="small">
                          {item.secondaryText}
                        </AppText>
                      ) : null}
                    </View>
                  </Pressable>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.mapArea}>
          <MapView
            initialRegion={initialRegion}
            onPress={(event) => {
              void reverseGeocodeCoordinates(
                event.nativeEvent.coordinate.latitude,
                event.nativeEvent.coordinate.longitude,
              );
            }}
            provider={PROVIDER_GOOGLE}
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}>
            {selectedCoordinate ? <Marker coordinate={selectedCoordinate} /> : null}
          </MapView>

          <Pressable
            accessibilityRole="button"
            disabled={isCurrentLocationLoading}
            onPress={() => {
              void handleCurrentLocationPress();
            }}
            style={({ pressed }) => [
              styles.currentLocationButton,
              pressed ? styles.currentLocationButtonPressed : null,
              isCurrentLocationLoading ? styles.currentLocationButtonDisabled : null,
            ]}>
            {isCurrentLocationLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Ionicons color={colors.white} name="locate-outline" size={18} />
            )}
            <AppText color={colors.white} style={styles.currentLocationText}>
              My current location
            </AppText>
          </Pressable>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <AppText color={selectedAddress ? colors.navy900 : colors.slate500} numberOfLines={1} style={styles.addressPreview}>
            {selectedAddress || 'No location selected'}
          </AppText>
          <Pressable
            accessibilityRole="button"
            disabled={!selectedAddress || !selectedCoordinate || !isLocationResolved}
            onPress={() => {
              if (!selectedAddress || !selectedCoordinate || !isLocationResolved) return;
              onConfirm(selectedAddress, selectedCoordinate.latitude, selectedCoordinate.longitude);
              onClose();
            }}
            style={({ pressed }) => [
              styles.confirmButton,
              !selectedAddress || !selectedCoordinate || !isLocationResolved ? styles.confirmButtonDisabled : null,
              pressed ? styles.confirmButtonPressed : null,
            ]}>
            <AppText color={colors.white} style={styles.confirmButtonText}>
              Confirm Location
            </AppText>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  addressPreview: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },
  bottomBar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  closeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.slate500,
  },
  confirmButtonPressed: {
    opacity: 0.86,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  currentLocationButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: radius.md,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    position: 'absolute',
  },
  currentLocationButtonDisabled: {
    opacity: 0.62,
  },
  currentLocationButtonPressed: {
    opacity: 0.86,
  },
  currentLocationText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    minHeight: 64,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  lookupError: {
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  lookupErrorText: {
    flex: 1,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  searchInput: {
    color: colors.navy900,
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 24,
    padding: 0,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  searchLayer: {
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    top: 84,
    zIndex: 999,
    elevation: 10,
  },
  suggestion: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionPressed: {
    backgroundColor: '#EFF6FF',
  },
  suggestions: {
    backgroundColor: colors.white,
    borderColor: '#DDE6F0',
    borderRadius: radius.md,
    borderWidth: 1,
    elevation: 10,
    marginTop: spacing.xs,
    maxHeight: 240,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    zIndex: 999,
  },
  suggestionText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  suggestionTitle: {
    color: colors.navy900,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
});
