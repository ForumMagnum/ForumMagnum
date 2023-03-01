import { useTheme } from "./useTheme";

const useUIStyle = (): UIStyle => {
  const theme = useTheme();
  return theme.uiStyle ?? "book";
}

export default useUIStyle;
