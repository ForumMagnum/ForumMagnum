import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useTagBySlug } from './useTag';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { commentBodyStyles } from '../../themes/stylePiping'
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import Typography from '@material-ui/core/Typography';
import { truncate } from '../../lib/editor/ellipsize';
import { Tags } from '../../lib/collections/tags/collection';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';

const styles = theme => ({
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
    marginTop: 0,
    ...theme.typography.commentStyle,
    fontWeight: 600,
    fontVariant: "small-caps"
  },
  wikiSection: {
    marginRight: 32,
    marginBottom: 24,
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
  editButton: {
    display: "flex",
    alignItems: "center",
    marginRight: 16
  }
});

const TagPage = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, PostsListSortDropdown, PostsList2, AddPostsToTag, ContentItemBody, Loading, Error404, PermanentRedirect, SubscribeTo } = Components;
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const { tag, loading: loadingTag } = useTagBySlug(slug);
  const [truncated, setTruncated] = useState(true)
  const { captureEvent } =  useTracking()
  
  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  // If the slug in our URL is not the same as the slug on the tag, redirect to the canonical slug page
  if (tag.slug !== slug) {
    return <PermanentRedirect url={Tags.getUrl(tag)} />
  }

  const terms = {
    ...query,
    filterSettings: {tags:[{tagId: tag._id, tagName: tag.name, filterMode: "Required"}]},
    view: "tagRelevance",
    limit: 15,
    tagId: tag._id,
  }

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }

  const description = truncated ? truncate(tag.description?.html, 1400, "characters", "... <a>(Read More)</a>") : tag.description?.html

  return <AnalyticsContext
    pageContext='tagPage'
    tagName={tag.name}
    tagId={tag._id}
    sortedBy={query.sortedBy || "relevance"}
    limit={terms.limit}
  >
    <SingleColumnSection>
      <div className={classes.wikiSection}>
        <AnalyticsContext pageSectionContext="wikiSection">
          <div className={classes.titleSection}>
            <Typography variant="display3" className={classes.title}>
              {tag.name}
            </Typography>
          </div>
          <div className={classes.buttonsRow}>
            {Users.isAdmin(currentUser) && <Link className={classes.editButton} to={`/tag/${tag.slug}/edit`}><EditOutlinedIcon /> Edit Wiki</Link>}
            <SubscribeTo 
              document={tag} 
              showIcon 
              subscribeMessage="Subscribe to Tag"
              unsubscribeMessage="Unsubscribe from Tag"
              subscriptionType={subscriptionTypes.newTagPosts}
            />
          </div>
          <div onClick={clickReadMore}>
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: description}}
              description={`tag ${tag.name}`}
              className={classes.description}
            />
          </div>
        </AnalyticsContext>
      </div>
      <div>
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
      </div>
    </SingleColumnSection>
  </AnalyticsContext>
}

const TagPageComponent = registerComponent("TagPage", TagPage, {styles});

declare global {
  interface ComponentTypes {
    TagPage: typeof TagPageComponent
  }
}
