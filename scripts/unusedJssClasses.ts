/**
 * scripts/unusedJssClasses.ts: Analyzes the codebase with ts-morph and
 * outputs a list of JSS classes that look likely to be unused. Run with
 * `yarn unused-jss-classess`.
 *
 * This is subject to false positives, if code takes `classes` from
 * `useStyles` and does anything not-straightforward with it.
 */
import {
  Node,
  ObjectLiteralExpression,
  Project,
  SyntaxKind,
  VariableDeclaration,
} from "ts-morph";

interface ClassDefinitionCandidate {
  className: string;
  filePath: string;
  line: number;
}

interface StyleDefinitionInfo {
  classDefinitions: ClassDefinitionCandidate[];
  hasLocalUseStylesCall: boolean;
  styleVariableName: string;
  usedClassNames: Set<string>;
}

interface UseStylesBindings {
  directlyUsedClassNames: Set<string>;
  proxyVariableNames: Set<string>;
}

const SOURCE_GLOBS = [
  "app/**/*.ts",
  "app/**/*.tsx",
  "packages/**/*.ts",
  "packages/**/*.tsx",
];

const EXCLUDED_PATH_FRAGMENTS = [
  "/node_modules/",
  "/packages/lesswrong/lib/generated/",
  "/packages/lesswrong/lib/vendor/",
  "/packages/lesswrong/stubs/",
];

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function shouldScanFile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return !EXCLUDED_PATH_FRAGMENTS.some((fragment) => normalizedPath.includes(fragment));
}

function fileMatchesFilters(filePath: string, filters: string[]): boolean {
  if (filters.length === 0) {
    return true;
  }

  const normalizedPath = normalizePath(filePath);
  return filters.some((filter) => normalizedPath.includes(normalizePath(filter)));
}

function looksLikeClassName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

function unwrapExpression(node: Node): Node {
  let current = node;

  while (
    Node.isParenthesizedExpression(current) ||
    Node.isAsExpression(current) ||
    current.getKind() === SyntaxKind.SatisfiesExpression ||
    current.getKind() === SyntaxKind.TypeAssertionExpression
  ) {
    current = (current as Node & { getExpression(): Node }).getExpression();
  }

  return current;
}

function getReturnedObjectLiteral(node: Node | undefined): ObjectLiteralExpression | undefined {
  if (!node) {
    return undefined;
  }

  const unwrappedNode = unwrapExpression(node);

  if (Node.isArrowFunction(unwrappedNode) || Node.isFunctionExpression(unwrappedNode)) {
    const body = unwrappedNode.getBody();
    const unwrappedBody = unwrapExpression(body);

    if (Node.isObjectLiteralExpression(unwrappedBody)) {
      return unwrappedBody;
    }

    if (Node.isBlock(body)) {
      for (const statement of body.getStatements()) {
        if (!Node.isReturnStatement(statement)) {
          continue;
        }

        const expression = statement.getExpression();
        if (!expression) {
          continue;
        }

        const returnValue = unwrapExpression(expression);
        if (Node.isObjectLiteralExpression(returnValue)) {
          return returnValue;
        }
      }
    }
  }

  if (Node.isObjectLiteralExpression(unwrappedNode)) {
    return unwrappedNode;
  }

  return undefined;
}

function getClassDefinitions(styleDeclaration: VariableDeclaration): ClassDefinitionCandidate[] {
  const initializer = styleDeclaration.getInitializer();
  if (!initializer || !Node.isCallExpression(initializer)) {
    return [];
  }

  const stylesObject = getReturnedObjectLiteral(initializer.getArguments()[1]);
  if (!stylesObject) {
    return [];
  }

  const filePath = styleDeclaration.getSourceFile().getFilePath();
  const classDefinitions: ClassDefinitionCandidate[] = [];

  for (const property of stylesObject.getProperties()) {
    if (!Node.isPropertyAssignment(property) && !Node.isShorthandPropertyAssignment(property)) {
      continue;
    }

    const name = property.getName();
    if (!looksLikeClassName(name)) {
      continue;
    }

    classDefinitions.push({
      className: name,
      filePath,
      line: property.getStartLineNumber(),
    });
  }

  return classDefinitions;
}

function isDefineStylesCall(node: Node | undefined): boolean {
  return !!node && Node.isCallExpression(node) && node.getExpression().getText() === "defineStyles";
}

function isUseStylesCall(node: Node): boolean {
  if (!Node.isCallExpression(node)) {
    return false;
  }

  const calleeText = node.getExpression().getText();
  return calleeText === "useStyles" || calleeText === "useStylesNonProxy";
}

