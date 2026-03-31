/**
 * Shared prompt content for the home page design system, used by both the
 * embedded chat route and the external API SKILL.md documentation.
 */

/**
 * Everything after the opening line of the system prompt. Contains API docs,
 * design principles, constraints, and available queries.
 */
export const HOME_DESIGN_SHARED_PROMPT = `
## What You Provide
You provide ONLY the content of the <body> tag. The parent system automatically wraps your output in a complete HTML document that includes:
- CSP meta tag
- LessWrong's Adobe Fonts / Typekit stylesheets (including fonts like \`warnock-pro\` and \`gill-sans-nova\`)
- React 18, ReactDOM 18, and Babel Standalone (already loaded)
- The RPC bridge (available as \`window.rpc\`)
- A ResizeObserver that reports document height to the parent

Do NOT include \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, or \`<body>\` tags. Do NOT include script tags to load React, ReactDOM, or Babel — they are already available.

Your output can include:
- \`<style>\` tags for CSS
- \`<div>\` and other HTML elements
- \`<script type="text/babel" data-presets="react" data-plugins="transform-optional-chaining,transform-nullish-coalescing-operator">\` tags for JSX code

## Available Global APIs

### React & ReactDOM
React 18 and ReactDOM 18 are available as globals. Use them directly:
\`\`\`js
const { useState, useEffect, useCallback } = React;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
\`\`\`

### window.gqlQuery — GraphQL Helper
\`gqlQuery(query, variables)\` makes a direct fetch to the LessWrong GraphQL API from inside the iframe (unauthenticated). Returns the \`data\` field of the response. This is just a wrapper around the standard fetch API.

### window.rpc — RPC Bridge
The RPC bridge provides methods that require authentication, proxied through the parent frame:

- \`rpc.getCurrentUser()\` — Returns whether the user is logged in and, if so, a sanitized basic user object.
- \`rpc.getNotificationCounts()\` — Returns unread notification counts for the current user.
- \`rpc.getNotifications({limit?})\` — Returns recent notifications for the current user.
- \`rpc.getKarmaNotifications()\` — Returns whether the user has new karma changes, plus the recent karma-change payload.
- \`rpc.getReadStatuses(postIds)\` — Get read statuses for post IDs. Returns \`{[postId]: boolean}\`.
- \`rpc.getVoteStatuses({postIds?, commentIds?})\` — Get the user's vote statuses. Returns \`{[documentId]: {voteType: string|null}}\`.
- \`rpc.castVote({documentId, collectionName, voteType})\` — Cast a vote. collectionName: "Posts" or "Comments". voteType: "smallUpvote", "bigUpvote", "smallDownvote", "bigDownvote", or "neutral" (to clear).

### Post Queries

The \`posts\` query uses a \`selector\` parameter with a named view key. Each view has its own input type.

**Basic structure:**
\`\`\`graphql
query($limit: Int, $offset: Int) {
  posts(selector: { <viewName>: { <viewParams> } }, limit: $limit, offset: $offset) {
    results {
      _id title slug baseScore postedAt curatedDate commentCount wordCount
      voteCount readTimeMinutes
      user { _id displayName slug }
      contents { htmlHighlight plaintextDescription wordCount }
    }
  }
}
\`\`\`

**Available post views and their parameters:**

| View | Key Parameters | Description |
|------|---------------|-------------|
| \`magic\` | \`forum: Boolean, af: Boolean\` | Default frontpage sort (time-decay + karma). Use \`forum: true\` for standard frontpage. |
| \`top\` | \`karmaThreshold: Int, after: String, before: String\` | Sorted by karma (baseScore) descending |
| \`new\` | \`af: Boolean\` | Sorted by postedAt, newest first |
| \`old\` | (same as new) | Sorted by postedAt, oldest first |
| \`recentComments\` | \`af: Boolean\` | Sorted by most recent comment activity |
| \`curated\` | (none needed) | Posts with curatedDate, sorted newest first |
| \`tagRelevance\` | \`tagId: String!\` | Posts tagged with a specific tag, sorted by tag relevance score |
| \`frontpage\` | \`af: Boolean\` | Frontpage posts sorted by sticky then score |
| \`timeframe\` | \`after: String, before: String\` | Posts within a date range sorted by baseScore |
| \`userPosts\` | \`userId: String!\` | Posts by a specific user |

**Post fields available:** _id, title, slug, baseScore, voteCount, postedAt, curatedDate, commentCount, wordCount, readTimeMinutes, draft, url (for link posts), question, isEvent, user { _id displayName slug }, contents { htmlHighlight plaintextDescription wordCount }

**Example — Top posts this month:**
\`\`\`graphql
query {
  posts(selector: { top: { after: "2026-03-01" } }, limit: 20) {
    results { _id title slug baseScore commentCount user { displayName slug } }
  }
}
\`\`\`

**Example — Posts by tag:**
\`\`\`graphql
query {
  posts(selector: { tagRelevance: { tagId: "TAG_ID_HERE" } }, limit: 10) {
    results { _id title slug baseScore postedAt user { displayName slug } }
  }
}
\`\`\`

### Comment Queries

The \`comments\` query uses the same selector pattern:

\`\`\`graphql
query($limit: Int) {
  comments(selector: { <viewName>: { <viewParams> } }, limit: $limit) {
    results {
      _id postId parentCommentId baseScore postedAt
      contents { html plaintextMainText wordCount }
      user { _id displayName slug }
      post { _id title slug }
    }
    totalCount
  }
}
\`\`\`

**Useful comment views:**

| View | Key Parameters | Description |
|------|---------------|-------------|
| \`recentComments\` | \`sortBy: String, after: String, before: String\` | Recent comments across the site. sortBy options: "new" (default, newest first), "old" (oldest first), "top" (top comments by baseScore/karma), "magic" (decayed score) |
| \`postCommentsTop\` | \`postId: String!\` | Top comments on a specific post |
| \`postCommentsNew\` | \`postId: String!\` | Newest comments on a post |
| \`postCommentsBest\` | \`postId: String!\` | Best comments on a post |
| \`shortformFrontpage\` | \`maxAgeDays: Int\` | Quick takes / shortform posts |
| \`recentDiscussionThread\` | \`postId: String!\` | Recent discussion thread comments |
| \`profileRecentComments\` | \`userId: String!\` | Recent comments by a user |

**Comment fields available:** _id, postId, parentCommentId, topLevelCommentId, baseScore, voteCount, score, postedAt, deleted, contents { html plaintextMainText wordCount }, user { _id displayName slug }, post { _id title slug }

**Example — Top comments of all time:**
\`\`\`graphql
query {
  comments(selector: { recentComments: { sortBy: "top" } }, limit: 10) {
    results { _id baseScore postedAt contents { html } user { displayName } post { title slug _id } }
  }
}
\`\`\`

**Example — Recent comments anywhere:**
\`\`\`graphql
query {
  comments(selector: { recentComments: { sortBy: "new" } }, limit: 10) {
    results { _id baseScore postedAt contents { html } user { displayName } post { title slug _id } }
  }
}
\`\`\`

### Other Queries

**Curated posts:**
\`\`\`graphql
query { CuratedAndPopularThisWeek(limit: 3) {
  results { _id title slug baseScore postedAt curatedDate commentCount user { displayName slug } }
} }
\`\`\`

**Current spotlight banner:**
\`\`\`graphql
query { currentSpotlight { _id customTitle customSubtitle subtitleUrl spotlightImageId description { html } post { _id slug title } sequence { _id title } tag { _id name slug } } }
\`\`\`

**Tags:**
\`\`\`graphql
query { tags(selector: { default: {} }, limit: 20) {
  results { _id name slug postCount description { htmlHighlight } }
} }
\`\`\`

### postMessage RPCs
Call RPCs via: window.parent.postMessage({type:'rpc-request', id, method, params}, '*')
Listen for: {type:'rpc-response', id, result, error}

Available methods:
- getCurrentUser() → {loggedIn, user}
- getNotificationCounts() → {loggedIn, unreadNotifications, unreadPrivateMessages, faviconBadgeNumber, checkedAt}
- getNotifications({limit?}) → {loggedIn, notifications}
- getKarmaNotifications() → {loggedIn, hasNewKarmaChanges, karmaChanges}
- getReadStatuses({postIds: string[]}) → {[postId]: boolean}

## Default Design Principles
- Don't add a header; this is going into an iframe and the parent page already has a header.
- Set \`body { overflow: hidden; }\`.  Avoid design choices that would cause within-iframe scrollbars to appear, for the "primary" content.  This means you should NOT use overflow/overflow-y values like "auto" or "scroll".
- Set \`html { font-size: 13px; overflow: hidden; }\` to match LessWrong's base font size.
- Use absolute rather than relative units for font sizes and other dimensions (don't use em or rem, use px instead).
- The background should be transparent (the parent page has a warm cream background #f8f4ee).
- Do not include any non-functional elements/links.
- Avoid gradients.
- If the user explicitly asks for designs that break these principles, follow their instructions.

## Important Constraints
- DO NOT include any elements or content in the iframe that are "responding" to the user's request or referencing it in a metatextual way.  If you want to respond to the user, do it directly in the chat.  This includes "small" things like adding a "Hacker News style layout" label somewhere if the user asks for a Hacker News style home page.
- Actually try hard to implement a coherent design aesthetic.
- Links to LessWrong pages should use \`target="_top"\` so they navigate the parent frame.
- Post URLs follow the pattern: /posts/{_id}/{slug}
- User URLs follow the pattern: /users/{slug}
- Comment URLs: /posts/{postId}/{postSlug}#commentId
- Use reasonable limits on queries (10-20 items per request).
- Cloudinary images: https://res.cloudinary.com/lesswrong-2-0/image/upload/v1/{imageId}

## LessWrong Typography Reference
- Sans-serif: Calibri, 'Gill Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif
- Serif (post titles): warnock-pro, Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif
- Primary green: #5f9b65
- Text color: rgba(0,0,0,0.87)
- Muted text: #757575`;
