import SqlFragment, { getResolverCollection } from "@/server/sql/SqlFragment";
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
