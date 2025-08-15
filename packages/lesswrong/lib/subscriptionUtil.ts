import * as _ from 'underscore';
import { subscriptionTypes, SubscriptionType } from './collections/subscriptions/helpers';

export function userIsDefaultSubscribed({user, subscriptionType, collectionName, document}: {
  user: DbUser|UsersCurrent|null,
  subscriptionType: SubscriptionType,
  collectionName: CollectionNameString,
  document: any,
}): boolean
{
  if (!user) return false;
  
  switch(subscriptionType)
  {
    case subscriptionTypes.newComments:
      return user.auto_subscribe_to_my_posts && document.userId===user._id;
    case subscriptionTypes.newPosts:
      return false;
    case subscriptionTypes.newUserComments:
      return false; 
    case subscriptionTypes.newRelatedQuestions:
      // TODO
      return false;
    case subscriptionTypes.newEvents:
      return _.some(document.organizers, organizerId=>organizerId===user._id)
        && user.autoSubscribeAsOrganizer;
    case subscriptionTypes.newReplies:
      return user.auto_subscribe_to_my_comments && document.userId===user._id;
    case subscriptionTypes.newTagPosts:
      return false
    case subscriptionTypes.newSequencePosts:
      return false
    case subscriptionTypes.newShortform:
      return false;
    case subscriptionTypes.newDebateComments:
      return false;
    case subscriptionTypes.newPublishedDialogueMessages:
      return false;
    case subscriptionTypes.newDialogueMessages:
      const post = document as DbPost;
      const authorIds = [post.userId, ...post.coauthorUserIds];
      return authorIds.includes(user._id);
    case subscriptionTypes.newActivityForFeed:
      return false;
    default:
      //eslint-disable-next-line no-console
      console.error("Unrecognized subscription type: "+subscriptionType);
      return false;
  }
}

export function userSubscriptionStateIsFixed({user, subscriptionType, documentId}: {
  user: DbUser|UsersCurrent,
  subscriptionType: SubscriptionType,
  documentId: string,
}): boolean {
  switch(subscriptionType) {
    case subscriptionTypes.newUserComments:
    case subscriptionTypes.newPosts:
      return user?._id === documentId;
    default:
      return false;
  }
}
