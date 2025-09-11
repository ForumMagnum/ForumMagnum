import React, { useCallback, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { gql, useMutation } from "@apollo/client";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { useMessages } from "../common/withMessages";
import { useCurrentUser } from "../common/withUser";
import { useSingle } from "@/lib/crud/withSingle";
import { Link } from "@/lib/reactRouterWrapper";
import SingleColumnSection from "../common/SingleColumnSection";
import Error404 from "../common/Error404";
import EAOnboardingInput from "../ea-forum/onboarding/EAOnboardingInput";
import EAButton from "../ea-forum/EAButton";
import Loading from "../vulcan-core/Loading";
import UsersName from "../users/UsersName";
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    paddingTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    fontWeight: 500,
  },
});

const AdminEventPostEmailPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {flash} = useMessages();
  const currentUser = useCurrentUser();
  const [postId, setPostId] = useState("");

  const {document: post, loading: postLoading} = useSingle({
    collectionName: "Posts",
    fragmentName: "PostsList",
    documentId: postId,
    skip: !postId,
  });

  const [sendEmail] = useMutation(gql`
    mutation sendEventPostEmail($postId: String!, $isTest: Boolean!) {
      sendEventPostEmail(postId: $postId, isTest: $isTest)
    }
  `, {errorPolicy: "all"});

  const sendTestEmail = useCallback(async () => {
    if (postLoading) {
      flash("Error: Post still loading");
      return;
    }
    if (!post) {
      flash("Error: Post not found");
      return;
    }
    flash("Sending...");
    await sendEmail({
      variables: {
        postId: post._id,
        isTest: true,
      },
    });
    flash(`Sent test email of "${post.title}"`);
  }, [flash, postLoading, post, sendEmail]);

  if (!currentUser?.isAdmin) {
    return (
      <Error404 />
    );
  }

  return (
    <SingleColumnSection className={classes.root}>
      <EAOnboardingInput
        value={postId}
        setValue={setPostId}
        placeholder="Post ID"
      />
      {postLoading && <Loading />}
      {postId && !postLoading && (
        post
          ? (
            <>
              <div>
                <PostsTooltip post={post}>
                  <Link to={postGetPageUrl(post)}>{post.title}</Link>
                </PostsTooltip> by <UsersName user={post.user} />
              </div>
              <EAButton onClick={sendTestEmail}>
                Send test email to myself
              </EAButton>
            </>
          )
          : (
            <div>Post not found</div>
          )
      )}
    </SingleColumnSection>
  );
}

export default registerComponent(
  "AdminEventPostEmailPage",
  AdminEventPostEmailPage,
  {styles},
);
