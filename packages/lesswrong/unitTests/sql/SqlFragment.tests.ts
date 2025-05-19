import { SqlFragment, getResolverCollection, extractFragmentDefinitions, topologicalSort } from "@/server/sql/SqlFragment";
import GraphQLJSON from "graphql-type-json";
import type { GraphQLScalarType } from "graphql";

describe("SqlFragment", () => {
  it("can parse field entries", () => {
    const fragment = new SqlFragment('TestFragment', `
      fragment TestFragment on TestCollection {
        _id
        a
      }
    `);
    const entries = fragment.getParsedEntries();
    expect(entries).toStrictEqual({
      _id: {
        type: "field",
        name: "_id",
        args: [],
      },
      a: {
        type: "field",
        name: "a",
        args: [],
      },
    });
  });
  it("can parse spread entries", () => {
    const fragment = new SqlFragment('TestFragment', `
      fragment TestFragment on TestCollection {
        ...SomeOtherFragment
      }

      fragment SomeOtherFragment on TestCollection {
        _id
        a
      }
    `);
    const entries = fragment.getParsedEntries();
    expect(entries).toStrictEqual({
      _id: {
        type: "field",
        name: "_id",
        args: [],
      },
      a: {
        type: "field",
        name: "a",
        args: [],
      },
    });
  });
  it("can parse pick entries without args", () => {
    const fragment = new SqlFragment('TestFragment', `
      fragment TestFragment on TestCollection {
        a {
          _id
        }
      }
    `);
    const entries = fragment.getParsedEntries();
    expect(entries).toStrictEqual({
      a: {
        type: "pick",
        name: "a",
        args: [],
        entries: {
          _id: {
            type: "field",
            name: "_id",
            args: [],
          },
        },
      },
    });
  });
  it("can parse pick entries with args", () => {
    const fragment = new SqlFragment('TestFragment', `
      fragment TestFragment on TestCollection {
        a(arg0out: $arg0in, arg1out: $arg1in) {
          _id
        }
      }
    `);
    const entries = fragment.getParsedEntries();
    expect(entries).toStrictEqual({
      a: {
        type: "pick",
        name: "a",
        args: [
          {
            inName: "arg0in",
            outName: "arg0out",
          },
          {
            inName: "arg1in",
            outName: "arg1out",
          },
        ],
        entries: {
          _id: {
            type: "field",
            name: "_id",
            args: [],
          },
        },
      },
    });
  });
});

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

describe('extractFragmentDefinitions', () => {
  it('should extract a single basic fragment', () => {
    const fragmentSrc = `
      fragment BasicFragment on Post {
        id
        title
      }
    `;
    const expected = {
      BasicFragment: `fragment BasicFragment on Post {\n        id\n        title\n      }`,
    };
    expect(extractFragmentDefinitions(fragmentSrc)).toEqual(expected);
  });

  it('should extract multiple fragments', () => {
    const fragmentSrc = `
      fragment FirstFragment on User {
        id
        username
      }

      fragment SecondFragment on Post {
        title
        author {
          ...FirstFragment
        }
      }
    `;
    const expected = {
      FirstFragment: `fragment FirstFragment on User {\n        id\n        username\n      }`,
      SecondFragment: `fragment SecondFragment on Post {\n        title\n        author {\n          ...FirstFragment\n        }\n      }`,
    };
    expect(extractFragmentDefinitions(fragmentSrc)).toEqual(expected);
  });

  it('should handle nested fields correctly', () => {
    const fragmentSrc = `
      fragment NestedFragment on Comment {
        id
        text
        author {
          id
          profile {
            displayName
          }
        }
      }
    `;
    const expected = {
      NestedFragment: `fragment NestedFragment on Comment {\n        id\n        text\n        author {\n          id\n          profile {\n            displayName\n          }\n        }\n      }`,
    };
    expect(extractFragmentDefinitions(fragmentSrc)).toEqual(expected);
  });
});

