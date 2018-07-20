import { createMuiTheme } from '@material-ui/core/styles';
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

const theme = createMuiTheme({
  palette: {
    primary: {
      main: grey[50],
      contrastText: grey[800]
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
  },
  typography: {
    fontFamily: sansSerifStack,
    title: {
      fontWeight: 400,
      fontFamily: serifStack
    },
    display1: {
      fontFamily: serifStack,
    },
    display3: {
      fontFamily: serifStack,
    },
    display4: {
      fontFamily: serifStack,
    },
    headline: {
      fontFamily: serifStack,
    },
    subheading: {
      fontFamily: serifStack,
    },
    body1: {
      fontFamily: serifStack,
      fontSize: '1.4rem',
      lineHeight: '2rem',
    },
    body2: {
      fontSize: '1.1rem',
      lineHeight: '1.5rem',
    }
  },
  // LessWrong specific variables
  voting: {
    strongVoteDelay: 1000,
  },

});

export default theme
