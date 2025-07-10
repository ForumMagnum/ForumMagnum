import { commentGetAuthorName } from './collections/comments/helpers';
import { postGetAuthorName } from './collections/posts/helpers';
import { userGetDisplayName } from './collections/users/helpers';
import type { GetMessageProps } from './notificationTypes';
import type { NotificationDocument } from '@/server/collections/notifications/constants';


export const getDocument = async (documentType: NotificationDocument | null, documentId: string | null, context: ResolverContext) => (await getDocumentSummary(documentType, documentId, context))?.document;

type DocumentSummary =
  { type: 'post'; associatedUserName: string; displayName: string; document: DbPost; } |
  { type: 'comment'; associatedUserName: string; displayName: string | undefined; document: DbComment; } |
  { type: 'user'; associatedUserName: string; displayName: string; document: DbUser; } |
  { type: 'message'; associatedUserName: string; displayName: string | undefined; document: DbMessage; } |
  { type: 'localgroup'; displayName: string; document: DbLocalgroup; associatedUserName: null; } |
  { type: 'tagRel'; document: DbTagRel; associatedUserName: null; displayName: null; } |
  { type: 'sequence'; document: DbSequence; associatedUserName: null; displayName: null; } |
  { type: 'dialogueCheck'; document: DbDialogueCheck; associatedUserName: string; displayName: null; } |
  { type: 'dialogueMatchPreference'; document: DbDialogueMatchPreference; associatedUserName: string; displayName: null; };


export async function getCommentParentTitle(comment: DbComment, context: ResolverContext) {
  const { Tags, Posts } = context;
  if (comment.postId) return (await Posts.findOne(comment.postId))?.title;
  if (comment.tagId) return (await Tags.findOne(comment.tagId))?.name;
  return "Unknown Parent";
}



export const getDocumentSummary = async (documentType: NotificationDocument | null, documentId: string | null, context: ResolverContext): Promise<DocumentSummary | null> => {
  if (!documentId) return null;

  const { Posts, Comments, Users, Messages, Conversations, Localgroups, TagRels, Sequences } = context;

  switch (documentType) {
    case 'post':
      const post = await Posts.findOne(documentId);
      return post && {
        type: documentType,
        document: post,
        displayName: post.title,
        associatedUserName: await postGetAuthorName(post, context),
      };
    case 'comment':
      const comment = await Comments.findOne(documentId);
      return comment && {
        type: documentType,
        document: comment,
        displayName: await getCommentParentTitle(comment, context),
        associatedUserName: await commentGetAuthorName(comment, context),
      };
    case 'user':
      const user = await Users.findOne(documentId);
      return user && {
        type: documentType,
        document: user,
        displayName: userGetDisplayName(user),
        associatedUserName: userGetDisplayName(user),
      };
    case 'message':
      const message = await Messages.findOne(documentId);
      if (!message) return null;

      const conversation = await Conversations.findOne(message.conversationId);
      const author = await Users.findOne(message.userId);
      return {
        type: documentType,
        document: message,
        displayName: conversation?.title ?? undefined,
        associatedUserName: userGetDisplayName(author),
      };
    case 'localgroup':
      const localgroup = await Localgroups.findOne(documentId);
      return localgroup && {
        type: documentType,
        document: localgroup,
        displayName: localgroup.name ?? "[missing local group name]",
        associatedUserName: null,
      };
    case 'tagRel':
      const tagRel = await TagRels.findOne(documentId);
      return tagRel && {
        type: documentType,
        document: tagRel,
        displayName: null,
        associatedUserName: null,
      };
    case 'sequence':
      const sequence = await Sequences.findOne(documentId);
      return sequence && {
        type: documentType,
        document: sequence,
        displayName: null,
        associatedUserName: null,
      };
    case 'dialogueCheck':
      return null;
    case 'dialogueMatchPreference':
      return null;
    default:
      //eslint-disable-next-line no-console
      console.error(`Invalid documentType type: ${documentType}`);
      return null;
  }
};

export const taggedPostMessage = async ({ documentType, documentId, context }: GetMessageProps) => {
  const { Tags, Posts } = context;
  const tagRel = await getDocument(documentType, documentId, context) as DbTagRel;
  const tag = await Tags.findOne({ _id: tagRel.tagId });
  const post = await Posts.findOne({ _id: tagRel.postId });
  return `New post tagged '${tag?.name}: ${post?.title}'`;
};
