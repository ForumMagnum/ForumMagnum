// eslint-disable-next-line no-restricted-imports
import type { Color as MuiColorShades } from '@/lib/vendor/@material-ui/core/src';
import type { Transitions as MuiTransitions } from '@/lib/vendor/@material-ui/core/src/styles/transitions';
import type { PartialDeep } from 'type-fest'
import type { ForumTypeString } from '../lib/instanceSettings';
import type { UnionOf } from '../lib/utils/typeGuardUtils';
import type { ZIndexMap } from './zIndexes';
import type { JssStyles } from '@/lib/jssStyles';
import { userThemeNames, userThemeSettings, ThemeOptions } from './themeNames';
import type { defaultComponentPalette } from './defaultPalette';

type WidenLiteral<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T;

type DeepWiden<T> =
  T extends (...args: any[]) => any ? T :
  T extends readonly (infer U)[] ? DeepWiden<U>[] :
  T extends object ? { [K in keyof T]: DeepWiden<WidenLiteral<T[K]>> } :
  WidenLiteral<T>;

type InferredThemeComponentPalette = ReturnType<typeof defaultComponentPalette>;
type BaseThemeComponentPalette = DeepWiden<InferredThemeComponentPalette>;

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
  type ThemeComponentPalette = Omit<BaseThemeComponentPalette, "text"|"link"|"tag"> & {
    text: BaseThemeComponentPalette["text"] & {
      contentHeader?: ColorString,
    },
    link: BaseThemeComponentPalette["link"] & {
      visitedHover?: ColorString,
    },
    tag: BaseThemeComponentPalette["tag"] & {
      backgroundHover?: ColorString,
      coreTagBackgroundHover?: ColorString,
      hollowTagBackgroundHover?: ColorString,
    },
  };
  type ThemePalette = ThemeComponentPalette
  
  type ForumTypeFlags = {
    isBookUI: boolean,
    isFriendlyUI: boolean,
    isLW: boolean,
    isAF: boolean,
    isLWorAF: boolean,
    isEAForum: boolean,
  }
  
  type ThemeType = {
    forumType: ForumTypeString,
    themeOptions: ThemeOptions,
    dark: boolean,

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
  } & ForumTypeFlags;

  type NativeThemeType = Omit<ThemeType,"palette"|"forumType"|"themeOptions"|"breakpoints"> & { breakpoints: Omit<ThemeType["breakpoints"], "up"|"down"> };
  
  type BaseThemeSpecification = {
    componentPalette: (dark: boolean) => ThemeComponentPalette,
    make: (palette: ThemePalette) => NativeThemeType
  };
  type SiteThemeSpecification = {
    componentPalette?: (dark: boolean) => PartialDeep<ThemeComponentPalette>,
    make?: (palette: ThemePalette) => PartialDeep<NativeThemeType>
  };
  type UserThemeSpecification = {
    dark?: boolean,
    componentPalette?: (dark: boolean) => PartialDeep<ThemeComponentPalette>,
    make?: (palette: ThemePalette) => PartialDeep<NativeThemeType>
  };
}
