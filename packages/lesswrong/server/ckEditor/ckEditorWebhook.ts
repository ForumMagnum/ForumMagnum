import { addStaticRoute } from '../vulcan-lib/staticRoutes';
import { Globals } from '../../lib/vulcan-lib/config';
import { getCkEditorApiPrefix, getCkEditorEnvironmentId, getCkEditorSecretKey, getCkEditorApiSecretKey } from './ckEditorServerConfig';
import { postEditorConfig } from '../../../../public/lesswrong-editor/src/editorConfigs';
import { buildRevision, getNextVersion, getLatestRev, htmlToChangeMetrics } from '../editor/make_editable_callbacks';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Users } from '../../lib/collections/users/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { createMutator } from '../vulcan-lib/mutators';
import { createNotifications } from '../notificationCallbacksHelpers';
import fetch from 'node-fetch';
import crypto from 'crypto';
import fs from 'fs';
import * as _ from 'underscore';
import moment from 'moment';

addStaticRoute('/ckeditor-webhook', async ({query}, req, res, next) => {
  if (req.method !== "POST") {
    res.statusCode = 405; // Method not allowed
    res.end("ckeditor-webhook should receive POST");
    return;
  }
  
  const body = (req as any).body; //Type system doesn't know body-parser middleware has filled this in
  if (body) {
    await handleCkEditorWebhook(body);
  }
  
  res.end("ok");
});

// Handle a CkEditor webhook. These are documented at:
//   https://ckeditor.com/docs/cs/latest/guides/webhooks/events.html
// Webhook payloads don't seem to have Typescript types exported anywhere, but
// they're pretty simple so we define them inline.
async function handleCkEditorWebhook(message: any) {
  // eslint-disable-next-line no-console
  console.log(`Got CkEditor webhook: ${JSON.stringify(message)}`);
  
  const {environment_id, event, payload, sent_at} = message;
  
  switch (event) {
    case "commentthread.all.removed":
      break;
    case "comment.added": {
      interface CkEditorCommentAdded {
        document: { id: string },
        comment: {
          id: string,
          created_at: string,
          content: string,
          thread_id: string,
          attributes: any,
          user: { id: string }
        },
      };
      const commentAddedPayload = payload as CkEditorCommentAdded;
      
      await notifyCkEditorCommentAdded({
        commenterUserId: payload?.comment?.user?.id,
        commentHtml: payload?.comment?.content,
        postId: ckEditorDocumentIdToPostId(payload?.document?.id),
      });
      break;
    }
    
    case "storage.document.saved": {
      // https://ckeditor.com/docs/cs/latest/guides/webhooks/events.html
      // "Triggered when the document data is saved."
      interface CkEditorDocumentSaved {
        document: {
          id: string,
          saved_at: string,
          download_url: string,
        }
      }
      const documentSavedPayload = payload as CkEditorDocumentSaved;
      const ckEditorDocumentId = documentSavedPayload?.document?.id;
      const postId = ckEditorDocumentIdToPostId(ckEditorDocumentId);
      const documentContents = await fetchCkEditorCloudStorageDocument(ckEditorDocumentId);
      await saveOrUpdateDocumentRevision(postId, documentContents);
      break;
    }
    case "collaboration.document.updated": {
      // https://ckeditor.com/docs/cs/latest/guides/webhooks/events.html
      // According to documentation, this is:
      // "Triggered every 5 minutes or 5000 versions when the content of the collaboration session is being updated. The event will also be emitted when the last user disconnects from a collaboration session."
      // 
      interface CkEditorDocumentUpdated {
        document: {
          id: string
          updated_at: string
          version: number
        }
      }
      const documentUpdatedPayload = payload as CkEditorDocumentUpdated;
      const ckEditorDocumentId = documentUpdatedPayload?.document?.id;
      const postId = ckEditorDocumentIdToPostId(ckEditorDocumentId);
      const documentContents = await fetchCkEditorCloudStorageDocument(ckEditorDocumentId);
      await saveOrUpdateDocumentRevision(postId, documentContents);
      break;
    }
    
    case "comment.updated":
    case "comment.removed":
    case "commentthread.removed":
    case "commentthread.restored":
    case "document.user.connected":
      break;
    case "document.user.disconnected": {
      interface CkEditorUserDisconnected {
        user: { id: string },
        document: { id: string },
        connected_users: Array<{ id: string }>,
      }
      const userDisconnectedPayload = payload as CkEditorUserDisconnected;
      const userId = userDisconnectedPayload?.user?.id;
      const ckEditorDocumentId = userDisconnectedPayload?.document?.id;
      const documentContents = await fetchCkEditorCloudStorageDocument(ckEditorDocumentId);
      const postId = ckEditorDocumentIdToPostId(ckEditorDocumentId);
      await saveDocumentRevision(userId, postId, documentContents);
      break;
    }
    case "document.removed":
    case "storage.document.removed":
    case "storage.document.save.failed":
    case "suggestion.accepted":
    case "suggestion.rejected":
    case "suggestion.added":
    case "suggestion.removed":
    case "suggestion.restored":
      break;
  }
}

