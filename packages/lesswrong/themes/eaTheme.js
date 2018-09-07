import createLWTheme from './createThemeDefaults.js';
import grey from '@material-ui/core/colors/grey';
import deepOrange from '@material-ui/core/colors/deepOrange';

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
      fontFamily: serifStack,
    },
    body2: {
      ...basicText,
      fontSize: "1rem"
    },
    postStyle: {
      ...basicText,
      linkUnderlinePosition: "72%",
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
        backgroundColor: grey[50],
      }
    },
  }
});

export default theme
