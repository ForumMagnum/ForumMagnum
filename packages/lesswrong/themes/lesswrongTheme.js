import { createMuiTheme } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import green from '@material-ui/core/colors/green';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: grey[50],
    },
    secondary: green,
    error: green,
  },
  typography: {
    // Use the system font instead of the default Roboto font.
    fontFamily: [
      'Calibri',
      "Gill Sans",
      "Gill Sans MT",
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
    ].join(','),
    title: {
      fontWeight: 400,
      fontFamily: [
        '"warnock-pro"',
        'Palatino',
        '"Palatino Linotype"',
        '"Palatino LT STD"',
        '"Book Antiqua"',
        'Georgia',
        'serif'
      ]
    }
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
