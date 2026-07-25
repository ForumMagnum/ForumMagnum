# LessWrong AI Digest Email Prototype

## Status

This is an internal design and post-selection prototype for a personalized LessWrong email and its on-site companion. The admin email workbench still renders the fixed mixed-content fixture, while the selection flow chooses five real post recommendations, persists generated prototype issues, and renders them into that fixture. An admin-gated `/contentForYou` page now provides working free-text recommendation instructions, native issue rendering, issue history, and on-demand sample generation. It does not send email or select quick takes/comments dynamically.

The preview page is available at:

> `/debug/digestEmailPreview`

It exists to make the email concrete enough to evaluate its hierarchy, language, content mix, and user flows before building the recommendation pipeline.

## Product purpose

**Content for You** is a personalized AI reading assistant. Its job is to make a good, time-saving guess about what a particular LessWrong reader should read next.

The central promise is:

> Here are some worthwhile things on LessWrong that you may not have seen.

Recent personalized post recommendations are the center of the product. Quick takes, follow-ups, comments, and occasional archive matches make it more useful and more characteristically LessWrong by surfacing material that is otherwise easy to miss.

This is not intended to be:

- A shared editorial newsletter in which every recipient gets the same issue
- A separately branded publication
- A complete replacement for the site or UltraFeed
- A second recommendation feed with content independent of the email
- An AI-written essay summarizing LessWrong

The AI should select, connect, and frame original writing. The posts, quick takes, and comments should provide the substance.

## How the preview page works

The page:

- Is restricted to admins
- Fetches a server-rendered email through `DigestEmailPreview`
- Uses the current admin as the email recipient
- Loads real content referenced by `rubyAiDigestSpec`
- Displays the resulting HTML in a tall email-preview iframe
- Provides a manual **re-render** link

Manual re-rendering is necessary because the email is rendered inside a server-side GraphQL resolver. Client Fast Refresh cannot directly update the iframe, and polling would continuously reload it because every render creates a new unsubscribe token.

The fixture is intentionally explicit and deterministic. It remains the design baseline and supplies the fixed quick-take, discussion, and curated items used by the post-selection slice.

## How the on-site page works

The email's **tune your AI recommendations** link now points to:

> `/contentForYou`

The page is currently restricted to admins but is designed around the eventual reader-facing flow. It:

- Loads only the current user's issues and preferences
- Lets the reader save up to 2,000 characters of explicit content instructions
- Gives those instructions priority over behavioral inferences when they conflict
- Generates and persists a new sample issue on demand
- Shows the newest issue by default and allows browsing older editions
- Renders the stored `AiDigestSpec` as native, theme-aware site components rather than embedding email HTML
- Shows the instruction snapshot that produced each edition

Each issue records whether it was an admin sample, user preview, or scheduled edition. User previews count toward recommendation history by default because the reader has seen those selections. Admins can instead persist a generated sample as a scratch issue with `countsTowardHistory: false`; it remains browsable but is omitted from repeat-avoidance history. Both admin generation surfaces can also clear counted issues for a selected recent-day window. The generation API includes a ten-minute cooldown and a ten-per-24-hours cap for ordinary users; admins bypass those limits while the page remains an internal prototype.

## Subscription state

The nullable `Users.emailSubscribedToAiDigest` field records the Content for You subscription separately from curated emails. Existing accounts remain `null` until they opt in or out. New LW accounts use the same pre-checked signup choice for both curated emails and Content for You, including accounts created through Google or GitHub authentication.

LW users can control the field independently in notification settings. Production recipient selection must require it to be explicitly `true` and must continue to honor `unsubscribeFromAll`.

Reusable post summaries are populated independently, without a reader dossier. First smoke-test a two-post batch:

> `yarn repl dev lw packages/lesswrong/server/scripts/populateAiDigestPostSummaries.ts 'populateAiDigestPostSummaries({ limit: 2, concurrency: 2 })'`

Then populate all missing summaries with bounded concurrency and progress reporting:

