import { isE2E } from '../../lib/executionEnvironment';
import { AbstractThemeOptions, ThemeOptions, themeOptionsAreConcrete } from '../../themes/themeNames';
import { getMergedStylesheet } from '../styleGeneration';

const stylesId = "main-styles";

const stylesheetUrls = new class {
  private cache: Record<string, string> = {};

  getStylesheetUrl(themeOptions: ThemeOptions) {
    const cacheKey = JSON.stringify(themeOptions);
    if (!this.cache[cacheKey]) {
      this.cache[cacheKey] = getMergedStylesheet(themeOptions).url;
    }
    return this.cache[cacheKey];
  }
}

const renderPreloadSheet = (url: string): string =>
  `<link rel="preload" as="style" href="${url}" />`;

const renderLinkMainSheet = (url: string): string =>
  `<link id="${stylesId}" rel="stylesheet" type="text/css" onerror="window.missingMainStylesheet=true" href="${url}" />`;

const renderImportForColorScheme = (url: string, colorScheme: string): string =>
  `@import url("${url}") screen and (prefers-color-scheme: ${colorScheme});\n`;

const renderImportForPrint = (url: string): string =>
  `@import url("${url}") print;\n`;

const renderAutoStyleImport = (siteThemeOverride?: SiteThemeOverride) => {
  const lightSheet = stylesheetUrls.getStylesheetUrl({siteThemeOverride, name: "default"})
  const darkSheet = stylesheetUrls.getStylesheetUrl({siteThemeOverride, name: "dark"})

  const light = renderImportForColorScheme(lightSheet, "light");
  const dark = renderImportForColorScheme(darkSheet, "dark");
  const print = renderImportForPrint(lightSheet);
  return `<style id="${stylesId}">${light}${dark}${print}</style>`;
}

export const renderJssSheetImports = (themeOptions: AbstractThemeOptions): string => {
  // The "auto" import option breaks playwright, so just stick to the default
  // sheet in e2e tests
  if (isE2E) {
    themeOptions = {name: "default"};
  }
  const prefix = '<style id="jss-insertion-start"></style><style id="jss-insertion-end"></style>';
  if (themeOptionsAreConcrete(themeOptions)) {
    return `${prefix}${renderLinkMainSheet(stylesheetUrls.getStylesheetUrl(themeOptions))}`;
  }
  return `${prefix}${renderAutoStyleImport(themeOptions.siteThemeOverride)}`;
}

export const renderJssSheetPreloads = (themeOptions: AbstractThemeOptions) => {
  if (themeOptionsAreConcrete(themeOptions)) {
    return renderPreloadSheet(stylesheetUrls.getStylesheetUrl(themeOptions));
  }
  const lightSheet = renderPreloadSheet(stylesheetUrls.getStylesheetUrl({...themeOptions, name: "default"}))
  const darkSheet = renderPreloadSheet(stylesheetUrls.getStylesheetUrl({...themeOptions, name: "dark"}))
  return lightSheet + darkSheet;
}