function ckEditorDocumentIdToPostId(ckEditorId: string) {
  if (ckEditorId.endsWith("-edit")) {
    return ckEditorId.substr(0, ckEditorId.length-"-edit".length);
  } else {
    return ckEditorId;
  }
}

function postIdToCkEditorDocumentId(postId: string) {
  return `${postId}-edit`;
}

const cloudEditorAutosaveCommitMessage = "Cloud editor autosave";

async function saveDocumentRevision(userId: string, documentId: string, html: string) {
  const fieldName = "contents";
  const user = await Users.findOne(userId);
  const previousRev = await getLatestRev(documentId, fieldName);
  
  const newRevision: Partial<DbRevision> = {
    ...await buildRevision({
      originalContents: {
        data: html,
        type: "ckEditorMarkup",
      },
      currentUser: user,
    }),
    documentId,
    fieldName,
    collectionName: "Posts",
    version: await getNextVersion(documentId, "patch", fieldName, true),
    draft: true,
    updateType: "patch",
    commitMessage: cloudEditorAutosaveCommitMessage,
    changeMetrics: htmlToChangeMetrics(previousRev?.html || "", html),
  };
  await createMutator({
    collection: Revisions,
    document: newRevision,
    validate: false,
  });
}

// If the latest rev is a CkEditor cloud editor autosave within the last
// hour, update it. Otherwise create a new rev.
async function saveOrUpdateDocumentRevision(postId: string, html: string) {
  const fieldName = "contents";
  const previousRev = await getLatestRev(postId, fieldName);
  const lastEditedAt = previousRev ? moment(previousRev.editedAt).toDate().getTime() : 0; //In ms since epoch
  const timeSinceLastEdit = new Date().getTime() - lastEditedAt; //In ms
  
  if (previousRev && timeSinceLastEdit < 60*60*1000 && previousRev.commitMessage===cloudEditorAutosaveCommitMessage) {
    // eslint-disable-next-line no-console
    console.log("Updating rev "+previousRev._id);
    // Update the existing rev
    await Revisions.update(
      {_id: previousRev._id},
      {$set: {
        editedAt: new Date(),
        originalContents: { data: html, type: "ckEditorMarkup" },
      }}
    )
  } else {
    const post = await Posts.findOne(postId);
    const userId = post!.userId;
    // Create a new rev
    await saveDocumentRevision(userId, postId, html);
  }
}

async function fetchCkEditorCloudStorageDocument(ckEditorId: string): Promise<string> {
  // First try getting the document from /collaborations, then from /documents.
  // The former corresponds to a running CkEditor process on CkEditor's servers,
  // the latter to data at rest in their cloud saving thing. The former will
  // fail if the document has timed out and is no longer being actively edited;
  // the latter will fail if there's a bundle version mismatch.
  try {
    return await fetchCkEditorRestAPI("GET", `/collaborations/${ckEditorId}`);
  } catch(e) {
    // eslint-disable-next-line no-console
    console.log("Downloading document via /collaborations failed. Trying via /documents.");
    return await fetchCkEditorRestAPI("GET", `/documents/${ckEditorId}`);
  }
}

async function notifyCkEditorCommentAdded({commenterUserId, commentHtml, postId}: {
  commenterUserId: string,
  commentHtml: string,
  postId: string,
}) {
  const post = await Posts.findOne({_id: postId});
  if (!post) throw new Error(`Couldn't find post for CkEditor comment notification: ${postId}`);
  
  const authorAndCoauthors = [post.userId, ...(post.coauthorUserIds||[])];
  const usersToNotify = _.filter(authorAndCoauthors, u=>u!==commenterUserId);
  // eslint-disable-next-line no-console
  console.log(`New CkEditor comment. Notifying users: ${JSON.stringify(usersToNotify)}`);
  
  await createNotifications({
    userIds: usersToNotify,
    notificationType: "newCommentOnDraft",
    documentType: "post",
    documentId: postId,
    extraData: {
      senderUserID: commenterUserId,
      commentHtml: commentHtml,
    },
  });
}

