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
          Date: "string|Date",
        },
        avoidOptionals: false,
        namingConvention: (s: string) => pascalCase(s).replace("Fragment", ""),
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
            avoidOptionals: false,
          }
        }
      ],
      config: {
        fragmentMasking: false,
        inputMaybeValue: 'T | null | undefined',
        namingConvention: (s: string) => pascalCase(s).replace("Fragment", ""),
      }
    }
  }
};

export default config;
