import { membersGroup, adminsGroup, userCanDo } from '../../vulcan-users/permissions';
import Messages from './collection';
import Conversations from '../conversations/collection'
import { sunshineRegimentGroup } from '../../permissions';

const membersActions = [
  'messages.new.own',
  'messages.edit.own',
  'messages.remove.own',
  'messages.view.own',
];
membersGroup.can(membersActions);

const adminActions = [
  'messages.new.all',
  'messages.edit.all',
  'messages.remove.all',
  'messages.view.all',
];
adminsGroup.can(adminActions);

const sunshineRegimentActions = [
  'messages.view.all',
];
sunshineRegimentGroup.can(sunshineRegimentActions);

Messages.checkAccess = async (user: DbUser|null, document: DbMessage, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (await Conversations.findOne({_id: document.conversationId}))?.participantIds?.includes(user._id) ?
    userCanDo(user, 'messages.view.own') : userCanDo(user, `messages.view.all`)
};
