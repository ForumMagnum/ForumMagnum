import fs from 'fs';
import React from 'react';
import './pages/api/reactFactoryShim'
import path from 'path';

let Routes: any[] = []

// Configuration
const LW_ROOT_DIR = './lesswrong/packages/lesswrong';
const COMPONENTS_DIR = path.join(LW_ROOT_DIR, 'components');
const APP_DIR = './app'; // Where your Next.js app directory is located

// Helper function to convert route path to directory structure
function routePathToDirectoryPath(routePath: string): string {
  // Remove optional parameters - Next.js doesn't support them
  // We'll handle them by creating separate routes or using catch-all routes
  let dirPath = routePath.replace(/\/:[a-zA-Z0-9_]+\?/g, '');
  
  // Replace dynamic parameters with Next.js folder naming convention
  // e.g., '/users/:slug' becomes '/users/[slug]'
  dirPath = dirPath.replace(/\/:[a-zA-Z0-9_]+/g, (match) => {
    const paramName = match.substring(2);
    return `/[${paramName}]`;
  });
  
  // Handle root path
  if (dirPath === '/') {
    return '';
  }
  
  // Remove trailing slash if present
  if (dirPath.endsWith('/')) {
    dirPath = dirPath.slice(0, -1);
  }
  
  return dirPath;
}

// Helper function to find component file path
function findComponentFilePath(componentName: string): string | null {
  // This is a simplified approach - you might need to adjust based on your project structure
  // Recursively search for the component file
  function searchDirectory(dir: string): string | null {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        const result = searchDirectory(filePath);
        if (result) return result;
      } else if (
        file === `${componentName}.jsx` || 
        file === `${componentName}.tsx` ||
        file === `${componentName}.js` ||
        file === `${componentName}.ts`
      ) {
        return filePath;
      }
    }
    
    return null;
  }
  
  return searchDirectory(COMPONENTS_DIR);
}

// Check if a component is exported as default or named
function isDefaultExport(componentFilePath: string): boolean {
  try {
    const content = fs.readFileSync(componentFilePath, 'utf8');
    // This is a simple heuristic - might need refinement for complex cases
    return content.includes(`export default ${path.basename(componentFilePath, path.extname(componentFilePath))}`) || 
           content.includes('export default function') ||
           content.includes('export default class') || 
           content.includes('export default const');
  } catch (e) {
    console.warn(`Could not read file ${componentFilePath}`);
    return false;
  }
}

// Convert a file path to an @/ import path
function getAliasImportPath(filePath: string): string {
  // Remove the LW_ROOT_DIR prefix and file extension
  const relativePath = filePath
    .replace('lesswrong/packages/lesswrong/', '')
    .replace(/\.[jt]sx?$/, '');
  
  // Add the @/ prefix
  return `@/${relativePath}`;
}

// Create page.tsx file for a route
function createPageFile(route: any, componentFilePath: string): string {
  // Get the aliased import path
  const aliasImportPath = getAliasImportPath(componentFilePath);
  
  // Check if the component is a default export
  const isDefault = isDefaultExport(componentFilePath);
  
  // Create the page.tsx content
  return `"use client";

import ${isDefault ? componentFilePath ? path.basename(componentFilePath, path.extname(componentFilePath)) : route.componentName : `{ ${route.componentName} }`} from '${aliasImportPath}';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      ${route.title ? `<Helmet><title>${route.title}</title>${route.description ? `<meta name="description" content="${route.description}" />` : ''}</Helmet>` : ''}
      <${route.componentName} />
    </>
  );
}
`;
}

// Normalize paths to avoid conflicts
function normalizePaths(routes: any[]): Map<string, any> {
  const pathMap = new Map<string, any>();
  
  // First pass: collect all paths and identify conflicts
  for (const route of routes) {
    if (!route.componentName || route.redirect) {
      continue;
    }
    
    const dirPath = routePathToDirectoryPath(route.path);
    
    // If we already have this path, check if it's a conflict or just a different name for the same component
    if (pathMap.has(dirPath)) {
      const existingRoute = pathMap.get(dirPath);
      if (existingRoute.componentName !== route.componentName) {
        console.warn(`Path conflict: ${dirPath} has multiple components: ${existingRoute.componentName} and ${route.componentName}`);
        // We'll handle this later by adjusting the path
      }
    } else {
      pathMap.set(dirPath, route);
    }
  }
  
  // Second pass: resolve conflicts by adjusting paths
  // This is a simplified approach - you might need more sophisticated conflict resolution
  for (const route of routes) {
    if (!route.componentName || route.redirect) {
      continue;
    }
    
    const dirPath = routePathToDirectoryPath(route.path);
    
    if (pathMap.has(dirPath) && pathMap.get(dirPath) !== route) {
      // This is a conflict - adjust the path
      // For example, if we have /s/:id and /s/:sequenceId/p/:postId
      // We'll keep /s/:id as is and adjust /s/:sequenceId/p/:postId to use the same parameter name
      
      // This is a simplified approach - you might need to customize this based on your routes
      const adjustedPath = route.path.replace(/\/:[a-zA-Z0-9_]+\//g, '/:[id]/');
      const adjustedDirPath = routePathToDirectoryPath(adjustedPath);
      
      if (!pathMap.has(adjustedDirPath)) {
        pathMap.set(adjustedDirPath, { ...route, originalPath: route.path, path: adjustedPath });
      } else {
        console.error(`Could not resolve path conflict for ${route.path}`);
      }
    }
  }
  
  return pathMap;
}

// Process each route
function processRoutes() {
  // Normalize paths to avoid conflicts
  const normalizedRoutes = normalizePaths(Routes);
  
  for (const [dirPath, route] of normalizedRoutes.entries()) {
    if (!route.componentName || route.redirect) {
      // Skip routes without components or with redirects
      continue;
    }
    
    const fullDirPath = path.join(APP_DIR, dirPath);
    
    // Find the component file
    const componentFilePath = findComponentFilePath(route.componentName);
    if (!componentFilePath) {
      console.warn(`Could not find component file for ${route.componentName}`);
      continue;
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
    }
    
    // Create page.tsx file
    const pageContent = createPageFile(route, componentFilePath);
    fs.writeFileSync(path.join(fullDirPath, 'page.tsx'), pageContent);
    
    console.log(`Created page for ${route.path} at ${fullDirPath}/page.tsx`);
  }
}

// Handle redirects
function processRedirects() {
  const redirects = Routes.filter(route => route.redirect);
  
  if (redirects.length === 0) {
    return;
  }
  
  // Create a next.config.js file or update existing one
  // This is a simplified approach - you might need to merge with existing config
  const redirectConfig = `
module.exports = {
  async redirects() {
    return [
      ${redirects.map(route => `{
        source: '${route.path}',
        destination: '${typeof route.redirect === 'function' 
          ? '/* Dynamic redirect - needs manual implementation */' 
          : route.redirect}',
        permanent: true,
      }`).join(',\n      ')}
    ]
  },
}
`;
  
  // Write to a file for reference - you'll need to manually integrate this
  fs.writeFileSync('./redirect-config.js', redirectConfig);
  console.log('Created redirect configuration at ./redirect-config.js');
}

async function fetchRoutes() {
  const response = await fetch('http://localhost:3000/api/routes');
  const data = await response.json();
  Routes = data.routes;
}

async function main() {
  await fetchRoutes();
  processRoutes();
  processRedirects();
}

main();
