import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useSingle } from "../../lib/crud/withSingle";
import { isProduction } from "../../lib/executionEnvironment";
import classNames from "classnames";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 0,
    display: "flex",
    flexDirection: "row",
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
    },
  },
  columnSection: {
    marginBottom: 0,
    width: "100%",
  },
  stickToBottom: {
    marginTop: "auto",
  },
  welcomeBoxPadding: {
    padding: "32px 32px 3px 32px",
    marginLeft: "auto",
    width: "fit-content",
    [theme.breakpoints.down("md")]: {
      margin: "auto",
      maxWidth: 680,
      width: "100%",
      padding: "0px 16px 16px 16px",
      display: "none",
    },
  },
  welcomeBox: {
    padding: 16,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    border: theme.palette.border.commentBorder,
    borderColor: theme.palette.secondary.main,
    borderWidth: 2,
    borderRadius: 3,
    maxWidth: 380,
    [theme.breakpoints.down("md")]: {
      padding: "16px 16px 4px 16px",
      maxWidth: "unset",
      width: "100%",
    },
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  title: {
    margin: "auto",
    marginBottom: 10,
  },
});

export const TagSubforumPage = ({ classes, user }: { classes: ClassesType; user: UsersProfile }) => {
  const {
    Error404,
    Loading,
    PostsCommentsThread,
    SectionTitle,
    SingleColumnSection,
    Typography,
    ContentStyles,
    ContentItemBody,
  } = Components;

  const { params } = useLocation();
  const { slug } = params;

  // TODO-JM: add comment explaining the use of TagPreviewFragment (which loads on hover over tag) to avoid extra round trip
  const { tag, loading, error } = useTagBySlug(slug, "TagSubforumFragment");
  const { document: post } = useSingle({
    collectionName: "Posts",
    fragmentName: "PostsDetails",
    documentId: tag?.subforumShortformPostId,
    skip: !tag?.subforumShortformPostId,
  });

  if (loading) {
    return <Loading />;
  }

  // TODO-WH: remove isProduction flag here when we are ready to show this to users
  if (isProduction || !tag || !tag.subforumShortformPostId) {
    return <Error404 />;
  }

  if (error && !isMissingDocumentError(error)) {
    return (
      <SingleColumnSection>
        <Typography variant="body1">{error.message}</Typography>
      </SingleColumnSection>
    );
  }

  const welcomeBoxComponent = (
    <div className={classes.welcomeBoxPadding}>
      <div className={classes.welcomeBox}>
        <ContentStyles contentType="comment">
          <ContentItemBody
            dangerouslySetInnerHTML={{ __html: tag.subforumWelcomeText?.html || "" }}
            description={`${tag.name} subforum`}
          />
        </ContentStyles>
      </div>
    </div>
  );

  return (
    <div className={classes.root}>
      <SingleColumnSection className={classNames(classes.columnSection, classes.stickToBottom)}>
        {welcomeBoxComponent}
      </SingleColumnSection>
      <SingleColumnSection className={classes.columnSection}>
        <SectionTitle title={`${tag.name} Subforum`} className={classes.title} />
        <AnalyticsContext pageSectionContext="commentsSection">
          <PostsCommentsThread
            terms={{ postId: tag.subforumShortformPostId, view: "postCommentsNew", limit: 50 }}
            newForm
            timelineView
            post={post}
          />
        </AnalyticsContext>
      </SingleColumnSection>
      <div className={classes.columnSection}></div>
    </div>
  );
};

const TagSubforumPageComponent = registerComponent("TagSubforumPage", TagSubforumPage, { styles });

declare global {
  interface ComponentTypes {
    TagSubforumPage: typeof TagSubforumPageComponent;
  }
}
