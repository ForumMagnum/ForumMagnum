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
      fontFamily: sansSerifStack
    },
    link: {
      underlinePosition: "72%",
    },
    title: {
      fontWeight: 500,
    },
    display2: {
      fontWeight: 500
    },
    display3: {
      fontWeight: 500
    },
    body1: {
      linkUnderlinePosition: "90%",
    }
  }
});

export default theme
