import { addStaticRoute } from '../vulcan-lib/staticRoutes';
import { Globals } from '../../lib/vulcan-lib/config';
import { getCkEditorApiPrefix, getCkEditorApiSecretKey } from './ckEditorServerConfig';
import { postEditorConfig } from '../../../../public/lesswrong-editor/src/editorConfigs';
import { buildRevision, getNextVersion, getLatestRev, getPrecedingRev, htmlToChangeMetrics, BuiltRevision } from '../editor/make_editable_callbacks';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Users } from '../../lib/collections/users/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { createMutator } from '../vulcan-lib/mutators';
import { createNotifications } from '../notificationCallbacksHelpers';
import crypto from 'crypto';
import fs from 'fs';
import * as _ from 'underscore';
import moment from 'moment';

const bundleVersion = "31.0.1";

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
      
      const thread = await fetchCkEditorCommentThread(payload?.comment?.thread_id);
      const commentersInThread: string[] = _.uniq(thread.map(comment => comment?.user?.id));
      
      await notifyCkEditorCommentAdded({
        commenterUserId: payload?.comment?.user?.id,
        commentHtml: payload?.comment?.content,
        postId: ckEditorDocumentIdToPostId(payload?.document?.id),
        commentersInThread,
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
      const [documentContents, post] = await Promise.all([
        fetchCkEditorCloudStorageDocument(ckEditorDocumentId),
        Posts.findOne(postId)
      ]);

      if (!post) {
        throw new Error(`Post with id ${postId} from ckEditor webhook event ${event} not found when trying to save a new revision`);
      }

      await saveDocumentRevision(post.userId, postId, documentContents);
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
      const [documentContents, post] = await Promise.all([
        fetchCkEditorCloudStorageDocument(ckEditorDocumentId),
        Posts.findOne(postId)
      ]);

      if (!post) {
        throw new Error(`Post with id ${postId} from ckEditor webhook event ${event} not found when trying to save a new revision`);
      }

      await saveDocumentRevision(post.userId, postId, documentContents);
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

function shouldSaveNewRevision(previousRevision: DbRevision | null, newOriginalContents: DbRevision['originalContents'], builtRevision: BuiltRevision) {
  return !previousRevision || !(_.isEqual(newOriginalContents, previousRevision.originalContents) || builtRevision.wordCount === 0);
}

async function saveDocumentRevision(userId: string, documentId: string, html: string) {
  const fieldName = "contents";
  const user = await Users.findOne(userId);
  const previousRev = await getLatestRev(documentId, fieldName);
  
  const newOriginalContents = {
    data: html,
    type: "ckEditorMarkup",
  }
  
  if (!user) {
    throw Error("no user found for userId in saveDocumentRevision")
  }

  const baseRevision = await buildRevision({
    originalContents: newOriginalContents,
    currentUser: user,
  });

  if (shouldSaveNewRevision(previousRev, newOriginalContents, baseRevision)) {
    const newRevision: Partial<DbRevision> = {
      ...baseRevision,
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
}

// Time interval such that, when autosaving, we will update an existing
// rev instead of create a new rev if it's within this amount of time ago. In
// milliseconds.
const autosaveMaxInterval = 10*60*1000;

// If the latest rev is a CkEditor cloud editor autosave within the last
// hour, update it. Otherwise create a new rev.
async function saveOrUpdateDocumentRevision(postId: string, html: string) {
  const fieldName = "contents";
  const previousRev = await getLatestRev(postId, fieldName);
  
  // Time relative to which to compute the max autosave interval, in ms since
  // epoch.
  const lastEditedAt = previousRev
    ? moment(previousRev.autosaveTimeoutStart || previousRev.editedAt).toDate().getTime()
    : 0;
  const timeSinceLastEdit = new Date().getTime() - lastEditedAt; //In ms
  
  if (previousRev
    && previousRev.draft
    && timeSinceLastEdit < autosaveMaxInterval
    && previousRev.commitMessage===cloudEditorAutosaveCommitMessage
  ) {
    // Get the revision prior to the one being replaced, for computing change metrics
    const precedingRev = await getPrecedingRev(previousRev);
    
    // eslint-disable-next-line no-console
    console.log("Updating rev "+previousRev._id);
    // Update the existing rev
    await Revisions.rawUpdateOne(
      {_id: previousRev._id},
      {$set: {
        editedAt: new Date(),
        autosaveTimeoutStart: previousRev.autosaveTimeoutStart || previousRev.editedAt,
        originalContents: { data: html, type: "ckEditorMarkup" },
        changeMetrics: htmlToChangeMetrics(precedingRev?.html || "", html),
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

// Given a state for a document, which may or may not currently have a collaboration
// open and may or may not be stored yet in CkEditor's cloud, push a revision,
// overwriting whatever's currently there.
// (This is used when reverting through the revision-history UI.)
export async function pushRevisionToCkEditor(postId: string, html: string) {
  // eslint-disable-next-line no-console
  console.log(`Pushing to CkEditor cloud: postId=${postId}, html=${html}`);
  const ckEditorId = postIdToCkEditorDocumentId(postId);
  
  // Check for unsaved changes and save them first
  const latestHtml = await fetchCkEditorCloudStorageDocument(ckEditorId);
  await saveOrUpdateDocumentRevision(postId, latestHtml);
  
  // End the collaboration session so that we can restart with new contents
  // To do this we have to delete *both* the document and the collaboration.
  // (This seems like suspiciously bad API design in CkEditor's REST API, but
  // I've checked thoroughly and there's no way to just overwrite a
  // collaboration like you'd hope.)
  await fetchCkEditorRestAPI("DELETE", `/collaborations/${ckEditorId}?force=true&wait=true`);
  await fetchCkEditorRestAPI("DELETE", `/documents/${ckEditorId}`);
  
  // Push the selected revision
  const result = await fetchCkEditorRestAPI("POST", "/collaborations", {
    document_id: ckEditorId,
    bundle_version: bundleVersion,
    data: html,
    use_initial_data: false,
  });
}

interface CkEditorComment {
    id: string,
    document_id: string,
    thread_id: string,
    content: string,
    user: {id: string},
    created_at: string,
    updated_at: string,
    attributes: any,
}
interface CkEditorGetCommentsResponse {
  cursor_next: string,
  cursor_prev: string,
  data: CkEditorComment[],
}

async function fetchCkEditorCommentThread(threadId: string): Promise<CkEditorComment[]> {
  // Fetch a comment thread. Used to find out who should be notified of new
  // comments in that thread.
  //
  // The REST API has pagination, which we don't handle. Instead we just set the
  // limit to the maximum (according to the documentation at
  // https://help.cke-cs.com/api/v4/docs#tag/Comments/paths/~1comments/get); if
  // a CkEditor thread somehow has more comments than that, then new commenters
  // won't subscribed after the 1000th comment, which is not a big problem.
  const limit = 1000;
  
  const response = await fetchCkEditorRestAPI("GET", `/comments?thread_id=${threadId}&limit=${limit}`);
  const parsedResponse: CkEditorGetCommentsResponse = JSON.parse(response);
  return parsedResponse.data;
}

async function notifyCkEditorCommentAdded({commenterUserId, commentHtml, postId, commentersInThread}: {
  commenterUserId: string,
  commentHtml: string,
  postId: string,
  commentersInThread: string[],
}) {
  const post = await Posts.findOne({_id: postId});
  if (!post) throw new Error(`Couldn't find post for CkEditor comment notification: ${postId}`);
  
  // Notify the main author of the post, the coauthors if any, and everyone
  // who's commented in the thread. Then filter out the person who wrote the
  // comment themself.
  const coauthorUserIds = _.filter(post.coauthorStatuses, status=>status.confirmed).map(status => status.userId)

  const usersToNotify = _.uniq(_.filter(
    [post.userId, ...(coauthorUserIds), ...commentersInThread],
    u=>(!!u && u!==commenterUserId)
  ));
  
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
