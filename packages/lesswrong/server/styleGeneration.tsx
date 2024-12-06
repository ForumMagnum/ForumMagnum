import React from 'react';
import ReactDOM from 'react-dom/server';
// Adds selected MUI components to global styles.
// import './register-mui-styles';
import { importAllComponents, ComponentsTable } from '../lib/vulcan-lib/components';
import { withStyles } from '@material-ui/core/styles';
import { wrapWithMuiTheme } from './material-ui/themeProvider';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import filter from 'lodash/filter'
import sortBy from 'lodash/sortBy';
import crypto from 'crypto'; //nodejs core library
import draftjsStyles from '../themes/globalStyles/draftjsStyles';
import miscStyles from '../themes/globalStyles/miscStyles';
import { isValidSerializedThemeOptions, ThemeOptions, getForumType } from '../themes/themeNames';
import type { ForumTypeString } from '../lib/instanceSettings';
import { getForumTheme } from '../themes/forumTheme';
import { usedMuiStyles } from './usedMuiStyles';
import { minify } from 'csso';
import { requestedCssVarsToString } from '../themes/cssVars';
import stringify from 'json-stringify-deterministic';
import { zlib } from 'mz';
import { brotliCompressResource, CompressedCacheResource } from './utils/bundleUtils';
import { topLevelStyleDefinitions } from '@/components/hooks/useStyles';
import keyBy from 'lodash/keyBy';

export type ClassNameProxy<T extends string = string> = Record<T,string>
export type StyleDefinition<T extends string = string> = {
  name: string
  styles: (theme: ThemeType) => JssStyles<T>
  options?: StyleOptions
  nameProxy: ClassNameProxy<T>|null
}

export type StyleOptions = {
  // Whether to ignore the presence of colors that don't come from the theme in
  // the component's stylesheet. Use for things that don't change color with
  // dark mode.
  allowNonThemeColors?: boolean,
  
  // Default is 0. If classes with overlapping attributes from two different
  // components' styles wind up applied to the same node, the one with higher
  // priority wins.
  stylePriority?: number,
}

const generateMergedStylesheet = (themeOptions: ThemeOptions): Buffer => {
  importAllComponents();
  
  const context: any = {};
  
  // Sort components by stylePriority, tiebroken by name (alphabetical)
  const componentStyles: Record<string,StyleDefinition> = keyBy(
    Object.keys(ComponentsTable)
      .filter(componentName => !!ComponentsTable[componentName].options?.styles)
      .map(componentName => ({
        name: componentName,
        styles: ComponentsTable[componentName].options!.styles!,
        options: ComponentsTable[componentName].options,
        nameProxy: null
      })),
    c=>c.name
  );
  const allStyles = {
    ...componentStyles,
    ...topLevelStyleDefinitions,
  };
  
  const stylesByName = sortBy(Object.keys(allStyles), n=>n);
  const stylesByNameAndPriority = sortBy(stylesByName, n=>allStyles[n].options?.stylePriority ?? 0);
  
  const DummyComponent = (props: any) => <div/>
  const DummyTree = <div>
    {Object.keys(usedMuiStyles).map((componentName: string) => {
      const StyledComponent = withStyles(usedMuiStyles[componentName], {name: componentName})(DummyComponent)
      return <StyledComponent key={componentName}/>
    })}
    {stylesByNameAndPriority.map((name: string) => {
      const styles = allStyles[name]!.styles
      const StyledComponent = withStyles(styles as any, {name})(DummyComponent)
      return <StyledComponent key={name}/>
    })}
  </div>
  const WrappedTree = wrapWithMuiTheme(DummyTree, context, themeOptions);
  
  ReactDOM.renderToString(WrappedTree);
  const jssStylesheet = context.sheetsRegistry.toString()
  const theme = getForumTheme(themeOptions);
  const cssVars = requestedCssVarsToString(theme);
  
  const mergedCSS = [
    draftjsStyles(),
    miscStyles(),
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
