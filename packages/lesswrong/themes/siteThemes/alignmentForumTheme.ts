
import { grey } from '../colorUtil';

const sansSerifStack = [
  'GreekFallback', // Ensures that greek letters render consistently
  '"freight-sans-pro"',
  'Frutiger',
  '"Frutiger Linotype"',
  'Univers',
  'Calibri',
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

export const alignmentForumTheme: SiteThemeSpecification = {
  componentPalette: (dark: boolean) => ({
    fonts: {
      sansSerifStack,
      serifStack: sansSerifStack, //No serifs on Alignment Forum
    },
    primary: {
      main: dark ? "#7581d1": "#3f51b5",
      dark: dark ? "#7986cb": "#303f9f",
      light: dark ? "#5968c9": "#7986cb",
      contrastText: grey[0],
    },
    secondary: {
      main: "#3f51b5",
      dark: "#303f9f",
      light: "#7986cb",
      contrastText: grey[0],
    },
    review: {
      activeProgress: "rgba(63,81,181, .5)",
      progressBar: "rgba(63,81,181, 1)"
    },
    lwTertiary: {
      main:  dark ? "#7799a4" : "#607e88",
      dark:  dark ? "#7799a4" : "#607e88",
    },
    error: {
      main: '#bf360c',
    },
    background: {
      default: dark ? grey[100] : grey[60],
    },
    header: {
      text: dark ? "#ffffff" : "rgba(0,0,0,0.87)",
      background: dark ? "rgba(0,0,0,0.5)" : "#ffffff",
    },
    link: {
      visited: "light-dark(#8c4298,#798754)",
    }
  }),
  make: (palette: ThemePalette) => ({
    typography: {
      fontFamily: sansSerifStack,
      postStyle: {
        fontFamily: sansSerifStack,
        fontVariantNumeric: "lining-nums",
      },
      headerStyle: {
        fontFamily: sansSerifStack,
      },
      commentStyle: {
        fontFamily: sansSerifStack,
        fontVariantNumeric: "lining-nums",
      },
      errorStyle: {
        color: palette.error!.main!,
        fontFamily: sansSerifStack
      },
      title: {
        fontWeight: 500,
      },
      display2: {
        fontWeight: 500
      },
      display3: {
        fontWeight: 500
      },
      uiSecondary: {
        fontFamily: sansSerifStack,
      },
    },
    overrides: {
    },

    isBookUI: true,
    isFriendlyUI: false,
    isLW: false,
    isAF: true,
    isLWorAF: true,
    isEAForum: false,
  }),
};

export default alignmentForumTheme;
