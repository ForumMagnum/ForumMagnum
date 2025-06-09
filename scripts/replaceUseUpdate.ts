// codemods/replaceUseUpdate.ts
// Transform all useUpdate(...) hooks into raw useMutation(...) calls and
// inline the mutation document + adjust call-sites.
//
// – Generates an `update<Type>` GraphQL document at the top of the file.
// – Replaces the `useUpdate` variable statement with the tuple returned by
//   `useMutation` (keeping aliases, loading, error, etc.).
// – Rewrites every call to the returned mutate function so the object argument
//   becomes `{ variables: { selector, data, ...extra }, optimisticResponse: … }`
//   while preserving original multi-line formatting.
// – Supports optional `skipCacheUpdate` (passed straight through).
// – Preserves imports, renames any existing `gql` from `@apollo/client` to
//   `graphql`, then adds a canonical `gql` import from the code-gen path.
// – Removes the now-unused `useUpdate` import.

import {
  Project,
  SyntaxKind,
  ObjectLiteralExpression,
  ObjectBindingPattern,
  Node,
  SourceFile,
  IndentationText,
} from 'ts-morph';
import path from 'path';
import { collectionNameToTypeName } from '../packages/lesswrong/lib/generated/collectionTypeNames';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
project.manipulationSettings.set({ indentationText: IndentationText.TwoSpaces });

// ---------------------------------------------------------------------------
function ensureNamedImport(file: SourceFile, moduleSpecifier: string, names: string[]) {
  let decl = file
    .getImportDeclarations()
    .find((d) => d.getModuleSpecifierValue() === moduleSpecifier);

  if (!decl) {
    decl = file.addImportDeclaration({ moduleSpecifier, namedImports: [] });
  }

  const already = decl.getNamedImports().map((ni) => ni.getName());
  for (const n of names) if (!already.includes(n)) decl!.addNamedImport(n);
}
// ---------------------------------------------------------------------------

interface MutateMeta {
  typeName: string;           // ex. "Post"
  mutationName: string;       // ex. "updatePost"
}

