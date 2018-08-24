import createLWTheme from './createThemeDefaults';
import deepOrange from '@material-ui/core/colors/deepOrange';
import indigo from '@material-ui/core/colors/indigo';
import lightBlue from '@material-ui/core/colors/lightBlue';

const sansSerifStack = [
  "'Lato'",
  "Arial",
  "sans-serif"
].join(',')

const headerStack = [
  'Raleway',
  '"Helvetica Neue"',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

const serifStack = [
  'Merriweather',
  'Georgia',
  'Garamond',
  '"Times New Roman"',
  'serif'
].join(',')

const palette = {
  primary: {
      main: '#bbdefb',
  },
  secondary: lightBlue,
  error: {
    main: deepOrange[900]
  },
  background: {
    default: '#fff'
  },
  headerType: "primary"
}

const theme = createLWTheme({
  palette: palette,
  typography: {
    fontFamily: serifStack,
    postStyle: {
      fontFamily: serifStack,
    },
    headerStyle: {
      fontFamily: headerStack,
    },
    commentStyle: {
      fontFamily: serifStack
    },
    link: {
      underlinePosition: "72%",
    },
    title: {
      fontFamily: headerStack,
      fontWeight: 600,
    },
    display2: {
      fontFamily: headerStack,
      fontWeight: 600
    },
    display3: {
      fontFamily: headerStack,
      fontWeight: 600
    },
    body1: {
      linkUnderlinePosition: "90%",
      fontSize: "1.2rem",
      lineHeight: "1.8rem",
      fontWeight:300,
    },
    body2: {
      fontSize: ".9rem",
      lineHeight: "1.5rem",
      fontWeight:300,
    }
  },
  overrides: {
    Header: {
      titleLink: {
        top: 0
      }
    }
  }
});

export default theme
