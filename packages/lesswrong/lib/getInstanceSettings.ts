// Will be null instead of a function (from the stubs directory) if not on the server
import { getSettings } from "@/server/settings/settings";
import { isServer } from "./executionEnvironment";
import type { ForumTypeString } from "./instanceSettings";

export const getInstanceSettings = (forumType: ForumTypeString) => {
  if (isServer) {
    return getSettings(forumType);
  } else {
    return {
      public: window.publicInstanceSettings?.[forumType === 'AlignmentForum' ? 'AlignmentForum' : 'LessWrong'],
      private: undefined,
    };
  }
}
