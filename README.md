# Forum Magnum

Forum Magnum is the codebase powering [LessWrong](https://lesswrong.com) and the
[Effective Altruism Forum](https://forum.effectivealtruism.org).

The team behind LessWrong created this codebase in 2017 as a rewrite of the
original version of LessWrong, which was a difficult-to-maintain fork of reddit.

## Technologies

Forum Magnum is built on top of a number major open-source libraries.

1. [Vulcan](http://vulcanjs.org/) is a framework for designing social applications like forums and news aggregators. We started out using it as a library in the usual way, then forked its codebase and diverged considerably. Read their docs to understand where we've come from, but be wary of outdated information. [This page](https://docs.vulcanjs.org/nutshell.html) is still particularly useful. CEA: see [notion](https://www.notion.so/centreforeffectivealtruism/Vulcan-Docs-20ceb495f8ee4f36822602dfaf2f31b5) for more.

2. [Typescript](https://www.typescriptlang.org/) is the programming language we're using. It's like Javascript, but with type annotations. We're gradually moving from un-annotated Javascript towards having annotations on everything, and any new code should have type annotations when it's added.

3. [React](https://facebook.github.io/react/) is a user interface programming library developed by Facebook that lets us define interface elements declaratively in the form of components. We use it to define how to render and manage state for all parts of the site.

4. [GraphQL](https://graphql.org/) is a query language that the browser uses to get data from our servers. Most usage of GraphQL is hidden behind utility functions, but occasionally we use it directly to define APIs for accessing and mutating our data.

5. [Apollo](https://www.apollographql.com/docs/) is a client-side ORM which we use for managing data on the client. We interact with it primarily via the React hooks API.

6. [CkEditor5](https://ckeditor.com/) is the default text editor for posts, comments, and some other form fields. [Draft](https://draftjs.org/) is an alternative rich text editor, which is no longer the default but which we still support.

## Running locally

### Requirements

  * MacOS or Linux
    * Known to work on MacOS 10.15 and Ubuntu 18.04, should work on others
    * It is also known to work on Ubuntu 18.04 using Windows Subsystem for Linux
  * Node
    * see `.nvmrc` for the required node version
    * You can use [Node Version Manager](https://github.com/creationix/nvm) to install the appropriate version of Node
    * Starting from a fresh MacOS system, try: `brew install nvm` to install nvm, then `nvm install` in the ForumMagnum directory
  * Curl, Perl are optional, but needed to run some scripts and tests

### Installation

Clone our repo:

```
git clone https://github.com/ForumMagnum/ForumMagnum.git
```

Install dependencies:

```
cd ForumMagnum
yarn install
```

### If you want to run a local database

CEA Devs, see the ForumCredentials repository for access to a remote dev database. Otherwise, do the following:

Run a local postgres instance, version 15. For example, if you're on macos:

```bash
brew install postgresql@15
brew services start postgresql@15

createdb forummagnum
```

(DB name is an arbitrary choice.)

You must also have the [pgvector](https://github.com/pgvector/pgvector) Postgres extension installed.

Configure the schema:

```bash
psql forummagnum -f ./schema/accepted_schema.sql
```

TODOs:

* You won't have any database settings yet. TODO: add instructions.
* You won't be able to run migrations yet. TODO: fix migrations so they can be
  run on a new db (NB: goal is still to have the db have the accepted_schema).

### Creating branch-specific development databases

When developing features that require changing database schemas, it can be
desirable to do this work without changing schemas in shared database instances
that other developers are working on. To solve this problem, we have a script
that can be used to create temporary clones of the dev database. The following
commands are supported:
 - `yarn branchdb create` clones a new dev database for the current git branch
 - `yarn branchdb drop` drops the cloned database for the current git branch
 - `yarn branchdb clean` drops all cloned dev databases created by this git clone
 - `yarn branchdb list` lists all cloned dev databases created by this git clone

### Start the development server

Your postgres URL for the locally-running database will be
postgres://localhost/forummagnum.

```
yarn start-local-db --postgresUrl $YOUR_LOCAL_POSTGRES_URL
```

Next, select which website you are working on. If you're making a new site, open
packages/lesswrong/lib/instanceSettings.ts, find the line that says

```
export const allForumTypes = ...
```

and add your forum type to the end. Then regardless of whether you're making a
new site or editing an existing one, open settings-dev.json and change the line
that says `"forumType": "LessWrong"` to the correct forum.

Or, if (and only if!) you have access to CEA's ForumCredentials repository, use

```
yarn ea-start
```

You should now have a local version running at [http://localhost:3000](http://localhost:3000/).

It will start out with an empty database. (This means that some of the hardcoded links on the frontpage will not work). You can create users via the normal sign up process (entering a fake email is fine). The first user you’ll create will be an admin, so you’ll probably want to create at least two users to check how the site looks for non-admins. [Note for CEA: this doesn't apply to you, your database is shared with other developers.]

## Documentation

### Read the Docs

Some relevant pieces of documentation that will help you understand aspects of the design:

1. React hooks: [intro](https://reactjs.org/docs/hooks-intro.html) and [reference](https://reactjs.org/docs/hooks-reference.html)
2. JSS styles: [intro](https://cssinjs.org/)
3. GraphQL: [tutorial](https://graphql.org/learn/)
4. Apollo: [introduction](https://www.apollographql.com/docs/react/) and [hooks API reference](https://www.apollographql.com/docs/react/api/react/hooks/)
5. Lodash: [reference](https://lodash.com/docs/4.17.15)

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
* If you're trying to debug an email problem, you might want to know about `forcePendingEvents`.

## Database Migrations

All migrations should be designed to be idempotent and should represent a
one-off operation (such as updating a table schema). Operations that need to be
run multiple times should instead be implemented as a server script.

* Run pending migrations with `yarn migrate up [dev|staging|prod]`
* Revert migrations with `yarn migrate down [dev|staging|prod]`, but note that we treat down migrations as optionally so this may or may not work as expected
* Create a new migration with `yarn migrate create --name=my-new-migration`, although usually you will want to do `yarn makemigrations` instead (see below)
* View pending migrations with `yarn migrate pending [dev|staging|prod]`
* View executed migrations with `yarn migrate executed [dev|staging|prod]`

Instead of using \[dev|staging|prod\] above, you can also manually pass in a postgres connection string through a `PG_URL` environment variable. Use that option if you are not using the \[EA\] ForumCredentials repo.

### Schema changing migrations

Many (most) migrations will just be to update the database schema to be in line with what the code expects. For these we have
scripts to autogenerate a migration template, and assert that the new schema has been "accepted" (i.e. you have remembered to write a migration).
For these the development process will be like this:

* Make some changes which add or alter fields in one of the `schema.ts` files
* Run `yarn makemigrations`, to check the schema and generate a new migration file if there are changes
* Fill out the migration file, and uncomment the `acceptsSchemaHash = ...` line when you are done
* Run `yarn acceptmigrations` to accept the changes (this updates two files which should be committed, `accepted_schema.sql` and `schema_changelog.json`)

#### Migrations and git conflicts
* When you created a new migration, but then someone else merged a PR that also created a migration, you will get a git conflict.
* To resolve it you basically need to re-run migration process:
  * merge/rebase on top of new changes accepting their versions of schema files (i.e. `accepted_schema.sql` and `schema_changelog.json`)
  * run `yarn makemigrations` again, to generate new hashes for the schema
  * copy the logic from the migration file you've crated previously, but keep new `acceptedSchemaHash` value and timestamp in the file name
  * delete your old migration file (and reference to it in `schema_changelog.json` if it's still there)
  * run `yarn acceptmigrations`
  * finish merge/rebase

## Testing

We use [Jest](https://jestjs.io/) for unit and integration testing, and [Cypress](https://www.cypress.io/) for end-to-end testing.

### Jest

* Run the unit test suite with `yarn unit`
* Run the integration test suite with `yarn integration` (you may need to run `yarn create-integration-db` first so that the db is up-to-date)

Both commands support a `-watch` suffix to watch the file system, and a `-coverage` suffix to generate a code coverage report. After generating both code coverage reports they can be combined into a single report with `yarn combine-coverage`.

### Cypress

* To run Cypress tests locally, first run `yarn ea-start-testing-db`, then in a separate terminal run either `yarn ea-cypress-run` for a CLI version, or `yarn ea-cypress-open` for a GUI version. To run specific tests in the CLI, you can use the `-s <glob-file-pattern>` option.
* Test database instance settings for Cypress are stored under `./settings-test.json`.
* For the basics of writing Cypress tests, see [Writing your first test](https://docs.cypress.io/guides/getting-started/writing-your-first-test#Step-2-Query-for-an-element). Primarily you'll use `cy.get()` to find elements via CSS selectors, `cy.contains()` to find elements via text contents, `cy.click()` and `cy.type()` for input, and `cy.should()` for assertions. Feel free to steal from existing tests in `./cypress/integration/`.
* Add custom commands under `./cypress/support/commands.js`, and access them via `cy.commandName()`.
* Seed data for tests is stored under `./cypress/fixtures`, and can be accessed using `cy.fixture('<filepath>')`. See [here](https://docs.cypress.io/api/commands/fixture) for more.
* To execute code in a node context, you can create a [task](https://docs.cypress.io/api/commands/task#Syntax) under `./cypress/plugins/index.js`. Tasks are executed using `cy.task('<task-name>', args)`.

### Where to branch off of

Branch off of `master` and submit to `master`. Deploys occur when `master` is
merged into `ea-deploy` and `lw-deploy`.

## EA Forum-Specific

### \[CEA-Specific] Local Dev Database

The local development database is actually hosted in the cloud like staging
and production. There's no reason to host your own database. It's also shared
with other developers, which means if someone adds a feature which requires
manual database work, there's no need for you to also do that manual work.

The test user admin credentials are in 1password. You're also welcome to create
your own admin user.
