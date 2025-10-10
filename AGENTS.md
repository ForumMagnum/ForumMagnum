# AGENTS.md: ForumMagnum Codebase Patterns

This document explains non-standard patterns, conventions, and abstractions used in the ForumMagnum codebase. ForumMagnum is a large web application built on NextJS with Apollo GraphQL and PostgreSQL, which is used to run both LessWrong and the EA Forum.  You should use that context to inform your understanding of what features are likely to exist, of the likely relationships between different abstractions, etc.

Reminder: after you finish making changes, go over them again to check whether any of them violated the style guide, and fix those violations if so.

## Table of Contents
1. [Collections & Schemas](#collections--schemas)
2. [Collection-Specific Queries & Views](#collection-specific-queries--views)
3. [Client-Side GraphQL Queries](#client-side-graphql-queries)
4. [Client-Side GraphQL Mutations](#client-side-graphql-mutations)
5. [Collection-Based Querying](#collection-based-querying)
6. [Collection-Based Writes](#collection-based-writes)
7. [Background Tasks](#background-tasks)
8. [Code Generation](#code-generation)
9. [Additional Patterns](#additional-patterns)
10. [Style Guide](#style-guide--conventions)

---

## Collections & Schemas

**Purpose**: Collections are our abstraction over database tables and GraphQL types. Each collection has a schema that defines both the database structure and GraphQL interface in a unified way.

**Location**: 
- Schema definitions: `packages/lesswrong/lib/collections/{collectionName}/newSchema.ts`
- Collection registration: `packages/lesswrong/server/collections/{collectionName}/collection.ts`

**Key Concepts**:
- Each field can have a `database` spec (for PostgreSQL) and/or `graphql` spec (for the GraphQL API)
- Database fields are typed with PostgreSQL types (`VARCHAR(27)`, `TEXT`, `BOOL`, `JSONB`, `TIMESTAMPTZ`, etc.)
- GraphQL fields include permissions (`canRead`, `canUpdate`, `canCreate`) and optional resolvers
- Custom resolvers can be defined inline for computed fields
- `sqlResolver` allows for SQL-level computation of fields when going through default collection-level resolvers

### Example: Adding a Field with Custom Resolver and sqlResolver

```typescript
// In packages/lesswrong/lib/collections/posts/newSchema.ts

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
  
  // Field with both resolver and sqlResolver
  // `sqlResolver` is used when execution routes through `SelectFragmentQuery`, which is primarily when going through a "default" resolver.
  // Otherwise, `resolver` is used.  Therefore, `resolver` is required even if `sqlResolver` is provided.
  // Most `sqlResolvers` are much simpler than the example here and often just have something like `resolver: (commentsField) => commentsField('*')` inside of them, when doing a basic join to get all matching records.
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
      sqlResolver: ({ field, join }) => {
        // Join with Comments table for efficient SQL-level computation
        return join({
          table: "Comments",
          type: "left",
          on: { postId: field("_id") },
          resolver: (commentField) => `
            COALESCE(
              (
                SELECT jsonb_agg(row_to_json(c.*))
                FROM "Comments" c
                WHERE c."postId" = ${field("_id")}
                AND c."baseScore" > 10
                ORDER BY c."baseScore" DESC
                LIMIT 5
              ),
              '[]'::jsonb
            )
          `,
        });
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Posts">>;

export default schema;
```

**See Also**:
- `packages/lesswrong/lib/types/schemaTypes.ts` - Type definitions for schema specifications
- `packages/lesswrong/lib/collections/collections/newSchema.ts` - A complete example schema
- `packages/lesswrong/server/collections/comments/mutations.ts` - Example mutation file (attached)

---

## Collection-Specific Queries & Views

**Purpose**: Views are named, reusable query patterns for collections. They define common selectors, sorts, and limits that can be referenced by name in both server and client code.

**Location**: `packages/lesswrong/lib/collections/{collectionName}/views.ts`

**Key Concepts**:
- Views are defined as part of the GraphQL interface in `packages/lesswrong/lib/collections/{collectionName}/queries.ts`, where each view has its own input type, all of which are then aggregated into a single "selector" type like `ChapterSelector`:
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
- `EmptyViewInput` is a shared input type that is defined in `packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL.ts` and doesn't need to be defined in the view file.  It should be used if a view doesn't have any parameters.
- Views need to have corresponding view functions defined in `packages/lesswrong/lib/collections/{collectionName}/views.ts` and added to the `CollectionViewSet` in that file.
- Views are only used when using the "default" resolvers for a given collection (those returned `getDefaultResolvers`).  These are a "single" and "multi" resolver for the collection, which compile a GraphQL query into a SQL query and automatically handle permissions checks.
- If you need an access pattern that is not well-modeled by "fetch one" or "fetch many" with basic selector/sorting/limiting, you should write and use a custom query resolver.  By convention, we put these into `packages/lesswrong/server/resolvers/{concept}Resolvers.ts`.  You will need to add them to the `initGraphQL.ts` file.  Don't forget about manually applying relevant permissions checks before returning results to users, if applicable.

### Example: Defining and Using Views

```typescript
// In packages/lesswrong/lib/collections/chapters/views.ts
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
// const ChaptersFragmentMultiQuery = gql(`
//   query multiChapterChaptersListQuery($selector: ChapterSelector, $limit: Int) {
//     chapters(selector: $selector, limit: $limit) {
//       results {
//         ...ChaptersFragment
//       }
//       totalCount
//     }
//   }
// `);
// // Then, later, inside of a component...
// const { data, loading } = useQuery(ChaptersFragmentMultiQuery, {
//   variables: {
//     selector: { SequenceChapters: { sequenceId } },
//     limit: 100,
//   },
// });

```

**See Also**:
- `packages/lesswrong/lib/collections/posts/views.ts` - Comprehensive examples of complex views
- `packages/lesswrong/lib/views/collectionViewSet.ts` - Base class for view sets

---

## Client-Side GraphQL Queries

**Purpose**: Execute type-safe GraphQL queries from React components with proper TypeScript inference.

**Key Concepts**:
- MUST use `gql` from `@/lib/generated/gql-codegen` (NOT from `graphql-tag` or `@apollo/client`)
- Use `useQuery` from `@/lib/crud/useQuery` (wrapper around Apollo's useQuery)
- Run `yarn generate` after modifying schemas, resolvers, GraphQL definitions, or fragments
- Query results are fully typed based on the generated types.  Do not use `as any` or any other type casts to work around type errors that seem to be caused by missing generated types.
- Style note: define queries at the top level of the component file they're used in, not nested inside the component function.  Exception: when the same query is used in multiple files, define it in a separate file.

### Example: Client-Side Queries

```typescript
// In a React component file
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen"; // IMPORTANT: Use this import!

// Simple query using a collection view
const FRONTPAGE_POSTS_QUERY = gql(`
  query FrontpagePostsQuery(selector: $PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        # Can reference fragments defined elsewhere
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const MyComponent = () => {
  const { data, loading, error } = useQuery(FRONTPAGE_POSTS_QUERY, {
    variables: { selector: { frontpage: {} }, limit: 20 },
    ssr: false, // Whether to fetch during SSR - default is `true`, so _do not_ include it if true, only include it if false.
    // other commonly-used options include `skip` and `fetchPolicy`, but this wrapper accepts everything that Apollo's native `useQuery` does.
  });
  
  // data.posts is fully typed!
  const posts = data?.posts?.results ?? [];
  
  return (
    <div>
      {loading ? <div>Loading...</div> : null}
      {posts.map(post => (
        <div key={post._id}>
          {post.title} by {post.author?.displayName}
        </div>
      ))}
    </div>
  );
};
```

**Important Notes**:
- The `gql` function from `@/lib/generated/gql-codegen` is processed at build time to generate types
- After changing any schema, you MUST run `yarn generate` to regenerate types
- Use fragments to share field selections across queries
- Our `useQuery` wrapper handles SSR with Suspense automatically

**See Also**:
- `packages/lesswrong/components/posts/usePost.ts` - Real example of useQuery usage
- `codegen.ts` - GraphQL codegen configuration

---

## Client-Side GraphQL Mutations

**Purpose**: Execute type-safe mutations from React components.

**Key Concepts**:
- Use `useMutation` from `@apollo/client/react` (standard Apollo hook)
- Define mutations at the top level of the file, same as queries, using `gql` from `@/lib/generated/gql-codegen`
- Mutations are fully typed with inference for variables and return types

### Example: Client-Side Mutations

```typescript
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useMessages } from "@/lib/messages";

const CREATE_POST_MUTATION = gql(`
  mutation CreatePost($title: String!, $contents: JSON, $draft: Boolean) {
    createPost(data: {
      title: $title
      contents: $contents
      draft: $draft
    }) {
      data {
        _id
        slug
        title
      }
    }
  }
`);

const VOTE_ON_POST_MUTATION = gql(`
  mutation VoteOnPost($postId: String!, $voteType: String!) {
    performVotePost(postId: $postId, voteType: $voteType) {
      baseScore
      voteCount
    }
  }
`);

const MyComponent = () => {
  const { flash } = useMessages();
  
  const [createPost] = useMutation(CREATE_POST_MUTATION, {
    // Optional: specify how to handle errors
    errorPolicy: 'all',
    // Optional: refetch queries after mutation
    refetchQueries: ['FrontpagePostsQuery'],
  });
  
  const handleCreatePost = async () => {
    try {
      const result = await createPost({
        variables: {
          title: "My New Post",
          contents: {
            originalContents: {
              type: "html",
              data: "<p>Post content here</p>"
            }
          },
          draft: true,
        },
      });
      
      // result.data is fully typed
      const newPost = result.data?.createPost?.data;
      if (newPost) {
        flash({ messageString: "Post created!" });
      }
    } catch (error) {
      flash({ messageString: `Error: ${error.message}` });
    }
  };
  
  // Mutation with optimistic response
  const [voteOnPost] = useMutation(VOTE_ON_POST_MUTATION, {
    optimisticResponse: {
      performVotePost: {
        baseScore: (currentScore) => currentScore + 1,
        voteCount: (currentCount) => currentCount + 1,
      },
    },
  });
  
  return (
    <button onClick={handleCreatePost}>
      Create Post
    </button>
  );
};
```

**See Also**:
- `packages/lesswrong/components/recommendations/useRecommendationsAnalytics.ts` - Example with multiple mutations
- `packages/lesswrong/components/users/LoginForm.tsx` - Example with error handling

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
const recentPosts = await Posts.find(
  {
    draft: false,
    postedAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  },
  {
    sort: { postedAt: -1 },
    limit: 10,
  }
).fetch();

// Single document
const post = await Posts.findOne({
  slug: "my-post-slug",
});
```

### Example: Complex Queries with Repos

```typescript
// In packages/lesswrong/server/repos/PostsRepo.ts
import AbstractRepo from "./AbstractRepo";
import Posts from "@/server/collections/posts/collection";

class PostsRepo extends AbstractRepo<"Posts"> {
  constructor() {
    super(Posts);
  }
  
  // Complex query with JOINs and CTEs
  async getPostsWithTopComments(limit: number): Promise<Array<DbPost & { topComments: DbComment[] }>> {
    return this.any(`
      -- PostsRepo.getPostsWithTopComments
      WITH top_comments AS (
        SELECT 
          c.*,
          ROW_NUMBER() OVER (PARTITION BY c."postId" ORDER BY c."baseScore" DESC) as rn
        FROM "Comments" c
        WHERE c."deleted" IS NOT TRUE
      )
      SELECT 
        p.*,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              '_id', tc."_id",
              'contents', tc."contents",
              'baseScore', tc."baseScore"
            )
          ) FILTER (WHERE tc.rn <= 3),
          '[]'::jsonb
        ) as "topComments"
      FROM "Posts" p
      LEFT JOIN top_comments tc ON tc."postId" = p."_id" AND tc.rn <= 3
      WHERE p."draft" IS NOT TRUE
      GROUP BY p."_id"
      ORDER BY p."postedAt" DESC
      LIMIT $(limit)
    `, { limit });
  }
  
  // Query with parameters (use $(argName) syntax with a dictionary of args)
  async getPostsByTag(tagId: string, minScore: number): Promise<DbPost[]> {
    return this.any(`
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
const postsWithComments = await context.repos.posts.getPostsWithTopComments(10);
```

**Important Notes**:
- Repos inherit from `AbstractRepo` which provides `one()`, `many()`, `any()`, `oneOrNone()`, etc.
- Use parameterized queries ($1, $2) to prevent SQL injection
- Add comments with repo/method name for query debugging
- Repos are available via `context.repos.{collectionName}` in GraphQL resolvers

**See Also**:
- `packages/lesswrong/server/repos/PostsRepo.ts` - Many complex query examples
- `packages/lesswrong/server/repos/AbstractRepo.ts` - Base repo class
- `packages/lesswrong/server/sql/PgCollection.ts` - Collection query methods

---

## Collection-Based Writes

**Purpose**: Insert and update records in the database from server-side code.

**Key Concepts**:
- **Raw methods** (`rawInsert`, `rawUpdateOne`, `rawUpdateMany`): Direct database operations, no side effects
- **Mutation functions** (`createCollectionName`, `updateCollectionName`): Wrapped operations with validation, callbacks, denormalization, etc.
- **Use mutation functions when they exist** - they handle important business logic
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
// In packages/lesswrong/server/collections/comments/mutations.ts
import schema from "@/lib/collections/comments/newSchema";
import { getLegacyCreateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks } from '@/server/vulcan-lib/mutators';
import { backgroundTask } from "@/server/utils/backgroundTask";

export async function createComment(
  { data }: CreateCommentInput,
  context: ResolverContext
) {
  const { currentUser } = context;

  // Get callback props (legacy pattern for validation/transformation)
  const callbackProps = await getLegacyCreateCallbackProps('Comments', {
    context,
    data,
    schema,
  });

  // Automatically assign userId
  assignUserIdToData(data, currentUser, schema);
  data = callbackProps.document;

  // Run field-level onCreate callbacks
  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  // Custom business logic
  data = await assignPostVersion(data);
  data = await createShortformPost(data, callbackProps);
  data = await setTopLevelCommentId(data, callbackProps);

  // Create revisions for editable fields
  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  // Actually insert into database
  const afterCreateProperties = await insertAndReturnCreateAfterProps(
    data,
    'Comments',
    callbackProps
  );
  let documentWithId = afterCreateProperties.document;

  // Post-insert synchronous operations
  invalidatePostOnCommentCreate(documentWithId, context);
  documentWithId = await updateDescendentCommentCountsOnCreate(
    documentWithId,
    afterCreateProperties
  );

  // Update references on other collections
  await updateCountOfReferencesOnOtherCollectionsAfterCreate(
    'Comments',
    documentWithId
  );

  // Send notifications
  await commentsNewNotifications(documentWithId, context);

  // Background tasks (non-blocking)
  if (isElasticEnabled()) {
    backgroundTask(elasticSyncDocument('Comments', documentWithId._id));
  }
  backgroundTask(updateCommentEmbeddings(documentWithId._id));

  return documentWithId;
}

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

### Example: Update Mutation Function

```typescript
export async function updateComment(
  { selector, data }: UpdateCommentInput,
  context: ResolverContext
) {
  const { currentUser, Comments } = context;

  // Save original data for change logging
  const origData = cloneDeep(data);

  // Get callback props
  const {
    documentSelector: commentSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Comments', {
    selector,
    context,
    data,
    schema
  });

  const { oldDocument } = updateCallbackProperties;

  // Run field callbacks
  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  // Custom business logic
  data = updatePostLastCommentPromotedAt(data, updateCallbackProperties);
  data = await validateDeleteOperations(data, updateCallbackProperties);

  // Create revisions
  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  // Perform the update
  let updatedDocument = await updateAndReturnDocument(
    data,
    Comments,
    commentSelector,
    context
  );

  // Post-update operations
  await commentsAlignmentEdit(updatedDocument, oldDocument, context);
  await commentsPublishedNotifications(updatedDocument, oldDocument, context);

  // Log field changes for auditing (background task)
  backgroundTask(logFieldChanges({
    currentUser,
    collection: Comments,
    oldDocument,
    data: origData
  }));

  return updatedDocument;
}
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
- `packages/lesswrong/server/collections/comments/mutations.ts` - Full example (attached)
- `packages/lesswrong/server/vulcan-lib/mutators.ts` - Helper functions for mutations
- `packages/lesswrong/server/manualMigrations/migrationUtils.ts` - Examples of raw operations

---

## Background Tasks

**Purpose**: Defer execution of slow operations without blocking the HTTP response.

**Location**: `packages/lesswrong/server/utils/backgroundTask.ts`

**Key Concepts**:
- Wraps a promise to execute asynchronously
- In serverless (Vercel), ensures the function doesn't exit until background tasks complete
- In local dev, tasks complete normally but don't block the response
- Errors in background tasks are caught and logged to Sentry
- Use for: search indexing, embeddings, notifications, analytics, etc.

### Example: Using backgroundTask

```typescript
import { backgroundTask } from "@/server/utils/backgroundTask";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { updateCommentEmbeddings } from "@/server/voyage/client";
import { logFieldChanges } from "@/server/fieldChanges";

export async function createComment({ data }: CreateCommentInput, context: ResolverContext) {
  // ... synchronous creation logic ...
  
  const documentWithId = await insertAndReturnCreateAfterProps(data, 'Comments', callbackProps);
  
  // These operations happen asynchronously without blocking the response
  // Elasticsearch sync - not critical for user experience
  if (isElasticEnabled()) {
    backgroundTask(elasticSyncDocument('Comments', documentWithId._id));
  }
  
  // Generate embeddings - slow ML operation
  backgroundTask(updateCommentEmbeddings(documentWithId._id));
  
  // Analytics/logging - not user-facing
  backgroundTask(logFieldChanges({
    currentUser: context.currentUser,
    collection: context.Comments,
    oldDocument: null,
    data: data,
  }));
  
  // Image uploads - can happen async
  backgroundTask(uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: afterCreateProperties,
  }));
  
  // Return immediately, background tasks continue
  return documentWithId;
}
```

**Important Notes**:
- They may execute after the user has received their response
- Errors are logged but won't affect the user's request
- Don't use for operations critical to data consistency

**See Also**:
- `packages/lesswrong/server/utils/backgroundTask.ts` - Implementation

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

**Example: Creating a New Collection**

```bash
# Create a new collection (rare operation)
yarn create-collection Articles

# This creates:
# - packages/lesswrong/lib/collections/articles/newSchema.ts
# - packages/lesswrong/lib/collections/articles/views.ts
# - packages/lesswrong/server/collections/articles/collection.ts
# - packages/lesswrong/server/collections/articles/queries.ts
# And registers it in:
# - packages/lesswrong/lib/schema/allSchemas.ts
# - packages/lesswrong/server/collections/allCollections.ts

# Then always run:
yarn generate
```

**See Also**:
- `scripts/createCollection.sh` - Collection creation script
- `packages/lesswrong/server/codegen/generateNewCollection.ts` - Collection generator implementation

---

## Additional Patterns

### Fragments

Fragments are reusable field selections that can be shared across queries. They're defined in `packages/lesswrong/lib/collections/{collectionName}/newSchema.ts` and typed after `yarn generate`.

```typescript
// Fragments are defined with gql and can be used in queries.  The variable name should, by convention, be the same as the fragment name.
const PostsListBase = gql(`
  fragment PostsListBase on Post {
    _id
    title
    slug
    postedAt
    baseScore
    commentCount
  }
`);

// Use in queries
const POSTS_LIST_QUERY = gql(`
  query PostsList {
    posts(selector: { frontpage: {} }, limit: 20) {
      results {
        ...PostsListBase
        author {
          displayName
        }
      }
    }
  }
`);
```

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

### Permissions

Permissions are checked at the GraphQL field level using the `canRead`, `canUpdate`, `canCreate` specifications in schemas. Important helper function:
- `accessFilter{Single,Multiple}` - Used on the server to run both document-level and field-level access filters on one or multiple collection-shaped documents.  Important to use when defining a custom field `resolver` (automatically applied to the outputs of `sqlResolver` executions) or a custom query resolver that returns collection-shaped objects, or data derived from collection-shaped objects.

Helper functions used on both the client and server:
- `userIsAdmin(user)` - Check admin status
- `userOwns(user, document)` - Check ownership

### Components
We use jss for styling.  Define styles like so:
```typescript
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
const styles = defineStyles('ComponentName', (theme: ThemeType) => {
  root: {
    width: '100%',
    background: theme.palette.grey[100],
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

We have some legacy instances of `registerComponent` lying around.  Do not use this unless you need custom memoization behavior for your component.  Just do `export default TestComponent;`.

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

See `packages/lesswrong/components/next/ClientAppGenerator.tsx` for more details about how the value returned by it is computed, if anything unusual comes up.

Use `useNavigate` for performing client-side navigations.  You need to preserve all parts of the path that you don't want changed, i.e. just providing a hash will delete any query parameters if they aren't also provided.  See `packages/lesswrong/lib/routeUtil.tsx` for more details if needed.

## Style Guide / Conventions
Never apply `as any` type casts, and try very hard to avoid any other type casts.  Consider whether you are applying a type cast because you've forgotten to run `yarn generate`.  If you absolutely must apply a type cast somewhere, always leave the following comment above it:
```typescript
// TODO: I AM AN INSTANCE OF ${MODEL_NAME} AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
```

Never add new inline dynamic imports (i.e. `await import(...)` or `require(...)`).
Strongly prefer to avoid writing classes to encapsulate functionality.  Write top-level functions and only export those that are meant to be used by other parts of the codebase.
Strongly prefer to avoid declaring inline functions that capture scope; declare them at the top of the module and pass in all the necessary dependencies.
If you need to combine multiple classNames, use `import classNames from 'classnames';` rather than combining them via template string.
Prefer interfaces to types where possible.

Reminder: after you finish making changes, go over them again to check whether any of them violated the style guide, and fix those violations if so.

(end of file)
