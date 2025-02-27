import { getCollectionHooks } from '../mutationCallbacks';
import { userIsAdminOrMod, userOwns } from '@/lib/vulcan-users/permissions.ts';
import LWEventsRepo from '../repos/LWEventsRepo';
import { isEAForum } from '@/lib/instanceSettings';
import { DatabaseServerSetting } from '../databaseSettings';

const changesAllowedSetting = new DatabaseServerSetting<number>('displayNameRateLimit.changesAllowed', 1);
const sinceDaysAgoSetting = new DatabaseServerSetting<number>('displayNameRateLimit.sinceDaysAgo', 60);

getCollectionHooks("Users").updateValidate.add(async function ChangeDisplayNameRateLimit (validationErrors, { oldDocument, newDocument, currentUser }) {
  if (oldDocument.displayName !== newDocument.displayName) {
    await enforceDisplayNameRateLimit({ userToUpdate: oldDocument, currentUser: currentUser! });
  }
  return validationErrors;
});

async function enforceDisplayNameRateLimit({userToUpdate, currentUser}: {userToUpdate: DbUser, currentUser: DbUser}) {
  if (userIsAdminOrMod(currentUser)) return;

  if (!userOwns(currentUser, userToUpdate)) {
    throw new Error(`You do not have permission to update this user`)
  }

  if (!isEAForum) return;

  const sinceDaysAgo = sinceDaysAgoSetting.get();
  const changesAllowed = changesAllowedSetting.get();

  const nameChangeCount = await new LWEventsRepo().countDisplayNameChanges({
    userId: userToUpdate._id,
    sinceDaysAgo,
  });

  if (nameChangeCount >= changesAllowed) {
    const times = changesAllowed === 1 ? 'time' : 'times';
    throw new Error(`You can only change your display name ${changesAllowed} ${times} every ${sinceDaysAgo} days. Please contact support if you would like to change it again`);
  }
}
