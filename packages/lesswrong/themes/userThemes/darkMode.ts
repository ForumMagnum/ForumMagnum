import type { PartialDeep } from 'type-fest'
import deepmerge from 'deepmerge';
// eslint-disable-next-line no-restricted-imports
import type { Color as MuiColorShades } from '@material-ui/core';
import { defaultComponentPalette } from '../defaultPalette';
import { invertHexColor } from '../colorUtil';

export const invertedGreyscale = {
  // Present in @material-ui/core/colors/grey
  50: invertHexColor('#fafafa'),
  100: invertHexColor('#f5f5f5'),
  200: invertHexColor('#eeeeee'),
  300: invertHexColor('#e0e0e0'),
  400: invertHexColor('#bdbdbd'),
  500: invertHexColor('#9e9e9e'),
  600: invertHexColor('#757575'),
  700: invertHexColor('#616161'),
  800: invertHexColor('#424242'),
  900: invertHexColor('#212121'),
  A100: invertHexColor('#d5d5d5'),
  A200: invertHexColor('#aaaaaa'),
  A400: invertHexColor('#303030'),
  A700: invertHexColor('#616161'),
  
  // Greyscale colors not in the MUI palette
  0: "#000",
  1000: "#fff",
  
  10: invertHexColor('#fefefe'),
  20: invertHexColor('#fdfdfd'),
  25: invertHexColor('#fcfcfc'),
  30: invertHexColor('#fbfbfb'),
  55: invertHexColor('#f9f9f9'),
  60: invertHexColor('#f8f8f8'),
  110: invertHexColor("#f3f3f3"),
  120: invertHexColor('#f2f2f2'),
  140: invertHexColor("#f0f0f0"),
  250: invertHexColor("#e8e8e8"),
  315: invertHexColor("#d4d4d4"),
  320: invertHexColor("#d9d9d9"),
  340: invertHexColor("#d0d0d0"),
  410: invertHexColor("#b3b3b3"),
  550: invertHexColor("#999999"),
  650: invertHexColor('#808080'),
};

const greyAlpha = (alpha: number) => `rgba(255,255,255,${alpha})`;

export const darkModeTheme: UserThemeSpecification = {
  shadePalette: {
    grey: invertedGreyscale,
    greyAlpha,
    boxShadowColor: (alpha: number) => greyAlpha(alpha),
    greyBorder: (thickness: string, alpha: number) => `${thickness} solid ${greyAlpha(alpha)}`,
  },
  componentPalette: (shadePalette: ThemeShadePalette) => ({
    border: {
      itemSeparatorBottom: shadePalette.greyBorder("1px", .2),
    },
    type: "dark",
  }),
};
