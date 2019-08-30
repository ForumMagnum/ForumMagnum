import { linkStyle } from './createThemeDefaults'
import deepmerge from 'deepmerge';
import isPlainObject from 'is-plain-object';

const spoilerStyles = theme => ({
  '& p.spoiler': {
    margin: 0,
  },
  '& .spoiler': {
    backgroundColor: 'black',
    padding: 8,
    color: 'black',
    pointerEvents: 'auto',
    minHeight: theme.typography.commentStyle.fontSize,
    '& .public-DraftStyleDefault-block': {
      margin: 0,
    },
  },
  '& .spoiler:before': {
    content: '"spoiler (hover/select to reveal)"',
    color: 'white',
    position: 'absolute',
    left: 20
  },
  '& .spoiler:after': {
    content: '"\\00a0"',
  },
  '&:hover .spoiler': {
    color: 'white',
  },
  '&:hover .spoiler:before': {
    color: 'black',
    content: '""'
  },
})

export const postBodyStyles = (theme, fontSize) => {
  return {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    wordBreak: "break-word",
    ...spoilerStyles(theme),
    '& pre': {
      ...theme.typography.codeblock
    },
    '& code': {
      ...theme.typography.code
    },
    '& blockquote': {
      ...theme.typography.blockquote,
      ...theme.typography.body2,
      ...theme.typography.postStyle
    },
    '& li': {
      ...theme.typography.body2,
      ...theme.typography.li,
      ...theme.typography.postStyle
    },
    '& h1': {
      ...theme.typography.h3,
      ...theme.typography.postStyle
    },
    '& h2': {
      ...theme.typography.h4,
      ...theme.typography.postStyle,
    },
    '& h3': {
      ...theme.typography.h4,
      ...theme.typography.postStyle,
    },
    '& h4': {
      ...theme.typography.body2,
      ...theme.typography.postStyle,
      fontWeight:600,
    },
    '& img': {
      maxWidth: "100%"
    },
    '& sup': {
      verticalAlign: 'baseline',
      top: '-0.6em',
      fontSize: '65%',
      position: 'relative'
    },
    // Used for R:A-Z imports as well as markdown-it-footnotes
    '& .footnotes': {
      marginTop: 40,
      fontSize: '0.9em',
      paddingTop: 40,
      borderTop: 'solid 1px rgba(0,0,0,0.2)',
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
    },
    // Hiding the footnote-separator that markdown-it adds by default
    '& .footnotes-sep': {
      display: 'none'
    },
    '& a, & a:hover, & a:active': {
      ...linkStyle({
        theme: theme,
        underlinePosition: (
          (theme.typography.postStyle && theme.typography.postStyle.linkUnderlinePosition) ||
          "97%"
        ),
        background: (
          (theme.typography.body2 && theme.typography.body2.backgroundColor) ||
          (theme.typography.body2 && theme.typography.body2.background) ||
          "#fff"
        )
      })
    },
  }
}

export const commentBodyStyles = theme => {
  const commentBodyStyles = {
    marginTop: ".5em",
    marginBottom: ".25em",
    wordBreak: "break-word",
    ...theme.typography.body1,
    ...theme.typography.commentStyle,
    ...spoilerStyles(theme),
    '& blockquote': {
      ...theme.typography.commentBlockquote,
      ...theme.typography.body1,
      ...theme.typography.commentStyle
    },
    '& li': {
      ...theme.typography.body1,
      ...theme.typography.commentStyle
    },
    '& h1, & h2, & h3': {
      ...theme.typography.commentHeader,
      ...theme.typography.commentStyle
    },
    // spoiler styles
    // HACK FIXME: Playing with pointer events is a horrible idea in general, and probably also in this context
    // but it's the only way I was able to make this weird stuff work.
    pointerEvents: 'none',
    '& *': {
      pointerEvents: 'auto'
    },
    '& > *:hover ~ .spoiler': {
      color: 'black'
    },
    '& > *:hover ~ .spoiler:before': {
      content: '"spoiler (hover/select to reveal)"',
      color: 'white',
    },
    '& a, & a:hover, & a:active': {
      backgroundImage: "none",
      textShadow: "none",
      textDecoration: "none",
    },
    '& pre code a, & pre code a:hover, & pre code a:active': {
      backgroundImage: "none",
      textShadow: "none",
      textDecoration: "none",
    }
  }
  return deepmerge(postBodyStyles(theme), commentBodyStyles, {isMergeableObject:isPlainObject})
}

export const postHighlightStyles = theme => {
  const postHighlightStyles = {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    fontSize: "1.25rem",
    lineHeight: "1.8rem",
    '& blockquote': {
      ...theme.typography.body1,
      ...theme.typography.postStyle,
      '& > p': {
        margin:0
      },
    },
    '& li': {
      ...theme.typography.body1,
      ...theme.typography.postStyle,
    },
    '& h1, & h2, & h3': {
      ...theme.typography.commentHeader,
    },
  }
  return deepmerge(postBodyStyles(theme), postHighlightStyles, {isMergeableObject:isPlainObject})
}

export const editorStyles = (theme, styleFunction) => ({
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
    ...styleFunction(theme)
})
