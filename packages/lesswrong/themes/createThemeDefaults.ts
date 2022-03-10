import { createMuiTheme } from '@material-ui/core/styles';
import { getForumType, ThemeOptions } from './themeNames';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';
import deepmerge from 'deepmerge';
import isPlainObject from 'is-plain-object';
import type { PartialDeep } from 'type-fest'

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
  frontpageSplashImage: 0,
  sequenceBanner: 0,
  singleColumnSection: 1,
  commentsMenu: 2,
  sequencesPageContent: 2,
  sequencesImageScrim: 2,
  editSequenceTitleInput: 3,
  postsVote: 2,
  postItemAuthor: 2,
  singleLineCommentMeta: 3,
  postItemTitle: 3,
  sidebarHoverOver: 3,
  sidebarActionMenu: 3,
  commentPermalinkIcon: 3,
  reviewVotingMenu: 4,
  singleLineCommentHover: 4,
  questionPageWhitescreen: 4,
  footerNav: 4,
  textbox: 5,
  styledMapPopup: 6,
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
  afNonMemberPopup: 9999,
  lwPopper: 10000,
  lwPopperTooltip: 10001,
  loginDialog: 10002,
  searchBar: 100000,
  commentBoxPopup: 10000000001, // has to be higher than Intercom,
  // ckEditorToolbar: 10000000002, // has to be higher than commentBoxPopup, (note: the css had to be applied in an scss file, "_editor.scss", but the position is listed here for ease of reference)
  petrovDayButton: 6,
  petrovDayLoss: 1000000
}

