import {
  Project,
  SyntaxKind,
  NewExpression,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  MethodDeclaration,
  FunctionLikeDeclaration,
  VariableDeclarationKind,
  InterfaceDeclaration,
  Type,
  WriterFunction,
} from 'ts-morph';
import path from 'path';
import camelCase from 'lodash/camelCase';
import fs from 'fs';

// ------------------------------------------------------------
// Helpers (largely copied from generateQueriesFromViews)
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
      return 'String';
  }
}

function collectPropsFromInterface(intf: InterfaceDeclaration) {
  const res: Record<string, string> = {};
  intf.getMembers().forEach(m => {
    if (m.getKind() === SyntaxKind.PropertySignature) {
      const p = m.asKindOrThrow(SyntaxKind.PropertySignature);
      res[p.getName()] = tsTypeToGraphQL(p.getType().getText());
    }
  });
  return res;
}

function collectPropsFromType(t: Type): Record<string, string> {
  const out: Record<string, string> = {};
  t.getProperties().forEach(sym => {
    const name = sym.getName();
    const declarations = sym.getDeclarations();
    const typeText = declarations.length ? declarations[0].getType().getText() : 'String';
    out[name] = tsTypeToGraphQL(typeText);
  });
  return out;
}

function getViewTermsProps(src: import('ts-morph').SourceFile, viewTermsName: string): Record<string, string> {
  let iface = src
    .getDescendantsOfKind(SyntaxKind.InterfaceDeclaration)
    .find(i => i.getName() === viewTermsName || i.getName()?.endsWith('ViewTerms'));
  if (iface) return collectPropsFromInterface(iface);

  let alias = src
    .getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration)
    .find(a => a.getName() === viewTermsName || a.getName()?.endsWith('ViewTerms'));
  if (!alias) return {};

  return collectPropsFromType(alias.getType());
}

