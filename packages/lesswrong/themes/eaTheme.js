import createLWTheme from './createThemeDefaults.js';
import grey from '@material-ui/core/colors/grey';
import deepOrange from '@material-ui/core/colors/deepOrange';
import { createMuiTheme } from '@material-ui/core/styles';

const titleStack = [
  'Raleway',
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


const sansSerifStack = [
  'Merriweather Sans',
  'Lato',
  'Helvetica Neue',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

const palette = {
  primary: {
    main: '#0c869b', // Maybe replace with: 00b2be
  },
  secondary: {
    main: '#0c869b',
  },
  lwTertiary: {
    main: "#607e88" // EA-folk: you may want to pick your own color here
  },
  error: {
    main: deepOrange[900]
  },
  background: {
    default: '#fff'
  }
}

const basicText = {
  color: grey[800],
  // use ems (not rems) to preserve relative height even if font-size is changed
  lineHeight: '1.75em',
  fontWeight: 400,
  fontFamily: serifStack
}

const defaultTheme = createMuiTheme()

const theme = createLWTheme({
  palette,
  typography: {
    fontDownloads: [
      "https://fonts.googleapis.com/css?family=Merriweather:300,400,500,600,700&subset=all",
      "https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700",
      "https://fonts.googleapis.com/css?family=Lato:300,400,500,600,700",
      "https://fonts.googleapis.com/css?family=Merriweather+Sans:300,400,500,600,700",
    ],
    fontFamily: sansSerifStack,
    body1: {
      ...basicText,
      fontSize: "1.2rem",
      fontFamily: serifStack,
    },
    body2: {
      fontSize: "1.1rem",
      lineHeight: "1.5em"
    },
    postStyle: {
      ...basicText,
      linkUnderlinePosition: "92%",
    },
    headerStyle: {
      fontFamily: titleStack
    },
    commentStyle: {
      fontFamily: sansSerifStack,
    },
    headline: {
      fontFamily: serifStack,
    },
    subheading: {
      fontFamily: titleStack
    },
    title: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 500,
      marginBottom: 5,
    },
    // used by h3
    display1a: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 500,
      fontSize: '1.6rem',
      lineHeight: '1.25em',
    },
    // used by h2
    display1: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 500,
      fontSize: '2rem',
      lineHeight: '1.25em',
    },
    // used by h1
    display2: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 500,
      fontSize: '2.4rem',
      lineHeight: '1.25em',
    },
    // used by page title
    display3: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 500,
      lineHeight: '1.25em'
    }
  },
  overrides: {
    MuiAppBar: {
      colorDefault: {
        backgroundColor: "white",
      }
    },
    MuiTooltip: {
      tooltip: {
        fontSize: "1rem",
        padding: ".7rem",
      }
    },
    Layout: {
      main: {
        margin: '30px auto 15px auto',
        '@media (max-width: 959.95px)': {
          marginTop: 0
        }
      }
    },
    Header: {
      root: {
        height: 90,
        [defaultTheme.breakpoints.down('xs')]: {
          height: 77,
        },
      },
      appBar: {
        padding: ".8em",
        '@media (min-width: 960px)': {
          paddingLeft: "1.5em",
          paddingRight: "1.5em",
          paddingTop: "1em",
          paddingBottom: "1em"
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
      },
    },
    Section: {
      sectionTitle: {
        fontWeight:600,
        [defaultTheme.breakpoints.down('sm')]: {
          border: "none",
          paddingTop:0,
        },
        [defaultTheme.breakpoints.up('md')]: {
          top: 0,
          '&:before': "none"
        }
      },
      sectionTitleTop: {
        [defaultTheme.breakpoints.up('md')]: {
          marginBottom: 16
        }
      },
    },
    SunshineSidebar: {
      root: {
        top: 30,
        marginTop: 63
      }
    },
    HomeLatestPosts: {
      personalBlogpostsCheckboxLabel: {
        [defaultTheme.breakpoints.down("xs")]: {
          fontSize: "1rem",
        },
      }
    },
    NavigationStandalone: {
      sidebar: {
        top: 26,
      },
      footerBar: {
        backgroundColor: grey[200],
      }
    },
    TabNavigationMenu: {
      divider: {
        marginTop: 10,
        marginBottom: 20,
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
      navText: {
        color: grey[800]
      }
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
    TabNavigationMenuSubItem: {
      root: {
        color: grey[800]
      }
    },
    PostsTimeBlock: {
      divider: {
        display: 'none'
      }
    },
    ContentType: {
      root: {
        color: grey[800],
        fontWeight: 600
      },
      icon: {
        color: grey[800]
      }
    },
    CommentPermalink: {
      root: {
        marginBottom: 24
      }
    },
  }
});

export default theme
