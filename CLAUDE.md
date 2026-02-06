# AGENTS.md: ForumMagnum Codebase Patterns

This document explains non-standard patterns, conventions, and abstractions used in the ForumMagnum codebase. ForumMagnum is a large web application built on NextJS with Apollo GraphQL and PostgreSQL, which is used to run LessWrong, the Alignment Forum, and the EA Forum. You should use that context to inform your understanding of what features are likely to exist, of the likely relationships between different abstractions, etc.

Reminder: after you finish making changes, go over them again to check whether any of them violated the style guide, and fix those violations if so.

## Path aliasing

By default, "@/*": ["./packages/lesswrong/*"].
We also have some aliasing for stub imports in tsconfig-server.json and tsconfig-client.json, which shouldn't come up much.
In the rest of this file, when referring to filenames, you can assume that `@` should be substitute for with `packages/lesswrong`.

## Collections & Schemas

Collections are our abstraction over database tables and GraphQL types. Each collection has a schema that defines a database table. Most (but not all) collections have associated GraphQL types and interfaces.

Collections must have:
- Schema definitions: `@/lib/collections/{collectionName}/newSchema.ts`
- Collection registration: `@/server/collections/{collectionName}/collection.ts`
- A usage in `@/server/collections/allCollections.ts`
- A usage in `@/lib/schema/allSchemas.ts`

Collections may have:
- GraphQL queries: `@/server/collections/{collectionName}/queries.ts`
- GraphQL mutations: `@/server/collections/{collectionName}/mutations.ts`
- Fragments: `@/lib/collections/{collectionName}/fragments.ts`
- Views: `@/lib/collections/{collectionName}/views.ts`

Each field can have a `database` spec (for PostgreSQL) and/or `graphql` spec (for the GraphQL API). If a field has a `database` section but no `graphql` section, it is not accesible via the graphql API. If a field has a graphql section but no database section, it must have a `resolver` function.

Database fields are typed with PostgreSQL types (`VARCHAR(27)`, `TEXT`, `BOOL`, `JSONB`, `TIMESTAMPTZ`, etc.)
GraphQL fields include permissions (`canRead`, `canUpdate`, `canCreate`) and optional resolvers
Custom resolvers can be defined inline for computed fields

### Example: Adding a Field with Custom Resolver

```typescript
// In @/lib/collections/posts/newSchema.ts

const schema = {
  // ... existing fields ...
  
  // Simple field with database storage and GraphQL exposure
  viewCount: {
    database: {
      type: "INTEGER",
      defaultValue: 0,
      nullable: false,
    },
    graphql: {
      // `outputType` can only be required if `canRead` includes `guests`.  Otherwise, it must be nullable.
      outputType: "Int!",
      // If `inputType` is not provided, it defaults to the value in `outputType`.
      // Therefore, if `outputType` is required, but you want `inputType` to be nullable,
      // you must manually specify it: `inputType: "Int"`.
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  
  // Computed field with custom resolver (no database storage)
  author: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      // Regular resolver - runs in Node.js, can use loaders/context
      resolver: async (post, args, context) => {
        return await context.loaders.Users.load(post.userId);
      },
    },
  },
  
  // Field with resolver
  popularComments: {
    graphql: {
      outputType: "[Comment!]!",
      canRead: ["guests"],
      resolver: async (post, args, context) => {
        return await context.Comments.find(
          { postId: post._id, baseScore: { $gt: 10 } },
          { sort: { baseScore: -1 }, limit: 5 }
        ).fetch();
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Posts">>;

export default schema;
```

**See Also**:
- `@/lib/types/schemaTypes.ts` - Type definitions for schema specifications
- `@/lib/collections/{collectionName}/newSchema.ts` - A complete example schema
- `@/server/collections/{collectionName}/queries.ts` - Example queries file
- `@/server/collections/{collectionName}/mutations.ts` - Example mutation file

---

## Collection-Specific Queries & Views

**Purpose**: Views are named, reusable query patterns for collections. They define common selectors, sorts, and limits that can be referenced by name in both server and client code.

**Location**: `@/lib/collections/{collectionName}/views.ts`

