import { importAllComponents } from '../lib/vulcan-lib/components';
import { getForumTheme } from '../themes/forumTheme';
import * as _ from 'underscore';
import { topLevelStyleDefinitions } from '@/components/hooks/useStyles';
import type { JssStyles } from '@/lib/jssStyles';

/*
 * We call `importAllComponents` in the test to actually call `require` on all
 * the components that are registed in the deferred components table, but we
 * need this import to actually get the components _into_ the deferred
 * components table in the first place.
 */
import '../lib/generated/allComponents';

describe('JSS', () => {
  /**
   * Check that component styles use only colors that either come from the theme, 
   * or change in dark mode. It is okay to use non-palette colors in ways that are
   * conditinal on being in dark mode, eg
   *    `theme.palette.type==="dark" ? "#123456" : theme.palette.panelBackground.default`
   * or
   *    `theme.palette.type==="dark" ? "#123456" : "#abcdef"
   * since the main purpose of this test is to make sure you don't forget about
   * dark mode and accidentally make something black-on-black.
   */
  it('uses only colors that come from the theme palette or change in dark mode', () => {
    importAllComponents();
    const lightTheme = getForumTheme({name: "default", siteThemeOverride: {}}) as unknown as ThemeType;
    const darkTheme = getForumTheme({name: "dark", siteThemeOverride: {}}) as unknown as ThemeType;
    const stubbedLightTheme = replacePaletteWithStubs(lightTheme);
    const stubbedDarkTheme = replacePaletteWithStubs(darkTheme);
    let nonPaletteColors: string[] = [];

    for (const name in topLevelStyleDefinitions) {
      const styleGetter = topLevelStyleDefinitions[name].styles;
      const lightModeStyles = styleGetter(stubbedLightTheme);
      const darkModeStyles = styleGetter(stubbedDarkTheme);
      if (lightModeStyles && !topLevelStyleDefinitions[name].options?.allowNonThemeColors) {
        assertNoNonPaletteColors(name, lightModeStyles, darkModeStyles, nonPaletteColors);
      }
    }

    if (nonPaletteColors.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`Non-palette colors in JSS styles:\n${nonPaletteColors.join("\n")}`);
      nonPaletteColors.length.should.equal(0);
    }
  });
});

function assertNoNonPaletteColors(componentName: string, lightModeStyles: JssStyles, darkModeStyles: JssStyles, outNonPaletteColors: string[]) {
  for (let key of Object.keys(lightModeStyles)) {
    assertNoNonPaletteColorsRec(componentName, key, lightModeStyles[key], darkModeStyles[key], outNonPaletteColors);
  }
}

function assertNoNonPaletteColorsRec(componentName: string, path: string, lightModeStyleFragment: any, darkModeStyleFragment: any, outNonPaletteColors: string[]) {
  if (typeof lightModeStyleFragment === "string") {
    const mentionedColor = stringMentionsAnyColor(lightModeStyleFragment);
    if (mentionedColor && lightModeStyleFragment === darkModeStyleFragment) {
      outNonPaletteColors.push(`Color for ${componentName} at ${path} (${mentionedColor}) is the same in light mode and dark mode. To prevent black-on-black text, use either a theme palette color, or check for dark mode with theme.dark ? colorOne : colorTwo. Or disable the warning for this component by passing {allowNonThemeColors: true} in the stylesheet options.`);
    }
  } else if (typeof lightModeStyleFragment === "object") {
    for (let key of Object.keys(lightModeStyleFragment)) {
      assertNoNonPaletteColorsRec(componentName, `${path}.${key}`, lightModeStyleFragment[key], darkModeStyleFragment[key], outNonPaletteColors);
    }
  }
}

function replacePaletteWithStubs(theme: ThemeType): ThemeType {
  function objReplaceColors(obj: any, replacement: string) {
    if (typeof obj === 'string') {
      if (stringMentionsAnyColor(obj))
        return replacement;
      else
        return obj;
    } else if (typeof obj === 'object') {
      let result: typeof obj = {};
      for (let key of Object.keys(obj)) {
        result[key] = objReplaceColors(obj[key], replacement);
      }
      return result;
    } else {
      return obj;
    }
  }
  
  return {
    ...theme,
    typography: objReplaceColors(theme.typography, "fakecolor"),
    shadows: theme.shadows.map(() => "fakecolor"),
    palette: {
      ...objReplaceColors(theme.palette, "fakecolor"),
      greyAlpha: ()=>"fakecolor",
      inverseGreyAlpha: ()=>"fakecolor",
      primaryAlpha: ()=>"fakecolor",
      boxShadowColor: ()=>"fakecolor",
      greyBorder: ()=>"fakecolor",
    },
  };
}

const colorWords = ["white","black","red","grey","gray"];
function stringMentionsAnyColor(str: string): string | null {
  if (!!str.match(/rgba?\(/)
    || !!str.match(/#[0-9a-fA-F]{6}/)
    || !!str.match(/#[0-9a-fA-F]{3}/)
  ) {
    return `color literal (${str})`;
  }
  for (let colorWord of colorWords) {
    if (new RegExp(`\\b${colorWord}\\b`).test(str))
      return `color word (${str})`;
  }
  if (str.match(/theme/)) {
    return '"theme"'; // Usually suggests a typo with trying to string-interpolate
  }
  return null;
}
