#!/bin/bash

# Use the first argument as the forumType, and the second as the environment, or dev if not provided
yarn repl ${1:-dev} ${2:-lw} codegen "packages/lesswrong/server/codegen/generateTypes.ts" "generateTypesAndSQLSchema('.')"
