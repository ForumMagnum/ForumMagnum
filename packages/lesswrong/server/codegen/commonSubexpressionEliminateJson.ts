/**
 * Given an array of parsed JSON objects, perform common subexpression
 * elimination, returning an ordered array of definitions and a dictionary of
 * mappings from the original JSON objects' canonical stringification to
 * shorter stringificationss that use the CSE definitions.
 *
 * Objects are grouped by shape, each of which gets an automatically generated
 * constructor. This removes duplication in keys, and, in principle, enables
 * V8's object-layout optimizations to work when they wouldn't otherwise.
 *
 * The main use case for this is generating gq-codegen/grapq.ts, which contains
 * graphql syntax trees which are extremely redundant. In principle it will
 * works for any group of JSON objects with redundancy in them.
 */
export function doJsonCSE(jsonBlobs: any[]): {
  definitions: string[]
  replacements: Record<string,string>
} {
  function walkJsonPostorder(json: any): string[] {
    // Walk a JSON object depth-first stopping at each node which could be a
    // CSE, ie array, object, and string nodes, and return each,
    // JSON-serialized.
    const result: string[] = [];
    function recurse(node: any) {
      if (Array.isArray(node)) {
        for (const item of node) recurse(item);
      } else if (node && typeof node === "object") {
        for (const val of Object.values(node)) recurse(val);
      }
      if (typeof node === "object" || typeof node === "string") {
        result.push(JSON.stringify(node));
      }
    }
    recurse(json);
    return result;
  }
  function walkJsonPreorder(json: any, shouldRecurseOn: (node: string) => boolean) {
    const result: string[] = [];
    function recurse(node: any) {
      const stringifiedNode = JSON.stringify(node);
      if (typeof node === "object" || typeof node === "string") {
        result.push(stringifiedNode);
      }
      if (shouldRecurseOn(stringifiedNode)) {
        if (Array.isArray(node)) {
          for (const item of node) recurse(item);
        } else if (node && typeof node === "object") {
          for (const val of Object.values(node)) recurse(val);
        }
      }
    }
    recurse(json);
    return result;
  }
  function applySubstitutions(json: any, exprNames: Record<string,string>, objectShapes: Record<string,string>, skipRoot=false): string {
    // Given a parsed JSON object and a set of CSEs to use, return a serialized
    // object which uses those CSEs
    const stringified = JSON.stringify(json);
    if (!skipRoot && exprNames[stringified]) {
      return exprNames[stringified];
    } else if (Array.isArray(json)) {
      return `[${json.map(el => applySubstitutions(el, exprNames, objectShapes)).join(",")}]`;
    } else if (json && typeof json === 'object') {
      const objectShape = JSON.stringify(Object.keys(json));
      if (objectShape in objectShapes) {
        return `${objectShapes[objectShape]}(${Object.values(json).map(v => applySubstitutions(v, exprNames, objectShapes)).join(",")})`;
      } else {
        return `{${Object.entries(json).map(([k,v]) =>
          `${JSON.stringify(k)}:${applySubstitutions(v, exprNames, objectShapes)}`
        )}}`;
      }
    } else {
      return stringified;
    }
  }

  // Walk each provided JSON document to generate a list of potential CSEs and
  // corresponding use counts. Walk depth first, and store use counts in an
  // ordered array, so that when we iterate over useCounts the result is
  // topologically sorted.
  const useCounts: Record<string,number> = {};
  for (const json of jsonBlobs) {
    for (const subexpression of walkJsonPostorder(json)) {
      if (subexpression in useCounts) {
        useCounts[subexpression]++;
      } else {
        useCounts[subexpression] = 1;
      }
    }
  }
  
  // Walk the provided JSON documents a second time, in preorder, entering each
  // subexpression only once. This produces a set of use-counts that account
  // for the fact that once a CSE is factored, it doesn't contribute multiple
  // usages to its subexpressions.
  const filteredUseCounts: Record<string,number> = {};
  for (const json of jsonBlobs) {
    walkJsonPreorder(json, expr => {
      if (expr in filteredUseCounts) {
        filteredUseCounts[expr]++;
        return false;
      } else {
        filteredUseCounts[expr] = 1;
        return true;
      }
    });
  }
  
  // Assign a name to each CSE that is used more than once
  const exprNames: Record<string,string> = {};
  let numNamesAssigned = 0;
  for (const [expr,_useCount] of Object.entries(useCounts)) {
    if (filteredUseCounts[expr] > 1) {
      exprNames[expr] = `_${++numNamesAssigned}`;
    }
  }
  
  // For each object shape, define a constructor
  const {shapes: objectShapes, constructors: objectConstructors} = extractObjectShapes(jsonBlobs);

  const replacements: Record<string,string> = {};
  for (const json of jsonBlobs) {
    const substituted = applySubstitutions(json, exprNames, objectShapes, false);
    replacements[JSON.stringify(json)] = substituted;
  }

  return {
    definitions: [
      ...objectConstructors,
      ...Object.entries(exprNames)
        .map(([expr,name]) => `const ${name}=${applySubstitutions(JSON.parse(expr), exprNames, objectShapes, true)}`),
    ],
    replacements,
  };
}

function extractObjectShapes(jsonBlobs: any[]): {
  shapes: Record<string,string>
  constructors: string[],
} {
  let numNamedObjectShapes = 0;
  const shapes: Record<string,string> = {};
  const constructors: string[] = [];

  function recurse(node: any) {
    if (Array.isArray(node)) {
      for (const item of node) recurse(item);
    } else if (typeof node === 'object') {
      const shape = JSON.stringify(Object.keys(node));
      if (!(shape in shapes)) {
        const constructorName = `_o${++numNamedObjectShapes}`;
        shapes[shape] = constructorName;
        const keys = Object.keys(node);
        const constructorArgs = keys.map((_k,i) => `_${i}: any`).join(",");
        const constructorValues = keys.map((k,i) => `${JSON.stringify(k)}:_${i}`).join(",");
        constructors.push(`const ${constructorName} = (${constructorArgs}) => ({${constructorValues}})`);
      }
      for (const val of Object.values(node)) {
        recurse(val);
      }
    }
  }
  for (const json of jsonBlobs) {
    recurse(json);
  }
  return {
    shapes,
    constructors,
  };
}