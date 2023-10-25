import { useCallback, useEffect, useRef, useState } from "react";
import { useCreate } from "../../lib/crud/withCreate";
import { useNavigation } from "../../lib/routeUtil";
import { useMulti } from "../../lib/crud/withMulti";
import { useMessages } from "../common/withMessages";
import { forumTypeSetting, isAF } from "../../lib/instanceSettings";
import qs from "qs";
import { useCurrentUser } from "../common/withUser";

export interface TemplateQueryStrings {
  templateId: string;
  displayName: string;
}

export const useInitiateConversation = ({
  from,
  includeModerators,
  templateQueries,
}: {
  from?: string;
  includeModerators?: boolean;
  templateQueries?: TemplateQueryStrings;
}) => {
  const currentUser = useCurrentUser();
  const [userId, setUserId] = useState<string | null>(null);
  const { history } = useNavigation();
  const { flash } = useMessages();

  const skip = !currentUser || !userId;

  const alignmentFields = isAF ? {af: true} : {}
  const moderatorField = includeModerators ? { moderator: true } : {}

  const participantIds = skip ? [] : [currentUser._id, userId]

  const { results } = useMulti({
    terms: {
      view: 'userGroupUntitledConversations',
      userId: currentUser?._id,
      participantIds
    },
    collectionName: "Conversations",
    fragmentName: 'ConversationsMinimumInfo',
    fetchPolicy: 'cache-and-network',
    limit: 1,
    skip,
    createIfMissing: {
      participantIds,
      ...alignmentFields,
      ...moderatorField,
    }
  });

  const conversation = results?.[0];

  const initiateConversation = useCallback((userId) => setUserId(userId), []);

  return {
    conversation,
    initiateConversation,
  }
};
