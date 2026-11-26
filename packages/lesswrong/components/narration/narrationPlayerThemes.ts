import { useCallback } from "react";
import { useGlobalKeydown } from "@/components/common/withGlobalKeydown";
import { useLocalStorageState } from "@/components/hooks/useLocalStorageState";

/**
 * The looks that the floating player can have. There's more than one only
 * while we're choosing between them: this file goes when one has been chosen.
 * Alt+Shift+1 to Alt+Shift+5 (Option+Shift on a Mac) switch between them, in
 * this order, and the browser remembers which was last chosen.
 */
export const narrationPlayerThemes = ["paper", "glass", "ink", "margin", "tonal"] as const;
export type NarrationPlayerTheme = typeof narrationPlayerThemes[number];

const themeByKeyCode = new Map<string, NarrationPlayerTheme>(
  narrationPlayerThemes.map((theme, i) => [`Digit${i + 1}`, theme]),
);

export function useNarrationPlayerTheme(): NarrationPlayerTheme {
  const { narrationPlayerTheme, setNarrationPlayerTheme } = useLocalStorageState(
    "narrationPlayerTheme",
    key => key,
    narrationPlayerThemes[0],
  );

  useGlobalKeydown(useCallback((event: KeyboardEvent) => {
    const theme = themeByKeyCode.get(event.code);
    if (theme && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      setNarrationPlayerTheme(theme);
    }
  }, [setNarrationPlayerTheme]));

  return narrationPlayerThemes.find(theme => theme === narrationPlayerTheme) ?? narrationPlayerThemes[0];
}
