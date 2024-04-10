import type { PartialDeep } from 'type-fest'
import { invertHexColor, invertColor, colorToString, zeroTo255 } from '../colorUtil';
import { forumSelect } from '../../lib/forumTypeUtils';
import deepmerge from 'deepmerge';

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
  0: invertHexColor('#ffffff'),
  1000: invertHexColor('#000000'),
  
  10: invertHexColor('#fefefe'),
  20: invertHexColor('#fdfdfd'),
  25: invertHexColor('#fcfcfc'),
  30: invertHexColor('#fbfbfb'),
  55: invertHexColor('#f9f9f9'),
  60: invertHexColor('#f8f8f8'),
  110: invertHexColor("#f3f3f3"),
  120: invertHexColor('#f2f2f2'),
  140: invertHexColor("#f0f0f0"),
  250: invertHexColor("#e8e8e8"),
  310: invertHexColor("#dddddd"),
  315: invertHexColor("#d4d4d4"),
  320: invertHexColor("#d9d9d9"),
  340: invertHexColor("#d0d0d0"),
  410: invertHexColor("#b3b3b3"),
  550: invertHexColor("#999999"),
  620: invertHexColor("#888888"),
  650: invertHexColor('#808080'),
  680: invertHexColor('#666666'),
};

const greyAlpha = (alpha: number) => `rgba(255,255,255,${alpha})`;

const inverseGreyAlpha = (alpha: number) => {
  const [r, g, b] = invertColor([1, 1, 1, 1]);
  return `rgba(${zeroTo255(r)},${zeroTo255(g)},${zeroTo255(b)},${alpha})`;
}

// CkEditor allows users to provide colors for table cell backgrounds and
// borders, which get embedded into the HTML looking like this:
//   <td style="background-color: rgb(1,2,3)">
// User-provided colors can be in any format that CSS accepts, and may set
// the `background-color` and `border` properties on <table> and <td>
// elements.
//
// We don't have any theme-specific HTML postprocessing, so this poses a bit of
// a problem. Our solution is to override the `background-color` and `border`
// properties on <td> and <table> to a safe default, to guarantee there won't
// be any black-on-black or white-on-white text, and then then use CSS
// attribute matching to replace specific colors that have been used in
// posts we care about with proper aesthetic replacements. The CSS winds up
// looking like this:
//   .content td, .content table {
//     background-color: black !important;
//     border-color: #333 !important;
//   }
//   .content td[style*="background-color:rgb(230, 230, 230)"], .content table[style*="background-color:rgb(230, 230, 230)"] {
//     background-color: #202020 !important;
//   }
// (Not real color values, but real syntax.)
//
const safeColorFallbacks = (palette: ThemePalette) => `
.content td[style*="background-color:"] {
  background-color: black !important;
}
.content th[style*="background-color:"] {
  background-color: ${palette.panelBackground.tableHeading} !important;
}
.content table[style*="background-color:"] {
  background-color: black !important;
}
.content td[style*="border:"], .content th[style*="border:"] {
  border: ${palette.border.tableCell} !important;
}
.content table[style*="border:"] {
  border-color: #333 !important;
}
`;

const colorReplacements: Record<string,string> = {
  "rgba(255,255,255,.5)": "rgba(0,0,0.5)",
  "hsl(0, 0%, 90%)":    "hsl(0, 0%, 10%)",
  "#F2F2F2":            invertHexColor("#f2f2f2"),
  "rgb(255, 247, 222)": "rgb(50,30,0)",
  "rgb(255, 255, 255)": invertHexColor("#ffffff"),
  "hsl(0,0%,100%)":     invertHexColor("#ffffff"),
  "#FFEEBB":            invertHexColor("#ffeebb"),
  "rgb(255, 238, 187)": colorToString(invertColor([255/255.0,238/255.0,187/255.0,1])),
  "rgb(230, 230, 230)": colorToString(invertColor([230/255.0,230/255.0,230/255.0,1])),
} as const;
function generateColorOverrides(): string {
  return Object.keys(colorReplacements).map((colorString: keyof typeof colorReplacements) => {
    const replacement = colorReplacements[colorString];
    return `
      .content td[style*="background-color:${colorString}"], .content table[style*="background-color:${colorString}"] {
        background-color: ${replacement} !important;
      }
      .content td[style*="border-color:${colorString}"], .content table[style*="border-color:${colorString}"] {
        border-color: ${replacement} !important;
      }
    `;
  }).join('\n');
}

const forumComponentPalette = (shadePalette: ThemeShadePalette) =>
  forumSelect({
    EAForum: {
      primary: {
        main: '#009da8',
        light: '#0c869b',
        dark: '#009da8'
      },
      secondary: {
        main: '#3c9eaf',
        light: '#0c869b',
        dark: '#3c9eaf'
      },
      lwTertiary: {
        main: "#0e9bb4",
        dark: "#0e9bb4",
      },
      text: {
        primaryAlert: '#F3F9FA'
      },
      link: {
        visited: '#9b71be',
        visitedHover: '#8a59b3',
      },
      panelBackground: {
        default: shadePalette.grey[20],
        modalBackground: "#292929",
        loginInput: "#3d3d3d",
        loginInputHovered: "#3f3f3f",
        onboardingSection: "#424242",
        onboardingPodcast: "#525252",
      },
      background: {
        primaryTranslucent: "rgba(12,134,155,0.4)",
        loginBackdrop: "rgba(0,0,0,0.5)",
      }
    },
    LessWrong: {
      header: {
        background: 'rgba(50,50,50,.75)',
      }
    },
    default: {},
  });