describe('topologicalSort', () => {
  it('should return an empty array for empty input', () => {
    expect(topologicalSort({})).toEqual([]);
  });

  it('should handle fragments with no dependencies', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { field1 }',
      FragB: 'fragment FragB on TypeB { field2 }',
    };
    // Order doesn't strictly matter here, but the structure should be correct
    const result = topologicalSort(fragments);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(['FragA', []]);
    expect(result).toContainEqual(['FragB', []]);
  });

  it('should sort fragments based on simple dependency', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { ...FragB }',
      FragB: 'fragment FragB on TypeB { field }',
    };
    const expected = [
      ['FragB', []],
      ['FragA', ['FragB']],
    ];
    expect(topologicalSort(fragments)).toEqual(expected);
  });

  it('should handle chain dependencies', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { ...FragB }',
      FragB: 'fragment FragB on TypeB { ...FragC }',
      FragC: 'fragment FragC on TypeC { field }',
    };
    const expected = [
      ['FragC', []],
      ['FragB', ['FragC']],
      ['FragA', ['FragB']],
    ];
    expect(topologicalSort(fragments)).toEqual(expected);
  });

  it('should handle multiple dependencies', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { ...FragB ...FragC }',
      FragB: 'fragment FragB on TypeB { fieldB }',
      FragC: 'fragment FragC on TypeC { fieldC }',
    };
    const result = topologicalSort(fragments);
    expect(result).toHaveLength(3);
    // FragB and FragC must come before FragA
    expect(result[2]).toEqual(['FragA', ['FragB', 'FragC']]);
    expect(result.slice(0, 2)).toContainEqual(['FragB', []]);
    expect(result.slice(0, 2)).toContainEqual(['FragC', []]);
  });

   it('should handle shared dependencies', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { ...FragC }',
      FragB: 'fragment FragB on TypeB { ...FragC }',
      FragC: 'fragment FragC on TypeC { field }',
    };
    const result = topologicalSort(fragments);
     expect(result).toHaveLength(3);
     // FragC must come first
     expect(result[0]).toEqual(['FragC', []]);
     expect(result.slice(1)).toContainEqual(['FragA', ['FragC']]);
     expect(result.slice(1)).toContainEqual(['FragB', ['FragC']]);
  });

  it('should ignore dependencies not present in the input map', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { ...FragB ...NonExistentFrag }',
      FragB: 'fragment FragB on TypeB { field }',
    };
    const expected = [
      ['FragB', []],
      ['FragA', ['FragB']], // NonExistentFrag is ignored
    ];
    expect(topologicalSort(fragments)).toEqual(expected);
  });

  it('should detect and throw error for direct circular dependencies', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { ...FragB }',
      FragB: 'fragment FragB on TypeB { ...FragA }',
    };
    expect(() => topologicalSort(fragments)).toThrow(/Circular dependency detected/);
  });

  it('should detect and throw error for indirect circular dependencies', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { ...FragB }',
      FragB: 'fragment FragB on TypeB { ...FragC }',
      FragC: 'fragment FragC on TypeC { ...FragA }',
    };
    expect(() => topologicalSort(fragments)).toThrow(/Circular dependency detected/);
  });

   it('should handle a more complex dependency graph', () => {
    const fragments = {
      FragA: 'fragment FragA on TypeA { ...FragB ...FragC }',
      FragB: 'fragment FragB on TypeB { ...FragD }',
      FragC: 'fragment FragC on TypeC { ...FragD ...FragE }',
      FragD: 'fragment FragD on TypeD { fieldD }',
      FragE: 'fragment FragE on TypeE { fieldE }',
    };
    const result = topologicalSort(fragments);
    expect(result).toHaveLength(5);

    // Check dependencies are listed correctly
    const resultMap = new Map(result);
    expect(resultMap.get('FragA')).toEqual(['FragB', 'FragC']);
    expect(resultMap.get('FragB')).toEqual(['FragD']);
    expect(resultMap.get('FragC')).toEqual(['FragD', 'FragE']);
    expect(resultMap.get('FragD')).toEqual([]);
    expect(resultMap.get('FragE')).toEqual([]);

    // Check order (D and E must come before B and C, which must come before A)
    const getIndex = (name: string) => result.findIndex(item => item[0] === name);
    expect(getIndex('FragD')).toBeLessThan(getIndex('FragB'));
    expect(getIndex('FragD')).toBeLessThan(getIndex('FragC'));
    expect(getIndex('FragE')).toBeLessThan(getIndex('FragC'));
    expect(getIndex('FragB')).toBeLessThan(getIndex('FragA'));
    expect(getIndex('FragC')).toBeLessThan(getIndex('FragA'));
  });
});
