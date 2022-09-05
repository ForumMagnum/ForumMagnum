import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useSingle } from "../../lib/crud/withSingle";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 0
  },
  title: {
    marginLeft: 24,
    marginBottom: 10,
  },
});

export const TagSubforumPage = ({ classes, user }: { classes: ClassesType; user: UsersProfile }) => {
  const { Error404, Loading, PostsCommentsThread, SectionTitle, SingleColumnSection, Typography } = Components;

  const { params } = useLocation();
  const { slug } = params;
  // TODO-JM: add comment explaining the use of TagPreviewFragment (which loads on hover over tag) to avoid extra round trip
  const { tag, loading, error } = useTagBySlug(slug, "TagPreviewFragment");
  const { document: post } = useSingle({
    collectionName: "Posts",
    fragmentName: "PostsDetails",
    documentId: tag?.subforumShortformPostId,
    skip: !tag?.subforumShortformPostId,
  });

  if (loading) {
    return <Loading />;
  }

  if (error && !isMissingDocumentError(error)) {
    return (
      <SingleColumnSection>
        <Typography variant="body1">{error.message}</Typography>
      </SingleColumnSection>
    );
  }

  if (!tag) {
    return <Error404 />;
  }

  return (
    <>
      <SingleColumnSection className={classes.root}>
        <SectionTitle title={`${tag.name} Subforum`} className={classes.title} noTopMargin />
        <AnalyticsContext pageSectionContext="commentsSection">
          <PostsCommentsThread
            terms={{ postId: tag.subforumShortformPostId, view: "postCommentsNew", limit: 50 }} // TODO, add new view for 
            newForm
            timelineView
            post={post}
          />
        </AnalyticsContext>
      </SingleColumnSection>
    </>
  );
};

const TagSubforumPageComponent = registerComponent("TagSubforumPage", TagSubforumPage, { styles });

declare global {
  interface ComponentTypes {
    TagSubforumPage: typeof TagSubforumPageComponent;
  }
}