> `yarn repl dev lw packages/lesswrong/server/scripts/populateAiDigestPostSummaries.ts 'populateAiDigestPostSummaries()'`

After that job has populated exact Fable cache entries, the one-user post-selection preview is generated with:

> `yarn repl dev lw packages/lesswrong/server/scripts/generateAiDigestPostSelectionPreview.tsx 'generateAiDigestPostSelectionPreview("developer-user-slug")'`

It writes display-ready JSON and rendered HTML to ignored files under `tmp/ai-digest/`. The JSON includes the newly persisted issue ID and bounded history counts. Terminal output contains only artifact paths, source counts, the issue ID, and selected titles—not the prompt or reader dossier. Repeating the preview for the same account exercises recommendation-history behavior.

## Current email design

### Inbox presentation

The subject is led by the strongest selected item:

> **[Lead title] — plus N more**

The preheader names other real contents, ideally including the second post and a distinctive quick take, follow-up, or comment.

There is no issue-level editorial title. The subject and preheader provide issue-specific identity; the recurring masthead and structure provide product identity.

The current numeric count covers the ten substantive selections and excludes the two quiet recent-curation links. Whether that is sufficiently clear remains an open copy decision. Subject, preheader, count, and AI Note references must eventually be generated and validated from the final rendered slate.

### Masthead and opening

The email opens with:

- The compass rose
- **LessWrong** as the primary wordmark
- **Content for You** as a small-caps product label beneath it
- A right-aligned **unsubscribe** entry, currently linked to notification settings until a dedicated product control exists

It is followed by a pale-sage AI Note. The note:

1. Begins with a small-caps **From the AI assistant · [model]** label
2. Lists the themes currently driving the recommendations
3. Mentions a few distinctive contents and why they are included
4. Offers **tune your AI recommendations** and a quieter **what is this?** explainer link

The model speaks provisionally—“I think” and “currently”—rather than presenting inferred interests as permanent facts.

The current fixture note is deliberately short enough to bring the first recommendation earlier on mobile.

### Issue structure

The prototype contains ten substantive units plus up to two quiet recent-curation links:

1. **Recommended for you**
   - Two dominant posts
   - Three less-emphasized posts
   - One substantial quick take
2. **Picking up threads**
   - Up to two compact follow-ups
3. **From the discussion**
   - Two truncated comment threads
4. **Recently curated**
   - Up to two low-emphasis text links

The hierarchy matters more than filling every slot. Optional sections should shrink or disappear rather than include weak material.

The typical issue should be roughly 70–80% recent content. Older items should appear only when their personal relevance is unusually strong or they provide necessary context for a sequel, rebuttal, or renewed discussion.

### Posts

Dominant posts contain:

- Optional social-preview image
- Title and author
- A substantial author-written excerpt
- A wrapping footer with a linked **Read more (N words)** action and, when useful, a right-aligned italic personalized reason that moves to the next line when needed

Less-emphasized posts contain the same basic information with shorter excerpts, smaller typography, and optional thumbnails.

Titles, bylines, excerpts, images, and final actions link to the underlying item. The linked title and final action intentionally duplicate the destination. A faint rule separates each card footer from its content, and the action communicates the remaining reading commitment.

The remaining count must be computed from the actual text displayed in the email. The current prototype approximates it by subtracting the displayed description excerpt from the stored post word count; this will only be accurate once the excerpt is a literal selected passage from the post.

### Quick takes

Quick takes borrow their basic treatment from the dedicated front-page **Quick Takes** section:

- Username and date, with a quiet **Quick take** pill right-aligned on the same row
- Short sans-serif body excerpt
- A footer with **Read more** and, when useful, a right-aligned italic personalized reason

The pill is needed because the email lacks the surrounding section context that identifies these items on the site. Metadata uses spacing and tone rather than dot separators. The username/date, body excerpt, and footer action are linked so the item has useful click targets throughout the card.

Quick takes are always deliberately truncated. LessWrong quick takes can be arbitrarily long, so “show the complete quick take” cannot be a general rule.

