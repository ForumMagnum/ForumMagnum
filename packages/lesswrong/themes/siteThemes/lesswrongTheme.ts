import { isBlackBarTitle } from '../../components/seasonal/petrovDay/petrov-day-story/petrovConsts';

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
      background: shadePalette.dark
        ? "rgba(50,50,50,.75)"
        : isBlackBarTitle ? shadePalette.inverseGreyAlpha(.1) : shadePalette.inverseGreyAlpha(.65)
    },
    ultrafeedModalHeader: {
      background: shadePalette.dark
        ? "rgba(50,50,50,.98)"
        : (isBlackBarTitle
          ? "rgba(255,255,255,.4)"
          : "rgba(255,255,255,.95)"
        )
    },
    ultraFeed: {
      readBackground: shadePalette.dark ? shadePalette.grey[200] : '#ffffffb3',
      readBackgroundMobile: shadePalette.grey[100],
      readOpacity: {
        root: shadePalette.dark ? 1 : 0.9,
        content: 0.8,
        rootMobile: 0.9,
        contentMobile: shadePalette.dark ? 1 : 0.9,
      },
    },
    background: {
      default: `light-dark(#f8f4ee,#262626)`,
      hover: '#f0ebe6'
    },
    link: {
      color: "light-dark(#327E09,#788e6a)",
      visited: "#798754"
    },
    fundraisingThermometer: {
      shadow: '#222',
    }
  }),
  make: (palette: ThemePalette) => ({
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
    },

    isBookUI: true,
    isFriendlyUI: false,
    isLW: true,
    isAF: false,
    isLWorAF: true,
    isEAForum: false,
  }),
};
