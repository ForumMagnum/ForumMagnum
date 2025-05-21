import { pascalCase } from 'change-case';
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "./packages/lesswrong/lib/generated/gqlSchema.gql",
  documents: "./packages/lesswrong/",
  generates: {
    // One object for client-side query return types
    "./packages/lesswrong/lib/generated/gql-codegen/": {
      preset: "client",
      plugins: [{ add: { content: '// @ts-nocheck' } }],
      config: {
        scalars: {
          Date: {
            input: 'Date',
            output: 'string',
          },
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
        extractAllFieldsToTypes: true,
      },
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
    },
    // One object for everything-else types
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
        extractAllFieldsToTypes: true,
      }
    },
  },
};

export default config;
