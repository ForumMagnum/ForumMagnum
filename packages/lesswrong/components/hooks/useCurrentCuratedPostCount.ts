import { useCurrentUser } from "../common/withUser";

export const useCurrentCuratedPostCount = () => {
  const currentUser = useCurrentUser();
  return currentUser ? 3 : 2;
}
