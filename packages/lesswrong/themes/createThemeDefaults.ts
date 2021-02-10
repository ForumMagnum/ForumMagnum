import { createMuiTheme } from '@material-ui/core/styles';
import { getForumType, ThemeOptions } from './themeNames';
import grey from '@material-ui/core/colors/grey';
import deepmerge from 'deepmerge';
import isPlainObject from 'is-plain-object';

const monoStack = [
  '"Liberation Mono"',
  'Menlo',
  'Courier',
  'monospace'
].join(',')

// Will be used for the distance between the post title divider and the text on
// mobile
// Matches distance from the bottom of the secondaryInfo to the divider
// = 16 (see header and divider) + the ~4 pixel distance from the bottom
// of the secondaryInfo text to the bottom of the associated div
const titleDividerSpacing = 20

export const zIndexes = {
  frontpageBooks: 0,
  commentsMenu: 1,
  sequencesPageContent: 1,
  sequencesImageScrim: 1,
  postsVote: 1,
  postItemAuthor: 1,
  singleLineCommentMeta: 2,
  postItemTitle: 2,
  sidebarHoverOver: 2,
  reviewVotingMenu: 3,
  singleLineCommentHover: 3,
  questionPageWhitescreen: 3,
  footerNav: 3,
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
  gatherTownIframe: 9999, // 1000001 higher than everything except intercom
  tagCTAPopup: 9999,
  lwPopper: 10000,
  lwPopperTooltip: 10001,
  loginDialog: 10002,
  searchBar: 100000,
  commentBoxPopup: 10000000001, // has to be higher than Intercom,
  // ckEditorToolbar: 10000000002, // has to be higher than commentBoxPopup, (note: the css had to be applied in an scss file, "_editor.scss", but the position is listed here for ease of reference)
  petrovDayButton: 6,
  petrovDayLoss: 1000000
}

const createLWTheme = (themeOptions: ThemeOptions, theme: ThemeType) => {
  theme = {
    ...theme,
    themeName: themeOptions.name,
    forumType: getForumType(themeOptions)
  };
  
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

  const smallFontSize = {
    fontSize: "1rem",
    lineHeight: '1.4rem'
  }

  const tinyFontSize = {
    fontSize: ".75rem",
    lineHeight: '1.4rem'
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
      unit: spacingUnit,
      titleDividerSpacing,
    },
    typography: {
      postStyle: {
        fontFamily: typography.fontFamily,
      },
      contentNotice: {
        fontStyle: "italic",
        color: grey[600],
        fontSize:".9em",
        // This should be at least as big as the margin-bottom of <p> tags (18.1
        // on LW), and the distance on mobile between the divider and the top of
        // the notice is as good as any
        marginBottom: titleDividerSpacing,
        wordBreak: "break-word"
      },
      body1: body1FontSize,
      body2: {
        fontWeight: 400,
        ...body2FontSize
      },
      smallText: {
        ...typography.body2,
        fontWeight: 400,
        ...smallFontSize
      },
      tinyText: {
        ...typography.body2,
        fontWeight: 400,
        ...tinyFontSize
      },
      // used by h3
      display0: {
        color: grey[700],
        fontSize: '1.6rem',
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
      // Used for ui text that's (on LW) serifed rather than the primary
      // sans-serif ui font. On the EA Forum this is overridden with sans-serif
      uiSecondary: {
        fontFamily: typography.fontFamily,
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
        fontSize: ".7em",
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
    palette: {
      commentBorderGrey: "rgba(72,94,144,0.16)",
    },
    boxShadow: "0 1px 5px rgba(0,0,0,.025)",
    itemBorderBottom: "solid 2px rgba(0,0,0,.05)",
    zIndexes: {
      ...zIndexes
    },
    voting: {
      strongVoteDelay: 1000,
    },
    overrides: {
      MuiSelect: {
        selectMenu: {
          paddingLeft: spacingUnit
        }
      },
      MuiFormControlLabel: {
        label: {
          ...typography.body2
        }
      },
      MuiTableCell: {
        body: {
          ...body2FontSize,
          ...typography.fontFamily,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: 12,
          marginTop: 0,
          marginBottom: 0,
          wordBreak: "normal",
        }
      }
    }
  }

  const mergedTheme = deepmerge(defaultLWTheme, theme, {isMergeableObject:isPlainObject})

  const newTheme = createMuiTheme(mergedTheme)

  return newTheme
}

export default createLWTheme
