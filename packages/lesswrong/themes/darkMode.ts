// eslint-disable-next-line no-restricted-imports
import type { Color as MuiColorShades } from '@material-ui/core';

function invertHexColor(color: string): string {
  function fromHexDigit(s: string, offset: number): number {
    let ch = s.charCodeAt(offset);
    if (ch>=48 && ch<58) return ch-48; //'0'-'9'
    else if (ch>=97 && ch<=102) return ch-97+10; //'a'-'f'
    else if (ch>=65 && ch<=70) return ch-65+10; //'A'-'F'
    else return 0;
  }
  function parseHexColor(color: string): [number,number,number] {
    const r = (fromHexDigit(color,1)*16) + fromHexDigit(color,2);
    const g = (fromHexDigit(color,3)*16) + fromHexDigit(color,4);
    const b = (fromHexDigit(color,5)*16) + fromHexDigit(color,6);
    return [r,g,b];
  }
  function toHexDigit(n: number) {
    if (n<10) return String.fromCharCode(48+n);
    else return String.fromCharCode(87+n);
  }
  function toHex2(n: number) {
    return toHexDigit(n/16)+toHexDigit(n%16);
  }
  function toHexColor(r: number, g: number, b: number) {
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  }
  
  // Parse and convert to RGB
  const [r,g,b] = parseHexColor(color);
  // Convert into linear color space
  // HACK: Gamma here is tuned empirically for a visual result, not based on
  // anything principled.
  const gamma=1.5;
  const linR = Math.pow(r,gamma);
  const linG = Math.pow(g,gamma);
  const linB = Math.pow(b,gamma);
  // Invert
  const invLinR = Math.pow(255,gamma)-linR;
  const invLinG = Math.pow(255,gamma)-linG;
  const invLinB = Math.pow(255,gamma)-linB;
  // Convert back into gamma color space
  const invR = Math.round(Math.pow(invLinR, 1/gamma));
  const invG = Math.round(Math.pow(invLinG, 1/gamma));
  const invB = Math.round(Math.pow(invLinB, 1/gamma));
  return toHexColor(invR,invG,invB);
}

export const invertedGreyscale = {
  // Present in @material-ui/core/colors/grey
  50: invertHexColor('#fafafa'),
  100: invertHexColor('#f5f5f5'),
  200: invertHexColor('#eeeeee'),
  300: invertHexColor('#e0e0e0'),
  400: invertHexColor('#bdbdbd'),
  500: invertHexColor('#9e9e9e'),
  600: invertHexColor('#757575'),
  700: invertHexColor('#616161'),
  800: invertHexColor('#424242'),
  900: invertHexColor('#212121'),
  A100: invertHexColor('#d5d5d5'),
  A200: invertHexColor('#aaaaaa'),
  A400: invertHexColor('#303030'),
  A700: invertHexColor('#616161'),
  
  // Greyscale colors not in the MUI palette
  0: "black",
  1000: "white",
  
  10: invertHexColor('#fefefe'),
  20: invertHexColor('#fdfdfd'),
  25: invertHexColor('#fcfcfc'),
  30: invertHexColor('#fbfbfb'),
  40: invertHexColor('#f8f8f8'),
  110: invertHexColor("#f3f3f3"),
  120: invertHexColor('#f2f2f2'),
  140: invertHexColor("#f0f0f0"),
  320: invertHexColor("#d9d9d9"),
  340: invertHexColor("#d0d0d0"),
  410: invertHexColor("#b3b3b3"),
  650: invertHexColor('#808080'),
};
export const grey = invertedGreyscale;

const greyAlpha = (alpha: number) => `rgba(255,255,255,${alpha})`;
const boxShadowColor = (alpha: number) => greyAlpha(alpha);
const greyBorder = (thickness: string, alpha: number) => `${thickness} solid ${greyAlpha(alpha)}`;

