import createLWTheme from './createThemeDefaults.js';
import grey from '@material-ui/core/colors/grey';
import deepOrange from '@material-ui/core/colors/deepOrange';

const sansSerifStack = [
  'Calibri',
  '"Gill Sans"',
  '"Gill Sans MT"',
  "Myriad Pro",
  'Myriad',
  '"DejaVu Sans Condensed"',
  '"Liberation Sans"',
  '"Nimbus Sans L"',
  'Tahoma',
  'Geneva',
  '"Helvetica Neue"',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

const serifStack = [
  'warnock-pro',
  'Palatino',
  '"Palatino Linotype"',
  '"Palatino LT STD"',
  '"Book Antiqua"',
  'Georgia',
  'serif'
].join(',')

const palette = {
  primary: {
    main: grey[50],
    contrastText: grey[800]
  },
  secondary: {
    main: '#5f9b65',
  },
  error: {
    main: deepOrange[900]
  },
  background: {
    default: '#fff'
  }
}

const theme = createLWTheme({
  palette: palette,
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
  }
});

export default theme
