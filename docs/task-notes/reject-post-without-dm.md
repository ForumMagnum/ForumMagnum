# Reject post without DM

The supermod rejection panel now offers a “Reject without DM” button for posts.
It saves any composed reason, permits an empty reason, and sends the moderator-only
`skipRejectionPM` mutation option. The server consumes this option before database
writes and skips only the rejection message callback. It does not persist the option.
Shift+R already performs “Reject Latest, Restrict, & Notify”, so it remains unchanged.

Validation: code generation passed. The new UI tests and mutation-variable tests
passed. Integration tests were added for default messaging, explicit suppression,
subsequent rejection, and field permissions, but the configured local PostgreSQL
server on port 5433 is unavailable. Type checking is blocked by an existing
`next.config.ts` error for `agentRules`. ESLint cannot load the configured
`plugin:@next/next/recommended-legacy` preset. Code generation reports existing
duplicate GraphQL fragment warnings.

Existing issue outside this change: `useRejectContent` swallows mutation errors
through its queue catch and empty `onError` handlers. The rejection composer clears
its draft immediately. A failed mutation can therefore lose the draft without
showing the moderator an error. This should be addressed in a separate change.

Concurrent changes to editor Suspense handling, moderation content rendering, and
related tests were preserved.
