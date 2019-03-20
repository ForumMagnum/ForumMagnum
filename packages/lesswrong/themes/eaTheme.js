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

// TODO why is SanSerifStack different from titleStack?
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
    main: '#0c869b',
  },
  secondary: {
    main: '#0c869b',
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
      // TODO we use these?
      "https://fonts.googleapis.com/css?family=Lato:300,400,500,600,700",
      "https://fonts.googleapis.com/css?family=Merriweather+Sans:300,400,500,600,700",
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
    display2: {
      color: grey[800],
      fontFamily: titleStack,
      fontWeight: 600
    },
    display3: {
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
    }
  }
});

export default theme
