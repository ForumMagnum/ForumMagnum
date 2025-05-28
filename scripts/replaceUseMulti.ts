import {
  Project,
  SyntaxKind,
  ObjectLiteralExpression,
  Node,
  SourceFile,
  IndentationText,
  CallExpression,
  ts,
} from 'ts-morph';
import path from 'path';

type CamelCaseify<T extends string> = T extends `${infer Prefix}-${infer Rest}`
  ? `${Uncapitalize<Prefix>}${Capitalize<CamelCaseify<Rest>>}`
  : Uncapitalize<T>;

// Convert a dash separated string to camelCase.
const dashToCamel = function (str: string): string {
  return str.replace(/(-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

// Convert a string to camelCase and remove spaces.
const camelCaseify = function<T extends string>(str: T): CamelCaseify<T> {
  const camelCaseStr = dashToCamel(str.replace(' ', '-'));
  const lowerCamelCaseStr = camelCaseStr.slice(0,1).toLowerCase() + camelCaseStr.slice(1);
  return lowerCamelCaseStr as CamelCaseify<T>;
};

const capitalize = function(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// Use 2-space indentation when formatting
project.manipulationSettings.set({ indentationText: IndentationText.TwoSpaces });

// ---------------------------------------------------------------------------
// Helper – ensure we have a named import from a module (adds it if necessary)
function ensureNamedImport(
  file: SourceFile,
  moduleSpecifier: string,
  names: string[],
) {
  if (names.length === 0) return;
  
  let decl = file
    .getImportDeclarations()
    .find((d) => d.getModuleSpecifierValue() === moduleSpecifier);

  if (!decl) {
    decl = file.addImportDeclaration({ moduleSpecifier, namedImports: [] });
  }

  const already = decl.getNamedImports().map((ni) => ni.getName());
  names.forEach((name) => {
    if (!already.includes(name)) decl!.addNamedImport(name);
  });
}

// Helper - convert collection name to resolver name
function getMultiResolverName(collectionName: string): string {
  const withoutS = collectionName.replace(/s$/, '');
  const camelCased = camelCaseify(withoutS);
  return camelCased + 's'; // posts, tags, comments, etc.
}

// Helper - determine GraphQL type name
function getTypeName(collectionName: string): string {
  return camelCaseify(collectionName.replace(/s$/, ''));
}

// Helper - convert view name to selector field name
function viewToSelectorField(view: string): string {
  // The selector field names are exactly the same as view names, just camelCased
  return camelCaseify(view);
}

// Helper - get relative path to useLoadMore based on current file
function getUseLoadMorePath(currentFilePath: string): string {
  const currentDir = path.dirname(currentFilePath);
  const hooksDirPath = path.resolve(currentDir, '../hooks/useLoadMore');
  const relativePath = path.relative(currentDir, hooksDirPath);
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function transformFile(file: SourceFile) {
  // 1. Bail quickly if the file never imports useMulti
  const useMultiImport = file
    .getImportDeclarations()
    .find((d) =>
      d.getNamedImports().some((ni) => ni.getName() === 'useMulti'),
    );
  if (!useMultiImport) return;

  // 2. Find *all* call-expressions `useMulti({...})`
  const calls = file
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((c) => c.getExpression().getText() === 'useMulti');

  if (calls.length === 0) return;

  // 3. Try to extract the React component name (for query name uniqueness)
  const componentName =
    file.getDefaultExportSymbol()?.getName() ??
    file.getFunctions().find((fn) => fn.isDefaultExport())?.getName() ??
    'Component';

  // Track what we actually need to import
  const neededImports = {
    apollo: new Set<string>(),
    useLoadMore: false,
    apolloSSRFlag: false,
    gql: false,
  };

  // 4. Always need useQuery
  neededImports.apollo.add('useQuery');

  // Check if we need apolloSSRFlag
  calls.forEach((call) => {
    const arg = call.getArguments()[0];
    if (arg && arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const objLit = arg as ObjectLiteralExpression;
      const ssrProp = objLit.getProperty('ssr');
      if (ssrProp) {
        neededImports.apolloSSRFlag = true;
      }
    }
  });

  // If file already imports gql from apollo client, rename it to graphql and update usages
  const apolloImport = file.getImportDeclarations().find(d => d.getModuleSpecifierValue() === '@apollo/client');
  if (apolloImport) {
    const gqlNamed = apolloImport.getNamedImports().find(ni => ni.getName() === 'gql');
    if (gqlNamed) {
      file.getDescendantsOfKind(SyntaxKind.Identifier).forEach(id => {
        if (id.getText() === 'gql') id.replaceWithText('graphql');
      });
      gqlNamed.replaceWithText('gql as graphql');
    }
  }

  // We'll always need gql from codegen
  neededImports.gql = true;

  // First pass: collect all variable names that would be created to detect conflicts
  const allVariableNames = new Set<string>();
  const callInfos: Array<{
    call: CallExpression<ts.CallExpression>,
    fragmentName: string,
    usedFields: Record<string, boolean>,
    needsSuffix: Record<string, boolean>,
    objLit: ObjectLiteralExpression,
    fieldAliases: Record<string, string>,
  }> = [];

  calls.forEach((call) => {
    const arg = call.getArguments()[0];
    if (!arg || arg.getKind() !== SyntaxKind.ObjectLiteralExpression) return;

    const objLit = arg as ObjectLiteralExpression;
    const fragmentNameProp = objLit.getProperty('fragmentName')?.getFirstChildByKind(SyntaxKind.StringLiteral)?.getLiteralText();
    if (!fragmentNameProp) return;

    // Determine what variables this call would create
    const usedFields: Record<string, boolean> = {
      results: false,
      loading: false,
      loadMoreProps: false,
      showLoadMore: false,
      loadMore: false,
      refetch: false,
      totalCount: false,
      count: false,
      error: false,
      loadingInitial: false,
      loadingMore: false,
      fetchMore: false,
      networkStatus: false,
      data: false,
    };

    const fieldAliases: Record<string, string> = {}; // originalName -> aliasName
    
    const variableStatement = call.getFirstAncestorByKind(SyntaxKind.VariableStatement);
    if (variableStatement) {
      const decl = variableStatement.getDeclarations()[0];
      if (decl && Node.isVariableDeclaration(decl)) {
        const nameNode = decl.getNameNode();
        if (Node.isObjectBindingPattern(nameNode)) {
          nameNode.getElements().forEach((el) => {
            const propName = el.getPropertyNameNode()?.getText() ?? el.getName();
            const aliasName = el.getName();
            
            if (propName !== aliasName) {
              fieldAliases[propName] = aliasName;
            }
            
            if (propName in usedFields) {
              usedFields[propName] = true;
            }
          });
        }
      }
    }

    // If we're extracting results or other data-dependent values, we need data
    if (usedFields.results || usedFields.totalCount || usedFields.count) {
      usedFields.data = true;
    }

    const needsSuffix: Record<string, boolean> = {};
    const variablesToCheck = ['view', 'limit', 'selectorTerms', ...Object.keys(usedFields)];
    
    variablesToCheck.forEach(varName => {
      if (allVariableNames.has(varName)) {
        needsSuffix[varName] = true;
      }
      allVariableNames.add(varName);
    });

    callInfos.push({ call, fragmentName: fragmentNameProp, usedFields, needsSuffix, objLit, fieldAliases });
  });

  // Second pass: process each call with conflict resolution
  callInfos.forEach(({ call, fragmentName, usedFields, needsSuffix, objLit, fieldAliases }) => {
    const arg = call.getArguments()[0];
    if (
      !arg ||
      arg.getKind() !== SyntaxKind.ObjectLiteralExpression
    )
      return;

    // Pull out the properties we care about -----------------------------
    const getStringLiteralProp = (key: string) =>
      objLit
        .getProperty(key)
        ?.getFirstChildByKind(SyntaxKind.StringLiteral)
        ?.getLiteralText();

    const getInitializerText = (key: string) => {
      const p = objLit.getProperty(key);
      if (p && Node.isPropertyAssignment(p)) {
        const init = p.getInitializer();
        if (init) return init.getText();
      }
      return undefined;
    };

    const collectionName = getStringLiteralProp('collectionName');
    if (!collectionName) return; // can't handle weird cases

    // Extract terms object
    const termsProp = objLit.getProperty('terms');
    let termsExpr = '{}';
    let canInlineSelector = false;
    let inlineView = 'default';
    let inlineSelectorTerms: string = '{}';
    let inlineLimit: string | undefined;
    
    if (termsProp) {
      if (Node.isPropertyAssignment(termsProp)) {
        const termsInit = termsProp.getInitializer();
        if (termsInit) {
          termsExpr = termsInit.getText();
          
          // Check if we can inline the selector (terms is an object literal)
          if (Node.isObjectLiteralExpression(termsInit)) {
            canInlineSelector = true;
            const viewProp = termsInit.getProperty('view');
            const limitProp = termsInit.getProperty('limit');
            
            if (viewProp && Node.isPropertyAssignment(viewProp)) {
              const viewInit = viewProp.getInitializer();
              if (viewInit && Node.isStringLiteral(viewInit)) {
                inlineView = viewInit.getLiteralText();
              } else if (viewInit) {
                inlineView = viewInit.getText();
                canInlineSelector = false; // Can't inline dynamic view
              }
            }
            
            if (limitProp && Node.isPropertyAssignment(limitProp)) {
              const limitInit = limitProp.getInitializer();
              if (limitInit) {
                inlineLimit = limitInit.getText();
              }
            }
            
            // Extract other terms (everything except view and limit)
            const otherProps = termsInit.getProperties().filter(p => {
              if (Node.isPropertyAssignment(p) || Node.isShorthandPropertyAssignment(p)) {
                const name = p.getName?.();
                return name !== 'view' && name !== 'limit';
              }
              return true;
            });
            
            if (otherProps.length > 0) {
              inlineSelectorTerms = `{ ${otherProps.map(p => p.getText()).join(', ')} }`;
            }
          }
        }
      } else if (Node.isShorthandPropertyAssignment(termsProp)) {
        // Handle shorthand like { terms } -> use 'terms'
        termsExpr = termsProp.getName();
      }
    }

    // Other options
    const limitExpr = inlineLimit || (getInitializerText('limit') ?? '10');
    const itemsPerPageExpr = getInitializerText('itemsPerPage') ?? '10';
    const enableTotalExpr = getInitializerText('enableTotal') ?? 'false';
    const alwaysShowLoadMoreExpr = getInitializerText('alwaysShowLoadMore');
    const fetchPolicyExpr = getInitializerText('fetchPolicy');
    const nextFetchPolicyExpr = getInitializerText('nextFetchPolicy');
    const ssrExpr = getInitializerText('ssr');
    const pollIntervalExpr = getInitializerText('pollInterval');

    // Extra variables support
    const extraVarsProp = objLit.getProperty('extraVariables');
    const extraVarsValuesProp = objLit.getProperty('extraVariablesValues');
    let extraVarsValuesExpr: string | undefined;
    if (extraVarsValuesProp && Node.isPropertyAssignment(extraVarsValuesProp)) {
      extraVarsValuesExpr = extraVarsValuesProp.getInitializer()?.getText();
    } else if (extraVarsValuesProp) {
      extraVarsValuesExpr = extraVarsValuesProp.getText();
    }
    
    let extraVarDefs = '';
    if (extraVarsProp && Node.isPropertyAssignment(extraVarsProp)) {
      const extraObj = extraVarsProp.getInitializer();
      if (extraObj && Node.isObjectLiteralExpression(extraObj)) {
        const defs: string[] = [];
        extraObj.getProperties().forEach(pr => {
          if (Node.isPropertyAssignment(pr)) {
            const name = pr.getName();
            let type: string;
            const initNode = pr.getInitializer();
            if (initNode) {
              if (Node.isStringLiteral(initNode)) {
                type = initNode.getLiteralText();
              } else {
                type = initNode.getText();
              }
            } else {
              type = 'String';
            }
            defs.push(`$${name}: ${type}`);
          }
        });
        if (defs.length > 0) extraVarDefs = ', ' + defs.join(', ');
      }
    }

    // Build resolver / paths / names ------------------------------------
    const typeName = getTypeName(collectionName);
    const resolverName = getMultiResolverName(collectionName);

    // Use the same query naming pattern as useMulti: multi${typeName}Query, except add the file name to prevent collisions that graphql-codegen will complain about
    const fileBase = path.basename(file.getFilePath().toString(), path.extname(file.getFilePath().toString())).replace(/[^A-Za-z0-9_]/g, '');
    const aliasName = `multi${typeName.charAt(0).toUpperCase() + typeName.slice(1)}${fileBase}Query`;

    const queryConst = `${fragmentName}MultiQuery`;

    // Variable name resolution with conflict handling
    const getVarName = (baseName: string) => {
      return needsSuffix[baseName] ? `${baseName}${capitalize(fragmentName)}` : baseName;
    };

    // Skip processing
    const skipProp = objLit.getProperty('skip');
    const skipExpr = skipProp ? (skipProp as any).getInitializer()?.getText() ?? 'false' : undefined;

    // Inject query constant – place it right *after* the last import block
    const importDecls = file.getImportDeclarations();
    const lastImportDecl = importDecls[importDecls.length - 1];
    const insertionIndex = lastImportDecl ? lastImportDecl.getChildIndex() + 1 : 0;

    // Avoid duplicate definition
    if (!file.getVariableDeclaration(queryConst)) {
      file.insertStatements(insertionIndex, (w) => {
        w.newLine();
        w.write(`const ${queryConst} = gql(\``);
        w.newLine();
        w.write(`  query ${aliasName}($selector: ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}Selector, $limit: Int, $enableTotal: Boolean${extraVarDefs}) {`);
        w.newLine();
        w.write(`    ${resolverName}(selector: $selector, limit: $limit, enableTotal: $enableTotal) {`);
        w.newLine();
        w.write(`      results {`);
        w.newLine();
        w.write(`        ...${fragmentName}`);
        w.newLine();
        w.write(`      }`);
        w.newLine();
        w.write(`      totalCount`);
        w.newLine();
        w.write(`    }`);
        w.newLine();
        w.write(`  }`);
        w.newLine();
        w.write('\`);');
      });
    }

    // Replace the entire variable statement containing the useMulti call
    const variableStatement = call.getFirstAncestorByKind(SyntaxKind.VariableStatement);
    if (variableStatement) {
      const lines: string[] = [];

      // Handle terms destructuring only when we can't inline the selector
      if (!canInlineSelector) {
        // Use the dynamic approach with conflict-resolved variable names
        const viewVar = getVarName('view');
        const limitVar = getVarName('limit');
        const selectorTermsVar = getVarName('selectorTerms');
        
        lines.push(`const { ${viewVar}, ${limitVar}, ...${selectorTermsVar} } = ${termsExpr};`);
      }

      // Determine if we need NetworkStatus based on usage
      if (usedFields.loadingInitial || usedFields.loadingMore) {
        neededImports.apollo.add('NetworkStatus');
        usedFields.networkStatus = true;
      }

      // Determine if we need useLoadMore
      if (usedFields.loadMoreProps || usedFields.showLoadMore || usedFields.loadMore) {
        neededImports.useLoadMore = true;
        // We need fetchMore and loading for useLoadMore
        usedFields.fetchMore = true;
        usedFields.loading = true;
      }

      // If we're extracting results or other data-dependent values, we need data
      if (usedFields.results || usedFields.totalCount || usedFields.count) {
        usedFields.data = true;
      }

      // Build useQuery destructuring - only include what we actually use
      const queryDestructure: string[] = [];

      const dataVar = getVarName('data');
      const usedDataVarName = fieldAliases.data ? fieldAliases.data : dataVar;
      const dataAssignmentExpression = usedDataVarName === 'data' ? usedDataVarName : `data: ${usedDataVarName}`;
      if (usedFields.data) queryDestructure.push(dataAssignmentExpression);

      if (usedFields.error) queryDestructure.push(fieldAliases.error ? `error: ${fieldAliases.error}` : 'error');
      if (usedFields.loading) queryDestructure.push(fieldAliases.loading ? `loading: ${fieldAliases.loading}` : 'loading');
      if (usedFields.refetch) queryDestructure.push(fieldAliases.refetch ? `refetch: ${fieldAliases.refetch}` : 'refetch');
      if (usedFields.fetchMore) queryDestructure.push('fetchMore');
      if (usedFields.networkStatus) queryDestructure.push('networkStatus');

      // useQuery call
      lines.push(`const { ${queryDestructure.join(', ')} } = useQuery(${queryConst}, {`);
      lines.push(`  variables: {`);
      
      if (canInlineSelector) {
        const selectorValue = `{ ${inlineView}: ${inlineSelectorTerms} }`;
        lines.push(`    selector: ${selectorValue},`);
      } else {
        const viewVar = getVarName('view');
        const selectorTermsVar = getVarName('selectorTerms');
        lines.push(`    selector: { [${viewVar}]: ${selectorTermsVar} },`);
      }
      
      lines.push(`    limit: ${limitExpr},`);
      lines.push(`    enableTotal: ${enableTotalExpr},`);
      if (extraVarsValuesExpr) {
        lines.push(`    ...${extraVarsValuesExpr},`);
      }
      lines.push(`  },`);
      
      if (skipExpr) lines.push(`  skip: ${skipExpr},`);
      if (fetchPolicyExpr) lines.push(`  fetchPolicy: ${fetchPolicyExpr},`);
      if (nextFetchPolicyExpr) lines.push(`  nextFetchPolicy: ${nextFetchPolicyExpr},`);
      if (ssrExpr) lines.push(`  ssr: apolloSSRFlag(${ssrExpr}),`);
      if (pollIntervalExpr) lines.push(`  pollInterval: ${pollIntervalExpr},`);
      
      lines.push(`  notifyOnNetworkStatusChange: true,`);
      lines.push(`});`);

      // Extract results if needed
      if (usedFields.results) {
        const resultsName = fieldAliases.results || 'results';
        lines.push('');
        lines.push(`const ${resultsName} = ${dataVar}?.${resolverName}?.results;`);
      }

      // useLoadMore if needed
      if (usedFields.loadMoreProps || usedFields.showLoadMore || usedFields.loadMore) {
        const loadMoreOptions: string[] = [
          `data: ${dataVar}?.${resolverName}`,
          'loading',
          'fetchMore',
          `initialLimit: ${limitExpr}`,
          `itemsPerPage: ${itemsPerPageExpr}`,
        ];
        
        if (enableTotalExpr !== 'false') {
          loadMoreOptions.push(`enableTotal: ${enableTotalExpr}`);
        }
        if (alwaysShowLoadMoreExpr) {
          loadMoreOptions.push(`alwaysShowLoadMore: ${alwaysShowLoadMoreExpr}`);
        }
        // Reset trigger should just be the terms object
        loadMoreOptions.push(`resetTrigger: ${termsExpr}`);

        if (usedFields.loadMoreProps) {
          const propsName = fieldAliases.loadMoreProps || 'loadMoreProps';
          lines.push('');
          lines.push(`const ${propsName} = useLoadMore({`);
          lines.push(`  ${loadMoreOptions.join(',\n  ')}`);
          lines.push(`});`);
        } else {
          // Build the destructuring pattern correctly
          const destructureItems: string[] = [];
          if (usedFields.loadMore) {
            const loadMoreName = fieldAliases.loadMore || 'loadMore';
            destructureItems.push(loadMoreName === 'loadMore' ? 'loadMore' : `loadMore: ${loadMoreName}`);
          }
          if (usedFields.showLoadMore) {
            destructureItems.push('hidden');
          }
          
          lines.push('');
          lines.push(`const { ${destructureItems.join(', ')} } = useLoadMore({`);
          lines.push(`  ${loadMoreOptions.join(',\n  ')}`);
          lines.push(`});`);
          
          // Create showLoadMore variable if needed
          if (usedFields.showLoadMore) {
            const showLoadMoreName = fieldAliases.showLoadMore || 'showLoadMore';
            lines.push('');
            lines.push(`const ${showLoadMoreName} = !hidden;`);
          }
        }
      }

      // Additional derived values
      if (usedFields.totalCount) {
        const totalCountName = fieldAliases.totalCount || 'totalCount';
        lines.push(`const ${totalCountName} = ${dataVar}?.${resolverName}?.totalCount;`);
      }
      if (usedFields.count) {
        const countName = fieldAliases.count || 'count';
        const resultsRef = fieldAliases.results || 'results';
        lines.push(`const ${countName} = ${resultsRef}?.length ?? 0;`);
      }
      if (usedFields.loadingInitial) {
        const loadingInitialName = fieldAliases.loadingInitial || 'loadingInitial';
        lines.push(`const ${loadingInitialName} = networkStatus === NetworkStatus.loading;`);
      }
      if (usedFields.loadingMore) {
        const loadingMoreName = fieldAliases.loadingMore || 'loadingMore';
        lines.push(`const ${loadingMoreName} = networkStatus === NetworkStatus.fetchMore;`);
      }

      variableStatement.replaceWithText(lines.join('\n')).formatText({ baseIndentSize: 2 });
    }
  });

  // Add imports only for what we actually use
  ensureNamedImport(file, '@apollo/client', Array.from(neededImports.apollo));
  
  if (neededImports.useLoadMore) {
    const currentFilePath = file.getFilePath();
    const useLoadMorePath = '@/components/hooks/useLoadMore'; // getUseLoadMorePath(currentFilePath);
    ensureNamedImport(file, useLoadMorePath, ['useLoadMore']);
  }

  if (neededImports.apolloSSRFlag) {
    const currentFilePath = file.getFilePath();
    const currentDir = path.dirname(currentFilePath);
    const helpersPath = path.relative(currentDir, 'lib/helpers');
    const relativeHelpersPath = helpersPath.startsWith('.') ? helpersPath : `./${helpersPath}`;
    ensureNamedImport(file, relativeHelpersPath, ['apolloSSRFlag']);
  }

  if (neededImports.gql) {
    ensureNamedImport(file, '@/lib/generated/gql-codegen/gql', ['gql']);
  }

  // 5. Remove any remaining `useMulti` named import, since we've replaced all usages.
  if (useMultiImport) {
    const named = useMultiImport
      .getNamedImports()
      .find((ni) => ni.getName() === 'useMulti');
    named?.remove();
    if (useMultiImport.getNamedImports().length === 0) useMultiImport.remove();
  }
}

// ---------------------------------------------------------------------------
// Run ✈
project.getSourceFiles(['packages/**/*.ts', 'packages/**/*.tsx']).forEach(transformFile);

project.save().then(() => console.log('✅  useMulti → useQuery + useLoadMore codemod finished')); 