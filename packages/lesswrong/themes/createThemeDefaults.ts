import transitions from '@/lib/vendor/@material-ui/core/src/styles/transitions';
import { defaultComponentPalette, headerStack, sansSerifStack, serifStack } from './defaultPalette';
import { defaultZIndexes } from "./zIndexes";
import { isBookUI, isFriendlyUI } from './forumTheme';
import { isAF, isEAForum, isLW, isLWorAF } from '@/lib/instanceSettings';

const monoStack = [
  '"Liberation Mono"',
  'Menlo',
  'Courier',
  'monospace'
].join(',')

export const defaultBorderRadius = () => ({
  default: 0,
  small: 3,
  quickTakesEntry: 3,
});

export const defaultTypography = (palette: ThemePalette, spacingUnit: number) => ({
  fontFamily: palette.fonts.sansSerifStack,
  cloudinaryFont: {
    stack: "'Merriweather', serif",
    url: "https://fonts.googleapis.com/css?family=Merriweather",
  },
  postStyle: {
    fontFamily: palette.fonts.serifStack,
  },
  commentStyle: {
    fontFamily: palette.fonts.sansSerifStack,
    '& b, & strong': {
      fontWeight: 600
    }
  },
  ultraFeedMobileStyle: {
    fontFamily: palette.fonts.sansSerifStack,
  },
  errorStyle: {
    color: palette.error.main,
    fontFamily: palette.fonts.sansSerifStack
  },
  contentNotice: {
    fontStyle: "italic",
    color: palette.grey[600],
    fontSize:".9em",
    marginBottom: 20,
    wordBreak: "break-word"
  },
  body1: {
    fontSize: 18.2,
    lineHeight: "26px",
    fontWeight: 400,
    fontFamily: palette.fonts.sansSerifStack,
    color: palette.text.primary,
  },
  body2: {
    fontWeight: 400,
    fontSize: 15.08,
    lineHeight: "19.8px",
    fontFamily: palette.fonts.sansSerifStack,
    color: palette.text.primary,
  },
  headline: {
    fontSize: "1.5rem",
    fontWeight: 400,
    fontFamily: palette.fonts.serifStack,
    lineHeight: `1.35417em`,
    color: palette.text.primary,
  },
  postsItemTitle: {
    fontSize: 16.9
  },
  chapterTitle: {
    fontSize: "1.2em",
    textTransform: "uppercase",
    color: palette.grey[600]
  },
  largeChapterTitle: {
    fontSize: 18.2,
    margin: "1.5em 0 .5em 0",
    color: palette.grey[800]
  },
  smallText: {
    fontFamily: palette.fonts.sansSerifStack,
    fontWeight: 400,
    fontSize: 13,
    lineHeight: "18.2px"
  },
  tinyText: {
    fontWeight: 400,
    fontSize: 9.75,
    lineHeight: "18.2px"
  },
  display0: {
    color: palette.grey[700],
    fontSize: 20.8,
    marginTop: '1em',
    fontWeight: 400,
    lineHeight: "1.20588em",
  },
  display1: {
    color: palette.grey[800],
    fontSize: 26,
    marginTop: '1em',
    fontWeight: 400,
    fontFamily: palette.fonts.sansSerifStack,
    lineHeight: `1.20588em`,
  },
  display2: {
    color: palette.grey[800],
    fontSize: 36.4,
    marginTop: '1em',
    fontWeight: 400,
    fontFamily: palette.fonts.sansSerifStack,
    lineHeight: `1.13333em`,
    marginLeft: '-.02em',
  },
  display3: {
    color: palette.grey[800],
    marginTop: '1.2em',
    fontSize: 39,
    fontWeight: 400,
    fontFamily: palette.fonts.sansSerifStack,
    letterSpacing: '-.02em',
    lineHeight: `1.30357em`,
    marginLeft: '-.02em',
  },
  display4: {
    color: palette.grey[800],
    fontSize: "7rem",
    fontWeight: 300,
    fontFamily: palette.fonts.sansSerifStack,
    letterSpacing: '-.04em',
    lineHeight: `1.14286em`,
    marginLeft: '-.04em',
  },
  title: {
    fontSize: 18,
    fontWeight: 500,
    marginBottom: 3,
    fontFamily: headerStack,
    lineHeight: `1.16667em`,
    color: palette.text.primary,
  },
  uiSecondary: {
    fontFamily: palette.fonts.serifStack,
  },
  caption: {
    // captions should be relative to their surrounding content, so they are unopinionated about fontFamily and use ems instead of rems
    fontSize: '.85em',
    fontFamily: "unset",
    fontWeight: 400,
    lineHeight: `1.375em`,
    color: palette.text.secondary,
  },
  button: {
    fontSize: "0.875rem",
    textTransform: 'uppercase',
    fontWeight: 500,
    fontFamily: palette.fonts.sansSerifStack,
    color: palette.text.primary,
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
    padding: 13,
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
    marginBottom: '6.5px',
  },
  commentHeader: {
    fontSize: 19.5,
    marginTop: '.5em',
    fontWeight:500,
  },
  subheading: {
    fontSize: 15,
    color: palette.grey[600],
    fontWeight: 400,
    fontFamily: palette.fonts.serifStack,
    lineHeight: `1.5em`,
  },
  headerStyle: {
    fontFamily: headerStack,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: "6.5px"
  },
  italic: {
    fontStyle: "italic",
  },
  smallCaps: {
    fontVariant: "small-caps",
  },
  pxToRem: (px: number) => `${px * .0625}rem`
});

export const baseTheme: BaseThemeSpecification = {
  componentPalette: (dark: boolean) => defaultComponentPalette(dark),
  make: (palette: ThemePalette): NativeThemeType => {
    const spacingUnit = 8
  
    return {
      dark: false,
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
        mainLayoutPaddingTop: 50
      },
      borderRadius: defaultBorderRadius(),
      typography: defaultTypography(palette, spacingUnit),
      zIndexes: {
        ...defaultZIndexes
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
      transitions: transitions,

      isBookUI: isBookUI(),
      isFriendlyUI: isFriendlyUI(),
      isLW: isLW(),
      isAF: isAF(),
      isLWorAF: isLWorAF(),
      isEAForum: isEAForum(),
    };
  }
};
