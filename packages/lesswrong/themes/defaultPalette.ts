//
// All About the Themes, the Theme Palette and Colors
// ==================================================
// There are two themes active at a time: the user theme and the site theme. The
// user theme is a user-configurable preference representing whether to use
// light mode, dark mode, etc. The site theme represents the styling differences
// between LessWrong, EA Forum, Alignment Forum, Progress Studies Forum, and
// whatever other sites share the codebase.
//
// The palette is constructed in two parts: the shade palette
// (ThemeShadePalette) and the component palette (ThemeComponentPalette). Colors
// in the component palette may depend on colors/functions in the shade palette
// (but not vise versa). These are merged together to create the overall theme.
//
// When to Use the Palette
// =======================
// When writing styles for UI components, use palette colors for colors that are
// shared between components, or which are likely to be customized as part of the
// theme, eg like this:
//
//   const styles = (theme: ThemeType) => ({
//     normalText: {
//       color: theme.palette.text.normal,
//     },
//     notice: {
//       border: theme.palette.border.normal,
//       background: theme.palette.panelBackground.default,
//     },
//   });
//
// Not like this:
//
//   const styles = (theme: ThemeType) => ({
//     normalText: {
//       color: "rgba(0,0,0,.87)", // Bad: Will be black-on-black in dark mode
//     },
//     notice: {
//       border: "rgba(0,0,0,.1)", // Bad: Border will be black-on-black
//       background: "#fff", // Bad: Text will be white-on-white
//     },
//   });
//
// There is a unit test which looks for colors that seem like they will fail to
// adjust for dark mode. If your styles have a color in them, you can support
// dark mode (and make this unit test pass) in a number of ways:
//   * Use a color from the palette
//   * Write the color using the CSS `light-dark` function, eg `light-dark(#333,#aaa)`.
//   * Add `allowNonThemeColors: true` to the style declaration
//   * Wrap the attribute value in `safeForDarkMode()`
// Prefer `allowNonThemeColors: true` option for components that are
// always-light or always-dark rather than inverting themselves. Use the
// `safeForDarkMode` wrapper for colors that work on both light and dark
// backgrounds because they're medium-darkness.
//
// Text Color and Alpha Versus Shade
// =================================
// When you've got dark text on a white background, there are two ways to adjust
// its contrast: either choose a shade of grey, or make it black and choose an
// opacity (aka alpha). In general, opacity is the better option, because it
// maintains the ~same contrast ratio if you put you put the same text color
// on a colored background. The same applies for dark-mode themes, where it's
// better to use white-and-transparent rather than grey.
//
// Don't overuse pure-black or pure-white text colors. Think of these as
// bolded colors, not as defaults.
//
// Text should have a minimum contrast ratio of 4.5:1 ("AA") and ideally 7:1
// ("AAA"). You can check the contrast ratio of your text in the Chrome
// development tools. In the Elements tab, find the `color` attribute on an
// element with text, click on the swatch next to it, and the contrast ratio
// should be on the color-picker dialog that appears.
//
// Notational Conventions
// ======================
// CSS has a number of different ways to specify colors. For the sake of
// consistency, we only use a subset of them.
//
// Do Use:
//   Three or six hex digits: #rrggbb
//   RGBA 0-255 with alpha 0-1: "rgba(r,g,b,a)",
// Avoid:
//   CSS named color strings other than "white", "black", and "transparent"
//   HSL, HSLA, HWB, Lab, and LCH color specifiers, eg "hsl(60 100% 50%)"
//   Functional notation without commas, eg "rgba(0 0 0 / 10%)"
//   RGB percentages, eg "rgba(50%,25%,25%,1)"
//   Omitted alpha: eg "rgb(0,0,100)"
//   Importing color constants from @/lib/vendor/@material-ui/core/src/colors or other libraries
//
//

import mapValues from "lodash/mapValues";
import { invertHexColor } from "./colorUtil";

export const grey = mapValues({
  // Exactly matches @/lib/vendor/@material-ui/core/src/colors/grey
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
  A100: '#d5d5d5',
  A200: '#aaaaaa',
  A400: '#303030',
  A700: '#616161',
  
  // Greyscale colors not in the MUI palette
  0: "#fff",
  1000: "#000",
  
  10: '#fefefe',
  20: '#fdfdfd',
  25: '#fcfcfc',
  30: '#fbfbfb',
  55: '#f9f9f9',
  60: '#f8f8f8',
  110: "#f3f3f3",
  120: '#f2f2f2',
  140: "#f0f0f0",
  250: "#e8e8e8",
  310: "#dddddd",
  315: "#d4d4d4",
  320: "#d9d9d9",
  340: "#d0d0d0",
  405: "#bbbbbb",
  410: "#b3b3b3",
  550: "#999999",
  620: "#888888",
  650: "#808080",
  680: "#666666",
  710: "#606060",
  750: "#5e5e5e",
}, v => `light-dark(${v},${invertHexColor(v)})`)

