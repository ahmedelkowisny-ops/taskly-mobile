import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type ProviderBottomNavVisibilityValue = {
  hidden: boolean;
  hideNav: () => void;
  showNav: () => void;
};

const ProviderBottomNavVisibilityContext = createContext<ProviderBottomNavVisibilityValue | null>(null);

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
  return useCallback(
    (_event: NativeSyntheticEvent<NativeScrollEvent>) => {},
    [],
  );
}
