// eslint-disable-next-line no-restricted-imports
import type { Color as MuiColorShades } from '@material-ui/core';
import type { PartialDeep, Merge } from 'type-fest'

declare global {
  type BreakpointName = "xs"|"sm"|"md"|"lg"|"xl"|"tiny"
  type ColorString = string;
  
  type ThemeGreyscale = MuiColorShades & {
    0: ColorString,
    1000: ColorString,
    
    10: ColorString,
    20: ColorString,
    25: ColorString,
    30: ColorString,
    40: ColorString,
    55: ColorString,
    60: ColorString,
    110: ColorString,
    120: ColorString,
    140: ColorString,
    250: ColorString,
    310: ColorString,
    315: ColorString,
    320: ColorString,
    340: ColorString,
    410: ColorString,
    550: ColorString,
    620: ColorString,
    650: ColorString,
    680: ColorString,
  }
  type ThemeShadePalette = {
    grey: MuiColorShades,
    greyAlpha: (alpha: number) => ColorString,
    boxShadowColor: (alpha: number) => ColorString,
    greyBorder: (thickness: string, alpha: number) => string,
    
    fonts: {
      sansSerifStack: string,
      serifStack: string,
    },
    
    // Used by material-UI for picking some of its own colors, and also by site
    // themes
    type: "light"|"dark",
  }
  type ThemeComponentPalette = {
    primary: {
      main: ColorString,
      light: ColorString,
      dark: ColorString,
      contrastText: ColorString
    },
    secondary: {
      main: ColorString,
      light: ColorString,
      dark: ColorString, //UNUSED
      contrastText: ColorString
    },
    lwTertiary: {
      main: ColorString,
      dark: ColorString
    },
    error: {
      main: ColorString,
      light: ColorString,
      dark: ColorString
      contrastText: ColorString, //UNUSED
    },
    text: {
      primary: ColorString,
      secondary: ColorString
      
      normal: ColorString,
      maxIntensity: ColorString,
      slightlyIntense: ColorString,
      slightlyIntense2: ColorString,
      slightlyDim: ColorString,
      slightlyDim2: ColorString,
      dim: ColorString,
      dim2: ColorString,
      dim3: ColorString,
      dim4: ColorString,
      dim40: ColorString,
      dim45: ColorString,
      dim55: ColorString,
      dim60: ColorString,
      grey: ColorString,
      dim700: ColorString,
      spoilerBlockNotice: ColorString,
      notificationCount: ColorString,
      notificationLabel: ColorString,
      eventType: ColorString,
      tooltipText: ColorString,
      negativeKarmaRed: ColorString,
      moderationGuidelinesEasygoing: ColorString,
      moderationGuidelinesNormEnforcing: ColorString,
      moderationGuidelinesReignOfTerror: ColorString,
      charsAdded: ColorString,
      charsRemoved: ColorString,
      invertedBackgroundText: ColorString,
      invertedBackgroundText2: ColorString,
      invertedBackgroundText3: ColorString,
      invertedBackgroundText4: ColorString,
      error: ColorString,
      error2: ColorString,
      red: ColorString,
      sequenceIsDraft: ColorString,
      sequenceTitlePlaceholder: ColorString,
    
      reviewUpvote: ColorString,
      reviewDownvote: ColorString,
      
      aprilFools: {
        orange: ColorString,
        yellow: ColorString,
        green: ColorString,
      },
    },
    linkHover: {
      dim: ColorString,
    },
    link: {
      unmarked: ColorString,
      dim: ColorString,
      dim2: ColorString,
      dim3: ColorString,
      grey800: ColorString,
      tocLink: ColorString,
      tocLinkHighlighted: ColorString,
    },
    icon: {
      normal: ColorString,
      maxIntensity: ColorString,
      slightlyDim: ColorString,
      slightlyDim2: ColorString,
      slightlyDim3: ColorString,
      slightlyDim4: ColorString,
      dim: ColorString,
      dim2: ColorString,
      dim3: ColorString,
      dim4: ColorString,
      dim5: ColorString,
      dim6: ColorString,
      dim600: ColorString,
      dim700: ColorString,
      dim55: ColorString,
      tooltipUserMetric: ColorString,
      loadingDots: ColorString,
      loadingDotsAlternate: ColorString,
      horizRuleDots: ColorString,
      greenCheckmark: ColorString,
      onTooltip: ColorString,
      inverted: ColorString,
      topAuthor: ColorString,
      navigationSidebarIcon: ColorString,
      
      commentsBubble: {
        commentCount: ColorString,
        noUnread: ColorString,
        newPromoted: ColorString,
      },
    },
    border: {
      normal: string,
      itemSeparatorBottom: string,
      slightlyFaint: string,
      extraFaint: string,
      slightlyIntense: string,
      slightlyIntense2: string,
      slightlyIntense3: string,
      intense: string,
      faint: string,
      grey300: string,
      grey400: string,
      maxIntensity: string,
      tableHeadingDivider: string,
      table: string,
      tableCell: string,
      transparent: string,
      emailHR: string,
      sunshineNewUsersInfoHR: string,
      appBarSubtitleDivider: string,
      commentBorder: string,
      answerBorder: string,
      tooltipHR: string,
    },
    panelBackground: {
      default: ColorString,
      translucent: ColorString,
      translucent2: ColorString,
      translucent3: ColorString,
      hoverHighlightGrey: ColorString,
      postsItemHover: ColorString,
      formErrors: ColorString,
      darken02: ColorString,
      darken03: ColorString,
      darken04: ColorString,
      darken05: ColorString,
      darken08: ColorString,
      darken10: ColorString,
      darken15: ColorString,
      darken20: ColorString,
      darken25: ColorString,
      darken40: ColorString,
      
      adminHomeRecentLogins: ColorString,
      adminHomeAllUsers: ColorString,
      deletedComment: ColorString,
      newCommentFormModerationGuidelines: ColorString,
      commentNodeEven: ColorString,
      commentNodeOdd: ColorString,
      commentModeratorHat: ColorString,
      commentHighlightAnimation: ColorString,
      postsItemExpandedComments: ColorString,
      metaculusBackground: ColorString,
      spoilerBlock: ColorString,
      revealedSpoilerBlock: ColorString,
      tableHeading: ColorString,
      notificationMenuTabBar: ColorString,
      recentDiscussionThread: ColorString,
      tooltipBackground: ColorString,
      tenPercent: ColorString,
      sunshineReportedContent: ColorString,
      sunshineFlaggedUser: ColorString,
      sunshineNewPosts: ColorString,
      sunshineNewComments: ColorString,
      sunshineNewTags: ColorString,
      sunshineWarningHighlight: ColorString,
      mobileNavFooter: ColorString,
      singleLineComment: ColorString,
      singleLineCommentHovered: ColorString,
      singleLineCommentOddHovered: ColorString,
      sequenceImageGradient: string,
      sequencesBanner: ColorString,
    },
    boxShadow: {
      default: string,
      moreFocused: string,
      faint: string,
      
      notificationsDrawer: string,
      appBar: string,
      sequencesGridItemHover: string,
      eventCard: string,
      mozillaHubPreview: string,
      featuredResourcesCard: string,
      spreadsheetPage1: string,
      spreadsheetPage2: string,
      collectionsCardHover: string,
      comment: string,
      sunshineSidebarHoverInfo: string,
      sunshineSendMessage: string,
      lwCard: string,
      searchResults: string,
      recentDiscussionMeetupsPoke: string,
    },
    buttons: {
      hoverGrayHighlight: ColorString,
      startReadingButtonBackground: ColorString,
      recentDiscussionSubscribeButtonText: ColorString,
      featuredResourceCTAtext: ColorString,
      primaryDarkText: ColorString,
      feedExpandButton: {
        background: ColorString,
        plusSign: ColorString,
        border: string,
      },
      notificationsBellOpen: {
        background: ColorString,
        icon: ColorString,
      },
      groupTypesMultiselect: {
        background: ColorString,
        hoverBackground: ColorString,
      },
      imageUpload: {
        background: ColorString,
        hoverBackground: ColorString,
      },
      bookCheckoutButton: ColorString,
      eventCardTag: ColorString,
    },
    tag: {
      background: ColorString,
      border: string,
      coreTagBorder: string,
      text: ColorString,
      boxShadow: string,
      hollowTagBackground: ColorString,
      addTagButtonBackground: ColorString,
    },
    geosuggest: {
      dropdownBackground: ColorString,
      dropdownText: ColorString,
      dropdownActiveBackground: ColorString,
      dropdownActiveText: ColorString,
      dropdownHoveredBackground: ColorString,
      dropdownActiveHoveredBackground: ColorString,
    },
    review: {
      activeProgress: ColorString,
      progressBar: ColorString,
      adminButton: ColorString,
    },
    background: {
      default: ColorString
      paper: ColorString,
      pageActiveAreaBackground: ColorString,
      diffInserted: ColorString,
      diffDeleted: ColorString,
      usersListItem: ColorString,
    },
    header: {
      text: ColorString,
      background: ColorString,
    },
    datePicker: {
      selectedDate: ColorString,
    },
    intercom?: { //Optional. If omitted, use defaults from library.
      buttonBackground: ColorString,
    },
    group: ColorString,
    contrastText: ColorString,
    individual: ColorString,
    event: ColorString,
    
    commentParentScrollerHover: ColorString,
    tocScrollbarColors: string,
    eventsHomeLoadMoreHover: ColorString,
    eaForumGroupsMobileImg: ColorString,
  };
  type ThemePalette = Merge<ThemeShadePalette,ThemeComponentPalette>
  
  type ThemeType = {
    breakpoints: {
      down:  (breakpoint: BreakpointName|number)=>string,
      up: (breakpoint: BreakpointName|number)=>string,
      values: Record<BreakpointName,number>,
    },
    spacing: {
      unit: number,
      titleDividerSpacing: number,
    },
    palette: ThemePalette,
    typography: {
      fontFamily: string,
      fontDownloads: string[],
      
      postStyle: JssStyles,
      commentStyle: JssStyles,
      commentStyles: JssStyles,
      commentBlockquote: JssStyles,
      commentHeader: JssStyles,
      errorStyle: JssStyles,
      title: JssStyles,
      subtitle: JssStyles,
      li: JssStyles,
      display0: JssStyles,
      display1: JssStyles,
      display2: JssStyles,
      display3: JssStyles,
      display4: JssStyles,
      body1: JssStyles,
      body2: JssStyles,
      headline: JssStyles,
      subheading: JssStyles,
      headerStyle: JssStyles,
      code: JssStyles,
      codeblock: JssStyles,
      contentNotice: JssStyles,
      uiSecondary: JssStyles,
      smallFont: JssStyles,
      smallText: JssStyles,
      tinyText: JssStyles,
      caption: JssStyles,
      blockquote: JssStyles,
      uiStyle: JssStyles,
    },
    zIndexes: any,
    overrides: any,
    voting: {strongVoteDelay: number},
    secondary: any,
    
    // Used by material-UI. Not used by us directly (for our styles use
    // `theme.palette.boxShadow` which defines shadows semantically rather than
    // with an arbitrary darkness number)
    shadows: string[],
    
    rawCSS: string[],
  };
  
  type BaseThemeSpecification = {
    shadePalette: ThemeShadePalette,
    componentPalette: (shadePalette: ThemeShadePalette) => ThemeComponentPalette,
    make: (palette: ThemePalette) => PartialDeep<Omit<ThemeType,"palette">>
  };
  type SiteThemeSpecification = {
    shadePalette?: PartialDeep<ThemeShadePalette>,
    componentPalette?: (shadePalette: ThemeShadePalette) => PartialDeep<ThemeComponentPalette>,
    make?: (palette: ThemePalette) => PartialDeep<Omit<ThemeType,"palette">>
  };
  type UserThemeSpecification = {
    shadePalette?: PartialDeep<ThemeShadePalette>,
    componentPalette?: (shadePalette: ThemeShadePalette) => PartialDeep<ThemeComponentPalette>,
    make?: (palette: ThemePalette) => PartialDeep<Omit<ThemeType,"palette">>
  };
}
