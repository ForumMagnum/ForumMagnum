import { createMuiTheme } from '@material-ui/core/styles';

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


const defaultTheme = createMuiTheme()

export const eaForumTheme: SiteThemeSpecification = {
  shadePalette: {
    fonts: {sansSerifStack, serifStack},
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
    background: {
      default: shadePalette.type === 'light' ? '#f6f8f9' : shadePalette.grey[60],
      primaryDim: '#e2f1f4',
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
    const basicText = {
      color: palette.grey[900],
      // use ems (not rems) to preserve relative height even if font-size is changed
      lineHeight: '1.75em',
      fontWeight: 450,
      fontFamily: serifStack
    }
    return {
      borderRadius: {
        default: 6,
        small: 4,
      },
      typography: {
        fontDownloads: [
          "https://fonts.googleapis.com/css?family=Merriweather:300,400,500,600,700&subset=all",
          "https://fonts.googleapis.com/css?family=Inter:300,400,450,500,600,700",
          // TODO we need to find where this is used in material ui and remove
          "https://fonts.googleapis.com/css?family=Roboto:300,400,500",
        ],
        fontFamily: sansSerifStack,
        body1: {
          ...basicText,
          fontSize: "1.2rem",
          fontFamily: serifStack,
        },
        body2: {
          fontSize: "1.1rem",
          lineHeight: "1.5em",
          fontWeight: 450,
        },
        smallText: {
          fontFamily: palette.fonts.sansSerifStack,
          fontWeight: 450,
          fontSize: "1rem",
          lineHeight: '1.4rem'
        },
        tinyText: {
          fontWeight: 450,
          fontSize: ".75rem",
          lineHeight: '1.4rem'
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
          fontSize: '1.6rem',
          lineHeight: '1.25em',
        },
        // used by h2
        display1: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 650,
          fontSize: '2rem',
          lineHeight: '1.25em',
        },
        // used by h1
        display2: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 600,
          fontSize: '2.4rem',
          lineHeight: '1.25em',
        },
        // used by page title
        display3: {
          color: palette.grey[800],
          fontFamily: titleStack,
          fontWeight: 500,
          lineHeight: '1.25em'
        },
        uiSecondary: {
          sansSerifStack
        },
        chapterTitle: {
          fontSize: "1.25em",
          fontStyle: "unset",
          textTransform: "unset",
          color: palette.grey[800],
          lineHeight: "1.75em",
          fontFamily: serifStack
        },
        largeChapterTitle: {
          fontSize: "2.2rem"
        },
        italic: {
          fontStyle: "normal",
        },
        smallCaps: {
          fontVariant: "normal",
        },
      },
      overrides: {
        MuiTooltip: {
          tooltip: {
            fontSize: "1rem",
            padding: ".7rem",
          }
        },
        Header: {
          root: {
            height: 90,
            '@media (max-width: 959.95px) and (min-width: 600px)': {
              height: 86, // I don't know why headroom shifts by 4 pixels, don't ask me
            },
            [defaultTheme.breakpoints.down('xs')]: {
              height: 77,
            },
          },
          appBar: {
            padding: 11,
            '@media (min-width: 960px)': {
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 13,
              paddingBottom: 13,
            }
          },
        },
        MetaInfo: {
          root: {
            fontFamily: sansSerifStack
          }
        },
        PostsVote: {
          voteScore: {
            paddingTop:4,
            paddingBottom:2,
            paddingLeft:1,
            paddingRight:0,
            fontSize: '50%',
            fontFamily: sansSerifStack,
          },
        },
        PostsTopSequencesNav: {
          root: {
            marginBottom: -8,
          },
          title: {
            textTransform: 'uppercase',
            fontSize: 18,
            color: 'rgba(0,0,0,.7)',
            fontWeight: 500,
          }
        },
        FilterMode: {
          selected: {
            color: palette.primary.main
          }
        },
        NavigationStandalone: {
          sidebar: {
            top: 26,
          },
          footerBar: {
            backgroundColor: palette.grey[200],
          }
        },
        TabNavigationItem: {
          navButton: {
            paddingTop: 10,
            paddingBottom: 10,
          },
          icon: {
            opacity: 1,
          },
        },
        TabNavigationFooterItem: {
          selected: {
            backgroundColor: palette.secondary.main
          }
        },
        TabNavigationCompressedItem: {
          icon: {
            opacity: 1
          }
        },
        PostsPageTitle: {
          root: {
            lineHeight: 1.25,
            fontWeight: 700
          }
        },
        PostsTimeBlock: {
          divider: {
            display: 'none'
          }
        },
        SequencesPage: {
          root: {
            paddingTop: 345,
          },
          banner: {
            top: 77,
          },
        },
        EAAllTagsPage: {
          portal: {
            background: palette.grey[0],
            marginTop: 'unset',
            marginBottom: 'unset',
            padding: '20px',
            boxShadow: "0 1px 5px rgba(0,0,0,.025)",
          }
        },
        TagSmallPostLink: {
          wrap: {
            lineHeight: '1.2em'
          }
        },
        TagsDetailsItem: {
          description: {
            maxWidth: 490,
          }
        },
        ContentType: {
          root: {
            color: palette.grey[800],
            fontWeight: 600
          },
          icon: {
            color: palette.grey[800]
          }
        },
        MuiSnackbarContent: {
          root: {
            backgroundColor: palette.lwTertiary.main
          }
        }
      }
    }
  }
};
