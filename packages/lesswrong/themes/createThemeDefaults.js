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

  const body2FontSize = {
    fontSize: '1.4rem',
    lineHeight: '2rem'
  }

  const body1FontSize = {
    fontSize: '1.1rem',
    lineHeight: '1.5rem',
  }

  const spacingUnit = 8

  const typography = theme.typography || {}

  const defaultLWTheme = {
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1400,
      },
    },
    /*spacing: {
      unit: spacingUnit
    },*/
    spacing: 8,
    typography: {
      postStyle: {
        fontFamily: typography.fontFamily,
      },
      body2: body2FontSize,
      body1: {
        fontWeight: 400,
        linkUnderlinePosition: "72%",
        ...body1FontSize
      },
      h4: {
        color: grey[800],
        fontSize: '2rem',
        marginTop: '1em'
      },
      h3: {
        color: grey[800],
        fontSize: '2.8rem',
        marginTop: '1em'
      },
      h2: {
        color: grey[800],
        marginTop: '1.2em',
        fontSize: '3rem'
      },
      h1: {
        color: grey[800],
      },
      h6: {
        fontSize: 18,
        fontWeight: 400,
        marginBottom: 3,
      },
      caption: {
        fontSize: ".9rem"
      },
      blockquote: {
        fontWeight: 400,
        paddingTop: spacingUnit*2,
        paddingRight: spacingUnit*2,
        paddingBottom: spacingUnit*2,
        paddingLeft: spacingUnit*2,
        borderLeft: `solid 3px ${grey[300]}`,
        margin: 0,
        ...body2FontSize
      },
      commentBlockquote: {
        fontWeight: 400,
        paddingTop: spacingUnit,
        paddingRight: spacingUnit*3,
        paddingBottom: spacingUnit,
        paddingLeft: spacingUnit*2,
        borderLeft: `solid 3px ${grey[300]}`,
        margin: 0,
        marginLeft: spacingUnit*1.5,
        ...body1FontSize
      },
      codeblock: {
        backgroundColor: grey[100],
        borderRadius: "5px",
        border: `solid 1px ${grey[300]}`,
        padding: '1rem',
        whiteSpace: 'pre-wrap',
        margin: "1em 0",
        '& a, & a:hover, & a:active': {
          ...linkStyle({
            theme,
            underlinePosition: (typography.codeblock && typography.codeblock.linkUnderlinePosition) || "97%",
            background: (typography.codeblock && typography.codeblock.backgroundColor) || grey[100]
          }),
        },
      },
      code: {
        fontFamily: monoStack,
        fontSize: ".9em",
        fontWeight: 400,
        backgroundColor: grey[100],
        borderRadius: 2,
        paddingTop: 3,
        paddingBottom: 3,
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
      subtitle1: {
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
    zIndexes: {
      continueReadingImage: -1,
      commentsMenu: 1,
      sequencesPageContent: 1,
      sequencesImageScrim: 1,
      postsVote: 1,
      singleLineCommentMeta: 2,
      postItemTitle: 2,
      sidebarHoverOver: 2,
      singleLineCommentHover: 3,
      questionPageWhitescreen: 3,
      textbox: 4,
      nextUnread: 999,
      sunshineSidebar: 1000,
      postItemMenu: 1001,
      layout: 1100,
      tabNavigation: 1101,
      searchResults: 1102,
      header: 1300,
      karmaChangeNotifier: 1400,
      notificationsMenu: 1500,
      searchBar: 100000,
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
