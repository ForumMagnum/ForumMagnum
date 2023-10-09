import { AbstractThemeOptions, ThemeOptions, themeOptionsAreConcrete } from '../../themes/themeNames';
import { getMergedStylesheet, MergedStylesheet } from '../styleGeneration';

const stylesId = "main-styles";

const stylesheetUrls = new class {
  private cache: Record<string, Promise<MergedStylesheet>> = {};

  async getStylesheetUrl(themeOptions: ThemeOptions) {
    const cacheKey = JSON.stringify(themeOptions);
    if (!this.cache[cacheKey]) {
      this.cache[cacheKey] = getMergedStylesheet(themeOptions);
    }
    return (await this.cache[cacheKey]).url;
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

const renderAutoStyleImport = async (siteThemeOverride?: SiteThemeOverride) => {
  const lightSheet = await stylesheetUrls.getStylesheetUrl({siteThemeOverride, name: "default"})
  const darkSheet = await stylesheetUrls.getStylesheetUrl({siteThemeOverride, name: "dark"})

  const light = renderImportForColorScheme(lightSheet, "light");
  const dark = renderImportForColorScheme(darkSheet, "dark");
  const print = renderImportForPrint(lightSheet);
  return `<style id="${stylesId}">${light}${dark}${print}</style>`;
}

export const renderJssSheetImports = async (themeOptions: AbstractThemeOptions): Promise<string> => {
  const prefix = '<style id="jss-insertion-point"></style>';
  if (themeOptionsAreConcrete(themeOptions)) {
    return `${prefix}${renderLinkMainSheet(await stylesheetUrls.getStylesheetUrl(themeOptions))}`;
  }
  return `${prefix}${renderAutoStyleImport(themeOptions.siteThemeOverride)}`;
}

export const renderJssSheetPreloads = async (themeOptions: AbstractThemeOptions) => {
  if (themeOptionsAreConcrete(themeOptions)) {
    return renderPreloadSheet(await stylesheetUrls.getStylesheetUrl(themeOptions));
  }
  const lightSheet = renderPreloadSheet(await stylesheetUrls.getStylesheetUrl({...themeOptions, name: "default"}))
  const darkSheet = renderPreloadSheet(await stylesheetUrls.getStylesheetUrl({...themeOptions, name: "dark"}))
  return lightSheet + darkSheet;
}
