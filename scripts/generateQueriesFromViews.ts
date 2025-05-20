// scripts/generateQueriesFromViews.ts
import {
  Project,
  SyntaxKind,
  InterfaceDeclaration,
  ObjectLiteralExpression,
  PropertySignature,
  VariableDeclarationKind,
  WriterFunction,
  StatementStructures,
  NewExpression,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  MethodDeclaration,
  Type,
} from 'ts-morph';
import path from 'path';
import camelCase from 'lodash/camelCase';
import fs from 'fs';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function tsTypeToGraphQL(typeText: string): string {
  if (typeText.endsWith('[]')) {
    return `[${tsTypeToGraphQL(typeText.slice(0, -2))}!]`;
  }
  switch (typeText.replace(/import\(.+?\)\./, '')) {
    case 'string':
    case 'String':
      return 'String';
    case 'number':
    case 'Number':
    case 'int':
    case 'Int':
      return 'Int';
    case 'boolean':
    case 'Boolean':
      return 'Boolean';
    default:
      return 'String'; // fallback – tweak as needed
  }
}

function collectProps(intf: InterfaceDeclaration) {
  const res: Record<string, string> = {};
  intf.getMembers().forEach(m => {
    if (m.getKind() === SyntaxKind.PropertySignature) {
      const p = m as PropertySignature;
      res[p.getName()] = tsTypeToGraphQL(p.getType().getText());
    }
  });
  return res;
}

function collectPropsFromType(t: Type): Record<string,string>{
  const out: Record<string,string> = {};
  t.getProperties().forEach(sym=>{
    const name = sym.getName();
    const declarations = sym.getDeclarations();
    const typeText = declarations.length ? declarations[0].getType().getText() : 'String';
    out[name] = tsTypeToGraphQL(typeText);
  });
  return out;
}

function getViewTerms(src: import("ts-morph").SourceFile, viewTermName: string): Record<string,string> {
  // Direct interface (any depth)
  let iface = src.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).find(i=>i.getName()===viewTermName);
  if (!iface) {
    iface = src.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).find(i=> i.getName()?.endsWith('ViewTerms'));
  }
  if (iface) return collectProps(iface);

  // Type alias union
  let alias = src.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration).find(a=>a.getName()===viewTermName);
  if (!alias) {
    alias = src.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration).find(a=>a.getName()?.endsWith('ViewTerms'));
  }
  if (!alias) return {};

  const aliasType = alias.getType();
  return collectPropsFromType(aliasType);
}

function indent(i: number, str: string) {
  return str
    .split('\n')
    .map(l => ' '.repeat(i) + l)
    .join('\n');
}

function plural(word: string): string {
  return word.endsWith('s') ? word + 'es' : word + 's';
}

// ------------------------------------------------------------
// Main script
// ------------------------------------------------------------
const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const viewFiles = project.getSourceFiles('**/lib/collections/*/views.ts');
console.log(`🔍 found ${viewFiles.length} collection view files`);

const generated: string[] = [];
const handledCollections = new Set<string>();

