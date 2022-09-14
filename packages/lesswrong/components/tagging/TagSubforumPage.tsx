import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { subforumDefaultSorting } from "../../lib/collections/comments/views";
import truncateTagDescription from "../../lib/utils/truncateTagDescription";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 0,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 32,
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
    },
  },
  columnSection: {
    [theme.breakpoints.up("lg")]: {
      margin: 0,
    }
  },
  stickToBottom: {
    marginTop: "auto",
    marginBottom: 3,
  },
  aside: {
    width: "fit-content",
    [theme.breakpoints.down("md")]: {
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
  },
  title: {
    textTransform: "capitalize",
    marginLeft: 24,
    marginBottom: 10,
  },
  wikiSidebar: {
    marginTop: 84,
    maxWidth: 380,
    gridColumnStart: 3,
    padding: '2em',
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    '& a': {
      color: theme.palette.primary,
    },
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  }
});

export const TagSubforumPage = ({ classes, user }: { classes: ClassesType; user: UsersProfile }) => {
  const { Error404, Loading, SubforumCommentsThread, SectionTitle, SingleColumnSection, Typography, ContentStyles, ContentItemBody } = Components;

  const { params, query } = useLocation();
  const { slug } = params;
  const sortBy = query.sortBy || subforumDefaultSorting;

  const { tag, loading, error } = useTagBySlug(slug, "TagSubforumFragment");

  if (loading) {
    return <Loading />;
  }

  if (!tag || !tag.isSubforum) {
    return <Error404 />;
  }

  if (error && !isMissingDocumentError(error)) {
    return (
      <SingleColumnSection>
        <Typography variant="body1">{error.message}</Typography>
      </SingleColumnSection>
    );
  }

  const welcomeBoxComponent = tag.subforumWelcomeText ? (
    <div className={classes.aside}>
      <div className={classes.welcomeBox}>
        <ContentStyles contentType="comment">
          <ContentItemBody
            dangerouslySetInnerHTML={{ __html: tag.subforumWelcomeText?.html || "" }}
            description={`${tag.name} subforum`}
          />
        </ContentStyles>
      </div>
    </div>
  ) : <></>;

  return (
    <div className={classes.root}>
      <div className={classNames(classes.columnSection, classes.stickToBottom)}>
        {welcomeBoxComponent}
      </div>
      <SingleColumnSection className={classNames(classes.columnSection, classes.fullWidth)}>
        <SectionTitle title={`${tag.name} Subforum`} className={classes.title} />
        <AnalyticsContext pageSectionContext="commentsSection">
          <SubforumCommentsThread
            tag={tag}
            terms={{ tagId: tag._id, view: "tagSubforumComments", limit: 50, sortBy }}
          />
        </AnalyticsContext>
      </SingleColumnSection>
      <div className={classes.columnSection}>
        {tag?.tableOfContents?.html &&
          <div className={classes.aside}>
          <ContentStyles contentType="tag">
            <div className={classNames(classes.wikiSidebar, classes.columnSection)} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.tableOfContents.html, false) }}>
            </div>
          </ContentStyles>
        </div>}
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
