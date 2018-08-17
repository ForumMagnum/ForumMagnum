# What's LessWrong2?

LessWrong2 is a clean-slate overhaul of the [LessWrong](https://lesswrong.com) discussion platform.

The old LessWrong was [famously](http://www.telescopeapp.org/blog/using-telescope-as-a-reddit-alternative/) one of the only successful extensions of the reddit codebase (forked circa 2008). While reddit's code served us as a stable platform while our community was in its initial stages, it has become hard to extend because of its age, complexity and monolithic design.

## Technologies

Lesswrong2 is built on top of four major open-source libraries.

1. [Vulcan](http://vulcanjs.org/) is a framework for designing social applications like forums and news aggregators. We use it to handle many facets of the LW2 functionality such as data-loading, authentication and search.

2. [React](https://facebook.github.io/react/) is a user interface programming library developed by Facebook that lets us define interface elements declaratively in the form of components. We use it to define how to render and manage state for all parts of the site.

3. [GraphQL](https://graphql.org/) is a query language for the Mongo datastore. Vulcan mostly deals with GraphQL for us, but occasionally we use it to define APIs for accessing and mutating our data.

4. [Draft](https://draftjs.org/) is a framework developed by Facebook for creating text editors. The content and message editors on Lesswrong2 are implemented on top of Draft.

## Running locally

### Requirements

  * MacOS or Linux
    * Known to work on MacOS 10.13 and Ubuntu 16.04, should work on others
  * Node
    * see `.nvmrc` for the required node version
    * You can use [Node Version Manager](https://github.com/creationix/nvm) to install the appropriate version of Node

### Installation

LessWrong is a fork of VulcanJS's example-forum. We've had to make *some* changes to VulcanJS itself as well as their example-forum. We try to keep the changes to each codebase distinct, and have factored our web app into three repos.

I recommend starting by creating a folder to store all of them:

    mkdir lesswrongSuite
    cd lesswrongSuite

Clone the three repos:

    git clone https://github.com/LessWrong2/Lesswrong2
    git clone https://github.com/LessWrong2/Vulcan-Starter.git
    git clone https://github.com/LessWrong2/Vulcan.git

You'll mostly be working in Lesswrong2.

Install node dependencies in each of the repo folders:

    cd Lesswrong2
    npm install
    
    cd ../Vulcan
    npm install

    cd ../Vulcan-Starter
    npm install


Start the development server:

    cd ../Lesswrong2
    npm start

You should now have a local version running at [http://localhost:3000](http://localhost:3000/).

If it is NOT working, there is most likely some issues with your `npm install` process. If you are terminal-savvy you can attempt to resolve that yourself based on error messages. If you'd like help, you can ping the LessWrong team either by creating a github issue or pinging us on intercom on LessWrong itself. You may find some help in the [README for Vulcan-Starter](https://github.com/VulcanJS/Vulcan-Starter)

It will start out with an empty database. (This means that some of the hardcoded links on the frontpage, such as Eliezer’s Sequences or the Codex, will not work). You can create users via the normal sign up process (entering a fake email is fine). The first user you’ll create will be an admin, so you’ll probably want to create at least two users to check how the site looks for non-admins.

## Contributing

### What Contributions Are Helpful?
The most *reliably* helpful thing would be to tackle outstanding issues that have been tagged on [github](https://github.com/LessWrong2/Lesswrong2/issues).

In particular, you can filter them by the tag “[good first issue](https://github.com/LessWrong2/Lesswrong2/issues?q=is%3Aissue+is%3Aopen+label%3A%2200.+Good+First+Issue%22).” (Some of these might require some explanation, but I expect I can explain them fairly easily to a new contributor)

There are [also issues tagged “help wanted.”](https://github.com/LessWrong2/Lesswrong2/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) These are issues that might be a bit complex, but which don’t require much context or understanding of our longterm goals or philosophy to implement.

#### Creating Issues

You can create a new issue. If so, please leave it untagged for the time being (so that admins can quickly look for untagged issues, and sort through them)

*Bugs* – If you run into a bug, the most helpful thing to do is to search for related keywords in the issue tracker. If you can’t find anything relevant, create a new issue. Try to provide as specific information as possible (your browser, exact links to the post or page where you had the issue, information on how to replicate the bug if you can)

*Feature Requests* – Feature requests will often need to undergo some discussion to get refined into something executable, and may sometimes need to be split into sub-features.

Features tend to cluster into either “things that are pretty straightforward and we almost certainly want to do” and “things that we have weird conceptual philosophical opinions about that may sometimes be hard to explain succinctly.” (An upcoming post will go into some of this).

After you’ve posted a feature, an admin will tag it (If it’s been a week and we haven’t done so, feel free to bug us about it. We’re still adapting to the role of “open source facilitators” so we may drup things a bit)

#### Creating a Branch

If you are creating a branch for an existing issue, use this naming schema: branchTitle[issueNumber]. For example, if addressing this issue, your branch might be defaultSettingsFix425.

Once you create the branch, please comment on the issue so that people know someone is working on it.

If you’re creating a branch for an issue that *hasn’t* been created yet, first create an issue for it.

(Disclaimer: this is a different practice than what the full-time developers of the site are currently doing, which means we’ll probably fail at it a bunch, and for commits that take less than a day we may just skip it for momentum reasons. It seems most important for open source contributors to stick to it to maintain sanity as more people work on the codebase)

### Read the Docs

The best way to get familiar with our stack is to read the Vulcan and GraphQL documentation pages.
1. Read about [Vulcan's architecture](http://docs.vulcanjs.org/architecture.html)
2. Learn how to [customize and extend Vulcan](http://docs.vulcanjs.org/example-customization.html)
3. Understand [components and theming](http://docs.vulcanjs.org/theming.html)
4. Understand [Vulcan's data layer](http://docs.vulcanjs.org/schemas.html)
5. Complete the [GraphQL tutorial](https://graphql.org/learn/)

### Understanding the codebase

LessWrong 2 is built on VulcanJS, a generic framework for online forums. VulcanJS is in turn built on technologies including:

  * **MeteorJS** - an underlying framework that you should rarely have to think about while coding for LW.
  * **MongoDB** - a NoSQL database. There is no formal schema.
  * **ReactJS** – for the front end.
  * **GraphQL** – our backend API. The main difference between this and a REST API is that you can query multiple resources at once.

Eventually, it’ll be helpful to have a good understanding of each of those technologies (both to develop new features and fix many kinds of bugs). But for now, the most useful things to know are:

* **Collections** – Mongo databases are organized around *collections* of documents. For example, the Users collection is where the user objects live. Mongo databases do not technically have a rigid schema, but VulcanJS has a pattern for files that determine the intended schema (which is used by the API, forms and permissions systems to determine what database modifications are allowed)

* **Components** – Our React components are organized in a folder structure based loosely on our collections. (i.e. components related to the `User` collection go in the `packages/lesswrong/components/users` folder).

  Some edge cases just go in a randomly picked folder (such as the RecentDiscussion components, which involve both comments and posts, but live in the comments folder)

  There are [multiple ways of creating a ReactJS component](https://themeteorchef.com/blog/understanding-react-component-types). Ideally, each component does one (relatively) simple thing and does it well, with smart components and dumb components separated out. In practice, we haven’t done a great job with this. (Scope creep turns what were once simple components into increasingly complex monstrosities that we should really refactor but haven’t gotten around to it).

  We use Vulcan’s `registerComponent` function to add them as children to a central “Components” component. [(read more here)](http://docs.vulcanjs.org/theming.html)

* **withComponents (Higher Order Components)** – VulcanJS makes a lot of use of React’s [higher order components](https://reactjs.org/docs/higher-order-components.html). Often you need a component to have access to particular attributes (the currentUser object, or a function that can edit a given document). Vulcan has a series of components that wrap around other components. They have a names like `withCurrentUser`, `withEditMutation`, `withDocument`. Wrapping a component in a `withX` typically passes extra information in as a prop.

* **Fragments** – GraphQL queries are made using fragments, which describe the fields from a given database object you want to fetch information on. There’s a common failure mode where someone forgets to update a fragment with new fields, and then the site breaks the next time a component attempts to use information from the new field.

A Vulcan project is divided into packages. It comes with several base packages that provide core functionality (users, voting, routing, etc).

The two packages you’ll most likely need to pay attention to are:

* `packges/example-forum` – A sample forum that defines some key collections (posts, comments, and notifications, as well as “categories” [basically tags] which we aren’t currently using).

  We avoid editing example-forum if we can, so we can more easily upgrade it when the main Vulcan branch updates. Instead, if a function in example-forum doesn’t suit our needs, we replace in our custom lesswrong package.

  However, in some cases it’s impractical to avoid changing example-forum. When we do, we add a nearby comment:

      // LESSWRONG – [text explaining the change]

  So we can easily search for LESSWRONG and find all changes we’ve made.

* `packages/lesswrong` – Our primary codebase.

This includes new collections, components, and additional functions/attributes/extensions for objects in example-forum.

### Development Tips

#### Iteration
* Prefer `_.range(n).forEach(i => my_function())` over `for (var i=0; i<n; i++)...`
* If the body of a for loop performs a stateful action (i.e. modifies a variable outside the scope of the for body), use `forEach`. Else, use `map`.
* Use underscore.js when possible.

#### Style guide

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
* For debugging server-side code, start the server with `npm run debug` instead of `npm run start`. Then open Chrome to chrome://inspect, and click "Open dedicated DevTools for Node". The server will have stopped at an instance of the `debugger` keyword during startup.
* When server-side debugging, everything works except for setting breakpoints in the GUI, which is broken by a Chrome bug: https://bugs.chromium.org/p/chromium/issues/detail?id=844070 . Until they fix it, you can work around this by installing NiM, https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj, in which breakpoints work but profiling doesn't.
