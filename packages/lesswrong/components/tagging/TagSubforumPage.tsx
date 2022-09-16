import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
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
  fullWidth: {
    flex: 'none',
  },
  stickToBottom: {
    marginTop: "auto",
  },
  welcomeBoxPadding: {
    padding: "32px 32px 3px 32px",
    marginLeft: "auto",
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
    marginLeft: 24,
    marginBottom: 10,
  },
});

export const TagSubforumPage = ({ classes, user }: { classes: ClassesType; user: UsersProfile }) => {
  const { Error404, Loading, SubforumCommentsThread, SectionTitle, SingleColumnSection, Typography, ContentStyles, ContentItemBody } = Components;

  const { params, query } = useLocation();
  const { slug } = params;
  const sortBy = query.sortBy || "new";

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
            newForm
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
