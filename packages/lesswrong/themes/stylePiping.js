import { linkStyle } from './createThemeDefaults'
import deepmerge from 'deepmerge';
import isPlainObject from 'is-plain-object';

export const postBodyStyles = (theme, fontSize) => {
  return {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    '& p': {
      '&:first-of-type': {
        marginTop: 0,
      },
      '&:last-of-type': {
        marginBottom: 0,
      }
    },
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
      ...theme.typography.display3,
      ...theme.typography.postStyle,
      ...theme.typography.headerStyle
    },
    '& h2': {
      ...theme.typography.display2,
      ...theme.typography.postStyle,
      ...theme.typography.headerStyle
    },
    '& h3': {
      ...theme.typography.display2,
      ...theme.typography.postStyle,
      ...theme.typography.headerStyle
    },
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      ...linkStyle({
        theme: theme,
        underlinePosition: (
          (theme.typography.postStyle && theme.typography.postStyle.linkUnderlinePosition) ||
          "97%"
        ),
        background: (
          (theme.typography.body1 && theme.typography.body1.backgroundColor) ||
          (theme.typography.body1 && theme.typography.body1.background) ||
          "#fff"
        )
      })
    },
  }
}

export const commentBodyStyles = theme => {
  const commentBodyStyles = {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    '& blockquote': {
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
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      ...linkStyle({
        theme: theme,
        underlinePosition: (
          (theme.typography.commentStyle && theme.typography.commentStyle.linkUnderlinePosition) ||
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
  return deepmerge(postBodyStyles(theme), commentBodyStyles, {isMergeableObject:isPlainObject})
}

export const postHighlightStyles = theme => {
  const postHighlightStyles = {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    '& blockquote': {
      ...theme.typography.body2,
      ...theme.typography.postStyle,
      '& > p': {
        margin:0
      },
    },
    '& li': {
      ...theme.typography.body2,
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
