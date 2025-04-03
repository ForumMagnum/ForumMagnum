import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import keyBy from 'lodash/keyBy';
import { extractFragmentName } from '@/lib/fragments/fragmentWrapper';
import gql from 'graphql-tag';
import { type DocumentNode, type DefinitionNode, Kind, FragmentDefinitionNode } from 'graphql';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { generateDefaultFragments } from './generateDefaultFragments';


function findFragmentsIn(srcDir: string, functionToFind: string): string[] {
  const tsFiles = getAllTypeScriptFilesIn(srcDir);
  const program = ts.createProgram(tsFiles, {});
  const fragmentStrings: string[] = [];
  
  for (const sourceFile of program.getSourceFiles()) {
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
      ) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function findFragmentsInFile(
  sourceFile: ts.SourceFile,
  functionToFind: string,
): string[] {
  let fragments: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isTaggedTemplateExpression(node)) {
      if (node.tag.getText(sourceFile) === functionToFind) {
        const template = node.template;
        // Add the fragment to `fragments`. Replace each expression interpolated into the template string with its text, preceded by "...".
        if (ts.isTemplateExpression(template)) {
          let fragment = template.head.text;
          
          for (const span of template.templateSpans) {
            // Add the expression text preceded by "..."
            fragment += `...${span.expression.getText(sourceFile)}${span.literal.text}`;
          }
          
          fragments.push(fragment);
        } else if (ts.isNoSubstitutionTemplateLiteral(template)) {
          // Handle simple template literals with no substitutions
          fragments.push(template.text);
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

export function findFragmentsInSource(): FragmentsFromSource {
  const foundFragmentStrings = findFragmentsIn("packages/lesswrong", "frag");
  const defaultFragmentStrings = generateDefaultFragments();
  const fragmentStrings = [
    ...foundFragmentStrings,
    ...defaultFragmentStrings,
  ];

  const result = keyBy(filterNonnull(fragmentStrings.map(f => {
    let parsedFragment: DocumentNode;
    try {
      parsedFragment = gql(f);
    } catch {
      // eslint-disable-next-line no-console
      console.error(`Error parsing fragment: ${f}`);
      return null;
    }
    const fragmentDefinition: FragmentDefinitionNode = getFragmentDefinitionInGraphQL(parsedFragment);
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
  return result;
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
