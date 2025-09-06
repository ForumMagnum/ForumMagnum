import { crosspostKarmaThreshold } from '@/lib/instanceSettings';
import { InsufficientKarmaError, InvalidUserError } from "./errors";

/**
 * Check if the user has enough karma to be allowed to crosspost.
 * 
 * Ex: if a user has 0 karma on LW, and attempts to link accounts to crosspost from the EA Forum, they will get this error, because LW requires you to have a 100 karma account *on LW* to crosspost from the EA Forum.
 * This is true regardless of how much karma they have on the EA Forum.  (This check is performed on both sides, so a user needs to pass both forums' karma thresholds to be able to establish a link.)
 */
 export const assertCrosspostingKarmaThreshold = (currentUser: DbUser | null) => {
  if (!currentUser) {
    throw new InvalidUserError();
  }
  if (currentUser.isAdmin) {
    return;
  }

  // Despite the generated type, karma is in fact missing by default for new users who haven't had anything of theirs voted on
  // Numeric comparisons to `undefined` always return false!
  const userKarma = currentUser.karma;

  const currentKarmaThreshold = crosspostKarmaThreshold.get();
  if (currentKarmaThreshold !== null && currentKarmaThreshold > userKarma) {
    throw new InsufficientKarmaError(currentKarmaThreshold);
  }
}

