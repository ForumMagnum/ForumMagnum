import type { PartialDeep } from 'type-fest'
import { forumSelect } from '../../lib/forumTypeUtils';

const pixelFont = [
  '"lores-21-serif"',
  '"Press Start 2P"',
  '"VT323"',
  'monospace'
].join(',')

export const pixelyTheme: UserThemeSpecification = {
  shadePalette: {
    fonts: { 
      sansSerifStack: pixelFont,
      serifStack: pixelFont 
    },
    inverseGreyAlpha: (alpha) => `rgba(247,229,172,${alpha})`,
  },
  componentPalette: (shadePalette: ThemeShadePalette) => ({
    // background: {
    //   default: 'rgb(247,229,172)',
    //   paper: `rgb(247,229,172)`,
    // },
    // panelBackground: {
    //   default: '#fff3cd',
    // },
  }),
  make: (palette: ThemePalette): PartialDeep<NativeThemeType> => ({
    typography: {
      fontDownloads: [
        'https://use.typekit.net/tlf2euo.css',
      ],
      fontFamily: pixelFont,
      headerStyle: {
        fontFamily: pixelFont,
      },
      title: {
        fontFamily: pixelFont,
      },
      body1: {
        fontFamily: pixelFont,
      },
      body2: {
        fontFamily: pixelFont,
      }
    },
  }),
}; 