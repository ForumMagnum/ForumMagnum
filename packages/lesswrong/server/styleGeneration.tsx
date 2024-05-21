import React from 'react';
import ReactDOM from 'react-dom/server';
// Adds selected MUI components to global styles.
// import './register-mui-styles';
import { importAllComponents, ComponentsTable, styleDefinitions } from '../lib/vulcan-lib/components';
import { withStyles } from '@material-ui/core/styles';
import { wrapWithMuiTheme } from './material-ui/themeProvider';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import filter from 'lodash/filter'
import sortBy from 'lodash/sortBy';
import draftjsStyles from '../themes/globalStyles/draftjsStyles';
import miscStyles from '../themes/globalStyles/miscStyles';
import { isValidSerializedThemeOptions, ThemeOptions, getForumType } from '../themes/themeNames';
import type { ForumTypeString } from '../lib/instanceSettings';
import { getForumTheme } from '../themes/forumTheme';
import { usedMuiStyles } from './usedMuiStyles';
import { minify } from 'csso';
import { requestedCssVarsToString } from '../themes/cssVars';
import stringify from 'json-stringify-deterministic';
import { brotliCompressResource, CompressedCacheResource } from './utils/bundleUtils';

const generateMergedStylesheet = (themeOptions: ThemeOptions): Buffer => {
  importAllComponents();
  
  const context: any = {};
  
  // Sort components by stylePriority, tiebroken by name (alphabetical)
  const componentsWithStyles = filter(Object.keys(ComponentsTable),
    componentName => !!ComponentsTable[componentName].options?.styles
  ) as Array<string>;
  const namesAndStyles = [
    ...componentsWithStyles.map(componentName => ({
      name: componentName,
      styles: ComponentsTable[componentName].options!.styles!,
      stylePriority: ComponentsTable[componentName].options!.stylePriority || 0,
    })),
    ...styleDefinitions.map(d => ({
      name: d.name,
      styles: d.styles,
      stylePriority: d.options?.stylePriority || 0,
    }))
  ];

  const stylesByName = sortBy(namesAndStyles, s=>s.name);
  const stylesByPriority = sortBy(stylesByName, (s) => s.stylePriority);
  
  const DummyComponent = (props: any) => <div/>
  const DummyTree = <div>
    {Object.keys(usedMuiStyles).map((componentName: string) => {
      const StyledComponent = withStyles(usedMuiStyles[componentName], {name: componentName})(DummyComponent)
      return <StyledComponent key={componentName}/>
    })}
    {stylesByPriority.map(s => {
      const StyledComponent = withStyles(s.styles as AnyBecauseHard, {name: s.name})(DummyComponent)
      return <StyledComponent key={s.name}/>
    })}
  </div>
  const WrappedTree = wrapWithMuiTheme(DummyTree, context, themeOptions);
  
  ReactDOM.renderToString(WrappedTree);
  const jssStylesheet = context.sheetsRegistry.toString()
  const theme = getForumTheme(themeOptions);
  const cssVars = requestedCssVarsToString(theme);
  
  const mergedCSS = [
    draftjsStyles(theme),
    miscStyles(theme),
    jssStylesheet,
    ...theme.rawCSS,
    cssVars,
  ].join("\n");

  const minifiedCSS = minify(mergedCSS).css;
  return Buffer.from(minifiedCSS, "utf8");
}

type StylesheetAndHash = {
  resource: CompressedCacheResource,
  url: string,
}

const generateMergedStylesheetAndHash = (theme: ThemeOptions): StylesheetAndHash => {
  const stylesheet = generateMergedStylesheet(theme);
  const resource = brotliCompressResource(stylesheet);
  const url = `/allStyles?hash=${resource.hash}&theme=${encodeURIComponent(stringify(theme))}`;
  return { resource, url };
}

// Serialized ThemeOptions (string) -> StylesheetAndHash
const mergedStylesheets: Partial<Record<string, StylesheetAndHash>> = {};

type ThemeKey = {
  name: UserThemeName,
  forumTheme: ForumTypeString,
}

export const getMergedStylesheet = (theme: ThemeOptions): StylesheetAndHash => {
  const themeKeyData: ThemeKey = {
    name: theme.name,
    forumTheme: getForumType(theme),
  };
  const themeKey = stringify(themeKeyData);
  
  if (!mergedStylesheets[themeKey]) {
    mergedStylesheets[themeKey] = generateMergedStylesheetAndHash(theme);
  }
  const mergedStylesheet = mergedStylesheets[themeKey]!;
  
  return mergedStylesheet;
}

addStaticRoute("/allStyles", async ({query}, req, res, next) => {
  const expectedHash = query?.hash;
  const encodedThemeOptions = query?.theme;
  const serializedThemeOptions = decodeURIComponent(encodedThemeOptions);
  const validThemeOptions = isValidSerializedThemeOptions(serializedThemeOptions) ? JSON.parse(serializedThemeOptions) : {name:"default"}
  const mergedStylesheet = getMergedStylesheet(validThemeOptions);
  const stylesheetHash = mergedStylesheet.resource.hash;
  
  if (!expectedHash) {
    res.writeHead(302, {
      'Location': `/allStyles?theme=${encodedThemeOptions}&hash=${stylesheetHash}`
    })
    res.end('')
  } else if (expectedHash === stylesheetHash) {
    let headers: Record<string,string> = {
      "Cache-Control": expectedHash ? "public, max-age=604800, immutable" : "public, max-age=604800",
      "Content-Type": "text/css; charset=utf-8"
    };
    const canSendBrotli = mergedStylesheet.resource.brotli
      && req.headers['accept-encoding']
      && req.headers['accept-encoding'].includes('br');

    if (canSendBrotli) {
      headers["Content-Encoding"] = "br";
      res.writeHead(200, headers);
      res.end(mergedStylesheet.resource.brotli);
    } else {
      res.writeHead(200, headers);
      res.end(mergedStylesheet.resource.content);
    }
  } else {
    res.writeHead(404);
    res.end("");
  }
});
