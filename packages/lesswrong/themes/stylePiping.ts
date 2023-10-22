import { isFriendlyUI } from "./forumTheme";

const hideSpoilers = (theme: ThemeType): JssStyles => ({
  backgroundColor: theme.palette.panelBackground.spoilerBlock,
  color: theme.palette.panelBackground.spoilerBlock,
  '& a, & a:hover, & a:focus, & a::after, & li': {
    color: theme.palette.panelBackground.spoilerBlock
  },
  '& code': {
    backgroundColor: theme.palette.panelBackground.spoilerBlock,
  },
});

const spoilerStyles = (theme: ThemeType): JssStyles => ({
  '& p.spoiler': {
    margin: 0,
  },
  '& .spoiler': {
    padding: 8,
    pointerEvents: 'auto',
    minHeight: theme.typography.commentStyle.fontSize,
    '& .public-DraftStyleDefault-block': {
      margin: 0,
    },
    '&:not(:hover)': { // using ':not(:hover)' means we don't need to manually reset elements with special colors or backgrounds, instead they just automatically stay the same if we're not hovering
      ...hideSpoilers(theme),
    }
  },
  // Note: ".spoiler" is the old class Oli originally used. ".spoilers" is a new class 
  // that is applied in make_editable_callbacks.js to groups of adjaecent spoiler paragraphs.
  // (see the make_editable_callbacks.js file for details)
  '& div.spoilers': {
    margin: '1em 0',
    overflow: 'auto',
    '&:not(:hover)': {
      ...hideSpoilers(theme),
    },
    '&:hover': {
      background: theme.palette.panelBackground.revealedSpoilerBlock, // This leaves a light grey background over the revealed-spoiler to make it more obvious where it started.
    },
    '& > p' : {
      margin: '0 !important',
      padding: '0.5em 8px !important'
    },
  },
  '& p.spoiler-v2': {
    margin: 0,
    padding: '0.5em 8px'
  },
  '& .spoilers:not(:hover)::selection, & .spoilers:not(:hover) ::selection': {
    backgroundColor: 'transparent'
  },
  '& .spoilers > p:hover ~ p': {
    ...hideSpoilers(theme),
  }
})

const metaculusPreviewStyles = (theme: ThemeType): JssStyles => ({
  '& div.metaculus-preview': {
    backgroundColor: theme.palette.panelBackground.metaculusBackground,
    '& iframe': {
      width: '100%',
      height: 400,
      border: 'none'
    }
  }
})

const manifoldPreviewStyles = (theme: ThemeType): JssStyles => ({
  "& div.manifold-preview": {
    "& iframe": {
      width: "100%",
      height: 400,
      border: "none",
    },
  },
});

const strawpollPreviewStyles = (theme: ThemeType): JssStyles => ({
  "& div.strawpoll-embed": {
    "& iframe": {
      width: "100%",
      height: 400,
      border: "none",
    },
  },
});

const metaforecastPreviewStyles = (theme: ThemeType): JssStyles => ({
  "& div.metaforecast-preview": {
    "& iframe": {
      width: "100%",
      height: 400,
      border: "none",
    },
  },
});

const owidPreviewStyles = (theme: ThemeType): JssStyles => ({
  '& div.owid-preview': {
    '& iframe': {
      width: '100%',
      height: 400,
      border: 'none'
    }
  }
})

const estimakerPreviewStyles = (theme: ThemeType): JssStyles => ({
  '& div.estimaker-preview': {
    display: 'flex',
    '& iframe': {
      width: '100%',
      height: 400,
      border: 'none'
    }
  }
})

const youtubePreviewStyles = (theme: ThemeType): JssStyles => ({
  '& figure.media div[data-oembed-url*="youtube.com"], & figure.media div[data-oembed-url*="youtu.be"]': {
    position: 'relative',
    height: 0,
    paddingBottom: '56.2493%',
    '& iframe': {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      border: 'none'
    }
  }
})

const tableStyles = (theme: ThemeType): JssStyles => ({
  borderCollapse: "collapse",
  borderSpacing: 0,
  border: theme.palette.border.table,
  margin: "auto",
  height: "100%",
  textAlign: "left",
  width: '100%'
});

const tableCellStyles = (theme: ThemeType): JssStyles => ({
  minWidth: "2em",
  padding: ".4em",
  border: theme.palette.border.tableCell,
  '& p': {
    marginTop: '0.5em',
    marginBottom: '0.5em'
  },
  '& p:first-of-type': {
    marginTop: 0
  }
});

const tableHeadingStyles = (theme: ThemeType): JssStyles => ({
  background: theme.palette.panelBackground.tableHeading,
  fontWeight: 700
});

