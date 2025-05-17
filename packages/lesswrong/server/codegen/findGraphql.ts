import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import keyBy from 'lodash/keyBy';
import { extractFragmentName } from '@/lib/fragments/fragmentWrapper';
import gql from 'graphql-tag';
import { type DocumentNode, type DefinitionNode, Kind, FragmentDefinitionNode } from 'graphql';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { generateDefaultFragments } from './generateDefaultFragments';

function fileMightIncludeFragment(filePath: string): boolean {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return fileContents.includes('fragment ');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error reading file ${filePath} when checking if it might include a fragment: ${error}`);
    return false;
  }
}

function findFragmentsIn(srcDir: string, functionToFind: string): string[] {
  const tsFiles = getAllTypeScriptFilesIn(srcDir);
  console.log(`Examining ${tsFiles.length} files in ${srcDir} for fragments`);
  const program = ts.createProgram(tsFiles, {});
  const fragmentStrings: string[] = [];
  
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.fileName.includes('fragments.ts')) {
      console.log(`Visiting ${sourceFile.fileName}`);
    }
    const fragmentStringsInFile = findFragmentsInFile(sourceFile, functionToFind);
    fragmentStrings.push(...fragmentStringsInFile);
  }
  
  return fragmentStrings;
}

function getAllTypeScriptFilesIn(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile()
        && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
        && !entry.name.endsWith('.d.ts')
        && fileMightIncludeFragment(fullPath)
      ) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function isGqlCall(node: ts.Node): node is ts.CallExpression {
  if (!ts.isCallExpression(node) || ts.isTemplateExpression(node)) return false;
  const expression = node.expression;
  if (!ts.isIdentifier(expression)) return false;
  if (expression.text !== 'gql') return false;
  if (node.arguments.length !== 1) return false;
  return true;
}

function findFragmentsInFile(
  sourceFile: ts.SourceFile,
  functionToFind: string,
): string[] {
  let fragments: string[] = [];

  function visit(node: ts.Node) {
    if (isGqlCall(node)) {
      const template = node.arguments[0];
      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        const maybeFragmentString = template.text;
        if (/fragment\s+([a-zA-Z0-9-_]+)\s+on\s+([a-zA-Z0-9-_]+)\s*\{/g.test(maybeFragmentString)) {
          fragments.push(maybeFragmentString);
        }
      }
    }

    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return fragments;
}


export type FragmentFromSource = {
  fragmentName: string,
  graphqlType: string
  fragmentText: string,
  parsedFragment: FragmentDefinitionNode
}
export type FragmentsFromSource = Record<string, FragmentFromSource>

// Memoize so we don't search the source tree multiple times
let allFragmentsInSource: FragmentsFromSource|null = null;

export function findFragmentsInSource(collectionNameToTypeName: Record<string, string>): FragmentsFromSource {
  if (allFragmentsInSource) return allFragmentsInSource;
  const foundFragmentStrings = findFragmentsIn("packages/lesswrong", "gql");
  const defaultFragmentStrings = generateDefaultFragments(collectionNameToTypeName);
  const fragmentStrings = [
    ...foundFragmentStrings,
    ...defaultFragmentStrings,
  ];

  allFragmentsInSource = keyBy(filterNonnull(fragmentStrings.map(f => {
    let parsedFragment: DocumentNode;
    try {
      parsedFragment = gql(f);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error parsing fragment: ${f}`, e);
      return null;
    }
    let fragmentDefinition: FragmentDefinitionNode;
    try {
      fragmentDefinition = getFragmentDefinitionInGraphQL(parsedFragment);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error getting fragment definition for string ${f}: ${e}`);
      return null;
    }
    if (!fragmentDefinition.typeCondition) {
      throw new Error('Fragment definition does not have a type condition');
    }
    const graphqlType = fragmentDefinition.typeCondition.name.value;
    return {
      fragmentName: extractFragmentName(f),
      graphqlType,
      fragmentText: f,
      parsedFragment: fragmentDefinition,
    }
  })), f=>f.fragmentName);
  return allFragmentsInSource;
}

function getFragmentDefinitionInGraphQL(parsedGraphQL: DocumentNode): FragmentDefinitionNode {
  const fragmentDefinition = parsedGraphQL.definitions.find(
    def => def.kind === Kind.FRAGMENT_DEFINITION
  );

  if (!fragmentDefinition || fragmentDefinition.kind !== Kind.FRAGMENT_DEFINITION) {
    throw new Error('No fragment definition found in the provided DocumentNode');
  }


  return fragmentDefinition;
}
