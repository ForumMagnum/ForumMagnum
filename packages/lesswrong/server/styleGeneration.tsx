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
import { ForumTypeString } from '../lib/instanceSettings';
import { getForumTheme } from '../themes/forumTheme';
import { usedMuiStyles } from './usedMuiStyles';
import { requestedCssVarsToString } from '../themes/cssVars';
import { isGithubActions } from '../lib/executionEnvironment';
import { exec } from "child_process";
import { Stream } from 'stream';
import CleanCSS from "clean-css";

/**
 * Minify the CSS bundle,
 * Ordinarily, we do this by invoking cleancss as a separate cli process to
 * maximise the amount of parallelism we can get during server startup.
 * When we're running in Github CI, we instead do the conversion in-process as
 * we can't run multiple processes simultaneously.
 */
const minifyCss = (css: string): Promise<string> | string =>
  isGithubActions ? minifyCssSync(css) : minifyCssAsync(css);

const minifyCssSync = (css: string): string => new CleanCSS().minify(css).styles;

const minifyCssAsync = async (css: string): Promise<string> => {
  const command = 'yarn --silent cleancss';
  try {
    return await new Promise((resolve) => {
      const stdin = new Stream.Readable();
      stdin.push(css);
      stdin.push(null);
      const process = exec(command, {}, (_err,stdout,_stderr) => {
        resolve(stdout);
      });
      stdin.pipe(process.stdin!);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error in cleancss CSS minifier:', error);
    return css;
  }
}

const generateMergedStylesheet = async (themeOptions: ThemeOptions): Promise<Buffer> => {
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
    {Object.keys(usedMuiStyles).map((componentName: string) => {
      const StyledComponent = withStyles(usedMuiStyles[componentName], {name: componentName})(DummyComponent)
      return <StyledComponent key={componentName}/>
    })}
    {componentsWithStylesByPriority.map((componentName: string) => {
      const StyledComponent = withStyles(ComponentsTable[componentName].options?.styles, {name: componentName})(DummyComponent)
      return <StyledComponent key={componentName}/>
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

  const minifiedCSS = await minifyCss(mergedCSS);
  return Buffer.from(minifiedCSS, "utf8");
}

type StylesheetAndHash = {
  css: Buffer
  hash: string
}

const generateMergedStylesheetAndHash = async (theme: ThemeOptions): Promise<StylesheetAndHash> => {
  const stylesheet = await generateMergedStylesheet(theme);
  const hash = crypto.createHash('sha256').update(stylesheet).digest('hex');
  return {
    css: stylesheet,
    hash: hash,
  }
}

// Serialized ThemeOptions (string) -> StylesheetAndHash
const mergedStylesheets: Partial<Record<string, StylesheetAndHash>> = {};

type ThemeKey = {
  name: UserThemeName,
  forumTheme: ForumTypeString,
}

export type MergedStylesheet = {css: Buffer, url: string, hash: string};

export const getMergedStylesheet = async (theme: ThemeOptions): Promise<MergedStylesheet> => {
  const themeKeyData: ThemeKey = {
    name: theme.name,
    forumTheme: getForumType(theme),
  };
  const themeKey = JSON.stringify(themeKeyData);
  
  if (!mergedStylesheets[themeKey]) {
    mergedStylesheets[themeKey] = await generateMergedStylesheetAndHash(theme);
  }
  const mergedStylesheet = mergedStylesheets[themeKey]!;
  
  return {
    css: mergedStylesheet.css,
    url: `/allStyles?hash=${mergedStylesheet.hash}&theme=${encodeURIComponent(JSON.stringify(theme))}`,
    hash: mergedStylesheet.hash,
  };
}

addStaticRoute("/allStyles", async ({query}, req, res, next) => {
  const expectedHash = query?.hash;
  const encodedThemeOptions = query?.theme;
  const serializedThemeOptions = decodeURIComponent(encodedThemeOptions);
  const validThemeOptions = isValidSerializedThemeOptions(serializedThemeOptions) ? JSON.parse(serializedThemeOptions) : {name:"default"}
  const {hash: stylesheetHash, css} = await getMergedStylesheet(validThemeOptions);
  
  if (!expectedHash) {
    res.writeHead(302, {
      'Location': `/allStyles?theme=${encodedThemeOptions}&hash=${stylesheetHash}`
    })
    res.end('')
  } else if (expectedHash === stylesheetHash) {
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