viewFiles.forEach(src => {
  // ---------------------------------- Collection meta
  const absPath = src.getFilePath();
  const collectionName = absPath.split('/').at(-2)!; // ".../collections/<name>/views.ts"
  handledCollections.add(collectionName);
  const typeName = camelCase(collectionName.replace(/s$/, '')); // Tag
  const pluralName = plural(typeName);
  const serverDir = absPath.replace('/lib/', '/server/').replace(
    '/views.ts',
    '',
  );

  // ---------------------------------- ViewSet + view names
  const newExprNode = src.getFirstDescendant(n =>
    n.getKind() === SyntaxKind.NewExpression && n.getText().includes('CollectionViewSet'),
  ) as NewExpression | undefined;
  if (!newExprNode) {
    console.log(`   ↪️  skipping ${collectionName}: no CollectionViewSet found`);
    return;
  }

  const args = newExprNode.getArguments();
  if (args.length < 2 || !args[1].asKind(SyntaxKind.ObjectLiteralExpression)) {
    console.log(`   ↪️  skipping ${collectionName}: unexpected CollectionViewSet arguments`);
    return;
  }
  const viewsObj = args[1].asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const viewNamePairs: [string,string][] = [];
  viewsObj.getProperties().forEach(p => {
    if (
      p.getKind() === SyntaxKind.PropertyAssignment ||
      p.getKind() === SyntaxKind.ShorthandPropertyAssignment ||
      p.getKind() === SyntaxKind.MethodDeclaration
    ) {
      const node = (p as PropertyAssignment | ShorthandPropertyAssignment | MethodDeclaration).getNameNode?.();
      let orig: string|undefined;
      if (node && node.getKind() === SyntaxKind.StringLiteral) {
        orig = (node as any).getLiteralText();
      } else {
        orig = (p as any).getName?.();
      }
      if (!orig) return;

      const validRe = /^[A-Za-z_][A-Za-z0-9_]*$/;
      let safe = orig;
      if (!validRe.test(orig)) {
        const cleaned = orig.replace(/[^A-Za-z0-9]/g,' ');
        const leadingDigitsMatch = cleaned.match(/^\d+/);
        const rest = cleaned.replace(/^\d+/, '');
        safe = camelCase(rest);
        if (leadingDigitsMatch) safe = safe + leadingDigitsMatch[0];
      }
      viewNamePairs.push([orig, safe]);
    }
  });

  const viewNames = viewNamePairs.map(([_,s])=>s);
  const viewSetVar =
    src
      .getVariableDeclarations()
      .find(v => v.getInitializer() === newExprNode)
      ?.getName() || `${collectionName}Views`;

  // ---------------------------------- ViewTerms interface
  const pascalCollection = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
  const terms = getViewTerms(src, `${pascalCollection}ViewTerms`);

  // ---------------------------------- build typedef text
  const viewInputName = `${typeName.charAt(0).toUpperCase() + typeName.slice(1)}ViewInput`;
  const viewInputLinesArr = Object.entries(terms)
    .filter(([k]) => k !== 'view')
    .map(([k, v]) => `  ${k}: ${v}`);
  const viewInputLines = viewInputLinesArr.join('\n');
  const viewInputDef = viewInputLinesArr.length === 0
    ? `input ${viewInputName}`
    : `input ${viewInputName} {\n${viewInputLines}\n }`;

  const renameMap: Record<string,string> = {};
  const selectorLines = ['  default: '+viewInputName]
    .concat(viewNamePairs.map(([orig,safe])=>{
      if (orig!==safe) renameMap[orig]=safe;
      return `  ${safe}: ${viewInputName}`;
    }))
    .join('\n');

  // ---------------------------------- newQueries.ts file
  const dst = path.join(serverDir, 'queries.ts');
  const out = project.createSourceFile(dst, '', { overwrite: true });

  // Imports
  out.addImportDeclarations([
    {
      defaultImport: 'schema',
      moduleSpecifier: `@/lib/collections/${collectionName}/newSchema`,
    },
    {
      namedImports: ['getDefaultResolvers'],
      moduleSpecifier: '@/server/resolvers/defaultResolvers',
    },
    {
      namedImports: ['getAllGraphQLFields'],
      moduleSpecifier:
        '@/server/vulcan-lib/apollo-server/graphqlTemplates',
    },
    {
      namedImports: ['getFieldGqlResolvers'],
      moduleSpecifier:
        '@/server/vulcan-lib/apollo-server/helpers',
    },
    {
      defaultImport: 'gql',
      moduleSpecifier: 'graphql-tag',
    },
    {
      namedImports: [viewSetVar],
      moduleSpecifier: `@/lib/collections/${collectionName}/views`,
    },
  ]);

  // TypeDefs variable
  const typeDefsInit: WriterFunction = w => {
    w.write('gql`');
    w.newLine();
    w.write(
      indent(
        2,
        `
type ${typeName.charAt(0).toUpperCase() + typeName.slice(1)} ${'${'} getAllGraphQLFields(schema) }

input Single${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
        1,
      )}Input {
  selector: SelectorInput
  resolverArgs: JSON
}

type Single${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
        1,
      )}Output {
  result: ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}
}

${viewInputDef}

input ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Selector  {
${selectorLines}
}

input Multi${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
        1,
      )}Input {
  terms: JSON
  resolverArgs: JSON
  enableTotal: Boolean
}

type Multi${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
        1,
      )}Output {
  results: [${typeName.charAt(0).toUpperCase() + typeName.slice(1)}]
  totalCount: Int
}

extend type Query {
  ${typeName}(
    input: Single${typeName.charAt(0).toUpperCase()}${typeName.slice(1)}Input @deprecated(reason: "Use the selector field instead"),
    selector: SelectorInput
  ): Single${typeName.charAt(0).toUpperCase()}${typeName.slice(1)}Output
  ${pluralName}(
    input: Multi${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
        1,
      )}Input @deprecated(reason: "Use the selector field instead"),
    selector: ${typeName.charAt(0).toUpperCase() +
      typeName.slice(1)}Selector,
    limit: Int,
    offset: Int,
    enableTotal: Boolean
  ): Multi${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(1)}Output
}
`.trim(),
      ),
    );
    w.newLine();
    w.write('`');
  };

  out.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: `graphql${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
          1,
        )}QueryTypeDefs`,
        initializer: typeDefsInit,
      },
    ],
  });

  // Handlers
  const varStmts: any[] = [
    {
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: `${typeName}GqlQueryHandlers`,
          initializer: `getDefaultResolvers('${viewSetVar.replace(/Views$/, '')}', ${viewSetVar})`,
        },
      ],
    },
    {
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: `${typeName}GqlFieldResolvers`,
          initializer: `getFieldGqlResolvers('${viewSetVar.replace(/Views$/, '')}', schema)`,
        },
      ],
    },
  ];

  if (Object.keys(renameMap).length > 0) {
    varStmts.push({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: `${typeName}ViewNameMap`,
          initializer: `${JSON.stringify(renameMap, null, 2)}`,
        },
      ],
    });
  }

  out.addVariableStatements(varStmts);

  generated.push(collectionName);
});

