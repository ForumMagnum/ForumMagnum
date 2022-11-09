
const sansSerifStack = [
  'GreekFallback', // Ensures that greek letters render consistently
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

const serifStack = [
  'warnock-pro',
  'Palatino',
  '"Palatino Linotype"',
  '"Palatino LT STD"',
  '"Book Antiqua"',
  'Georgia',
  'serif'
].join(',')

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
  }),
  make: (palette: ThemePalette) => ({
    typography: {
      fontFamily: sansSerifStack,
      postStyle: {
        fontFamily: serifStack,
      },
      headerStyle: {
        fontFamily: serifStack,
      },
      caption: {
        // captions should be relative to their surrounding content, so they are unopinionated about fontFamily and use ems instead of rems
        fontFamily: "unset",
        fontSize: '.85em'
      },
      body2: {
        fontSize: "1.16rem"
      },
      commentStyle: {
        fontFamily: sansSerifStack,
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
        fontFamily: serifStack,
        fontWeight: 500,
      },
      uiSecondary: {
        fontFamily: serifStack,
      },
    },
    overrides: {
      PostsVote: {
        voteScores: {
          margin: "25% 15% 15% 15%"
        }
      },
      MuiTooltip: {
        tooltip: {
          fontSize: "1rem",
          padding: ".7rem",
          zIndex: 10000000
        }
      },
      MuiDialogContent: {
        root: {
          fontFamily: sansSerifStack,
          fontSize: "1.16rem",
          lineHeight: "1.5em"
        }
      },
      MuiMenuItem: {
        root: {
          fontFamily: sansSerifStack,
          color: palette.grey[800],
          fontSize: "1.1rem",
          lineHeight: "1em"
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
      }
    }
  }),
};
