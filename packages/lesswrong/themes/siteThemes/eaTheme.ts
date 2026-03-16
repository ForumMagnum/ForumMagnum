import { grey, greyAlpha, primaryAlpha, boxShadowColor, greyBorder } from '../colorUtil';

const titleStack = [
  'GreekFallback', // Ensures that greek letters render consistently
  'Inter',
  'Helvetica Neue',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

const serifStack = [
  'Merriweather',
  'Baskerville',
  'Libre Baskerville',
  'Georgia',
  'serif'
].join(',')

// TODO why is SanSerifStack different from titleStack?
const sansSerifStack = [
  'GreekFallback', // Ensures that greek letters render consistently
  'Inter',
  'Helvetica Neue',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

export const eaForumTheme: SiteThemeSpecification = {
  componentPalette: (dark: boolean) => ({
    fonts: {sansSerifStack, serifStack},
    primaryAlpha: (alpha: number) => `rgba(12, 134, 155,${alpha})`,
    primary: {
      main: '#0c869b',
      light: '#00b2be',
      dark: '#085d6c' 
    },
    secondary: {
      main: '#0c869b',
      light: '#3c9eaf',
      dark: '#085d6c'
    },
    lwTertiary: {
      main: "#137283",
      dark: "#137283",
    },
    error: {
      main: "#bf360c",
    },
    warning: {
      main: "#ffad08"
    },
    text: {
      primaryAlert: "light-dark(#137283,#b2c5b5)",
      contentHeader: grey[1000],
      debateComment: {
        [1]: "#66C9F3",
        [2]: "#FE927B",
        [3]: "#F9E199",
        [4]: "#4BF283",
        [5]: "#CF72F0",
        [6]: "#6C7BFF",
      },
    },
    link: {
      visited: "light-dark(#7130a6,#798754)",
    },
    background: {
      default: dark ? grey[100] : '#f6f8f9',
      primaryDim: "light-dark(#e2f1f4,#28383e)",
      primaryTranslucent: "light-dark(rgba(12, 134, 155, 0.05),rgba(99,141,103,0.3))",
      warningTranslucent: "light-dark(rgba(255, 173, 8, 0.1),rgba(255,173,8,0.3))",
    },
    header: {
      text: dark ? "rgba(0,0,0,.87)" : greyAlpha(.87),
      background: dark ? '#ffffff' : grey[30],
    },
    event: '#0C869B',
    group: '#538747',
    individual: '#BF577D',
    icon: {
      navigationSidebarIcon: greyAlpha(0.5),
      sprout: '#5EB25C'
    },
    border: {
      primaryHighlight: "light-dark(#88c9d4,#314a4e)",
      primaryHighlight2: "light-dark(#bae2e8,#314a4e)",
      secondaryHighlight: "light-dark(#aedba3,#3e503a)",
      secondaryHighlight2: "light-dark(#d8edd3,#3e503a)",
    },
    blockquoteHighlight: {
      commentHovered: dark ? "#b5e5ed" : "#144952",
      individualQuoteHovered: dark ? "#b5e5ed" : "#144952",
      addedBlockquoteHighlightStyles: `padding-top: 4px; padding-bottom: 6px;`
    },
    buttons: {
      alwaysPrimary: '#0c869b',
    },
    tag: {
      text: grey[1000],
      background: grey[0],
      backgroundHover: greyAlpha(0.03),
      border: greyBorder("1px", .15),
      coreTagText: grey[1000],
      coreTagBackground: grey[250],
      coreTagBackgroundHover: grey[340],
      coreTagBorder: `1px solid ${grey[250]}`,
      hollowTagBorder: greyBorder("1px", .15),
      hollowTagBackground: grey[0],
      hollowTagBackgroundHover: greyAlpha(0.03),
      boxShadow: `1px 2px 5px ${boxShadowColor(.2)}`,
      addTagButtonBackground: grey[300],
    },
  }),
  make: (palette: ThemePalette) => {
    const defaultBorderRadius = 6
    const basicText = {
      color: palette.grey[900],
      // use ems (not rems) to preserve relative height even if font-size is changed
      lineHeight: '1.75em',
      fontWeight: 450,
      fontFamily: serifStack
    }
    return {
      spacing: {
        mainLayoutPaddingTop: 20
      },
      borderRadius: {
        default: defaultBorderRadius,
        small: 4,
        quickTakesEntry: defaultBorderRadius,
      },
      typography: {
        cloudinaryFont: {
          stack: "'Inter', sans-serif",
          url: "https://fonts.googleapis.com/css?family=Inter",
        },
        fontFamily: sansSerifStack,
        body1: {
          ...basicText,
          fontSize: 15.6,
          fontFamily: serifStack,
        },
        body2: {
          fontSize: 14.3,
          lineHeight: "1.5em",
          fontWeight: 450,
        },
        smallText: {
          fontFamily: palette.fonts.sansSerifStack,
          fontWeight: 450,
          fontSize: 13,
          lineHeight: "18.2px"
        },
        tinyText: {
          fontWeight: 450,
          fontSize: 9.75,
          lineHeight: "18.2px"
        },
        postStyle: {
          ...basicText,
        },
        headerStyle: {
          fontFamily: titleStack
        },
        commentStyle: {
          fontFamily: sansSerifStack,
          fontWeight: 450
        },
        errorStyle: {
          color: palette.error.main,
          fontFamily: sansSerifStack
        },
        headline: {
          fontFamily: serifStack,
        },
        subheading: {
          fontFamily: titleStack
        },
        title: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 500,
          marginBottom: 5,
        },
        // used by h3
        display0: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 600,
          fontSize: 20.8,
          lineHeight: '1.25em',
        },
        // used by h2
        display1: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 650,
          fontSize: 26,
          lineHeight: '1.25em',
        },
        // used by h1
        display2: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 600,
          fontSize: 31.2,
          lineHeight: '1.25em',
        },
        // used by page title
        display3: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 500,
          lineHeight: '1.25em'
        },
        chapterTitle: {
          fontStyle: "unset",
          textTransform: "unset",
          color: palette.grey[800],
          fontFamily: sansSerifStack,
          fontWeight: 500,
        },
        largeChapterTitle: {
          fontSize: 28.6
        },
        italic: {
          fontStyle: "normal",
        },
        smallCaps: {
          fontVariant: "normal",
        },
      },
      overrides: {
        MuiListItemIcon: {
          root: {
            color: palette.grey[700],
            marginRight: 12,
          }
        },
        MuiIconButton: {
          root: {
            borderRadius: defaultBorderRadius
          }
        }
      },

      isLW: false,
      isAF: false,
    }
  }
};
