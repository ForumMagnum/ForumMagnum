import createLWTheme from './createThemeDefaults.js';
import grey from '@material-ui/core/colors/grey';
import deepOrange from '@material-ui/core/colors/deepOrange';
import { createMuiTheme } from '@material-ui/core/styles';

const sansSerifStack = [
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
  lineHeight: '1.618em',
  fontWeight: 500,
  fontFamily: serifStack
}

const defaultTheme = createMuiTheme()

const theme = createLWTheme({
  palette,
  typography: {
    fontDownloads: [
      "https://fonts.googleapis.com/css?family=Merriweather:300,400,500,600,700",
      "https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700",
    ],
    fontFamily: sansSerifStack,
    body1: {
      ...basicText,
      fontSize: "1.2rem",
      fontFamily: serifStack,
    },
    body2: {
      ...basicText,
      fontSize: "1rem"
    },
    postStyle: {
      ...basicText,
      linkUnderlinePosition: "92%",
    },
    headerStyle: {
      fontFamily: sansSerifStack
    },
    commentStyle: {
      fontFamily: sansSerifStack
    },
    headline: {
      fontFamily: serifStack,
    },
    subheading: {
      fontFamily: sansSerifStack
    },
    title: {
      color: grey[800],
      fontFamily: sansSerifStack,
      fontWeight: 500,
      marginBottom: 5,
    },
    display2: {
      color: grey[800],
      fontFamily: sansSerifStack,
      fontWeight: 500
    },
    display3: {
      color: grey[800],
      fontFamily: sansSerifStack,
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
        fontSize: ".9rem"
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
  }
});

export default theme
