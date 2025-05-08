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
} from 'ts-morph';
import path from 'path';
import camelCase from 'lodash/camelCase';

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

function getViewTerms(iface: InterfaceDeclaration): Record<string, string> {
  const result: Record<string, string> = {};
  iface.getMembers().forEach(m => {
    if (m.getKind() === SyntaxKind.PropertySignature) {
      const prop = m as PropertySignature;
      const name = prop.getName();
      const typeText = prop.getType().getText();
      result[name] = tsTypeToGraphQL(typeText);
    }
  });
  return result;
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

const viewFiles = project.getSourceFiles(
  '**/lib/collections/*/views.ts',
);

viewFiles.forEach(src => {
  // ---------------------------------- Collection meta
  const absPath = src.getFilePath();
  const collectionName = absPath.split('/').at(-3)!; // ".../collections/<name>/views.ts"
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
  if (!newExprNode) return;

  const args = newExprNode.getArguments();
  if (args.length < 2 || !args[1].asKind(SyntaxKind.ObjectLiteralExpression)) return;
  const viewsObj = args[1].asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const viewNames = viewsObj
    .getProperties()
    .filter(p => p.getKind() === SyntaxKind.PropertyAssignment)
    .map(p => (p as any).getName())
    .filter((n): n is string => !!n);

  const viewSetVar =
    src
      .getVariableDeclarations()
      .find(v => v.getInitializer() === newExprNode)
      ?.getName() || `${collectionName}Views`;

  // ---------------------------------- ViewTerms interface
  const iface = src.getInterface(`${collectionName}ViewTerms`);
  if (!iface) return;

  const terms = getViewTerms(iface);

  // ---------------------------------- build typedef text
  const viewInputLines = Object.entries(terms)
    .map(([k, v]) => `    ${k}: ${v}`)
    .join('\n');

  const selectorLines = viewNames
    .map(v => `    ${v}: ViewInput`)
    .join('\n');

  // ---------------------------------- newQueries.ts file
  const dst = path.join(serverDir, 'newQueries.ts');
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
type ${typeName.charAt(0).toUpperCase() + typeName.slice(1)} ${
          '${'
        } getAllGraphQLFields(schema) }

input Single${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
        1,
      )}Input {
  selector: SelectorInput
  resolverArgs: JSON
  allowNull: Boolean
}

type Single${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
        1,
      )}Output {
  result: ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}
}

input ViewInput {
${viewInputLines}
}

input ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Selector @oneOf {
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
  ${typeName}(input: Single${typeName
          .charAt(0)
          .toUpperCase()}${typeName.slice(
        1,
      )}Input): Single${typeName
        .charAt(0)
        .toUpperCase()}${typeName.slice(1)}Output
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
  out.addVariableStatements([
    {
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: `${typeName}GqlQueryHandlers`,
          initializer: `getDefaultResolvers('${collectionName}', ${viewSetVar})`,
        },
      ],
    },
    {
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: `${typeName}GqlFieldResolvers`,
          initializer: `getFieldGqlResolvers('${collectionName}', schema)`,
        },
      ],
    },
  ]);
});

project.saveSync();
console.log('✅  Generated newQueries.ts for every collection');