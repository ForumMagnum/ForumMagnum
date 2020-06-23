import React from 'react';
import ReactDOM from 'react-dom/server';
import { getDataFromTree } from 'react-apollo';
import { importAllComponents, ComponentsTable } from '../lib/vulcan-lib/components';
import { Globals } from '../lib/vulcan-lib/config';
import { createGenerateClassName, withStyles } from '@material-ui/core/styles';
import forumTheme from '../themes/forumTheme';
import { SheetsRegistry } from 'react-jss/lib/jss';
import { wrapWithMuiTheme } from './material-ui/themeProvider';
import { addStaticRoute } from './vulcan-lib';
import * as _ from 'underscore';
import crypto from 'crypto'; //nodejs core library

const generateMergedStylesheet = () => {
  console.log("In generateMergedStylesheet");
  importAllComponents();
  
  const context: any = {};
  const componentsWithStyles = _.filter(Object.keys(ComponentsTable),
    componentName=>ComponentsTable[componentName].styles);
  console.log(`${componentsWithStyles.length} components`);
  
  const DummyComponent = (props) => <div/>
  const DummyTree = <div>
    {componentsWithStyles.map(componentName => {
      const StyledComponent = withStyles(ComponentsTable[componentName].styles, {name: componentName})(DummyComponent)
      return <StyledComponent key={componentName}/>
    })}
  </div>
  const WrappedTree = wrapWithMuiTheme(DummyTree, context);
  
  ReactDOM.renderToString(WrappedTree);
  const stylesheet = context.sheetsRegistry.toString()
  console.log("generateMergedStylesheet returning length "+stylesheet.length);
  return stylesheet;
}

let mergedStylesheet: string|null = null;
let stylesheetHash: string|null = null;

export const getMergedStylesheet = () => {
  if (!mergedStylesheet) {
    mergedStylesheet = generateMergedStylesheet();
    stylesheetHash = crypto.createHash('sha256').update(mergedStylesheet, 'utf8').digest('hex');
  }
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
      "Content-Type": "text/css"
    });
    res.end(css);
  } else {
    res.writeHead(404);
    res.end("");
  }
});