function indent(i: number, str: string) {
  return str
    .split('\n')
    .map(l => ' '.repeat(i) + l)
    .join('\n');
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
(async function main() {
  const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

  const viewFiles = project.getSourceFiles('**/lib/collections/*/views.ts');
  console.log(`🔎 refining inputs for ${viewFiles.length} collections`);

  for (const src of viewFiles) {
    const absPath = src.getFilePath();
    const collectionName = absPath.split('/').at(-2)!; // e.g. tags
    const singularBase = collectionName.replace(/s$/, '');
    const camelSingular = camelCase(singularBase);
    const pascalSingular = camelSingular.charAt(0).toUpperCase() + camelSingular.slice(1);
    const pascalCollection = collectionName.charAt(0).toUpperCase() + collectionName.slice(1); // plural form retained for resolvers
    const singularName = camelSingular;
    const pluralName = camelCase(collectionName);

    // Grabbing original viewNames + AST nodes
    const newExpr = src.getFirstDescendant(n =>
      n.getKind() === SyntaxKind.NewExpression && n.getText().includes('CollectionViewSet'),
    ) as NewExpression | undefined;
    if (!newExpr) continue;
    const args = newExpr.getArguments();
    if (args.length < 2 || !args[1].asKind(SyntaxKind.ObjectLiteralExpression)) continue;
    const viewsObj = args[1].asKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    // ------------------------------------------------------
    // Determine default view function (3rd argument of CollectionViewSet)
    // ------------------------------------------------------
    const defaultUsedProps = new Set<string>();
    if (args.length >= 3) {
      const defaultArg = args[2];
      let defaultFn: FunctionLikeDeclaration | undefined;
      if (defaultArg.isKind(SyntaxKind.ArrowFunction) || defaultArg.isKind(SyntaxKind.FunctionExpression)) {
        defaultFn = defaultArg as unknown as FunctionLikeDeclaration;
      } else if (defaultArg.isKind(SyntaxKind.Identifier)) {
        const identName = defaultArg.getText();
        // look for function declaration or variable with arrow/function expression
        const funcDecl = src.getFunction(identName);
        if (funcDecl) defaultFn = funcDecl as FunctionLikeDeclaration;
        if (!defaultFn) {
          const varDecl = src.getVariableDeclaration(identName);
          if (varDecl) {
            const init = varDecl.getInitializer();
            if (init && (init.isKind(SyntaxKind.ArrowFunction) || init.isKind(SyntaxKind.FunctionExpression))) {
              defaultFn = init as FunctionLikeDeclaration;
            }
          }
        }
      }

      // Analyse property usage inside defaultFn
      if (defaultFn) {
        const param = defaultFn.getParameters()[0];
        if (param) {
          const pName = param.getName();
          (defaultFn as any).forEachDescendant((d: any) => {
            if (d.isKind && d.isKind(SyntaxKind.PropertyAccessExpression)) {
              const pae = d.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
              if (pae.getExpression().getText() === pName) {
                defaultUsedProps.add(pae.getName());
              }
            } else if (d.isKind && d.isKind(SyntaxKind.ElementAccessExpression)) {
              const eae = d.asKindOrThrow(SyntaxKind.ElementAccessExpression);
              if (eae.getExpression().getText() === pName) {
                const arg = eae.getArgumentExpression();
                if (arg && arg.isKind(SyntaxKind.StringLiteral)) {
                  defaultUsedProps.add(arg.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralText());
                }
              }
            }
          });
        }
      }
    }

    // Map view original/safe names to AST node representing function
    const viewEntries: {
      origName: string;
      safeName: string;
      fnNode: FunctionLikeDeclaration | undefined;
      usedProps: Set<string>;
    }[] = [];

    viewsObj.getProperties().forEach(p => {
      let origName: string | undefined;
      if (p.getKind() === SyntaxKind.PropertyAssignment) {
        origName = (p as PropertyAssignment).getName();
      } else if (p.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
        origName = (p as ShorthandPropertyAssignment).getName();
      } else if (p.getKind() === SyntaxKind.MethodDeclaration) {
        origName = (p as MethodDeclaration).getName();
      }
      if (!origName) return;

      const validRe = /^[A-Za-z_][A-Za-z0-9_]*$/;
      let safeName = origName;
      if (!validRe.test(origName)) {
        const cleaned = origName.replace(/[^A-Za-z0-9]/g, ' ');
        const leadingDigits = cleaned.match(/^\d+/)?.[0];
        const rest = cleaned.replace(/^\d+/, '');
        safeName = camelCase(rest) + (leadingDigits ?? '');
      }

      // find function node – support inline, method, or external declarations
      let fnNode: FunctionLikeDeclaration | undefined;
      if (p.getKind() === SyntaxKind.PropertyAssignment) {
        const initializer = (p as PropertyAssignment).getInitializer();
        if (initializer && (initializer.isKind(SyntaxKind.ArrowFunction) || initializer.isKind(SyntaxKind.FunctionExpression))) {
          fnNode = initializer as FunctionLikeDeclaration;
        }
      } else if (p.getKind() === SyntaxKind.MethodDeclaration) {
        fnNode = p as MethodDeclaration;
      }

      // For shorthand entries, look for a top-level function or const with that name
      if (!fnNode) {
        const funcDecl = src.getFunction(origName!);
        if (funcDecl) fnNode = funcDecl as FunctionLikeDeclaration;
      }
      if (!fnNode) {
        const varDecl = src.getVariableDeclaration(origName!);
        if (varDecl) {
          const init = varDecl.getInitializer();
          if (init && (init.isKind(SyntaxKind.ArrowFunction) || init.isKind(SyntaxKind.FunctionExpression))) {
            fnNode = init as FunctionLikeDeclaration;
          }
        }
      }

      // Collect used term properties
      const used = new Set<string>();
      if (fnNode) {
        const param = fnNode.getParameters()[0];
        if (param) {
          const paramName = param.getName();
          (fnNode as any).forEachDescendant((desc: any) => {
            if (desc.isKind(SyntaxKind.PropertyAccessExpression)) {
              const pae = desc.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
              if (pae.getExpression().getText() === paramName) {
                used.add(pae.getName());
              }
            } else if (desc.isKind(SyntaxKind.ElementAccessExpression)) {
              const eae = desc.asKindOrThrow(SyntaxKind.ElementAccessExpression);
              if (eae.getExpression().getText() === paramName) {
                const arg = eae.getArgumentExpression();
                if (arg && arg.isKind(SyntaxKind.StringLiteral)) {
                  used.add(arg.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralText());
                }
              }
            }
          });
        }
      }

      viewEntries.push({ origName, safeName, fnNode, usedProps: used });
    });

    // Retrieve field types from ViewTerms definition
    const termsProps = getViewTermsProps(src, `${pascalCollection}ViewTerms`);

    // Prepare pieces for graphql typedef reconstruction
    const perViewInputDefs: string[] = [];
    const selectorLines: string[] = [];

    const viewSetVarDecl = src
      .getVariableDeclarations()
      .find(v => v.getInitializer() === newExpr);
    const viewSetVar = viewSetVarDecl ? viewSetVarDecl.getName() : `${pascalCollection}Views`;

    // ----------------------------------
    // Preserve existing export identifiers & label
    // ----------------------------------
    const preserved: {
      typeDefs?: string;
      handlers?: string;
      fields?: string;
      label?: string;
    } = {};

    const existingQueriesPath = path.join(absPath.replace('/lib/', '/server/').replace('/views.ts', ''), 'queries.ts');
    if (fs.existsSync(existingQueriesPath)) {
      const oldSrc = project.addSourceFileAtPath(existingQueriesPath);
      oldSrc.getVariableDeclarations().forEach(dec => {
        const init = dec.getInitializer();
        if (!init) return;
        const varName = dec.getName();

        if (init.getText().startsWith('gql`')) {
          preserved.typeDefs = varName;
        } else if (init.isKind(SyntaxKind.CallExpression)) {
          const call = init.asKindOrThrow(SyntaxKind.CallExpression);
          const callee = call.getExpression().getText();
          if (callee === 'getDefaultResolvers') {
            preserved.handlers = varName;
            const arg0 = call.getArguments()[0];
            if (arg0) {
              preserved.label = arg0.getText().replace(/['"`]/g, '');
            }
          } else if (callee === 'getFieldGqlResolvers') {
            preserved.fields = varName;
          }
        }
      });
    }

    const collectionLabel = (preserved.label ?? viewSetVar.replace(/Views$/, '')) || pascalCollection;

    viewEntries.forEach(entry => {
      const fieldsSet = new Set<string>([...defaultUsedProps, ...entry.usedProps]);
      const fields = Array.from(fieldsSet);
      const inputName = `${collectionLabel}${entry.safeName.charAt(0).toUpperCase() + entry.safeName.slice(1)}Input`;
      if (fields.length === 0) {
        perViewInputDefs.push(`input ${inputName}`);
      } else {
        const lines = fields
          .map(f => `  ${f}: ${termsProps[f] ?? 'String'}`)
          .join('\n');
        perViewInputDefs.push(`input ${inputName} {\n${lines}\n}`);
      }
      selectorLines.push(`  ${entry.safeName}: ${inputName}`);
    });

    // ------------------------------------------------------
    // Build default view input type definition
    // ------------------------------------------------------
    const collectionLabelWithoutS = collectionLabel.replace(/s$/, '');
    const defaultInputName = `${collectionLabelWithoutS}DefaultViewInput`;
    let defaultInputDef: string;
    if (defaultUsedProps.size === 0) {
      defaultInputDef = `input ${defaultInputName}`;
    } else {
      const lines = Array.from(defaultUsedProps)
        .map(f => `  ${f}: ${termsProps[f] ?? 'String'}`)
        .join('\n');
      defaultInputDef = `input ${defaultInputName} {\n${lines}\n}`;
    }

    selectorLines.unshift(`  default: ${defaultInputName}`);

    // Update / regenerate queries.ts under server directory
    const serverDir = absPath.replace('/lib/', '/server/').replace('/views.ts', '');
    const dst = path.join(serverDir, 'queries.ts');
    const qFile = project.createSourceFile(dst, '', { overwrite: true });

    // Imports identical to previous generator, plus Views import
    qFile.addImportDeclarations([
      {
        defaultImport: 'schema',
        moduleSpecifier: `@/lib/collections/${collectionName}/newSchema`,
      },
      { namedImports: ['getDefaultResolvers'], moduleSpecifier: '@/server/resolvers/defaultResolvers' },
      { namedImports: ['getAllGraphQLFields'], moduleSpecifier: '@/server/vulcan-lib/apollo-server/graphqlTemplates' },
      { namedImports: ['getFieldGqlResolvers'], moduleSpecifier: '@/server/vulcan-lib/apollo-server/helpers' },
      { defaultImport: 'gql', moduleSpecifier: 'graphql-tag' },
      { namedImports: [viewSetVar], moduleSpecifier: `@/lib/collections/${collectionName}/views` },
    ]);

    // Build typedef variable with proper multiline formatting
    const typeDefsInit: WriterFunction = w => {
      w.write('gql`');
      w.newLine();
      w.write(
        indent(
          2,
          `
type ${pascalSingular} ${'${'} getAllGraphQLFields(schema) }

input Single${pascalSingular}Input {
  selector: SelectorInput
  resolverArgs: JSON
}

type Single${pascalSingular}Output {
  result: ${pascalSingular}
}

${defaultInputDef}

${perViewInputDefs.join('\n\n')}

input ${pascalSingular}Selector  {
${selectorLines.join('\n')}
}

input Multi${pascalSingular}Input {
  terms: JSON
  resolverArgs: JSON
  enableTotal: Boolean
}

type Multi${pascalSingular}Output {
  results: [${pascalSingular}]
  totalCount: Int
}

extend type Query {
  ${singularName}(
    input: Single${pascalSingular}Input @deprecated(reason: "Use the selector field instead"),
    selector: SelectorInput
  ): Single${pascalSingular}Output
  ${pluralName}(
    input: Multi${pascalSingular}Input @deprecated(reason: "Use the selector field instead"),
    selector: ${pascalSingular}Selector,
    limit: Int,
    offset: Int,
    enableTotal: Boolean
  ): Multi${pascalSingular}Output
}
`.trim(),
        ),
      );
      w.newLine();
      w.write('`');
    };

    qFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: preserved.typeDefs ?? `graphql${pascalSingular}QueryTypeDefs`,
          initializer: typeDefsInit,
        },
      ],
    });

    qFile.addVariableStatements([
      {
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: preserved.handlers ?? `${singularName}GqlQueryHandlers`,
            initializer: `getDefaultResolvers('${collectionLabel}', ${viewSetVar})`,
          },
        ],
      },
      {
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: preserved.fields ?? `${singularName}GqlFieldResolvers`,
            initializer: `getFieldGqlResolvers('${collectionLabel}', schema)`,
          },
        ],
      },
    ]);
  }

  await project.save();
  console.log('✅ refined input types for views');
})();