const hrStyles = (theme: ThemeType): JssStyles => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  margin: "32px 0",
  border: "none", /* strip default hr styling */
  background: "transparent",
  textAlign: "center",
  '&:after': {
    marginLeft: 12,
    color: theme.palette.icon.horizRuleDots,
    fontSize: "1rem",
    letterSpacing: "12px", /* increase space between dots */
    content: '"•••"',
  }
});

const footnoteStyles = (theme: ThemeType): JssStyles => ({
  '& .footnote-item > *': {
    verticalAlign: "text-top",
  },
  '& .footnote-back-link': {
    position: "relative",
    top: "-0.2em",
  },
  '& .footnotes .footnote-back-link > sup': {
    marginRight: 0,
  },
 '& .footnote-content': {
    display: "inline-block",
    padding: "0 0.3em",
    width: '95%',
  },
});

const baseBodyStyles = (theme: ThemeType): JssStyles => ({
  ...theme.typography.body1,
  ...theme.typography.postStyle,
  wordBreak: "break-word",
  '& pre': {
    ...theme.typography.codeblock
  },
  '& code': {
    ...theme.typography.code
  },
  '& blockquote': {
    ...theme.typography.blockquote,
    ...theme.typography.body1,
    ...theme.typography.postStyle
  },
  '& li': {
    ...theme.typography.body1,
    ...theme.typography.li,
    ...theme.typography.postStyle
  },
  '& h1': {
    ...theme.typography.display2,
    ...theme.typography.headerStyle,
    color: theme.palette.text.contentHeader,
  },
  // If a post starts with a header, it should still be flush with the top of
  // the container
  '& h1:first-child': {
    marginTop: 0,
    // Otherwise the line height lowers it noticeably
    marginBlockStart: '-3px',
  },
  '& h2': {
    ...theme.typography.display1,
    ...theme.typography.headerStyle,
    color: theme.palette.text.contentHeader,
  },
  '& h2:first-child': {
    marginTop: 0,
    marginBlockStart: '-2px',
  },
  '& h3': {
    ...theme.typography.display0,
    ...theme.typography.headerStyle,
    color: theme.palette.text.contentHeader,
  },
  '& h3:first-child': {
    marginTop: 0,
    marginBlockStart: 0,
  },
  '& h4': {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    fontWeight:600,
    color: theme.palette.text.contentHeader,
  },
  '& h5': {
    color: theme.palette.text.contentHeader,
  },
  '& h6': {
    color: theme.palette.text.contentHeader,
  },
  '& img': {
    maxWidth: "100%",
    ...theme.postImageStyles,
  },
  '& sup': {
    verticalAlign: 'baseline',
    top: '-0.6em',
    fontSize: '65%',
    position: 'relative'
  },
  '& sub': {
    fontSize: '70%',
    verticalAlign: 'baseline', // We use vertical align baseline to prevent sub-aligned text from changing the line-height, which looks ugly
    position: 'relative',
    top: '0.2em',
    paddingRight: '0.07em'
  },
  '& a, & a:hover, & a:active': {
    color: theme.palette.primary.main,
    '& u': {
      textDecoration: "none"
    }
  },
  '& a:visited': isFriendlyUI ? {
    color: theme.palette.link.visited,
  } : {},
  '& a:visited:hover, & a:visited:active': isFriendlyUI ? {
    color: theme.palette.link.visitedHover,
  } : {},
  '& table': {
    ...tableStyles(theme)
  },
  // CKEditor wraps tables in a figure element
  '& figure.table': {
    width: 'fit-content !important',
    height: 'fit-content !important',
  },
  // Many column tables should overflow instead of squishing
  //  - NB: As of Jan 2023, this does not work on firefox, so ff users will have
  //    squishy tables (which is the default behavior above)
  '& figure.table:has(> table > tbody > tr > td + td + td + td)': {
    overflowX: 'auto',
    '& table': {
      width: 700,
    },
  },
  '& td, & th': {
    ...tableCellStyles(theme)
  },
  '& th': {
    ...tableHeadingStyles(theme)
  },
  '& figure': {
    maxWidth: '100%',
    margin: '1em auto',
    textAlign: "center"
  },
  '& figcaption': {
    ...theme.typography.caption,
    ...theme.typography.postStyle
  },
  '& ol > li > ol': {
    listStyle: 'lower-alpha',
  },
  '& ol > li > ol > li > ol': {
    listStyle: 'lower-roman',
  },
})