**Key Concepts**:
- Views are defined as part of the GraphQL interface in `@/lib/collections/{collectionName}/queries.ts`, where each view has its own input type, all of which are then aggregated into a single "selector" type like `ChapterSelector`:
```typescript
input ChaptersSequenceChaptersInput {
  sequenceId: String
  limit: String
}

input ChapterSelector {
  default: EmptyViewInput
  SequenceChapters: ChaptersSequenceChaptersInput
}
```
- `EmptyViewInput` is a shared input type that is defined in `@/server/vulcan-lib/apollo-server/initGraphQL.ts` and doesn't need to be defined in the view file.  It should be used if a view doesn't have any parameters.
- Views need to have corresponding view functions defined in `@/lib/collections/{collectionName}/views.ts` and added to the `CollectionViewSet` in that file.
- Views are only used when using the "default" resolvers for a given collection (those returned `getDefaultResolvers`).  These are a "single" and "multi" resolver for the collection, which compile a GraphQL query into a SQL query and automatically handle permissions checks.
- If you need an access pattern that is not well-modeled by "fetch one" or "fetch many" with basic selector/sorting/limiting, you should write and use a custom query resolver.  By convention, we put these into `@/server/resolvers/{concept}Resolvers.ts`.  You will need to add them to the `initGraphQL.ts` file.  Don't forget about manually applying relevant permissions checks before returning results to users, if applicable.

### Example: Defining and Using Views

```typescript
// In @/lib/collections/chapters/views.ts
declare global {
  interface ChaptersViewTerms extends ViewTermsBase {
    view: ChaptersViewName
    sequenceId?: string
  }
}

function SequenceChapters(terms: ChaptersSequenceChaptersInput) {
  return {
    selector: { sequenceId: terms.sequenceId },
    options: { sort: { number: 1, createdAt: 1 }, limit: terms.limit ?? 20 },
  };
};

export const ChaptersViews = new CollectionViewSet('Chapters', {
  SequenceChapters
});


// Usage in GraphQL (client-side):
const ChaptersFragmentMultiQuery = gql(`
  query multiChapterChaptersListQuery($selector: ChapterSelector, $limit: Int) {
    chapters(selector: $selector, limit: $limit) {
      results {
        ...ChaptersFragment
      }
      totalCount
    }
  }
`);
// Then, later, inside of a component...
const { data, loading } = useQuery(ChaptersFragmentMultiQuery, {
  variables: {
    selector: { SequenceChapters: { sequenceId } },
    limit: 100,
  },
});

```

**See Also**:
- `@/lib/collections/posts/views.ts` - Comprehensive examples of complex views

---

## Client-Side GraphQL Queries

**Purpose**: Execute type-safe GraphQL queries from React components with proper TypeScript inference.

