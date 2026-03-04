import type { PartialDeep } from 'type-fest'
import { invertHexColor, invertColor, colorToString, zeroTo255 } from '../colorUtil';

// CkEditor allows users to provide colors for table cell backgrounds and
// borders, which get embedded into the HTML looking like this:
//   <td style="background-color: rgb(1,2,3)">
// User-provided colors can be in any format that CSS accepts, and may set
// the `background-color` and `border` properties on <table> and <td>
// elements.
//
// We handle this in ContentItemBody with transformStylesForDarkMode. The
// colors below have dedicated color-mappings; all other colors use `parseColor`
// and `invertColor` from `colorUtil.ts`.
const getManualColorReplacements = () => ({
  "initial":            "rgba(255,255,255,.87)",
  "rgba(255,255,255,.5)": "rgba(0,0,0.5)",
  "hsl(0, 0%, 90%)":    "hsl(0, 0%, 10%)",
  "#F2F2F2":            invertHexColor("#f2f2f2"),
  "rgb(255, 247, 222)": "rgb(50,30,0)",
  "rgb(255, 255, 255)": invertHexColor("#ffffff"),
  "hsl(0,0%,100%)":     invertHexColor("#ffffff"),
  "#FFEEBB":            invertHexColor("#ffeebb"),
  "rgb(255, 238, 187)": colorToString(invertColor([255/255.0,238/255.0,187/255.0,1])),
  "rgb(230, 230, 230)": colorToString(invertColor([230/255.0,230/255.0,230/255.0,1])),
} as const);
const colorReplacementsCache = getManualColorReplacements();
export const getColorReplacementsCache = (): Record<string,string> => colorReplacementsCache;

