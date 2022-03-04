import createLWTheme from "./createThemeDefaults";
import grey from "@material-ui/core/colors/grey";
import deepOrange from "@material-ui/core/colors/deepOrange";

const sansSerifStack = [
  "Jost",
  "GreekFallback", // Ensures that greek letters render consistently
  "Calibri",
  '"Gill Sans"',
  '"Gill Sans MT"',
  "Myriad Pro",
  "Myriad",
  '"Liberation Sans"',
  '"Nimbus Sans L"',
  "Tahoma",
  "Geneva",
  '"Helvetica Neue"',
  "Helvetica",
  "Arial",
  "sans-serif",
].join(",");

const serifStack = [
  "Source Serif Pro",
  // "warnock-pro",
  "Palatino",
  '"Palatino Linotype"',
  '"Palatino LT STD"',
  '"Book Antiqua"',
  "Georgia",
  "serif",
].join(",");

const palette = {
  primary: {
    main: '#BF3945',
  },
  secondary: {
    main: "#BF3945", // has to be red, not cream - shows up in eg. checkbox
  },
  lwTertiary: {
    main: "#BF3945",
    dark: "#BF3945",
  },
  error: {
    main: deepOrange[900],
  },
  background: {
    default: "#F7F7F5",
  },
  event: "#2b6a99",
  group: "#588f27",
  individual: "#3f51b5",
};

const theme = createLWTheme({
  palette: palette,

  typography: {

    fontDownloads: [
      "https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap",
      "https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&display=swap",
      // "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap",
    ],

    fontFamily: sansSerifStack, // nav items and more smaller bits

    sectionStyle: {
      fontFamily: sansSerifStack,
      color: palette.primary.main,
    },

    latestCardStyle: {
      fontFamily: sansSerifStack,
      fontSize: "1.9rem", // doesn't work, see PostsTitle.tsx
    },

    blockquote: {
      fontFamily: sansSerifStack,
    },

    footnote: {
      fontFamily: sansSerifStack,
    },

    postStyle: {
      fontFamily: serifStack, // article body, article title preview on homepage
    },

    headerStyle: {
      fontFamily: serifStack, // article title (not on homepage preview)
      fontWeight: 700,
    },

    caption: {
      // captions should be relative to their surrounding content, so they are unopinionated about fontFamily and use ems instead of rems
      fontFamily: "sansSerifStack",
      fontSize: ".85em",
    },

    body1: {
      fontSize: "1.3rem",
    },

    body2: {
      fontSize: "1.2rem", // ia. nav items
    },

    commentStyle: {
      fontFamily: sansSerifStack,
      lineHeight: '1.8rem',
      
    },

    errorStyle: {
      color: palette.error.main,
      fontFamily: sansSerifStack,
    },

    headline: {
      fontFamily: serifStack, // showed up in FAQ headlines (both homepage preview and article itself)
      color: grey[800],

    },

    subheading: {
      fontFamily: serifStack,
    },

    title: {
      fontFamily: sansSerifStack,
      fontWeight: 500, // site header
    },

    // used by h3
    display0: {
      color: grey[800],
      fontFamily: serifStack,
      fontWeight: 500,
      fontSize: '1.6rem',
      lineHeight: '1.25em',
    },
    // used by h1
    display1: {
      color: grey[800],
      fontFamily: sansSerifStack, // doesn't work
      fontWeight: 400,
      fontSize: '2rem',
      lineHeight: '1.25em',
    },
    // used by article title on homepage
    display2: {
      color: grey[800],
      fontFamily: serifStack, // doesn't work
      fontWeight: 700,
      fontSize: '2.75rem',
      lineHeight: '1.25em',
    },
    // used by page title
    display3: {
      color: grey[800],
      fontFamily: sansSerifStack,
      fontWeight: 500,
      lineHeight: '1.25em'
    },
    uiSecondary: {
      fontFamily: sansSerifStack, // in article - below title, author, publish date etc.
      fontSize: "1rem", // doesn't work
    },

  }, // end of typography

  overrides: {
    MuiAppBar: {
      colorDefault: {
        backgroundColor: "#FCFCFA",
      },
    },
    PostsVote: {
      voteScores: {
        margin: "25% 15% 15% 15%",
      },
    },
    MuiTooltip: {
      tooltip: {
        fontSize: "1rem",
        padding: ".7rem",
        zIndex: 10000000,
      },
    },
    MuiDialogContent: {
      root: {
        fontFamily: sansSerifStack,
        fontSize: "1.2rem",
        lineHeight: "1.5em",
      },
    },
    MuiMenuItem: {
      root: {
        fontFamily: sansSerifStack,
        color: grey[800],
        fontSize: "1rem", // doesn't change font size of nav items but their 'box' only
        lineHeight: "1em",
      },
    },
    MuiListItem: {
      root: {
        paddingTop: 8,
        paddingBottom: 8,
      },
    },
    MuiCard: {
      root: {
        borderRadius: 1,
        boxShadow: "0 0 10px rgba(0,0,0,.2)",
      },
    },

    MuiTab: {
      label: {
        fontSize: "1rem",
      },
    },

    MuiButton: {
      label: {
        // fontSize: "1rem", // it affects not only RSS modal but all button labels
      },
    },

    MuiPaper: {
      root: {
        // backgroundColor: "#FCFCFA", // also colors popover cards
      },
    },

  }, // end of overrides
  
});

export default theme;