function combineURIs(prefix: string, path: string): string {
  if (prefix.endsWith("/")) {
    return prefix.substr(0, prefix.length-1) + path;
  } else {
    return prefix + path;
  }
}

async function fetchCkEditorRestAPI(method: string, uri: string, body?: any): Promise<string> {
  const apiPrefix = getCkEditorApiPrefix()!;
  // See: https://ckeditor.com/docs/cs/latest/guides/security/request-signature.html
  const timestamp = new Date().getTime();
  const fullURI = combineURIs(apiPrefix, uri);
  console.log(`CkEditor REST API: ${method} ${fullURI}`); //eslint-disable-line no-console
  const response = await fetch(fullURI, {
    method,
    body: JSON.stringify(body),
    headers: {
      "X-CS-Signature": generateSignature(getCkEditorApiSecretKey()!, method, fullURI, timestamp, body),
      "X-CS-Timestamp": ""+timestamp,
    },
  });
  if (!response.ok) {
    throw new Error(`CkEditor REST API call FAILED (${response.status}): ${method} ${fullURI}`); //eslint-disable-line no-console
  }
  const responseBody = await response.text();
  return responseBody;
}
Globals.fetchCkEditorRestAPI = fetchCkEditorRestAPI;

async function flushCkEditorCollaboration(ckEditorId: string) {
  await fetchCkEditorRestAPI("DELETE", `/collaborations/${ckEditorId}`);
}
Globals.flushCkEditorCollaboration = flushCkEditorCollaboration;

async function deleteCkEditorCloudDocument(ckEditorId: string) {
  await fetchCkEditorRestAPI("DELETE", `/documents/${ckEditorId}`);
}
Globals.deleteCkEditorCloudDocument = deleteCkEditorCloudDocument;

async function debugGetCkEditorCloudInfo() {
  const allCollaborations = await fetchCkEditorRestAPI("GET", "/collaborations");
  const allDocuments = await fetchCkEditorRestAPI("GET", "/documents");
  
  // eslint-disable-next-line no-console
  console.log(`Collaborations: ${allCollaborations}`);
  // eslint-disable-next-line no-console
  console.log(`Documents: ${allDocuments}`);
}
Globals.debugGetCkEditorCloudInfo = debugGetCkEditorCloudInfo;

function generateSignature(apiKey: string, method: string, uri: string, timestamp: number, body: any) {
  // From: https://ckeditor.com/docs/cs/latest/examples/security/request-signature-nodejs.html
  const url = new URL(uri);
  const path = url.pathname + url.search;

  const hmac = crypto.createHmac('SHA256', apiKey);
  hmac.update(`${method.toUpperCase()}${path}${timestamp}`);

  if (body) {
    hmac.update(Buffer.from(JSON.stringify(body)));
  }

  return hmac.digest('hex');
}

async function uploadEditorBundle(bundleVersion: string): Promise<void> {
  if (!bundleVersion)
    throw new Error("Missing argument: bundleVersion");
  
  const editorBundle = fs.readFileSync("public/lesswrong-editor/build/ckeditor-cloud.js", 'utf8');
  const editorBundleHash = crypto.createHash('sha256').update(editorBundle, 'utf8').digest('hex');
  
  // eslint-disable-next-line no-console
  console.log(`Uploading editor with SHA256sum ${editorBundleHash}`);
  
  const result = await fetchCkEditorRestAPI("POST", "/editors", {
    bundle: editorBundle,
    config: {
      ...postEditorConfig,
      cloudServices: {
        bundleVersion,
      },
    },
    testData: "<p>Test</p>",
  });
}
Globals.uploadEditorBundle = uploadEditorBundle;

async function checkEditorBundle(bundleVersion: string): Promise<void> {
  if (!bundleVersion)
    throw new Error("Missing argument: bundleVersion");
  
  const result = await fetchCkEditorRestAPI("GET", `/editors/${bundleVersion}/exists`);
  // eslint-disable-next-line no-console
  console.log(result);
}
Globals.checkEditorBundle = checkEditorBundle;
