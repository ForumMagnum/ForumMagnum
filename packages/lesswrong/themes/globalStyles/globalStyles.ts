import type { JssStyles } from "@/lib/jssStyles";
import { isFriendlyUI } from "../forumTheme";

export const maxSmallish = "@media screen and (max-width: 715px)";
export const maxTiny = "@media screen and (max-width: 400px)";

export const commentsNodeRootMarginBottom = 17

const clearStyle = (theme: ThemeType) => ({
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
    background: theme.palette.background.default,
    
    "@media print": {
      background: theme.palette.panelBackground.default,
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

const globalStyle = (theme: ThemeType) => ({
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
  
  ".ck-mentions-balloon": {
    "--ck-color-list-background": theme.palette.panelBackground.default,
    "--ck-color-panel-background": theme.palette.panelBackground.default,
    "--ck-color-panel-border": theme.palette.border.mentionsBaloon,
    "--ck-color-text": theme.palette.text.maxIntensity,
    "--ck-color-list-button-hover-background": theme.palette.buttons.mentions.hover,
    "--ck-color-list-button-on-background": theme.palette.buttons.mentions.selected,
    "--ck-color-list-button-on-background-focus": theme.palette.buttons.mentions.selectedHover,
  },
  
  // CkEditor's inline comments have a yellow background highlight. In some
  // contexts with short line height (dialogue), this highlight bleeds over
  // adjacent lines. Partially mitigate this by removing the default top and
  // bottom border, which added 3px of overlap.
  ".ck-comment-marker": {
    borderTop: "none !important",
    borderBottom: "none !important",
  },

  // Starting in v38, CkEditor puts a "powered by CkEditor" badge in the corner
  // when focused. This is removed by putting a `licenseKey` in the ckeditor
  // config; we do have one of those (since we're using cloud editing), it's
  // not connected to the client in the right place to suppress the banner, so,
  // just use CSS instead. AFAIK this wouldn't be a requirement of the relevant
  // license (GPL) even if we didn't have a separate commercial license, and we
  // do credit Ck in the editor-type dropdown if you have that enabled, just not
  // quite as prominently.
  ".ck-powered-by, .ck-powered-by-balloon": {
    display: "none !important",
  },
  
  // Mapbox
  ...(isFriendlyUI ? {
    ".mapboxgl-popup-content": {
      background: `${theme.palette.panelBackground.mapboxTooltip} !important`
    },
    ".mapboxgl-popup-tip": {
      borderTopColor: `${theme.palette.panelBackground.mapboxTooltip} !important`
    },
    ".mapboxgl-popup-close-button": {
      color: `${theme.palette.text.normal} !important`,
    },
  }: {}),
});

const commentsStyle = (theme: ThemeType) => ({
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

const dialogueStyle = (theme: ThemeType) => ({
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

const audioPlayerStyles = (theme: ThemeType) => ({
  // When the floating audio player is visible, move this ad above it
  'body.t3a-sticky-player-visible .StickyDigestAd-root': {
    bottom: 78
  },
  /*
    Styles for the TYPE III AUDIO player "heading play button" feature.
    See https://docs.type3.audio/ for documentation.
    This is mostly unchanged from the default values, other than the
    colors for .t3a-heading-play-button and the margins for .t3a-heading-play-icon.
  */
  /* Heading play button should not be shown on small screens */
  '.t3a-heading-play-button': {
    display: 'none'
  },
  /* Set minimum width at which heading play button should be shown */
  '@media screen and (min-width: 850px)': {
    '.t3a-heading-play-button': {
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      marginLeft: -34,
      marginRight: 10,
      borderRadius: 9999,
      border: 'none',
      width: '1.5rem',
      height: '1.5rem',
      outline: 'none',
      cursor: 'pointer',
      transform: 'translate(0, 0)',
      zIndex: 10,
  
      /* Colour of the play button */
      backgroundColor: theme.palette.grey[310],
      /* Colour of the play button icon. */
      color: theme.palette.grey[0],
      '&:hover': {
        backgroundColor: theme.palette.grey[400],
      },
      '&:focus': {
        outline: 'none',
      }
    },
    '.t3a-heading-play-icon': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: -1, // The margins here have been changed from the default to fit the EA Forum
    },
    /* Refine this to match the dimensions of your heading typeface */
    'h1 .t3a-heading-play-button': { marginTop: 10 },
    'h2 .t3a-heading-play-button': { marginTop: 7 },
    'h3 .t3a-heading-play-button': { marginTop: 3 },
  }
})

export const globalStyles = (theme: ThemeType) => ({
  ...clearStyle(theme),
  ...globalStyle(theme),
  ...commentsStyle(theme),
  ...dialogueStyle(theme),
  ...audioPlayerStyles(theme),
});
