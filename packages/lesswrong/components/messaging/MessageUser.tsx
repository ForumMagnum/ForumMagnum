"use client";
import React, { useEffect } from "react";
import { useCurrentUser } from "../common/withUser";
import { useInitiateConversation } from "../hooks/useInitiateConversation";
import Loading from "../vulcan-core/Loading";
import PermanentRedirect from "../common/PermanentRedirect";
import SingleColumnSection from "../common/SingleColumnSection";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { StatusCodeSetter } from "../next/StatusCodeSetter";
import { defineStyles } from "@/components/hooks/defineStyles";
import { useStyles } from "@/components/hooks/useStyles";

const GetUserBySlugQuery = gql(`
  query MessageUserGetUserBySlug($slug: String!) {
    GetUserBySlug(slug: $slug) {
      ...UsersMinimumInfo
    }
  }
`);

const styles = defineStyles("MessageUser", (theme: ThemeType) => ({
  error: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    fontWeight: 450,
    marginTop: 16,
    padding: 16
  },
}));

const MessageUserInnerInner = ({ user }: {
  user: UsersMinimumInfo
}) => {
  const classes = useStyles(styles);
  const { conversation, conversationLoading, initiateConversation } = useInitiateConversation();

  useEffect(() => {
    initiateConversation([user._id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!conversation) {
    return conversationLoading ? <Loading /> : <>
      <StatusCodeSetter status={500}/>
      <SingleColumnSection className={classes.error}>Failed to create conversation: Unknown error.</SingleColumnSection>
    </>;
  }

  const url = `/inbox?conversation=${conversation._id}&from=magic_link`;
  return <PermanentRedirect url={url} status={302} />;
};

const MessageUser = ({ slug }: { slug: string }) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { data, loading } = useQuery(GetUserBySlugQuery, {
    variables: { slug: slug },
    skip: !currentUser || !slug,
  });

  const user = data?.GetUserBySlug;

  if (!currentUser) {
    return <>
      <StatusCodeSetter status={401}/>
      <SingleColumnSection className={classes.error}>Log in to access private messages.</SingleColumnSection>
    </>;
  }

  if (!user) {
    return loading ? (
      <Loading />
    ) : (<>
      <StatusCodeSetter status={400}/>
      <SingleColumnSection className={classes.error}>
        Failed to create conversation: User could not be found.
      </SingleColumnSection>
    </>);
  }

  if (user._id === currentUser._id) {
    return <>
      <StatusCodeSetter status={400}/>
      <SingleColumnSection className={classes.error}>
        Failed to create conversation: You cannot create a conversation with yourself.
      </SingleColumnSection>
    </>;
  }

  return <MessageUserInnerInner user={user} />;
};

export default MessageUser;
