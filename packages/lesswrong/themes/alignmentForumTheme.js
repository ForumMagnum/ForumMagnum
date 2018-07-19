import { createMuiTheme } from '@material-ui/core/styles';
import indigo from '@material-ui/core/colors/indigo';
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

const theme = createMuiTheme({
  palette: {
    primary: indigo,
    secondary: indigo,
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

/*

"fontFamily": "warnock-pro",
"palette": {
  "primary1Color": "#f5f5f5",
  "primary2Color": "#eeeeee",
  "accent1Color": "rgba(100, 169, 105, 0.5)",
  "accent2Color": "rgba(100, 169, 105, 1)",
  "accent3Color": "#c8e6c9",
  "pickerHeaderColor": "#4caf50",
},
"appBar": {
  "textColor": "rgba(0, 0, 0, 0.54)"
},
"datePicker": {
  "color": "rgba(0,0,0,0.54)",
  "selectTextColor": "rgba(0,0,0,0.54)",
},
"flatButton": {
  "primaryTextColor": "rgba(0,0,0,0.54)"
},
"checkbox": {
  "checkedColor": "rgba(100, 169, 105, 0.7)",
  "labelColor": "rgba(0,0,0,0.6)",
  "boxColor": "rgba(0,0,0,0.6)"
},
userAgent: userAgent,

*/
