module.exports = {
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",

    // Uncomment to enable cycle-detection. Note that caching doesn't seem to
    // work quite right with this plugin; after fixing some issues, you will
    // have to delete .eslintcache to make it stop reporting the error.
    // Commented out because there are immport cycles that haven't been resolved
    // yet.
    "plugin:import/typescript"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "allowImportExportEverywhere": true,
    "ecmaVersion": 6,
    "sourceType": "module",
    "tsconfigRootDir": "lesswrong2",
    "project": "./tsconfig.json",
  },
  "rules": {
    "babel/generator-star-spacing": 0,
    
    // A function with a name starting with an uppercase letter should only be
    // used as a constructor
    "babel/new-cap": [1, {
      "capIsNewExceptions": [
        "Optional",
        "OneOf",
        "Maybe",
        "MailChimpAPI",
        "Juice",
        "Run",
        "AppComposer",
        "Query",
        "Map",
        "List"
      ]
    }],
    "babel/array-bracket-spacing": 0,
    "babel/object-curly-spacing": 0,
    "babel/object-shorthand": 0,
    "babel/arrow-parens": 0,
    "eol-last": 1,
    "no-await-in-loop": 0,
    "comma-dangle": 0,
    "key-spacing": 0,
    "no-extra-boolean-cast": 0,
    "no-undef": 1,
    "no-unused-vars": [1, {
      "vars": "all",
      "args": "none",
      "varsIgnorePattern": "React|PropTypes|Component"
    }],
    "no-console": 1,
    "no-template-curly-in-string": 1,
    "no-tabs": 1,
    "no-extend-native": 1,
    "react/prop-types": 0,
    "react/jsx-equals-spacing": 1,
    "react/jsx-pascal-case": 1,
    "react/jsx-child-element-spacing": 1,
    "no-case-declarations": 0,
    "react/no-unescaped-entities": 0,
    "react/display-name": 0,
    "react/jsx-no-comment-textnodes": 1,
    "no-mixed-operators": 1,
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "import/no-unresolved": 1,
    "import/named": 1,
    "import/default": 1,
    "import/namespace": 1,
    "import/no-dynamic-require": 1,
    "import/no-self-import": 1,
    "import/export": 1,
    "import/no-named-as-default-member": 1,
    "import/no-deprecated": 1,
    "import/no-extraneous-dependencies": 0,
    "import/no-duplicates": 1,
    "import/extensions": 0,
    "import/no-cycle": 1,
    "import/no-mutable-exports": 1,
    "no-restricted-imports": ["error", {"paths": [
      { name: "lodash", message: "Don't import all of lodash, import a specific lodash function, eg lodash/sumBy" },
      { name: "@material-ui", message: "Don't import all of material-ui/icons" },
      { name: "@material-ui/core", message: "Don't import all of material-ui/core" },
      { name: "@material-ui/core/colors", message: "Don't use material-ui/core/colors, use the theme palette" },
      { name: "@material-ui/icons", message: "Don't import all of material-ui/icons" },
      { name: "@material-ui/core/Hidden", message: "Don't use material-UI's Hidden component, it's subtly broken; use breapoints and JSS styles instead" },
      { name: "@material-ui/core/Typography", message: "Don't use material-UI's Typography component; use Components.LWTypography or JSS styles" },
      { name: "@material-ui/core/Dialog", message: "Don't use material-UI's Dialog component directly, use LWDialog instead" },
      { name: "@material-ui/core/Popper", importNames: ["Popper"], message: "Don't use material-UI's Popper component directly, use LWPopper instead" },
      { name: "react-router", message: "Don't import react-router, use lib/reactRouterWrapper" },
      { name: "react-router-dom", message: "Don't import react-router-dom, use lib/reactRouterWrapper" },
    ],
    patterns: [
      "@material-ui/core/colors/*"
    ]}],

    // Warn on missing await
    // The ignoreVoid option makes it so that
    //   void someAwaitableFunction()
    // can be used as a way of marking a function as deliberately not-awaited.
    "@typescript-eslint/no-floating-promises": [1, {
      ignoreVoid: true
    }],

    // Like no-implicit-any, but specifically for things that are exported. Turn
    // on some day, but not yet.
    "@typescript-eslint/explicit-module-boundary-types": 0,

    // Allow @ts-ignore
    "@typescript-eslint/ban-ts-comment": 0,

    // explicit-function-return-type: Disabled. Would forbid functions with
    // undeclared return type.
    "@typescript-eslint/explicit-function-return-type": 0,
    
    // no-use-before-define: Disabled. This would require all function calls to
    // be below their definition in files, which there's no good reason for.
    "@typescript-eslint/no-use-before-define": 0,
    
    // prefer-const: Disabled. Would forbit declaring a variable as mutable
    // (with let) when it could have been immutable (with const).
    "prefer-const": 0,
    
    // no-var: Disabled. Would forbid declaring a variable with "var" (as
    // opposed to let or const).
    "no-var": 0,
    
    // ban-ts-ignore: Disabled. Would forbid use of @ts-ignore, which suppresses
    // type-checking errors.
    "@typescript-eslint/ban-ts-ignore": 0,
    
    // no-non-null-assertion: Currently disabled, may enable later. Forbids use
    // of "somevar!" to coerce somevar from Type|null to Type.
    "@typescript-eslint/no-non-null-assertion": 0,
    
    // no-empty-interface: Disabled. Would forbid interfaces with no members
    // (ie, interfaces defined solely by other interfaces that they extend).
    "@typescript-eslint/no-empty-interface": 0,
    
    // member-delimiter-style: Disabled. Would make semicolons between
    // interface members non-optional.
    "@typescript-eslint/member-delimiter-style": 0,
    
    // type-annotation-spacing: Disabled. Would enforce spaces around => and
    // after : in type annotations.
    "@typescript-eslint/type-annotation-spacing": 0,
    
    // no-empty-function: Disabled. Would forbid functions with empty bodies.
    "@typescript-eslint/no-empty-function": 0,
    
    // ban-types: Disabled. Would forbid '{}' as a type, which means "any non-
    // nullish value".
    "@typescript-eslint/ban-types": 0,
    
    // prefer-rest-params: Currently disabled. Would forbid use of the `arguments`
    // keyword.
    "prefer-rest-params": 0,
    
    // prefer-spread: Disabled. Would forbid use of fn.apply(foo) as opposed to
    // fn(...foo).
    "prefer-spread": 0,
    
    // no-this-alias. Currently disabled. Would forbid 'const self=this'.
    "@typescript-eslint/no-this-alias": 0,
    
    // class-name-casing: Disabled. Forbids types from deviating from upper-
    // camelcase, which would forbid the naming convention we are using for
    // subfragments.
    "@typescript-eslint/class-name-casing": 0,
    
    // camelcase: Disabled. Would force type and variable names to be camel
    // case.
    "@typescript-eslint/camelcase": 0,
    
    // no-prototype-builtins: Disabled. Would forbid hasOwnProperty.
    "no-prototype-builtins": 0,
    
    // no-extra-semi: Disabled. Would forbid semicolons after class declarations
    "no-extra-semi": 0,
    "@typescript-eslint/no-extra-semi": 0,
    
    // no-var-requires: Disabled. Would forbid use of require() statements of
    // libraries from node_modules.
    "@typescript-eslint/no-var-requires": 0,
    
    // no-undef: Currently disabled due to excessive false positives which are
    // hard to resolve (in particular, the `registerComponent` idiom generates
    // a false positive). If something were truly undefined, it would generate
    // an error in `npm run checktypes`, which does not have this issue.
    "no-undef": 0,
    
    // no-explicit-any: Some day, we may be ready to turn on this rule. That day
    // is not today. Activating this would require *everything* be fully typed,
    // including interface points with libraries that might not have type
    // annotations available.
    "@typescript-eslint/no-explicit-any": 0,
    
    // no-unused-vars: Currently disabled due to excessive false positives which
    // are hard to resolve (this counts things as unused when they actually are
    // used, if the usage is as a type rather than as a value.)
    "no-unused-vars": 0,
    "@typescript-eslint/no-unused-vars": 0,
  },
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "plugins": [
    "@typescript-eslint",
    "babel",
    "react",
    "react-hooks",
    "import"
  ],
  "settings": {
    "import/core-modules": [
      "sinon",
      "sinon-chai",
      "chai-enzyme",
    ],
    "react": {
      "version": "16.4.1"
    }
  },
  "root": true,
  "globals": {
    "param": true,
    "returns": true,
    "describe": true,
    "it": true,
    "before": true,
    "after": true,
    "beforeEach": true,
    "afterEach": true
  },
  "ignorePatterns": [
    "build.js",
    // You wouldn't have thought this was necessary would you
    ".eslintrc.js"
  ]
}
