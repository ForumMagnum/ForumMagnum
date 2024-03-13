import { isFriendlyUI } from "../forumTheme";

export const maxSmallish = "@media screen and (max-width: 715px)";
export const maxTiny = "@media screen and (max-width: 400px)";

export const commentsNodeRootMarginBottom = 17

const clearStyle = (theme: ThemeType): JssStyles => ({
  html: {
    fontSize: theme.baseFontSize,
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
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
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


type Enumerate<N extends number, Acc extends number[] = []> =
  Acc["length"] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> =
  Exclude<Enumerate<T>, Enumerate<F>>;

const makeDialogueCommentStyles = (
  theme: ThemeType,
  selector: (i: number) => string,
  style: (color: string) => JssStyles,
) => {
  const count = 6;
  const result: JssStyles = {};
  for (let i = 1 as IntRange<1, 7>; i <= count; i++) {
    const color = theme.palette.text.debateComment[`${i}`];
    result[selector(i)] = style(color);
  }
  return result;
}

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
        fontSize: "1.1rem",
        "& p, & div, & span, & li, & blockquote, & pre": {
          fontSize: "1.1rem",
        },
        borderRadius: theme.borderRadius.small,
        border: "2px solid transparent",
        ...makeDialogueCommentStyles(
          theme,
          (i) => `&[user-order="${i}"]`,
          (color) => ({
            borderColor: `${color} !important`,
          }),
        ),
      }
      : {
        borderRadius: 3,
        border: '2px solid !important',
        ...makeDialogueCommentStyles(
          theme,
          (i) => `&[user-order="${i}"] .dialogue-message-input-header`,
          (color) => ({
            color: `${color} !important`,
          }),
        ),
      }),
  },

  '.dialogue-message-input-header': {
    position: 'absolute',
    top: -14,
    backgroundColor: theme.palette.grey[0],
    padding: isFriendlyUI ? "4px 8px" : 4,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : undefined,
  },

  '.dialogue-message-input button': {
    marginRight: -8,
    display: 'block',
    position: 'absolute',
    ...(isFriendlyUI
      ? {
        right: 12,
        bottom: 5,
        color: theme.palette.grey[1000],
        backgroundColor: theme.palette.grey[250],
        "&:hover": {
          backgroundColor: theme.palette.grey[300],
        },
      }
      : {
        right: 16,
        padding: 0,
        minHeight: 'unset',
        marginLeft: 'auto',
        marginBottom: -4,
        bottom: 12,
      }),
  },

  '.dialogue-message': {
    marginTop: 6,
    position: 'relative',
    ...(isFriendlyUI
      ? {
        fontSize: "1.1rem",
        "& p, & div, & span, & li, & blockquote, & pre": {
          fontSize: "1.1rem",
        },
        marginBottom: 22,
        padding: '22px 8px 0px 12px',
        "&:after": {
          display: "block",
          position: "absolute",
          content: "''",
          top: 0,
          left: 0,
          height: "calc(100% - 3px)",
          borderRight: "2px solid transparent",
        },
        '& .dialogue-message-header b': {
          fontWeight: 700,
        },
        ...makeDialogueCommentStyles(
          theme,
          (i) => `&[user-order="${i}"]:after`,
          (color) => ({
            borderColor: color,
          }),
        ),
      }
      : {
        padding: '22px 8px 8px 0px',
        ...makeDialogueCommentStyles(
          theme,
          (i) => `&[user-order="${i}"] .dialogue-message-header`,
          (color) => ({
            color: `${color} !important`,
          }),
        ),
      }),
  },

  '.dialogue-message p, .dialogue-message-input p': {
    marginBottom: '0px !important'
  },

  '.dialogue-message-header': {
    position: 'absolute',
    top: isFriendlyUI ? -4 : 0,
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
