import React from "react";
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
import { useDialog } from "../common/withDialog";
import { useMulti } from "../../lib/crud/withMulti";
import { useCurrentUser } from "../common/withUser";

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
  },
  columnSection: {
    maxWidth: '100%',
    [theme.breakpoints.up("lg")]: {
      margin: 0,
    },
    [theme.breakpoints.down("md")]: {
      marginBottom: 0,
    },
  },
  headline: {
    paddingLeft: 24,
    paddingBottom: 15,
    borderBottom: theme.palette.border.itemSeparatorBottom,
    '& .SectionTitle-root': {
      marginTop: 18,
      paddingBottom: 2
    }
  },
  title: {
    textTransform: "capitalize",
    fontSize: 22,
    lineHeight: '28px',
    [theme.breakpoints.down("xs")]: {
      fontSize: 18,
      lineHeight: '24px',
    }
  },
  membersListLink: {
    background: 'none',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.primary.main,
    padding: 0,
    '&:hover': {
      opacity: 0.5
    },
  },
  stickToBottom: {
    marginTop: "auto",
    marginBottom: 3,
  },
  aside: {
    width: 380,
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
  },
  wikiSidebar: {
    marginTop: 84,
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
  
  const { openDialog } = useDialog();
  
  const { results: members } = useMulti({
    terms: {view: 'tagCommunityMembers', profileTagId: tag?._id, limit: 50},
    collectionName: 'Users',
    fragmentName: 'UsersProfile',
    skip: !tag
  })
  
  const onClickMembersList = () => {
    if (tag) {
      openDialog({
        componentName: 'SubforumMembersDialog',
        componentProps: {tag},
        closeOnNavigate: true
      })
    }
  }

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
    <div className={classes.welcomeBox}>
      <ContentStyles contentType="comment">
        <ContentItemBody
          dangerouslySetInnerHTML={{ __html: tag.subforumWelcomeText?.html || "" }}
          description={`${tag.name} subforum`}
        />
      </ContentStyles>
    </div>
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
      <div className={classNames(classes.columnSection, classes.stickToBottom, classes.aside)}>
        {welcomeBoxComponent}
      </div>
      <SingleColumnSection className={classNames(classes.columnSection, classes.fullWidth)}>
        <div className={classes.headline}>
          <SectionTitle title={titleComponent} className={classes.title}>
            {currentUser ? <SubforumNotificationSettings tag={tag} currentUser={currentUser} /> : null}
          </SectionTitle>
          {members && <button className={classes.membersListLink} onClick={onClickMembersList}>{members.length} members</button>}
        </div>
        <AnalyticsContext pageSectionContext="commentsSection">
          <SubforumCommentsThread
            tag={tag}
            terms={{ tagId: tag._id, view: "tagSubforumComments", limit: 50, sortBy }}
          />
        </AnalyticsContext>
      </SingleColumnSection>
      <div className={classNames(classes.columnSection, classes.aside)}>
        {tag?.tableOfContents?.html &&
          <ContentStyles contentType="tag">
            <div className={classNames(classes.wikiSidebar, classes.columnSection)} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.tableOfContents.html, false) }} />
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
