import { Posts } from '../../lib/collections/posts';
import Revisions from '../../lib/collections/revisions/collection';
import { createCollaborativeSession, deleteCkEditorCloudDocument, fetchCkEditorCloudStorageDocument, flushAllCkEditorCollaborations, flushCkEditorCollaboration, postIdToCkEditorDocumentId, saveOrUpdateDocumentRevision } from '../ckEditor/ckEditorWebhook';
import { backfillDialogueMessageInputAttributes, cheerioWrapAll } from '../editor/conversionUtils';
import { registerMigration } from './migrationUtils';
import { cheerioParse } from '../utils/htmlUtil';
import { Globals } from '../vulcan-lib';

const widgetizeDialogueMessages = (html: string, postId: string) => {
  const $ = cheerioParse(html);

  //for each dialogue message, we check if it's contents represented as paragraphs are already wrapped in a div or not, 
  //if not we wrap them in a dialogue-message-content div
  $('.dialogue-message').each((i, el) => {
    const existingContentWrapper = $(el).find('.dialogue-message-content');
    if (existingContentWrapper.length === 0) {
      cheerioWrapAll($(el).find('p'), '<div class="dialogue-message-content"></div>', $);
    }
  })

  return $.html();
}

async function wrapMessageContents(dialogue: DbPost) {
  const postId = dialogue._id;
  const latestRevisionPromise = Revisions.findOne({ documentId: postId, fieldName: 'contents' }, { sort: { editedAt: -1 } });
  const ckEditorId = postIdToCkEditorDocumentId(postId);
  let html;
  try {
    html = await fetchCkEditorCloudStorageDocument(ckEditorId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Error getting remote html of dialogue', { err });
  }

  // If there's no remote session for a dialogue, fall back to migrating the latest revision, then fall back to migrating the post contents
  html ??= (await latestRevisionPromise)?.originalContents.data ?? dialogue.contents.originalContents.data;

  const migratedHtml = widgetizeDialogueMessages(html, postId);
  return migratedHtml;
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
      const migratedHtml = await wrapMessageContents(dialogue);
      await saveOrUpdateDocumentRevision(postId, migratedHtml);
    
      try {
        await flushCkEditorCollaboration(ckEditorId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Failed to delete remote collaborative session', { err });
      }
      try {
        await deleteCkEditorCloudDocument(ckEditorId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Failed to delete remote document from storage', { err });
      }
      
      // Push the selected revision
      await createCollaborativeSession(ckEditorId, migratedHtml);
    });

    await Promise.all(dialogueMigrations);

    await flushAllCkEditorCollaborations();
  }
});
