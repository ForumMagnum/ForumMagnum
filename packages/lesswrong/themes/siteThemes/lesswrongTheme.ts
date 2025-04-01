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
    background: {
      default: '#f8f4ee',
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
      fontFamily: palette.fonts.sansSerifStack,
      postStyle: {
        fontFamily: palette.fonts.serifStack,
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
        fontFamily: palette.fonts.sansSerifStack,
        '& b, & strong': {
          fontWeight: 600
        }
      },
      errorStyle: {
        color: palette.error.main,
        fontFamily: palette.fonts.sansSerifStack
      },
      headline: {
        fontFamily: palette.fonts.serifStack,
      },
      subheading: {
        fontFamily: palette.fonts.serifStack,
      },
      title: {
        fontFamily: headerStack,
        fontWeight: 500,
      },
      uiSecondary: {
        fontFamily: palette.fonts.serifStack,
      },
    },
    overrides: {
      PostsVoteDefault: {
        voteScores: {
          margin: "25% 15% 15% 15%"
        }
      },
      MuiTooltip: {
        tooltip: {
          fontSize: 13,
          padding: "9.1px",
          zIndex: 10000000
        }
      },
      MuiDialogContent: {
        root: {
          fontFamily: palette.fonts.sansSerifStack,
          fontSize: 15.08,
          lineHeight: "1.5em"
        }
      },
      MuiMenuItem: {
        root: {
          fontFamily: palette.fonts.sansSerifStack,
          color: palette.grey[800],
          fontSize: 14.3,
          lineHeight: "1.1em"
        }
      },
      MuiListItem: {
        root: {
          paddingTop: 8,
          paddingBottom: 8
        }
      },
      MuiCard: {
        root: {
          borderRadius: 1,
          boxShadow: palette.boxShadow.lwCard,
        }
      },
      MuiSnackbarContent: {
        root: {
          backgroundColor: palette.background.default,
        }
      },
    }
  }),
};
