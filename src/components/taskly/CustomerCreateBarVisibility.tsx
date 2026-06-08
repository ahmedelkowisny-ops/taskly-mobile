import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type CustomerCreateBarVisibilityValue = {
  hidden: boolean;
  hideCreateBar: () => void;
  showCreateBar: () => void;
};

const CustomerCreateBarVisibilityContext = createContext<CustomerCreateBarVisibilityValue | null>(null);

const SCROLL_THRESHOLD = 10;
const TOP_VISIBLE_OFFSET = 16;
const NON_SCROLLABLE_BUFFER = 8;

export function CustomerCreateBarVisibilityProvider({ children }: PropsWithChildren) {
  const [hidden, setHidden] = useState(false);

  const hideCreateBar = useCallback(() => {
    setHidden(true);
  }, []);

  const showCreateBar = useCallback(() => {
    setHidden(false);
  }, []);

  const value = useMemo(
    () => ({
      hidden,
      hideCreateBar,
      showCreateBar,
    }),
    [hidden, hideCreateBar, showCreateBar],
  );

  return (
    <CustomerCreateBarVisibilityContext.Provider value={value}>
      {children}
    </CustomerCreateBarVisibilityContext.Provider>
  );
}

export function useCustomerCreateBarVisibility() {
  return useContext(CustomerCreateBarVisibilityContext);
}

export function useCustomerCreateBarScrollHandler() {
  const controls = useCustomerCreateBarVisibility();
  const lastOffsetY = useRef(0);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentControls = controlsRef.current;
      if (!currentControls) return;

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const currentY = Math.max(contentOffset.y, 0);
      const canScroll = contentSize.height > layoutMeasurement.height + NON_SCROLLABLE_BUFFER;

      if (!canScroll || currentY <= TOP_VISIBLE_OFFSET) {
        lastOffsetY.current = currentY;
        currentControls.showCreateBar();
        return;
      }

      const delta = currentY - lastOffsetY.current;
      if (Math.abs(delta) < SCROLL_THRESHOLD) {
        return;
      }

      if (delta > 0) {
        currentControls.hideCreateBar();
      } else {
        currentControls.showCreateBar();
      }

      lastOffsetY.current = currentY;
    },
    [],
  );
}
