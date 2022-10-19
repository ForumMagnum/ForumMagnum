import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation, useNavigation } from "../../lib/routeUtil";
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
  title: {
    textTransform: "capitalize",
    marginLeft: 24,
    marginBottom: 0,
    lineHeight: 1.2,
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
  },
  tabSection: {
    marginBottom: 16,
    display: 'flex',
    width: '100%',
  },
  tab: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    textTransform: 'none',
    background: theme.palette.grey[200],
    padding: '8px 16px',
    outline: 'none',
    '& > .Typography-root': {
      color: theme.palette.grey[500],
    },
    borderRadius: 0,
    '&:active': {
      background: 'transparent',
    },
  },
  tabSelected: {
    background: 'transparent',
    borderTop: `2px solid ${theme.palette.grey[200]}`,
    '& .Typography-root': {
      color: 'unset',
      borderBottom: `solid 2px ${theme.palette.primary.main}`,
    },
  }
});

export const TagSubforumPage = ({ classes, user }: { classes: ClassesType; user: UsersProfile }) => {
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
    TagSubforumPostsSection,
  } = Components;

  const { params, query, location, hash } = useLocation();
  const { history } = useNavigation()
  const currentUser = useCurrentUser()
  const { slug } = params;
  const sortBy = query.sortBy || subforumDefaultSorting;

  const { tag, loading, error } = useTagBySlug(slug, "TagSubforumFragment");
  
  const [tab, setTab] = useState(hash?.slice(1) || 'discussion')
  
  const handleChangeTab = (value) => {
    setTab(value)
    history.replace({...location, hash: value})
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

  const welcomeBoxComponent = tag.subforumWelcomeText?.html && tab === 'discussion' ? (
    <div className={classes.welcomeBox}>
      <ContentStyles contentType="comment">
        <ContentItemBody
          dangerouslySetInnerHTML={{ __html: tag.subforumWelcomeText?.html || "" }}
          description={`${tag.name} subforum`}
        />
      </ContentStyles>
    </div>
  ) : <></>;

  const isSubscribed = currentUser && currentUser.profileTagIds?.includes(tag._id)
  const titleComponent = <>
    <LWTooltip title={`To ${taggingNameSetting.get()} page`} placement="top-start" className={classes.tooltip}>
      <Link to={tagGetUrl(tag)}>
        {startCase(tag.name)}
      </Link>
    </LWTooltip>
    {" "}Subforum
  </>

  return (
    <AnalyticsContext pageContext="subforumPage" tagId={tag._id}>
      <div className={classes.root}>
        <HeadTags
          description={`A space for casual discussion of ${tag.name.toLowerCase()} on ${siteNameWithArticleSetting.get()}`}
          title={`${startCase(tag.name)} Subforum`}
        />
        <div className={classNames(classes.columnSection, classes.stickToBottom, classes.aside)}>
          {welcomeBoxComponent}
        </div>
        <SingleColumnSection className={classNames(classes.columnSection)}>
          <SectionTitle title={titleComponent} className={classes.title} />
          <div onChange={handleChangeTab} className={classes.tabSection} aria-label='view subforum discussion or posts'>
            <button onClick={() => handleChangeTab('discussion')} className={classNames(classes.tab, {[classes.tabSelected]: tab === 'discussion'})}>
              <Typography variant="headline">Discussion</Typography>
            </button>
            <button onClick={() => handleChangeTab('posts')} className={classNames(classes.tab, {[classes.tabSelected]: tab === 'posts'})}>
              <Typography variant="headline">Posts</Typography>
            </button>
          </div>
          {tab === 'discussion' && <AnalyticsContext pageSectionContext="commentsSection">
            <SubforumCommentsThread
              tag={tag}
              terms={{ tagId: tag._id, view: "tagSubforumComments", limit: 50, sortBy }}
            />
          </AnalyticsContext>}
          {tab === 'posts' && <AnalyticsContext pageSectionContext="postsSection">
            <TagSubforumPostsSection tag={tag}/>
          </AnalyticsContext>}
        </SingleColumnSection>
        <div className={classNames(classes.columnSection, classes.aside)}>
          {tag?.tableOfContents?.html &&
            <ContentStyles contentType="tag">
              <div className={classNames(classes.wikiSidebar, classes.columnSection)} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.tableOfContents.html, false) }} />
            </ContentStyles>
          }
        </div>
      </div>
    </AnalyticsContext>
  );
};

const TagSubforumPageComponent = registerComponent("TagSubforumPage", TagSubforumPage, { styles });

declare global {
  interface ComponentTypes {
    TagSubforumPage: typeof TagSubforumPageComponent;
  }
}
