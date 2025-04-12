
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "./packages/lesswrong/lib/generated/gqlSchema.gql",
  documents: "./packages/lesswrong/",
  generates: {
    "./packages/lesswrong/lib/generated/gql-codegen/": {
      preset: "client",
      config: {
        scalars: {
          Date: "String|Date",
        },
        avoidOptionals: false,
      },
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      }
    },
    './packages/lesswrong/lib/generated/graphqlCodegenTypes.d.ts': {
      plugins: [
        {
          typescript: {
            avoidOptionals: false,
          }
        }
      ],
      config: {
        fragmentMasking: false,
        inputMaybeValue: 'T | null | undefined',
      }
    }
  }
};

export default config;
