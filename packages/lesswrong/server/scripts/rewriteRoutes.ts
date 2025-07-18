import fs from 'fs';
import path from 'path';
import '@/lib/routes'
import { Routes, Route } from '@/lib/vulcan-lib/routes';
import util from 'util';
import { parsePath, parseRoute } from '@/lib/vulcan-core/appContext';
import type { Redirect } from 'next/dist/lib/load-custom-routes';

const routesFileContents = fs.readFileSync('packages/lesswrong/lib/routes.ts', 'utf8');
const routesFileLines = routesFileContents.split('\n');

function getAbsoluteComponentPathFromImportLine(importLine: string): string {
  let importPathString = importLine.split('from ')[1];
  if (importPathString.endsWith(';')) {
    importPathString = importPathString.slice(0, -1);
  }
  importPathString = importPathString.slice(1, -1);

  return importPathString.replace('@', 'packages/lesswrong') + '.tsx';
}

function getComponentImport(componentName: string): string {
  const routeImportLine = routesFileLines.find(line => (line.startsWith('import') || line.startsWith('// import')) && line.includes(` ${componentName} `));
  if (!routeImportLine) {
    throw new Error(`No import found for component ${componentName}`);
  }

  if (routeImportLine.startsWith('// import')) {
    return routeImportLine.replace('// import', 'import');
  }

  return routeImportLine;
}

function expandRoutePath(routePath: string): string[] {
  // Handle simple optional segments
  // For complex patterns with multiple consecutive optionals, we'll use middleware
  const hasComplexPattern = /\([^)]+\)\?.*\([^)]+\)\?/.test(routePath);
  
  if (hasComplexPattern) {
    // Return just the base pattern, middleware will handle it
    return [routePath];
  }

  // Handle single optional segments
  const optionalMatch = routePath.match(/^(.*?)\/:([\w]+)\?(.*)$/);
  if (optionalMatch) {
    const [, prefix, param, suffix] = optionalMatch;
    return [
      `${prefix}${suffix}`,
      `${prefix}/:${param}${suffix}`
    ].filter(p => p !== '');
  }

  return [routePath];
}