export const postBodyStyles = (theme: ThemeType): JssStyles => {
  return {
    ...baseBodyStyles(theme),
    ...spoilerStyles(theme),
    ...metaculusPreviewStyles(theme),
    ...manifoldPreviewStyles(theme),
    ...strawpollPreviewStyles(theme),
    ...metaforecastPreviewStyles(theme),
    ...owidPreviewStyles(theme),
    ...estimakerPreviewStyles(theme),
    ...youtubePreviewStyles(theme),
    ...footnoteStyles(theme),
    // Used for R:A-Z imports as well as markdown-it-footnotes
    '& .footnotes': {
      marginTop: 40,
      fontSize: '0.9em',
      paddingTop: 40,
      borderTop: isFriendlyUI ? theme.palette.border.grey300 : theme.palette.border.normal,
      '& sup': {
        marginRight: 10,
      },
      '& ol': {
        marginBlockStart: '1em',
        paddingInlineStart: 0,
        marginInlineStart: '1em'
      },
      '& li': {
        fontSize: '0.9em' // Overwriting default size setting for list items
      },
      '& blockquote': {
        fontSize: '0.9em',
        lineHeight: '1.5em',
        padding: 1,
        paddingLeft: 3,
        marginTop: -10,
      },
    },
    // Hiding the footnote-separator that markdown-it adds by default
    '& .footnotes-sep': {
      display: 'none'
    },
    '& hr': {
      ...hrStyles(theme),
    }
  }
}

export const commentBodyStyles = (theme: ThemeType, dontIncludePointerEvents?: Boolean): JssStyles => {
  // DoubleHack Fixme: this awkward phrasing is to make it so existing commentBodyStyles don't change functionality, but we're able to use commentBodyStyles without overwriting the pointer-events of child objects.

  const pointerEvents = dontIncludePointerEvents ?
    {} :
    {
      pointerEvents: 'none',
      '& *': {
        pointerEvents: 'auto',
      },
    }

  const commentBodyStyles = {
    marginTop: ".5em",
    marginBottom: ".25em",
    wordBreak: "break-word",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,

    '& blockquote': {
      ...theme.typography.commentBlockquote,
      ...theme.typography.body2,
      ...theme.typography.commentStyle
    },
    '& li': {
      ...theme.typography.body2,
      ...theme.typography.commentStyle
    },
    '& h1, & h2, & h3': {
      ...theme.typography.commentHeader,
      ...theme.typography.commentStyle
    },
    // spoiler styles
    // HACK FIXME: Playing with pointer events is a horrible idea in general, and probably also in this context
    // but it's the only way I was able to make this weird stuff work.
    ...pointerEvents,
    '& > *:hover ~ .spoiler': {
      color: theme.palette.panelBackground.spoilerBlock,
    },
    '& > *:hover ~ .spoiler:before': {
      content: '"spoiler (hover/select to reveal)"',
      color: theme.palette.text.spoilerBlockNotice,
    },
    '& hr': {
      marginTop: theme.spacing.unit*1.5,
      marginBottom: theme.spacing.unit*1.5
    },
  }
  return commentBodyStyles;
}

// FIXME: Emails currently don't use this, because the expectations around font size and
// typography are very different in an email. But some subset of these styles should
// actually be applied, eg spoiler-tag handling, even though font selection shouldn't
// be.
export const emailBodyStyles = baseBodyStyles

export const smallPostStyles = (theme: ThemeType) => {
  return {
    ...theme.typography.body2,
    fontSize: isFriendlyUI ? "1.1rem" : "1.28rem",
    lineHeight: "1.75rem",
    ...theme.typography.postStyle,
    '& blockquote': {
      ...theme.typography.body2,
      ...theme.typography.postStyle
    },
    '& ul': {
      paddingInlineStart: 30
    },
    '& li': {
      ...theme.typography.body2,
      ...theme.typography.postStyle,
      fontSize: isFriendlyUI ? "1.1rem" : "1.28rem",
      lineHeight: "1.8rem",
    }
  };
}

export const pBodyStyle = (theme: ThemeType): JssStyles => ({
  marginTop: "1em",
  marginBottom: "1em",
  '&:first-child': {
    marginTop: 0,
  },
  'style~&': {
    marginTop: 0,
  },
  '&:last-child': {
    marginBottom: 0,
  }
});

