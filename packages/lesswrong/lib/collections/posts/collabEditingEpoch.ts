export const DEFAULT_COLLAB_EDITOR_EPOCH = 1;

export const COLLABORATION_EPOCH_MISMATCH_ERROR = 'app.collaboration_epoch_mismatch';

export function getCollabEditorEpoch(epoch: number | null | undefined): number {
  return epoch ?? DEFAULT_COLLAB_EDITOR_EPOCH;
}
