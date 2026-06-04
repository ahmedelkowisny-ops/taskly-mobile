import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type ProviderBottomNavVisibilityValue = {
  hidden: boolean;
  hideNav: () => void;
  showNav: () => void;
};

const ProviderBottomNavVisibilityContext = createContext<ProviderBottomNavVisibilityValue | null>(null);

const SCROLL_THRESHOLD = 10;
const TOP_VISIBLE_OFFSET = 12;
const NON_SCROLLABLE_BUFFER = 8;

export function ProviderBottomNavVisibilityProvider({ children }: PropsWithChildren) {
  const [hidden, setHidden] = useState(false);

  const hideNav = useCallback(() => {
    setHidden(true);
  }, []);

  const showNav = useCallback(() => {
    setHidden(false);
  }, []);

  const value = useMemo(
    () => ({ hidden, hideNav, showNav }),
    [hidden, hideNav, showNav],
  );

  return (
    <ProviderBottomNavVisibilityContext.Provider value={value}>
      {children}
    </ProviderBottomNavVisibilityContext.Provider>
  );
}

export function useProviderBottomNavVisibility() {
  return useContext(ProviderBottomNavVisibilityContext);
}

export function useProviderBottomNavScrollHandler() {
  const controls = useProviderBottomNavVisibility();
  const lastOffsetY = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
      }
    },
    [],
  );

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!controls) return;

      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
      }

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const currentY = Math.max(contentOffset.y, 0);
      const canScroll = contentSize.height > layoutMeasurement.height + NON_SCROLLABLE_BUFFER;

      if (!canScroll || currentY <= TOP_VISIBLE_OFFSET) {
        lastOffsetY.current = currentY;
        controls.showNav();
        return;
      }

      const delta = currentY - lastOffsetY.current;
      if (Math.abs(delta) < SCROLL_THRESHOLD) {
        return;
      }

      if (delta > 0) {
        controls.hideNav();
      } else {
        controls.showNav();
      }

      settleTimer.current = setTimeout(() => {
        controls.showNav();
      }, 700);

      lastOffsetY.current = currentY;
    },
    [controls],
  );
}
