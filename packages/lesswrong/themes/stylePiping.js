import { linkStyle } from './createThemeDefaults'

export const postBodyStyles = (theme, fontSize) => {
  return {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
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
  return {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    '& pre': {
      ...theme.typography.codeblock
    },
    '& code': {
      ...theme.typography.code
    },
    '& blockquote': {
      ...theme.typography.blockquote,
      ...theme.typography.body2,
      ...theme.typography.commentStyle
    },
    '& li': {
      ...theme.typography.body2,
      ...theme.typography.li,
      ...theme.typography.commentStyle
    },
    '& h1': {
      ...theme.typography.commentHeader,
      ...theme.typography.commentStyle
    },
    '& h2': {
      ...theme.typography.commentHeader,
      ...theme.typography.commentStyle
    },
    '& h3': {
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
}

export const postHighlightStyles = theme => {
  return {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    '& pre': {
      ...theme.typography.codeblock
    },
    '& code': {
      ...theme.typography.code,
      fontSize: ".9rem",
    },
    '& blockquote': {
      ...theme.typography.blockquote,
      ...theme.typography.body2,
      ...theme.typography.postStyle,
      '& > p': {
        margin:0
      },
    },
    '& li': {
      ...theme.typography.body2,
      ...theme.typography.li,
      ...theme.typography.postStyle
    },
    '& h1': {
      ...theme.typography.commentHeader,
      ...theme.typography.postStyle
    },
    '& h2': {
      ...theme.typography.commentHeader,
      ...theme.typography.postStyle
    },
    '& h3': {
      ...theme.typography.commentHeader,
      ...theme.typography.postStyle
    },
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
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
