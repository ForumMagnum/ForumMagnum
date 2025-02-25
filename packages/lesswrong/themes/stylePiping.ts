import { requireCssVar } from "./cssVars";
import { isFriendlyUI } from "./forumTheme";

const hideSpoilers = (theme: ThemeType) => ({
  backgroundColor: theme.palette.panelBackground.spoilerBlock,
  color: theme.palette.panelBackground.spoilerBlock,
  '& a, & a:hover, & a:focus, & a::after, & li': {
    color: theme.palette.panelBackground.spoilerBlock
  },
  '& code': {
    backgroundColor: theme.palette.panelBackground.spoilerBlock,
  },
});

const spoilerStyles = (theme: ThemeType) => ({
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

const metaculusPreviewStyles = (theme: ThemeType) => ({
  '& div.metaculus-preview': {
    backgroundColor: theme.palette.panelBackground.metaculusBackground,
    '& iframe': {
      width: '100%',
      height: 400,
      border: 'none'
    }
  }
})

const manifoldPreviewStyles = (_theme: ThemeType) => ({
  "& div.manifold-preview": {
    "& iframe": {
      width: "100%",
      height: 400,
      border: "none",
    },
  },
});

const neuronpediaPreviewStyles = (theme: ThemeType) => ({
  "& div.neuronpedia-preview": {
    "& iframe": {
      width: "100%",
      height: 360,
      maxWidth: 639,
      border: "1px solid",
      borderColor: theme.palette.grey[300],
      borderRadius: 6,
    },
  },
});

export const calendlyPreviewStyles = (theme: ThemeType) => ({
  "& div.calendly-preview": {
    "& iframe": {
      "width": "calc(100% - 10px)",
      "height": 750,
      border: "2px solid",
      borderRadius: 10,
      borderColor: theme.palette.grey[200],
      padding: 0,
      marginRight: 5,
      marginLeft: 5
    },
  },
});

const strawpollPreviewStyles = (_theme: ThemeType) => ({
  "& div.strawpoll-embed": {
    "& iframe": {
      width: "100%",
      height: 400,
      border: "none",
    },
  },
});

const metaforecastPreviewStyles = (_theme: ThemeType) => ({
  "& div.metaforecast-preview": {
    "& iframe": {
      width: "100%",
      height: 400,
      border: "none",
    },
  },
});

const owidPreviewStyles = (_theme: ThemeType) => ({
  '& div.owid-preview': {
    '& iframe': {
      width: '100%',
      height: 400,
      border: 'none'
    }
  }
})

const estimakerPreviewStyles = (_theme: ThemeType) => ({
  '& div.estimaker-preview': {
    display: 'flex',
    '& iframe': {
      width: '100%',
      height: 400,
      border: 'none'
    }
  }
})

const viewpointsPreviewStyles = (_theme: ThemeType) => ({
  '& div.viewpoints-preview': {
    display: 'flex',
    '& iframe': {
      width: '100%',
      height: 300,
      border: 'none'
    }
  }
})

const youtubePreviewStyles = (_theme: ThemeType) => ({
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

const lwartifactsPreviewStyles = (_theme: ThemeType) => ({
  '& figure.media div[data-oembed-url*="lwartifacts.vercel.app"]': {
    '& iframe': {
      width: '100%',
      height: 525,
      border: 'none'
    }
  }
})

const tableStyles = (theme: ThemeType) => ({
  borderCollapse: "collapse",
  borderSpacing: 0,
  border: theme.palette.border.table,
  margin: "auto",
  height: "100%",
  textAlign: "left",
  width: '100%',
  ...(isFriendlyUI && {
    "& *": {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 14,
      lineHeight: "1.4em",
    },
    "& sup *": {
      fontSize: 10,
    },
    "& ul, & ol": {
      paddingLeft: "1.5em",
    },
  }),
});

const tableCellStyles = (theme: ThemeType) => ({
  minWidth: "2em",
  padding: ".4em",
  border: theme.palette.border.tableCell,
  wordBreak: "normal",
  '& p': {
    marginTop: '0.5em',
    marginBottom: '0.5em',
    ...(isFriendlyUI && {
      marginLeft: 2,
      marginRight: 2,
      lineHeight: "1.4em",
    }),
  },
  '& p:first-of-type': {
    marginTop: 0
  }
});

const tableHeadingStyles = (theme: ThemeType) => ({
  background: theme.palette.panelBackground.tableHeading,
  fontWeight: 700
});

const hrStyles = (theme: ThemeType) => ({
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
    fontSize: 13,
    letterSpacing: "12px", /* increase space between dots */
    content: '"•••"',
  }
});

const footnoteStyles = (_theme: ThemeType) => ({
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

const collapsibleSectionStyles = (theme: ThemeType) => ({
  '& .detailsBlock': {
    // This conflicts with a CkEditor style on `.ck .ck-editor__nested-editable`
    // that tries to turn border off and on to indicate selection. Use
    // !important to ensure it's visible.
    border: isFriendlyUI ? undefined : theme.palette.border.normal+' !important',
    borderRadius: 8,
    marginTop: isFriendlyUI ? 0 : 8,
    marginBottom: 8,
  },
  '& .detailsBlockTitle': {
    padding: 8,
    borderRadius: 0,

    // give background !important to take precedence over CkEditor making it
    // pure-white when the cursor is inside it, which would make the
    // title-vs-contents distinction invisible
    background: isFriendlyUI ? undefined : theme.palette.panelBackground.darken05+'!important',
    
    "&>p": {
      display: "inline-block",
    },
  },
  '& .detailsBlockTitle[open]': {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  '& summary.detailsBlockTitle': {
    cursor: "pointer",
  },
  '& .detailsBlockContent': {
    padding: isFriendlyUI ? "0 8px 8px 20px" : 8,
  },
  // Cancel out a global paragraph style that adds bottom margin to paragraphs
  // in the editor for some reason, which would create a page/editor mismatch
  // and mess up the bottom margin of detail block contents.
  "& .detailsBlockContent > p:last-child, & .detailsBlockTitle > p:last-child": {
    marginBottom: '0 !important',
  },
  
  // Placeholder text in the editor for a collapsible section with no title.
  // CkEditor represents this with a <br> placeholder as:
  //     <p><br data-cke-filler="true"/></p>
  "& .detailsBlockTitle p:has(> br[data-cke-filler=true]:only-child)::after": {
    content: '"Collapsible Section Title"',
    color: theme.palette.greyAlpha(0.3),
    pointerEvents: "none",
    position: "absolute",
    top: 8,
  },
  
  "& .detailsBlock.closed .detailsBlockContent": {
    display: "none",
  },
  
  // The 'div' part of this selector makes it specific to the editor (outside
  // the editor it would be a <summary> tag)
  '& div.detailsBlockTitle': {
    position: "relative",
    paddingLeft: isFriendlyUI ? 20 : 24,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: isFriendlyUI ? "20.8px" : undefined,
    lineHeight: isFriendlyUI ? "1.25em" : undefined,
    fontWeight: isFriendlyUI ? 600 : undefined,
  },

  // The 'div' part of this selector makes it specific to the editor (outside
  // the editor it would be a <summary> tag)
  '& div.detailsBlockTitle::before': {
    content: '"▼"',
    cursor: "pointer",
    fontSize: isFriendlyUI ? 12 : 14,
    paddingRight: 4,
    position: "absolute",
    left: isFriendlyUI ? 0 : 8,
  },
  '& .detailsBlock.closed div.detailsBlockTitle::before': {
    content: '"▶"',
  }
});

const conditionallyVisibleBlockStyles = (theme: ThemeType) => ({
  "& .conditionallyVisibleBlock": {
    border: theme.palette.border.normal,
    borderRadius: 4,
    padding: 8,
    "&.defaultHidden": {
      display: "none",
    },
  },
});

// Calling requireCssVar results in the variable being defined in the stylesheet
// (e.g. --palette-fonts-sansSerifStack). These are required for use in styles that
// are within the ckeditor bundle (in ckEditor/src/ckeditor5-cta-button/ctaform.css)
requireCssVar("palette", "fonts", "sansSerifStack")
requireCssVar("palette", "panelBackground", "default")
requireCssVar("palette", "error", "main")
requireCssVar("palette", "grey", 200)
requireCssVar("palette", "grey", 300)
requireCssVar("palette", "grey", 600)
requireCssVar("palette", "grey", 1000)

const ctaButtonStyles = (theme: ThemeType) => ({
  '& .ck-cta-button': {
    display: 'block',
    fontFamily: theme.palette.fonts.sansSerifStack,
    minWidth: 30,
    width: 'fit-content',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: '20px',
    textTransform: 'none',
    padding: '12px 16px',
    borderRadius: isFriendlyUI ? theme.borderRadius.default : theme.borderRadius.small,
    boxShadow: 'none',
    backgroundColor: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    transition: 'background-color 0.3s ease',
    '&:hover': {
      opacity: 1,
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.text.alwaysWhite, // Override default <a> style
    },
    '&:visited, &.visited': {
      color: theme.palette.text.alwaysWhite, // Override default <a> style
    },
    '&:visited:hover, &.visited:hover': {
      color: theme.palette.text.alwaysWhite, // Override default <a> style
    },
    '&:disabled': {
      backgroundColor: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite,
      opacity: .5,
    }
  },
  '& .ck-cta-button-centered': {
    margin: 'auto'
  }
});

const baseBodyStyles = (theme: ThemeType) => ({
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
    position: 'relative',
    lineHeight: 0,
  },
  '& sub': {
    fontSize: '70%',
    verticalAlign: 'baseline', // We use vertical align baseline to prevent sub-aligned text from changing the line-height, which looks ugly
    position: 'relative',
    top: '0.2em',
    paddingRight: '0.07em'
  },
  '& a, & a:hover, & a:active': {
    color: theme.palette.link.color ?? theme.palette.primary.main,
    '& u': {
      textDecoration: "none"
    }
  },
  '& a:visited, & a.visited': {
    color: theme.palette.link.visited
  },
  '& a:visited:hover, & a.visited:hover, & a:visited:active, & a.visited:active': isFriendlyUI ? {
    color: theme.palette.link.visitedHover,
  } : {},
  '& table': {
    ...tableStyles(theme)
  },
  // CKEditor wraps tables in a figure element
  '& figure.table': {
    width: 'fit-content',
    height: 'fit-content',
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
  "& u": {
    textDecoration: "none",
  },
})

export const postBodyStyles = (theme: ThemeType) => {
  return {
    ...baseBodyStyles(theme),
    ...spoilerStyles(theme),
    ...metaculusPreviewStyles(theme),
    ...manifoldPreviewStyles(theme),
    ...neuronpediaPreviewStyles(theme),
    ...calendlyPreviewStyles(theme),
    ...strawpollPreviewStyles(theme),
    ...metaforecastPreviewStyles(theme),
    ...owidPreviewStyles(theme),
    ...estimakerPreviewStyles(theme),
    ...viewpointsPreviewStyles(theme),
    ...youtubePreviewStyles(theme),
    ...lwartifactsPreviewStyles(theme),
    ...footnoteStyles(theme),
    ...collapsibleSectionStyles(theme),
    ...conditionallyVisibleBlockStyles(theme),
    ...ctaButtonStyles(theme),
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

export const commentBodyStyles = (theme: ThemeType, dontIncludePointerEvents?: Boolean) => {
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

    '& .footnotes': isFriendlyUI ? {} : {
      marginTop: 0,
      paddingTop: 8,
      paddingLeft: 16,
      marginBottom: 0
    },

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
    fontSize: isFriendlyUI ? 14.3 : 16.64,
    lineHeight: "22.75px",
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
      fontSize: isFriendlyUI ? 14.3 : 16.64,
      lineHeight: "23.4px",
    }
  };
}

export const pBodyStyle = (_theme: ThemeType) => ({
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

export const ckEditorStyles = (theme: ThemeType) => {
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
          fontSize: 13
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