function convertToNextJsPath(routePath: string): string {
  // Remove leading slash and convert :param to [param]
  return routePath
    .replace(/^\//, '')
    .replace(/:([^\/\(]+)(\([^\)]+\))?/g, '[$1]')
    .replace(/\?/g, ''); // Remove optional markers
}

const titleComponentMetadataFunctionMap = {
  PostsPageHeaderTitle: `export const generateMetadata = getPostPageMetadataFunction<{ /* TODO: fill this in based on this route's params! */ }>(({ _id }) => _id);`,
  TagPageTitle: `export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);`,
  TagHistoryPageTitle: `export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { historyPage: true });`,
  LocalgroupPageTitle: `export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> { /* TODO: fill this in! */ }`,
  UserPageTitle: `export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { /* TODO: fill this in! */ }`,
  SequencesPageTitle: `export async function generateMetadata({ params }: { params: Promise<{ _id: string }> }): Promise<Metadata> { /* TODO: fill this in! */ }`,
};

const routeMetadataFields = ['title', 'subtitle', 'description', 'noIndex'] as const;

const routeConfigFields = [
  'subtitle', 'headerSubtitle', 'subtitleLink',
  'background', 'hasLeftNavigationColumn', 
  'isAdmin', 'noFooter'
];

function extractMetadataFields(route: Route) {
  const componentFields = ['titleComponent', 'subtitleComponent'] as const;
  
  const routeConfig: Record<string, any> = {};
  const staticMetadata: {
    title?: string;
    subtitle?: string;
    description?: string;
    noIndex?: boolean;
  } = {};

  const imports = new Set<string>();

  for (const field of routeConfigFields) {
    if (route[field as keyof Route] !== undefined) {
      routeConfig[field] = route[field as keyof Route];
    }
  }

  for (const field of routeMetadataFields) {
    if (route[field] !== undefined) {
      if (field === 'noIndex') {
        staticMetadata[field] = route[field] ? true : false;
      } else {
        staticMetadata[field] = route[field];
      }
    }
  }

  for (const field of componentFields) {
    const component = route[field];
    const componentName = component?.displayName ?? component?.name;
    if (componentName) {
      const componentImport = getComponentImport(componentName);
      addUseClientDirectiveToEntryComponent(componentImport);
      imports.add(componentImport);
      routeConfig[field] = componentName;
    }
  }
  
  return { routeConfig, staticMetadata, imports: Array.from(imports) };
}

const configLevelRedirects = [
  '/tag/:slug',
  '/p/:slug',
  '/compare/tag/:slug',
  '/revisions/tag/:slug',
  '/users/:slug/reviews',
  '/votesByYear/:year',
];

function addUseClientDirectiveToEntryComponent(importLine: string) {
  const componentPath = getAbsoluteComponentPathFromImportLine(importLine);
  const componentFileContents = fs.readFileSync(componentPath, 'utf8');
  const useClientDirective = componentFileContents.includes('use client');
  if (!useClientDirective) {
    fs.writeFileSync(componentPath, `"use client";\n\n${componentFileContents}`);
  }
}

const generateMetadataFunctionTemplate = `export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    $(titleLine)
    $(noIndexLine)
  }$(descriptionFields));
}`;

const reactImport = 'import React from "react";';
const defaultMetadataImport = 'import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";';
const metadataTypeImport = 'import type { Metadata } from "next";';

function generatePageContent(route: Route): string {
  if (route.redirect && !route.component) {
    return generateRedirectPage(route);
  }

  if (route.redirect && route.component) {
    console.warn(`Route ${route.path} has both a redirect and a component!`);
  }

  const componentName = route.component?.displayName ?? route.component?.name ?? 'UnknownComponent';
  const componentImport = getComponentImport(componentName);
  addUseClientDirectiveToEntryComponent(componentImport);
  
  const { routeConfig, staticMetadata, imports } = extractMetadataFields(route);
  const hasRouteConfig = Object.keys(routeConfig).length > 0;
  const hasStaticMetadata = Object.keys(staticMetadata).length > 0;

  const pageImports: string[] = [reactImport, componentImport, ...imports];

  let pageContent = ''; // `import React from "react";\n${componentImport}${imports.length > 0 ? '\n' : ''}${imports.join('\n')}\n`;
  
  if (hasRouteConfig) {
    pageImports.push('import { RouteMetadataSetter } from "@/components/RouteMetadataContext";');
  }

  if (routeConfig.titleComponent && hasStaticMetadata) {
    console.warn(`Route ${route.path} has both a titleComponent and static metadata!`);
  }

  if (routeConfig.titleComponent) {
    const titleComponentMetadataFunction = titleComponentMetadataFunctionMap[routeConfig.titleComponent as keyof typeof titleComponentMetadataFunctionMap];
    if (!titleComponentMetadataFunction) {
      throw new Error(`No metadata function found for title component ${route.path} (titleComponent: ${routeConfig.titleComponent})`);
    }

    if (routeConfig.titleComponent === 'PostsPageHeaderTitle') {
      pageImports.push('import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";');
    } else if (routeConfig.titleComponent === 'TagPageTitle' || routeConfig.titleComponent === 'TagHistoryPageTitle') {
      pageImports.push('import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";');
    } else {
      pageImports.push(metadataTypeImport);
    }

    if (hasStaticMetadata && (routeConfig.titleComponent !== 'PostsPageHeaderTitle' || Object.keys(staticMetadata).some(key => key !== 'subtitle'))) {
      pageContent += `// TODO: This route has both a titleComponent and static metadata (${util.inspect(staticMetadata, {depth: null})})!  You will need to manually merge the two.\n\n`;
    }

    pageContent += titleComponentMetadataFunction;
    pageContent += '\n\n';
  } else if (hasStaticMetadata) {
    pageImports.push(defaultMetadataImport);
    pageImports.push(metadataTypeImport);
    pageImports.push('import merge from "lodash/merge";');

    const routeTitle = staticMetadata.title ?? staticMetadata.subtitle;
    const routeDescription = staticMetadata.description;
    const routeNoIndex = staticMetadata.noIndex;

    let generateMetadataBuilder = generateMetadataFunctionTemplate;

    if (routeTitle) {
      generateMetadataBuilder = generateMetadataBuilder.replace('$(titleLine)', `title: '${routeTitle}',`);
    } else {
      generateMetadataBuilder = generateMetadataBuilder.replace('    $(titleLine)\n', '');
    }

    if (routeNoIndex) {
      generateMetadataBuilder = generateMetadataBuilder.replace('$(noIndexLine)', 'robots: { index: false },');
    } else {
      generateMetadataBuilder = generateMetadataBuilder.replace('    $(noIndexLine)\n', '');
    }

    if (routeDescription) {
      pageImports[pageImports.indexOf(defaultMetadataImport)] = defaultMetadataImport.replace(' }', ', getMetadataDescriptionFields }');
      generateMetadataBuilder = generateMetadataBuilder.replace('$(descriptionFields)', `, getMetadataDescriptionFields('${routeDescription}')`);
    } else {
      generateMetadataBuilder = generateMetadataBuilder.replace('$(descriptionFields)', '');
    }

    pageContent += generateMetadataBuilder;
    pageContent += '\n\n';
  } else {
    pageContent += '\n';
  }
  
  pageContent += `export default function Page() {\n`;

  let routeMetadataSetter = '';
  
  if (hasRouteConfig) {
    routeMetadataSetter = `<RouteMetadataSetter metadata={${util.inspect(routeConfig, {depth: null})
      .split('\n')
      .map(line => {
        let updatedLine = line;
        if (line.includes('titleComponent:')) {
          updatedLine = line.replace(/titleComponent: \'([a-zA-Z0-9]+)\'/, 'titleComponent: $1');
        }
        if (line.includes('subtitleComponent:')) {
          updatedLine = line.replace(/subtitleComponent: \'([a-zA-Z0-9]+)\'/, 'subtitleComponent: $1');
        }
        return updatedLine;
      })
      .join('\n    ')}} />`;
  }
  
  if (route.enableResourcePrefetch) {
    const prefetchValue = typeof route.enableResourcePrefetch === 'function' 
      ? 'function' 
      : route.enableResourcePrefetch;
    pageContent += `  // enableResourcePrefetch was: ${prefetchValue}\n`;
    pageContent += `  \n`;
  }

  let finalComponentString = '';
  
  // Handle _id prop for PostsSingleRoute
  if (route._id && componentName === 'PostsSingleRoute') {
    // Check if it's from a setting
    const idProp = route._id.includes('Setting.get()') 
      ? ` _id={${route._id}}`
      : ` _id="${route._id}"`;

    finalComponentString = `<${componentName}${idProp} />`;
  } else {
    finalComponentString = `<${componentName} />`;
  }

  if (routeMetadataSetter) {
    pageContent += `  return <>
    ${routeMetadataSetter}
    ${finalComponentString}
  </>;\n`;
  } else {
    pageContent += `  return ${finalComponentString};\n`;
  }

  pageContent += `}\n`;
  
  return pageImports.join('\n') + '\n\n' + pageContent;
}

function generateRedirectPage(route: Route): string {
  if (!route.redirect) return '';
  
  // Convert the redirect function to Next.js format
  const redirectFunc = route.redirect.toString();

  let redirectValue: string | null = null;
  if (redirectFunc.startsWith('()=>')) {
    redirectValue = `${route.redirect(null as AnyBecauseHard)}`;
  } else {
    console.log(`Complex redirect function in ${route.path}: ${redirectFunc}`);
    redirectValue = `'' /* TODO: handle this manually! */`;
  }

  const previousRedirects: Redirect[] = JSON.parse(fs.readFileSync('redirects.json', 'utf8'));
  previousRedirects.push({
    source: route.path,
    destination: redirectValue,
    permanent: true,
  });

  fs.writeFileSync('redirects.json', JSON.stringify(previousRedirects, null, 2));

  return '';
  
//   // Check whether the route has path params
//   const parsedPath = parsePath(route.path);
//   const parsedRoute = parseRoute({location: parsedPath});
//   // TODO: maybe we actually just want to put all the redirects into next.config.js for performance reasons :(
//   const hasPathParams = Object.keys(parsedRoute.params).length > 0;
  
//   return `import { redirect } from 'next/navigation';

// export default function Page() {
//   redirect(${redirectValue});
// }\n`;
}

function hasMultipleConsecutiveOptionals(path: string): boolean {
  // return /\([^)]+\)\?.*\([^)]+\)\?/.test(path);
  return path.split('').filter(c => c === '?').length > 1;
}

function hasComplexPatterns(path: string): boolean {
  // Check for patterns with values in parentheses like /:section(r)?
  return /:\w+\([^)]+\)/.test(path);
}

