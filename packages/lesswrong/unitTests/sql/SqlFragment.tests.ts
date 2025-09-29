import { getResolverCollection, createSqlFragmentFromAst, topologicalSortAst } from "@/server/sql/SqlFragment";
import gql from "graphql-tag";
import { DocumentNode, Kind, type FragmentDefinitionNode, type GraphQLScalarType } from "graphql";
import GraphQLJSON from "@/lib/vendor/graphql-type-json";

describe('getResolverCollection', () => {
  const createResolver = (type: string | GraphQLScalarType) => ({
    fieldName: 'testField',
    type,
    resolver: () => {},
  });

  const testCases = [
    { type: 'JargonTerm', description: 'nullable type' },
    { type: 'JargonTerm!', description: 'non-nullable type' },
    { type: '[JargonTerm]', description: 'nullable array of nullable type' },
    { type: '[JargonTerm]!', description: 'non-nullable array of nullable type' },
    { type: '[JargonTerm!]', description: 'nullable array of non-nullable type' },
    { type: '[JargonTerm!]!', description: 'non-nullable array of non-nullable type' },
  ];

  testCases.forEach(({ type, description }) => {
    it(`should correctly handle ${description}: ${type}`, () => {
      const resolver = createResolver(type);
      expect(() => getResolverCollection(resolver)).not.toThrow();
    });
  });

  it('should throw an error for scalar types', () => {
    const resolver = createResolver(GraphQLJSON);
    expect(() => getResolverCollection(resolver)).toThrow('Resolver "testField" has a scalar type');
  });

  it('should throw an error for invalid type names', () => {
    const resolver = createResolver('InvalidTypeName');
    expect(() => getResolverCollection(resolver)).toThrow('Invalid typeName: InvalidTypeName');
  });
});

const getFragmentDefs = (...docs: DocumentNode[]): FragmentDefinitionNode[] => {
  return docs.flatMap(doc => doc.definitions).filter(def => def.kind === Kind.FRAGMENT_DEFINITION);
};

describe("createSqlFragmentFromAst", () => {
  describe("parsing entries", () => {
    const fieldEntriesDoc = gql`
      fragment TestFragment on TestCollection {
        _id
        a
      }
    `;

    const spreadEntriesDoc = gql`
      fragment TestFragment on TestCollection {
        ...SomeOtherFragment
      }
    `;

    const someOtherFragmentDoc = gql`
      fragment SomeOtherFragment on TestCollection {
        _id
        a
      }
    `;

    const pickWithoutArgsDoc = gql`
      fragment TestFragment on TestCollection {
        a {
          _id
        }
      }
    `;

    const pickWithArgsDoc = gql`
      fragment TestFragment on TestCollection {
        a(arg0out: $arg0in, arg1out: $arg1in) {
          _id
        }
      }
    `;

    it("can parse field entries", () => {
      const frags = getFragmentDefs(fieldEntriesDoc);
      const fragment = createSqlFragmentFromAst("TestFragment", frags);
      const entries = fragment.parsedEntries;
      expect(entries).toStrictEqual({
        _id: { type: "field", name: "_id", args: [] },
        a: { type: "field", name: "a", args: [] },
      });
    });

    it("can parse spread entries", () => {
      const frags = getFragmentDefs(spreadEntriesDoc, someOtherFragmentDoc);
      const fragment = createSqlFragmentFromAst("TestFragment", frags);
      const entries = fragment.parsedEntries;
      expect(entries).toStrictEqual({
        _id: { type: "field", name: "_id", args: [] },
        a: { type: "field", name: "a", args: [] },
      });
    });

    it("can parse pick entries without args", () => {
      const frags = getFragmentDefs(pickWithoutArgsDoc);
      const fragment = createSqlFragmentFromAst("TestFragment", frags);
      const entries = fragment.parsedEntries;
      expect(entries).toStrictEqual({
        a: {
          type: "pick",
          name: "a",
          args: [],
          entries: {
            _id: { type: "field", name: "_id", args: [] },
          },
        },
      });
    });

    it("can parse pick entries with args", () => {
      const frags = getFragmentDefs(pickWithArgsDoc);
      const fragment = createSqlFragmentFromAst("TestFragment", frags);
      const entries = fragment.parsedEntries;
      expect(entries).toStrictEqual({
        a: {
          type: "pick",
          name: "a",
          args: [
            { inName: "arg0in", outName: "arg0out" },
            { inName: "arg1in", outName: "arg1out" },
          ],
          entries: {
            _id: { type: "field", name: "_id", args: [] },
          },
        },
      });
    });
  });
});

