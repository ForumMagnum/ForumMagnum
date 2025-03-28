import type { PartialDeep } from 'type-fest'
import { invertHexColor, invertColor, colorToString, zeroTo255 } from '../colorUtil';
import { forumSelect } from '../../lib/forumTypeUtils';
import deepmerge from 'deepmerge';

const sansSerifStack = [
  'Futura',
  'GreekFallback', // Ensures that greek letters render consistently
  'Calibri',
  'gill-sans-nova',
  '"Gill Sans"',
  '"Gill Sans MT"',
  "Myriad Pro",
  'Myriad',
  '"Liberation Sans"',
  '"Nimbus Sans L"',
  'Tahoma',
  'Geneva',
  '"Helvetica Neue"',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

const serifStackBody = [
  'Futura',
  'warnock-pro',
  'Palatino',
  '"Palatino Linotype"',
  '"Palatino LT STD"',
  '"Book Antiqua"',
  'Georgia',
  'serif'
]

const serifStack = serifStackBody.join(',')
const headerStack = ["Futura", "ETBookRoman", ...serifStackBody].join(',')

export const ghiblifyTheme: UserThemeSpecification = {
  shadePalette: {
    fonts: { sansSerifStack, serifStack },
    inverseGreyAlpha: (alpha) => `rgba(247,229,172,${alpha})`,
  },
  componentPalette: (shadePalette: ThemeShadePalette) => ({
    background: {
      default: 'rgb(247,229,172)',
      paper: `rgb(247,229,172)`,
    },
    panelBackground: {
      default: '#fff3cd',
    },
  }),
  make: (palette: ThemePalette): PartialDeep<NativeThemeType> => ({
    typography: {
      headerStyle: {
        fontFamily: headerStack,
      },
      title: {
        fontFamily: headerStack,
      },
    },
  }),
};
