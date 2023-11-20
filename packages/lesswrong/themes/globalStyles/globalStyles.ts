import { isEAForum } from "../../lib/instanceSettings";
import { isFriendlyUI } from "../forumTheme";

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
  '.dialogue-message-input-wrapper': {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 12,
  },

  '.dialogue-message-input': {
    padding: '26px 16px 40px 16px',
    position: 'relative',
    margin: '12px 0',
    order: 2,
    ...(isFriendlyUI
      ? {
        borderRadius: theme.borderRadius.small,
        '&[user-order="1"]': {
          border: `2px solid ${theme.palette.text.debateComment} !important`,
        },
        '&[user-order="2"]': {
          border: `2px solid ${theme.palette.text.debateComment2} !important`,
        },
        '&[user-order="3"]': {
          border: `2px solid ${theme.palette.text.debateComment3} !important`,
        },
        '&[user-order="4"]': {
          border: `2px solid ${theme.palette.text.debateComment4} !important`,
        },
        '&[user-order="5"]': {
          border: `2px solid ${theme.palette.text.debateComment5} !important`,
        },
      }
      : {
        borderRadius: 3,
        border: '2px solid !important',
        '&[user-order="1"] .dialogue-message-input-header': {
          color: `${theme.palette.text.debateComment} !important`,
        },
        '&[user-order="2"] .dialogue-message-input-header': {
          color: `${theme.palette.text.debateComment2} !important`,
        },
        '&[user-order="3"] .dialogue-message-input-header': {
          color: `${theme.palette.text.debateComment3} !important`,
        },
        '&[user-order="4"] .dialogue-message-input-header': {
          color: `${theme.palette.text.debateComment4} !important`,
        },
        '&[user-order="5"] .dialogue-message-input-header': {
          color: `${theme.palette.text.debateComment5} !important`,
        },
      }),
  },

  '.dialogue-message-input-header': {
    position: 'absolute',
    top: -14,
    backgroundColor: theme.palette.grey[0],
    padding: isEAForum ? "4px 8px" : 4,
    borderRadius: isEAForum ? theme.borderRadius.small : undefined,
  },

  '.dialogue-message-input button': {
    marginLeft: 'auto',
    marginRight: -8,
    marginBottom: -4,
    display: 'block',
    position: 'absolute',
    right: 16,
    bottom: 12,
    padding: 0,
    minHeight: 'unset',
  },

  '.dialogue-message': {
    marginTop: 6,
    position: 'relative',
    ...(isFriendlyUI
      ? {
        fontSize: 14,
        marginBottom: 22,
        padding: '26px 8px 0px 12px',
        '&[user-order="1"]': {
          borderLeft: `2px solid ${theme.palette.text.debateComment}`,
        },
        '&[user-order="2"]': {
          borderLeft: `2px solid ${theme.palette.text.debateComment2}`,
        },
        '&[user-order="3"]': {
          borderLeft: `2px solid ${theme.palette.text.debateComment3}`,
        },
        '&[user-order="4"]': {
          borderLeft: `2px solid ${theme.palette.text.debateComment4}`,
        },
        '&[user-order="5"]': {
          borderLeft: `2px solid ${theme.palette.text.debateComment5}`,
        },
        '& .dialogue-message-header b': {
          fontWeight: 700,
        },
      }
      : {
        padding: '22px 8px 8px 0px',
        '&[user-order="1"] .dialogue-message-header': {
          color: `${theme.palette.text.debateComment} !important`,
        },
        '&[user-order="2"] .dialogue-message-header': {
          color: `${theme.palette.text.debateComment2} !important`,
        },
        '&[user-order="3"] .dialogue-message-header': {
          color: `${theme.palette.text.debateComment3} !important`,
        },
        '&[user-order="4"] .dialogue-message-header': {
          color: `${theme.palette.text.debateComment4} !important`,
        },
        '&[user-order="5"] .dialogue-message-header': {
          color: `${theme.palette.text.debateComment5} !important`,
        },
      }),
  },

  '.dialogue-message p, .dialogue-message-input p': {
    marginBottom: '0px !important'
  },

  '.dialogue-message-header': {
    position: 'absolute',
    top: 0
  },

  '.dialogue-message-header b': {
    fontWeight: 600,
  }
});

export const globalStyles = (theme: ThemeType): JssStyles => ({
  ...clearStyle(theme),
  ...globalStyle(theme),
  ...commentsStyle(theme),
  ...dialogueStyle(theme)
});
