import { isPostAllowedType3Audio, postGetPageUrl } from "@/lib/collections/posts/helpers";
import { DatabaseServerSetting } from "./databaseSettings";
import { Posts } from "@/server/collections/posts/collection.ts";
import { serverCaptureEvent as captureEvent } from "@/server/analytics/serverAnalyticsWriter";
import { isTagAllowedType3Audio, tagGetUrl } from "@/lib/collections/tags/helpers";
import { Tags } from "@/server/collections/tags/collection";

/* Currently unused
const type3ClientIdSetting = new DatabaseServerSetting<string | null>('type3.clientId', null)
const type3WebhookSecretSetting = new DatabaseServerSetting<string | null>('type3.webhookSecret', null)
*/
const type3ApiTokenSetting = new DatabaseServerSetting<string | null>("type3.apiToken", null);
const type3SourceUrlSetting = new DatabaseServerSetting<string>("type3.sourceUrl", "");

export const hasType3ApiAccess = () => !!type3ApiTokenSetting.get();

const type3ApiRequest = async (
  endpoint: string,
  method: "POST" | "DELETE",
  body: Json,
) => {
  const token = type3ApiTokenSetting.get();
  if (!token) {
    // eslint-disable-next-line no-console
    console.warn("No type3 API token - skipping API request");
    return;
  }
  const result = await fetch("https://api.type3.audio/" + endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (result.status !== 200) {
    const message = await result.text();
    throw new Error(`Type3 error: ${message}`);
  }
}

const isDocumentAllowedType3Audio = (document: DbPost | DbTag, collectionName: 'Posts' | 'Tags') => {
  if (collectionName === 'Posts') {
    return isPostAllowedType3Audio(document as DbPost);
  } else {
    return isTagAllowedType3Audio(document as DbTag);
  }
} 

type DocumentWithAudio = {
  _id: string;
  slug: string;
};

const getPostUrl = (post: DocumentWithAudio) =>
  type3SourceUrlSetting.get() + postGetPageUrl(post);

const getTagUrl = (tag: DocumentWithAudio) =>
  type3SourceUrlSetting.get() + tagGetUrl(tag);

const getDocumentUrl = (document: DocumentWithAudio, collectionName: 'Posts' | 'Tags') => {
  if (collectionName === 'Posts') {
    return getPostUrl(document);
  } else {
    return getTagUrl(document);
  }
}


export const regenerateType3Audio = async (document: DbPost | DbTag, collectionName: 'Posts' | 'Tags') => {
  const body = {
    source_url: getDocumentUrl(document, collectionName),
    priority: "immediate",
  };

  if (!isDocumentAllowedType3Audio(document, collectionName)) return;

  await type3ApiRequest("narration/regenerate", "POST", body);
  captureEvent("regenerateType3Audio", {documentId: document._id, collectionName, ...body});
}

// Exported to allow running with "yarn repl"
export const regenerateType3AudioForDocumentId = async (documentId: string, collectionName: 'Posts' | 'Tags') => {
  const document = await (collectionName === 'Posts' 
    ? Posts.findOne({_id: documentId})

    : Tags.findOne({_id: documentId}));
  if (!document) {
    throw new Error("Document not found");
  }
  if (isDocumentAllowedType3Audio(document, collectionName)) {
    await regenerateType3Audio(document, collectionName);
  }
}

const deleteType3Audio = async (document: DocumentWithAudio, collectionName: 'Posts' | 'Tags') => {
  const body = {
    source_url: getDocumentUrl(document, collectionName),
  };
  await type3ApiRequest("narration/delete-by-url", "DELETE", body);
  captureEvent("deleteType3Audio", {documentId: document._id, collectionName, ...body});
}

// Exported to allow running with "yarn repl"
export const deleteType3AudioForDocumentId = async (documentId: string, collectionName: 'Posts' | 'Tags') => {
  const document = await (collectionName === 'Posts' 
    ? Posts.findOne({_id: documentId})
    : Tags.findOne({_id: documentId}));
  if (!document) {
    throw new Error("Document not found");
  }
  await deleteType3Audio(document, collectionName);
}

// Exported to allow running with "yarn repl"
export const regenerateAllType3AudioForUser = async (userId: string) => {
  const posts = await Posts.find({
    userId
  }).fetch();

  for (const post of posts) {
    await regenerateType3Audio(post, "Posts");
  }
}
