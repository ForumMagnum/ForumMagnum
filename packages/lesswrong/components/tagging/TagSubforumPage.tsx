import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useSingle } from "../../lib/crud/withSingle";
import { isProduction } from "../../lib/executionEnvironment";
import Button from "@material-ui/core/Button";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 0,
  },
  main: {
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
  welcomeBoxPadding: {
    padding: 32,
    marginLeft: "auto",
    width: "fit-content",
    [theme.breakpoints.down("md")]: {
      margin: "auto",
      maxWidth: 680,
      width: "100%",
      padding: "0px 16px 16px 16px",
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
      padding: '16px 16px 4px 16px',
      maxWidth: 'unset',
      width: "100%",
      // maxWidth: 680,
      // width: 680,
    },
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  welcomeBoxButtonRow: {
    textAlign: 'right',
    display: 'none',
    [theme.breakpoints.down("md")]: {
      display: 'block',
    },
  },
  formButton: {
    padding: "0px 16px",
    fontFamily: theme.typography.fontFamily,
    fontSize: "14px",
    color: theme.palette.secondary.main,
    "&:hover": {
      background: theme.palette.panelBackground.darken05,
    }
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
  const [showWelcomeBox, setShowWelcomeBox] = useState(true);

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

  return (
    <div className={classes.root}>
      <SectionTitle title={`${tag.name} Subforum`} className={classes.title} />
      <div className={classes.main}>
        <SingleColumnSection className={classes.columnSection}>
          {showWelcomeBox && (
            <div className={classes.welcomeBoxPadding}>
              <div className={classes.welcomeBox}>
                <ContentStyles contentType="comment">
                  <ContentItemBody
                    dangerouslySetInnerHTML={{ __html: tag.subforumWelcomeText?.html || "" }}
                    description={`${tag.name} subforym`}
                  />
                </ContentStyles>
                <div className={classes.welcomeBoxButtonRow}>
                  <Button className={classes.formButton} onClick={() => setShowWelcomeBox(false)}>Dismiss</Button>
                </div>
              </div>
            </div>
          )}
        </SingleColumnSection>
        <SingleColumnSection className={classes.columnSection}>
          <AnalyticsContext pageSectionContext="commentsSection">
            <PostsCommentsThread
              terms={{ postId: tag.subforumShortformPostId, view: "postCommentsNew", limit: 50 }}
              newForm
              timelineView
              post={post}
              //, TODO try and avoid having pass this in to make it rerender
              showingWelcomeBox={showWelcomeBox}
            />
          </AnalyticsContext>
        </SingleColumnSection>
        <div className={classes.columnSection}></div>
      </div>
    </div>
  );
};

const TagSubforumPageComponent = registerComponent("TagSubforumPage", TagSubforumPage, { styles });

declare global {
  interface ComponentTypes {
    TagSubforumPage: typeof TagSubforumPageComponent;
  }
}