function transformFile(file: SourceFile) {
  // 1. Look for `useUpdate` import.
  const useUpdateImport = file
    .getImportDeclarations()
    .find((d) => d.getNamedImports().some((ni) => ni.getName() === 'useUpdate'));
  if (!useUpdateImport) return;

  // 2. Find every `useUpdate({ ... })` call expression.
  const hookCalls = file
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((c) => c.getExpression().getText() === 'useUpdate');
  if (hookCalls.length === 0) return;

  // 3. Ensure imports we'll need.
  ensureNamedImport(file, '@apollo/client', ['useMutation']);

  // If the file already imports gql from '@apollo/client', rename it to graphql.
  const apolloImport = file
    .getImportDeclarations()
    .find((d) => d.getModuleSpecifierValue() === '@apollo/client');
  if (apolloImport) {
    const gqlNamed = apolloImport.getNamedImports().find((ni) => ni.getName() === 'gql');
    if (gqlNamed) {
      file.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
        if (id.getText() === 'gql') id.replaceWithText('graphql');
      });
      gqlNamed.replaceWithText('gql as graphql');
    }
  }

  // Add canonical code-gen gql import.
  ensureNamedImport(file, '@/lib/generated/gql-codegen/gql', ['gql']);

  // Tracking.
  let mutationCounter = 0;
  const mutateAliases: string[] = [];            // identifiers that are mutate functions
  const objectVarNames: string[] = [];           // names of wrapper objects (for .mutate calls)
  const metaByAlias: Record<string, MutateMeta> = {};

  // Helpers to read object-literal props.
  const getStringLiteralProp = (obj: ObjectLiteralExpression, key: string) =>
    obj.getProperty(key)?.getFirstChildByKind(SyntaxKind.StringLiteral)?.getLiteralText();

  const getInitializerText = (obj: ObjectLiteralExpression, key: string) => {
    const p = obj.getProperty(key);
    if (p && Node.isPropertyAssignment(p)) {
      const init = p.getInitializer();
      if (init) return init.getText();
    }
    return undefined;
  };

  // -------------------------------------------------------------------------
  // 1st pass: replace the hook variable statement & insert gql.
  hookCalls.forEach((call) => {
    const arg = call.getArguments()[0];
    if (!arg || !Node.isObjectLiteralExpression(arg)) return;
    const obj = arg as ObjectLiteralExpression;

    const collectionName = getStringLiteralProp(obj, 'collectionName');
    const fragmentName   = getStringLiteralProp(obj, 'fragmentName');
    if (!collectionName || !fragmentName) return; // can't handle dynamic cases

    const skipCacheUpdateExpr = getInitializerText(obj, 'skipCacheUpdate');

    // Figure out type & names.
    const typeName = collectionNameToTypeName[
      collectionName as keyof typeof collectionNameToTypeName
    ] ?? collectionName.replace(/s$/, '');
    const mutationName = `update${typeName}`;

    // Operation name uniqueness.
    const fileBase = path.basename(file.getFilePath(), path.extname(file.getFilePath())).replace(/[^A-Za-z0-9_]/g, '');
    const opName   = mutationCounter === 0 ? `${mutationName}${fileBase}` : `${mutationName}${fileBase}${mutationCounter}`;
    mutationCounter++;

    const mutationConst = `${fragmentName}UpdateMutation`;

    // Insert gql once.
    if (!file.getVariableDeclaration(mutationConst)) {
      const lastImport = file.getImportDeclarations().slice(-1)[0];
      const insertAt   = lastImport ? lastImport.getChildIndex() + 1 : 0;
      file.insertStatements(insertAt, (w) => {
        w.newLine();
        w.write(`const ${mutationConst} = gql(\`
`);
        w.write(`  mutation ${opName}($selector: SelectorInput!, $data: Update${typeName}DataInput!) {
`);
        w.write(`    ${mutationName}(selector: $selector, data: $data) {
`);
        w.write(`      data {
`);
        w.write(`        ...${fragmentName}
`);
        w.write(`      }
`);
        w.write(`    }
`);
        w.write(`  }
`);
        w.write('\`);');
      });
    }

    // Replace the variable statement that contains this hook call.
    const varStmt = call.getFirstAncestorByKind(SyntaxKind.VariableStatement);
    if (!varStmt) return; // should not happen

    const decl = varStmt.getDeclarations()[0];

    const optionsSuffix = skipCacheUpdateExpr ? `, { skipCacheUpdate: ${skipCacheUpdateExpr} }` : '';

    if (decl && Node.isVariableDeclaration(decl) && Node.isObjectBindingPattern(decl.getNameNode())) {
      // Pattern: const { mutate: alias, loading } = useUpdate(...)
      const pattern = decl.getNameNode() as ObjectBindingPattern;
      let alias = 'mutate';
      const rest: string[] = [];
      pattern.getElements().forEach((el) => {
        const prop = el.getPropertyNameNode()?.getText() ?? el.getName();
        if (prop === 'mutate') alias = el.getName();
        else rest.push(el.getText());
      });

      mutateAliases.push(alias);
      metaByAlias[alias] = { typeName, mutationName };

      const restText = rest.length ? `{ ${rest.join(', ')} }` : '{}';
      varStmt.replaceWithText(`const [${alias}${restText !== '{}' ? `, ${restText}` : ''}] = useMutation(${mutationConst}${optionsSuffix});`);
    } else if (decl && Node.isVariableDeclaration(decl) && Node.isIdentifier(decl.getNameNode())) {
      // Rare: const updateWrapper = useUpdate(...)
      const objName = decl.getNameNode().getText();
      objectVarNames.push(objName);
      metaByAlias[objName] = { typeName, mutationName }; // wrapper name for .mutate

      varStmt.replaceWithText(
        `const [${objName}, { loading: ${objName}Loading, error: ${objName}Error, called: ${objName}Called, data: ${objName}Data }] = useMutation(${mutationConst}${optionsSuffix});`,
      );
    }
  });

  // -------------------------------------------------------------------------
  // Helper: rewrite the argument object of a mutate call.
  function rewriteCallArg(arg: ObjectLiteralExpression, meta: MutateMeta) {
    const getInit = (name: string) => {
      const p = arg.getProperty(name);
      if (p && Node.isPropertyAssignment(p)) {
        const init = p.getInitializer();
        return init ? init.getText() : undefined;
      }
      return undefined;
    };

    const selectorTxt = getInit('selector');
    const dataTxt     = getInit('data');
    if (!selectorTxt || !dataTxt) return;

    const optimisticTxt = getInit('optimisticResponse');
    const extraVarsTxt  = getInit('extraVariables');

    arg.replaceWithText((w) => {
      w.write('{');
      w.indent(() => {
        w.write('variables: {');
        w.indent(() => {
          w.write(`selector: ${selectorTxt},`);
          w.newLine();
          w.write(`data: ${dataTxt}`);
          if (extraVarsTxt) w.write(`, ...${extraVarsTxt}`);
        });
        w.newLine();
        w.write('}');

        if (optimisticTxt) {
          w.write(',');
          w.newLine();
          w.write('optimisticResponse: {');
          w.indent(() => {
            w.write(`${meta.mutationName}: {`);
            w.indent(() => {
              w.write(`__typename: "${meta.mutationName}",`);
              w.newLine();
              w.write('data: {');
              w.indent(() => {
                w.write(`__typename: "${meta.typeName}",`);
                w.newLine();
                w.write(`...${optimisticTxt}`);
              });
              w.newLine();
              w.write('}');
            });
            w.newLine();
            w.write('}');
          });
          w.newLine();
          w.write('}');
        }
      });
      w.newLine();
      w.write('}');
    }).formatText();
  }

  // -------------------------------------------------------------------------
  // 2nd pass: visit every call-expression to rewrite arguments.
  file.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
    if (call.wasForgotten()) return;

    const expr = call.getExpression();

    // Direct function call alias.
    if (Node.isIdentifier(expr)) {
      const name = expr.getText();
      if (!mutateAliases.includes(name)) return;
      const meta = metaByAlias[name];
      const firstArg = call.getArguments()[0];
      if (firstArg && Node.isObjectLiteralExpression(firstArg)) rewriteCallArg(firstArg, meta);
      return;
    }

    // Wrapper.mutate(...) form — rare.
    if (Node.isPropertyAccessExpression(expr)) {
      if (expr.getName() !== 'mutate') return;
      const objName = expr.getExpression().getText();
      if (!objectVarNames.includes(objName)) return;
      const meta = metaByAlias[objName];
      const firstArg = call.getArguments()[0];
      if (firstArg && Node.isObjectLiteralExpression(firstArg)) rewriteCallArg(firstArg, meta);
      // drop the `.mutate` part
      expr.replaceWithText(objName);
    }
  });

  // -------------------------------------------------------------------------
  // Remove the useUpdate import if now empty.
  const named = useUpdateImport.getNamedImports().find((ni) => ni.getName() === 'useUpdate');
  named?.remove();
  if (useUpdateImport.getNamedImports().length === 0) useUpdateImport.remove();
}

// Run ✈
project.getSourceFiles(['packages/**/*.ts', 'packages/**/*.tsx']).forEach(transformFile);
project.save().then(() => console.log('✅  useUpdate → useMutation codemod finished'));
