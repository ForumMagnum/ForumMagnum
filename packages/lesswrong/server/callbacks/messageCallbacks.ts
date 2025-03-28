import { SENT_MODERATOR_MESSAGE } from '../../lib/collections/moderatorActions/newSchema';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { loadByIds } from '../../lib/loaders';
import { AfterCreateCallbackProperties, CallbackValidationErrors, CreateCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { createNotifications } from '../notificationCallbacksHelpers';

/* CREATE VALIDATE */
function checkIfNewMessageIsEmpty(validationErrors: CallbackValidationErrors, {document: message}: CreateCallbackProperties<'Messages'>) {
  const { data } = (message.contents && message.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot send an empty message");
  }
}

function unArchiveConversations({ document, context }: CreateCallbackProperties<'Messages'>) {
  const { Conversations } = context;

  void Conversations.rawUpdateOne({_id:document.conversationId}, {$set: {archivedByIds: []}});
}

/* CREATE ASYNC */

/**
 * Creates a moderator action when the first message in a mod conversation is sent to the user
 * This also adds a note to a user's sunshineNotes
 */
async function updateUserNotesOnModMessage({ document, currentUser, context }: CreateCallbackProperties<'Messages'>) {
  const { conversationId } = document;
  // In practice this should never happen, we just don't have types set up for handling required fields
  if (!conversationId) {
    return;
  }

  const conversation = await context.loaders.Conversations.load(conversationId);
  if (conversation.moderator) {
    const [conversationParticipants, conversationMessageCount] = await Promise.all([
      loadByIds(context, "Users", conversation.participantIds),
      // No need to fetch more than 2, we only care if this is the first message in the conversation
      context.Messages.find({ conversationId }, { limit: 2 }).count()
    ]);

    const nonAdminParticipant = conversationParticipants.find(user => !userIsAdmin(user));

    if (nonAdminParticipant && conversationMessageCount === 1) {
      void createMutator({
        collection: context.ModeratorActions,
        context,
        currentUser,
        document: {
          userId: nonAdminParticipant._id,
          type: SENT_MODERATOR_MESSAGE,
          endedAt: new Date()
        }
      });
    }
  }
}

/**
 * If the current user is not part of the conversation then add them to make
 * sure they get notified about future messages (only mods have permission to
 * add themselves to conversations).
 */
async function addParticipantIfNew({ document, currentUser, context }: CreateCallbackProperties<'Messages'>) {
  const { Conversations, loaders } = context;

  const { conversationId } = document;
  if (!conversationId) {
    return;
  }

  const conversation = await loaders.Conversations.load(conversationId);
  if (
    currentUser &&
    conversation &&
    !conversation.participantIds.includes(currentUser._id)
  ) {
    await updateMutator({
      currentUser,
      collection: Conversations,
      documentId: conversationId,
      set: {
        participantIds: [...conversation.participantIds, currentUser._id],
      },
      validate: false,
    });
  }
}

/* NEW ASYNC */
async function updateConversationActivity (message: DbMessage, context: ResolverContext) {
  const { Conversations, Users } = context;

  // Update latest Activity timestamp on conversation when new message is added
  const user = await Users.findOne(message.userId);
  const conversation = await Conversations.findOne(message.conversationId);
  if (!conversation) throw Error(`Can't find conversation for message ${message}`)
  await updateMutator({
    collection: Conversations,
    documentId: conversation._id,
    set: {latestActivity: message.createdAt},
    currentUser: user,
    validate: false,
  });
}

async function messageNewNotification(message: DbMessage, context: ResolverContext) {
  const { Conversations } = context;

  const conversationId = message.conversationId;
  const conversation = await Conversations.findOne(conversationId);
  if (!conversation) throw Error(`Can't find conversation for message: ${message}`)
  
  // For on-site notifications, notify everyone except the sender of the
  // message. For email notifications, notify everyone including the sender
  // (since if there's a back-and-forth in the grouped notifications, you want
  // to see your own messages.)
  const recipientIds = conversation.participantIds.filter((id) => (id !== message.userId));

  // Create notification
  await createNotifications({userIds: recipientIds, notificationType: 'newMessage', documentType: 'message', documentId: message._id, noEmail: message.noEmail});
}


// Aggregate stage functions

function messageCreateValidate(validationErrors: CallbackValidationErrors, props: CreateCallbackProperties<'Messages'>) {
  checkIfNewMessageIsEmpty(validationErrors, props);
  return validationErrors;
}

function messageCreateBefore(doc: DbInsertion<DbMessage>, props: CreateCallbackProperties<'Messages'>): DbInsertion<DbMessage> {
  // editorSerializationBeforeCreate

  return doc;
}

function messageCreateAfter(doc: DbMessage, props: CreateCallbackProperties<'Messages'>): DbMessage {
  // editorSerializationAfterCreate
  // notifyUsersAboutMentions
  // countOfReferenceCallbacks

  return doc;
}

async function messageCreateAsync(props: AfterCreateCallbackProperties<'Messages'>) {
  unArchiveConversations(props);
  await updateUserNotesOnModMessage(props);
  await addParticipantIfNew(props);
}

async function messageNewAsync(newMessage: DbMessage, currentUser: DbUser | null, collection: CollectionBase<'Messages'>, props: AfterCreateCallbackProperties<'Messages'>) {
  await updateConversationActivity(newMessage, props.context);
  await messageNewNotification(newMessage, props.context);
}

function messageUpdateAfter(message: DbMessage, props: UpdateCallbackProperties<'Messages'>): DbMessage {
  // editorSerializationEdit
  // notifyUsersAboutMentions
  // countOfReferenceCallbacks

  return message;
}

function messageEditAsync(message: DbMessage, oldMessage: DbMessage, currentUser: DbUser | null, collection: CollectionBase<'Messages'>, props: UpdateCallbackProperties<'Messages'>) {
  // convertImagesInObject
}

getCollectionHooks('Messages').createValidate.add(messageCreateValidate);
getCollectionHooks('Messages').createBefore.add(messageCreateBefore);
getCollectionHooks('Messages').createAfter.add(messageCreateAfter);
getCollectionHooks('Messages').createAsync.add(messageCreateAsync);
getCollectionHooks('Messages').newAsync.add(messageNewAsync);

getCollectionHooks('Messages').updateAfter.add(messageUpdateAfter);
getCollectionHooks('Messages').editAsync.add(messageEditAsync);