export const darkModePalette: ThemePalette = {
  text: {
    primary: greyAlpha(.87),
    secondary: greyAlpha(.54),
    normal: greyAlpha(.87),
    maxIntensity: greyAlpha(1.0),
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
    spoilerBlockNotice: "white",
    notificationCount: greyAlpha(0.6),
    notificationLabel: greyAlpha(.66),
    eventType: "#c0a688",
    tooltipText: "white",
    negativeKarmaRed: "#ff8a80",
    moderationGuidelinesEasygoing: 'rgba(100, 169, 105, 0.9)',
    moderationGuidelinesNormEnforcing: '#2B6A99',
    moderationGuidelinesReignOfTerror: 'rgba(179,90,49,.8)',
    charsAdded: "#008800",
    charsRemoved: "#880000",
    invertedBackgroundText: "white",
    invertedBackgroundText2: "rgba(255,255,255,0.7)",
    error: "#9b5e5e",
    error2: "#E04E4B",
    sequenceIsDraft: "rgba(100, 169, 105, 0.9)",
    sequenceTitlePlaceholder: "rgba(255,255,255,.5)",
  },
  link: {
    unmarked: greyAlpha(.87),
    dim: greyAlpha(.5),
    dim2: grey[600],
    dim3: greyAlpha(.4),
    grey800: grey[800],
    tocLink: grey[600],
    tocLinkHighlighted: grey[1000],
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
    dim55: greyAlpha(.55),
    dim600: grey[600],
    dim700: grey[700],
    tooltipUserMetric: "rgba(255,255,255,.8)",
    loadingDots: greyAlpha(.55),
    loadingDotsAlternate: grey[0],
    horizRuleDots: greyAlpha(.26),
    greenCheckmark: "#4caf50",
    onTooltip: "white",
    topAuthor: grey[340],
    
    commentsBubble: {
      commentCount: "white",
      noUnread: greyAlpha(.22),
      newPromoted: "rgb(160, 225, 165)",
    },
  },
  border: {
    normal: greyBorder("1px", .2),
    itemSeparatorBottom: greyBorder("1px", .2),
    slightlyFaint: greyBorder("1px", .15),
    slightlyIntense: greyBorder("1px", .25),
    slightlyIntense2: greyBorder("1px", .3),
    slightlyIntense3: greyBorder("1px", .4),
    intense: greyBorder("2px", .5),
    faint: greyBorder("1px", .1),
    extraFaint: greyBorder("1px", .08),
    grey300: `1px solid ${grey[300]}`,
    grey400: `1px solid ${grey[400]}`,
    maxIntensity: greyBorder("1px", 1.0),
    tableHeadingDivider: greyBorder("2px", 1.0),
    table: `1px double #${grey[410]}`,
    tableCell: `1px double #${grey[320]}`,
    transparent: greyBorder("1px", 0.0),
    emailHR: "1px solid #aaa",
    sunshineNewUsersInfoHR: "1px solid #ccc",
    appBarSubtitleDivider: `1px solid ${grey[400]}`,
    commentBorder: "1px solid rgba(72,94,144,0.16)",
    answerBorder: "2px solid rgba(72,94,144,0.16)",
    tooltipHR: "solid 1px rgba(255,255,255,.2)",
  },
  background: {
    default: grey[40],
    paper: grey[0], //Used by MUI
    pageActiveAreaBackground: grey[0],
    diffInserted: "#d4ead4",
    diffDeleted: "#f0d3d3",
    usersListItem: greyAlpha(.05),
  },
  panelBackground: {
    default: grey[0],
    translucent: "rgba(255,255,255,.87)",
    translucent2: "rgba(255,255,255,.8)",
    hoverHighlightGrey: greyAlpha(.1),
    postsItemHover: grey[50],
    formErrors: greyAlpha(0.25),
    darken03: greyAlpha(.03),
    darken04: greyAlpha(.04),
    darken05: greyAlpha(.05),
    darken08: greyAlpha(.08),
    darken20: greyAlpha(.2),
    darken25: greyAlpha(.25),
    darken40: greyAlpha(.4),
    
    adminHomeRecentLogins: "rgba(50,100,50,.1)",
    adminHomeAllUsers: "rgba(100,50,50,.1)",
    deletedComment: "#ffefef",
    newCommentFormModerationGuidelines: greyAlpha(.07),
    commentNodeEven: grey[120],
    commentNodeOdd: grey[25],
    commentModeratorHat: "#5f9b651c",
    commentHighlightAnimation: grey[300],
    postsItemExpandedComments: grey[50],
    metaculusBackground: "#2c3947",
    spoilerBlock: "black",
    revealedSpoilerBlock: greyAlpha(.12),
    tableHeading: grey[50],
    notificationMenuTabBar: grey[100],
    recentDiscussionThread: grey[20],
    tooltipBackground: "rgba(75,75,75,.94)",
    tenPercent: greyAlpha(.1),
    sunshineReportedContent: "rgba(60,0,0,.08)",
    sunshineFlaggedUser: "rgba(150,0,0,.05)",
    sunshineNewPosts: "rgba(0,80,0,.08)",
    sunshineNewComments: "rgba(120,120,0,.08)",
    sunshineNewTags: "rgba(80,80,0,.08)",
    sunshineWarningHighlight: "rgba(255,50,0,.2)",
    mobileNavFooter: grey[0],
    singleLineComment: grey[140],
    singleLineCommentHovered: grey[300],
    singleLineCommentOddHovered: grey[110],
    sequenceImageGradient: 'linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 42%, rgba(255, 255, 255, 0) 100%)'
  },
  boxShadow: {
    default: `0 1px 5px {boxShadowColor(.025)}`,
    moreFocused: `0 1px 3px ${boxShadowColor(.1)}`,
    faint: `0 1px 5px ${boxShadowColor(.1)}`,
    
    notificationsDrawer: `${boxShadowColor(.16)} 0px 3px 10px, ${boxShadowColor(.23)} 0px 3px 10px`,
    appBar: `0 1px 1px ${boxShadowColor(.05)}, 0 1px 1px ${boxShadowColor(.05)}`,
    sequencesGridItemHover: `0 1px 3px ${boxShadowColor(.1)}`,
    eventCard: `0 1px 3px ${boxShadowColor(.1)}`,
    mozillaHubPreview: `0px 0px 10px ${boxShadowColor(.1)}`,
    featuredResourcesCard: `0 4px 4px ${boxShadowColor(.07)}`,
    spreadsheetPage1: `2px 0 2px -1px ${boxShadowColor(.15)}`,
    spreadsheetPage2: `0 0 3px ${boxShadowColor(.3)}`,
    collectionsCardHover: `0 0 3px ${boxShadowColor(.1)}`,
    parentComment: `0 0 10px ${boxShadowColor(.2)}`,
    sunshineSidebarHoverInfo: `-3px 0 5px 0px ${boxShadowColor(.1)}`,
    sunshineSendMessage: `0 0 10px ${boxShadowColor(.5)}`,
    lwCard: `0 0 10px ${boxShadowColor(.2)}`,
  },
  buttons: {
    hoverGrayHighlight: greyAlpha(0.05),
    
    startReadingButtonBackground: greyAlpha(0.05),
    recentDiscussionSubscribeButtonText: "white",
    featuredResourceCTAtext: "white",
    primaryDarkText: "white",
    feedExpandButton: {
      background: "white",
      plusSign: "#666",
      border: "1px solid #ddd",
    },
    notificationsBellOpen: {
      background: greyAlpha(0.4),
      icon: grey[0],
    },
  },
  tag: {
    background: grey[200],
    border: `solid 1px ${grey[200]}`,
    coreTagBorder: greyBorder("1px", .12),
    text: greyAlpha(.9),
    boxShadow: `1px 2px 5px ${boxShadowColor(.2)}`,
    hollowTagBackground: grey[0],
    addTagButtonBackground: grey[300],
  },
  geosuggest: {
    dropdownBackground: "white",
    dropdownActiveBackground: "#267dc0",
    dropdownActiveText: "white",
    dropdownHoveredBackground: "#f5f5f5",
    dropdownActiveHoveredBackground: "#ccc",
  },
  
  commentParentScrollerHover: greyAlpha(.075),
  headerTextColor: greyAlpha(0.87),
  tocScrollbarColors: `rgba(255,255,255,0) ${grey[300]}`,
  
  grey,
  contrastText: grey[0],
  event: '#2b6a99',
  group: '#588f27',
  individual: '#3f51b5',
  headerType: "default",
  type: "dark",
  
  primary: {
    main: "#5f9b65",
    dark: "#426c46",
    light: "#7faf83",
    contrastText: grey[0],
  },
  secondary: {
    main: "#5f9b65",
    dark: "#426c46",
    light: "#7faf83",
    contrastText: grey[0],
  },
  lwTertiary: {
    main: "#69886e",
    dark: "#21672b",
  },
  error: {
    main: "#bf360c",
    dark: "#852508",
    light: "#cb5e3c",
    contrastText: grey[0],
  },
}
