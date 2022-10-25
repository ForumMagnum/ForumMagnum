import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { subforumDefaultSorting } from "../../lib/collections/comments/views";
import startCase from "lodash/startCase";
import truncateTagDescription from "../../lib/utils/truncateTagDescription";
import { Link } from "../../lib/reactRouterWrapper";
import { tagGetUrl } from "../../lib/collections/tags/helpers";
import { taggingNameSetting, siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { useCurrentUser } from "../common/withUser";
import { auto } from "@popperjs/core";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    margin: "0 32px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 32,
    [theme.breakpoints.down("md")]: {
      margin: 0,
      flexDirection: "column",
    },
    height: "100%"
  },
  columnSection: {
    maxWidth: '100%',
    height: "100%",
    [theme.breakpoints.up("lg")]: {
      margin: 0,
    },
    [theme.breakpoints.down("md")]: {
      marginBottom: 0,
    },
    display: "flex",
    flexDirection: "column",
  },
  stickToBottom: {
    marginTop: "auto",
    marginBottom: "1.3em",
  },
  aside: {
    width: 380,
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  welcomeBox: {
    padding: 16,
    marginTop: "auto",
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    border: theme.palette.border.commentBorder,
    borderColor: theme.palette.secondary.main,
    borderWidth: 2,
    borderRadius: 3,
  },
  title: {
    textTransform: "capitalize",
    marginLeft: 24,
    marginBottom: 10,
  },
  wikiSidebarWrapper: {
    overflow: "auto",
    flexBasis: 0,
    flexGrow: 1,
    padding: 0,
    marginTop: 84,
  },
  wikiSidebar: {
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
  },
  scrollableContentStyles: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  }
});

export const TagSubforumPage = ({ classes }: { classes: ClassesType}) => {
  const {
    Error404,
    Loading,
    SubforumCommentsThread,
    SectionTitle,
    SingleColumnSection,
    Typography,
    ContentStyles,
    ContentItemBody,
    LWTooltip,
    HeadTags,
    SubforumNotificationSettings
  } = Components;
  const { params, query } = useLocation();
  const currentUser = useCurrentUser();
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

  const welcomeBoxComponent = tag.subforumWelcomeText?.html ? (
    <ContentStyles contentType="tag" className={classes.scrollableContentStyles}>
      <div className={classNames(classes.wikiSidebarWrapper, classes.columnSection)}>
        <div className={classes.welcomeBox} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.subforumWelcomeText.html, false) }}></div>
      </div>
    </ContentStyles>
  ) : <></>;

  const titleComponent = <>
    <LWTooltip title={`To ${taggingNameSetting.get()} page`} placement="top-start" className={classes.tooltip}>
      <Link to={tagGetUrl(tag)}>
        {startCase(tag.name)}
      </Link>
    </LWTooltip>
    {" "}Subforum
  </>

  return (
    <div className={classes.root}>
      <HeadTags
        description={`A space for casual discussion of ${tag.name.toLowerCase()} on ${siteNameWithArticleSetting.get()}`}
        title={`${startCase(tag.name)} Subforum`}
      />
      <div className={classNames(classes.columnSection, classes.aside)}>
        {welcomeBoxComponent}
      </div>
      <SingleColumnSection className={classNames(classes.columnSection, classes.fullWidth)}>
        <SectionTitle title={titleComponent} className={classes.title}>
          {currentUser ? <SubforumNotificationSettings tag={tag} currentUser={currentUser} /> : null}
        </SectionTitle>
        <AnalyticsContext pageSectionContext="commentsSection">
          <SubforumCommentsThread
            tag={tag}
            terms={{ tagId: tag._id, view: "tagSubforumComments", limit: 50, sortBy }}
          />
        </AnalyticsContext>
      </SingleColumnSection>
      <div className={classNames(classes.columnSection, classes.aside)}>
        {tag?.tableOfContents?.html &&
          <ContentStyles contentType="tag" className={classes.scrollableContentStyles}>
            <div className={classNames(classes.wikiSidebarWrapper, classes.columnSection)}>
              <div className={classes.wikiSidebar} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.tableOfContents.html, false) }}></div>
            </div>
          </ContentStyles>
        }
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
