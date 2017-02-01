# Getting started on LessWrong 2.0

### First steps

1. Go through the [nova architecture documentation](http://nova-docs.telescopeapp.org/architecture.html)
2. Read [customizing and extending nova](http://nova-docs.telescopeapp.org/tutorial-customizing.html)
3. Understand [components and theming](http://nova-docs.telescopeapp.org/theming.html)
4. Understand the [data layer](http://nova-docs.telescopeapp.org/data-layer.html)
5. Go through the [learning GraphQL tutorial](https://learngraphql.com/)

### Understanding the nova package system

In a Nova application, each package is a _standalone feature_ which provides some functionality to the site, and can be toggled on or off. Nova packages have the following properties:

* conceptual (e.g. "posts", "votes"), rather than semantic (e.g. "homepage"), organization
* the app works whether a given non-core package is toggled on or off. For example, if I disable upvoting functionality, the page should load as usual, except the posts will not have upvoting buttons.
* can be toggled on/off by importing the package in the parent feature's "package.js" file

#### Package directory structure

A basic package looks like this:

```
.
├── package.js -- sets the package name and version, and defines the set of other packages imported by your package
└── lib -- the core functionality of your package
|   └── containers -- higher-order-components which give access to some data (e.g. the current user) in the props of a wrapped component
|       └── ...
|   ├── server -- contains routing information
|       └── ...
|   ├── collection.js -- GraphQL collection (e.g. Users or Posts) which is where all instances of your package's data model (e.g. User) will be accessible
|   ├── fragments.js -- some reusable GraphQL queries for convenience
|   ├── mutations.js -- GraphQL mutators for your collection (new, edit, remove)
|   ├── permissions.js -- permissions for accessing data from the GraphQL collection
|   ├── resolvers.js -- GraphQL resolvers for your collection (list, single, total)
|   ├── schema.js -- GraphQL schema for your package's feature (e.g. fields of a User)
|   └── server.js -- re-exports files in server/*
```
You'll notice some packages are missing some of the above or have additional files. Do not worry, this simply means the package does not require that functionality (e.g. some features don't define new data to store). Also, string searches for specific functions are your friend here.

#### Idioms of working with nova

> Never edit the `nova-*` packages

This is suggested in the nova docs, and for good reason: many other packages will depend on (and mutate) functionality present in the core packages. You'll have no idea what you could be breaking when modifying core packages which are upstream of all other logic in the app. 

> Use the `lw-*` naming convention for any new packages, and only edit `lw-*` packages.

Self-explanatory.

> When adding functionality, favor adding new packages over editing existing ones

1. This is consistent with the idiom of "package == toggleable feature"
2. As your package graph becomes more involved, it becomes easier to introduce breaking changes by editing packages, as other packages likely depend on / mutate them. 

Instead, add a new package which, when toggled, adds some functionality to some set of old one(s). An example of this is the upvoting feature (nova-voting package), which adds upvote fields to the Post and User data models (see nova-voting/lib/custom_fields.js). If you disabled this package, Post and User would continue functioning normally, which would not be the case had you edited those packages directly to add the feature.

> When bugfixing / replacing functionality, favor editing existing packages over adding new ones

This is simple: if a bugfix should be made to a package, make it within that package so that any dependent packages also benefit from the fix. 

If replacing functionality, note that the order in which you load packages will determine which package takes precedence. This can produce difficult-to-trace bugs when you replace a feature but the change simply doesn't show up. Thus, heavily favor editing the source package over using functions like `replaceComponent`. 

This rule does not apply to the nova packages.

> Locate functionality by performing string searches in your editor

This is far faster than trying to determine whether something is e.g. in the `Posts` package or the `Voting` package, due to nova's feature-based package structure. In sublime, just add the "packages" subdirectory to your search path (Ctrl+Shift+F).

### JS development tips

#### Iteration
* Prefer `_.range(n).forEach(i => my_function())` over `for (var i=0; i<n; i++)...`
* If the body of a for loop performs a stateful action (i.e. modifies a variable outside the scope of the for body), use `forEach`. Else, use `map`. 
* Use underscore.js when possible.

#### Style guide

* [Syntax rules](https://github.com/Khan/style-guides/blob/master/style/javascript.md#syntax)
* [Comments and documentation](https://github.com/Khan/style-guides/blob/master/style/javascript.md#comments-and-documentation) 
* [ES6 rules](https://github.com/Khan/style-guides/blob/master/style/javascript.md#es67-rules)

#### Debugging

* Use google chrome. Its debugging tools are superior.
* Use 'debugger' in code. Then Ctrl+Shift+J on your open page, and you can interactively step through the breakpoint. You can also interact with variables in scope at each step using the console at the bottom. 
* Use `console.warn(variable)` when you want to see the stacktrace of `variable`
* Add the [react dev tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) extension to chrome, and switch to the "React" tab after pressing Ctrl+Shift+J. You can see the react component tree. Once you click on a component in the tree, you will have access to it in the console as the variable `$r`. For example, you can check the props or state using `$r.props` or `$r.state`.
* If you think a previous commit broke your feature, use [git's builtin debugging tools](https://git-scm.com/book/en/v2/Git-Tools-Debugging-with-Git)
* If you fix a bug, **write a test for it**

### Troubleshooting 

> My files aren't reloading

`rm -rf .meteor/local`, then re-run `meteor`

> `meteor` becomes stuck at "App loading"

`meteor reset`, then re-run `meteor`. This will clear your local mongo database.

> Help! I have an unknown issue

Join the [Telescope slack](http://slack.telescopeapp.org/) and ask specific questions there.
