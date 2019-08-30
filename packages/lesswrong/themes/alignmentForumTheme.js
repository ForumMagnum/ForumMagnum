import createLWTheme from './createThemeDefaults';
import deepOrange from '@material-ui/core/colors/deepOrange';
import indigo from '@material-ui/core/colors/indigo';

import { createMuiTheme } from '@material-ui/core/styles';

const defaultTheme = createMuiTheme()

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
  primary: indigo,
  secondary: indigo,
  lwTertiary: {
    main: "#607e88"
  },
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
      fontVariantNumeric: "lining-nums",
    },
    commentStyle: {
      fontFamily: sansSerifStack,
      fontVariantNumeric: "lining-nums",
    },
    link: {
      underlinePosition: "72%",
    },
    h6: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500
    },
    h2: {
      fontWeight: 500
    },
    body2: {
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
    },
    PostsVote: {
      voteScores: {
        fontVariantNumeric: "lining-nums",
      }
    },
    Section: {
      sectionTitle: {
        [defaultTheme.breakpoints.up('md')]: {
          top: 8,
        }
      }
    },
    SectionTitle: {
      leftDivider: {
        width: 18,
        marginTop: 4
      },
      rightDivider: {
        marginTop: 4,
        marginRight: 8,
      },
      tailDivider: {
        marginTop: 4,
        width: 24,
      }
    },
    SectionButton: {
      root: {
        marginTop: 4,
        fontWeight: 500,
      }
    },
    LoadMore: {
      root: {
        fontWeight: 500,
      }
    }
  }
});

export default theme