export const ckEditorStyles = (theme: ThemeType): JssStyles => {
  return {
    '& .ck': {
      '& code .public-DraftStyleDefault-block': {
        marginTop: 0,
        marginBottom: 0,  
      },
      '& blockquote': {
        fontStyle: "unset",
        ...theme.typography.blockquote,
        '& p': {
          ...pBodyStyle(theme),
        },
        '& .public-DraftStyleDefault-block': {
          marginTop: 0,
          marginBottom: 0,
        }
      },
      '--ck-spacing-standard': `${theme.spacing.unit}px`,
      '&.ck-content': {
        marginLeft: -theme.spacing.unit,
        '--ck-focus-outer-shadow-geometry': "none",
        '--ck-focus-ring': theme.palette.border.transparent,
        '--ck-focus-outer-shadow': "none",
        '--ck-inner-shadow': "none",
        '& p': {
          marginTop: "1em",
          marginBottom: "1em",
          '&:first-of-type': {
            marginTop: 0,
          }
        },
        '& .table table': {
          ...tableStyles(theme)
        },
        '& .table table td, & .table table th': {
          ...tableCellStyles(theme)
        },
        '& .table table th': {
          ...tableHeadingStyles(theme)
        },
        '& .ck-editor__editable.ck-blurred .ck-widget.ck-widget_selected, .ck-editor__editable.ck-blurred .ck-widget.ck-widget_selected': {
          outline: "none"
        },
        '& .image>figcaption': {
          ...theme.typography.caption,
          backgroundColor: "unset",
        },
        '& hr': {
          ...hrStyles(theme)
        },
        '& ol, & ul': {
          listStyleType: "revert !important",
        },
        '& ol > li > ol': {
          listStyle: 'lower-alpha !important',
        },
        '& ol > li > ol > li > ol': {
          listStyle: 'lower-roman !important',
        },
      },
      '& .ck-placeholder:before': {
        whiteSpace: 'break-spaces'
      },
      '&.ck-sidebar, &.ck-presence-list': {
        '& li': {
          // By default ckEditor elements get the styles from postBodyStyles li elements
          marginBottom: 'unset',
          fontFamily: 'unset',
          fontSize: 'unset',
          fontWeight: 'unset',
          lineHeight: 'unset'
        },
        '& .ck-comment:after': {
          display:"none"
        },
        '& .ck-annotation__info-name, & .ck-annotation__info-time, & .ck-comment__input, & .ck-thread__comment-count, & .ck-annotation__main p, & .ck-annotation__info-name, & .ck-annotation__info-time, & .ck-presence-list__counter, &.ck-presence-list': {
          ...theme.typography.body2,
          ...theme.typography.commentStyle,
    
          marginTop: 0,
          alignItems: "flex-start",
          marginBottom: 12
        },
        '&.ck-presence-list': {
          marginBottom: 32,
          '--ck-user-avatar-size': '20px',
          '& .ck-user': {
            marginTop: 0
          }
        },
        '& .ck-thread__comment-count': {
          paddingLeft: theme.spacing.unit*2,
          color: theme.palette.grey[600],
          margin: 0,
          paddingBottom: ".5em",
          '&:before': {
            content: '"\\25B6"'
          }
        },
        '& .ck-comment__input': {
          paddingLeft: theme.spacing.unit*2
        },
        '& .ck-annotation__main, & .ck-comment__input, & .ck-thread__input': {
          width : "100%"
        },
        '& .ck-comment__wrapper': {
          borderTop: theme.palette.border.slightlyFaint,
        },
        '& .ck-annotation__info-name, & .ck-annotation__info-time': {
          color: theme.palette.grey[600],
          fontSize: "1rem"
        },
        '& .ck-annotation__user, & .ck-thread__user': {
          display: "none"
        },
        '--ck-color-comment-count': theme.palette.primary.main,
      },
      
      "--ck-color-base-background": theme.palette.editor.commentPanelBackground,
      "--ck-color-annotation-wrapper-background": theme.palette.editor.commentPanelBackground,
      "--ck-color-comment-background": theme.palette.editor.sideCommentEditorBackground,
      "--ck-color-comment-marker": theme.palette.editor.commentMarker,
      "--ck-color-comment-marker-active": theme.palette.editor.commentMarkerActive,
      '--ck-color-widget-editable-focus-background': theme.palette.panelBackground.default,
    }
  }
}

export const editorStyles = (theme: ThemeType) => ({
    '& .public-DraftStyleDefault-block': {
      marginTop: '1em',
      marginBottom: '1em',  
    },
    '& code .public-DraftStyleDefault-block': {
      marginTop: 0,
      marginBottom: 0,  
    },
    '& blockquote .public-DraftStyleDefault-block': {
      marginTop: 0,
      marginBottom: 0,
    },
    // Using '*' selectors is a bit dangerous, as is using '!important'
    // This is necessary to catch spoiler-selectors on 'code' elemenents, as implemented in draft-js, 
    // which involved nested spans with manually set style attributes, which can't be overwritten except via 'important'
    //
    // This selector isn't necessary on rendered posts/comments, just the draft-js editor.
    // To minimize potential damage from */important it's only applied here.
    '& .spoiler:not(:hover) *': {
      backgroundColor: `${theme.palette.panelBackground.spoilerBlock} !important`
    },
})
