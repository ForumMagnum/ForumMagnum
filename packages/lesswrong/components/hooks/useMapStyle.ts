import { useConcreteThemeOptions } from "../themes/useTheme";

export const useMapStyle = () => {
  const themeOptions = useConcreteThemeOptions();
  const isDarkMode = themeOptions.name === "dark";
  return "mapbox://styles/habryka/cilory317001r9mkmkcnvp2ra";
  return isDarkMode
    ? "mapbox://styles/mapbox/dark-v11"
    : undefined;
}