describe('topologicalSortAst', () => {
  const getFragmentDefs = (...docs: DocumentNode[]): FragmentDefinitionNode[] => {
    return docs.flatMap(doc => doc.definitions).filter(def => def.kind === Kind.FRAGMENT_DEFINITION) as FragmentDefinitionNode[];
  };

  const toMap = (defs: FragmentDefinitionNode[]) => Object.fromEntries(defs.map(d => [d.name.value, d]));

  it('should return an empty array for empty input', () => {
    expect(topologicalSortAst({})).toEqual([]);
  });

  it('should handle fragments with no dependencies', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { field1 }`,
      gql`fragment FragB on TypeB { field2 }`,
    );
    const result = topologicalSortAst(toMap(defs));
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(['FragA', []]);
    expect(result).toContainEqual(['FragB', []]);
  });

  it('should sort fragments based on simple dependency', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { ...FragB }`,
      gql`fragment FragB on TypeB { field }`,
    );
    const expected = [
      ['FragB', []],
      ['FragA', ['FragB']],
    ];
    expect(topologicalSortAst(toMap(defs))).toEqual(expected);
  });

  it('should handle chain dependencies', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { ...FragB }`,
      gql`fragment FragB on TypeB { ...FragC }`,
      gql`fragment FragC on TypeC { field }`,
    );
    const expected = [
      ['FragC', []],
      ['FragB', ['FragC']],
      ['FragA', ['FragB']],
    ];
    expect(topologicalSortAst(toMap(defs))).toEqual(expected);
  });

  it('should handle multiple dependencies', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { ...FragB ...FragC }`,
      gql`fragment FragB on TypeB { fieldB }`,
      gql`fragment FragC on TypeC { fieldC }`,
    );
    const result = topologicalSortAst(toMap(defs));
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual(['FragA', ['FragB', 'FragC']]);
    expect(result.slice(0, 2)).toContainEqual(['FragB', []]);
    expect(result.slice(0, 2)).toContainEqual(['FragC', []]);
  });

  it('should handle shared dependencies', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { ...FragC }`,
      gql`fragment FragB on TypeB { ...FragC }`,
      gql`fragment FragC on TypeC { field }`,
    );
    const result = topologicalSortAst(toMap(defs));
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(['FragC', []]);
    expect(result.slice(1)).toContainEqual(['FragA', ['FragC']]);
    expect(result.slice(1)).toContainEqual(['FragB', ['FragC']]);
  });

  it('should ignore dependencies not present in the input map', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { ...FragB ...NonExistentFrag }`,
      gql`fragment FragB on TypeB { field }`,
    );
    const expected = [
      ['FragB', []],
      ['FragA', ['FragB']],
    ];
    expect(topologicalSortAst(toMap(defs))).toEqual(expected);
  });

  it('should detect and throw error for direct circular dependencies', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { ...FragB }`,
      gql`fragment FragB on TypeB { ...FragA }`,
    );
    expect(() => topologicalSortAst(toMap(defs))).toThrow(/Circular dependency detected/);
  });

  it('should detect and throw error for indirect circular dependencies', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { ...FragB }`,
      gql`fragment FragB on TypeB { ...FragC }`,
      gql`fragment FragC on TypeC { ...FragA }`,
    );
    expect(() => topologicalSortAst(toMap(defs))).toThrow(/Circular dependency detected/);
  });

  it('should handle a more complex dependency graph', () => {
    const defs = getFragmentDefs(
      gql`fragment FragA on TypeA { ...FragB ...FragC }`,
      gql`fragment FragB on TypeB { ...FragD }`,
      gql`fragment FragC on TypeC { ...FragD ...FragE }`,
      gql`fragment FragD on TypeD { fieldD }`,
      gql`fragment FragE on TypeE { fieldE }`,
    );
    const result = topologicalSortAst(toMap(defs));
    expect(result).toHaveLength(5);
    const resultMap = new Map(result);
    expect(resultMap.get('FragA')).toEqual(['FragB', 'FragC']);
    expect(resultMap.get('FragB')).toEqual(['FragD']);
    expect(resultMap.get('FragC')).toEqual(['FragD', 'FragE']);
    expect(resultMap.get('FragD')).toEqual([]);
    expect(resultMap.get('FragE')).toEqual([]);

    const getIndex = (name: string) => result.findIndex(item => item[0] === name);
    expect(getIndex('FragD')).toBeLessThan(getIndex('FragB'));
    expect(getIndex('FragD')).toBeLessThan(getIndex('FragC'));
    expect(getIndex('FragE')).toBeLessThan(getIndex('FragC'));
    expect(getIndex('FragB')).toBeLessThan(getIndex('FragA'));
    expect(getIndex('FragC')).toBeLessThan(getIndex('FragA'));
  });
});