export const defaultShadePalette = (): ThemeShadePalette => {
  const greyAlpha = (alpha: number) => `light-dark(rgba(0,0,0,${alpha}),rgba(255,255,255,${alpha}))`;
  const inverseGreyAlpha = (alpha: number) => `light-dark(rgba(255,255,255,${alpha}),rgba(0,0,0,${alpha}))`;
  return {
    dark: false,
    grey,
    greyAlpha,
    inverseGreyAlpha,
    primaryAlpha: greyAlpha,
    boxShadowColor: (alpha: number) => greyAlpha(alpha),
    greyBorder: (thickness: string, alpha: number) => `${thickness} solid ${greyAlpha(alpha)}`,
    invertIfDarkMode: (color: string) => `light-dark(${color},${invertHexColor(color)})`,
    
    fonts: {
      // Every site theme overrides these
      sansSerifStack: "sans-serif",
      serifStack: "serif",
    },
    
    type: "light",
  }
}

export const defaultComponentPalette = (shades: ThemeShadePalette): ThemeComponentPalette => ({
  text: {
    primary: shades.greyAlpha(.87),
    secondary: shades.greyAlpha(.54),
    normal: shades.greyAlpha(.87),
    maxIntensity: shades.greyAlpha(1.0),
    disabled: "light-dark(rgba(0,0,0,0.38),rgba(255,255,255,0.5))",
    slightlyIntense: shades.greyAlpha(.92),
    slightlyIntense2: shades.greyAlpha(.9),
    slightlyDim: shades.greyAlpha(.8),
    slightlyDim2: shades.greyAlpha(.7),
    dim: shades.greyAlpha(.5),
    dim2: shades.grey[800],
    dim3: shades.grey[600],
    dim4: shades.grey[500],
    dim700: shades.grey[700],
    dim40: shades.greyAlpha(.4),
    dim45: shades.greyAlpha(.45),
    dim55: shades.greyAlpha(.55),
    dim60: shades.greyAlpha(.6),
    grey: shades.grey[650],
    spoilerBlockNotice: "#fff",
    notificationCount: shades.greyAlpha(0.6),
    notificationLabel: shades.greyAlpha(.66),
    eventType: "#c0a688",
    tooltipText: "#fff",
    tooltipTextDim: "#c2c2c2",
    negativeKarmaRed: "#ff8a80",
    charsAdded: "#008800",
    charsRemoved: "#880000",
    invertedBackgroundText: shades.inverseGreyAlpha(1),
    invertedBackgroundText2: shades.inverseGreyAlpha(0.7),
    invertedBackgroundText3: shades.inverseGreyAlpha(0.5),
    invertedBackgroundText4: shades.inverseGreyAlpha(0.8),
    primaryAlert: "light-dark(#69886e,#b2c5b5)",
    error: "#9b5e5e",
    error2: "#E04E4B",
    warning: "light-dark(#832013,#FFF7E6)",
    red: "#ff0000",
    alwaysWhite: "#fff",
    alwaysBlack: "#000",
    alwaysLightGrey: "#e0e0e0",
    sequenceIsDraft: "rgba(100, 169, 105, 0.9)",
    sequenceTitlePlaceholder: shades.inverseGreyAlpha(0.5),
    primaryDarkOnDim: "light-dark(#085d6c,#a8cad7)", // text that is meant to be shown on the primaryDim background color
    reviewWinner: {
      title: shades.greyAlpha(.75),
      author: shades.greyAlpha(.65),
    },
    
    reviewUpvote: "rgba(70,125,70, .87)",
    reviewDownvote: "rgba(125,70,70, .87)",
    reviewBallotIcon: 'rgb(47 108 152 / 50%)',

    debateComment: {
      [1]: '#1192e8',
      [2]: '#198038',
      [3]: '#b28600',
      [4]: '#9f1853',
      [5]: '#a56eff',
      [6]: '#6C7BFF',
    },

    jargonTerm: "#a8742a",
    // Banner ad compatibility - text colors (set to non-affecting defaults for light mode)
    bannerAdOverlay: shades.grey[1000], // Use normal text color for light mode
    bannerAdDim: shades.greyAlpha(.6),
    bannerAdDim2: shades.greyAlpha(.9),
    bannerAdDim3: shades.greyAlpha(.25),
  },
  link: {
    unmarked: shades.greyAlpha(.87),
    dim: shades.greyAlpha(.5),
    dim2: shades.grey[600],
    dim3: shades.greyAlpha(.4),
    grey800: shades.grey[800],
    tocLink: shades.grey[600],
    tocLinkHighlighted: shades.grey[1000],
    primaryDim: "light-dark(#5caab7,#3a7883)",
    visited: "light-dark(#bb7c43,#798754)",
  },
  linkHover: {
    dim: shades.greyAlpha(.3),
  },
  icon: {
    normal: shades.greyAlpha(.87),
    maxIntensity: shades.greyAlpha(1.0),
    slightlyDim: shades.greyAlpha(.8),
    slightlyDim2: shades.greyAlpha(.75),
    slightlyDim3: shades.greyAlpha(.7),
    slightlyDim4: shades.greyAlpha(.6),
    dim: shades.greyAlpha(.5),
    dim2: shades.greyAlpha(.4),
    dim3: shades.grey[400],
    dim4: shades.grey[500],
    dim5: shades.greyAlpha(.3),
    dim6: shades.greyAlpha(.2),
    dim05: shades.greyAlpha(.08),
    dim55: shades.greyAlpha(.55),
    dim600: shades.grey[600],
    dim700: shades.grey[700],
    tooltipUserMetric: "rgba(255,255,255,.8)",
    loadingDots: shades.greyAlpha(.55),
    loadingDotsAlternate: shades.grey[0],
    horizRuleDots: shades.greyAlpha(.26),
    greenCheckmark: "#4caf50",
    filledGreenCheckmark: "#5ECE79",
    onTooltip: "#fff",
    inverted: shades.grey[0],
    topAuthor: shades.grey[340],
    navigationSidebarIcon: shades.greyAlpha(1.0),
    sprout: '#69886e',
    yellow: '#ffc500',
    recentDiscussionGreen: "#72B065",
    recentDiscussionGrey: "#757575",
    headerKarma: "#ffad08",
    activeDotOrange: "#fdbd48",

    commentsBubble: {
      commentCount: "#fff",
      noUnread: shades.greyAlpha(.22),
      newPromoted: "rgb(160, 225, 165)",
    },
  },
  border: {
    normal: shades.greyBorder("1px", .2),
    itemSeparatorBottom: shades.dark ? shades.greyBorder("1px", .2) : shades.greyBorder("2px", .05),
    itemSeparatorBottomStrong: shades.dark ? shades.greyBorder("1px", .3) : shades.greyBorder("2px", .1),
    itemSeparatorBottomIntense: shades.greyBorder("2px", .2),
    readUltraFeedBorder: `2px solid ${shades.grey[200]}`,
    slightlyFaint: shades.greyBorder("1px", .15),
    slightlyIntense: shades.greyBorder("1px", .25),
    slightlyIntense2: shades.greyBorder("1px", .3),
    slightlyIntense3: shades.greyBorder("1px", .4),
    intense: shades.greyBorder("2px", .5),
    faint: shades.greyBorder("1px", .1),
    extraFaint: shades.greyBorder("1px", .08),
    grey200: `1px solid ${shades.grey[200]}`,
    grey300: `1px solid ${shades.grey[300]}`,
    grey400: `1px solid ${shades.grey[400]}`,
    grey800: `1px solid ${shades.grey[800]}`,
    maxIntensity: shades.greyBorder("1px", 1.0),
    tableHeadingDivider: shades.greyBorder("2px", 1.0),
    table: `1px double ${shades.grey[410]}`,
    tableCell: `1px double ${shades.grey[320]}`,
    transparent: shades.greyBorder("1px", 0.0),
    emailHR: "1px solid #aaa",
    sunshineNewUsersInfoHR: "1px solid #ccc",
    appBarSubtitleDivider: `1px solid ${shades.grey[400]}`,
    commentBorder: "light-dark(rgba(72,94,144,0.16),rgba(255,255,255,.2))",
    answerBorder: "light-dark(rgba(72,94,144,0.16),rgba(255,255,255,.2))",
    tooltipHR: "solid 1px rgba(255,255,255,.2)",
    primaryHighlight: "light-dark(#88c9d4,#314a4e)",
    primaryHighlight2: "light-dark(#bae2e8,#314a4e)",
    secondaryHighlight: "light-dark(#aedba3,#3e503a)",
    secondaryHighlight2: "light-dark(#d8edd3,#3e503a)",
    primaryTranslucent: 'rgba(12,134,155,.7)',
    dashed500: `dashed 1px ${shades.grey[500]}`,
    mentionsBaloon: "light-dark(#c4c4c4,#f5f5f5)",
    eaButtonGreyOutline: "light-dark(#BCC1C9,#5F5F5F)",
  },
  background: {
    default: shades.dark ? shades.grey[100] : shades.grey[60],
    paper: shades.grey[0], //Used by MUI
    contrastInDarkMode: "light-dark(#ffffff,#f5f5f5)",
    pageActiveAreaBackground: shades.grey[0],
    profilePageBackground: "light-dark(#fcfbf8,#262626)",
    translucentBackground: "light-dark(rgba(255,255,255,.5),rgba(0,0,0,.5))",
    translucentBackgroundHeavy: "light-dark(rgba(255,255,255,.75),rgba(0,0,0,.75))",
    loginBackdrop: "rgba(217,217,217,0.5)",
    diffInserted: "light-dark(#d4ead4,#205120)",
    diffDeleted: "light-dark(#f0d3d3,#b92424)",
    usersListItem: shades.greyAlpha(.05),
    primaryDim: "light-dark(#e2f1f4,#28383e)",
    primarySlightlyDim: "light-dark(#d1ecf1,#00494e)",
    primaryTranslucent: "light-dark(rgba(95,155,101,0.1),rgba(99,141,103,0.3))",
    primaryTranslucentHeavy: "light-dark(rgba(95,155,101,0.35),rgba(99,141,103,0.6))",
    warningTranslucent: "light-dark(rgba(255,152,0,0.1),rgba(255,173,8,0.3))",
    // this is used to address a specific iOS Safari-related issue with linear-gradient:
    // https://stackoverflow.com/questions/70446857/safari-linear-gradient
    transparent: shades.inverseGreyAlpha(0),
    imageOverlay: 'rgba(0,0,0,0.4)',
    digestAdBannerInput: shades.dark ? shades.grey[300] : shades.grey[0],
    glossaryBackground: "light-dark(rgba(190,120,80,.05),rgba(180,160,160,.1))",
    sidenoteBackground: "light-dark(rgba(190,120,80,.05),rgba(180,160,160,.1))",
  },
  panelBackground: {
    default: shades.grey[0],
    translucent: "light-dark(rgba(255,255,255,.87),rgba(0,0,0,.87))",
    translucent2: "light-dark(rgba(255,255,255,.8),rgba(0,0,0,.8))",
    translucent3: "light-dark(rgba(255,255,255,.75),rgba(0,0,0,.75))",
    translucent4: "light-dark(rgba(255,255,255,.5),rgba(0,0,0,.6))",
    hoverHighlightGrey: shades.greyAlpha(.1),
    postsItemHover: shades.grey[50],
    formErrors: shades.greyAlpha(0.25),
    darken02: shades.greyAlpha(.02),
    darken03: shades.greyAlpha(.03),
    darken04: shades.greyAlpha(.04),
    darken05: shades.greyAlpha(.05),
    darken08: shades.greyAlpha(.08),
    darken10: shades.greyAlpha(.1),
    darken15: shades.greyAlpha(.15),
    darken20: shades.greyAlpha(.2),
    darken25: shades.greyAlpha(.25),
    darken40: shades.greyAlpha(.4),
    
    adminHomeRecentLogins: "rgba(50,100,50,.1)",
    adminHomeAllUsers: "rgba(100,50,50,.1)",
    deletedComment: "light-dark(#ffefef,#3a0505)",
    newCommentFormModerationGuidelines: shades.greyAlpha(.07),
    commentNodeEven: shades.dark ? shades.grey[50] : shades.grey[120],
    commentNodeOdd: shades.grey[25],
    commentNodeRoot: shades.grey[0],
    commentModeratorHat: "light-dark(#ecf2ed,#202719)",
    commentHighlightAnimation: shades.grey[300],
    postsItemExpandedComments: shades.grey[50],
    metaculusBackground: "#2c3947",
    spoilerBlock: "light-dark(#000,#1b1b1b)",
    revealedSpoilerBlock: shades.greyAlpha(.12),
    tableHeading: shades.grey[50],
    notificationMenuTabBar: shades.grey[100],
    recentDiscussionThread: "light-dark(#fdfdfd,rgba(0,0,0,0.4))",
    tooltipBackground: "rgba(75,75,75,.94)",
    tooltipBackground2: "#373737",
    mapboxTooltip: "#fff",
    modalBackground: "#fff",
    loginInput: "#efefef",
    loginInputHovered: "#e4e4e4",
    tenPercent: shades.greyAlpha(.1),
    sunshineReportedContent: "rgba(60,0,0,.08)",
    sunshineFlaggedUser: "rgba(150,0,0,.05)",
    sunshineNewPosts: "rgba(0,80,0,.08)",
    sunshineNewComments: "rgba(120,120,0,.08)",
    sunshineNewTags: "rgba(80,80,0,.08)",
    sunshineWarningHighlight: "rgba(255,50,0,.2)",
    sunshineNewContentGroup: "light-dark(linear-gradient(135deg, rgba(0,80,0,.20) 0%, rgba(0,80,0,0) 100%),linear-gradient(135deg, rgba(0,80,0,.50) 0%, rgba(0,80,0,0) 100%))",
    sunshineHighContextGroup: "light-dark(linear-gradient(135deg, rgba(120,120,0,.20) 0%, rgba(120,120,0,0) 100%),linear-gradient(135deg, rgba(120,120,0,.50) 0%, rgba(36, 36, 9, 0) 100%))",
    sunshineMaybeSpamGroup: "light-dark(linear-gradient(135deg, rgba(120,0,120,.20) 0%, rgba(120,0,120,0) 100%),linear-gradient(135deg, rgba(120,0,120,.50) 0%, rgba(120,0,120,0) 100%))",
    sunshineAutomodGroup: "light-dark(linear-gradient(135deg, rgba(120,120,0,.20) 0%, rgba(120,120,0,0) 100%),linear-gradient(135deg, rgba(120,120,0,.50) 0%, rgba(120,120,0,0) 100%))",
    sunshineSnoozeExpiredGroup: "light-dark(linear-gradient(135deg, rgba(120,120,0,.20) 0%, rgba(120,120,0,0) 100%),linear-gradient(135deg, rgba(120,120,0,.50) 0%, rgba(120,120,0,0) 100%))",
    sunshineUnknownGroup: "light-dark(linear-gradient(135deg, rgba(120,120,120,.20) 0%, rgba(120,120,120,0) 100%),linear-gradient(135deg, rgba(120,120,120,.50) 0%, rgba(120,120,120,0) 100%))",
    mobileNavFooter: shades.grey[0],
    singleLineComment: shades.dark ? 'unset' : shades.grey[140],
    singleLineCommentHovered: shades.grey[300],
    singleLineCommentOddHovered: shades.grey[110],
    sequenceImageGradient: 'linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 42%, rgba(255, 255, 255, 0) 100%)',
    sequencesBanner: shades.greyAlpha(.5),
    cookieBanner: shades.dark ? shades.grey[900] : shades.grey[800],
    strawpoll: "rgba(251, 191, 36, 1)", // Color used by StrawPoll
    userProfileImageHover: "rgba(0, 0, 0, 0.5)",
    userProfileImageLoading: `linear-gradient(
      90deg,
      rgba(0,0,0,0) 33%,
      rgba(255,255,255,0.25) 50%,
      rgba(0,0,0,0) 66%
    ) ${shades.grey[500]}`,
    reviewGold: 'lch(68 34.48 85.39 / 76%)',
    onboardingSection: "#f5f5f5",
    onboardingPodcast: "#e7e7e7",
    placeholderGradient: 'linear-gradient(90deg, #EEE 33%, #E6E6E6 50%, #EEE 66%)',
    tagLensTab: shades.dark ? shades.greyAlpha(.15) : shades.greyAlpha(.1),
    // Banner ad compatibility - backgrounds (set to non-affecting defaults for light mode)
    bannerAdTranslucent: shades.dark ? "rgba(0,0,0,0.2)" : shades.grey[0], // Use default background for light mode
    bannerAdTranslucentHeavy: shades.dark ? "rgba(0,0,0,0.3)" : shades.grey[0],
    bannerAdTranslucentLight: shades.dark ? "rgba(0,0,0,0.1)" : shades.grey[0],
    bannerAdTranslucentMedium: shades.dark ? "rgba(0,0,0,0.4)" : shades.grey[0],
    bannerAdTranslucentDeep: shades.dark ? "rgba(0,0,0,0.5)" : shades.grey[0],
    bannerAdTranslucentStrong: shades.dark ? "rgba(0,0,0,0.6)" : shades.grey[0],
    appBarDarkBackground: shades.dark ? 'rgba(255,255,255,0.1)' : 'none'
  },
  boxShadow: {
    default: `0 1px 5px ${shades.boxShadowColor(.025)}`,
    moreFocused: `0 1px 3px ${shades.boxShadowColor(.1)}`,
    faint: `0 1px 5px ${shades.boxShadowColor(.1)}`,
    
    notificationsDrawer: `${shades.boxShadowColor(.16)} 0px 3px 10px, ${shades.boxShadowColor(.23)} 0px 3px 10px`,
    appBar: shades.dark
      ? "none"
      : `0 1px 1px ${shades.boxShadowColor(.05)}, 0 1px 1px ${shades.boxShadowColor(.05)}`,
    appBarDarkBackground: `0 1px 1px ${shades.boxShadowColor(.05)}, 0 1px 1px ${shades.boxShadowColor(.05)}`,
    sequencesGridItemHover: `0 1px 3px ${shades.boxShadowColor(.1)}`,
    eventCard: `0 1px 3px ${shades.boxShadowColor(.1)}`,
    featuredResourcesCard: `0 4px 4px ${shades.boxShadowColor(.07)}`,
    spreadsheetPage1: `2px 0 2px -1px ${shades.boxShadowColor(.15)}`,
    spreadsheetPage2: `0 0 3px ${shades.boxShadowColor(.3)}`,
    collectionsCardHover: `0 0 3px ${shades.boxShadowColor(.1)}`,
    comment: `0 0 10px ${shades.boxShadowColor(.2)}`,
    sunshineSidebarHoverInfo: `-3px 0 5px 0px ${shades.boxShadowColor(.1)}`,
    sunshineSendMessage: `0 0 10px ${shades.boxShadowColor(.5)}`,
    lwCard: `0 0 10px ${shades.boxShadowColor(.2)}`,
    eaCard: `0 4px 8px ${shades.boxShadowColor(0.12)}`,
    searchResults: `0 0 20px ${shades.boxShadowColor(.2)}`,
    recentDiscussionMeetupsPoke: `5px 5px 5px ${shades.boxShadowColor(.2)}`,
    graphTooltip: shades.dark ? "none" : `0 4px 8px ${shades.boxShadowColor(0.12)}`,
    lwTagHoverOver: `0 1px 3px 0 ${shades.boxShadowColor(0.2)},0 1px 1px 0 ${shades.boxShadowColor(0.14)},0 2px 1px -1px ${shades.boxShadowColor(0.12)}`,
  },
  buttons: {
    hoverGrayHighlight: shades.greyAlpha(0.05),
    alwaysPrimary: "#5f9b65",
    startReadingButtonBackground: shades.greyAlpha(0.05),
    recentDiscussionSubscribeButtonText: "#fff",
    featuredResourceCTAtext: "#fff",
    primaryDarkText: "#fff",
    feedExpandButton: {
      background: "#fff",
      plusSign: "#666",
      border: "1px solid #ddd",
    },
    notificationsBellOpen: {
      background: shades.greyAlpha(0.4),
      icon: shades.grey[0],
    },
    
    groupTypesMultiselect: {
      background: "rgba(100,169,105, 0.9)",
      hoverBackground: "rgba(100,169,105, 0.5)",
    },
    imageUpload: {
      background: shades.greyAlpha(.5),
      hoverBackground: shades.greyAlpha(.35),
    },
    imageUpload2: {
      // Because this displays over an image, make it the same in both light and dark mode
      background: 'rgba(0,0,0,0.6)',
      hoverBackground: 'rgba(0,0,0,0.8)',
    },
    bookCheckoutButton: "#53a55a",
    eventCardTag: "#CC5500",
    mentions: {
      hover: shades.dark ? shades.grey[100] : "#e6e6e6",
      selected: "light-dark(#198cf0,#0c70c7)",
      selectedHover: "light-dark(#0e7fe1,#0b62ae)",
    },
  },
  intercom: {
    buttonBackground: "light-dark(#f5f5f5,#424242) !important",
  },
  sideItemIndicator: {
    sideComment: '#5f9b65',
    inlineReaction: 'lch(68 34.48 85.39 / 76%)',
    footnote: shades.greyAlpha(0.4),
  },
  tag: {
    text: shades.greyAlpha(.9),
    background: shades.grey[200],
    border: `solid 1px ${shades.grey[200]}`,
    coreTagText: shades.grey[600],
    coreTagBackground: shades.grey[0],
    coreTagBorder: shades.greyBorder("1px", .15),
    hollowTagBackground: shades.grey[0],
    hollowTagBorder: shades.greyBorder("1px", .15),
    boxShadow: `1px 2px 5px ${shades.boxShadowColor(.2)}`,
    addTagButtonBackground: shades.grey[300],
    onboardingBackground: "rgba(0, 0, 0, 0.4)",
    onboardingBackgroundHover: "rgba(0, 0, 0, 0.2)",
    onboardingBackgroundSelected: "rgba(0, 0, 0, 0.5)",
  },
  tab: {
    inactive: {
      text: shades.dark ? shades.grey[600] : shades.grey[500],
      hover: {
        text: shades.grey[700]
      },
      // Banner ad compatibility - non-affecting defaults for light mode
      bannerAdBackground: shades.dark ? "rgba(0,0,0,0.3)" : 'transparent',
      bannerAdBackgroundBlur: 'transparent',
    },
    active: {
      background: "rgba(127, 175, 131, 1)",
      text: shades.grey[0],
      hover: {
        background: "rgba(127, 175, 131, 0.7)",
      },
      // Banner ad compatibility - non-affecting default for light mode
      bannerAdOpacity: shades.dark ? 0.8 : 1,
    },
  },
  // Banner ad compatibility - CSS filters (non-affecting defaults for light mode)
  filters: {
    bannerAdBlur: shades.dark ? 'blur(10px)' : 'none',
    bannerAdBlurLight: shades.dark ? 'blur(2px)' : 'none',
    bannerAdBlurMedium: shades.dark ? 'blur(4px)' : 'none',
    bannerAdBlurHeavy: shades.dark ? 'blur(8px)' : 'none',
  },

  geosuggest: {
    dropdownText: "#000",
    dropdownBackground: "#fff",
    dropdownActiveBackground: "#267dc0",
    dropdownActiveText: "#fff",
    dropdownHoveredBackground: "#f5f5f5",
    dropdownActiveHoveredBackground: "#ccc",
  },
  review: {
    activeProgress: 'rgba(127, 175, 131, 0.5)',
    progressBar: 'rgba(127, 175, 131, 0.7)',
    adminButton: "rgba(200,150,100)",
    winner: "rgba(179, 136, 79, 1)",
  },
  leastwrong: {
    fadeOut: 'rgba(0,0,0,0.38)',
    imageGridHeaderHighlighted: 'rgba(241, 209, 150, .75)',
    imageGridHeader: 'rgba(241, 209, 150, .4)',
    highlightedPost: 'rgba(0,0,0,0.27)',
    imageGridBackground: '#f8f4ee',
    postBodyScrim: 'rgba(0,0,0,var(--top-posts-page-scrim-opacity))'
  },
  header: {
    text: shades.greyAlpha(.87),
    background: shades.grey[30],
  },
  ultrafeedModalHeader: {
    background: shades.dark
      ? "rgba(255,255,255,.95)"
      : "rgba(0,0,0,.98)"
  },
  datePicker: {
    selectedDate: "#428bca",
  },
  editor: {
    commentPanelBackground: shades.dark ? shades.grey[200] : "#ffffff",
    sideCommentEditorBackground: shades.dark ? shades.grey[100] : "#f3f7fb",
    // Color used for background highlighting of CEditor side-comments. In some
    // contexts with short line height (in particular, dialogues), this
    // highlight bleeds over adjacent lines and covers up descenders. Partially
    // mitigate this by making it a high-intensity color at 50% transparency
    // rather than a low-intensity color at full opacity.
    commentMarker: "light-dark(rgba(255,241,82,.5),#80792e)",
    commentMarkerActive: "light-dark(#fdf05d,#cbc14f)",
    // Banner ad compatibility - non-affecting default for light mode
    bannerAdBackground: shades.dark ? "rgba(0,0,0,0.5)" : 'transparent',
  },
  lexicalEditor: {
    // Modal overlay - specific dark grey, not pure black
    modalOverlay: "light-dark(rgba(40, 40, 40, 0.6),rgba(0, 0, 0, 0.7))",
    // Equation/LaTeX editor - purple for math syntax
    equationText: "light-dark(#8421a2,#c77dff)",
    // Blue hover background for edit buttons
    editButtonHover: "light-dark(rgba(60, 132, 244, 0.1),rgba(60, 132, 244, 0.2))",
    // Blue focus ring for selections
    focusRing: "light-dark(rgb(60, 132, 244),rgb(100, 160, 255))",
    // Light blue shadow for mention focus
    mentionFocus: "light-dark(rgb(180, 213, 255),rgb(60, 100, 180))",
    // Coral/orange color for keywords
    keyword: "light-dark(rgb(241, 118, 94),rgb(255, 140, 120))",
    // Blues for comment input box button background
    commentInputBoxButtonBackground: "rgb(66, 135, 245)",
    commentInputBoxButtonHoverBackground: "rgb(53, 114, 211)",
    threadQuoteBackground: "rgba(255, 212, 0, 0.4)",
    codeActionMenuBackground: "rgb(223, 232, 250)",
    tableCellResizerHover: "#adf",
    codeHighlight: {
      tokenComment: "slategray",
      tokenDeleted: "linear-gradient(to right, #ffcecb 50%, #ffebe9 50%) fill 0/0/0 100vw",
      tokenInserted: "linear-gradient(to right, #aceebb 50%, #dafbe1 50%) fill 0/0/0 100vw",
      tokenUnchanged: "linear-gradient(to right, #ddd 50%, #f0f2f5 50%) fill 0/0/0 100vw",
      tokenPunctuation: "#999",
      tokenProperty: "#905",
      tokenSelector: "#690",
      tokenOperator: "#9a6e3a",
      tokenAttr: "#07a",
      tokenVariable: "#e90",
      tokenFunction: "#dd4a68",
    },
  },
  blockquoteHighlight: {
    commentHovered: shades.type === 'light' ? "#dbf0e1" : "#114411",
    individualQuoteHovered: shades.type === 'light' ? "#dbf0e1" : "#114411",
    addedBlockquoteHighlightStyles: "",
  },
  dropdown: {
    background: shades.dark ? shades.grey[100] : grey[0],
    border: shades.dark ? shades.grey[250] : "transparent",
    hoverBackground: shades.dark ? shades.grey[250] : grey[100],
  },
  graph: {
    analyticsReads: "#008800"
  },

  commentParentScrollerHover: shades.greyAlpha(.075),
  tocScrollbarColors: `rgba(255,255,255,0) ${shades.grey[300]}`,
  eventsHomeLoadMoreHover: '#085d6c',

  wrapped: {
    background: '#151515',
    darkBackground: "#000",
    highlightText: '#F09554',
    secondaryText: '#008DAC',
    tertiaryText: "rgba(255, 255, 255, 0.50)",
    black: '#212121',
    darkDot: "rgba(255, 255, 255, 0.40)",
    panelBackground: "rgba(255, 255, 255, 0.10)",
    panelBackgroundDark: "rgba(255, 255, 255, 0.05)",
    postScore: '#BCBCBC',
    notification: "#e05200",
    emptyPath: "#494949",
    metaText: "#b3b3b3",
    personality: {
      transparent: "transparent",
      grey: "#585858",
      red: "#9E011A",
      blue: "#16508C",
      green: "#006336",//"#0b7138",
    },
  },
  forumEvent: {
    draftSticker: "#9BC4CC",
    stickerMobileOverlay: "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.3) 75%, rgba(255, 255, 255, 0) 100%)"
  },
  namesAttachedReactions: {
    selectedAnti: "rgb(255, 189, 189, .23)",
  },

  bookPromotion: {
    twilightLight: "#7a7096",
    twilightDark: "#252141", 
    twilightMid: "#4f3d6b",
    starGold: "rgba(204, 153, 0, 1)",
    starRedShift: "rgba(220, 20, 60, 1)",
  },

  contrastText: shades.grey[0],
  event: 'rgba(67,151,71,.65)',
  group: 'rgba(24,68,155,.65)',
  individual: 'rgba(90,90,90,.65)',
  primary: {
    main: "#5f9b65",
    dark: "#426c46",
    light: "#7faf83",
    contrastText: shades.grey[0],
  },
  secondary: {
    main: "#5f9b65",
    dark: "#426c46",
    light: "#7faf83",
    contrastText: shades.grey[0],
  },
  lwTertiary: {
    main: "#69886e",
    dark: "#21672b",
  },
  action: {
    active: "light-dark(rgba(0, 0, 0, 0.54),#fff)",
    hover: shades.dark ? shades.greyAlpha(0.1) : 'rgba(0, 0, 0, 0.08)',
    hoverOpacity: shades.dark ? 0.1 : 0.08,
    disabled: shades.dark ? shades.greyAlpha(0.3) : 'rgba(0, 0, 0, 0.26)',
    disabledBackground: shades.dark ? shades.greyAlpha(0.12) : 'rgba(0, 0, 0, 0.12)',
  },
  error: {
    main: "#bf360c",
    dark: "#852508",
    light: "#cb5e3c",
    contrastText: shades.grey[0],
  },
  warning: {
    main: "#ff9800",
  },
  fundraisingThermometer: {
    shadow: '#222',
  },
  arbital: {
    arbitalGreen: 'light-dark(#004d40,#02796b)',
  },
  ultraFeed: {
    dim: shades.dark ? shades.grey[400] : shades.grey[600],
    cardSeparator: shades.dark
      ? `12px solid ${shades.greyAlpha(0.15)}`
      : `12px solid ${shades.greyAlpha(0.005)}`,
    readBackground: shades.dark ? shades.grey[200] : shades.grey[300],
    readBackgroundMobile: shades.grey[100],
    readOpacity: {
      root: shades.dark ? 1 : 0.7,
      rootMobile: shades.dark ? 0.9 : 0.7,
      content: shades.dark ? 0.9 : 0.8,
      contentMobile: shades.dark ? 1 : 0.7,
    },
  }
})
