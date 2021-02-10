import React from 'react';
import ReactDOM from 'react-dom/server';
import { importAllComponents, ComponentsTable } from '../lib/vulcan-lib/components';
import { withStyles } from '@material-ui/core/styles';
import { wrapWithMuiTheme } from './material-ui/themeProvider';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import filter from 'lodash/filter'
import sortBy from 'lodash/sortBy';
import crypto from 'crypto'; //nodejs core library
import datetimeStyles from '../styles/datetimeStyles';
import draftjsStyles from '../styles/draftjsStyles';
import miscStyles from '../styles/miscStyles';
import { isValidSerializedThemeOptions, ThemeOptions, getForumType } from '../themes/themeNames';
import { forumTypeSetting } from '../lib/instanceSettings';

const generateMergedStylesheet = (theme: ThemeOptions): string => {
  importAllComponents();
  
  const context: any = {};
  
  // Sort components by stylePriority, tiebroken by name (alphabetical)
  const componentsWithStyles = filter(Object.keys(ComponentsTable),
    componentName => ComponentsTable[componentName].options?.styles
  ) as Array<string>;
  const componentsWithStylesByName = sortBy(componentsWithStyles, n=>n);
  const componentsWithStylesByPriority = sortBy(componentsWithStylesByName, (componentName: string) => ComponentsTable[componentName].options?.stylePriority || 0);
  
  const DummyComponent = (props: any) => <div/>
  const DummyTree = <div>
    {componentsWithStylesByPriority.map((componentName: string) => {
      const StyledComponent = withStyles(ComponentsTable[componentName].options?.styles, {name: componentName})(DummyComponent)
      return <StyledComponent key={componentName}/>
    })}
  </div>
  const WrappedTree = wrapWithMuiTheme(DummyTree, context, theme);
  
  ReactDOM.renderToString(WrappedTree);
  const jssStylesheet = context.sheetsRegistry.toString()
  
  return [
    datetimeStyles,
    draftjsStyles,
    miscStyles,
    jssStylesheet
  ].join("\n");
}

type StylesheetAndHash = {
  css: string
  hash: string
}

const generateMergedStylesheetAndHash = (theme: ThemeOptions): StylesheetAndHash => {
  const stylesheet = generateMergedStylesheet(theme);
  const hash = crypto.createHash('sha256').update(stylesheet, 'utf8').digest('hex');
  return {
    css: stylesheet,
    hash: hash,
  }
}

// Serialized ThemeOptions (string) -> StylesheetAndHash
const mergedStylesheets: Partial<Record<string, StylesheetAndHash>> = {};

export const getMergedStylesheet = (theme: ThemeOptions): {css: string, url: string, hash: string} => {
  const actualForumType = forumTypeSetting.get();
  const themeKey = JSON.stringify({
    name: theme.name,
    forumTheme: getForumType(theme),
  });
  
  if (!mergedStylesheets[themeKey]) {
    mergedStylesheets[themeKey] = generateMergedStylesheetAndHash(theme);
  }
  const mergedStylesheet = mergedStylesheets[themeKey]!;
  
  return {
    css: mergedStylesheet.css,
    url: `/allStyles?hash=${mergedStylesheet.hash}&theme=${encodeURIComponent(JSON.stringify(theme))}`,
    hash: mergedStylesheet.hash,
  };
}

addStaticRoute("/allStyles", ({query}, req, res, next) => {
  const expectedHash = query?.hash;
  const encodedThemeOptions = query?.theme;
  const serializedThemeOptions = decodeURIComponent(encodedThemeOptions);
  const validThemeOptions = isValidSerializedThemeOptions(serializedThemeOptions) ? JSON.parse(serializedThemeOptions) : {name:"default"}
  const {hash: stylesheetHash, css} = getMergedStylesheet(validThemeOptions);
  
  if (!expectedHash || expectedHash === stylesheetHash) {
    res.writeHead(200, {
      "Cache-Control": expectedHash ? "public, max-age=604800, immutable" : "public, max-age=604800",
      "Content-Type": "text/css; charset=utf-8"
    });
    res.end(css);
  } else {
    res.writeHead(404);
    res.end("");
  }
});
