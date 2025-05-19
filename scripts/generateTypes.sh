#!/bin/bash

yarn repl dev $1 codegen "packages/lesswrong/server/codegen/generateTypes.ts" "generateTypesAndSQLSchema('.')"
