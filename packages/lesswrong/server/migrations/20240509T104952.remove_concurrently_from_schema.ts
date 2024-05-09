/**
 * Generated on 2024-05-09T10:49:52.862Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 07ac203467..288f19cb99 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c48644210bc21cad0c73a5a309d4d8c7
 * -
 * --- Accepted on 2024-05-09T09:37:25.000Z by 20240509T093725.set_not_null_clientId.ts
 * +-- Overall schema hash: 4d21d3ccc260a536fc4df5c23028310e
 *  
 * @@ -163,3 +161,3 @@ CREATE INDEX IF NOT EXISTS "idx_ClientIds_schemaVersion" ON "ClientIds" USING bt
 *  -- Index "idx_idx_ClientIds_clientId_unique" ON "ClientIds", hash: eaaaa160ee8b6a916d50500ee59feca7
 * -CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_idx_ClientIds_clientId_unique" ON "ClientIds" USING btree ("clientId");
 * +CREATE UNIQUE INDEX IF NOT EXISTS "idx_idx_ClientIds_clientId_unique" ON "ClientIds" USING btree ("clientId");
 *  
 * @@ -2763,6 +2761,6 @@ CREATE OR REPLACE FUNCTION fm_get_user_profile_updated_at(userid TEXT)
 *  
 * --- Custom index, hash: 285491f99ba96895e0240f3dbb5121e3
 * +-- Custom index, hash: da3f430da13dbd4c9ddc18b1ab8c8ae8
 *  CREATE UNIQUE INDEX IF NOT EXISTS "idx_DatabaseMetadata_name" ON public. "DatabaseMetadata" USING btree (name);
 *  
 * --- Custom index, hash: 635b040ef20149755985c607b7225f9a
 * +-- Custom index, hash: 54bb4c2974a23c0a327d3a8779ccade6
 *  CREATE UNIQUE INDEX IF NOT EXISTS "idx_DebouncerEvents_dispatched_af_key_name_filtered" ON public. "DebouncerEvents" USING btree (dispatched, af, key, name)
 * @@ -2770,9 +2768,9 @@ WHERE (dispatched IS FALSE);
 *  
 * --- Custom index, hash: 15a2130dd3573fdfb01313fa47e011fe
 * +-- Custom index, hash: 6a209913026afa35083f82c289d9cdd4
 *  CREATE UNIQUE INDEX IF NOT EXISTS "idx_PageCache_path_abTestGroups_bundleHash" ON public. "PageCache" USING btree (path, "abTestGroups", "bundleHash");
 *  
 * --- Custom index, hash: 7940ec7f3b1c0c61640593a8b967b11a
 * +-- Custom index, hash: 39162968c5c0ac082775ff575b6bd9d7
 *  CREATE UNIQUE INDEX IF NOT EXISTS "idx_ReadStatuses_userId_postId_tagId" ON public. "ReadStatuses" USING btree (COALESCE("userId", ''::character varying), COALESCE("postId", ''::character varying), COALESCE("tagId", ''::character varying));
 *  
 * --- Custom index, hash: c3f68f7dcf187a6ba539c6be362c99e1
 * +-- Custom index, hash: bc0df52f3c7ff920270f802194707374
 *  CREATE INDEX IF NOT EXISTS "idx_Users_tsvector_jobTitle" ON "Users" (TO_TSVECTOR('english', "jobTitle"))
 * @@ -2781,3 +2779,3 @@ WHERE
 *  
 * --- Custom index, hash: d653b1858ed7e8e0507c8e653989b089
 * +-- Custom index, hash: 1d867d9cffeb44629a3ea1c97c24ba4c
 *  CREATE INDEX IF NOT EXISTS "idx_Users_tsvector_organization" ON "Users" (TO_TSVECTOR('english', "organization"))
 * @@ -2786,3 +2784,3 @@ WHERE
 *  
 * --- Custom index, hash: 4cc064bb1373509253221ee460b211cf
 * +-- Custom index, hash: 7e613b9b7b6aed72549ce04b7d398342
 *  CREATE INDEX IF NOT EXISTS "idx_Users_tsvector_mapLocationAddress" ON "Users" (TO_TSVECTOR('english', "mapLocation" ->> 'formatted_address'))
 * @@ -2791,3 +2789,3 @@ WHERE
 *  
 * --- Custom index, hash: a9db8a3bab744e9c97e5bf159225360b
 * +-- Custom index, hash: b565fc5ebc7b02b28935606cba53d326
 *  CREATE INDEX IF NOT EXISTS "idx_Comments_postId_promotedAt" ON "Comments" ("postId", "promotedAt")
 * @@ -2796,6 +2794,6 @@ WHERE
 *  
 * --- Custom index, hash: 73d35bda4c7346b2794c27dedcc915ad
 * +-- Custom index, hash: 0ccdd8c2f93f3ca1c32ea682c508f2cd
 *  CREATE INDEX IF NOT EXISTS "idx_Comments_userId_postId_postedAt" ON "Comments" ("userId", "postId", "postedAt");
 *  
 * --- Custom index, hash: 9d6cc0dcc2fa817f1269426b61160ed5
 * +-- Custom index, hash: 46099a20aacc0f79e7cbae7202e5bceb
 *  CREATE INDEX IF NOT EXISTS idx_comments_popular_comments ON "Comments" ("postId", "baseScore" DESC, "postedAt" DESC)
 * @@ -2806,3 +2804,3 @@ CREATE INDEX IF NOT EXISTS idx_posts_pingbacks ON "Posts" USING gin (pingbacks);
 *  
 * --- Custom index, hash: 4338faf7463bec37539a3135a1e9910f
 * +-- Custom index, hash: 866d9ca4cc1096bd4bce50bf8b8249c1
 *  CREATE INDEX IF NOT EXISTS "idx_Posts_max_postedAt_mostRecentPublishedDialogueResponseDate" ON "Posts" (GREATEST ("postedAt", "mostRecentPublishedDialogueResponseDate") DESC)
 * @@ -2811,3 +2809,3 @@ WHERE
 *  
 * --- Custom index, hash: 603f80dc36b22b97c313af3eb0f9d568
 * +-- Custom index, hash: d97d1ac9b723d997fd9e199c675a93c0
 *  CREATE INDEX IF NOT EXISTS "idx_Users_subscribed_to_curated_verified" ON "Users" USING btree ("emailSubscribedToCurated", "unsubscribeFromAll", "deleted", "email", fm_has_verified_email (emails), "_id")
 * @@ -2816,3 +2814,3 @@ WHERE
 *  
 * --- Custom index, hash: 480ced786a330b105dfacf424868d573
 * +-- Custom index, hash: cf55b81fd2253b3f21792e1612d454c7
 *  CREATE INDEX IF NOT EXISTS "idx_Users_subscribed_to_curated" ON "Users" USING btree ("emailSubscribedToCurated", "unsubscribeFromAll", "deleted", "email", "_id")
 * @@ -2836,3 +2834,3 @@ GROUP BY
 *  
 * --- Index on view "UniquePostUpvoters", hash: 977bcfb6d4daa6c56eb313bfb58a4b29
 * +-- Index on view "UniquePostUpvoters", hash: ddac890dff8eb1376502a3f4deb9ac7e
 *  CREATE UNIQUE INDEX IF NOT EXISTS "idx_UniquePostUpvoters_postId" ON "UniquePostUpvoters" ("postId");
 * @@ -2874,3 +2872,3 @@ WHERE
 *  
 * --- Index on view "UserLoginTokens", hash: 408438b72d331ec71af1108193b3f1d9
 * +-- Index on view "UserLoginTokens", hash: 3d2c6eee19cb8d849343e78e4bcd3ef5
 *  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_login_tokens_hashed_token ON "UserLoginTokens" USING BTREE ("hashedToken");
 * 
 */
export const acceptsSchemaHash = "4d21d3ccc260a536fc4df5c23028310e";

// no-op, schema changes are due to standardising how we include indexes in the `accepted_schema.sql` file
export const up = async ({db}: MigrationContext) => {}

export const down = async ({db}: MigrationContext) => {}