const forumOverrides = (palette: ThemePalette): PartialDeep<ThemeType['overrides']> =>
  forumSelect({
    EAForum: {
      PostsTopSequencesNav: {
        title: {
          color: palette.icon.dim,
        },
      },
      MuiPaper: {
        elevation1: {boxShadow: "none"},
        elevation2: {boxShadow: "none"},
        elevation3: {boxShadow: "none"},
        elevation4: {boxShadow: "none"},
        elevation5: {boxShadow: "none"},
        elevation6: {boxShadow: "none"},
        elevation7: {boxShadow: "none"},
        elevation8: {boxShadow: "none"},
        elevation24: {boxShadow: "none"},
      },
    },
    default: {},
  });

export const darkModeTheme: UserThemeSpecification = {
  shadePalette: {
    grey: invertedGreyscale,
    greyAlpha,
    inverseGreyAlpha,
    boxShadowColor: (alpha: number) => greyAlpha(alpha),
    greyBorder: (thickness: string, alpha: number) => `${thickness} solid ${greyAlpha(alpha)}`,
    type: "dark",
  },
  componentPalette: (shadePalette: ThemeShadePalette) => deepmerge({
    text: {
      primaryAlert: '#b2c5b5',
      warning: '#FFF7E6',
      alwaysWhite: '#fff',
      primaryDarkOnDim: '#a8cad7',
      aprilFools: {
        orange: "#ff7144",
        yellow: "#ffba7d",
        green: "#7ee486",
      },
      reviewWinner: {
        title: greyAlpha(0.75),
        author: greyAlpha(0.65)
      }
    },
    link: {
      primaryDim: '#3a7883',
      visited: "#bb7c43",
    },
    panelBackground: {
      translucent: "rgba(0,0,0,.87)",
      translucent2: "rgba(0,0,0,.8)",
      translucent3: "rgba(0,0,0,.75)",
      translucent4: "rgba(0,0,0,.6)",
      deletedComment: "#3a0505",
      commentModeratorHat: "#202719",
      spoilerBlock: "#1b1b1b",
      cookieBanner: shadePalette.grey[900],
    },
    background: {
      default: shadePalette.grey[100],
      contrastInDarkMode: shadePalette.grey[100],
      diffInserted: "#205120",
      diffDeleted: "#b92424",
      primaryDim: "#28383e",
      primarySlightlyDim: "#00494e",
      primaryTranslucent: "rgba(99,141,103,0.3)",
      primaryTranslucentHeavy: "rgba(99,141,103,0.6)",
      warningTranslucent: "rgba(255,173,8,0.3)",
      transparent: 'transparent',
      digestAdBannerInput: shadePalette.grey[300],
    },
    border: {
      itemSeparatorBottom: shadePalette.greyBorder("1px", .2),
      commentBorder: "1px solid rgba(255,255,255,.2)",
      answerBorder: "2px solid rgba(255,255,255,.2)",
      primaryHighlight: '#314a4e',
      primaryHighlight2: '#314a4e',
      secondaryHighlight: '#3e503a',
      secondaryHighlight2: '#3e503a',
      mentionsBaloon: shadePalette.grey[100],
      eaButtonGreyOutline: "#5F5F5F",
    },
    buttons: {
      mentions: {
        hover: shadePalette.grey[100],
        selected: "#0c70c7",
        selectedHover: "#0b62ae",
      },
      digestAdBannerNoThanks: {
        background: shadePalette.grey[600],
        hoverBackground: shadePalette.grey[700],
      },
    },
    intercom: {
      buttonBackground: `${shadePalette.grey[400]} !important`,
    },
    embeddedPlayer: {
      opacity: 0.85,
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
    },
    wrapped: {
      background: '#072C47',
      highlightText: '#FFC443',
      secondaryText: '#008DAC',
      tertiaryText: "rgba(255, 255, 255, 0.50)",
      black: '#212121',
      darkGrey: '#424242',
      grey: '#757575',
      darkDot: "rgba(255, 255, 255, 0.40)",
      panelBackground: "rgba(255, 255, 255, 0.10)",
      panelBackgroundDark: "rgba(255, 255, 255, 0.05)",
      postScoreArrow: '#BCBCBC',
    },
  }, forumComponentPalette(shadePalette)),
  make: (palette: ThemePalette): PartialDeep<ThemeType> => ({
    postImageStyles: {
      // Override image background color to white (so that transparent isn't
      // black). Necessary because there are a handful of posts with images that
      // have black-on-transparent text in them.
      background: "#ffffff",
    },
    overrides: forumOverrides(palette),
    rawCSS: [
      safeColorFallbacks(palette),
      generateColorOverrides()
    ]
  }),
};
