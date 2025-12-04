import type { CodegenConfig } from '@graphql-codegen/cli';

const outputPath = "tmp/gql-codegen";

const config: CodegenConfig = {
  overwrite: true,
  schema: "./packages/lesswrong/lib/generated/gqlSchema.gql",
  documents: "./packages/lesswrong/**/*.{ts,tsx}",
  generates: {
    // One object for client-side query return types
    [`${outputPath}/`]: {
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
        inlineFragmentTypes: 'combine',
      },
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
    },
    // One object for everything-else types
    [`${outputPath}/graphqlCodegenTypes.d.ts`]: {
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
