#!/bin/bash

# Use the first argument as the environment, or dev if not provided
yarn repl ${1:-dev} codegen "packages/lesswrong/server/codegen/generateTypes.ts" "generateTypesAndSQLSchema('.')"