// ------------------------------------------------------------
// Handle collections that *do not* have a views.ts file (default views only)
// ------------------------------------------------------------
const schemaFiles = project.getSourceFiles('**/lib/collections/*/newSchema.ts');

schemaFiles.forEach(schemaSrc => {
  const absPath = schemaSrc.getFilePath();
  const collectionName = absPath.split('/')/*. slice etc */.at(-2)!;
  if (handledCollections.has(collectionName)) return; // already generated above

  // Collection meta & naming helpers (copied from above)
  const typeName = camelCase(collectionName.replace(/s$/, ''));
  const pluralName = plural(typeName);
  const pascalCollection = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
  const serverDir = absPath.replace('/lib/', '/server/').replace('/newSchema.ts', '');

  // Only proceed if existing queries.ts exported default resolvers
  const legacyQueriesPath = path.join(serverDir, 'queries.ts');
  if (!fs.existsSync(legacyQueriesPath)) return;
  const legacyContent = fs.readFileSync(legacyQueriesPath, 'utf8');
  if (!legacyContent.includes('getDefaultResolvers(')) return;

  // Build typedefs: empty ViewInput and selector with only default
  const viewInputName = `${typeName.charAt(0).toUpperCase() + typeName.slice(1)}ViewInput`;
  const viewInputDef = `input ${viewInputName}`; // no fields

  const selectorLines = `  default: ${viewInputName}`;

  // newQueries.ts destination
  const dst = path.join(serverDir, 'queries.ts');
  const out = project.createSourceFile(dst, '', { overwrite: true });

  // Imports (no Views import)
  out.addImportDeclarations([
    {
      defaultImport: 'schema',
      moduleSpecifier: `@/lib/collections/${collectionName}/newSchema`,
    },
    {
      namedImports: ['getDefaultResolvers'],
      moduleSpecifier: '@/server/resolvers/defaultResolvers',
    },
    {
      namedImports: ['getAllGraphQLFields'],
      moduleSpecifier: '@/server/vulcan-lib/apollo-server/graphqlTemplates',
    },
    {
      namedImports: ['getFieldGqlResolvers'],
      moduleSpecifier: '@/server/vulcan-lib/apollo-server/helpers',
    },
    {
      defaultImport: 'gql',
      moduleSpecifier: 'graphql-tag',
    },
    {
      namedImports: ['CollectionViewSet'],
      moduleSpecifier: '@/lib/views/collectionViewSet',
    },
  ]);

  // TypeDefs variable
  const typeDefsInit: WriterFunction = w => {
    w.write('gql`');
    w.newLine();
    w.write(
      indent(
        2,
        `
type ${typeName.charAt(0).toUpperCase() + typeName.slice(1)} ${'${'} getAllGraphQLFields(schema) }

input Single${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Input {
  selector: SelectorInput
  resolverArgs: JSON
}

type Single${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Output {
  result: ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}
}

${viewInputDef}

input ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Selector  {
${selectorLines}
}

input Multi${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Input {
  terms: JSON
  resolverArgs: JSON
  enableTotal: Boolean
}

type Multi${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Output {
  results: [${typeName.charAt(0).toUpperCase() + typeName.slice(1)}]
  totalCount: Int
}

extend type Query {
  ${typeName}(
    input: Single${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Input @deprecated(reason: "Use the selector field instead"),
    selector: SelectorInput
  ): Single${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Output
  ${pluralName}(
    input: Multi${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Input @deprecated(reason: "Use the selector field instead"),
    selector: ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Selector,
    limit: Int,
    offset: Int,
    enableTotal: Boolean
  ): Multi${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Output
}
`.trim(),
      ),
    );
    w.newLine();
    w.write('`');
  };

  // Add typedef variable
  out.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: `graphql${typeName.charAt(0).toUpperCase() + typeName.slice(1)}QueryTypeDefs`,
        initializer: typeDefsInit,
      },
    ],
  });

  // Handlers (no Views variable)
  out.addVariableStatements([
    {
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: `${typeName}GqlQueryHandlers`,
          initializer: `getDefaultResolvers('${pascalCollection}', new CollectionViewSet('${pascalCollection}', {}))`,
        },
      ],
    },
    {
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: `${typeName}GqlFieldResolvers`,
          initializer: `getFieldGqlResolvers('${pascalCollection}', schema)`,
        },
      ],
    },
  ]);

  generated.push(collectionName);
});

project.saveSync();

console.log(`✅  Generated newQueries.ts for ${generated.length} collections:`);
generated.forEach(c => console.log(`   • ${c}`));