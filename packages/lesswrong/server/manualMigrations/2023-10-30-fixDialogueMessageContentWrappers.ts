import { Posts } from '../../lib/collections/posts';
import Revisions from '../../lib/collections/revisions/collection';
import { ckEditorApi, documentHelpers } from '../ckEditor/ckEditorApi';
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
  const $ = cheerioParse(revision.originalContents.data);
  return $('.dialogue-message-content').length > 0;
}

async function saveFlushAndPush(postId: string, ckEditorId: string, migratedHtml: string) {
  await documentHelpers.saveOrUpdateDocumentRevision(postId, migratedHtml);

  try {
    await ckEditorApi.flushCkEditorCollaboration(ckEditorId);
    await ckEditorApi.deleteCkEditorCloudStorageDocument(ckEditorId);
    await ckEditorApi.createCollaborativeSession(ckEditorId, migratedHtml);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Failed to flush, delete from storage, or recreate session', { err });
  }
}

async function migrateDialogue(dialogue: DbPost) {
  const postId = dialogue._id;
  const ckEditorId = documentHelpers.postIdToCkEditorDocumentId(postId);

  const revisions = await Revisions.find({ documentId: postId, fieldName: 'contents' }, { sort: { editedAt: -1 } }).fetch();

  if (revisions.length === 0) return;

  if (revisions[0].editedAt > new Date("2023-10-30 21:48:16.529+00")) {
    // Do something else
    const originalHtml = revisions[0].originalContents.data;
    const migratedHtml = fixMessageContents(originalHtml);

    if (originalHtml !== migratedHtml) {
      await saveFlushAndPush(postId, ckEditorId, migratedHtml);
    }
    return;
  }

  const lastRevisionWithoutContentWrapper = revisions.find((revision) => !revisionHasContentWrapper(revision));
  if (!lastRevisionWithoutContentWrapper) {
    // Do something else
    console.log('no lastRevisionWithoutContentWrapper', { postId });
    return;
  }

  const originalHtml = lastRevisionWithoutContentWrapper.originalContents.data;
  const migratedHtml = wrapMessageContents(originalHtml);

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