export const getDarkModeTheme = (): UserThemeSpecification => ({
  shadePalette: {
    dark: true,
    type: "dark",
  },
  componentPalette: (shadePalette: ThemeShadePalette) => ({
    text: {
      disabled: shadePalette.greyAlpha(0.5),
      primaryAlert: '#b2c5b5',
      warning: '#FFF7E6',
      alwaysWhite: '#fff',
      primaryDarkOnDim: '#a8cad7',
      reviewWinner: {
        title: shadePalette.greyAlpha(0.75),
        author: shadePalette.greyAlpha(0.65)
      },
      jargonTerm: "#a8742a",
      // Banner ad compatibility - text colors that work well over background images
      bannerAdOverlay: '#fff',
      bannerAdDim: 'rgba(255,255,255,0.6)',
      bannerAdDim2: 'rgba(255,255,255,0.9)',
      bannerAdDim3: 'rgba(255,255,255,0.25)',
    },
    link: {
      color: '#788e6a',
      primaryDim: '#3a7883',
      visited: "#798754",
    },
    panelBackground: {
      translucent: "rgba(0,0,0,.87)",
      translucent2: "rgba(0,0,0,.8)",
      translucent3: "rgba(0,0,0,.75)",
      translucent4: "rgba(0,0,0,.6)",
      deletedComment: "#3a0505",
      commentNodeEven: shadePalette.grey[50],
      commentNodeOdd: shadePalette.grey[25],
      commentNodeRoot: shadePalette.grey[0],
      commentModeratorHat: "#202719",
      singleLineComment: 'unset',
      spoilerBlock: "#1b1b1b",
      cookieBanner: shadePalette.grey[900],
      tagLensTab: shadePalette.greyAlpha(.15),
      // Banner ad compatibility - translucent backgrounds with blur effects
      bannerAdTranslucent: "rgba(0,0,0,0.2)",
      bannerAdTranslucentHeavy: "rgba(0,0,0,0.3)",
      bannerAdTranslucentLight: "rgba(0,0,0,0.1)",
      bannerAdTranslucentMedium: "rgba(0,0,0,0.4)",
      bannerAdTranslucentDeep: "rgba(0,0,0,0.5)",
      bannerAdTranslucentStrong: "rgba(0,0,0,0.6)",
      recentDiscussionThread: 'rgba(0,0,0,0.4)',
      appBarDarkBackground: 'rgba(255,255,255,0.1)',
      sunshineNewContentGroup: "linear-gradient(135deg, rgba(0,80,0,.50) 0%, rgba(0,80,0,0) 100%)",
      sunshineHighContextGroup: "linear-gradient(135deg, rgba(120,120,0,.50) 0%, rgba(36, 36, 9, 0) 100%)",
      sunshineMaybeSpamGroup: "linear-gradient(135deg, rgba(120,0,120,.50) 0%, rgba(120,0,120,0) 100%)",
      sunshineAutomodGroup: "linear-gradient(135deg, rgba(120,120,0,.50) 0%, rgba(120,120,0,0) 100%)",
      sunshineSnoozeExpiredGroup: "linear-gradient(135deg, rgba(120,120,0,.50) 0%, rgba(120,120,0,0) 100%)",
      sunshineUnknownGroup: "linear-gradient(135deg, rgba(120,120,120,.50) 0%, rgba(120,120,120,0) 100%)",
    },
    background: {
      default: shadePalette.grey[100],
      contrastInDarkMode: shadePalette.grey[100],
      profilePageBackground: "#262626",
      diffInserted: "#205120",
      diffDeleted: "#b92424",
      primaryDim: "#28383e",
      primarySlightlyDim: "#00494e",
      primaryTranslucent: "rgba(99,141,103,0.3)",
      primaryTranslucentHeavy: "rgba(99,141,103,0.6)",
      warningTranslucent: "rgba(255,173,8,0.3)",
      transparent: 'transparent',
      digestAdBannerInput: shadePalette.grey[300],
      glossaryBackground: "rgba(180,160,160,.1)",
      sidenoteBackground: "rgba(180,160,160,.1)",
      translucentBackgroundHeavy: "rgba(0,0,0,.75)",
      translucentBackground: "rgba(0,0,0,.5)",
    },
    border: {
      itemSeparatorBottom: shadePalette.greyBorder("1px", .2),
      itemSeparatorBottomStrong: shadePalette.greyBorder("1px", .3),
      commentBorder: "1px solid rgba(255,255,255,.2)",
      answerBorder: "2px solid rgba(255,255,255,.2)",
      primaryHighlight: '#314a4e',
      primaryHighlight2: '#314a4e',
      secondaryHighlight: '#3e503a',
      secondaryHighlight2: '#3e503a',
      mentionsBaloon: shadePalette.grey[100],
      eaButtonGreyOutline: "#5F5F5F",
    },
    boxShadow: {
      graphTooltip: "none",
      appBar: "none",
      appBarDarkBackground: `0 1px 1px ${shadePalette.boxShadowColor(.05)}, 0 1px 1px ${shadePalette.boxShadowColor(.05)}`,
    },
    buttons: {
      mentions: {
        hover: shadePalette.grey[100],
        selected: "#0c70c7",
        selectedHover: "#0b62ae",
      },
    },
    intercom: {
      buttonBackground: `${shadePalette.grey[400]} !important`,
    },
    dropdown: {
      background: shadePalette.grey[100],
      border: shadePalette.grey[250],
      hoverBackground: shadePalette.grey[250],
    },
    editor: {
      commentPanelBackground: shadePalette.grey[200],
      sideCommentEditorBackground: shadePalette.grey[100],
      commentMarker: "#80792e",
      commentMarkerActive: "#cbc14f",
      // Banner ad compatibility
      bannerAdBackground: "rgba(0,0,0,0.5)",
    },
    lexicalEditor: {
      modalOverlay: "rgba(0, 0, 0, 0.7)",
      equationText: "#c77dff",
      editButtonHover: "rgba(60, 132, 244, 0.2)",
      focusRing: "rgb(100, 160, 255)",
      mentionFocus: "rgb(60, 100, 180)",
      keyword: "rgb(255, 140, 120)",
    },
    tab: {
      inactive: {
        text: shadePalette.grey[600],
        bannerAdBackground: "rgba(0,0,0,0.3)",
      },
      active: {
        // Banner ad compatibility 
        bannerAdOpacity: 0.8,
      }
    },
    ultraFeed: {
      dim: shadePalette.grey[400],
      cardSeparator: `12px solid ${shadePalette.greyAlpha(0.15)}`,
      readBackground: shadePalette.grey[200],
      readBackgroundMobile: shadePalette.grey[100],
      readOpacity: {
        root: 1,
        content: 0.9,
        rootMobile: 0.9,
        contentMobile: 1,
      },
    },
    action: {
      active: '#fff',
      hover: shadePalette.greyAlpha(0.1),
      hoverOpacity: 0.1,
      disabled: shadePalette.greyAlpha(0.3),
      disabledBackground: shadePalette.greyAlpha(0.12),
    },
    // Banner ad compatibility - CSS filters and effects
    filters: {
      bannerAdBlur: 'blur(10px)',
      bannerAdBlurLight: 'blur(2px)',
      bannerAdBlurMedium: 'blur(4px)',
      bannerAdBlurHeavy: 'blur(8px)',
      headerBackdropFilter: 'blur(4px) brightness(1.1)',
    }
  }),
  make: (palette: ThemePalette): PartialDeep<NativeThemeType> => ({
    dark: true,
    rawCSS: []
  }),
});
