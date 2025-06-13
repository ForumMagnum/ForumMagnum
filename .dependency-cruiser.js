module.exports = {
  options: {
    // Exclude node_modules from analysis
    doNotFollow: {
      path: "node_modules"
    },
    // Include TypeScript and JavaScript files
    includeOnly: "^(app|packages)",
    // File extensions to process
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "./tsconfig.json"
    },
    // Output format options
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
        theme: {
          graph: {
            splines: "ortho"
          }
        }
      },
      text: {
        highlightFocused: true
      }
    }
  },
  
  forbidden: [
    {
      name: "no-graphql-to-components",
      severity: "error",
      comment: "Code in app/graphql should not import from packages/lesswrong/components, even indirectly",
      from: {
        path: "^app/graphql"
      },
      to: {
        path: "^packages/lesswrong/components",
        // This will catch both direct and transitive dependencies
        reachable: true
      }
    },
  ],
  
  // You can define allowed dependencies here if needed
  allowed: [
    {
      from: {},
      to: {}
    }
  ]
}; 