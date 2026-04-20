import { useTheme } from 'next-themes';
import * as React from 'react';

export function useColorMode() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const toggleColorMode = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);
  return {
    colorMode: resolvedTheme as 'dark' | 'light' | undefined,
    setColorMode: setTheme,
    toggleColorMode,
    theme,
  };
}
