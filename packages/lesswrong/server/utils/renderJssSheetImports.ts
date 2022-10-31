import type { AbstractThemeOptions } from '../../themes/themeNames';
import { getMergedStylesheet } from '../styleGeneration';

const stylesId = "main-styles";

const stylesheetUrls = new class {
  private lightUrl: string | undefined;
  private darkUrl: string | undefined;

  get light() {
    if (!this.lightUrl) {
      this.lightUrl = getMergedStylesheet({name: "default", siteThemeOverride: {}}).url;
    }
    return this.lightUrl;
  }

  get dark() {
    if (!this.darkUrl) {
      this.darkUrl = getMergedStylesheet({name: "dark", siteThemeOverride: {}}).url;
    }
    return this.darkUrl;
  }
}

const renderPreloadSheet = (url: string): string =>
  `<link rel="preload" as="style" href="${url}" />`;

const renderLinkMainSheet = (url: string): string =>
  `<link id="${stylesId}" rel="stylesheet" type="text/css" onerror="window.missingMainStylesheet=true" href="${url}" />`;

const renderImportForColorScheme = (url: string, colorScheme: string): string =>
  `@import url("${url}") screen and (prefers-color-scheme: ${colorScheme});\n`;

export const renderAutoStyleImport = () => {
  const light = renderImportForColorScheme(stylesheetUrls.light, "light");
  const dark = renderImportForColorScheme(stylesheetUrls.dark, "dark");
  return `<style id="${stylesId}">${light}${dark}</style>`;
}

export const renderJssSheetImports = (themeOptions: AbstractThemeOptions): string => {
  const prefix = '<style id="jss-insertion-point"></style>';
  switch (themeOptions.name) {
  case "auto":
    return `${prefix}${renderAutoStyleImport()}`;
  case "dark":
    return `${prefix}${renderLinkMainSheet(stylesheetUrls.dark)}`;
  default:
    return `${prefix}${renderLinkMainSheet(stylesheetUrls.light)}`;
  }
}

export const renderJssSheetPreloads = (themeOptions: AbstractThemeOptions) => {
  switch (themeOptions.name) {
  case "auto":
    return renderPreloadSheet(stylesheetUrls.light) + renderPreloadSheet(stylesheetUrls.dark);
  case "dark":
    return renderPreloadSheet(stylesheetUrls.dark);
  default:
    return renderPreloadSheet(stylesheetUrls.light);
  }
}
