# Repair Overcoming Bias links

These REPL scripts collect current links, resolve destinations, and create patch
revisions. There are local date/title and archive-based resolver options. They
do not edit historical revisions. Run against the
development database first; the commands below select `dev lw` explicitly.

## 1. Collect and deduplicate

```sh
yarn repl dev lw packages/lesswrong/scripts/overcomingBiasLinks/collect.ts 'collectOvercomingBiasLinks("/tmp/ob-links.json")'
```

The inventory contains deduplicated URLs, affected Posts/Comments IDs, and any
content parsing errors. Collection includes both `contents_latest` and the most
recent revision, so unpublished edits are included. It scans in batches without
an age cutoff and excludes obsolete historical revisions. HTTP/HTTPS, www/apex,
and fragment variants share one lookup; distinct query strings remain distinct.
Only hyperlink destinations are collected, not images or URLs quoted as text.

## 2a. Resolve dated post links locally (fast)

```sh
yarn repl dev lw packages/lesswrong/scripts/overcomingBiasLinks/resolveByDateAndTitle.ts 'resolveOvercomingBiasLinksByDateAndTitle("ob-links.json", "ob-date-targets.json")'
```

This uses the existing inventory and only reads the database. It makes one
projected Posts query per URL month, with progress after every month, and makes
no archive.org requests. Choose a **new output filename**; existing files are
never overwritten, including the archive checkpoint.

The historical URLs contain a year and month, so the date condition is the same
UTC calendar month as `postedAt`, not an inferred day. If a URL includes an
explicit day, that day must match too. Only published, approved, listed posts
are candidates. Matching checks the post's current title and slug after case,
accent, punctuation, and separator normalization. It also generates the old
15-character TypePad slug truncations. It does not use arbitrary short prefixes,
edit distance, or dates outside the URL's date range. Changed titles that no
longer resemble the old slug may remain unmatched.

Only one distinct matching post produces `status: "resolved"` and a current LW
post URL. Multiple matches produce `status: "error", reason: "ambiguous"`, with
all candidate IDs, titles, dates, and which fields matched. Zero matches produce
`status: "not-found", reason: "no-match"`. Other URLs are marked
`reason: "not-a-dated-post-link"`. Query strings and fragments, author/tag/search/
archive/about pages, and images are excluded from this resolver.

Each result includes `method: "date-title"` so it is identifiable as an inferred
match. Review its `date` and `candidates` evidence before using the file in the
rewrite step. Existing inventories strip fragments; inferred mappings therefore
also carry `excludeFragments: true`. The rewrite step checks the original link
and leaves fragment-bearing links unchanged, including potential comment links.
This rule applies to these inferred mappings; archived redirect mappings retain
their existing fragment behavior.

Use the new file directly for a rewrite preview:

```sh
yarn repl dev lw packages/lesswrong/scripts/overcomingBiasLinks/rewrite.ts 'rewriteOvercomingBiasLinks("ob-links.json", "ob-date-targets.json", "/tmp/ob-date-preview.jsonl")'
```

The local output is separate from the archive checkpoint. A local `no-match`
means the date/title method found nothing; it does not mean archive.org has no
redirect. The database must contain the historical posts for matches to be found.

## 2b. Recover redirects and canonicalize targets with archive.org

```sh
yarn repl dev lw packages/lesswrong/scripts/overcomingBiasLinks/resolve.ts 'resolveOvercomingBiasLinks("/tmp/ob-links.json", "/tmp/ob-targets.json")'
```

The resolver queries the Internet Archive's [CDX API](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)
for exact-URL 301 captures, preferring captures near the end of 2022. Public CDX
does not expose the redirect Location field, so it reads replay response headers
and applies the LessWrong target filter there. It does not follow redirects to
the live OB site. Captures with non-LW targets are left alone.

Legacy `/lw/<base36-id>/...` targets are resolved through the database using the
same ID mapping as LW's redirect routes, producing absolute current post URLs.
Modern post targets get their current slug from the database too. A missing
post/comment is an error, not an invented target. The database being used must
contain the destination posts (a partial dev database may not).

