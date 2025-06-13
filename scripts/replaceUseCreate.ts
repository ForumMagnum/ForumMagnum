// codemods/replaceUseCreate.ts
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

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});
project.manipulationSettings.set({ indentationText: IndentationText.TwoSpaces });

// ----------------------------------------------------------------------------
// Utility: make sure an import like
//   import { foo, bar } from 'baz';
// exists, adding missing named imports if needed
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
  names.forEach((n) => {
    if (!already.includes(n)) decl!.addNamedImport(n);
  });
}
// ----------------------------------------------------------------------------

function transformFile(file: SourceFile) {
  // 1. Does the file import useCreate at all?
  const useCreateImport = file
    .getImportDeclarations()
    .find((d) =>
      d.getNamedImports().some((ni) => ni.getName() === 'useCreate'),
    );
  if (!useCreateImport) return;

  // 2. Find every useCreate({ … }) call-expression
  const calls = file
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((c) => c.getExpression().getText() === 'useCreate');
  if (calls.length === 0) return;

  // 3. Ensure imports we'll need
  ensureNamedImport(file, '@apollo/client', ['useMutation']);

  // if the file already imports `gql` from '@apollo/client', rename it to `graphql`
  const apolloImport = file
    .getImportDeclarations()
    .find((d) => d.getModuleSpecifierValue() === '@apollo/client');
  if (apolloImport) {
    const gqlNamed = apolloImport
      .getNamedImports()
      .find((ni) => ni.getName() === 'gql');
    if (gqlNamed) {
      file.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
        if (id.getText() === 'gql') id.replaceWithText('graphql');
      });
      gqlNamed.replaceWithText('gql as graphql');
    }
  }

  // canonical gql import – the codegen one
  ensureNamedImport(file, '@/lib/generated/gql-codegen/gql', ['gql']);

  let mutationCounter = 0;
  const mutateFunctionNames: string[] = [];
  const objectVariableNames: string[] = []; // for the `.create(…)` style

  // --------------------------------------------------------------------------
  // Helper ─ given an ObjectLiteralExpression of the options, pull out props
  const getStringLiteralProp = (obj: ObjectLiteralExpression, key: string) =>
    obj
      .getProperty(key)
      ?.getFirstChildByKind(SyntaxKind.StringLiteral)
      ?.getLiteralText();

  const getInitializerText = (obj: ObjectLiteralExpression, key: string) => {
    const p = obj.getProperty(key);
    if (p && Node.isPropertyAssignment(p)) {
      const init = p.getInitializer();
      if (init) return init.getText();
    }
    return undefined;
  };
  // --------------------------------------------------------------------------

  calls.forEach((call) => {
    const arg = call.getArguments()[0];
    if (!arg || !Node.isObjectLiteralExpression(arg)) return;
    const obj = arg as ObjectLiteralExpression;

    const collectionName = getStringLiteralProp(obj, 'collectionName');
    const fragmentName = getStringLiteralProp(obj, 'fragmentName');
    if (!collectionName || !fragmentName) return;

    const ignoreResultsExpr = getInitializerText(obj, 'ignoreResults');

    // compute type & names ----------------------------------------------------
    const typeName =
      collectionNameToTypeName[collectionName as keyof typeof collectionNameToTypeName] ??
      collectionName.replace(/s$/, '');
    const mutationName = `create${typeName}`;

    const mutationFileBase = path
      .basename(file.getFilePath(), path.extname(file.getFilePath()))
      .replace(/[^A-Za-z0-9_]/g, '');
    const opName =
      mutationCounter === 0 ? `${mutationName}${mutationFileBase}` : `${mutationName}${mutationFileBase}${mutationCounter}`;
    mutationCounter++;

    const mutationConst = `${fragmentName}Mutation`;

    // Insert the gql document (once per file / const-name)
    if (!file.getVariableDeclaration(mutationConst)) {
      const importDecls = file.getImportDeclarations();
      const lastImport = importDecls[importDecls.length - 1];
      const insertAt = lastImport
        ? lastImport.getChildIndex() + 1
        : 0;

      file.insertStatements(insertAt, (w) => {
        w.newLine();
        w.write(`const ${mutationConst} = gql(\``);
        w.newLine();
        w.write(
          `  mutation ${opName}($data: Create${typeName}DataInput!) {`,
        );
        w.newLine();
        w.write(`    ${mutationName}(data: $data) {`);
        w.newLine();
        w.write(`      data {`);
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

    // Rewrite the *variable statement* that contains this call ---------------
    const varStmt = call.getFirstAncestorByKind(SyntaxKind.VariableStatement);
    if (!varStmt) return; // very unusual, but bail gracefully

    const decl = varStmt.getDeclarations()[0];

    // CASE 1 – object destructuring ({ create, loading, … } = useCreate(…))
    if (
      decl &&
      Node.isVariableDeclaration(decl) &&
      Node.isObjectBindingPattern(decl.getNameNode())
    ) {
      const pattern = decl.getNameNode() as ObjectBindingPattern;

      let createAlias = 'create';
      const resultBindings: string[] = [];

      pattern.getElements().forEach((el) => {
        const prop = el.getPropertyNameNode()?.getText() ?? el.getName();
        if (prop === 'create') {
          createAlias = el.getName();
        } else {
          resultBindings.push(el.getText());
        }
      });

      // record for later call-site adjustments
      mutateFunctionNames.push(createAlias);

      const lines: string[] = [];
      const resultBindingText =
        resultBindings.length > 0 ? `{ ${resultBindings.join(', ')} }` : '{}';

      lines.push(
        `const [${createAlias}${resultBindingText !== '{}' ? `, ${resultBindingText}` : ''}] = useMutation(${mutationConst}${ignoreResultsExpr ? ', {' : ');'}` ,
      );
      if (ignoreResultsExpr) {
        lines.push(`  ignoreResults: ${ignoreResultsExpr},`);
        lines.push('});');
      }

      varStmt.replaceWithText(lines.join('\n'));
    }
    // CASE 2 – simple assignment (const fooCreate = useCreate(…))
    else if (
      decl &&
      Node.isVariableDeclaration(decl) &&
      Node.isIdentifier(decl.getNameNode())
    ) {
      const varName = decl.getNameNode().getText();

      objectVariableNames.push(varName); // for the `.create(…)` pattern
      mutateFunctionNames.push(varName); // simple direct calls

      const lines: string[] = [];
      lines.push(
        `const [${varName}, { loading: ${varName}Loading, error: ${varName}Error, called: ${varName}Called, data: ${varName}Data }] =`,
      );
      lines.push(
        `  useMutation(${mutationConst}, {${ignoreResultsExpr ? ` ignoreResults: ${ignoreResultsExpr},` : ''} });`,
      );

      varStmt.replaceWithText(lines.join('\n'));
    }
  });

  // ---------------------------------------------------------------------------
  // Helper – inside a call-expression, swap  { data: … }  →  { variables: { data: … } }
  function wrapDataInVariables(arg: ObjectLiteralExpression) {
    const dataProp = arg.getProperty('data');
    if (!dataProp || !Node.isPropertyAssignment(dataProp)) return;

    const dataInit = dataProp.getInitializer();
    if (!dataInit) return;

    // Preserve the original object text verbatim – that keeps its own newlines /
    // indentation exactly as they were.
    const dataText = dataInit.getText();

    dataProp.replaceWithText(`variables: { data: ${dataText} }`).formatText();
  }

  // ---------------------------------------------------------------------------
  // Fix every call that used to target the wrapper or wrapper.create
  file
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .forEach((call) => {
      // it may have been detached by an earlier replace; ignore it
      if (call.wasForgotten()) return;

      const expr = call.getExpression();

      const isDirect =
        Node.isIdentifier(expr) &&
        mutateFunctionNames.includes(expr.getText());

      const isDotCreate =
        Node.isPropertyAccessExpression(expr) &&
        expr.getName() === 'create' &&
        objectVariableNames.includes(expr.getExpression().getText());

      if (!(isDirect || isDotCreate)) return;

      const firstArg = call.getArguments()[0];
      if (firstArg && Node.isObjectLiteralExpression(firstArg)) {
        wrapDataInVariables(firstArg);
      }

      // If we just handled the bar.create(…) case, drop the "create"
      if (isDotCreate) {
        expr.replaceWithText(expr.getExpression().getText());
      }
    });

  // --------------------------------------------------------------------------
  // Finally, drop the `useCreate` import
  const named = useCreateImport
    .getNamedImports()
    .find((ni) => ni.getName() === 'useCreate');
  named?.remove();
  if (useCreateImport.getNamedImports().length === 0) useCreateImport.remove();
}

// ----------------------------------------------------------------------------
// Run over all source files under packages/
project
  .getSourceFiles(['packages/**/*.ts', 'packages/**/*.tsx'])
  .forEach(transformFile);

project.save().then(() =>
  console.log('✅  useCreate → useMutation codemod finished'),
);
