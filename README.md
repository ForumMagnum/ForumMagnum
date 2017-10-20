# What's Lesswrong2?

Lesswrong2 is a clean-slate overhaul of the [lesswrong](http://lesswrong.com) discussion platform. We're hoping that it will replace the current site and become the discourse infrastructure for the rationality community.

The old lesswrong is [famously](http://www.telescopeapp.org/blog/using-telescope-as-a-reddit-alternative/) one of the only successful extensions of the reddit codebase (forked circa 2008). While reddit's code served us as a stable platform while our community was in its initial stages, it has become hard to extend because of its age, complexity and monolithic design.

Lesswrong2 on the other hand is based on [contemporary](http://vulcanjs.org/) [web](https://facebook.github.io/react/) [technologies](http://dev.apollodata.com/) designed to make rapid development much easier. It solves the problems that caused the old codebase to stagnate by being written with tools that are meticulously well-documented. We hope that this will allow us to rapidly improve the site and bring it up to date with what tools for [creating](https://medium.com/) [intellectual](https://www.quora.com/) [progress](https://stackexchange.com/) look like in 2017.

# Technologies

Lesswrong2 is built on top of four major open-source libraries.

1. [Vulcan](http://vulcanjs.org/) is a framework for designing social applications like forums and news aggregators. We use it to handle many facets of the LW2 functionality such as data-loading, authentication and search.

2. [React](https://facebook.github.io/react/) is a user interface programming library developed by Facebook that lets us define interface elements declaratively in the form of components. We use it to define how to render and manage state for all parts of the site.

3. [GraphQL](http://graphql.org/) is a query language for the Mongo datastore. Vulcan mostly deals with GraphQL for us, but occasionally we use it to define APIs for accessing and mutating our data.

4. [Draft](https://draftjs.org/) is a framework developed by Facebook for creating text editors. The content and message editors on Lesswrong2 are implemented on top of Draft.

# Contributing

To get LessWrong2 working on your local machine:

```
git clone https://github.com/Discordius/Lesswrong2.git
cd Lesswrong2
npm install
npm start
```

This should get a server running for most common setups. If you run into any snags, let us know.

## Read the Docs

The best way to get familiar with our stack is to read the Vulcan and GraphQL documentation pages.
1. Read about [Vulcan's architecture](http://docs.vulcanjs.org/architecture.html)
2. Learn how to [customize and extend Vulcan](http://docs.vulcanjs.org/example-customization.html)
3. Understand [components and theming](http://nova-docs.telescopeapp.org/theming.html)
4. Understand [Vulcan's data layer](http://docs.vulcanjs.org/schemas.html)
5. Complete the [GraphQL tutorial](http://graphql.org/learn/)

## Understand the Package System

The Lesswong2 project uses "package" in two different and related ways. In a Vulcan application, each package is a _standalone feature_ which provides some functionality to the site, and can be toggled on or off. All of the features that come with Vulcan out-of-the-box are generally found in the `packages` directory.

In addition to the default Vulcan packages, we've extended the platform with our own packages which are stored in the `packages/lesswrong/lib` directory. All of the features that we've added to Vulcan in order to make it suitable for running lesswrong reside in this directory.

### Vulcan Packages
Vulcan packages have the following properties:

* They are conceptual (e.g. "posts", "votes"), rather than semantic (e.g. "homepage"), organization.
* The app works whether a given non-core package is toggled on or off. For example, if I disable upvoting functionality, the page should load as usual, except the posts will not have upvoting buttons.
* They can be toggled on/off by importing the package in the parent feature's "package.js" file.

Packages usually have a directory structure that looks like this:
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

### Lesswrong2 Packages

Lesswrong2 packages are Vulcan packages, but they have a slightly different default directory structure. Each feature we've extended Vulcan with resides in a top level folder in the `packages/lesswrong/lib` directory. In addition to the package folders, there are these special folders that store cross-cutting aspects of our code.

To create your own package, create a folder named after the concept it's associated with. For example, we currently have folders for `voting`, `messages`, and `subscriptions`. Then place any cross-cutting files in the folders listed below:

```
.
├── collections -- GraphQL collections for each of the modules
├── component-replacements -- Contains React components that replace existing components from various Vulcan packages.
├── modules -- Contains utility files that interact with GraphQL, Apollo or Vulcan that don't really fit anywhere else.
├── stylesheets -- Custom stylesheets for components defined by packages in this directory.
...
├── helpers.js -- Some collections have helper functions which are stored here. These are operations you might want to perform on a collection which aren't just mutations and resolvers.
├── routes.js -- contains routing information.
├── components.js -- contains imports for all of the components corresponding to our packages.
...
```

## Development Tips

### Getting Started

To set up the project, navigate to the project folder in terminal, then run `npm install`. Then run npm start and you should be good to go.

### Iteration
* Prefer `_.range(n).forEach(i => my_function())` over `for (var i=0; i<n; i++)...`
* If the body of a for loop performs a stateful action (i.e. modifies a variable outside the scope of the for body), use `forEach`. Else, use `map`.
* Use underscore.js when possible.

### Style guide

* [Syntax rules](https://github.com/Khan/style-guides/blob/master/style/javascript.md#syntax)
* [Comments and documentation](https://github.com/Khan/style-guides/blob/master/style/javascript.md#comments-and-documentation)
* [ES6 rules](https://github.com/Khan/style-guides/blob/master/style/javascript.md#es67-rules)

### Debugging

* Use google chrome. Its debugging tools are superior.
* Use 'debugger' in code. Then Ctrl+Shift+J on your open page, and you can interactively step through the breakpoint. You can also interact with variables in scope at each step using the console at the bottom.
* Use `console.warn(variable)` when you want to see the stacktrace of `variable`
* Add the [react dev tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) extension to chrome, and switch to the "React" tab after pressing Ctrl+Shift+J. You can see the react component tree. Once you click on a component in the tree, you will have access to it in the console as the variable `$r`. For example, you can check the props or state using `$r.props` or `$r.state`.
* If you think a previous commit broke your feature, use [git's builtin debugging tools](https://git-scm.com/book/en/v2/Git-Tools-Debugging-with-Git)
* If you fix a bug, **write a test for it**.

## Creating a user ##

In the future, it will be possible to create a user using the website itself, but for now they must be created manually in the meteor shell.

```
meteor shell
Accounts.createUser({username:'<USERNAME>', email:'<EMAIL ADDRESS>', password:'<PASSWORD>'})
```
This will return the _id of the new user. 

The first user you create will be an admin. If you'd like to create additional admins, you can exit the meteor shell and enter the mongo shell, using the new _id to change their admin status:

```
meteor mongo
db.users.update({_id:'<EXAMPLE_USER_ID>'}, {$set: {isAdmin:true}})
```

If you are using the development database instead of a local database, then instead of using meteor mongo, you will need to log into the remote mongo database.

First, install mongodb if you haven't already. On Mac this is:

```brew install mongodb```

Then, log into the development server (you'll need to ask Oliver for the password)

```mongo ds155813-a0.mlab.com:55813/lesswrong2 -u lesswrong2 -p <password>```
