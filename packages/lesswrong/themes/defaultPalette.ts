//
// All About the Themes, the Theme Palette and Colors
// ==================================================
// There are two themes active at a time: the user theme and the site theme. The
// user theme is a user-configurable preference representing whether to use
// light mode, dark mode, etc. The site theme represents the styling differences
// between LessWrong, EA Forum, Alignment Forum, Progress Studies Forum, and
// whatever other sites share the codebase.
//
// Helper color functions are defined in `colorUtil.ts`.
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

import { grey, greyAlpha, inverseGreyAlpha, primaryAlpha, boxShadowColor, greyBorder, invertIfDarkMode } from "./colorUtil";
import { isBlackBarTitle } from '../components/seasonal/petrovDay/petrov-day-story/petrovConsts';
import { isAF } from '@/lib/instanceSettings';

export const sansSerifStack = [
  'GreekFallback', // Ensures that greek letters render consistently
  'Calibri',
  'gill-sans-nova',
  '"Gill Sans"',
  '"Gill Sans MT"',
  "Myriad Pro",
  'Myriad',
  '"Liberation Sans"',
  '"Nimbus Sans L"',
  'Tahoma',
  'Geneva',
  '"Helvetica Neue"',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

const afSansSerifStack = [
  'GreekFallback', // Ensures that greek letters render consistently
  '"freight-sans-pro"',
  'Frutiger',
  '"Frutiger Linotype"',
  'Univers',
  'Calibri',
  '"Gill Sans"',
  '"Gill Sans MT"',
  "Myriad Pro",
  'Myriad',
  '"Liberation Sans"',
  '"Nimbus Sans L"',
  'Tahoma',
  'Geneva',
  '"Helvetica Neue"',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

const serifStackBody = [
  'warnock-pro',
  'Palatino',
  '"Palatino Linotype"',
  '"Palatino LT STD"',
  '"Book Antiqua"',
  'Georgia',
  'serif'
]

export const serifStack = serifStackBody.join(',')
export const headerStack = ["ETBookRoman", ...serifStackBody].join(',')

export const defaultComponentPalette = (dark: boolean, isAF: boolean) => ({
  type: dark ? "dark" : "light",
  grey,
  greyAlpha,
  inverseGreyAlpha,
  primaryAlpha,
  boxShadowColor,
  greyBorder,
  invertIfDarkMode,
  fonts: {
    sansSerifStack: isAF ? afSansSerifStack : sansSerifStack,
    serifStack: isAF ? afSansSerifStack : serifStack,
    headerStack: isAF ? afSansSerifStack : headerStack,
  },
  typography: {
    postStyle: {
      fontVariantNumeric: isAF ? "lining-nums" : undefined,
    },
    commentStyle: {
      fontVariantNumeric: isAF ? "lining-nums" : undefined,
      '& b, & strong': isAF ? undefined : { fontWeight: 600 },
    },
    display2: {
      fontWeight: isAF ? 500 : 400,
    },
    display3: {
      fontWeight: isAF ? 500 : 400,
    },
  },
  text: {
    primary: greyAlpha(.87),
    secondary: greyAlpha(.54),
    normal: greyAlpha(.87),
    maxIntensity: greyAlpha(1.0),
    disabled: "light-dark(rgba(0,0,0,0.38),rgba(255,255,255,0.5))",
    slightlyIntense: greyAlpha(.92),
    slightlyIntense2: greyAlpha(.9),
    slightlyDim: greyAlpha(.8),
    slightlyDim2: greyAlpha(.7),
    dim: greyAlpha(.5),
    dim2: grey[800],
    dim3: grey[600],
    dim4: grey[500],
    dim700: grey[700],
    dim40: greyAlpha(.4),
    dim45: greyAlpha(.45),
    dim55: greyAlpha(.55),
    dim60: greyAlpha(.6),
    grey: grey[650],
    spoilerBlockNotice: "#fff",
    notificationCount: greyAlpha(0.6),
    notificationLabel: greyAlpha(.66),
    eventType: "#c0a688",
    tooltipText: "#fff",
    tooltipTextDim: "#c2c2c2",
    negativeKarmaRed: "#ff8a80",
    charsAdded: "#008800",
    charsRemoved: "#880000",
    invertedBackgroundText: inverseGreyAlpha(1),
    invertedBackgroundText2: inverseGreyAlpha(0.7),
    invertedBackgroundText3: inverseGreyAlpha(0.5),
    invertedBackgroundText4: inverseGreyAlpha(0.8),
    primaryAlert: "light-dark(#69886e,#b2c5b5)",
    error: "#9b5e5e",
    error2: "#E04E4B",
    warning: "light-dark(#832013,#FFF7E6)",
    red: "#ff0000",
    alwaysWhite: "#fff",
    alwaysBlack: "#000",
    alwaysLightGrey: "#e0e0e0",
    sequenceIsDraft: "rgba(100, 169, 105, 0.9)",
    sequenceTitlePlaceholder: inverseGreyAlpha(0.5),
    primaryDarkOnDim: "light-dark(#085d6c,#a8cad7)", // text that is meant to be shown on the primaryDim background color
    reviewWinner: {
      title: greyAlpha(.75),
      author: greyAlpha(.65),
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
    bannerAdOverlay: grey[1000], // Use normal text color for light mode
    bannerAdDim: greyAlpha(.6),
    bannerAdDim2: greyAlpha(.9),
    bannerAdDim3: greyAlpha(.25),
  },
  link: {
    unmarked: greyAlpha(.87),
    dim: greyAlpha(.5),
    dim2: grey[600],
    dim3: greyAlpha(.4),
    grey800: grey[800],
    tocLink: grey[600],
    tocLinkHighlighted: grey[1000],
    color: isAF ? "light-dark(#3f51b5,#7581d1)" : "light-dark(#327E09,#788e6a)",
    primaryDim: "light-dark(#5caab7,#3a7883)",
    visited: isAF ? "light-dark(#8c4298,#798754)" : "#798754",
  },
  linkHover: {
    dim: greyAlpha(.3),
  },
  icon: {
    normal: greyAlpha(.87),
    maxIntensity: greyAlpha(1.0),
    slightlyDim: greyAlpha(.8),
    slightlyDim2: greyAlpha(.75),
    slightlyDim3: greyAlpha(.7),
    slightlyDim4: greyAlpha(.6),
    dim: greyAlpha(.5),
    dim2: greyAlpha(.4),
    dim3: grey[400],
    dim4: grey[500],
    dim5: greyAlpha(.3),
    dim6: greyAlpha(.2),
    dim05: greyAlpha(.08),
    dim55: greyAlpha(.55),
    dim600: grey[600],
    dim700: grey[700],
    tooltipUserMetric: "rgba(255,255,255,.8)",
    loadingDots: greyAlpha(.55),
    loadingDotsAlternate: grey[0],
    horizRuleDots: greyAlpha(.26),
    onTooltip: "#fff",
    inverted: grey[0],
    navigationSidebarIcon: greyAlpha(1.0),
    sprout: '#69886e',
    yellow: '#ffc500',
    recentDiscussionGreen: "#72B065",
    recentDiscussionGrey: "#757575",
    headerKarma: "#ffad08",
    activeDotOrange: "#fdbd48",

    commentsBubble: {
      commentCount: "#fff",
      noUnread: greyAlpha(.22),
      newPromoted: "rgb(160, 225, 165)",
    },
  },
  border: {
    normal: greyBorder("1px", .2),
    itemSeparatorBottom: dark ? greyBorder("1px", .2) : greyBorder("2px", .05),
    itemSeparatorBottomStrong: dark ? greyBorder("1px", .3) : greyBorder("2px", .1),
    itemSeparatorBottomIntense: greyBorder("2px", .2),
    readUltraFeedBorder: `2px solid ${grey[200]}`,
    slightlyFaint: greyBorder("1px", .15),
    slightlyIntense: greyBorder("1px", .25),
    slightlyIntense2: greyBorder("1px", .3),
    slightlyIntense3: greyBorder("1px", .4),
    intense: greyBorder("2px", .5),
    faint: greyBorder("1px", .1),
    extraFaint: greyBorder("1px", .08),
    grey200: `1px solid ${grey[200]}`,
    grey300: `1px solid ${grey[300]}`,
    grey400: `1px solid ${grey[400]}`,
    grey800: `1px solid ${grey[800]}`,
    maxIntensity: greyBorder("1px", 1.0),
    table: `1px double ${grey[410]}`,
    transparent: greyBorder("1px", 0.0),
    sunshineNewUsersInfoHR: "1px solid #ccc",
    appBarSubtitleDivider: `1px solid ${grey[400]}`,
    commentBorder: "1px solid light-dark(rgba(72,94,144,0.16),rgba(255,255,255,.2))",
    answerBorder: "2px solid light-dark(rgba(72,94,144,0.16),rgba(255,255,255,.2))",
    tooltipHR: "solid 1px rgba(255,255,255,.2)",
    primaryHighlight: "light-dark(#88c9d4,#314a4e)",
    primaryHighlight2: "light-dark(#bae2e8,#314a4e)",
    secondaryHighlight: "light-dark(#aedba3,#3e503a)",
    secondaryHighlight2: "light-dark(#d8edd3,#3e503a)",
    primaryTranslucent: 'rgba(12,134,155,.7)',
    mentionsBaloon: "light-dark(#c4c4c4,#f5f5f5)",
  },
  background: {
    default: isAF ? (dark ? grey[100] : grey[60]) : "light-dark(#f8f4ee,#262626)",
    paper: grey[0], //Used by MUI
    contrastInDarkMode: "light-dark(#ffffff,#f5f5f5)",
    pageActiveAreaBackground: grey[0],
    profilePageBackground: "light-dark(#fcfbf8,#262626)",
    hover: '#f0ebe6',
    translucentBackground: "light-dark(rgba(255,255,255,.5),rgba(0,0,0,.5))",
    translucentBackgroundHeavy: "light-dark(rgba(255,255,255,.75),rgba(0,0,0,.75))",
    diffInserted: "light-dark(#d4ead4,#205120)",
    diffDeleted: "light-dark(#f0d3d3,#b92424)",
    primaryDim: "light-dark(#e2f1f4,#28383e)",
    primarySlightlyDim: "light-dark(#d1ecf1,#00494e)",
    primaryTranslucent: "light-dark(rgba(95,155,101,0.1),rgba(99,141,103,0.3))",
    primaryTranslucentHeavy: "light-dark(rgba(95,155,101,0.35),rgba(99,141,103,0.6))",
    warningTranslucent: "light-dark(rgba(255,152,0,0.1),rgba(255,173,8,0.3))",
    // this is used to address a specific iOS Safari-related issue with linear-gradient:
    // https://stackoverflow.com/questions/70446857/safari-linear-gradient
    transparent: inverseGreyAlpha(0),
    digestAdBannerInput: dark ? grey[300] : grey[0],
    glossaryBackground: "light-dark(rgba(190,120,80,.05),rgba(180,160,160,.1))",
    sidenoteBackground: "light-dark(rgba(190,120,80,.05),rgba(180,160,160,.1))",
  },
  panelBackground: {
    default: grey[0],
    translucent: "light-dark(rgba(255,255,255,.87),rgba(0,0,0,.87))",
    translucent2: "light-dark(rgba(255,255,255,.8),rgba(0,0,0,.8))",
    translucent3: "light-dark(rgba(255,255,255,.75),rgba(0,0,0,.75))",
    translucent4: "light-dark(rgba(255,255,255,.5),rgba(0,0,0,.6))",
    hoverHighlightGrey: greyAlpha(.1),
    postsItemHover: grey[50],
    formErrors: greyAlpha(0.25),
    darken02: greyAlpha(.02),
    darken03: greyAlpha(.03),
    darken04: greyAlpha(.04),
    darken05: greyAlpha(.05),
    darken08: greyAlpha(.08),
    darken10: greyAlpha(.1),
    darken15: greyAlpha(.15),
    darken20: greyAlpha(.2),
    darken25: greyAlpha(.25),
    darken40: greyAlpha(.4),
    
    deletedComment: "light-dark(#ffefef,#3a0505)",
    commentNodeEven: dark ? grey[50] : grey[120],
    commentNodeOdd: grey[25],
    commentNodeRoot: grey[0],
    commentModeratorHat: "light-dark(#ecf2ed,#202719)",
    commentHighlightAnimation: grey[300],
    postsItemExpandedComments: grey[50],
    metaculusBackground: "#2c3947",
    spoilerBlock: "light-dark(#000,#1b1b1b)",
    revealedSpoilerBlock: greyAlpha(.12),
    notificationMenuTabBar: grey[100],
    recentDiscussionThread: "light-dark(#fdfdfd,rgba(0,0,0,0.4))",
    tooltipBackground: "rgba(75,75,75,.94)",
    tooltipBackground2: "#373737",
    loginInput: "#efefef",
    loginInputHovered: "#e4e4e4",
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
    mobileNavFooter: grey[0],
    singleLineComment: dark ? 'unset' : grey[140],
    singleLineCommentHovered: grey[300],
    singleLineCommentOddHovered: grey[110],
    sequenceImageGradient: 'linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 42%, rgba(255, 255, 255, 0) 100%)',
    sequencesBanner: greyAlpha(.5),
    cookieBanner: dark ? grey[900] : grey[800],
    strawpoll: "rgba(251, 191, 36, 1)", // Color used by StrawPoll
    reviewGold: 'lch(68 34.48 85.39 / 76%)',
    placeholderGradient: 'linear-gradient(90deg, #EEE 33%, #E6E6E6 50%, #EEE 66%)',
    tagLensTab: dark ? greyAlpha(.15) : greyAlpha(.1),
    // Banner ad compatibility - backgrounds (set to non-affecting defaults for light mode)
    bannerAdTranslucent: dark ? "rgba(0,0,0,0.2)" : grey[0], // Use default background for light mode
    bannerAdTranslucentHeavy: dark ? "rgba(0,0,0,0.3)" : grey[0],
    bannerAdTranslucentLight: dark ? "rgba(0,0,0,0.1)" : grey[0],
    bannerAdTranslucentMedium: dark ? "rgba(0,0,0,0.4)" : grey[0],
    bannerAdTranslucentDeep: dark ? "rgba(0,0,0,0.5)" : grey[0],
    bannerAdTranslucentStrong: dark ? "rgba(0,0,0,0.6)" : grey[0],
    appBarDarkBackground: dark ? 'rgba(255,255,255,0.1)' : 'none'
  },
  boxShadow: {
    default: `0 1px 5px ${boxShadowColor(.025)}`,
    moreFocused: `0 1px 3px ${boxShadowColor(.1)}`,
    faint: `0 1px 5px ${boxShadowColor(.1)}`,
    
    notificationsDrawer: `${boxShadowColor(.16)} 0px 3px 10px, ${boxShadowColor(.23)} 0px 3px 10px`,
    appBar: dark
      ? "none"
      : `0 1px 1px ${boxShadowColor(.05)}, 0 1px 1px ${boxShadowColor(.05)}`,
    appBarDarkBackground: `0 1px 1px ${boxShadowColor(.05)}, 0 1px 1px ${boxShadowColor(.05)}`,
    sequencesGridItemHover: `0 1px 3px ${boxShadowColor(.1)}`,
    eventCard: `0 1px 3px ${boxShadowColor(.1)}`,
    featuredResourcesCard: `0 4px 4px ${boxShadowColor(.07)}`,
    spreadsheetPage1: `2px 0 2px -1px ${boxShadowColor(.15)}`,
    spreadsheetPage2: `0 0 3px ${boxShadowColor(.3)}`,
    collectionsCardHover: `0 0 3px ${boxShadowColor(.1)}`,
    comment: `0 0 10px ${boxShadowColor(.2)}`,
    sunshineSidebarHoverInfo: `-3px 0 5px 0px ${boxShadowColor(.1)}`,
    sunshineSendMessage: `0 0 10px ${boxShadowColor(.5)}`,
    lwCard: `0 0 10px ${boxShadowColor(.2)}`,
    eaCard: `0 4px 8px ${boxShadowColor(0.12)}`,
    searchResults: `0 0 20px ${boxShadowColor(.2)}`,
    recentDiscussionMeetupsPoke: `5px 5px 5px ${boxShadowColor(.2)}`,
    graphTooltip: dark ? "none" : `0 4px 8px ${boxShadowColor(0.12)}`,
    lwTagHoverOver: `0 1px 3px 0 ${boxShadowColor(0.2)},0 1px 1px 0 ${boxShadowColor(0.14)},0 2px 1px -1px ${boxShadowColor(0.12)}`,
  },
  buttons: {
    hoverGrayHighlight: greyAlpha(0.05),
    alwaysPrimary: "#5f9b65",
    startReadingButtonBackground: greyAlpha(0.05),
    recentDiscussionSubscribeButtonText: "#fff",
    featuredResourceCTAtext: "#fff",
    primaryDarkText: "#fff",
    
    groupTypesMultiselect: {
      background: "rgba(100,169,105, 0.9)",
      hoverBackground: "rgba(100,169,105, 0.5)",
    },
    imageUpload: {
      background: greyAlpha(.5),
      hoverBackground: greyAlpha(.35),
    },
    imageUpload2: {
      // Because this displays over an image, make it the same in both light and dark mode
      background: 'rgba(0,0,0,0.6)',
      hoverBackground: 'rgba(0,0,0,0.8)',
    },
    bookCheckoutButton: "#53a55a",
    mentions: {
      hover: dark ? grey[100] : "#e6e6e6",
      selected: "light-dark(#198cf0,#0c70c7)",
      selectedHover: "light-dark(#0e7fe1,#0b62ae)",
    },
    shareWithClaude: "rgba(217,119,87)",
    shareWithClaudeHover: "rgba(179,88,61)",
  },
  intercom: {
    buttonBackground: "light-dark(#f5f5f5,#424242) !important",
  },
  sideItemIndicator: {
    sideComment: '#5f9b65',
    inlineReaction: 'lch(68 34.48 85.39 / 76%)',
    footnote: greyAlpha(0.4),
  },
  tag: {
    text: greyAlpha(.9),
    background: grey[200],
    border: `solid 1px ${grey[200]}`,
    coreTagText: grey[600],
    coreTagBackground: grey[0],
    coreTagBorder: greyBorder("1px", .15),
    hollowTagBackground: grey[0],
    hollowTagBorder: greyBorder("1px", .15),
    boxShadow: `1px 2px 5px ${boxShadowColor(.2)}`,
    addTagButtonBackground: grey[300],
    onboardingBackground: "rgba(0, 0, 0, 0.4)",
    onboardingBackgroundHover: "rgba(0, 0, 0, 0.2)",
    onboardingBackgroundSelected: "rgba(0, 0, 0, 0.5)",
  },
  tab: {
    inactive: {
      text: dark ? grey[600] : grey[500],
      hover: {
        text: grey[700]
      },
      // Banner ad compatibility - non-affecting defaults for light mode
      bannerAdBackground: dark ? "rgba(0,0,0,0.3)" : 'transparent',
      bannerAdBackgroundBlur: 'transparent',
    },
    active: {
      background: "rgba(127, 175, 131, 1)",
      text: grey[0],
      hover: {
        background: "rgba(127, 175, 131, 0.7)",
      },
      // Banner ad compatibility - non-affecting default for light mode
      bannerAdOpacity: dark ? 0.8 : 1,
    },
  },
  // Banner ad compatibility - CSS filters (non-affecting defaults for light mode)
  filters: {
    bannerAdBlur: dark ? 'blur(10px)' : 'none',
    bannerAdBlurLight: dark ? 'blur(2px)' : 'none',
    bannerAdBlurMedium: dark ? 'blur(4px)' : 'none',
    bannerAdBlurHeavy: dark ? 'blur(8px)' : 'none',
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
    activeProgress: isAF ? "rgba(63,81,181, .5)" : 'rgba(127, 175, 131, 0.5)',
    progressBar: isAF ? "rgba(63,81,181, 1)" : 'rgba(127, 175, 131, 0.7)',
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
    text: isAF ? (dark ? "#ffffff" : "rgba(0,0,0,0.87)") : greyAlpha(.87),
    background: isAF
      ? (dark ? "rgba(0,0,0,0.5)" : "#ffffff")
      : (
        dark
          ? "rgba(50,50,50,.75)"
          : isBlackBarTitle ? inverseGreyAlpha(.1) : inverseGreyAlpha(.65)
      ),
  },
  ultrafeedModalHeader: {
    background: isAF
      ? (dark ? "rgba(255,255,255,.95)" : "rgba(0,0,0,.98)")
      : (
        dark
          ? "rgba(50,50,50,.98)"
          : (isBlackBarTitle
            ? "rgba(255,255,255,.4)"
            : "rgba(255,255,255,.95)"
          )
      )
  },
  datePicker: {
    selectedDate: "#428bca",
  },
  editor: {
    commentPanelBackground: dark ? grey[200] : "#ffffff",
    sideCommentEditorBackground: dark ? grey[100] : "#f3f7fb",
    // Color used for background highlighting of CEditor side-comments. In some
    // contexts with short line height (in particular, dialogues), this
    // highlight bleeds over adjacent lines and covers up descenders. Partially
    // mitigate this by making it a high-intensity color at 50% transparency
    // rather than a low-intensity color at full opacity.
    commentMarker: "light-dark(rgba(255,241,82,.5),#80792e)",
    commentMarkerActive: "light-dark(#fdf05d,#cbc14f)",
    // Banner ad compatibility - non-affecting default for light mode
    bannerAdBackground: dark ? "rgba(0,0,0,0.5)" : 'transparent',
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
    commentHovered: "light-dark(#dbf0e1,#114411)",
    individualQuoteHovered: "light-dark(#dbf0e1,#114411)",
    addedBlockquoteHighlightStyles: "",
  },
  dropdown: {
    background: dark ? grey[100] : grey[0],
    border: dark ? grey[250] : "transparent",
    hoverBackground: dark ? grey[250] : grey[100],
  },
  graph: {
    analyticsReads: "#008800"
  },

  commentParentScrollerHover: greyAlpha(.075),
  tocScrollbarColors: `rgba(255,255,255,0) ${grey[300]}`,
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

  contrastText: grey[0],
  event: 'rgba(67,151,71,.65)',
  group: 'rgba(24,68,155,.65)',
  individual: 'rgba(90,90,90,.65)',
  primary: {
    main: isAF ? (dark ? "#7581d1" : "#3f51b5") : "#5f9b65",
    dark: isAF ? (dark ? "#7986cb" : "#303f9f") : "#426c46",
    light: isAF ? (dark ? "#5968c9" : "#7986cb") : "#7faf83",
    contrastText: grey[0],
  },
  secondary: {
    main: isAF ? "#3f51b5" : "#5f9b65",
    dark: isAF ? "#303f9f" : "#426c46",
    light: isAF ? "#7986cb" : "#7faf83",
    contrastText: grey[0],
  },
  lwTertiary: {
    main: isAF ? (dark ? "#7799a4" : "#607e88") : "#69886e",
    dark: isAF ? (dark ? "#7799a4" : "#607e88") : "#21672b",
  },
  action: {
    active: "light-dark(rgba(0, 0, 0, 0.54),#fff)",
    hover: dark ? greyAlpha(0.1) : 'rgba(0, 0, 0, 0.08)',
    hoverOpacity: dark ? 0.1 : 0.08,
    disabled: dark ? greyAlpha(0.3) : 'rgba(0, 0, 0, 0.26)',
    disabledBackground: dark ? greyAlpha(0.12) : 'rgba(0, 0, 0, 0.12)',
  },
  error: {
    main: "#bf360c",
    dark: "#852508",
    light: "#cb5e3c",
    contrastText: grey[0],
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
    dim: dark ? grey[400] : grey[600],
    cardSeparator: dark
      ? `12px solid ${greyAlpha(0.15)}`
      : `12px solid ${greyAlpha(0.005)}`,
    readBackground: isAF ? (dark ? grey[200] : grey[300]) : (dark ? grey[200] : '#ffffffb3'),
    readBackgroundMobile: grey[100],
    readOpacity: {
      root: dark ? 1 : 0.7,
      rootMobile: dark ? 0.9 : 0.7,
      content: dark ? 0.9 : 0.8,
      contentMobile: dark ? 1 : 0.7,
    },
  }
});
