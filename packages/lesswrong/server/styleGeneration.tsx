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
import { isValidThemeName, ThemeName } from '../themes/themeNames';

const generateMergedStylesheet = (theme: ThemeName): string => {
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

const generateMergedStylesheetAndHash = (theme: ThemeName): StylesheetAndHash => {
  const stylesheet = generateMergedStylesheet(theme);
  const hash = crypto.createHash('sha256').update(stylesheet, 'utf8').digest('hex');
  return {
    css: stylesheet,
    hash: hash,
  }
}

const mergedStylesheets: Partial<Record<ThemeName, StylesheetAndHash>> = {};

export const getMergedStylesheet = (theme: ThemeName): {css: string, url: string, hash: string} => {
  if (!mergedStylesheets[theme]) {
    mergedStylesheets[theme] = generateMergedStylesheetAndHash(theme);
  }
  const mergedStylesheet = mergedStylesheets[theme]!;
  
  return {
    css: mergedStylesheet.css,
    url: `/allStyles?hash=${mergedStylesheet.hash}&theme=${theme}`,
    hash: mergedStylesheet.hash,
  };
}

addStaticRoute("/allStyles", ({query}, req, res, next) => {
  const expectedHash = query?.hash;
  const themeName = query?.theme ?? "default";
  const validThemeName = isValidThemeName(themeName) ? themeName : "default";
  const {hash: stylesheetHash, css} = getMergedStylesheet(validThemeName);
  
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
