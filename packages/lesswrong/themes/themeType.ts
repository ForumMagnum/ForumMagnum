// eslint-disable-next-line no-restricted-imports
import type { Color as MuiColorShades } from '@material-ui/core';
import type { PartialDeep, Merge } from 'type-fest'
import type { ForumTypeString } from '../lib/instanceSettings';
import type { UnionOf } from '../lib/utils/typeGuardUtils';
import { userThemeNames, userThemeSettings, muiThemeNames } from './themeNames';

declare global {
  type BreakpointName = "xs"|"sm"|"md"|"lg"|"xl"|"tiny"
  type ColorString = string;

  /**
   * UserThemeName represents a concrete theme name that can be directly mapped
   * to a stylesheet (eg; "default", "dark")
   */
  type UserThemeName = UnionOf<typeof userThemeNames>;

  /**
   * UserThemeSetting is a strict superset of UserThemeName which also includes
   * "abstract" themes which require some logic to be mapped to a stylesheet
   * (eg; "auto")
   */
  type UserThemeSetting = UnionOf<typeof userThemeSettings>;

  /**
   * MuiThemeName includes all theme names that can be directly passed to
   * MaterialUI (eg; "light", "dark"). This is a 1-to-1 mapping from
   * UserThemeName.
   */
  type MuiThemeName = UnionOf<typeof muiThemeNames>;

  /**
   * Overridden forum type (for admins to quickly test AF and EA Forum themes).
   * This is the form of a partial forum-type=>forum-type mapping, where keys
   * are the actual forum you're visiting and values are the theme you want.
   * (So if you override this on LW, then go to AF it isn't overridden there,
   * and vise versa.)
   */
  type SiteThemeOverride = Partial<Record<ForumTypeString, ForumTypeString>>;

  type ThemeGreyscale = MuiColorShades & {
    0: ColorString,
    1000: ColorString,
    
    10: ColorString,
    20: ColorString,
    25: ColorString,
    30: ColorString,
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
    405: ColorString,
    410: ColorString,
    550: ColorString,
    620: ColorString,
    650: ColorString,
    680: ColorString,
    710: ColorString,
  }
  type ThemeShadePalette = {
    grey: ThemeGreyscale,
    greyAlpha: (alpha: number) => ColorString,
    inverseGreyAlpha: (alpha: number) => ColorString,
    boxShadowColor: (alpha: number) => ColorString,
    greyBorder: (thickness: string, alpha: number) => string,
    
    fonts: {
      sansSerifStack: string,
      serifStack: string,
    },
    
    // Used by material-UI for picking some of its own colors, and also by site
    // themes
    type: MuiThemeName,
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
    warning: {
      main: ColorString,
    }
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
      alwaysWhite: ColorString,
      sequenceIsDraft: ColorString,
      sequenceTitlePlaceholder: ColorString,
      primaryDarkOnDim: ColorString,
    
      reviewUpvote: ColorString,
      reviewDownvote: ColorString,
      
      eventMaybe: ColorString,
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
      primaryDim: ColorString,
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
      primaryHighlight: string,
      primaryHighlight2: string,
      secondaryHighlight: string,
      secondaryHighlight2: string,
      primaryTranslucent: string,
    },
    panelBackground: {
      default: ColorString,
      translucent: ColorString,
      translucent2: ColorString,
      translucent3: ColorString,
      translucent4: ColorString,
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
      restoreSavedContentNotice: ColorString,
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
      imageUpload2: {
        background: ColorString,
        hoverBackground: ColorString,
      },
      bookCheckoutButton: ColorString,
      eventCardTag: ColorString,
    },
    tag: {
      text: ColorString,
      background: ColorString,
      backgroundHover?: ColorString,
      border: string,
      coreTagText: ColorString,
      coreTagBackground: ColorString,
      coreTagBackgroundHover?: ColorString,
      coreTagBorder: string,
      hollowTagBackground: ColorString,
      hollowTagBackgroundHover?: ColorString,
      hollowTagBorder: string,
      boxShadow: string,
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
      translucentBackground: ColorString,
      diffInserted: ColorString,
      diffDeleted: ColorString,
      usersListItem: ColorString,
      primaryDim: ColorString,
      transparent: ColorString,
    },
    header: {
      text: ColorString,
      background: ColorString,
    },
    datePicker: {
      selectedDate: ColorString,
    },
    editor: {
      commentPanelBackground: ColorString,
      sideCommentEditorBackground: ColorString,
      commentMarker: ColorString,
      commentMarkerActive: ColorString,
    },
    blockquoteHighlight: {
      commentHovered: ColorString,
      individualQuoteHovered: ColorString,
      
      //CSS added to the <style> node of hovered blockquotes. Used for adding
      //extra top/bottom padding to extend the highlighted region a few pixels,
      //which is needed with EA Forum's font but not needed with LW's font.
      addedBlockquoteHighlightStyles: string,
    },
    intercom?: { //Optional. If omitted, use defaults from library.
      buttonBackground: ColorString,
    },
    embeddedPlayer: {
      opacity: number,
    },
    group: ColorString,
    contrastText: ColorString,
    individual: ColorString,
    event: ColorString,
    
    commentParentScrollerHover: ColorString,
    tocScrollbarColors: string,
    eventsHomeLoadMoreHover: ColorString,
  };
  type ThemePalette = Merge<ThemeShadePalette,ThemeComponentPalette>
  
  type ThemeType = {
    forumType: ForumTypeString,
    
    breakpoints: {
      /** Down is *inclusive* - down(sm) will go up to the md breakpoint */
      down:  (breakpoint: BreakpointName|number)=>string,
      up: (breakpoint: BreakpointName|number)=>string,
      values: Record<BreakpointName,number>,
    },
    spacing: {
      unit: number,
      titleDividerSpacing: number,
    },
    borderRadius: {
      default: number,
      small: number,
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
      postsItemTitle: JssStyles,
      chapterTitle: JssStyles,
      largeChapterTitle: JssStyles,
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
      italic: JssStyles,
      smallCaps: JssStyles,
    },
    zIndexes: any,
    overrides: any,
    postImageStyles: JssStyles,
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
