import createLWTheme from './createThemeDefaults.js';
import grey from '@material-ui/core/colors/grey';
import deepOrange from '@material-ui/core/colors/deepOrange';

const sansSerifStack = [
  'Raleway',
  'sans-serif'
].join(',')

const serifStack = [
  'Merriweather',
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

const theme = createLWTheme({
  palette,
  typography: {
    fontFamily: sansSerifStack,
    postStyle: {
      fontFamily: serifStack,
      linkUnderlinePosition: "72%",
    },
    commentStyle: {
      fontFamily: sansSerifStack
    },
    headline: {
      fontFamily: serifStack,
    },
    title: {
      fontFamily: serifStack,
      fontWeight: 500,
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
