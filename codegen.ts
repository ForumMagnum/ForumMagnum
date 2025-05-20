import { pascalCase } from 'change-case';
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "./packages/lesswrong/lib/generated/gqlSchema.gql",
  documents: "./packages/lesswrong/",
  generates: {
    // One object for client
    "./packages/lesswrong/lib/generated/gql-codegen/": {
      preset: "client",
      config: {
        scalars: {
          Date: {
            input: 'Date',
            output: 'string',
          }
        },
        avoidOptionals: {
          inputValue: false,
          field: true,
          object: false,
          defaultValue: true,
          resolvers: true,
          query: true,
          mutation: true,
          subscription: true,
        },
        namingConvention: (s: string) => s.replace("Fragment", ""),
        enumsAsTypes: true,
      },
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
    },
    // One object for server
    './packages/lesswrong/lib/generated/graphqlCodegenTypes.d.ts': {
      plugins: [
        {
          typescript: {
            scalars: {
              Date: {
                input: 'Date',
                output: 'string',
              }
            }
          }
        }, {
          'typescript-operations': {
            scalars: {
              Date: {
                input: 'Date',
                output: 'string',
              }
            },
            avoidOptionals: {
              inputValue: false,
              field: true,
              object: true,
              defaultValue: true,
              resolvers: true,
              query: true,
              mutation: true,
              subscription: true,
            },
          }
        }
      ],
      config: {
        fragmentMasking: false,
        inputMaybeValue: 'T | null | undefined',
        namingConvention: (s: string) => s.replace("Fragment", ""),
        enumsAsTypes: true,
        inlineFragmentTypes: 'combine',
        noExport: true,
      }
    },
    "./client-schema.json": {
      plugins: ["introspection"],
      documents: ["./packages/lesswrong/lib/generated/gqlSchema.gql"],
      config: {
        minify: true,
        descriptions: false,
        schemaDescription: false,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ["node ./prune-schema.js > prune_stdout.log 2> prune_stderr.log"]
  }
};

export default config;
