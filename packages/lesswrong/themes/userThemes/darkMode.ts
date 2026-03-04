import type { PartialDeep } from 'type-fest'
import { invertHexColor, invertColor, colorToString, zeroTo255 } from '../colorUtil';

// CkEditor allows users to provide colors for table cell backgrounds and
// borders, which get embedded into the HTML looking like this:
//   <td style="background-color: rgb(1,2,3)">
// User-provided colors can be in any format that CSS accepts, and may set
// the `background-color` and `border` properties on <table> and <td>
// elements.
//
// We handle this in ContentItemBody with transformStylesForDarkMode. The
// colors below have dedicated color-mappings; all other colors use `parseColor`
// and `invertColor` from `colorUtil.ts`.
const getManualColorReplacements = () => ({
  "initial":            "rgba(255,255,255,.87)",
  "rgba(255,255,255,.5)": "rgba(0,0,0.5)",
  "hsl(0, 0%, 90%)":    "hsl(0, 0%, 10%)",
  "#F2F2F2":            invertHexColor("#f2f2f2"),
  "rgb(255, 247, 222)": "rgb(50,30,0)",
  "rgb(255, 255, 255)": invertHexColor("#ffffff"),
  "hsl(0,0%,100%)":     invertHexColor("#ffffff"),
  "#FFEEBB":            invertHexColor("#ffeebb"),
  "rgb(255, 238, 187)": colorToString(invertColor([255/255.0,238/255.0,187/255.0,1])),
  "rgb(230, 230, 230)": colorToString(invertColor([230/255.0,230/255.0,230/255.0,1])),
} as const);
const colorReplacementsCache = getManualColorReplacements();
export const getColorReplacementsCache = (): Record<string,string> => colorReplacementsCache;

export const getDarkModeTheme = (): UserThemeSpecification => ({
  shadePalette: {
    dark: true,
    type: "dark",
  },
  make: (palette: ThemePalette): PartialDeep<NativeThemeType> => ({
    dark: true,
    rawCSS: []
  }),
});