Requests are sequential, default to a two-second interval, time out after 30
seconds, and retry network errors, 429s, and server errors with backoff. Results
are atomically checkpointed after each URL. Rerunning skips resolved URLs and
`not-found` entries and retries `error` entries. To retry missing entries too:

```ts
await resolveOvercomingBiasLinks("/tmp/ob-links.json", "/tmp/ob-targets.json", { retryNotFound: true });
```

Progress is printed when each URL starts, CDX returns, each capture is checked,
a request fails/retries, and a result is checkpointed. A heartbeat every 30
seconds identifies the current phase while waiting. Output includes elapsed
time, an approximate remaining time based on this run's rate, and final status
counts. Estimates can vary substantially with the number of captures per URL.
HTTP 429 retries wait at least a minute and honor a longer `Retry-After` header.

By default a lookup checks at most 10 captures and has a five-minute archive
request budget, including retry waits. Hitting either limit is a retryable
`error`, never a definitive `not-found`. Increase `maxCaptures` or `urlTimeoutMs`
for a later pass over difficult URLs. Database target resolution is outside the
archive request timeout; the heartbeat identifies that phase too.

To process the remaining untouched URLs without retrying previous errors first:

```ts
await resolveOvercomingBiasLinks("ob-links.json", "ob-targets.json", { retryErrors: false });
```

Stop the old REPL process and start a fresh REPL to load script changes. Saved
checkpoint entries survive interruption; the current unfinished URL is retried.
Keep the same output filename to resume. The checkpoint's modification time and
number of entries also indicate progress for older runs without console output.

Review the target file, including `archivedTarget`, `snapshot`, and errors. Only
entries with `status: "resolved"` and a valid current LW post URL are rewritten.
Do not run concurrent resolvers writing the same checkpoint file.

## 3. Preview, then apply

```sh
yarn repl dev lw packages/lesswrong/scripts/overcomingBiasLinks/rewrite.ts 'rewriteOvercomingBiasLinks("/tmp/ob-links.json", "/tmp/ob-targets.json", "/tmp/ob-preview.jsonl")'
```

Dry-run is the default. The JSONL report identifies base revisions, draft status,
proposed versions, URL replacements, and per-document errors. Affected documents
are reread when applying, rather than using stale contents from the inventory.

```sh
yarn repl dev lw packages/lesswrong/scripts/overcomingBiasLinks/rewrite.ts 'rewriteOvercomingBiasLinks("/tmp/ob-links.json", "/tmp/ob-targets.json", "/tmp/ob-applied.jsonl", { dryRun: false })'
```

The writer handles raw HTML, CkEditor markup, and both object and string forms of
DraftJS. It updates both rendered HTML and editable source; anchor text, image
URLs, and quoted URLs are not rewritten. HTML is parsed with the same helper as
the image-rehosting infrastructure and may be reserialized when a link changes.
Source fragments survive unless the archived destination supplies a fragment.
An HTML-only import without editable source gets equivalent HTML source.

Each document is handled in a serializable transaction, locking its current
revision and document. Serialization conflicts and other errors roll back that
document and appear in the report; rerun to retry. Writes append revisions and
update the current pointer, comment content cache, and pingback index together.
Post side-comment caches are invalidated. Maintenance writes deliberately bypass
user-edit callbacks, notifications, moderation, and image uploading. Original
publication dates and the document's draft status are retained.

`contents_latest` is the base for the current content, not simply the newest
revision. A separate newer draft is repaired independently and stays a draft.
When only published content changes, that newer draft is reappended unchanged
so the editor still selects the author's unpublished work. If only the draft
changes, the published pointer does not move. Rerunning after success creates no
additional revisions. Inconsistent pointers or comment caches are reported for
inspection rather than overwritten.

Other editors (including Lexical/Yjs collaborative state) are reported as errors
when they require rewriting. Repairing those requires an editor-aware migration;
this script does not silently change their rendered HTML alone. CkEditor cloud
documents are not updated; a subsequent cloud/editor save can reintroduce an old
link, so repeat collection after the migration if necessary. Inspect errors from
all three stages; unresolved mappings intentionally leave existing links intact.

Unit tests:

```sh
yarn unit overcomingBiasLinks --runInBand
```
