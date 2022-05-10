import { getForumType, ThemeOptions } from './themeNames';
import { baseTheme } from './createThemeDefaults';
import { createMuiTheme, Theme as MuiThemeType } from '@material-ui/core/styles';
import { getUserTheme } from './userThemes/index';
import { getSiteTheme } from './siteThemes/index';
import deepmerge from 'deepmerge';

export const getForumTheme = (themeOptions: ThemeOptions): MuiThemeType&ThemeType => {
  const forumType = getForumType(themeOptions);
  const siteTheme = getSiteTheme(forumType);
  const userTheme = getUserTheme(themeOptions.name);
  return buildTheme(userTheme, siteTheme);
}

const buildTheme = (userTheme: UserThemeSpecification, siteTheme: SiteThemeSpecification): MuiThemeType&ThemeType => {
  let shadePalette: ThemeShadePalette = baseTheme.shadePalette;
  if (siteTheme.shadePalette) shadePalette = deepmerge(shadePalette, siteTheme.shadePalette);
  if (userTheme.shadePalette) shadePalette = deepmerge(shadePalette, userTheme.shadePalette);
  
  let componentPalette: ThemeComponentPalette = baseTheme.componentPalette(shadePalette);
  if (siteTheme.componentPalette) componentPalette = deepmerge(componentPalette, siteTheme.componentPalette(shadePalette));
  if (userTheme.componentPalette) componentPalette = deepmerge(componentPalette, userTheme.componentPalette(shadePalette));
  
  let palette: ThemePalette = deepmerge(shadePalette, componentPalette);
  
  let combinedTheme = baseTheme.make(palette);
  if (siteTheme.make) combinedTheme = deepmerge(combinedTheme, siteTheme.make(palette));
  if (userTheme.make) combinedTheme = deepmerge(combinedTheme, userTheme.make(palette));
  
  let themeWithPalette = {...combinedTheme, palette};
  return createMuiTheme(themeWithPalette as any) as MuiThemeType&ThemeType;
}
