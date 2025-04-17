import React, { useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation } from "../../lib/routeUtil";
import { useCurrentUser } from "../common/withUser";
import { useInitiateConversation } from "../hooks/useInitiateConversation";
import { useGetUserBySlug } from "../hooks/useGetUserBySlug";

const styles = (theme: ThemeType) => ({
  error: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    fontWeight: 450,
    marginTop: 16,
    padding: 16
  },
});

const MessageUserInner = ({ user, classes }: { user: UsersMinimumInfo; classes: ClassesType<typeof styles> }) => {
  const { Loading, PermanentRedirect, SingleColumnSection } = Components;

  const { conversation, conversationLoading, initiateConversation } = useInitiateConversation();

  useEffect(() => {
    initiateConversation([user._id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!conversation) {
    return conversationLoading ? (
      <Loading />
    ) : (
      <SingleColumnSection className={classes.error}>Failed to create conversation: Unknown error.</SingleColumnSection>
    );
  }

  const url = `/inbox/${conversation._id}?from=magic_link`;
  return <PermanentRedirect url={url} status={302} />;
};

const MessageUser = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const currentUser = useCurrentUser();
  const { params } = useLocation();
  const { Loading, SingleColumnSection } = Components;

  const { user, loading } = useGetUserBySlug(params.slug, { fragmentName: 'UsersMinimumInfo', skip: !currentUser || !params.slug });

  if (!currentUser) {
    return <SingleColumnSection className={classes.error}>Log in to access private messages.</SingleColumnSection>;
  }

  if (!user) {
    return loading ? (
      <Loading />
    ) : (
      <SingleColumnSection className={classes.error}>
        Failed to create conversation: User could not be found.
      </SingleColumnSection>
    );
  }

  if (user._id === currentUser._id) {
    return (
      <SingleColumnSection className={classes.error}>
        Failed to create conversation: You cannot create a conversation with yourself.
      </SingleColumnSection>
    );
  }

  return <MessageUserInner user={user} classes={classes} />;
};

const MessageUserComponent = registerComponent("MessageUser", MessageUser, { styles });

declare global {
  interface ComponentTypes {
    MessageUser: typeof MessageUserComponent;
  }
}