function normalizeConflictingPath(path: string): string {
  if (path === 's/[sequenceId]/p/[postId]') {
    return 's/[_id]/p/[postId]';
  }
  return path;
}

async function generatePageFiles(route: Route) {
  const paths = expandRoutePath(route.path);
  
  for (const expandedPath of paths) {
    const nextJsPath = convertToNextJsPath(expandedPath);
    const normalizedPath = normalizeConflictingPath(nextJsPath);
    const pageContent = generatePageContent(route);
    const filePath = path.join('app', normalizedPath, 'page.tsx');
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.log(`Skipping: ${filePath} (already exists)`);
      continue;
    }
    
    fs.writeFileSync(filePath, pageContent);
  }
}

async function generatePingbackMapping(routes: Route[]) {
  const mapping: Record<string, string> = {};
  const pingbackFunctions = new Set<string>();
  
  for (const route of routes) {
    if (route.getPingback) {
      const funcName = route.getPingback.name || 'anonymous';
      mapping[route.path] = funcName;
      if (funcName !== 'anonymous') {
        pingbackFunctions.add(funcName);
      }
    }
  }
  
  const imports = Array.from(pingbackFunctions).includes('getPostPingbackById') ||
                  Array.from(pingbackFunctions).includes('getPostPingbackByLegacyId') ||
                  Array.from(pingbackFunctions).includes('getPostPingbackBySlug') ||
                  Array.from(pingbackFunctions).includes('getTagPingbackBySlug') ||
                  Array.from(pingbackFunctions).includes('getUserPingbackBySlug')
    ? `import { ${Array.from(pingbackFunctions).join(', ')} } from '@/lib/pingback';`
    : '';

  const content = `${imports}

export const routePingbackMapping: Record<string, any> = {
${Object.entries(mapping).map(([path, func]) => 
  `  '${path}': ${func},`
).join('\n')}
};`;
  
  const dir = 'packages/lesswrong/lib/routeMappings';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, 'pingbacks.ts'), content);
  console.log('Created: packages/lesswrong/lib/routeMappings/pingbacks.ts');
}

