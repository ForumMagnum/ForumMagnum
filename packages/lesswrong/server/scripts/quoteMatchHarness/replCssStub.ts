/**
 * Register a no-op require handler for .css files so the harness can run
 * under plain ts-node (`yarn repl`). Webpack (app) and next/jest (tests)
 * handle CSS imports in their own contexts; the repl has no loader for them,
 * and the harness's import graph reaches one via `allLexicalNodes`
 * (PageBreakComponent imports its stylesheet).
 *
 * Must be the first import of any harness entry script.
 */
require.extensions[".css"] = () => {};
