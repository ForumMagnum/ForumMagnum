import React from 'react';
import ReactDOM from 'react-dom/server';
import { importAllComponents, ComponentsTable } from '../lib/vulcan-lib/components';
import { withStyles } from '@material-ui/core/styles';
import { wrapWithMuiTheme } from './material-ui/themeProvider';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import * as _ from 'underscore';
import crypto from 'crypto'; //nodejs core library

const generateMergedStylesheet = (): string => {
  importAllComponents();
  
  const context: any = {};
  const componentsWithStyles = _.filter(Object.keys(ComponentsTable),
    componentName=>ComponentsTable[componentName].options?.styles);
  
  const DummyComponent = (props: any) => <div/>
  const DummyTree = <div>
    {componentsWithStyles.map(componentName => {
      const StyledComponent = withStyles(ComponentsTable[componentName].options?.styles, {name: componentName})(DummyComponent)
      return <StyledComponent key={componentName}/>
    })}
  </div>
  const WrappedTree = wrapWithMuiTheme(DummyTree, context);
  
  ReactDOM.renderToString(WrappedTree);
  const stylesheet = context.sheetsRegistry.toString()
  return stylesheet;
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