async function generateMiddleware(routes: Route[]) {
  const complexRoutes = routes.filter(route => 
    hasMultipleConsecutiveOptionals(route.path) || 
    hasComplexPatterns(route.path)
  );
  
  if (complexRoutes.length === 0) {
    console.log('No complex routes requiring middleware');
    return;
  }
  
  const middlewareContent = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle complex legacy routes
  ${complexRoutes.map(route => {
    const pattern = route.path
      .replace(/:\w+\([^)]+\)\?/g, '([^/]*)')
      .replace(/:\w+\?/g, '([^/]*)')
      .replace(/:\w+/g, '([^/]+)');
    
    return `
  // ${route.name}: ${route.path}
  const ${route.name.replace(/[.-]/g, '_')}_match = pathname.match(/^${pattern.replace(/\//g, '\\/')}$/);
  if (${route.name.replace(/[.-]/g, '_')}_match) {
    // Route matched, NextJS will handle it
    return NextResponse.next();
  }`;
  }).join('\n')}
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Include all dynamic routes that need special handling
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};`;
  
  fs.writeFileSync('middleware.ts', middlewareContent);
  console.log('Created: middleware.ts');
}

export async function main() {
  console.log('Starting route migration...');
  console.log(`Found ${Object.keys(Routes).length} routes to migrate`);
  
  const routes = Object.values(Routes);
  const filteredRoutes = routes.filter(route => !configLevelRedirects.some(redirect => route.path.startsWith(redirect)));

  // Reset the redirects file
  fs.writeFileSync('redirects.json', '[]');
  
  for (const route of filteredRoutes) {
    await generatePageFiles(route);
  }
  
  console.log('\nGenerating mapping files...');
  await generatePingbackMapping(filteredRoutes);
  
  console.log('\nGenerating middleware...');
  await generateMiddleware(filteredRoutes);
  
  console.log('\nMigration complete!');
  console.log('\nNext steps:');
  console.log('1. Update Layout.tsx to import and use route check helpers');
  console.log('2. Update HoverPreviewLink.tsx to use routePreviewComponentMapping');
  console.log('3. Update pingback system to use routePingbackMapping');
  console.log('4. Test all routes thoroughly');
}

export function getAllComponents() {
  console.log('Starting getAllComponents...');
  console.log(`Found ${Object.keys(Routes).length} routes to migrate`);

  const routes = Object.values(Routes);
  const components = routes.map(route => route.component).filter(c => !!c);
  const componentNames = new Set(components.map(c => c.displayName ?? c.name));
  console.log(componentNames);
}

function addUseClientDirectiveToComponent(componentPath: string) {
  const componentFileContents = fs.readFileSync(componentPath, 'utf8');
  const useClientDirective = componentFileContents.includes('use client');
  if (!useClientDirective) {
    fs.writeFileSync(componentPath, `"use client";\n\n${componentFileContents}`);
  }
}

export function addUseClientToAllComponents() {
  const allComponentsFile = fs.readFileSync('packages/lesswrong/lib/generated/allComponents.ts', 'utf8');
  const nonRegisteredComponentsFile = fs.readFileSync('packages/lesswrong/lib/generated/nonRegisteredComponents.ts', 'utf8');

  const allComponentImports = allComponentsFile.split('\n').filter(line => line.startsWith('import')).map(line => line.split('"')[1].replace('../../', 'packages/lesswrong/'));
  const nonRegisteredComponentImports = nonRegisteredComponentsFile.split('\n').filter(line => line.startsWith('import')).map(line => line.split('"')[1].replace('../../', 'packages/lesswrong/'));

  for (const importLine of allComponentImports) {
    addUseClientDirectiveToComponent(importLine);
  }

  for (const importLine of nonRegisteredComponentImports) {
    addUseClientDirectiveToComponent(importLine);
  }
}
