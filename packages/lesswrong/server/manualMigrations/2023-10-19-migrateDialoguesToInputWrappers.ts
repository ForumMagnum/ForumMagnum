import { Posts } from '../../lib/collections/posts';
import Revisions from '../../lib/collections/revisions/collection';
import { ckEditorApi, ckEditorApiHelpers, documentHelpers } from '../ckEditor/ckEditorApi';
import { backfillDialogueMessageInputAttributes } from '../editor/conversionUtils';
import { registerMigration } from './migrationUtils';

registerMigration({
  name: "migrateDialoguesToInputWrappers",
  dateWritten: "2023-10-19",
  idempotent: true,
  action: async () => {
    const dialogues = await Posts.find({ collabEditorDialogue: true }).fetch();

    const dialogueMigrations = dialogues.map(async (dialogue) => {
      const postId = dialogue._id;
      const latestRevisionPromise = Revisions.findOne({ documentId: postId, fieldName: 'contents' }, { sort: { editedAt: -1 } });
      const ckEditorId = documentHelpers.postIdToCkEditorDocumentId(postId);
      let html;
      try {
        html = await ckEditorApiHelpers.fetchCkEditorCloudStorageDocumentHtml(ckEditorId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Error getting remote html of dialogue', { err });
      }

      // If there's no remote session for a dialogue, fall back to migrating the latest revision, then fall back to migrating the post contents
      html ??= (await latestRevisionPromise)?.originalContents.data ?? dialogue.contents.originalContents.data;

      const migratedHtml = await backfillDialogueMessageInputAttributes(html, postId);
      await documentHelpers.saveOrUpdateDocumentRevision(postId, migratedHtml);
    
      try {
        await ckEditorApi.flushCkEditorCollaboration(ckEditorId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Failed to delete remote collaborative session', { err });
      }
      try {
        await ckEditorApi.deleteCkEditorCloudDocument(ckEditorId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Failed to delete remote document from storage', { err });
      }
      
      // Push the selected revision
      await ckEditorApi.createCollaborativeSession(ckEditorId, migratedHtml);
    });

    await Promise.all(dialogueMigrations);

    await ckEditorApi.flushAllCkEditorCollaborations();
  },
});
