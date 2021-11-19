import forumTheme from "../themes/forumTheme";

const maxSmallish = "@media screen and (max-width: 715px)";
const maxTiny = "@media screen and (max-width: 400px)";

const clearStyle = (theme: ThemeType): JssStyles => ({
  html: {
    fontSize: 13,
    boxSizing: "border-box",
    "-webkit-font-smoothing": "antialiased",
    "-moz-osx-font-smoothing": "grayscale",
  },
  "*, *::before, *::after": {
    boxSizing: "inherit",
  },
  body: {
    margin: 0,
    backgroundColor: forumTheme.palette.background.default,
    
    "@media print": {
      backgroundColor: "white",
    },
  },
  
  "h1, h2, h3, h4": {
    fontWeight: 500,
  },
  
  "textarea, textarea:focus, input, input:focus": {
    border: "none",
    outline: "none",
  },
  
  button: {
    border: "none",
    boxShadow: "none",
    cursor: "pointer",
  },
  
  figure: {
    margin: "1em 0",
  },
});

const globalStyle = (theme: ThemeType): JssStyles => ({
  ".message.error": {
    color: "#E04E4B",
  },
  
  ".ais-InstantSearch__root": {
    fontFamily: "inherit !important",
  },
  
  ".noscript-warning": {
    padding: 20,
    fontSize: 17,
  },
  
  // Global link styling
  a: {
    cursor: "pointer",
    color: "inherit",
    textDecoration: "none",
  },
  
  "a:hover, a:active": {
    textDecoration: "none",
    opacity: 0.5,
  },
  
  // Hide ReCaptcha box (see: https://developers.google.com/recaptcha/docs/faq)
  ".grecaptcha-badge": {
    visibility: "hidden",
  },
  
  ".reCaptcha-text": {
    fontFamily: "sans-serif",
    color: "rgba(0,0,0,0.5)",
    fontSize: 11,
  },
  ".thoughtSaverFrame": {
    width: "100%",
    height: "500px",
    border: "none",
    borderRadius: 5
  },
});

const commentsStyle = (theme: ThemeType): JssStyles => ({
  ".comments-node-root": {
    marginBottom: "1.3em",
  
    [maxSmallish]: {
      marginBottom: 10,
    },
    [maxTiny]: {
      marginBottom: 8,
      paddingTop: 5,
    },
    
    backgroundColor: "white",
  },
  ".comments-node .comments-node": {
    [maxTiny]: {
      marginLeft: 5,
      marginBottom: 5,
    }
  },
  
  ".comments-edit-form": {
    position: "relative",
    paddingBottom: 12,
    "& .form-submit": {
      textAlign: "right",
      marginRight: 10,
    },
  },
  
  ".comments-load-more": {
    marginLeft: 10,
  },
  
  ".comments-node-even": {
    backgroundColor: "rgb(242,242,242)",
  },
  ".comments-node-odd": {
    backgroundColor: "rgb(252,252,252)",
  },
  ".comments-node-its-getting-nested-here": {
    marginLeft: "7px !important",
    marginBottom: "7px !important",
  },
  ".comments-node-so-take-off-all-your-margins": {
    marginLeft: "6px !important",
    marginBottom: "6px !important",
  },
  ".comments-node-im-getting-so-nested": {
    marginLeft: "5px !important",
    marginBottom: "5px !important",
  },
  ".comments-node-im-gonna-drop-my-margins": {
    marginLeft: "5px !important",
    marginBottom: "5px !important",
  },
  ".comments-node-what-are-you-even-arguing-about": {
    marginLeft: "4px !important",
    marginBottom: "4px !important",
  },
  ".comments-node-are-you-sure-this-is-a-good-idea": {
    marginLeft: "3px !important",
    marginBottom: "3px !important",
  },
  ".comments-node-seriously-what-the-fuck": {
    marginLeft: "2px !important",
    marginBottom: "2px !important",
    transform: "rotate(.5deg)",
  },
  ".comments-node-are-you-curi-and-lumifer-specifically": {
    marginLeft: "1px !important",
    marginBottom: "1px !important",
    transform: "rotate(1deg)",
  },
  ".comments-node-cuz-i-guess-that-makes-sense-but-like-really-tho": {
    marginLeft: "1px !important",
    marginBottom: "1px !important",
    transform: "rotate(-1deg)",
  },
  
  ".recent-comments-node": {
    "&.loading": {
      minHeight: 80,
      padding: 35,
      backgroundColor: "rgb(242,242,242)",
    },
  
    "& .comments-node": {
      margin: 0,
    },
    "&.comments-node-root": {
      backgroundColor: "none",
      marginBottom: ".8em",
      position: "inherit",
    },
  },
});

export const globalStyles = (theme: ThemeType): JssStyles => ({
  ...clearStyle(theme),
  ...globalStyle(theme),
  ...commentsStyle(theme),
});
