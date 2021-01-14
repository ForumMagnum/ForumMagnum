import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { tagBodyStyles } from '../../themes/stylePiping'
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { truncate } from '../../lib/editor/ellipsize';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import HistoryIcon from '@material-ui/icons/History';
import { useDialog } from '../common/withDialog';
import { useMulti } from '../../lib/crud/withMulti';
import { EditTagForm } from './EditTagPage';

// Also used in TagCompareRevisions, TagDiscussionPage
export const styles = (theme: ThemeType): JssStyles => ({
  tagPage: {
    ...tagBodyStyles(theme),
    color: theme.palette.grey[600]
  },
  description: {
    marginTop: 18,
    ...tagBodyStyles(theme),
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
    flexWrap: "wrap",
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
  buttonLabel: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  ctaPositioning: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  },
  subscribeToWrapper: {
    display: "flex !important",
  },
  subscribeTo: {
    marginRight: 16
  },
  pastRevisionNotice: {
    ...theme.typography.commentStyle,
    fontStyle: 'italic'
  },
  nextLink: {
    ...theme.typography.commentStyle
  },
  callToAction: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
    fontStyle: 'italic',
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  callToActionFlagCount: {
    position: "relative",
    marginLeft: 4,
    marginRight: 0
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
  const { SingleColumnSection, SubscribeTo, PostsListSortDropdown, PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404, PermanentRedirect, HeadTags, LWTooltip,  UsersNameDisplay, TagFlagItem, TagDiscussionSection, TagDiscussionButton, Typography } = Components;
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const { revision } = query;
  const { tag, loading: loadingTag } = useTagBySlug(slug, revision ? "TagWithFlagsAndRevisionFragment" : "TagWithFlagsFragment", {
    extraVariables: revision ? {version: 'String'} : {},
    extraVariablesValues: revision ? {version: revision} : {},
  });
  
  const [truncated, setTruncated] = useState(true)
  const [editing, setEditing] = useState(!!query.edit)
  const { captureEvent } =  useTracking()
  const { openDialog } = useDialog();

  const multiTerms = {
    allPages: {view: "allPagesByNewest"},
    myPages: {view: "userTags", userId: currentUser?._id},
    //tagFlagId handled as default case below
  }

  const { results: otherTagsWithNavigation } = useMulti({
    terms: ["allPages", "myPages"].includes(query.focus) ? multiTerms[query.focus] : {view: "tagsByTagFlag", tagFlagId: query.focus},
    collectionName: "Tags",
    fragmentName: 'TagWithFlagsFragment',
    limit: 1500,
    skip: !query.flagId
  })
  

  const tagPositionInList = otherTagsWithNavigation?.findIndex(tagInList => tag?._id === tagInList._id);
  // We have to handle updates to the listPosition explicitly, since we have to deal with three cases
  // 1. Initially the listPosition is -1 because we don't have a list at all yet
  // 2. Then we have the real position
  // 3. Then we remove the tagFlag, we still want it to have the right next button
  const [nextTagPosition, setNextTagPosition] = useState<number | null>(null);
  useEffect(() => {
    // Initial list position setting
    if (tagPositionInList >= 0) {
      setNextTagPosition(tagPositionInList + 1)
    }
    if (nextTagPosition !== null && tagPositionInList < 0) {
      // Here we want to decrement the list positions by one, because we removed the original tag and so
      // all the indices are moved to the next
      setNextTagPosition(nextTagPosition => (nextTagPosition || 1) - 1)
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagPositionInList])
  const nextTag = otherTagsWithNavigation && (nextTagPosition !== null && nextTagPosition >= 0) && otherTagsWithNavigation[nextTagPosition]

  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  // If the slug in our URL is not the same as the slug on the tag, redirect to the canonical slug page
  if (tag.oldSlugs?.filter(slug => slug !== tag.slug)?.includes(slug)) {
    return <PermanentRedirect url={tagGetUrl(tag)} />
  }

  const terms = {
    ...tagPostTerms(tag, query),
    limit: 15
  }

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }

  const description = (truncated && !tag.wikiOnly) ? truncate(tag.description?.html, tag.descriptionTruncationCount || 4, "paragraphs", "<span>...<p><a>(Read More)</a></p></span>") : tag.description?.html
  const headTagDescription = tag.description?.plaintextDescription || `All posts related to ${tag.name}, sorted by relevance`
  
  const tagFlagItemType = {
    allPages: "allPages",
    myPages: "userPages"
  }
  
  const numFlags = tag.tagFlagsIds?.length
  
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
            {query.flagId && <span>
              <Link to={`/tags/dashboard?focus=${query.flagId}`}>
                  <TagFlagItem 
                    itemType={["allPages", "myPages"].includes(query.flagId) ? tagFlagItemType[query.flagId] : "tagFlagId"}
                    documentId={query.flagId}
                  />
              </Link>
              {nextTag && <span onClick={() => setEditing(true)}><Link
                className={classes.nextLink}
                to={tagGetUrl(nextTag, {flagId: query.flagId, edit: true})}>
                  Next Tag ({nextTag.name})
              </Link></span>}
            </span>}
            <Typography variant="display3" className={classes.title}>
              {tag.name}
            </Typography>
          </div>
          <div className={classes.buttonsRow}>
            {!editing && <a className={classes.button} onClick={(ev) => {
              if (currentUser) {
                setEditing(true)
              } else {
                openDialog({
                  componentName: "LoginPopup",
                  componentProps: {}
                });
                ev.preventDefault();
              }
            } }>
              <EditOutlinedIcon /><span className={classes.buttonLabel}>Edit</span>
            </a>} 
            {<Link className={classes.button} to={`/revisions/tag/${tag.slug}`}>
              <HistoryIcon /><span className={classes.buttonLabel}>History</span>
            </Link>}
            {!tag.wikiOnly && !editing && <LWTooltip title="Get notifications when posts are added to this tag." className={classes.subscribeToWrapper}>
              <SubscribeTo
                document={tag}
                className={classes.subscribeTo}
                showIcon
                hideLabelOnMobile
                subscribeMessage="Subscribe"
                unsubscribeMessage="Unsubscribe"
                subscriptionType={subscriptionTypes.newTagPosts}
              />
            </LWTooltip>}
            <div className={classes.button}>
              <TagDiscussionButton tag={tag} hideLabelOnMobile />
            </div>
            <div className={classes.callToAction}>
              <LWTooltip
                title={ tag.tagFlagsIds?.length > 0 ? 
                  <div>
                    {tag.tagFlags.map((flag, i) => <span key={flag._id}>{flag.name}{(i+1) < tag.tagFlags?.length && ", "}</span>)}
                  </div> :
                  <span>
                    This tag does not currently have any improvement flags set.
                  </span>
                }
                >
                <a onClick={(ev) => {
                  if (currentUser) setEditing(true);
                  openDialog({
                    componentName: currentUser ? "TagCTAPopup" : "LoginPopup",
                    componentProps: {}
                  })
                  ev.preventDefault();
                }}>
                  <span className={classes.callToAction}> Help improve this page{/*
                  */}<span className={classes.callToActionFlagCount}>{!!numFlags&&`(${numFlags} flags)`}</span>
                  </span>
                </a> 
              </LWTooltip>
            </div>
          </div>
          { revision && tag.description && (tag as TagRevisionFragment)?.description?.user && <div className={classes.pastRevisionNotice}>
            You are viewing revision {(tag as TagRevisionFragment)?.description?.version}, last edited by <UsersNameDisplay user={(tag as TagRevisionFragment)?.description?.user}/>
          </div>}
          {editing ? <EditTagForm
            tag={tag}
            successCallback={() => setEditing(false)}
            cancelCallback={() => setEditing(false)}
          /> :
          <div onClick={clickReadMore}>
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: description||""}}
              description={`tag ${tag.name}`}
              className={classes.description}
            />
          </div>}
        </AnalyticsContext>
      </div>
      {editing && <TagDiscussionSection
        key={tag._id}
        tag={tag}
      />}
      {!tag.wikiOnly && <AnalyticsContext pageSectionContext="tagsSection">
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
      </AnalyticsContext>}
    </SingleColumnSection>
  </AnalyticsContext>
}

const TagPageComponent = registerComponent("TagPage", TagPage, {styles});

declare global {
  interface ComponentTypes {
    TagPage: typeof TagPageComponent
  }
}
