import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useCurrentUser } from "../common/withUser";
import { useSingle } from "@/lib/crud/withSingle";
import { useInitiateConversation } from "../hooks/useInitiateConversation";

const MessageUserInner = ({ user }: { user: UsersMinimumInfo }) => {
  const { Loading, PermanentRedirect, SingleColumnSection } = Components;

  const { conversation, conversationLoading } = useInitiateConversation({
    userIds: [user._id],
  });

  if (!conversation) {
    return conversationLoading ? <Loading /> : <SingleColumnSection>Failed to create conversation: Unknown error.</SingleColumnSection>;
  }

  const url = `/inbox/${conversation._id}?from=magic_link`;
  return <PermanentRedirect url={url} status={302} />;
};

const MessageUser = () => {
  const currentUser = useCurrentUser();
  const { params } = useLocation();
  const { Loading, SingleColumnSection } = Components;

  const { document: user, loading } = useSingle({
    slug: params.slug,
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    skip: !currentUser || !params.slug,
  });

  if (!currentUser) {
    return <div>Log in to access private messages.</div>;
  }

  if (!user) {
    return loading ? <Loading /> : <SingleColumnSection>Failed to create conversation: User could not be found.</SingleColumnSection>;
  }

  if (user._id === currentUser._id) {
    return <SingleColumnSection>Failed to create conversation: You cannot create a converstaion with yourself.</SingleColumnSection>;
  }

  return <MessageUserInner user={user} />
};

const MessageUserComponent = registerComponent("MessageUser", MessageUser);

declare global {
  interface ComponentTypes {
    MessageUser: typeof MessageUserComponent;
  }
}
