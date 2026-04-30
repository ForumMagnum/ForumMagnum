import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';


export const notificationDocumentTypes = new TupleSet(['post', 'comment', 'user', 'message', 'tagRel', 'sequence', 'localgroup', 'dialogueCheck', 'dialogueMatchPreference', 'typoSuggestion'] as const);
export type NotificationDocument = UnionOf<typeof notificationDocumentTypes>;
