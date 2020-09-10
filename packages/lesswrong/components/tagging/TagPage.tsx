import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { commentBodyStyles } from '../../themes/stylePiping'
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import Typography from '@material-ui/core/Typography';
import CommentOutlinedIcon from '@material-ui/icons/ModeCommentOutlined';
import { truncate } from '../../lib/editor/ellipsize';
import { Tags } from '../../lib/collections/tags/collection';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema'
import { userCanViewRevisionHistory } from '../../lib/betas';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import HistoryIcon from '@material-ui/icons/History';
import { useDialog } from '../common/withDialog';
import { useHover } from '../common/withHover';

// Also used in TagCompareRevisions, TagDiscussionPage
export const styles = (theme: ThemeType): JssStyles => ({
  tagPage: {
    ...commentBodyStyles(theme),
    color: theme.palette.grey[600]
  },
  description: {
    marginTop: 18,
    ...commentBodyStyles(theme),
    marginBottom: 18,
  },
  loadMore: {
    flexGrow: 1,
    textAlign: "left"
  },
  title: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
    fontWeight: 600,
    fontVariant: "small-caps"
  },
  wikiSection: {
    marginBottom: 24,
    paddingTop: 19,
    paddingBottom: 12,
    paddingLeft: 42,
    paddingRight: 42,
    background: "white"
  },
  tagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  postsTaggedTitle: {
    color: theme.palette.grey[600]
  },
  disabledButton: {
    '&&': {
      color: theme.palette.grey[500],
      cursor: "default",
      marginBottom: 12
    }
  },
  buttonsRow: {
    ...theme.typography.body2,
    ...theme.typography.uiStyle,
    marginTop: 2,
    marginBottom: 16,
    color: theme.palette.grey[700],
    display: "flex",
    '& svg': {
      height: 20,
      width: 20,
      marginRight: 4,
      cursor: "pointer",
      color: theme.palette.grey[700]
    }
  },
  button: {
    display: "flex",
    alignItems: "center",
    marginRight: 16
  },
  discussionButton: {
    display: "flex",
    alignItems: "center",
    marginRight: 16,
    marginLeft: "auto"
  },
  subscribeTo: {
    marginRight: 16
  }
});

export const tagPostTerms = (tag: TagBasicInfo | null, query: any) => {
  if (!tag) return
  return ({
    ...query,
    filterSettings: {tags:[{tagId: tag._id, tagName: tag.name, filterMode: "Required"}]},
    view: "tagRelevance",
    tagId: tag._id,
  })
}

const TagPage = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, SubscribeTo, PostsListSortDropdown, PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404, PermanentRedirect, HeadTags, LWTooltip, PopperCard, TagDiscussion } = Components;
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const { revision } = query;
  const { tag, loading: loadingTag } = useTagBySlug(slug, revision?"TagRevisionFragment":"TagFragment", {
    extraVariables: revision ? {version: 'String'} : {},
    extraVariablesValues: revision ? {version: revision} : {},
  });
  const [truncated, setTruncated] = useState(true)
  const { captureEvent } =  useTracking()
  const { openDialog } = useDialog();
  
  const { hover, anchorEl, eventHandlers} = useHover()

  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  // If the slug in our URL is not the same as the slug on the tag, redirect to the canonical slug page
  if (tag.oldSlugs?.filter(slug => slug !== tag.slug)?.includes(slug)) {
    return <PermanentRedirect url={Tags.getUrl(tag)} />
  }

  const terms = {
    ...tagPostTerms(tag, query),
    limit: 15
  }

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }

  const description = truncated ? truncate(tag.description?.html, tag.descriptionTruncationCount || 4, "paragraphs", "<a>(Read More)</a>") : tag.description?.html
  const headTagDescription = tag.description?.plaintextDescription || `All posts related to ${tag.name}, sorted by relevance`

  return <AnalyticsContext
    pageContext='tagPage'
    tagName={tag.name}
    tagId={tag._id}
    sortedBy={query.sortedBy || "relevance"}
    limit={terms.limit}
  >
    <HeadTags
      description={headTagDescription}
    />
    <SingleColumnSection>
      <div className={classes.wikiSection}>
        <AnalyticsContext pageSectionContext="wikiSection">
          <div>
            <Typography variant="display3" className={classes.title}>
              {tag.name}
            </Typography>
          </div>
          <div className={classes.buttonsRow}>
            {currentUser ? 
              <Link className={classes.button} to={`/tag/${tag.slug}/edit`}>
                <EditOutlinedIcon /> Edit Wiki
              </Link> : 
              <a className={classes.button} onClick={(ev) => {
                openDialog({
                  componentName: "LoginPopup",
                  componentProps: {}
                });
                ev.preventDefault();
              }}>
                <EditOutlinedIcon /> Edit Wiki
              </a>
            }
            {userCanViewRevisionHistory(currentUser) && <Link className={classes.button} to={`/revisions/tag/${tag.slug}`}>
              <HistoryIcon /> History
            </Link>}
            <LWTooltip title="Get notifications when posts are added to this tag">
              <SubscribeTo 
                document={tag} 
                className={classes.subscribeTo}
                showIcon 
                subscribeMessage="Subscribe"
                unsubscribeMessage="Unsubscribe"
                subscriptionType={subscriptionTypes.newTagPosts}
              />
            </LWTooltip>

            <Link className={classes.discussionButton} to={`/tag/${tag.slug}/discussion`} {...eventHandlers}>
              <CommentOutlinedIcon/> Discussion
              <PopperCard open={hover} anchorEl={anchorEl} placement="bottom-start" >
                <TagDiscussion tag={tag}/>
              </PopperCard>    
            </Link>   
          </div>
          <div onClick={clickReadMore}>
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: description||""}}
              description={`tag ${tag.name}`}
              className={classes.description}
            />
          </div>
        </AnalyticsContext>
      </div>
      <AnalyticsContext pageSectionContext="tagsSection">
        <div className={classes.tagHeader}>
          <div className={classes.postsTaggedTitle}>Posts tagged <em>{tag.name}</em></div>
          <PostsListSortDropdown value={query.sortedBy || "relevance"}/>
        </div>
        <PostsList2
          terms={terms}
          enableTotal
          tagId={tag._id}
          itemsPerPage={200}
        >
          <AddPostsToTag tag={tag} />
        </PostsList2>
      </AnalyticsContext>
    </SingleColumnSection>
  </AnalyticsContext>
}

const TagPageComponent = registerComponent("TagPage", TagPage, {styles});

declare global {
  interface ComponentTypes {
    TagPage: typeof TagPageComponent
  }
}
