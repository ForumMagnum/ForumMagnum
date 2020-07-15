import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { commentBodyStyles } from '../../themes/stylePiping'
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import Typography from '@material-ui/core/Typography';
import { truncate } from '../../lib/editor/ellipsize';
import { Tags } from '../../lib/collections/tags/collection';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema'
import { userCanViewRevisionHistory, userCanManageTags} from '../../lib/betas';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import HistoryIcon from '@material-ui/icons/History';

// Also used in TagCompareRevisions
export const styles = theme => ({
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
  editButton: {
    display: "flex",
    alignItems: "center",
    marginRight: 16
  },
  historyButton: {
    display: "flex",
    alignItems: "center",
    marginRight: 16
  },
});

const TagPage = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, SubscribeTo, PostsListSortDropdown, PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404, PermanentRedirect } = Components;
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const { revision } = query;
  const { tag, loading: loadingTag } = useTagBySlug(slug, revision?"TagRevisionFragment":"TagFragment", {
    extraVariables: revision ? {version: 'String'} : {},
    extraVariablesValues: revision ? {version: revision} : {},
  });
  const [truncated, setTruncated] = useState(true)
  const { captureEvent } =  useTracking()
  
  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  // If the slug in our URL is not the same as the slug on the tag, redirect to the canonical slug page
  if (tag.oldSlugs?.filter(slug => slug !== tag.slug)?.includes(slug)) {
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

  const description = truncated ? truncate(tag.description?.html, tag.descriptionTruncationCount || 4, "paragraphs", "<a>(Read More)</a>") : tag.description?.html

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
            {userCanManageTags(currentUser) && <Link className={classes.editButton} to={`/tag/${tag.slug}/edit`}>
              <EditOutlinedIcon /> Edit Wiki
            </Link>}
            {userCanViewRevisionHistory(currentUser) && <Link className={classes.historyButton} to={`/revisions/tag/${tag.slug}`}>
              <HistoryIcon /> History
            </Link>}
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
