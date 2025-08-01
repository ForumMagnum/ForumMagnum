import { blackBarTitle } from "../../lib/publicSettings";

const sansSerifStack = [
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
  'warnock-pro',
  'Palatino',
  '"Palatino Linotype"',
  '"Palatino LT STD"',
  '"Book Antiqua"',
  'Georgia',
  'serif'
]

const serifStack = serifStackBody.join(',')
const headerStack = ["ETBookRoman", ...serifStackBody].join(',')

export const lessWrongTheme: SiteThemeSpecification = {
  shadePalette: {
    fonts: {sansSerifStack, serifStack},
  },
  componentPalette: (shadePalette: ThemeShadePalette) => ({
    primary: {
      main: '#5f9b65',
    },
    secondary: {
      main: '#5f9b65',
    },
    lwTertiary: {
      main: "#69886e",
      dark: "#21672b"
    },
    error: {
      main: '#bf360c',
    },
    header: {
      background: blackBarTitle.get() ? shadePalette.inverseGreyAlpha(.1) : shadePalette.inverseGreyAlpha(.65)
    },
    ultrafeedModalHeader: {
      background: blackBarTitle.get() ? shadePalette.inverseGreyAlpha(.4) : shadePalette.inverseGreyAlpha(.95)
    },
    background: {
      default: '#f8f4ee'
    },
    link: {
      color: "#327E09",
      visited: "#798754"
    },
    fundraisingThermometer: {
      shadow: '#222',
    }
  }),
  make: (palette: ThemePalette) => ({
    zIndexes: {
      searchResults: 1100,
      intercomButton: 1030,
    },
    typography: {
      fontFamily: sansSerifStack,
      postStyle: {
        fontFamily: serifStack,
      },
      headerStyle: {
        fontFamily: headerStack,
      },
      caption: {
        // captions should be relative to their surrounding content, so they are unopinionated about fontFamily and use ems instead of rems
        fontFamily: "unset",
        fontSize: '.85em'
      },
      body2: {
        fontSize: 15.08,
        lineHeight: "19.8px"
      },
      commentStyle: {
        fontFamily: sansSerifStack,
        '& b, & strong': {
          fontWeight: 600
        }
      },
    errorStyle: {
        color: palette.error.main,
        fontFamily: sansSerifStack
      },
      headline: {
        fontFamily: serifStack,
      },
      subheading: {
        fontFamily: serifStack,
      },
      title: {
        fontFamily: headerStack,
        fontWeight: 500,
      },
      uiSecondary: {
        fontFamily: serifStack,
      },
    },
    overrides: {
      MuiListItem: {
        root: {
          paddingTop: 8,
          paddingBottom: 8
        }
      },
    }
  }),
};
