import React, { useEffect } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation } from "../../lib/routeUtil";
import { useCurrentUser } from "../common/withUser";
import { useInitiateConversation } from "../hooks/useInitiateConversation";
import Loading from "../vulcan-core/Loading";
import PermanentRedirect from "../common/PermanentRedirect";
import SingleColumnSection from "../common/SingleColumnSection";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const GetUserBySlugQuery = gql(`
  query MessageUserGetUserBySlug($slug: String!) {
    GetUserBySlug(slug: $slug) {
      ...UsersMinimumInfo
    }
  }
`);

const styles = (theme: ThemeType) => ({
  error: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    fontWeight: 450,
    marginTop: 16,
    padding: 16
  },
});

const MessageUserInnerInner = ({ user, classes }: { user: UsersMinimumInfo; classes: ClassesType<typeof styles> }) => {
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
  const { data, loading } = useQuery(GetUserBySlugQuery, {
    variables: { slug: params.slug },
    skip: !currentUser || !params.slug,
  });

  const user = data?.GetUserBySlug;

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

  return <MessageUserInnerInner user={user} classes={classes} />;
};

export default registerComponent("MessageUser", MessageUser, { styles });