### Comment threads

Discussion items contain:

- A compact **Comments on “[post title]”** heading
- A selected root comment
- Zero or more selected replies as individually indented cards
- A footer with **View thread** and, when useful, a right-aligned italic personalized reason

Every displayed comment links to its exact site comment. Replies are ordered from their actual `parentCommentId` relationships and chronological sibling order; selected comments that cannot be connected to the displayed root are omitted.

Comments are always truncated to deliberate limits. The email should provide enough original writing to be useful without allowing an unusually long comment to dominate the issue.

### Recent curation

The final **Recently curated** module is visually demoted with a small-caps label and hairline rule. It contains at most two compact title-and-author links.

The generator should filter out posts the recipient has read or previously received. The visible email should not call them “unread,” because read state can change between issue generation and email opening.

This module is quiet recirculation and a quality floor. It should not displace stronger personalized recommendations.

## Settled design decisions

### Identity

- Use the stacked **LessWrong** / **Content for You** masthead rather than inventing a newsletter name.
- Do not add a unique issue title or a greeting.
- Use a lead-item subject and content-bearing preheader.
- Keep the AI assistant visible and correctable rather than hiding its role.

### Content

- Start with a weekly product.
- Keep the current ten-unit hierarchy.
- Prioritize recent unseen posts.
- Include substantial original text inside the email.
- Prefer author-written excerpts over AI descriptions.
- Never assume comments or quick takes can be shown untruncated.
- Keep recent-curation links visually subordinate.
- Use the persisted issue as the shared email/on-site snapshot; do not create a second recommendation feed with independent selections.

### Personalized reasons

- Reasons mean “why this for you,” not “what this item says.”
- The issue-level AI Note carries broad theme-level explanation.
- Per-item reasons are optional when the relationship is already obvious.
- Every displayed reason sits in the item footer so the original content stays first.
- Reasons should be grounded in the structured evidence supplied to the selection model.
- Placeholder reasons in the fixture are not examples of production-ready quality.

Useful reason types include:

- A sequel or rebuttal to a named post the recipient read
- A strong late comment on a post they read
- A new item from an author they follow
- An older treatment of a question recurring in recent reading
- A well-grounded selection outside the main themes

The system should not reveal a specific private vote or claim participation when it only knows that someone read a thread.

### Feedback and preferences

- Use one prominent **tune your AI recommendations** control in the AI Note.
- Do not add recommendation-quality controls to every card.
- The tuning form may still list the issue’s individual selections.
- Free-text personal instructions are the first working tuning control and outrank conflicting inferred preferences.
- Let readers save instructions without generating, or save and generate a new sample immediately.
- Thumbs are unsuitable because they can be mistaken for votes on the underlying content.
- The email needs a direct way to disable **Content for You** and, if multiple cadences are eventually supported, change its cadence without unsubscribing from all LessWrong email.

### Visual design

- Use one approximately 600-pixel column.
- Use a cream backdrop and white, slightly rounded content cards.
- Use strong serif post titles and quiet sans-serif metadata, reasons, quick takes, and comments.
- Use LessWrong green sparingly for rules, links, and the AI Note treatment.
- Treat images as optional enhancement rather than required structure.
- Keep the email fully comprehensible when images are blocked.
- Use the post-page AI-block font treatment for the AI Note, with Cronos Pro as an optional enhancement and a deliberate Calibri/Gill Sans fallback as the baseline.
- Use ETBook/Warnock-style serif stacks for the wordmark and post typography, with Palatino and Georgia fallbacks.
- Use spacing and color changes rather than dot characters to separate metadata.
- Use faint footer hairlines to distinguish item content from reading actions and optional reasons.

## Recommendation and generation direction

The renderer accepts display-ready literal excerpts:

- `AiDigestItem.excerpt` selects the passage for a post, quick take, or root comment.
- `AiDigestItem.threadComments` contains selected reply IDs and optional literal excerpts for each reply.
- If an excerpt is absent, the design fixture falls back to the current description or comment text and truncates it defensively.

