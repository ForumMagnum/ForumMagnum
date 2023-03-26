import type { PartialDeep } from 'type-fest'
import { invertHexColor, invertColor, colorToString } from '../colorUtil';
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
const inverseGreyAlpha = (alpha: number) => `rgba(0,0,0,${alpha})`;

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
      panelBackground: {
        default: shadePalette.grey[20],
      },
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
      alwaysWhite: '#fff',
      primaryDarkOnDim: '#a8cad7',
      aprilFools: {
        orange: "#ff7144",
        yellow: "#ffba7d",
        green: "#7ee486",
      },
    },
    link: {
      primaryDim: '#3a7883'
    },
    panelBackground: {
      translucent: "rgba(0,0,0,.87)",
      translucent2: "rgba(0,0,0,.8)",
      translucent3: "rgba(0,0,0,.75)",
      translucent4: "rgba(0,0,0,.6)",
      deletedComment: "#3a0505",
      commentModeratorHat: "#202719",
      spoilerBlock: "#1b1b1b",
    },
    background: {
      diffInserted: "#205120",
      diffDeleted: "#b92424",
      primaryDim: "#28383e",
      transparent: 'transparent'
    },
    border: {
      itemSeparatorBottom: shadePalette.greyBorder("1px", .2),
      commentBorder: "1px solid rgba(255,255,255,.2)",
      answerBorder: "2px solid rgba(255,255,255,.2)",
      primaryHighlight: '#314a4e',
      primaryHighlight2: '#314a4e',
      secondaryHighlight: '#3e503a',
      secondaryHighlight2: '#3e503a',
    },
    intercom: {
      buttonBackground: `${shadePalette.grey[400]} !important`,
    },
    embeddedPlayer: {
      opacity: 0.85,
    },
    editor: {
      commentPanelBackground: shadePalette.grey[200],
      sideCommentEditorBackground: shadePalette.grey[100],
      commentMarker: "#80792e",
      commentMarkerActive: "#cbc14f",
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
