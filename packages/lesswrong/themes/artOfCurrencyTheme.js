import createLWTheme from './createThemeDefaults';
import deepOrange from '@material-ui/core/colors/deepOrange';
import indigo from '@material-ui/core/colors/indigo';
import blue from '@material-ui/core/colors/blue';

const sansSerifStack = [
  '"freight-sans-pro"',
  'Frutiger',
  '"Frutiger Linotype"',
  'Univers',
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

const palette = {
  primary: {
    main: '#0c869b',
  },
  secondary: indigo,
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
    fontFamily: sansSerifStack,
    postStyle: {
      fontFamily: sansSerifStack,
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
    },
  },
  overrides: {
    Header: {
      titleLink: {
        top: 0
      }
    },
    MuiTooltip: {
      tooltip: {
        fontSize: "1rem"
      }
    }
  }
});

export default theme