**Key Concepts**:
- MUST use `gql` from `@/lib/generated/gql-codegen` (NOT from `graphql-tag` or `@apollo/client`)
- Use `useQuery` from `@/lib/crud/useQuery` (wrapper around a relatively complicated replacement for Apollo's useQuery, which otherwise has the same interface)
- Run `yarn generate` after modifying schemas, database indexes, resolvers, GraphQL definitions, or fragments
- Query results are fully typed based on the generated types.  Do not use `as any` or any other type casts to work around type errors that seem to be caused by missing generated types.
- Style note: define queries at the top level of the component file they're used in, not nested inside the component function.  Exception: when the same query is used in multiple files, define it in a separate file.

**Important Notes**:
- Use fragments to share field selections across queries
- Our `useQuery` wrapper handles SSR with Suspense automatically

**See Also**:
- `@/components/admin/CurationPage.tsx` - Real example of useQuery usage

---


## Client-Side GraphQL Mutations

**Purpose**: Execute type-safe mutations from React components.

**Key Concepts**:
- Use `useMutation` from `@apollo/client/react` (standard Apollo hook)
- Define mutations at the top level of the file, same as queries, using `gql` from `@/lib/generated/gql-codegen`
- Mutations are fully typed with inference for variables and return types

**See Also**:
- `@/components/admin/CurationNoticesForm.tsx` - Example with both a "create" and "update" mutation

---

## Collection-Based Querying

**Purpose**: Execute database queries from server-side code (resolvers, callbacks, scripts).

**Key Concepts**:
- For simple queries: use `Collection.find()` or `Collection.findOne()`
- For complex queries: use collection-specific Repos with raw SQL
- Queries use MongoDB-style selectors (translated to SQL automatically)
- Use Repos when you need JOINs, CTEs, or complex SQL features

### Example: Simple Collection Queries

```typescript
// Simple queries using Collection methods
const recentPosts = await Posts.find({
  draft: false,
  postedAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
}, {
  sort: { postedAt: -1 },
  limit: 10,
}).fetch();

// Single document
const post = await Posts.findOne({
  slug: "my-post-slug",
});
```

### Example: Complex Queries with Repos

```typescript
// In @/server/repos/PostsRepo.ts
import AbstractRepo from "./AbstractRepo";
import Posts from "@/server/collections/posts/collection";

class PostsRepo extends AbstractRepo<"Posts"> {
  constructor() {
    super(Posts);
  }
  
  // Query with parameters (use $(argName) syntax with a dictionary of args)
  async getPostsByTag(tagId: string, minScore: number): Promise<DbPost[]> {
    return this.any(`
      -- PostsRepo.getPostsByTag
      SELECT p.*
      FROM "Posts" p
      WHERE p."tagRelevance" ? $(tagId)
      AND (p."tagRelevance"->$(tagId))::integer >= $(minScore)
      AND p."draft" IS NOT TRUE
      ORDER BY p."postedAt" DESC
    `, { tagId, minScore });
  }
}

// Usage in resolver:
const taggedPosts = await context.repos.posts.getPostsByTag(tagId, 10);
```

**Important Notes**:
- Repos inherit from `AbstractRepo` which provides `one()`, `many()`, `any()`, `oneOrNone()`, etc.
- Use parameterized queries with named parameters (e.g. $startDate, $endDate) for clarity and to prevent SQL injection
- Repos are available via `context.repos.{collectionName}` in GraphQL resolvers

**See Also**:
- `@/server/repos/PostsRepo.ts` - Many complex query examples
- `@/server/sql/PgCollection.ts` - Collection query methods

---


## Collection-Based Writes

**Purpose**: Insert and update records in the database from server-side code.

**Key Concepts**:
- **Raw methods** (`rawInsert`, `rawUpdateOne`, `rawUpdateMany`): Direct database operations, no side effects
- **Mutation functions** (`createCollectionName`, `updateCollectionName`): Wrapped operations with validation, callbacks, denormalization, etc.
- **By default, use mutation functions when they exist** - they handle important business logic.
- Only use raw methods when you explicitly want to bypass all the associated logic

### Example: Raw Database Operations

```typescript
// Direct insert - no callbacks, no validation, no denormalization
const postId = await Posts.rawInsert({
  title: "My Post",
  userId: currentUser._id,
  draft: true,
  contents: null,
  // Must provide all required fields
});

// Direct update - no callbacks
await Posts.rawUpdateOne(
  { _id: postId },
  { $set: { draft: false, postedAt: new Date() } }
);

// Update many documents
await Posts.rawUpdateMany(
  { userId: authorId, draft: true },
  { $set: { deletedDraft: true } }
);
```

### Example: Using Mutation Functions (Preferred)

```typescript
// Usage in a resolver or server-side code:
const newComment = await createComment({
  data: {
    postId: post._id,
    contents: {
      originalContents: {
        type: "html",
        data: "<p>My comment</p>"
      }
    },
    parentCommentId: null,
  }
}, context);
```

**When to Use Which**:
- **Use mutation functions** (createX/updateX) when:
  - Creating/updating user-facing content (posts, comments, etc.)
  - You need validation, notifications, or denormalization
  - The document type has business rules or side effects
  
- **Use raw methods** when:
  - Bulk data imports
  - Migrations
  - Internal/system updates
  - You explicitly want to skip all business logic

**See Also**:
- `@/server/collections/comments/mutations.ts` - Examples of relatively involved create and update mutation functions

---

## Background Tasks

In server-side code, it is not safe to `void` a promise because the serverless environment may halt a server process after the conclusion of the current request. If you run asynchronous server-side code where you don't wish `await` a result, wrap the promise in `backgroundTask(p)`. This guarantees that the server will not terminate before the promise resolves (other than during timeouts or severe crashes) by awaiting it from inside `next/server/after`.

There are no other guarantees about the code inside the promise; it may start immediately, or may be deferred util a later stage of processing the request, or may start after the request has finished. On the client, `backgroundTask(p)` is equivalent to `void p`.

Background tasks are typically used for mutations that do not affect the current request, such as updating search indexes, creating notifications, analytics, etc.

Implementation: `@/server/utils/backgroundTask.ts`

---

## Code Generation

**Purpose**: Generate TypeScript types, GraphQL schemas, and boilerplate code from collection definitions.

**Key Commands**:
- `yarn generate` - Run after ANY schema or GraphQL changes. Generates types and GraphQL artifacts.
- `yarn create-collection PascalCasedPluralObjects` - Create a new collection with all boilerplate files.  This is a rare operation; only do this if you're creating a new collection from scratch.

**What `yarn generate` does**:
Generates TypeScript types for:
1. GraphQL schemas, queries, mutations, and fragments
2. Database schemas
Also updates:
1. The collectionTypeNames module
2. The routeManifest module

**When to run `yarn generate`**:
- After adding a field to any schema file (`newSchema.ts`)
- After modifying any GraphQL type definitions
- After adding a new collection view
- After creating a new custom GraphQL resolver
- After adding new collections
- After adding a new page.ts or route.ts under `app/`
- Before running type checks or builds

---

## Migrations

A migration is required for any change that modifies the database schema. Automatic migrations are at `@/server/migrations/yyyymmddThhmmss.migrationName.ts`; these are run automatically when a new version is deployed, inside a github action runner. Migrations are created from a template by running `yarn migrate create migrationName`. There are also "manual migrations", which are run manually by developers with `yarn repl`. Manual migrations are used when a migration performs operations that could time out if run inside a github action runner.

Migrations are run before the new version is deployed, without downtime, so if a migration modifies the database schema it must be backwards-compatible with the immediately preceding deployment. Eg, if a new column is added it must have a default value, and if a column is deleted it must have already been unused. If a schema change can't be made backwards-compatible, this might require using a manual migration that will be run after deployment finishes, or splitting a PR into two stages that will be deployed separately.

---

## Server and Client Code

Files in app/ are React server components and route handlers.
Files in @/components are mostly client components and are used on the client and during SSR. If a component is used directly from a page in app/, it should probably be a client component by default ("use client") at the top.  If a page benefits from having substantial server component functionality, that functionality should either be written in the page.tsx file itself, or in a component in the same directory as the page.tsx file.  Some components defined in @/components don't have the "use client" directive, mostly because they were written before the codebase was moved to NextJS.
Files in @/server are server-side-only.
Files in @/lib and @/themes are shared between client and server.
If a server-only or client-only file is imported from the wrong context, and the import uses a path starting with @ like @/server or @/client, it will be redirected to a stub file in @/stubs. This allows shared code, eg in schema files, to import server-only code safely. Stub files typically export the same functions, but throw exceptions if you call any of them. In some cases the stub file may contain an implementation of the same functionality, but using browser APIs. If a file may have some of its imports redirected to stubs, it must typecheck both with and without the redirection.

---

## Fragments

Fragments are reusable field selections that can be shared across queries. They're typically defined in `@/lib/collections/{collectionName}/fragments.ts`. Fragment names correspond to Typescript types with the same name, which are created by `yarn generate`. A fragment can be used inside any graphql query by writing `...FragmentName`. These are expanded at codegen time by `yarn generate`.
Fragments can inherit from other fragments using `...ParentFragmentName`. 
If a fragment corresponds to a database object, it must have (or inherit a fragment that has) an `_id` field to be stored correctly in the apollo-client cache.
If a query will load many results or is on a performance-sensitive page such as the front page, try to use the smallest suitable fragment to minimize loading time. When adding a field to existing fragments, try to add it to the most specific suitable fragment, to avoid downloading that field on pages that do not need it.

### Loading Patterns

Collections are accessed via context in GraphQL resolvers:

```typescript
// In a GraphQL resolver
async resolver(root, args, context: ResolverContext) {
  const { Posts, Comments, currentUser } = context;
  
  // Collection findOne
  const post = await Posts.findOne(args.postId);
  // Collection find (many) with limit, sorting, and a projection to reduce bandwidth usage if you don't need most of the fields
  const postIdsAndTitles = await Posts.find(
    { userId: currentUser._id },
    { limit: 10, sort: { postedAt: -1 } },
    { _id: 1, title: 1 }
  );
  
  // Repos for complex queries
  const topPosts = await context.repos.posts.getTopPosts(10);
  
  // DataLoaders for batched loading (prevents N+1).
  // Collection DataLoaders can only be used to look up collection records by their primary key (_id).
  // Results are cached within the context of a single request, so if you update a record in the middle of a request
  // and then fetch it with a DataLoader, it might be stale unless you explicitly cleared that DataLoader's cache.
  const author = await context.loaders.Users.load(post.userId);
  
  return post;
}
```

---

## Permissions

Permissions are checked at the GraphQL field level using the `canRead`, `canUpdate`, `canCreate` specifications in schemas. Important helper function:
- `accessFilter{Single,Multiple}` - Used on the server to run both document-level and field-level access filters on one or multiple collection-shaped documents.  Important to use when defining a custom field `resolver` (automatically applied to the outputs of `sqlResolver` executions) or a custom query resolver that returns collection-shaped objects, or data derived from collection-shaped objects.

Helper functions used on both the client and server:
- `userIsAdmin(user)` - Check admin status
- `userOwns(user, document)` - Check ownership

---

## Component Styling

We use jss for styling.  Define styles like so:
```typescript
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
const styles = defineStyles('ComponentName', (theme: ThemeType) => {
  root: {
    width: '100%',
    background: theme.palette.greyAlpha(0.1)
  },
});
```

Then, inside the component:
```typescript
const TestComponent = () => {
  const classes = useStyles(styles);
  return <div className={classes.root}>Foobar!</div>;
};
```
If an element has multiple classes or conditional classes, combine them them with the `classNames` function.
If a component needs HoCs or memoization applied, use `export default registerComponent("TestComponent", TestComponent, {})`, but only wrap components this way if an HoC or memoization is used.
The registerComponent wrapper can take a {styles} option, in which case it calls defineStyles and useStyles in an HoC and passes the result as a prop named `classes`. This method is deprecated; when writing new components you should use `defineStyles` and `useStyles` directly.
Do not use inline the `style` attribute on JSX elements for styling purposes unless you need to do something dynamic that would be deeply impractical to implement with jss classes.

Colors are defined as part of the theme, as `theme.palette.colorName`; see `@/themes/defaultPalette.ts`. If you use a palette color, it will be automatically inverted in dark mode.  Whenever possible, prefer to use existing colors defined in our palette.  For greyscale, use the methods defined in `defaultShadePalette`:
```
  const greyAlpha = (alpha: number) => `rgba(0,0,0,${alpha})`;
  const inverseGreyAlpha = (alpha: number) => `rgba(255,255,255,${alpha})`;
  return {
    // ...
    greyAlpha,
    inverseGreyAlpha,
    boxShadowColor: (alpha: number) => greyAlpha(alpha),
    greyBorder: (thickness: string, alpha: number) => `${thickness} solid ${greyAlpha(alpha)}`,
```
Those are available via `theme.palette`.

If you for some reason need to use a color that does not come from the palette, use either `light-dark(lightModeColor,darkModeColor)`, or, if the component is used in an always-light or always-dark component so that it doesn't need to be inverted, add `allowNonThemeColors:true` as an option in the second argument of `defineStyles`.

`theme.spacing.unit` is deprecated and has the value 8.

---

## Paths and Navigation

Use `useLocation` if you need to get anything related to the current client-side location, i.e. pathname, query parameters, hash, etc.  This is the interface of the object it returns:
```typescript
export type RouterLocation = {
  location: SegmentedUrl,
  pathname: string,
  url: string,
  hash: string,
  params: Record<string, string>,
  query: Record<string, string>, // TODO: this should be Record<string,string|string[]>; any client-side code using this needs to be aware it might get an array.  That won't be the case 99% of the time, though.
};
```

See `@/components/next/ClientAppGenerator.tsx` for more details about how the value returned by it is computed, if anything unusual comes up.

Use `useNavigate` for performing client-side navigations.  You need to preserve all parts of the path that you don't want changed, i.e. just providing a hash will delete any query parameters if they aren't also provided.  See `@/lib/routeUtil.tsx` for more details if needed.

---

## Style / Conventions
Never apply `as any` type casts, and try very hard to avoid any other type casts.  Consider whether you are applying a type cast because you've forgotten to run `yarn generate`.  If you absolutely must apply a type cast somewhere, always leave the following comment above it:
```typescript
// TODO: I AM AN INSTANCE OF ${MODEL_NAME} AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
```

Never add new inline dynamic imports (i.e. `await import(...)` or `require(...)`).
Strongly prefer to avoid writing classes to encapsulate functionality.  Write top-level functions and only export those that are meant to be used by other parts of the codebase.
Strongly prefer to avoid declaring inline functions that capture scope; declare them at the top of the module and pass in all the necessary dependencies.
If you need to combine multiple classNames, use `import classNames from 'classnames';` rather than combining them via template string.
Prefer interfaces to types where possible.
Do not create barrel import/export files.

Reminder: after you finish making changes, go over them again to check whether any of them violated the style guide, and fix those violations if so.