Production generation should always provide deliberate excerpts. The fallback exists to keep incomplete fixtures and failure states renderable; it is not the intended content-selection strategy.

### Implemented post-selection slice

The one-user prototype now has four stages:

1. Load a bounded reader dossier and a deterministic recent-post pool.
2. Reuse or generate versioned, non-personalized summaries in `PostSummaries`.
3. Ask a gateway model for exactly five ranked post IDs, optional reasons, subject, preheader, and one to three AI Note paragraphs, using the reader's explicit content instructions when present.
4. Validate that it returned five distinct supplied post IDs within the copy-length budgets before replacing the fixture’s five post recommendations.

Positions 1–2 become headline posts and positions 3–5 become compact posts. The fixture’s quick take, follow-ups, discussion threads, and curated links remain unchanged. This slice intentionally relies on the renderer’s excerpt fallback; literal excerpt selection is future work.

### Bounded reader dossier

The dossier includes account age, total and recent read counts, read-share calibration, top authors and overlapping top topics read, recent reads, recent upvotes (regular or strong), recent authored and commented-on posts, read-age buckets, active generalized `seeLess` feedback, and deduplicated author subscriptions.

Each signal has source/window metadata. Topic counts deliberately overlap, and the model receives total-read calibration rather than a potentially misleading percentage on every row.

The dossier excludes tag subscriptions, bookmarks, frontpage tag filters, annual-review votes, general UltraFeed served/viewed/expanded/interacted state, tagging activity, searches/clicks/shares, notifications, author suppressions, and raw analytics.

Upvotes can affect selection and support wording such as “related to a post you liked.” User-visible copy should not say that the recipient upvoted, strongly upvoted, or cast a vote on a particular post.

### SQL-only candidate policy

The pool is loaded directly from PostgreSQL, not Recombee or UltraFeed ranking. The prototype uses a 14-day window, karma of at least 20, and a deterministic cap of 60 posts; callers may override them. The production target is a 28-day pool once cost and operational behavior are validated.

Selection may also retrieve additional posts via the embedding search tool (`searchPosts`) against `PostEmbeddings`. Tool-discovered posts use the same eligibility predicate as the recent pool, keep the karma ≥ 20 floor, have no age limit, return titles/metadata only (no summaries), and must be read with `readPost` before selection. Already-read posts are dropped from search results by default. Their retrieval provenance is `selectionToolSearch`, and validated selections may mix recent-pool and tool-discovered IDs. Sequel/rebuttal-style relatedness to posts the reader already engaged with is not a model-initiated tool call; if that case is needed later, the server should precompute similar candidates and supply them in the corpus.

The helper audit produced this explicit policy:

- `isRecombeeRecommendablePost`: retain the recommendation opt-out, About-post, shortform, event, and approved-status intent; do not inherit its blanket `groupId` exclusion.
- `getViewablePostsSelector`: retain approved, non-draft, non-future, listed, reviewed-author, hidden-related-question, and publication-date safeguards.
- Posts default view: do not inherit its `groupId`/personal-blog behavior, dynamic filters, frontpage requirements, or sorting behavior.
- `PostsRepo.getPostReadStatuses`: do not call it, because it broadens “read” with UltraFeed activity. Exclude only `ReadStatuses.isRead = true`.
- `accessFilterMultiple`: always apply it last as a recipient-specific safety guard, but do not let admin, owner, organizer, or sharing access define eligibility.

Candidates must be approved, published, non-draft, non-future, non-unlisted, from reviewed authors, not established-accounts-only, recommendation-enabled, non-event posts with a current stored contents revision. The About post, shortform containers, hidden related questions, exact hidden/active-`seeLess` posts, and the recipient’s own or coauthored posts are excluded.

