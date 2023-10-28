import merge from 'lodash/merge';
import { Posts } from '../../lib/collections/posts';
import Revisions from '../../lib/collections/revisions/collection';
import { ckEditorBundleVersion } from '../../lib/wrapCkEditor';
import { ckEditorApi, ckEditorApiHelpers, documentHelpers } from '../ckEditor/ckEditorApi';
import { CreateDocumentPayload } from '../ckEditor/ckEditorApiValidators';
import { cheerioWrapAll } from '../editor/conversionUtils';
import { cheerioParse } from '../utils/htmlUtil';
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
  const ckEditorId = documentHelpers.postIdToCkEditorDocumentId(postId);
  
  let html;
  let remoteDocument;
  try {
    remoteDocument = await ckEditorApi.fetchCkEditorDocumentFromStorage(ckEditorId);
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

async function saveAndDeleteRemoteDocument(postId: string, migratedHtml: string, ckEditorId: string) {
  await documentHelpers.saveOrUpdateDocumentRevision(postId, migratedHtml);

  try {
    await ckEditorApi.deleteCkEditorCloudDocument(ckEditorId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Failed to delete remote document from storage', { err });
  }
}

async function migrateDialogue(dialogue: DbPost) {
  const postId = dialogue._id;
  const ckEditorId = documentHelpers.postIdToCkEditorDocumentId(postId);
  const { anyChanges, migratedHtml, remoteDocument } = await wrapMessageContents(dialogue);
  if (anyChanges) {
    await saveAndDeleteRemoteDocument(postId, migratedHtml, ckEditorId);

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
      try {
        await ckEditorApiHelpers.createRemoteStorageDocument(newDocumentPayload);
      } catch (err) {
        //eslint-disable-next-line no-console
        console.log('Error pushing new document payload', { err })
      }
    } else {
      await ckEditorApi.createCollaborativeSession(ckEditorId, migratedHtml);
    }
  }
}

registerMigration({
  name: "widgetizeDialogueMessages",
  dateWritten: "2023-10-25",
  idempotent: true,
  action: async () => {
    const dialogues = await Posts.find({ collabEditorDialogue: true }).fetch();
    const dialogueMigrations = dialogues.map(migrateDialogue);

    await Promise.all(dialogueMigrations);
    await ckEditorApi.flushAllCkEditorCollaborations();
  }
});