// Create a theme and merge it with the default theme.
const createTheme = (themeOptions: ThemeOptions, theme: PartialDeep<ThemeType>) => {
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

  // TODO: Make this ThemeType rather than PartialDeep<ThemeType> so that every
  // theme is guaranteed to be complete
  const defaultTheme: PartialDeep<ThemeType> = {
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
    },
    palette: {
      text: {
        normal: "rgba(0,0,0,.87)",
        maxIntensity: "rgba(0,0,0,1)",
        slightlyIntense: "rgba(0,0,0,.92)",
        slightlyIntense2: "rgba(0,0,0,.9)",
        slightlyDim: "rgba(0,0,0,.8)",
        slightlyDim2: "rgba(0,0,0,.7)",
        dim: "rgba(0,0,0,.5)",
        dim2: grey[800],
        dim3: grey[600],
        dim4: grey[500],
        dim700: grey[700],
        dim40: "rgba(0,0,0,.4)",
        dim45: "rgba(0,0,0,.45)",
        dim55: "rgba(0,0,0,.55)",
        dim60: "rgba(0,0,0,.6)",
        grey: "grey",
        spoilerBlockNotice: "white",
        notificationCount: 'rgba(0,0,0,0.6)',
        notificationLabel: "rgba(0,0,0,.66)",
        eventType: "#c0a688",
        tooltipText: "white",
        negativeKarmaRed: red['A100'],
        moderationGuidelinesEasygoing: 'rgba(100, 169, 105, 0.9)',
        moderationGuidelinesNormEnforcing: '#2B6A99',
        moderationGuidelinesReignOfTerror: 'rgba(179,90,49,.8)',
        charsAdded: "#008800",
        charsRemoved: "#880000",
        invertedBackgroundText: "white",
        error: "#9b5e5e",
        error2: "#E04E4B",
        sequenceIsDraft: "rgba(100, 169, 105, 0.9)",
        sequenceTitlePlaceholder: "rgba(255,255,255,.5)",
      },
      link: {
        unmarked: "rgba(0,0,0,.87)",
        dim: "rgba(0,0,0,.5)",
        dim2: grey[600],
        dim3: "rgba(0,0,0,.4)",
        grey800: grey[800],
        tocLink: grey[600],
        tocLinkHighlighted: "black",
      },
      linkHover: {
        dim: "rgba(0,0,0,.3)",
      },
      icon: {
        normal: "rgba(0,0,0,.87)",
        maxIntensity: "rgba(0,0,0,1)",
        slightlyDim: "rgba(0,0,0,.8)",
        slightlyDim2: "rgba(0,0,0,.75)",
        slightlyDim3: "rgba(0,0,0,.7)",
        slightlyDim4: "rgba(0,0,0,.6)",
        dim: "rgba(0,0,0,.5)",
        dim2: "rgba(0,0,0,.4)",
        dim3: grey[400],
        dim4: grey[500],
        dim5: "rgba(0,0,0,.3)",
        dim6: "rgba(0,0,0,.2)",
        dim55: "rgba(0,0,0,.55)",
        dim600: grey[600],
        dim700: grey[700],
        tooltipUserMetric: "rgba(255,255,255,.8)",
        loadingDots: "rgba(0,0,0,.55)",
        loadingDotsAlternate: "white",
        horizRuleDots: "rgba(0,0,0,.26)",
        greenCheckmark: "#4caf50",
        onTooltip: "white",
        topAuthor: "#d0d0d0",
        
        commentsBubble: {
          commentCount: "white",
          noUnread: "rgba(0,0,0,.22)",
          newPromoted: "rgb(160, 225, 165)",
        },
      },
      border: {
        normal: "solid 1px rgba(0,0,0,0.2)",
        itemSeparatorBottom: "solid 2px rgba(0,0,0,.05)",
        slightlyFaint: "solid 1px rgba(0,0,0,.15)",
        slightlyIntense: "solid 1px rgba(0,0,0,.25)",
        slightlyIntense2: "solid 1px rgba(0,0,0,.3)",
        slightlyIntense3: "solid 1px rgba(0,0,0,.4)",
        intense: "solid 2px rgba(0,0,0,.5)",
        faint: "1px solid rgba(0,0,0,0.1)",
        extraFaint: "1px solid rgba(0,0,0,0.08)",
        grey300: `1px solid ${grey[300]}`,
        grey400: `1px solid ${grey[400]}`,
        maxIntensity: "1px solid black",
        tableHeadingDivider: '2px solid black',
        table: "1px double #b3b3b3",
        tableCell: "1px double #d9d9d9",
        transparent: "solid 1px rgba(0,0,0,0)",
        emailHR: "1px solid #aaa",
        sunshineNewUsersInfoHR: "1px solid #ccc",
        appBarSubtitleDivider: `1px solid ${grey[400]}`,
        commentBorder: "1px solid rgba(72,94,144,0.16)",
        answerBorder: "2px solid rgba(72,94,144,0.16)",
        tooltipHR: "solid 1px rgba(255,255,255,.2)",
      },
      background: {
        pageActiveAreaBackground: "white",
        diffInserted: "#d4ead4",
        diffDeleted: "#f0d3d3",
        usersListItem: "rgba(0,0,0,.05)",
      },
      panelBackground: {
        default: "white",
        translucent: "rgba(255,255,255,.87)",
        translucent2: "rgba(255,255,255,.8)",
        hoverHighlightGrey: "rgba(0,0,0,.1)",
        postsItemHover: "#fafafa",
        formErrors: "rgba(0,0,0,0.25)",
        darken03: "rgba(0,0,0,.03)",
        darken05: "rgba(0,0,0,.05)",
        darken25: "rgba(0,0,0,.25)",
        darken40: "rgba(0,0,0,.4)",
        
        adminHomeRecentLogins: "rgba(50,100,50,.1)",
        adminHomeAllUsers: "rgba(100,50,50,.1)",
        deletedComment: "#ffefef",
        newCommentFormModerationGuidelines: "rgba(0,0,0,.07)",
        commentNodeEven: "rgb(242,242,242)",
        commentNodeOdd: "rgb(252,252,252)",
        commentModeratorHat: "#5f9b651c",
        commentHighlightAnimation: grey[300],
        postsItemExpandedComments: "#fafafa",
        metaculusBackground: "#2c3947",
        spoilerBlock: "black",
        revealedSpoilerBlock: "rgba(0,0,0,.12)",
        tableHeading: "#fafafa",
        notificationMenuTabBar: grey[100],
        recentDiscussionThread: "rgba(253,253,253)",
        tooltipBackground: "rgba(75,75,75,.94)",
        tenPercent: "rgba(0,0,0,.1)",
        sunshineReportedContent: "rgba(60,0,0,.08)",
        sunshineFlaggedUser: "rgba(150,0,0,.05)",
        sunshineNewPosts: "rgba(0,80,0,.08)",
        sunshineNewComments: "rgba(120,120,0,.08)",
        sunshineNewTags: "rgba(80,80,0,.08)",
        sunshineWarningHighlight: "rgba(255,50,0,.2)",
        mobileNavFooter: "#ffffff",
        singleLineComment: "#f0f0f0",
        singleLineCommentHovered: "#e0e0e0",
        singleLineCommentOddHovered: "#f3f3f3",
        sequenceImageGradient: 'linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 42%, rgba(255, 255, 255, 0) 100%)'
      },
      boxShadow: {
        default: "0 1px 5px rgba(0,0,0,.025)",
        moreFocused: "0 1px 3px rgba(0, 0, 0, 0.1)",
        faint: "0 1px 5px rgb(0 0 0 / 10%)",
        
        notificationsDrawer: "rgba(0, 0, 0, 0.16) 0px 3px 10px, rgba(0, 0, 0, 0.23) 0px 3px 10px",
        appBar: "0 1px 1px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.05)",
        sequencesGridItemHover: "0 1px 3px rgba(0, 0, 0, 0.1)",
        eventCard: "0 1px 3px rgba(0, 0, 0, 0.1)",
        mozillaHubPreview: "0px 0px 10px rgba(0,0,0,.1)",
        featuredResourcesCard: '0 4px 4px rgba(0, 0, 0, 0.07)',
        spreadsheetPage1: "2px 0 2px -1px rgba(0,0,0,.15)",
        spreadsheetPage2: "0 0 3px rgba(0,0,0,.3)",
        collectionsCardHover: "0 0 3px rgba(0,0,0,.1)",
        parentComment: "0 0 10px rgba(0,0,0,.2)",
        sunshineSidebarHoverInfo: "-3px 0 5px 0px rgba(0,0,0,.1)",
        sunshineSendMessage: "0 0 10px rgba(0,0,0,0.5)"
      },
      buttons: {
        hoverGrayHighlight: "rgba(0,0,0,0.05)",
        
        startReadingButtonBackground: "rgba(0,0,0, 0.05)",
        recentDiscussionSubscribeButtonText: "white",
        featuredResourceCTAtext: "white",
        primaryDarkText: "white",
        feedExpandButton: {
          background: "white",
          plusSign: "#666",
          border: "1px solid #ddd",
        },
        notificationsBellOpen: {
          background: "rgba(0,0,0,0.4)",
          icon: "white",
        },
      },
      tag: {
        background: grey[200],
        border: `solid 1px ${grey[200]}`,
        coreTagBorder: "solid 1px rgba(0,0,0,.12)",
        text: "rgba(0,0,0,.9)",
        boxShadow: "1px 2px 5px rgba(0,0,0,.2)",
        hollowTagBackground: "white",
        addTagButtonBackground: grey[300],
      },
      geosuggest: {
        dropdownBackground: "#fff",
        dropdownActiveBackground: "#267dc0",
        dropdownActiveText: "#fff",
        dropdownHoveredBackground: "#f5f5f5",
        dropdownActiveHoveredBackground: "#ccc",
      },
      
      commentParentScrollerHover: "rgba(0,0,0,.075)",
      headerTextColor: "rgba(0,0,0,0.87)",
      tocScrollbarColors: `rgba(255,255,255,0) ${grey[300]}`,
    },
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

  const mergedTheme = deepmerge(
    defaultTheme,
    {
      ...theme,
      themeName: themeOptions.name,
      forumType: getForumType(themeOptions)
    },
    {isMergeableObject:isPlainObject}
  )
  return createMuiTheme(mergedTheme)
}

export default createTheme
