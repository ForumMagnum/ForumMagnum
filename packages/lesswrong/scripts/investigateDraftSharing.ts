import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

const POST_ID = "9Bh9sAjtif82m4Jcm";

/** Read-only: is the lost draft in collaborative mode (which suppresses the localStorage restore banner)? */
export async function investigateDraftSharing(postId = POST_ID) {
  const db = getSqlClientOrThrow();
  /* eslint-disable no-console */
  const sharing = await db.any(`
    -- investigateDraftSharing.sharing
    SELECT _id, "shareWithUsers", "sharingSettings", "collabEditorDialogue",
           "linkSharingKey" IS NOT NULL AS has_link_sharing_key,
           "linkSharingKeyUsedBy"
    FROM "Posts" WHERE _id = $(postId)
  `, { postId });
  console.log("=== POST SHARING SETTINGS ===\n", JSON.stringify(sharing, null, 2));
}

export default investigateDraftSharing;
