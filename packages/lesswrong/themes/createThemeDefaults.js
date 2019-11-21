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

const createLWTheme = (theme) => {
  // Defines sensible typography defaults that can be
  // cleanly overriden

  const body1FontSize = {
    fontSize: '1.4rem',
    lineHeight: '2rem'
  }

  const body2FontSize = {
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
    spacing: {
      unit: spacingUnit
    },
    typography: {
      postStyle: {
        fontFamily: typography.fontFamily,
      },
      body1: body1FontSize,
      body2: {
        fontWeight: 400,
        ...body2FontSize
      },
      // used by h3
      display0: {
        color: grey[800],
        fontSize: '2rem',
        marginTop: '1em',
        // added by MUI to display1, which we're imitating
        fontWeight: 400,
        lineHeight: "1.20588em",
      },
      display1: {
        color: grey[800],
        fontSize: '2rem',
        marginTop: '1em'
      },
      display2: {
        color: grey[800],
        fontSize: '2.8rem',
        marginTop: '1em'
      },
      display3: {
        color: grey[800],
        marginTop: '1.2em',
        fontSize: '3rem'
      },
      display4: {
        color: grey[800],
      },
      title: {
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
        ...body1FontSize
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
        ...body2FontSize
      },
      codeblock: {
        backgroundColor: grey[100],
        borderRadius: "5px",
        border: `solid 1px ${grey[300]}`,
        padding: '1rem',
        whiteSpace: 'pre-wrap',
        margin: "1em 0",
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
      styledMapPopup: 5,
      nextUnread: 999,
      sunshineSidebar: 1000,
      postItemMenu: 1001,
      layout: 1100,
      tabNavigation: 1101,
      searchResults: 1102,
      header: 1300,
      karmaChangeNotifier: 1400,
      notificationsMenu: 1500,
      lwPopper: 10000,
      lwPopperTooltip: 10001,
      loginDialog: 10002,
      searchBar: 100000,
      // petrovDayButton: 6,
      // petrovDayLoss: 1000000
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
