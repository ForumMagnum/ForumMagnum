import { importAllComponents, ComponentsTable } from '../lib/vulcan-lib/components';
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
   * Check that component styles use only colors from the theme, when
   * instantiated with the default theme. It is okay to use non-palette colors
   * conditionally, eg with
   *    `theme.palette.type==="dark" ? "#123456" : theme.palette.panelBackground.default`
   * since the main purpose of this test is to make sure you don't forget about
   * dark mode and accidentally make something black-on-black.
   */
  it('uses only colors from the theme palette', () => {
    importAllComponents();
    const realTheme = getForumTheme({name: "default", siteThemeOverride: {}}) as unknown as ThemeType;
    const fakeTheme = replacePaletteWithStubs(realTheme);
    let nonPaletteColors: string[] = [];
    
    const componentsToTest = Object.keys(ComponentsTable);

    if (componentsToTest.length < 1000) {
      throw new Error("Expected more components to test - are they imported correctly?");
    }

    for (let componentName of _.sortBy(componentsToTest, x=>x)) {
      const styleGetter = ComponentsTable[componentName].options?.styles;
      const styles = (typeof styleGetter === 'function') ? styleGetter(fakeTheme) : styleGetter;
      if (styles && !ComponentsTable[componentName].options?.allowNonThemeColors) {
        assertNoNonPaletteColors(componentName, styles, nonPaletteColors);
      }
    }

    for (const name in topLevelStyleDefinitions) {
      const styleGetter = topLevelStyleDefinitions[name].styles;
      const styles = styleGetter(fakeTheme);
      if (styles && !topLevelStyleDefinitions[name].options?.allowNonThemeColors) {
        assertNoNonPaletteColors(name, styles, nonPaletteColors);
      }
    }

    if (nonPaletteColors.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`Non-palette colors in JSS styles:\n${nonPaletteColors.join("\n")}`);
      nonPaletteColors.length.should.equal(0);
    }
  });
});

function assertNoNonPaletteColors(componentName: string, styles: JssStyles, outNonPaletteColors: string[]) {
  for (let key of Object.keys(styles)) {
    assertNoNonPaletteColorsRec(componentName, key, styles[key], outNonPaletteColors);
  }
}

function assertNoNonPaletteColorsRec(componentName: string, path: string, styleFragment: any, outNonPaletteColors: string[]) {
  if (typeof styleFragment === "string") {
    const mentionedColor = stringMentionsAnyColor(styleFragment);
    if (mentionedColor) {
      outNonPaletteColors.push(`Non-palette color in styles for ${componentName} at ${path} - ${mentionedColor}`);
    }
  } else if (typeof styleFragment === "object") {
    for (let key of Object.keys(styleFragment)) {
      assertNoNonPaletteColorsRec(componentName, `${path}.${key}`, styleFragment[key], outNonPaletteColors);
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