function getUseStylesBindings(styleVariableName: string, sourceFilePath: string): UseStylesBindings {
  const sourceFile = project.getSourceFileOrThrow(sourceFilePath);
  const directlyUsedClassNames = new Set<string>();
  const proxyVariableNames = new Set<string>();

  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (!isUseStylesCall(call)) {
      continue;
    }

    const [stylesArgument] = call.getArguments();
    if (!stylesArgument || stylesArgument.getText() !== styleVariableName) {
      continue;
    }

    const variableDeclaration = call.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
    if (!variableDeclaration) {
      continue;
    }

    const nameNode = variableDeclaration.getNameNode();
    if (Node.isIdentifier(nameNode)) {
      proxyVariableNames.add(nameNode.getText());
      continue;
    }

    if (!Node.isObjectBindingPattern(nameNode)) {
      continue;
    }

    for (const element of nameNode.getElements()) {
      const propertyNameNode = element.getPropertyNameNode();
      if (!propertyNameNode) {
        const className = element.getNameNode().getText();
        if (looksLikeClassName(className)) {
          directlyUsedClassNames.add(className);
        }
        continue;
      }

      const propertyNameText = propertyNameNode.getText().replace(/^["']|["']$/g, "");
      if (looksLikeClassName(propertyNameText)) {
        directlyUsedClassNames.add(propertyNameText);
      }
    }
  }

  return {
    directlyUsedClassNames,
    proxyVariableNames,
  };
}

function getUsedClassNames(styleVariableName: string, sourceFilePath: string): UseStylesBindings & {
  usedClassNames: Set<string>;
} {
  const sourceFile = project.getSourceFileOrThrow(sourceFilePath);
  const bindings = getUseStylesBindings(styleVariableName, sourceFilePath);
  const usedClassNames = new Set(bindings.directlyUsedClassNames);

  if (bindings.proxyVariableNames.size === 0) {
    return {
      ...bindings,
      usedClassNames,
    };
  }

  for (const propertyAccess of sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)) {
    const expressionText = propertyAccess.getExpression().getText();
    if (!bindings.proxyVariableNames.has(expressionText)) {
      continue;
    }

    const className = propertyAccess.getName();
    if (looksLikeClassName(className)) {
      usedClassNames.add(className);
    }
  }

  for (const elementAccess of sourceFile.getDescendantsOfKind(SyntaxKind.ElementAccessExpression)) {
    const expressionText = elementAccess.getExpression().getText();
    if (!bindings.proxyVariableNames.has(expressionText)) {
      continue;
    }

    const argumentExpression = elementAccess.getArgumentExpression();
    if (!argumentExpression) {
      continue;
    }

    if (Node.isStringLiteral(argumentExpression) || Node.isNoSubstitutionTemplateLiteral(argumentExpression)) {
      const className = argumentExpression.getLiteralText();
      if (looksLikeClassName(className)) {
        usedClassNames.add(className);
      }
    }
  }

  return {
    ...bindings,
    usedClassNames,
  };
}

function getStyleDefinitionsInFile(sourceFilePath: string): StyleDefinitionInfo[] {
  const sourceFile = project.getSourceFileOrThrow(sourceFilePath);
  const styleDefinitions: StyleDefinitionInfo[] = [];

  for (const variableDeclaration of sourceFile.getVariableDeclarations()) {
    const nameNode = variableDeclaration.getNameNode();
    if (!Node.isIdentifier(nameNode)) {
      continue;
    }

    const initializer = variableDeclaration.getInitializer();
    if (!isDefineStylesCall(initializer)) {
      continue;
    }

    const styleVariableName = nameNode.getText();
    const usageInfo = getUsedClassNames(styleVariableName, sourceFilePath);
    styleDefinitions.push({
      classDefinitions: getClassDefinitions(variableDeclaration),
      hasLocalUseStylesCall:
        usageInfo.directlyUsedClassNames.size > 0 || usageInfo.proxyVariableNames.size > 0,
      styleVariableName,
      usedClassNames: usageInfo.usedClassNames,
    });
  }

  return styleDefinitions;
}

function getCandidateClassDefinitions(styleDefinition: StyleDefinitionInfo): ClassDefinitionCandidate[] {
  if (!styleDefinition.hasLocalUseStylesCall) {
    return [];
  }

  return styleDefinition.classDefinitions.filter(
    ({ className }) => !styleDefinition.usedClassNames.has(className),
  );
}

function getSourceFiles(filters: string[]) {
  return project.getSourceFiles(SOURCE_GLOBS).filter((sourceFile) => {
    const filePath = sourceFile.getFilePath();
    return shouldScanFile(filePath) && fileMatchesFilters(filePath, filters);
  });
}

function formatCandidate(candidate: ClassDefinitionCandidate): string {
  return `${candidate.filePath}:${candidate.line} ${candidate.className}`;
}

function main() {
  const filters = process.argv.slice(2);
  const candidates = getSourceFiles(filters)
    .flatMap((sourceFile) => getStyleDefinitionsInFile(sourceFile.getFilePath()))
    .flatMap(getCandidateClassDefinitions)
    .sort((left, right) => {
      const pathComparison = left.filePath.localeCompare(right.filePath);
      if (pathComparison !== 0) {
        return pathComparison;
      }

      const lineComparison = left.line - right.line;
      if (lineComparison !== 0) {
        return lineComparison;
      }

      return left.className.localeCompare(right.className);
    });

  for (const candidate of candidates) {
    console.log(formatCandidate(candidate));
  }
}

main();
