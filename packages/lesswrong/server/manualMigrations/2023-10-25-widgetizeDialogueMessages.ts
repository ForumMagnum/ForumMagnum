import merge from 'lodash/merge';
import { Posts } from '../../lib/collections/posts';
import Revisions from '../../lib/collections/revisions/collection';
import { ckEditorBundleVersion } from '../../lib/wrapCkEditor';
import { CreateDocumentPayload } from '../ckEditor/ckEditorApiValidators';
import { createCollaborativeSession, createRemoteStorageDocument, deleteCkEditorCloudDocument, fetchCkEditorDocumentFromStorage, flushAllCkEditorCollaborations, flushCkEditorCollaboration, postIdToCkEditorDocumentId, saveOrUpdateDocumentRevision } from '../ckEditor/ckEditorWebhook';
import { cheerioWrapAll } from '../editor/conversionUtils';
import { cheerioParse } from '../utils/htmlUtil';
import { Globals } from '../vulcan-lib';
import { registerMigration } from './migrationUtils';

const widgetizeDialogueMessages = (html: string, postId: string) => {
  const $ = cheerioParse(html);

  let anyChanges = false;

  //for each dialogue message, we check if it's contents represented as paragraphs are already wrapped in a div or not, 
  //if not we wrap them in a dialogue-message-content div
  $('.dialogue-message').each((i, el) => {
    const existingContentWrapper = $(el).find('.dialogue-message-content');
    if (existingContentWrapper.length === 0) {
      cheerioWrapAll($(el).find('p'), '<div class="dialogue-message-content"></div>', $);
      anyChanges = true;
    }
  })

  return { anyChanges, migratedHtml: $.html() };
}

async function wrapMessageContents(dialogue: DbPost) {
  const postId = dialogue._id;
  const latestRevisionPromise = Revisions.findOne({ documentId: postId, fieldName: 'contents' }, { sort: { editedAt: -1 } });
  const ckEditorId = postIdToCkEditorDocumentId(postId);
  
  let html;
  let remoteDocument;
  try {
    remoteDocument = await fetchCkEditorDocumentFromStorage(ckEditorId); // fetchCkEditorCloudStorageDocument(ckEditorId);
    html = remoteDocument.content.data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Error getting remote html of dialogue', { err });
  }

  // If there's no remote session for a dialogue, fall back to migrating the latest revision, then fall back to migrating the post contents
  html ??= (await latestRevisionPromise)?.originalContents.data ?? dialogue.contents.originalContents.data;

  const results = widgetizeDialogueMessages(html, postId);
  return {
    ...results,
    remoteDocument
  };
}

Globals.wrapDialogueMessageContents = async (postId: string) => {
  const post = await Posts.findOne(postId);
  if (post) {
    const migratedHtml = await wrapMessageContents(post)
    // eslint-disable-next-line no-console
    console.log({migratedHtml})
  }
}

registerMigration({
  name: "widgetizeDialogueMessages",
  dateWritten: "2023-10-25",
  idempotent: true,
  action: async () => {
    const dialogues = await Posts.find({ collabEditorDialogue: true }).fetch();

    const dialogueMigrations = dialogues.map(async (dialogue) => {
      const postId = dialogue._id;
      const ckEditorId = postIdToCkEditorDocumentId(postId);
      const { anyChanges, migratedHtml, remoteDocument } = await wrapMessageContents(dialogue);
      if (anyChanges) {
        console.log(`Need to migrate dialogue titled ${dialogue.title} with id ${postId}`);
        await saveOrUpdateDocumentRevision(postId, migratedHtml);
    
        try {
          console.log(`About to flush ${ckEditorId}`);
          await flushCkEditorCollaboration(ckEditorId);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('Failed to delete remote collaborative session', { err });
        }
        try {
          console.log(`About to delete ${ckEditorId}`);
          await deleteCkEditorCloudDocument(ckEditorId);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('Failed to delete remote document from storage', { err });
        }

        const updatedContent = {
          content: {
            use_initial_data: false,
            data: migratedHtml,
            bundle_version: ckEditorBundleVersion
          }
        };

        if (remoteDocument) {
          const newDocumentPayload: CreateDocumentPayload = merge({ ...remoteDocument }, updatedContent);
          
          // Push the selected revision
          await createRemoteStorageDocument(newDocumentPayload);
        } else {
          await createCollaborativeSession(ckEditorId, migratedHtml);  
        }
      }
    });

    await Promise.all(dialogueMigrations);

    await flushAllCkEditorCollaborations();
  }
});
