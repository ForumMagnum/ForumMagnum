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

const generateMergedStylesheet = (): string => {
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
  const WrappedTree = wrapWithMuiTheme(DummyTree, context);
  
  ReactDOM.renderToString(WrappedTree);
  const jssStylesheet = context.sheetsRegistry.toString()
  
  return [
    datetimeStyles,
    draftjsStyles,
    miscStyles,
    jssStylesheet
  ].join("\n");
}

let mergedStylesheet: string|null = null;
let stylesheetHash: string|null = null;

export const getMergedStylesheet = (): {css: string, url: string, hash: string} => {
  if (!mergedStylesheet)
    mergedStylesheet = generateMergedStylesheet();
  if (!stylesheetHash)
    stylesheetHash = crypto.createHash('sha256').update(mergedStylesheet, 'utf8').digest('hex');
  return {
    css: mergedStylesheet,
    url: `/allStyles?hash=${stylesheetHash}`,
    hash: stylesheetHash,
  };
}

addStaticRoute("/allStyles", ({query}, req, res, next) => {
  const expectedHash = query?.hash;
  const {hash: stylesheetHash, css} = getMergedStylesheet();
  
  if (!expectedHash || expectedHash === stylesheetHash) {
    res.writeHead(200, {
      "Cache-Control": "public, max-age=604800, immutable",
      "Content-Type": "text/css; charset=utf-8"
    });
    res.end(css);
  } else {
    res.writeHead(404);
    res.end("");
  }
});
