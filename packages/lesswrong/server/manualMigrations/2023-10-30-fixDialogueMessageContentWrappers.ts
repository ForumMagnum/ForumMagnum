import merge from 'lodash/merge';
import { Posts } from '../../lib/collections/posts';
import Revisions from '../../lib/collections/revisions/collection';
import { sleep } from '../../lib/helpers';
import { ckEditorBundleVersion } from '../../lib/wrapCkEditor';
import { ckEditorApi, ckEditorApiHelpers, documentHelpers } from '../ckEditor/ckEditorApi';
import { CreateDocumentPayload } from '../ckEditor/ckEditorApiValidators';
import { cheerioWrapAll } from '../editor/conversionUtils';
import { cheerioParse } from '../utils/htmlUtil';
import { Globals } from '../vulcan-lib';
import { registerMigration } from './migrationUtils';

function wrapMessageContents(html: string) {
  const $ = cheerioParse(html);

  $('.dialogue-message').each((i, el) => {
    cheerioWrapAll($(el).children(), '<div class="dialogue-message-content"></div>', $);
  })

  return $.html();
}

function fixMessageContents(html: string) {
  const $ = cheerioParse(html);

  $('.dialogue-message').each((i, el) => {
    const existingContentWrapper = $(el).find('.dialogue-message-content');

    $(existingContentWrapper).children().each((i, child) => {
      const cloned = $(child).clone();
      $(el).append(cloned);
    });

    $(existingContentWrapper).remove();

    cheerioWrapAll($(el).children(), '<div class="dialogue-message-content"></div>', $);
  })

  return $.html();
}

function revisionHasContentWrapper(revision: DbRevision) {
  const $ = cheerioParse(revision.originalContents?.data ?? '');
  return $('.dialogue-message-content').length > 0;
}

async function saveFlushAndPush(postId: string, ckEditorId: string, migratedHtml: string) {
  await documentHelpers.saveOrUpdateDocumentRevision(postId, migratedHtml);

  const updatedContent = {
    content: {
      use_initial_data: false,
      data: migratedHtml,
      bundle_version: ckEditorBundleVersion
    }
  };

  try {
    const remoteDocument = await ckEditorApi.fetchCkEditorDocumentFromStorage(ckEditorId);
    const newDocumentPayload: CreateDocumentPayload = merge({ ...remoteDocument }, updatedContent);
  
    //Repeated twice because ckEditor is bad at their jobs. Without this, 
    //complains about inability to create new session when there's an existing one
    await ckEditorApi.deleteCkEditorCloudDocument(ckEditorId);
    await ckEditorApi.deleteCkEditorCloudDocument(ckEditorId);

    await sleep(10000);
    await ckEditorApiHelpers.createRemoteStorageDocument(newDocumentPayload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Failed to delete remote document from storage', { err });
  }
}

async function migrateDialogue(dialogue: DbPost) {
  const postId = dialogue._id;
  const ckEditorId = documentHelpers.postIdToCkEditorDocumentId(postId);

  const revisions = await Revisions.find({ documentId: postId, fieldName: 'contents' }, { sort: { editedAt: -1 } }).fetch();

  if (revisions.length === 0) return;

  if (revisions[0].editedAt! > new Date("2023-10-30 21:48:16.529+00")) {
    // Do something else
    const originalHtml = revisions[0].originalContents?.data;
    const migratedHtml = fixMessageContents(originalHtml!);

    if (originalHtml !== migratedHtml) {
      await saveFlushAndPush(postId, ckEditorId, migratedHtml);
    }
    return;
  }

  const lastRevisionWithoutContentWrapper = revisions.find((revision) => !revisionHasContentWrapper(revision));
  if (!lastRevisionWithoutContentWrapper) {
    // eslint-disable-next-line no-console
    console.log('no lastRevisionWithoutContentWrapper', { postId });
    return;
  }

  const originalHtml = lastRevisionWithoutContentWrapper.originalContents?.data;
  const migratedHtml = wrapMessageContents(originalHtml!);

  if (originalHtml !== migratedHtml) {
    await saveFlushAndPush(postId, ckEditorId, migratedHtml);
  }
}

Globals.migrateDialogueAgain = async (postId: string) => {
  const dialogue = await Posts.findOne(postId);
  if (dialogue) await migrateDialogue(dialogue);
}

registerMigration({
  name: "fixDialogueMessageContentWrappers",
  dateWritten: "2023-10-30",
  idempotent: true,
  action: async () => {
    const dialogues = await Posts.find({ collabEditorDialogue: true }).fetch();
    const dialogueMigrations = dialogues.map(migrateDialogue);

    await Promise.all(dialogueMigrations);
    await ckEditorApi.flushAllCkEditorCollaborations();
  }
});
