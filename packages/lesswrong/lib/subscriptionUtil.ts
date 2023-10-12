import { subscriptionTypes } from './collections/subscriptions/schema';
import * as _ from 'underscore';

export function userIsDefaultSubscribed({user, subscriptionType, collectionName, document}: {
  user: DbUser|UsersCurrent|null,
  subscriptionType: any,
  collectionName: CollectionNameString,
  document: any,
}): boolean | undefined
{
  if (!user) return false;
  
  switch(subscriptionType)
  {
    case subscriptionTypes.newComments:
      return !!user.auto_subscribe_to_my_posts && document.userId===user._id;
    case subscriptionTypes.newPosts:
      return false;
    case subscriptionTypes.newRelatedQuestions:
      // TODO
      return false;
    case subscriptionTypes.newEvents:
      return _.some(document.organizers, organizerId=>organizerId===user._id)
        && !!user.autoSubscribeAsOrganizer;
    case subscriptionTypes.newReplies:
      return !!user.auto_subscribe_to_my_comments && document.userId===user._id;
    case subscriptionTypes.newTagPosts:
      return false
    default:
      //eslint-disable-next-line no-console
      console.error("Unrecognized subscription type: "+subscriptionType);
      return false;
  }
}