The policy intentionally allows read, upvoted, and previously included posts. Each candidate carries separate current-read, `upvoteStrength`, prior-inclusion-count, and most-recent-inclusion annotations. These are ranking signals rather than hard exclusions, so the model can avoid needless repetition while retaining an unusually relevant prior recommendation. It also allows logged-in-only posts, public non-event local-group posts, personal-blog posts, link posts, questions, dialogues/debates, meta posts, and podcast posts with enough stored content to summarize. It does not filter on `submitToFrontpage`, `frontpageDate`, `noIndex`, sticky/default-recommendation state, bookmarks, author suppressions, notification history, onsite recommendation history, or general UltraFeed activity. Curated status is candidate quality metadata, not forced inclusion.

### Reusable summaries and validation

`PostSummaries` is keyed by post, immutable contents revision, model ID, and summary-prompt version. A post edit, model change, or prompt-version change causes a cache miss; successful summaries are reused across readers. The independent summary REPL loads every globally eligible 14-day/20-karma target and generates only missing `anthropic/claude-fable-5` summaries. It supports small smoke-test limits, uses bounded concurrency, reports progress, and returns compact counts rather than printing every generated summary.

Summary generation receives only the post title, displayed author, and bounded stored post text. It receives no reader dossier. Posts without enough stored text for a useful summary are omitted from the model pool.

Per-user newsletter creation never generates summaries. It loads only the exact expected Fable/revision/prompt cache key, omits cache misses, and reports the missing count. The selection model sees direct post IDs, cached summaries, bounded reader evidence, bounded past recommendations, optional embedding-search tool results, and explicit untrusted-data delimiters. Validation rejects duplicate or unknown post IDs (IDs must come from the recent pool or the tool-discovered registry) and copy exceeding fixed budgets.

`AiDigestIssues` stores each prototype issue’s recipient, ordered selected post IDs, generation time, trigger, `countsTowardHistory` flag, personal-instruction snapshot, selection model, prompt version, and display-ready spec. Only the newest bounded set with `countsTowardHistory: true` is loaded for recommendation history. It supplies per-post inclusion counts and dated past recommendations; read and upvote outcomes count only when their interaction timestamp follows that recommendation. A generated issue is inserted only after deterministic model-output validation and spec assembly succeed.

## Privacy and trust

Reading history, follows, votes, and digest behavior may influence ranking, but user-visible explanations must be careful about what they expose.

In particular:

- Do not put user-attributable vote rows in logs, prompts shown in tooling, fixtures, terminal output, or debug pages.
- Do not expose a particular private vote in a reason.
- Do not log full user dossiers or prompts containing sensitive behavioral detail.
- Evaluate using developer-owned accounts, synthetic users, or explicitly consenting users.
- Phrase inferred themes as a correctable current model rather than a statement of identity.

## Planned work

### Make the prototype a real product

- Expand candidate generation beyond the recent SQL pool only when each new source has an explicit newsletter policy.
- Generate the full mixed-content slate rather than preserving fixed quick takes/comments.
- Generate numeric counts from the final mixed-content slate.
- Validate all note and reason claims against structured evidence.
- Populate the display-ready excerpt fields with literal, useful author-written passages.
- Compute remaining-word counts from those exact excerpts.
- Tune repetition using prior inclusion and observed post-recommendation outcomes.
- Deduplicate against relevant notification emails.
- Record enough issue context to render and explain the shared email/on-site issue.

### Complete the user flows

- Build the **What is Content for You?** explainer.
- Let the form correct inferred themes, content mix, and individual selections.
- Expand the current save confirmation to explain how structured feedback changes future recommendations.
- Decide whether launch supports only weekly or exposes cadence settings.

### Improve the design

- Continue checking narrow-screen horizontal overflow.
- Test compact post thumbnails, footer reasons, and the masthead at common mobile widths.
- Decide whether numeric subject counts include quiet curation links or avoid brittle counts.
- Improve deliberate excerpt selection and sentence boundaries.
- Replace all placeholder reasons with realistic grounded examples.
- Resolve what the displayed model attribution represents.

### Handle edge cases

