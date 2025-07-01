const fontStacks = {
  sans: [
    'GreekFallback', // Ensures greek letters render consistently
    'Inter',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'sans-serif'
  ],
  serif: [
    'Charis SIL',
    'Libre Baskerville',
    'Georgia',
    'serif'
  ]
} as const;

const fonts = {
  sans: fontStacks.sans.join(','),
  serif: fontStacks.serif.join(','),
  title: fontStacks.serif.join(','),
  brand: ["Roboto Slab", ...fontStacks.serif].join(','),
}

export const eaForumTheme: SiteThemeSpecification = {
  shadePalette: {
    primaryAlpha: (alpha: number) => `rgba(12, 134, 155,${alpha})`,
    fonts: {
      sansSerifStack: fonts.sans,
      serifStack: fonts.serif,
      brandStack: fonts.brand,
    },
  },
  componentPalette: (shadePalette: ThemeShadePalette) => ({
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
      primaryAlert: "#137283",
      contentHeader: shadePalette.grey[1000],
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
      visited: "#7130a6",
    },
    background: {
      default: shadePalette.type === 'light' ? '#f6f8f9' : shadePalette.grey[60],
      primaryDim: '#e2f1f4',
      primaryTranslucent: "rgba(12, 134, 155, 0.05)",
      warningTranslucent: "rgba(255, 173, 8, 0.1)",
    },
    header: {
      text: shadePalette.type === 'light' ? "rgba(0,0,0,.87)" : shadePalette.greyAlpha(.87),
      background: shadePalette.type === 'light' ? '#ffffff' : shadePalette.grey[30],
    },
    event: '#0C869B',
    group: '#538747',
    individual: '#BF577D',
    icon: {
      navigationSidebarIcon: shadePalette.greyAlpha(0.5),
      sprout: '#5EB25C'
    },
    border: {
      primaryHighlight: '#88c9d4',
      primaryHighlight2: '#bae2e8',
      secondaryHighlight: '#aedba3',
      secondaryHighlight2: '#d8edd3',
    },
    blockquoteHighlight: {
      commentHovered: shadePalette.type === 'light' ? "#b5e5ed" : "#144952",
      individualQuoteHovered: shadePalette.type === 'light' ? "#b5e5ed" : "#144952",
      addedBlockquoteHighlightStyles: `padding-top: 4px; padding-bottom: 6px;`
    },
    buttons: {
      alwaysPrimary: '#0c869b',
    },
    tag: {
      text: shadePalette.grey[1000],
      background: shadePalette.grey[0],
      backgroundHover: shadePalette.greyAlpha(0.03),
      border: shadePalette.greyBorder("1px", .15),
      coreTagText: shadePalette.grey[1000],
      coreTagBackground: shadePalette.grey[250],
      coreTagBackgroundHover: shadePalette.grey[340],
      coreTagBorder: `1px solid ${shadePalette.grey[250]}`,
      hollowTagBorder: shadePalette.greyBorder("1px", .15),
      hollowTagBackground: shadePalette.grey[0],
      hollowTagBackgroundHover: shadePalette.greyAlpha(0.03),
      boxShadow: `1px 2px 5px ${shadePalette.boxShadowColor(.2)}`,
      addTagButtonBackground: shadePalette.grey[300],
    },
  }),
  make: (palette: ThemePalette) => {
    const defaultBorderRadius = 6
    const basicText = {
      color: palette.grey[900],
      // use ems (not rems) to preserve relative height even if font-size is changed
      lineHeight: '1.65em',
      fontWeight: 400,
      fontFamily: fonts.serif
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
        fontDownloads: [
          "https://fonts.googleapis.com/css2?family=Charis+SIL:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Inter:ital,wght@0,300;0,400;0,450;0,500;0,600;0,700;1,300;1,400;1,450;1,500;1,600;1,700&family=Roboto+Slab:wght@400;700&display=swap"
        ],
        cloudinaryFont: {
          stack: "'Inter', sans-serif",
          url: "https://fonts.googleapis.com/css?family=Inter",
        },
        fontFamily: fonts.sans,
        body1: {
          ...basicText,
          fontSize: 17,
          fontFamily: fonts.serif,
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
          fontFamily: fonts.title
        },
        commentStyle: {
          fontFamily: fonts.sans,
          fontWeight: 450
        },
        errorStyle: {
          color: palette.error.main,
          fontFamily: fonts.sans
        },
        headline: {
          fontFamily: fonts.serif,
        },
        subheading: {
          fontFamily: fonts.title
        },
        title: {
          color: palette.grey[800],
          fontFamily: fonts.title,
          fontWeight: 500,
          marginBottom: 5,
        },
        // used by h3
        display0: {
          color: palette.grey[800],
          fontFamily: fonts.title,
          fontWeight: 600,
          fontSize: 20.8,
          lineHeight: '1.25em',
          marginTop: 24,
          marginBottom: 12,
        },
        // used by h2
        display1: {
          color: palette.grey[800],
          fontFamily: fonts.title,
          fontWeight: 650,
          fontSize: 26,
          lineHeight: '1.25em',
          marginTop: 32,
          marginBottom: 12,
        },
        // used by h1
        display2: {
          color: palette.grey[800],
          fontFamily: fonts.title,
          fontWeight: 400,
          fontSize: 34,
          lineHeight: '1.25em',
          marginTop: 32,
          marginBottom: 12,
        },
        // used by page title
        display3: {
          color: palette.grey[800],
          fontFamily: fonts.title,
          fontWeight: 500,
          lineHeight: '1.25em'
        },
        uiSecondary: {
          fontFamily: fonts.sans
        },
        chapterTitle: {
          fontStyle: "unset",
          textTransform: "unset",
          color: palette.grey[800],
          fontFamily: fonts.serif,
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
      }
    }
  }
};
