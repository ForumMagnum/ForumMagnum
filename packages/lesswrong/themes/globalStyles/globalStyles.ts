export const maxSmallish = "@media screen and (max-width: 715px)";
export const maxTiny = "@media screen and (max-width: 400px)";

export const commentsNodeRootMarginBottom = 17

const clearStyle = (theme: ThemeType): JssStyles => ({
  html: {
    fontSize: 13,
    boxSizing: "border-box",
    "-webkit-font-smoothing": "antialiased",
    "-moz-osx-font-smoothing": "grayscale",
    color: theme.palette.text.maxIntensity,
  },
  "*, *::before, *::after": {
    boxSizing: "inherit",
  },
  body: {
    margin: 0,
    backgroundColor: theme.palette.background.default,
    
    "@media print": {
      backgroundColor: theme.palette.panelBackground.default,
    },
  },
  
  "h1, h2, h3, h4": {
    fontWeight: 500,
  },
  
  "textarea, textarea:focus, input, input:focus": {
    border: "none",
    outline: "none",
    color: theme.palette.text.maxIntensity,
  },
  
  button: {
    border: "none",
    boxShadow: "none",
    cursor: "pointer"
  },
  
  figure: {
    margin: "1em 0",
  },
});

const globalStyle = (theme: ThemeType): JssStyles => ({
  ".message.error": {
    color: theme.palette.text.error2,
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
    color: theme.palette.text.dim,
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
  ".comments-node-even": {
    backgroundColor: theme.palette.panelBackground.commentNodeEven,
  },
  ".comments-node-odd": {
    backgroundColor: theme.palette.panelBackground.commentNodeOdd,
  },
  ".comments-node-root": {
    marginBottom: commentsNodeRootMarginBottom,
  
    [maxSmallish]: {
      marginBottom: 10,
    },
    [maxTiny]: {
      marginBottom: 8,
      paddingTop: 5,
    },
    
    backgroundColor: theme.palette.panelBackground.default,
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
      backgroundColor: theme.palette.panelBackground.commentNodeEven,
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

const dialogueStyle = (theme: ThemeType): JssStyles => ({
  '.dialogue-message-input': {
    border: '2px solid !important',
    padding: '26px 16px 40px 16px',
    'border-radius': 3,
    position: 'relative',
    margin: '24px 0',
  },
  
  '.dialogue-message-input-header': {
    position: 'absolute',
    top: -14,
    'background-color': 'white',
    padding: 4
  },
  
  '.dialogue-message-input button': {
    'margin-left': 'auto',
    'margin-right': -8,
    'margin-bottom': -4,
    'padding-bottom': 8,
    display: 'block',
    position: 'absolute',
    right: 16,
    bottom: 12,
    padding: 0,
    'min-height': 'unset'
  },
  
  '.dialogue-message': {
    'border-left': '2px solid',
    'margin-top': 6,
    padding: '22px 8px 8px 16px',
    position: 'relative'
  },
  
  '.dialogue-message p, .dialogue-message-input p': {
    'margin-bottom': '0px !important'
  },
  
  '.dialogue-message[user-order="1"], .dialogue-message-input[user-order="1"]': {
    'border-color': `${theme.palette.border.debateComment} !important`
  },
  
  '.dialogue-message[user-order="2"], .dialogue-message-input[user-order="2"]': {
    'border-color': `${theme.palette.border.debateComment2} !important`
  },
  
  '.dialogue-message[user-order="3"], .dialogue-message-input[user-order="3"]': {
    'border-color': `${theme.palette.border.debateComment3} !important`
  },
  
  '.dialogue-message[user-order="4"], .dialogue-message-input[user-order="4"]': {
    'border-color': `${theme.palette.border.debateComment4} !important`
  },
  
  '.dialogue-message[user-order="5"], .dialogue-message-input[user-order="5"]': {
    'border-color': `${theme.palette.border.debateComment5} !important`
  },
  
  '.dialogue-message-header': {
    position: 'absolute',
    top: 3
  }
});

export const globalStyles = (theme: ThemeType): JssStyles => ({
  ...clearStyle(theme),
  ...globalStyle(theme),
  ...commentsStyle(theme),
  ...dialogueStyle(theme)
});
