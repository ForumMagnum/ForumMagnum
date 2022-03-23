import { testStartup } from '../testing/testMain';
import { importAllComponents, ComponentsTable } from '../lib/vulcan-lib/components';
import { getForumTheme } from '../themes/forumTheme';
import * as _ from 'underscore';

testStartup();

describe('JSS', () => {
  it('uses only colors from the theme palette', () => {
    importAllComponents();
    const realTheme = getForumTheme({name: "default", forumThemeOverride: {}}) as unknown as ThemeType;
    const fakeTheme = replacePaletteWithStubs(realTheme);
    let nonPaletteColors: string[] = [];
    
    for (let componentName of _.sortBy(Object.keys(ComponentsTable), x=>x)) {
      const styleGetter = ComponentsTable[componentName].options?.styles;
      const styles = (typeof styleGetter === 'function') ? styleGetter(fakeTheme) : styleGetter;
      if (styles) {
        assertNoNonPaletteColors(componentName, styles, nonPaletteColors);
      }
    }
    
    if (nonPaletteColors.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`No-palette colors in JSS styles:\n${nonPaletteColors.join("\n")}`);
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
    if (stringMentionsAnyColor(styleFragment)) {
      outNonPaletteColors.push(`Non-palette color in styles for ${componentName} at ${path}`);
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
      let result = {};
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
    palette: objReplaceColors(theme.palette, "fakecolor"),
  };
}

function stringMentionsAnyColor(str: string): boolean {
  // TODO: Extend this to other color words besides black and white?
  return !!str.match(/rgba?\(/)
    || !!str.match(/#[0-9a-fA-F]{6}/)
    || !!str.match(/\b(white|black)\b/)
}
