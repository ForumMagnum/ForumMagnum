import { createMuiTheme } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import deepmerge from 'deepmerge';
import isPlainObject from 'is-plain-object';

const monoStack = [
  '"Liberation Mono"',
  'Menlo',
  'Courier',
  'monospace'
].join(',')

export const linkStyle = ({theme, underlinePosition="97%", background}) => {
  return ({
    color: theme.palette.secondary.main,
    backgroundImage: `linear-gradient(to right, ${theme.palette.secondary.main} 72%, transparent 72%)`,
    backgroundSize: "4px 1px",
    backgroundRepeat: "repeat-x",
    backgroundPosition:  `0% ${underlinePosition}`,
    textShadow: `
      .03em 0 ${background || theme.palette.background.default},
      -.03em 0 ${background || theme.palette.background.default},
      0 .03em ${background || theme.palette.background.default},
      0 -.03em ${background || theme.palette.background.default},
      .06em 0 ${background || theme.palette.background.default},
      -.06em 0 ${background || theme.palette.background.default},
      .09em 0 ${background || theme.palette.background.default},
      -.09em 0 ${background || theme.palette.background.default},
      .12em 0 ${background || theme.palette.background.default},
      -.12em 0 ${background || theme.palette.background.default},
      .15em 0 ${background || theme.palette.background.default},
      -.15em 0 ${background || theme.palette.background.default}
    `,
    textDecoration: "none",

    "*, *:after, &:after, *:before, &:before": {
        textShadow: "none"
    },
  })
}

const createLWTheme = (theme) => {
  // Defines sensible typography defaults that can be
  // cleanly overriden

  const body1FontSize = {
    fontSize: '1.4rem',
    lineHeight: '2rem'
  }

  const typography = theme.typography || {}

  const defaultLWTheme = {
    typography: {
      postStyle: {
        fontFamily: typography.fontFamily,
      },
      body1: body1FontSize,
      body2: {
        fontSize: '1.1rem',
        lineHeight: '1.5rem',
        fontWeight: 400,
        linkUnderlinePosition: "72%",
      },
      display1: {
        color: grey[800],
        fontSize: '2rem',
        marginTop: '1em'
      },
      display2: {
        color: grey[800],
        fontSize: '2rem',
        marginTop: '1em'
      },
      display3: {
        color: grey[800],
        marginTop: '1.2em'
      },
      display4: {
        color: grey[800],
      },
      title: {
        fontSize: 18,
        fontWeight: 400,
        marginBottom: 3,
      },
      blockquote: {
        fontWeight: 400,
        padding: ".75em 2em",
        borderLeft: `solid 3px ${grey[300]}`,
        margin: 0,
        ...body1FontSize
      },
      codeblock: {
        backgroundColor: grey[100],
        borderRadius: "5px",
        border: `solid 1px ${grey[300]}`,
        padding: '1rem',
        whiteSpace: 'pre-wrap',
        margin: "1em 0",
        '& a, & a:visited, & a:hover, & a:focus, & a:active': {
          ...linkStyle({
            theme,
            underlinePosition: (typography.codeblock && typography.codeblock.linkUnderlinePosition) || "97%",
            background: (typography.codeblock && typography.codeblock.backgroundColor) || grey[100]
          }),
        },
      },
      code: {
        fontFamily: monoStack,
        fontSize: ".85em",
        fontWeight: 400,
        backgroundColor: grey[100],
        borderRadius: 2,
        padding: 3,
        lineHeight: 1.42
      },
      li: {
        marginBottom: '.5rem',
      },
      commentHeader: {
        fontSize: '1.5rem',
        marginTop: '.5em',
        fontWeight:500,
      },
      subheading: {
        fontSize:15,
        color: grey[600]
      },
      subtitle: {
        fontSize: 16,
        fontWeight: 600,
        marginBottom: ".5rem"
      },
      uiLink: {
        color: grey[500],
        '&:hover': {
          color:grey[300]
        }
      }
    },
    voting: {
      strongVoteDelay: 1000,
    }
  }

  const mergedTheme = deepmerge(defaultLWTheme, theme, {isMergeableObject:isPlainObject})

  const newTheme = createMuiTheme(mergedTheme)

  return newTheme
}

export default createLWTheme
