import fs from 'fs';
import path from 'path';
import '@/lib/utils/extendSimpleSchemaOptions';
import '@/lib/routes'
import { Routes, Route } from '@/lib/vulcan-lib/routes';
import util from 'util';
import { parsePath, parseRoute } from '@/lib/vulcan-core/appContext';

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

function extractMetadataFields(route: Route): Record<string, any> {
  const fields = [
    'title', 'subtitle', 'headerSubtitle', 
    'subtitleLink', 'description', 'noIndex',
    'background', 'hasLeftNavigationColumn', 
    'isAdmin', 'noFooter'
  ];

  const componentFields = ['titleComponent', 'subtitleComponent'] as const;
  
  const metadata: Record<string, any> = {};
  const imports = new Set<string>();

  for (const field of fields) {
    if (route[field as keyof Route] !== undefined) {
      metadata[field] = route[field as keyof Route];
    }
  }

  for (const field of componentFields) {
    const component = route[field];
    const componentName = component?.displayName ?? component?.name;
    if (componentName) {
      const componentImport = getComponentImport(componentName);
      addUseClientDirectiveToEntryComponent(componentImport);
      imports.add(componentImport);
      metadata[field] = componentName;
    }
  }
  
  return { metadata, imports: Array.from(imports) };
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

function generatePageContent(route: Route): string {
  if (route.redirect && !route.component) {
    return generateRedirectPage(route);
  }

  const componentName = route.component?.displayName ?? route.component?.name ?? 'UnknownComponent';
  const componentImport = getComponentImport(componentName);
  addUseClientDirectiveToEntryComponent(componentImport);
  
  const { metadata, imports } = extractMetadataFields(route);
  const hasMetadata = Object.keys(metadata).length > 0;

  let pageContent = `import React from "react";\n${componentImport}${imports.length > 0 ? '\n' : ''}${imports.join('\n')}\n`;
  
  if (hasMetadata) {
    pageContent += `import { RouteMetadataSetter } from '@/components/RouteMetadataContext';\n\n`;
  } else {
    pageContent += '\n';
  }
  
  pageContent += `export default function Page() {\n`;

  let routeMetadataSetter = '';
  
  if (hasMetadata) {
    routeMetadataSetter = `<RouteMetadataSetter metadata={${util.inspect(metadata, {depth: null})
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
      .join('\n  ')}} />`;
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
  
  return pageContent;
}

function generateRedirectPage(route: Route): string {
  if (!route.redirect) return '';
  
  // Convert the redirect function to Next.js format
  const redirectFunc = route.redirect.toString();

  let redirectValue: string | null = null;
  if (redirectFunc.startsWith('()=>')) {
    redirectValue = `'${route.redirect(null as AnyBecauseHard)}'`;
  } else {
    console.log(`Complex redirect function in ${route.path}: ${redirectFunc}`);
    redirectValue = `'' /* TODO: handle this manually! */`;
  }
  
  // Check whether the route has path params
  const parsedPath = parsePath(route.path);
  const parsedRoute = parseRoute({location: parsedPath});
  // TODO: maybe we actually just want to put all the redirects into next.config.js for performance reasons :(
  const hasPathParams = Object.keys(parsedRoute.params).length > 0;
  
  return `import { redirect } from 'next/navigation';

export default function Page() {
  redirect(${redirectValue});
}\n`;
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
