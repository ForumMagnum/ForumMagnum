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
    body2: {
      ...basicText,
      fontSize: "1.2rem",
      fontFamily: serifStack,
    },
    body1: {
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
    h5: {
      fontFamily: serifStack,
    },
    subtitle1: {
      fontFamily: titleStack
    },
    h6: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 500,
      marginBottom: 5,
    },
    h3: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 600
    },
    h2: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 500
    }
  },
  overrides: {
    MuiAppBar: {
      colorDefault: {
        backgroundColor: "white",
      }
    },
    Header: {
      appBar: {
        padding: "1em"
      }
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
    MuiTooltip: {
      tooltip: {
        fontSize: "1rem",
        padding: ".7rem",
      }
    },
    SunshineSidebar: {
      root: {
        top: 30
      }
    },
    PostsPageTitle: {
      root: {
        lineHeight: '1.25em'
      }
    },
    NavigationStandalone: {
      sidebar: {
        paddingTop: 30,
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
    }
  }
});

export default theme
