import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { subforumDiscussionDefaultSorting } from "../../lib/collections/comments/views";
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
  headline: {
    paddingLeft: 24,
    paddingBottom: 12,
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
  scrollableSidebarWrapper: {
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
    flexBasis: 0,
    flexGrow: 1,
    textTransform: 'none',
    background: theme.palette.grey[200],
    padding: '8px 16px',
    outline: 'none',
    '& > .Typography-root': {
      color: theme.palette.grey[500],
      fontSize: 20,
      [theme.breakpoints.down("xs")]: {
        fontSize: 16,
        lineHeight: '24px',
      }
    },
    borderRadius: 0,
    '&:active': {
      background: 'transparent',
    },
  },
  tabSelected: {
    background: 'transparent',
    borderTop: `4px solid ${theme.palette.grey[200]}`,
    '& .Typography-root': {
      color: 'unset',
      borderBottom: `solid 2px ${theme.palette.primary.main}`,
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
    TagSubforumPostsSection,
    SubforumNotificationSettings
  } = Components;

  const { params, query, location, hash } = useLocation();
  const { history } = useNavigation()
  const currentUser = useCurrentUser()

  const { slug } = params;
  const sortDiscussionBy = query.sortDiscussionBy || subforumDiscussionDefaultSorting;

  const { tag, loading, error } = useTagBySlug(slug, "TagSubforumFragment");
  
  const [tab, setTab] = useState(hash?.slice(1) || 'discussion')
  
  const handleChangeTab = (value) => {
    setTab(value)
    history.replace({...location, hash: value})
  }

  const { openDialog } = useDialog();
  
  const { results: members, totalCount: membersCount } = useMulti({
    terms: {view: 'tagCommunityMembers', profileTagId: tag?._id, limit: 0},
    collectionName: 'Users',
    fragmentName: 'UsersProfile',
    enableTotal: true,
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

  const welcomeBoxComponent = tag.subforumWelcomeText?.html && tab === 'discussion' ? (
    <ContentStyles contentType="tag" className={classes.scrollableContentStyles}>
      <div className={classNames(classes.scrollableSidebarWrapper, classes.columnSection)}>
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
    <AnalyticsContext pageContext="subforumPage" tagId={tag._id}>
      <div className={classes.root}>
        <HeadTags
          description={`A space for casual discussion of ${tag.name.toLowerCase()} on ${siteNameWithArticleSetting.get()}`}
          title={`${startCase(tag.name)} Subforum`}
        />
        <div className={classNames(classes.columnSection, classes.aside)}>
          {welcomeBoxComponent}
        </div>
        <SingleColumnSection className={classNames(classes.columnSection, classes.fullWidth)}>
          <div className={classes.headline}>
            <SectionTitle title={titleComponent} className={classes.title}>
              {currentUser ? <SubforumNotificationSettings tag={tag} currentUser={currentUser} /> : null}
            </SectionTitle>
            {members && <button className={classes.membersListLink} onClick={onClickMembersList}>{membersCount} members</button>}
          </div>
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
              terms={{ tagId: tag._id, view: "tagSubforumComments", limit: 50, sortBy: sortDiscussionBy }}
            />
          </AnalyticsContext>}
          {tab === 'posts' && <AnalyticsContext pageSectionContext="postsSection">
            <TagSubforumPostsSection tag={tag}/>
          </AnalyticsContext>}
        </SingleColumnSection>
        <div className={classNames(classes.columnSection, classes.aside)}>
          {tag?.tableOfContents?.html &&
            <ContentStyles contentType="tag" className={classes.scrollableContentStyles}>
              <div className={classNames(classes.scrollableSidebarWrapper, classes.columnSection)}>
                <div className={classes.wikiSidebar} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.tableOfContents.html, false) }}></div>
              </div>
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
