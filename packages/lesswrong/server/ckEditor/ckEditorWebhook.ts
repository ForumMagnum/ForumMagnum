import * as _ from 'underscore';
import { Posts } from '../../server/collections/posts/collection';
import { createNotifications } from '../notificationCallbacksHelpers';
import { addStaticRoute } from '../vulcan-lib/staticRoutes';
import { ckEditorApi, ckEditorApiHelpers, documentHelpers } from './ckEditorApi';
import CkEditorUserSessions from '../../server/collections/ckEditorUserSessions/collection';
import { ckEditorUserSessionsEnabled } from '../../lib/betas';
import { createAdminContext } from "../vulcan-lib/createContexts";
import { createCkEditorUserSession } from '../collections/ckEditorUserSessions/mutations';

interface CkEditorUserConnectionChange {
  user: { id: string },
  document: { id: string },
  connected_users: Array<{ id: string }>,
}

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
      
      const thread = await ckEditorApi.fetchCkEditorCommentThread(payload?.comment?.thread_id);
      const commentersInThread: string[] = _.uniq(thread.map(comment => comment?.user?.id));
      
      await notifyCkEditorCommentAdded({
        commenterUserId: payload?.comment?.user?.id,
        commentHtml: payload?.comment?.content,
        postId: documentHelpers.ckEditorDocumentIdToPostId(payload?.document?.id),
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
      const postId = documentHelpers.ckEditorDocumentIdToPostId(ckEditorDocumentId);
      const documentContents = await ckEditorApiHelpers.fetchCkEditorCloudStorageDocumentHtml(ckEditorDocumentId);
      await documentHelpers.saveOrUpdateDocumentRevision(postId, documentContents);
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
      const postId = documentHelpers.ckEditorDocumentIdToPostId(ckEditorDocumentId);
      const documentContents = await ckEditorApiHelpers.fetchCkEditorCloudStorageDocumentHtml(ckEditorDocumentId);
      await documentHelpers.saveOrUpdateDocumentRevision(postId, documentContents);
      break;
    }
    
    case "comment.updated":
    case "comment.removed":
    case "commentthread.removed":
    case "commentthread.restored":
      break
    case "collaboration.user.connected": {
      if (ckEditorUserSessionsEnabled) {
        const userConnectedPayload = payload as CkEditorUserConnectionChange;
        const userId = userConnectedPayload?.user?.id;
        const ckEditorDocumentId = userConnectedPayload?.document?.id;
        const documentId = documentHelpers.ckEditorDocumentIdToPostId(ckEditorDocumentId)
        if (!!userId && !!documentId) {
          const adminContext = createAdminContext();
          await createCkEditorUserSession({
            data: {
              userId,
              documentId,
            }
          }, adminContext);
        }
      }
      break
    }
    case "document.user.connected":
      break
    case "collaboration.user.disconnected": {
      if (ckEditorUserSessionsEnabled) {
        const userDisconnectedPayload = payload as CkEditorUserConnectionChange;
        const userId = userDisconnectedPayload?.user?.id;
        const ckEditorDocumentId = userDisconnectedPayload?.document?.id;
        if (!!userId && !!ckEditorDocumentId) {
          const documentId = documentHelpers.ckEditorDocumentIdToPostId(ckEditorDocumentId)
          const userSession = await CkEditorUserSessions.findOne({userId, documentId, endedAt: {$exists: false}}, {sort:{createdAt: -1}});
          if (!!userSession) {
            await documentHelpers.endCkEditorUserSession(userSession._id, "ckEditorWebhook", new Date(sent_at))
          }
        }
      }
      break
    }
    case "document.user.disconnected": {
      const userDisconnectedPayload = payload as CkEditorUserConnectionChange;
      const userId = userDisconnectedPayload?.user?.id;
      const ckEditorDocumentId = userDisconnectedPayload?.document?.id;
      const documentContents = await ckEditorApiHelpers.fetchCkEditorCloudStorageDocumentHtml(ckEditorDocumentId);
      const postId = documentHelpers.ckEditorDocumentIdToPostId(ckEditorDocumentId);
      await documentHelpers.saveDocumentRevision(userId, postId, documentContents);

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
  const coauthorUserIds = post.coauthorStatuses?.filter(status=>status.confirmed).map(status => status.userId) ?? [];

  const usersToNotify = _.uniq(_.filter(
    [post.userId, ...coauthorUserIds, ...commentersInThread],
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
      linkSharingKey: post.linkSharingKey,
    },
  });
}
