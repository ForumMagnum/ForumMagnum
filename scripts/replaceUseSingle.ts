// codemods/replaceUseSingle.ts
import {
  Project,
  SyntaxKind,
  ObjectLiteralExpression,
  Node,
  SourceFile,
  IndentationText,
} from 'ts-morph';
import camelCase from 'lodash/camelCase';
import path from 'path';

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
// ---------------------------------------------------------------------------

function transformFile(file: SourceFile) {
  // 1. Bail quickly if the file never imports useSingle
  const useSingleImport = file
    .getImportDeclarations()
    .find((d) =>
      d.getNamedImports().some((ni) => ni.getName() === 'useSingle'),
    );
  if (!useSingleImport) return;

  // 2. Find *all* call-expressions `useSingle({...})`
  const calls = file
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((c) => c.getExpression().getText() === 'useSingle');

  if (calls.length === 0) return;

  // 3. Try to extract the React component name (for query name uniqueness)
  const componentName =
    file.getDefaultExportSymbol()?.getName() ??
    file.getFunctions().find((fn) => fn.isDefaultExport())?.getName() ??
    'Component';

  // 4. Make sure we have gql/useQuery imported
  ensureNamedImport(file, '@apollo/client', ['useQuery']);

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

  // Ensure graphql import from codegen path
  ensureNamedImport(file, '@/lib/generated/gql-codegen/gql', ['gql']);

  let queryCounter = 0;

  calls.forEach((call) => {
    const arg = call.getArguments()[0];
    if (
      !arg ||
      arg.getKind() !== SyntaxKind.ObjectLiteralExpression
    )
      return;

    const objLit = arg as ObjectLiteralExpression;

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

    const documentIdExpr = getInitializerText('documentId') ?? 'documentId';

    const collectionName = getStringLiteralProp('collectionName');
    const fragmentName = getStringLiteralProp('fragmentName');
    if (!collectionName || !fragmentName) return; // can't handle weird cases

    const skipProp = objLit.getProperty('skip');
    const skipExpr = skipProp ? (skipProp as any).getInitializer()?.getText() ?? 'false' : undefined;

    // Fetch policy related
    const fetchPolicyExpr = getInitializerText('fetchPolicy');
    const nextFetchPolicyExpr = getInitializerText('nextFetchPolicy');
    const notifyOnNetworkStatusChangeExpr = getInitializerText('notifyOnNetworkStatusChange');
    const apolloClientExpr = getInitializerText('apolloClient');

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
        if (defs.length>0) extraVarDefs = ', ' + defs.join(', ');
      }
    }

    // Build resolver / paths / names ------------------------------------
    const typeGuess = collectionName.replace(/s$/, ''); // naive singular
    const resolverName = camelCase(typeGuess);

    const fileBase = path.basename(file.getFilePath().toString(), path.extname(file.getFilePath().toString())).replace(/[^A-Za-z0-9_]/g, '');
    const aliasName: string | null = queryCounter === 0 ? `${fileBase}` : `${fileBase}${queryCounter}`;

    queryCounter++;

    const queryConst = `${fragmentName}Query`;

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
        w.write(`  query ${aliasName}($documentId: String${extraVarDefs}) {`);
        w.newLine();
        w.write(
          `    ${resolverName}(input: { selector: { documentId: $documentId } }) {`,
        );
        w.newLine();
        w.write(`      result {`);
        w.newLine();
        w.write(`        ...${fragmentName}`);
        w.newLine();
        w.write(`      }`);
        w.newLine();
        w.write(`    }`);
        w.newLine();
        w.write(`  }`);
        w.newLine();
        w.write('\`);');
      });
    }

    // Replace the entire variable statement containing the useSingle call so that
    // we invoke useQuery at the top level (hooks rule).
    const variableStatement = call.getFirstAncestorByKind(SyntaxKind.VariableStatement);
    if (variableStatement) {

      // Determine destructuring pattern and document alias
      let documentVar = 'document';
      let destructureParts: string[] = [];

      const decl = variableStatement.getDeclarations()[0];
      if (decl && Node.isVariableDeclaration(decl)) {
        const nameNode = decl.getNameNode();
        if (Node.isObjectBindingPattern(nameNode)) {
          nameNode.getElements().forEach((el) => {
            const propName = el.getPropertyNameNode()?.getText() ?? el.getName();
            if (propName === 'document') {
              documentVar = el.getName();
            } else {
              destructureParts.push(el.getText());
            }
          });
        }
      }

      // Check if a standalone variable or parameter named `data` already exists.
      let dataVar = 'data';
      const hasExistingDataVar =
        file.getDescendantsOfKind(SyntaxKind.VariableDeclaration).some(v => v.getName() === 'data') ||
        file.getDescendantsOfKind(SyntaxKind.Parameter).some(p => p.getName() === 'data');

      if (hasExistingDataVar) {
        let suffix = 1;
        while (
          file.getDescendantsOfKind(SyntaxKind.Identifier).some(id => id.getText() === `data${suffix}`)
        ) {
          suffix++;
        }
        dataVar = `data${suffix}`;
      }

      // Ensure we have access to data variable
      if (!destructureParts.some((p) => p.replace(/\s+/g, '').startsWith('data'))) {
        destructureParts.push(dataVar === 'data' ? 'data' : `data: ${dataVar}`);
      } else if (dataVar !== 'data') {
        // replace existing 'data' entry with alias
        destructureParts = destructureParts.map(p=>{
          const trimmed=p.replace(/\s+/g,'');
          return trimmed.startsWith('data') ? `data: ${dataVar}` : p;
        });
      }

      const destructureText = destructureParts.length > 0 ? `{ ${destructureParts.join(', ')} }` : 'queryResult';

      const lines: string[] = [];

      if (destructureParts.length > 0) {
        lines.push(`const ${destructureText} = useQuery(${queryConst}, {`);
      } else {
        lines.push(`const queryResult = useQuery(${queryConst}, {`);
      }

      // Build variables object
      const varsParts: string[] = [`documentId: ${documentIdExpr}`];
      if (extraVarsValuesProp && Node.isPropertyAssignment(extraVarsValuesProp)) {
        const propAssign = extraVarsValuesProp; // narrowed type
        const valsInitNode = propAssign.getInitializer();
        if (valsInitNode && Node.isObjectLiteralExpression(valsInitNode)) {
          valsInitNode.getProperties().forEach(p => varsParts.push(p.getText()));
        } else if (extraVarsValuesExpr) {
          varsParts.push(`...${extraVarsValuesExpr}`);
        }
      }
      lines.push(`  variables: { ${varsParts.join(', ')} },`);

      if (skipExpr) lines.push(`  skip: ${skipExpr},`);

      if (fetchPolicyExpr) lines.push(`  fetchPolicy: ${fetchPolicyExpr},`);
      if (nextFetchPolicyExpr) lines.push(`  nextFetchPolicy: ${nextFetchPolicyExpr},`);
      if (notifyOnNetworkStatusChangeExpr) lines.push(`  notifyOnNetworkStatusChange: ${notifyOnNetworkStatusChangeExpr},`);
      if (apolloClientExpr) lines.push(`  client: ${apolloClientExpr},`);

      const ssrExpr = getInitializerText('ssr');
      if (ssrExpr) lines.push(`  ssr: ${ssrExpr},`);

      lines.push(`});`);

      if (destructureParts.length === 0) {
        lines.push(`const { data: ${dataVar} } = queryResult;`);
      }

      lines.push(`const ${documentVar} = ${dataVar}?.${resolverName}?.result;`);

      variableStatement.replaceWithText(lines.join('\n'));
    } else {
      // Fallback: simple replacement (should be rare)
      call.replaceWithText(`useQuery(${queryConst}, { variables: { documentId: ${documentIdExpr} }, skip: ${skipExpr} })`);
    }
  });

  // 5. Remove any remaining `useSingle` named import, since we've replaced all usages.
  if (useSingleImport) {
    const named = useSingleImport
      .getNamedImports()
      .find((ni) => ni.getName() === 'useSingle');
    named?.remove();
    if (useSingleImport.getNamedImports().length === 0) useSingleImport.remove();
  }

  // Format the file after all modifications
  // file.formatText();
}

// ---------------------------------------------------------------------------
// Run ✈
project.getSourceFiles(['packages/**/*.ts', 'packages/**/*.tsx']).forEach(transformFile);

project.save().then(() => console.log('✅  useSingle → useQuery codemod finished'));