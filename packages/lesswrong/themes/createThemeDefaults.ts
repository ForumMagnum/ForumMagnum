import type { PartialDeep } from 'type-fest'
import { defaultShadePalette, defaultComponentPalette } from './defaultPalette';

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
  modTopBar: 1, 
  spotlightItem: 1,
  editorPresenceList: 1,
  spotlightItemCloseButton: 2,
  commentsMenu: 2,
  sequencesPageContent: 2,
  sequencesImageScrim: 2,
  linkCard: 2,
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
  intercomButton: 1030,
  sideCommentBox: 1040,
  postItemMenu: 1050,
  searchResults: 1100,
  tabNavigation: 1101,
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

export const baseTheme: BaseThemeSpecification = {
  shadePalette: defaultShadePalette(),
  componentPalette: (shadePalette: ThemeShadePalette) => defaultComponentPalette(shadePalette),
  make: (palette: ThemePalette): PartialDeep<ThemeType> => {
    const spacingUnit = 8
  
    return {
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
        mainLayoutPaddingTop: 50
      },
      borderRadius: {
        default: 0,
        small: 3,
      },
      typography: {
        cloudinaryFont: {
          stack: "'Merriweather', serif",
          url: "https://fonts.googleapis.com/css?family=Merriweather",
        },
        postStyle: {
          fontFamily: palette.fonts.sansSerifStack,
        },
        contentNotice: {
          fontStyle: "italic",
          color: palette.grey[600],
          fontSize:".9em",
          // This should be at least as big as the margin-bottom of <p> tags (18.1
          // on LW), and the distance on mobile between the divider and the top of
          // the notice is as good as any
          marginBottom: titleDividerSpacing,
          wordBreak: "break-word"
        },
        body1: {
          fontSize: '1.4rem',
          lineHeight: '2rem'
        },
        body2: {
          fontWeight: 400,
          fontSize: '1.1rem',
          lineHeight: '1.5rem',
        },
        postsItemTitle: {
          fontSize: "1.3rem"
        },
        chapterTitle: {
          fontSize: "1.2em",
          textTransform: "uppercase",
          color: palette.grey[600]
        },
        largeChapterTitle: {
          fontSize: '1.4rem',
          margin: "1.5em 0 .5em 0",
          color: palette.grey[800]
        },
        smallText: {
          fontFamily: palette.fonts.sansSerifStack,
          fontWeight: 400,
          fontSize: "1rem",
          lineHeight: '1.4rem'
        },
        tinyText: {
          fontWeight: 400,
          fontSize: ".75rem",
          lineHeight: '1.4rem'
        },
        // used by h3
        display0: {
          color: palette.grey[700],
          fontSize: '1.6rem',
          marginTop: '1em',
          // added by MUI to display1, which we're imitating
          fontWeight: 400,
          lineHeight: "1.20588em",
        },
        display1: {
          color: palette.grey[800],
          fontSize: '2rem',
          marginTop: '1em'
        },
        display2: {
          color: palette.grey[800],
          fontSize: '2.8rem',
          marginTop: '1em'
        },
        display3: {
          color: palette.grey[800],
          marginTop: '1.2em',
          fontSize: '3rem'
        },
        display4: {
          color: palette.grey[800],
        },
        title: {
          fontSize: 18,
          fontWeight: 400,
          marginBottom: 3,
        },
        // Used for ui text that's (on LW) serifed rather than the primary
        // sans-serif ui font. On the EA Forum this is overridden with sans-serif
        uiSecondary: {
          fontFamily: palette.fonts.sansSerifStack,
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
          borderLeft: `solid 3px ${palette.grey[300]}`,
          margin: 0,
        },
        commentBlockquote: {
          fontWeight: 400,
          paddingTop: spacingUnit,
          paddingRight: spacingUnit*3,
          paddingBottom: spacingUnit,
          paddingLeft: spacingUnit*2,
          borderLeft: `solid 3px ${palette.grey[300]}`,
          margin: 0,
          marginLeft: spacingUnit*1.5,
        },
        codeblock: {
          backgroundColor: palette.grey[100],
          borderRadius: "5px",
          border: `solid 1px ${palette.grey[300]}`,
          padding: '1rem',
          whiteSpace: 'pre-wrap',
          margin: "1em 0",
        },
        code: {
          fontFamily: monoStack,
          fontSize: ".7em",
          fontWeight: 400,
          backgroundColor: palette.grey[100],
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
          color: palette.grey[600]
        },
        subtitle: {
          fontSize: 16,
          fontWeight: 600,
          marginBottom: ".5rem"
        },
        italic: {
          fontStyle: "italic",
        },
        smallCaps: {
          fontVariant: "small-caps",
        },
      },
      zIndexes: {
        ...zIndexes
      },
      postImageStyles: {},
      voting: {
        strongVoteDelay: 1000,
      },
      shadows: [
        // All from material-UI
        "none",
        `0px 1px 3px 0px ${palette.boxShadowColor(0.2)},0px 1px 1px 0px ${palette.boxShadowColor(0.14)},0px 2px 1px -1px ${palette.boxShadowColor(0.12)}`,
        `0px 1px 5px 0px ${palette.boxShadowColor(0.2)},0px 2px 2px 0px ${palette.boxShadowColor(0.14)},0px 3px 1px -2px ${palette.boxShadowColor(0.12)}`,
        `0px 1px 8px 0px ${palette.boxShadowColor(0.2)},0px 3px 4px 0px ${palette.boxShadowColor(0.14)},0px 3px 3px -2px ${palette.boxShadowColor(0.12)}`,
        `0px 2px 4px -1px ${palette.boxShadowColor(0.2)},0px 4px 5px 0px ${palette.boxShadowColor(0.14)},0px 1px 10px 0px ${palette.boxShadowColor(0.12)}`,
        `0px 3px 5px -1px ${palette.boxShadowColor(0.2)},0px 5px 8px 0px ${palette.boxShadowColor(0.14)},0px 1px 14px 0px ${palette.boxShadowColor(0.12)}`,
        `0px 3px 5px -1px ${palette.boxShadowColor(0.2)},0px 6px 10px 0px ${palette.boxShadowColor(0.14)},0px 1px 18px 0px ${palette.boxShadowColor(0.12)}`,
        `0px 4px 5px -2px ${palette.boxShadowColor(0.2)},0px 7px 10px 1px ${palette.boxShadowColor(0.14)},0px 2px 16px 1px ${palette.boxShadowColor(0.12)}`,
        `0px 5px 5px -3px ${palette.boxShadowColor(0.2)},0px 8px 10px 1px ${palette.boxShadowColor(0.14)},0px 3px 14px 2px ${palette.boxShadowColor(0.12)}`,
        `0px 5px 6px -3px ${palette.boxShadowColor(0.2)},0px 9px 12px 1px ${palette.boxShadowColor(0.14)},0px 3px 16px 2px ${palette.boxShadowColor(0.12)}`,
        `0px 6px 6px -3px ${palette.boxShadowColor(0.2)},0px 10px 14px 1px ${palette.boxShadowColor(0.14)},0px 4px 18px 3px ${palette.boxShadowColor(0.12)}`,
        `0px 6px 7px -4px ${palette.boxShadowColor(0.2)},0px 11px 15px 1px ${palette.boxShadowColor(0.14)},0px 4px 20px 3px ${palette.boxShadowColor(0.12)}`,
        `0px 7px 8px -4px ${palette.boxShadowColor(0.2)},0px 12px 17px 2px ${palette.boxShadowColor(0.14)},0px 5px 22px 4px ${palette.boxShadowColor(0.12)}`,
        `0px 7px 8px -4px ${palette.boxShadowColor(0.2)},0px 13px 19px 2px ${palette.boxShadowColor(0.14)},0px 5px 24px 4px ${palette.boxShadowColor(0.12)}`,
        `0px 7px 9px -4px ${palette.boxShadowColor(0.2)},0px 14px 21px 2px ${palette.boxShadowColor(0.14)},0px 5px 26px 4px ${palette.boxShadowColor(0.12)}`,
        `0px 8px 9px -5px ${palette.boxShadowColor(0.2)},0px 15px 22px 2px ${palette.boxShadowColor(0.14)},0px 6px 28px 5px ${palette.boxShadowColor(0.12)}`,
        `0px 8px 10px -5px ${palette.boxShadowColor(0.2)},0px 16px 24px 2px ${palette.boxShadowColor(0.14)},0px 6px 30px 5px ${palette.boxShadowColor(0.12)}`,
        `0px 8px 11px -5px ${palette.boxShadowColor(0.2)},0px 17px 26px 2px ${palette.boxShadowColor(0.14)},0px 6px 32px 5px ${palette.boxShadowColor(0.12)}`,
        `0px 9px 11px -5px ${palette.boxShadowColor(0.2)},0px 18px 28px 2px ${palette.boxShadowColor(0.14)},0px 7px 34px 6px ${palette.boxShadowColor(0.12)}`,
        `0px 9px 12px -6px ${palette.boxShadowColor(0.2)},0px 19px 29px 2px ${palette.boxShadowColor(0.14)},0px 7px 36px 6px ${palette.boxShadowColor(0.12)}`,
        `0px 10px 13px -6px ${palette.boxShadowColor(0.2)},0px 20px 31px 3px ${palette.boxShadowColor(0.14)},0px 8px 38px 7px ${palette.boxShadowColor(0.12)}`,
        `0px 10px 13px -6px ${palette.boxShadowColor(0.2)},0px 21px 33px 3px ${palette.boxShadowColor(0.14)},0px 8px 40px 7px ${palette.boxShadowColor(0.12)}`,
        `0px 10px 14px -6px ${palette.boxShadowColor(0.2)},0px 22px 35px 3px ${palette.boxShadowColor(0.14)},0px 8px 42px 7px ${palette.boxShadowColor(0.12)}`,
        `0px 11px 14px -7px ${palette.boxShadowColor(0.2)},0px 23px 36px 3px ${palette.boxShadowColor(0.14)},0px 9px 44px 8px ${palette.boxShadowColor(0.12)}`,
        `0px 11px 15px -7px ${palette.boxShadowColor(0.2)},0px 24px 38px 3px ${palette.boxShadowColor(0.14)},0px 9px 46px 8px ${palette.boxShadowColor(0.12)}`,
      ],
      overrides: {
        MuiTooltip: {
          tooltip: {
            backgroundColor: palette.panelBackground.tooltipBackground,
            color: palette.text.tooltipText,
          },
        },
        MuiChip: {
          root: {
            color: palette.text.normal, //Necessary because this uses getContrastText() which produces a non-theme color
          },
        },
        MuiButton: {
          contained: {
            // TODO: Override color, for which material-UI uses getContrastText() which produces a non-theme color
          },
        },
        MuiSelect: {
          selectMenu: {
            paddingLeft: spacingUnit
          }
        },
        MuiFormControlLabel: {
          label: {
            fontFamily: palette.fonts.sansSerifStack,
            fontSize: "1.1rem",
            fontWeight: 400,
            lineHeight: "1.5rem",
          }
        },
        MuiTableCell: {
          body: {
            fontSize: '1.1rem',
            lineHeight: '1.5rem',
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 12,
            paddingBottom: 12,
            marginTop: 0,
            marginBottom: 0,
            wordBreak: "normal",
          }
        }
      },
      rawCSS: [],
    }
  }
};
