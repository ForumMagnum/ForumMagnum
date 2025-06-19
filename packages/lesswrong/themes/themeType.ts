// eslint-disable-next-line no-restricted-imports
import type { Color as MuiColorShades } from '@/lib/vendor/@material-ui/core/src';
import type { Transitions as MuiTransitions } from '@/lib/vendor/@material-ui/core/src/styles/transitions';
import type { PartialDeep, Merge } from 'type-fest'
import type { ForumTypeString } from '../lib/instanceSettings';
import type { UnionOf } from '../lib/utils/typeGuardUtils';
import type { ZIndexMap } from './zIndexes';
import type { JssStyles } from '@/lib/jssStyles';
import { userThemeNames, userThemeSettings, muiThemeNames, ThemeOptions } from './themeNames';

declare global {
  type BreakpointName = "xs"|"sm"|"md"|"lg"|"xl"
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
    primaryAlpha: (alpha: number) => ColorString,
    boxShadowColor: (alpha: number) => ColorString,
    greyBorder: (thickness: string, alpha: number) => string,
    invertIfDarkMode: (color: string) => string,
    
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
    action: {
      active: ColorString,
      hover: ColorString,
      hoverOpacity: number,
      disabled: ColorString,
      disabledBackground: ColorString,
    },
    error: {
      main: ColorString,
      light: ColorString,
      dark: ColorString
      contrastText: ColorString, //UNUSED
    },
    warning: {
      main: ColorString,
    },
    petrov: {
      launchButtonBorder: ColorString,
      red: ColorString,
      darkRed: ColorString,
      red2: ColorString,
      darkRed2: ColorString,
      color1: ColorString,
      color2: ColorString,
      color3: ColorString,
      color4: ColorString,
    },
    fundraisingThermometer: {
      shadow: ColorString,
    },
    arbital: {
      arbitalGreen: ColorString,
    },
    text: {
      primary: ColorString,
      secondary: ColorString
      normal: ColorString,
      disabled: ColorString,
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
      tooltipTextDim: ColorString,
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
      primaryAlert: ColorString,
      error: ColorString,
      error2: ColorString,
      warning: ColorString,
      red: ColorString,
      alwaysWhite: ColorString,
      alwaysBlack: ColorString,
      alwaysLightGrey: ColorString,
      sequenceIsDraft: ColorString,
      sequenceTitlePlaceholder: ColorString,
      primaryDarkOnDim: ColorString,
      contentHeader?: ColorString,
    
      reviewWinner: {
        title: ColorString,
        author: ColorString,
      }
      reviewUpvote: ColorString,
      reviewDownvote: ColorString,
      reviewBallotIcon: ColorString,
      
      eventMaybe: ColorString,
      aprilFools: {
        orange: ColorString,
        yellow: ColorString,
        green: ColorString,
      },
      
      debateComment: {
        [1]: ColorString,
        [2]: ColorString,
        [3]: ColorString,
        [4]: ColorString,
        [5]: ColorString,
        [6]: ColorString,
      },

      jargonTerm: ColorString,
      // Banner ad compatibility - text colors that work well over background images
      bannerAdOverlay: ColorString,
      bannerAdDim: ColorString,
      bannerAdDim2: ColorString,
      bannerAdDim3: ColorString,
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
      color?: ColorString,
      visited: ColorString
      visitedHover?: ColorString,
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
      dim05: ColorString,
      dim600: ColorString,
      dim700: ColorString,
      dim55: ColorString,
      tooltipUserMetric: ColorString,
      loadingDots: ColorString,
      loadingDotsAlternate: ColorString,
      horizRuleDots: ColorString,
      greenCheckmark: ColorString,
      filledGreenCheckmark: ColorString,
      onTooltip: ColorString,
      inverted: ColorString,
      topAuthor: ColorString,
      navigationSidebarIcon: ColorString,
      sprout: ColorString,
      yellow: ColorString,
      recentDiscussionGreen: ColorString,
      recentDiscussionGrey: ColorString,
      headerKarma: ColorString,
      activeDotOrange: ColorString,
      
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
      grey200: string,
      grey300: string,
      grey400: string,
      grey800: string,
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
      dashed500: string,
      mentionsBaloon: string,
      eaButtonGreyOutline: string,
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
      commentNodeRoot: ColorString,
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
      tooltipBackground2: ColorString,
      mapboxTooltip: ColorString,
      modalBackground: ColorString,
      loginInput: ColorString,
      loginInputHovered: ColorString,
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
      cookieBanner: ColorString,
      strawpoll: ColorString,
      userProfileImageHover: ColorString,
      userProfileImageLoading: string,
      reviewGold: ColorString,
      onboardingSection: ColorString,
      onboardingPodcast: ColorString,
      placeholderGradient: ColorString,
      tagLensTab: ColorString,
      // Banner ad compatibility - translucent backgrounds with blur effects
      bannerAdTranslucent: ColorString,
      bannerAdTranslucentHeavy: ColorString,
      bannerAdTranslucentLight: ColorString,
      bannerAdTranslucentMedium: ColorString,
      bannerAdTranslucentDeep: ColorString,
      bannerAdTranslucentStrong: ColorString,
      appBarDarkBackground: ColorString,
    },
    boxShadow: {
      default: string,
      moreFocused: string,
      faint: string,
      
      notificationsDrawer: string,
      appBar: string,
      appBarDarkBackground: string,
      sequencesGridItemHover: string,
      eventCard: string,
      featuredResourcesCard: string,
      spreadsheetPage1: string,
      spreadsheetPage2: string,
      collectionsCardHover: string,
      comment: string,
      sunshineSidebarHoverInfo: string,
      sunshineSendMessage: string,
      lwCard: string,
      eaCard: string,
      searchResults: string,
      recentDiscussionMeetupsPoke: string,
      graphTooltip: string,
      lwTagHoverOver: string,
    },
    buttons: {
      hoverGrayHighlight: ColorString,
      alwaysPrimary: ColorString,
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
      mentions: {
        hover: ColorString,
        selected: ColorString,
        selectedHover: ColorString,
      },
      digestAdBannerNoThanks: {
        background: ColorString,
        hoverBackground: ColorString,
      },
    },
    sideItemIndicator: {
      sideComment: ColorString,
      inlineReaction: ColorString,
      footnote: ColorString,
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
      onboardingBackground: ColorString,
      onboardingBackgroundHover: ColorString,
      onboardingBackgroundSelected: ColorString,
    },
    tab: {
      inactive: {
        text: ColorString,
        hover: {
          text: ColorString,
        },
        // Banner ad compatibility
        bannerAdBackground: ColorString,
        bannerAdBackgroundBlur: ColorString,
      },
      active: {
        text: ColorString,
        background: ColorString
        hover: {
          background: ColorString,
        },
        // Banner ad compatibility 
        bannerAdOpacity: number,
      },
    },
    // Banner ad compatibility - CSS filters and effects
    filters: {
      bannerAdBlur: string,
      bannerAdBlurLight: string,
      bannerAdBlurMedium: string,
      bannerAdBlurHeavy: string,
      headerBackdropFilter: string,
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
      winner: ColorString,
    },
    leastwrong: {
      fadeOut: ColorString,
      imageGridHeaderHighlighted: ColorString,
      imageGridHeader: ColorString,
      highlightedPost: ColorString,
      imageGridBackground: ColorString,
      postBodyScrim: ColorString,
    }
    background: {
      default: ColorString
      paper: ColorString,
      contrastInDarkMode: ColorString,
      pageActiveAreaBackground: ColorString,
      translucentBackground: ColorString,
      translucentBackgroundHeavy: ColorString,
      loginBackdrop: ColorString,
      diffInserted: ColorString,
      diffDeleted: ColorString,
      usersListItem: ColorString,
      primaryDim: ColorString,
      primarySlightlyDim: ColorString,
      primaryTranslucent: ColorString,
      primaryTranslucentHeavy: ColorString,
      warningTranslucent: ColorString,
      transparent: ColorString,
      imageOverlay: ColorString,
      digestAdBannerInput: ColorString,
      glossaryBackground: ColorString,
      sidenoteBackground: ColorString,
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
      // Banner ad compatibility
      bannerAdBackground: ColorString,
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
    dropdown: {
      background: ColorString,
      border: ColorString,
      hoverBackground: ColorString,
    },
    graph: {
      analyticsReads: ColorString,
    },
    group: ColorString,
    contrastText: ColorString,
    individual: ColorString,
    event: ColorString,
    
    commentParentScrollerHover: ColorString,
    tocScrollbarColors: string,
    eventsHomeLoadMoreHover: ColorString,

    wrapped: {
      background: ColorString,
      darkBackground: ColorString,
      highlightText: ColorString,
      secondaryText: ColorString,
      tertiaryText: ColorString,
      black: ColorString,
      darkDot: ColorString,
      panelBackground: ColorString,
      panelBackgroundDark: ColorString,
      postScore: ColorString,
      notification: ColorString,
      emptyPath: ColorString,
      metaText: ColorString,
      personality: {
        transparent: ColorString,
        grey: ColorString,
        red: ColorString,
        blue: ColorString,
        green: ColorString,
      },
    },
    forumEvent: {
      draftSticker: ColorString,
      stickerMobileOverlay: ColorString,
    },
    namesAttachedReactions: {
      selectedAnti: ColorString,
    },
    bookPromotion: {
      twilightLight: ColorString,
      twilightDark: ColorString,
      twilightMid: ColorString,
      starGold: ColorString,
      starRedShift: ColorString,
    },
    ultraFeed: {
      dim: ColorString,
      cardSeparator: string,
    }
  };
  type ThemePalette = Merge<ThemeShadePalette,ThemeComponentPalette> & {
    shadePalette: ThemeShadePalette
  }
  
  type ThemeType = {
    forumType: ForumTypeString,
    themeOptions: ThemeOptions,

    baseFontSize: number,
    
    breakpoints: {
      /** Down is *inclusive* - down(sm) will go up to the md breakpoint */
      down:  (breakpoint: BreakpointName|number) => string,
      up: (breakpoint: BreakpointName|number) => string,
      values: Record<BreakpointName,number>,
    },
    spacing: {
      unit: number,
      titleDividerSpacing: number,
      mainLayoutPaddingTop: number,
    },
    borderRadius: {
      default: number,
      small: number,
      quickTakesEntry: number,
    },
    palette: ThemePalette,
    typography: {
      fontFamily: string,
      fontDownloads?: string[],
      cloudinaryFont: {
        stack: string,
        url: string,
      },

      postStyle: JssStyles,
      commentStyle: JssStyles,
      ultraFeedMobileStyle: JssStyles,
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
      smallText: JssStyles,
      tinyText: JssStyles,
      caption: JssStyles,
      button: JssStyles,
      blockquote: JssStyles,
      italic: JssStyles,
      smallCaps: JssStyles,
      
      /** @deprecated */
      pxToRem: (px: number) => string
    },
    zIndexes: ZIndexMap,
    overrides: any,
    postImageStyles: JssStyles,
    voting: {strongVoteDelay: number},
    
    // Used by material-UI. Not used by us directly (for our styles use
    // `theme.palette.boxShadow` which defines shadows semantically rather than
    // with an arbitrary darkness number)
    shadows: string[],
    
    rawCSS: string[],
    
    shape: {
      borderRadius: number,
    },
    transitions: MuiTransitions,
    direction: "ltr"|"rtl",
  };

  type NativeThemeType = Omit<ThemeType,"palette"|"forumType"|"themeOptions"|"breakpoints"> & { breakpoints: Omit<ThemeType["breakpoints"], "up"|"down"> };
  
  type BaseThemeSpecification = {
    shadePalette: ThemeShadePalette,
    componentPalette: (shadePalette: ThemeShadePalette) => ThemeComponentPalette,
    make: (palette: ThemePalette) => NativeThemeType
  };
  type SiteThemeSpecification = {
    shadePalette?: PartialDeep<ThemeShadePalette>,
    componentPalette?: (shadePalette: ThemeShadePalette) => PartialDeep<ThemeComponentPalette>,
    make?: (palette: ThemePalette) => PartialDeep<NativeThemeType>
  };
  type UserThemeSpecification = {
    shadePalette?: PartialDeep<ThemeShadePalette>,
    componentPalette?: (shadePalette: ThemeShadePalette) => PartialDeep<ThemeComponentPalette>,
    make?: (palette: ThemePalette) => PartialDeep<NativeThemeType>
  };
}
