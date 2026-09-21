import type { ForumTypeString } from '@/lib/instanceSettings';
import { isPostAllowedType3Audio, postGetPageUrl } from "@/lib/collections/posts/helpers";
import { type3ApiTokenSetting, type3SourceUrlSetting } from "./databaseSettings";
import { Posts } from "@/server/collections/posts/collection.ts";
import { serverCaptureEvent as captureEvent } from "@/server/analytics/serverAnalyticsWriter";
import { isTagAllowedType3Audio, tagGetUrl } from "@/lib/collections/tags/helpers";
import { Tags } from "@/server/collections/tags/collection";

export const hasType3ApiAccess = (forumType: ForumTypeString) => !!type3ApiTokenSetting.get(forumType);

const type3ApiRequest = async (
  endpoint: string,
  method: "POST" | "DELETE",
  body: Json,
  forumType: ForumTypeString,
) => {
  const token = type3ApiTokenSetting.get(forumType);
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

const isDocumentAllowedType3Audio = (document: DbPost | DbTag, collectionName: 'Posts' | 'Tags', forumType: ForumTypeString) => {
  if (collectionName === 'Posts') {
    return isPostAllowedType3Audio(document as DbPost, forumType);
  } else {
    return isTagAllowedType3Audio(document as DbTag, forumType);
  }
} 

type DocumentWithAudio = {
  _id: string;
  slug: string;
};

const getPostUrl = (post: DocumentWithAudio, forumType: ForumTypeString) =>
  type3SourceUrlSetting.get(forumType) + postGetPageUrl(post);

const getTagUrl = (tag: DocumentWithAudio, forumType: ForumTypeString) =>
  type3SourceUrlSetting.get(forumType) + tagGetUrl(tag);

const getDocumentUrl = (document: DocumentWithAudio, collectionName: 'Posts' | 'Tags', forumType: ForumTypeString) => {
  if (collectionName === 'Posts') {
    return getPostUrl(document, forumType);
  } else {
    return getTagUrl(document, forumType);
  }
}


export const regenerateType3Audio = async (document: DbPost | DbTag, collectionName: 'Posts' | 'Tags', forumType: ForumTypeString) => {
  const body = {
    source_url: getDocumentUrl(document, collectionName, forumType),
    priority: "immediate",
  };

  if (!isDocumentAllowedType3Audio(document, collectionName, forumType)) return;

  await type3ApiRequest("narration/regenerate", "POST", body, forumType);
  captureEvent("regenerateType3Audio", {documentId: document._id, collectionName, ...body});
}

// Exported to allow running with "yarn repl"
export const regenerateType3AudioForDocumentId = async (documentId: string, collectionName: 'Posts' | 'Tags', forumType: ForumTypeString) => {
  const document = await (collectionName === 'Posts' 
    ? Posts.findOne({_id: documentId})

    : Tags.findOne({_id: documentId}));
  if (!document) {
    throw new Error("Document not found");
  }
  if (isDocumentAllowedType3Audio(document, collectionName, forumType)) {
    await regenerateType3Audio(document, collectionName, forumType);
  }
}

const deleteType3Audio = async (document: DocumentWithAudio, collectionName: 'Posts' | 'Tags', forumType: ForumTypeString) => {
  const body = {
    source_url: getDocumentUrl(document, collectionName, forumType),
  };
  await type3ApiRequest("narration/delete-by-url", "DELETE", body, forumType);
  captureEvent("deleteType3Audio", {documentId: document._id, collectionName, ...body});
}

// Exported to allow running with "yarn repl"
export const deleteType3AudioForDocumentId = async (documentId: string, collectionName: 'Posts' | 'Tags', forumType: ForumTypeString) => {
  const document = await (collectionName === 'Posts' 
    ? Posts.findOne({_id: documentId})
    : Tags.findOne({_id: documentId}));
  if (!document) {
    throw new Error("Document not found");
  }
  await deleteType3Audio(document, collectionName, forumType);
}

// Exported to allow running with "yarn repl"
export const regenerateAllType3AudioForUser = async (userId: string, forumType: ForumTypeString) => {
  const posts = await Posts.find({
    userId
  }).fetch();

  for (const post of posts) {
    await regenerateType3Audio(post, "Posts", forumType);
  }
}