- Sparse-signal and new users
- Lapsed users with old but useful preference data
- Fewer than ten worthwhile recommendations
- Empty optional sections
- Missing, deleted, or newly inaccessible content
- Content removed after subject or note generation
- No suitable personalized reason
- No suitable social-preview image

Sending fewer items—or skipping a week—is preferable to manufacturing personalized-sounding filler.

### Harden the email

- Verify Gmail, Apple Mail, Outlook desktop, Outlook web, and common mobile clients.
- Provide email-safe fallbacks for the compass and tune icons.
- Check dark-mode recoloring.
- Verify typography and hierarchy without custom fonts.
- Verify comprehension with images disabled.
- Fix unnamed or undersized interactive targets.
- Keep rendered HTML below Gmail’s clipping threshold.
- Verify the plain-text email.

### Measurement and rollout

- Attribute item clicks to recommendation records.
- Treat open tracking as unreliable.
- Feed explicit tuning responses and useful click signals into future selection.
- Start with active readers and a deliberately sampled lapsed cohort.
- Evaluate selection quality, unsupported-reason rate, click quality, disable rate, and deliverability before expanding.

As of July 2026, roughly 52,875 accounts meet the existing curated-email eligibility criteria, but only about 5,000 have read onsite content in the last 30 days and about 13,000 in the last 180 days. Audience selection is therefore both a recommendation-quality decision and the largest model-cost lever.

## Explicitly deferred

- Daily and monthly variants
- A second personalized feed
- Per-item feedback controls inside the email
- Whole-newsletter AI narration
- Generic engagement statistics and streaks
- Mandatory or generated editorial images
- “Someone asked a question you could answer”
- Shared “disagreement of the week” editorial packages

## Code map

- Preview route: `app/debug/digestEmailPreview/page.tsx`
- Preview page: `packages/lesswrong/components/notifications/DigestEmailPreviewPage.tsx`
- Email iframe: `packages/lesswrong/components/notifications/EmailPreview.tsx`
- GraphQL preview resolver: `packages/lesswrong/server/resolvers/digestEmailPreviewResolver.tsx`
- Email component: `packages/lesswrong/server/emailComponents/AiDigestEmail.tsx`
- Fixture and design data: `packages/lesswrong/server/emailComponents/AiDigestSpec.ts`
- Email renderer: `packages/lesswrong/server/emails/renderEmail.tsx`
- On-site route: `app/contentForYou/page.tsx`
- On-site page and preference editor: `packages/lesswrong/components/aiDigest/ContentForYouPage.tsx`
- Native issue renderer: `packages/lesswrong/components/aiDigest/AiDigestIssueView.tsx`
- Shared display helpers: `packages/lesswrong/lib/aiDigest/aiDigestDisplay.ts`
- On-site issue and generation API: `packages/lesswrong/server/resolvers/contentForYouResolvers.ts`
- Candidate and dossier loader: `packages/lesswrong/server/aiDigest/aiDigestPostCandidates.ts`
- Summary cache and independent population pipeline: `packages/lesswrong/server/aiDigest/aiDigestPostSummaries.ts`
- Recommendation history and issue persistence: `packages/lesswrong/server/aiDigest/aiDigestHistory.ts`
- Selection prompt: `packages/lesswrong/server/aiDigest/aiDigestPostSelectionPrompt.ts`
- Selection, validation, and spec mapping: `packages/lesswrong/server/aiDigest/aiDigestPostSelection.ts`
- Summary population script: `packages/lesswrong/server/scripts/populateAiDigestPostSummaries.ts`
- One-user preview script: `packages/lesswrong/server/scripts/generateAiDigestPostSelectionPreview.tsx`
- Subscription schema: `packages/lesswrong/lib/collections/users/newSchema.ts`
- Subscription settings control: `packages/lesswrong/components/users/account/NotificationsSettingsTab.tsx`

After changing the email component or fixture, use **re-render** on the debug page. Run `yarn generate` after changing GraphQL fragments or definitions.
