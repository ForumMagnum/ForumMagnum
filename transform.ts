import { FileInfo, API } from 'jscodeshift';
import path from 'path';
import { glob } from 'glob';

// Cache for component paths to avoid repeated file system searches
let componentPathCache: Record<string, string | null> = {};

// Cache all .tsx files at startup
function initializeComponentCache(baseDir: string) {
  if (Object.keys(componentPathCache).length > 0) return;
  
  const allFiles = glob.sync(`${baseDir}/**/*.tsx`);
  allFiles.forEach(file => {
    const componentName = path.basename(file, '.tsx');
    // Only cache if we haven't seen this component name before or if this path includes 'components'
    if (!componentPathCache[componentName] || file.includes('components')) {
      componentPathCache[componentName] = file;
    }
  });
}

function findComponentPath(componentName: string, baseDir: string): string | null {
  return componentPathCache[componentName] || null;
}

function createRelativePath(fromPath: string, toPath: string): string {
  const relativePath = path.relative(path.dirname(fromPath), path.dirname(toPath));
  const importPath = path.join(relativePath, path.basename(toPath, '.tsx'));
  return importPath.startsWith('.') ? importPath : `./${importPath}`;
}

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const baseDir = process.cwd();
  const printOptions = {
    quote: 'single',
    trailingComma: true,
  };

  // Initialize cache on first run
  initializeComponentCache(baseDir);
  
  const errors: string[] = [];

  // Find and remove Components import
  root
    .find(j.ImportDeclaration)
    .filter(path => {
      const specifiers = path.node.specifiers;
      return specifiers.some(spec => 
        spec.type === 'ImportSpecifier' && 
        spec.imported.name === 'Components'
      );
    })
    .forEach(path => {
      if (path.node.specifiers.length === 1) {
        j(path).remove();
      } else {
        path.node.specifiers = path.node.specifiers.filter(spec =>
          !(spec.type === 'ImportSpecifier' && spec.imported.name === 'Components')
        );
      }
    });

  // Find Components destructuring
  const componentsDestructuring = root
    .find(j.VariableDeclaration)
    .filter(path => {
      const decl = path.node.declarations[0];
      return (
        decl?.type === 'VariableDeclarator' &&
        decl.id.type === 'ObjectPattern' &&
        decl.init?.type === 'Identifier' &&
        decl.init.name === 'Components'
      );
    });

  // Track added imports to prevent duplicates
  const addedImports = new Set<string>();
  
  componentsDestructuring.forEach(path => {
    const declaration = path.node.declarations[0];
    if (declaration.id.type !== 'ObjectPattern') return;

    declaration.id.properties.forEach(prop => {
      if (prop.type !== 'ObjectProperty' || prop.key.type !== 'Identifier') return;
      
      const componentName = prop.key.name;
      if (addedImports.has(componentName)) return;

      const componentPath = findComponentPath(componentName, baseDir);
      if (!componentPath) {
        errors.push(`Could not find file for component: ${componentName}`);
        return;
      }

      const relativePath = createRelativePath(file.path, componentPath);
      
      // Add default import instead of named import
      root.get().node.program.body.unshift(
        j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier(componentName))],
          j.literal(relativePath)
        )
      );

      addedImports.add(componentName);
    });

    // Remove the Components destructuring
    j(path).remove();
  });

  // Find and remove any existing default export
  root
    .find(j.ExportDefaultDeclaration)
    .forEach(path => {
      j(path).remove();
    });

  // Find registerComponent call and add default export
  const registerCall = root
    .find(j.CallExpression, {
      callee: { 
        type: 'Identifier',
        name: 'registerComponent'
      }
    })
    .nodes()[0];

  if (registerCall && registerCall.arguments[0]?.type === 'StringLiteral') {
    const componentName = registerCall.arguments[1]?.type === 'Identifier' 
      ? registerCall.arguments[1].name 
      : registerCall.arguments[0].value;

    const exportVarName = `${componentName}Component`;

    // Add new default export
    root.get().node.program.body.push(
      j.exportDefaultDeclaration(
        j.identifier(exportVarName)
      )
    );
  }

  if (errors.length > 0) {
    console.error('Errors encountered while processing', file.path);
    errors.forEach(error => console.error('-', error));
  }

  return root.toSource(printOptions);
}
