# What's LessWrong2?

LessWrong2 is a clean-slate overhaul of the [LessWrong](https://lesswrong.com) discussion platform.

The old LessWrong was famously one of the only successful extensions of the reddit codebase (forked circa 2008). While reddit's code served us as a stable platform while our community was in its initial stages, it has become hard to extend because of its age, complexity and monolithic design.

## Technologies

Lesswrong2 is built on top of a number major open-source libraries.

1. [Vulcan](http://vulcanjs.org/) is a framework for designing social applications like forums and news aggregators. We started out using it as a library in the usual way, then forked its codebase and diverged considerably. Read their docs to understand where we've come from, but be wary of outdated information. [This page](https://docs.vulcanjs.org/nutshell.html) is still particularly useful.

2. [Typescript](https://www.typescriptlang.org/) is the programming language we're using. It's like Javascript, but with type annotations. We're gradually moving from un-annotated Javascript towards having annotations on everything, and any new code should have type annotations when it's added.

3. [React](https://facebook.github.io/react/) is a user interface programming library developed by Facebook that lets us define interface elements declaratively in the form of components. We use it to define how to render and manage state for all parts of the site.

4. [GraphQL](https://graphql.org/) is a query language that the browser uses to get data from our servers. Most usage of GraphQL is hidden behind utility functions, but occasionally we use it directly to define APIs for accessing and mutating our data.

5. [Apollo](https://www.apollographql.com/docs/) is a client-side ORM which we use for managing data on the client. We interact with it primarily via the React hooks API.

6. [CkEditor5](https://ckeditor.com/) is the default text editor for posts, comments, and some other form fields. [Draft](https://draftjs.org/) is an alternative text editor, which is no longer the default but which we still support.

## Running locally

### Requirements

  * MacOS or Linux
    * Known to work on MacOS 10.14 and Ubuntu 18.04, should work on others
  * Node
    * see `.nvmrc` for the required node version
    * You can use [Node Version Manager](https://github.com/creationix/nvm) to install the appropriate version of Node

### Installation

Clone our repo:

    git clone https://github.com/LessWrong2/Lesswrong2

Install dependencies:

    cd Lesswrong2
    yarn install

Start the development server:

    yarn start

You should now have a local version running at [http://localhost:3000](http://localhost:3000/).

If it is NOT working, there is most likely some issues with your `yarn install` process. If you are terminal-savvy you can attempt to resolve that yourself based on error messages. If you'd like help, you can ping the LessWrong team either by creating a github issue or pinging us on intercom on LessWrong itself.

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

Some relevant pieces of documentation that will help you understand aspects of the design:

1. React hooks: [intro](https://reactjs.org/docs/hooks-intro.html) and [reference](https://reactjs.org/docs/hooks-reference.html)
2. JSS styles: [intro](https://cssinjs.org/)
3. GraphQL: [tutorial](https://graphql.org/learn/)
4. Apollo: [introduction](https://www.apollographql.com/docs/react/) and [hooks API reference](https://www.apollographql.com/docs/react/api/react/hooks/)
5. Underscore: [reference](https://underscorejs.org/)
6. MongoDB: [manual](https://docs.mongodb.com/manual/introduction/)

You can also see auto-generated documentation of our GraphQL API endpoints and try out queries using [GraphiQL](https://www.lesswrong.com/graphiql) on our server or on a development server.

### Understanding the codebase

Eventually, it’ll be helpful to have a good understanding of each of those technologies (both to develop new features and fix many kinds of bugs). But for now, the most useful things to know are:

* **Collections** – Mongo databases are organized around *collections* of documents. For example, the Users collection is where the user objects live. Mongo databases do not technically have a rigid schema, but VulcanJS has a pattern for files that determine the intended schema (which is used by the API, forms and permissions systems to determine what database modifications are allowed). Each collection is a subdirectory in `packages/lesswrong/lib/collections`.

* **Components** – Our React components are organized in a folder structure based loosely on our collections. (i.e. components related to the `User` collection go in the `packages/lesswrong/components/users` folder). Each component is (usually) defined in a separate `.tsx` file in `packages/lesswrong/components` and imported from `packages/lesswrong/lib/components.ts`.

  Some edge cases just go in a randomly picked folder (such as the RecentDiscussion components, which involve both comments and posts, but live in the comments folder)

  There are [multiple ways of creating a ReactJS component](https://themeteorchef.com/blog/understanding-react-component-types). New components should be functional components, using hooks and ideally minimizing usage of higher-order components. Ideally, each component does one (relatively) simple thing and does it well, with smart components and dumb components separated out. In practice, we haven’t done a great job with this. (Scope creep turns what were once simple components into increasingly complex monstrosities that we should really refactor but haven’t gotten around to it).

  We use Vulcan’s `registerComponent` function to add them as children to a central “Components” table.
  
* **Smart Forms** - Vulcan also allows us to automatically generate simple forms to create and edit Documents (in the Mongo sense of the word Document, any instance of a Collection). This functionality is called Smart Forms.

  You can create an `EditFoo` page, which renders `WrappedSmartForm`, which then automagically creates a form for you. We use this to edit just about every Document in the codebase. How does it know what type of input you want though? This is the interesting part. You define the way you want to edit fields in the collection schema. So in Posts you have (selected examples):

  - Sticky
      - Because it's admin-only, it doesn't show up unless it's edited by an admin.
      - It's control is `'checkbox'`, which makes it editable by a simple checkbox.
      - It's grouped among admin options, so it appears with the other admin options
  - Title
      - It's control is `'EditTitle'`, which means the Smart Form will look in Components for an EditTitle component, and then use that as the UI for modifying the Title.
      
* **useFoo (React Hooks)** - We make heavy use of [React hooks](https://reactjs.org/docs/hooks-intro.html) for querying data, managing state, and accessing shared data like the current user.

* **withFoo (Higher Order Components)** – Higher-order components exist as alternatives for most hooks, and are sometimes used because class-components cannot use hooks. However, these are deprecated and we are migrating towards only using hooks.

* **Fragments** – GraphQL queries are made using fragments, which describe the fields from a given database object you want to fetch information on. There’s a common failure mode where someone forgets to update a fragment with new fields, and then the site breaks the next time a component attempts to use information from the new field.

* **makeEditable** - To add a long text field to a schema, use `makeEditable`. It add the correct control component, and creates the necessary callbacks to sync it with the Revisions table.

* **Configuration and Secrets** We store most configuration and secrets in the
  database, not in environment variables like you might expect. See
  `packages/lesswrong/server/databaseSettings.ts` for more.

* **Logging** - If there's a part of the codebase you often want to see debug
  logging for, you can create a specific debug logger for that section by using
  `loggerConstructor(scope)`. You can then enable or disable that logger by
  setting the public database setting `debuggers` to include your scope, or by
  setting the instance setting `instanceDebuggers`. See
  `packages/lesswrong/lib/utils/logging.ts` for more.

* **Collection callbacks** - One important thing to know when diving into the
  codebase is how much logic is done by callbacks. Collections have hooks on
  them where we add callbacks that react to CRUD operations. They can fire
  before or after the operation. The running of these callbacks is found in
  `packages/lesswrong/server/vulcan-lib/mutators.ts`.

### Development Tips

When developing, we make good use of project-wide search. One benefit of a
monorepo codebase at a non-megacorp is that we can get good results just by
searching for `hiddenRelatedQuestion` to find exactly how that database field is
used.

### Debugging

* Use google chrome. Its debugging tools are superior.
* Use 'debugger' in code. Then Ctrl+Shift+J on your open page, and you can interactively step through the breakpoint. You can also interact with variables in scope at each step using the console at the bottom.
* Use `console.warn(variable)` when you want to see the stacktrace of `variable`
* Add the [react dev tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) extension to chrome, and switch to the "React" tab after pressing Ctrl+Shift+J. You can see the react component tree. Once you click on a component in the tree, you will have access to it in the console as the variable `$r`. For example, you can check the props or state using `$r.props` or `$r.state`.
* If you think a previous commit broke your feature, use [git's builtin debugging tools](https://git-scm.com/book/en/v2/Git-Tools-Debugging-with-Git)
* (Note: currently aspirational): If you fix a bug, **write a test for it**.

## Testing

We use [Jest](https://jestjs.io/) for unit testing, and [Cypress](https://www.cypress.io/) for end-to-end testing.

### Cypress

* To run Cypress tests locally, first run `yarn lw-start-testing-db`, then in a separate terminal run either `yarn lw-cypress-run` for a CLI version, or `yarn lw-cypress-open` for a GUI version. To run specific tests in the CLI, you can use the `-s <glob-file-pattern>` option.
* Test database instance settings for are stored under `./settings-test.json`.
* For the basics of writing Cypress tests, see [Writing your first test](https://docs.cypress.io/guides/getting-started/writing-your-first-test#Step-2-Query-for-an-element). Primarily you'll use `cy.get()` to find elements via CSS selectors, `cy.contains()` to find elements via text contents, `cy.click()` and `cy.type()` for input, and `cy.should()` for assertions. Feel free to steal from existing tests in `./cypress/integration/`.
* Add custom commands under `./cypress/support/commands.js`, and access them via `cy.commandName()`.
* Seed data for tests is stored under `./cypress/fixtures`, and can be accessed using `cy.fixture('<filepath>')`. See [here](https://docs.cypress.io/api/commands/fixture) for more.
* To execute code in a node context, you can create a [task](https://docs.cypress.io/api/commands/task#Syntax) under `./cypress/plugins/index.js`. Tasks are executed using `cy.task('<task-name>', args)`.