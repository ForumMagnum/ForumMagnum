import type { PermissionResult } from "@/lib/make_voteable";

export const useVoteButtonsDisabled = (): PermissionResult => {
  //const currentUser = useCurrentUser();
  //const {fail, reason} = voteButtonsDisabledForUser(currentUser);
  //return {fail, reason};
  return { fail: false };
}
