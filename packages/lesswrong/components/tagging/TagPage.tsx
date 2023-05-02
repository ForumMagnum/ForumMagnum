import { useApolloClient } from "@apollo/client";
import classNames from 'classnames';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from "../../lib/betas";
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema';
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { useMulti } from '../../lib/crud/withMulti';
import { truncate } from '../../lib/editor/ellipsize';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useOnSearchHotkey } from '../common/withGlobalKeydown';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { MAX_COLUMN_WIDTH } from '../posts/PostsPage/PostsPage';
import { EditTagForm } from './EditTagPage';
import { useTagBySlug } from './useTag';
import { forumTypeSetting, taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import truncateTagDescription from "../../lib/utils/truncateTagDescription";

const isEAForum = forumTypeSetting.get() === 'EAForum'

// Also used in TagCompareRevisions, TagDiscussionPage
export const styles = (theme: ThemeType): JssStyles => ({
  rootGivenImage: {
    marginTop: 185,
    [theme.breakpoints.down('sm')]: {
      marginTop: 130,
    },
  },
  imageContainer: {
    width: '100%',
    '& > picture > img': {
      height: 300,
      objectFit: 'cover',
      width: '100%',
    },
    position: 'absolute',
    top: 90,
    [theme.breakpoints.down('sm')]: {
      width: 'unset',
      '& > picture > img': {
        height: 200,
        width: '100%',
      },
      top: 77,
      left: -4,
      right: -4,
    },
  },
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
  },
  header: {
    paddingTop: 19,
    paddingBottom: 5,
    paddingLeft: 42,
    paddingRight: 42,
    background: theme.palette.panelBackground.default,
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
  },
  titleRow: {
    [theme.breakpoints.up('sm')]: {
      display: 'flex',
      justifyContent: 'space-between',
    }
  },
  title: {
    ...theme.typography[isEAForum ? "display2" : "display3"],
    ...theme.typography[isEAForum ? "headerStyle" : "commentStyle"],
    marginTop: 0,
    fontWeight: isEAForum ? 700 : 600,
    ...theme.typography.smallCaps,
  },
  notifyMeButton: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 6,
    },
  },
  nonMobileButtonRow: {
    [theme.breakpoints.down('xs')]: {
      // Ensure this takes priority over the properties in TagPageButtonRow
      display: 'none !important',
    },
  },
  mobileButtonRow: {
    [theme.breakpoints.up('sm')]: {
      display: 'none !important',
    },
  },
  editMenu: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 16,
      marginBottom: 8,
    },
  },
  wikiSection: {
    paddingTop: 5,
    paddingLeft: 42,
    paddingRight: 42,
    paddingBottom: 12,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
  },
  subHeading: {
    paddingLeft: 42,
    paddingRight: 42,
    marginTop: -2,
    background: theme.palette.panelBackground.default,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },
  subHeadingInner: {
    paddingTop: 2,
    paddingBottom: 2,
    borderTop: theme.palette.border.extraFaint,
    borderBottom: theme.palette.border.extraFaint,
  },
  relatedTag : {
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
  },
  relatedTagLink : {
    color: theme.palette.lwTertiary.dark
  },
  tagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  postsTaggedTitle: {
    color: theme.palette.grey[600]
  },
  pastRevisionNotice: {
    ...theme.typography.commentStyle,
    fontStyle: 'italic'
  },
  nextLink: {
    ...theme.typography.commentStyle
  },
});

export const tagPostTerms = (tag: Pick<TagBasicInfo, "_id" | "name"> | null, query: any) => {
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
  const {
    PostsListSortDropdown, PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404,
    PermanentRedirect, HeadTags, UsersNameDisplay, TagFlagItem, TagDiscussionSection, Typography,
    TagPageButtonRow, ToCColumn, SubscribeButton, CloudinaryImage2, TagIntroSequence,
    SectionTitle, TagTableOfContents, ContentStyles
  } = Components;
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  
  // Support URLs with ?version=1.2.3 or with ?revision=1.2.3 (we were previously inconsistent, ?version is now preferred)
  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? null;
  
  const contributorsLimit = 7;
  const { tag, loading: loadingTag } = useTagBySlug(slug, revision ? "TagPageWithRevisionFragment" : "TagPageFragment", {
    extraVariables: revision ? {
      version: 'String',
      contributorsLimit: 'Int',
    } : {
      contributorsLimit: 'Int',
    },
    extraVariablesValues: revision ? {
      version: revision,
      contributorsLimit,
    } : {
      contributorsLimit,
    },
  });
  
  const [truncated, setTruncated] = useState(true)
  const [editing, setEditing] = useState(!!query.edit)
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);
  const { captureEvent } =  useTracking()
  const client = useApolloClient()

  const multiTerms: AnyBecauseTodo = {
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
  
  useOnSearchHotkey(() => setTruncated(false));

  const tagPositionInList = otherTagsWithNavigation?.findIndex(tagInList => tag?._id === tagInList._id);
  // We have to handle updates to the listPosition explicitly, since we have to deal with three cases
  // 1. Initially the listPosition is -1 because we don't have a list at all yet
  // 2. Then we have the real position
  // 3. Then we remove the tagFlag, we still want it to have the right next button
  const [nextTagPosition, setNextTagPosition] = useState<number | null>(null);
  useEffect(() => {
    // Initial list position setting
    if (tagPositionInList && tagPositionInList >= 0) {
      setNextTagPosition(tagPositionInList + 1)
    }
    if (nextTagPosition !== null && tagPositionInList && tagPositionInList < 0) {
      // Here we want to decrement the list positions by one, because we removed the original tag and so
      // all the indices are moved to the next
      setNextTagPosition(nextTagPosition => (nextTagPosition || 1) - 1)
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagPositionInList])
  const nextTag = otherTagsWithNavigation && (nextTagPosition !== null && nextTagPosition >= 0) && otherTagsWithNavigation[nextTagPosition]
  
  const expandAll = useCallback(() => {
    setTruncated(false)
  }, []);

  const onHoverContributor = useCallback((userId: string) => {
    setHoveredContributorId(userId);
  }, []);
  
  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  // If the slug in our URL is not the same as the slug on the tag, redirect to the canonical slug page
  if (tag.oldSlugs?.filter(slug => slug !== tag.slug)?.includes(slug)) {
    return <PermanentRedirect url={tagGetUrl(tag)} />
  }
  if (editing && !tagUserHasSufficientKarma(currentUser, "edit")) {
    throw new Error(`Sorry, you cannot edit ${taggingNamePluralSetting.get()} without ${tagMinimumKarmaPermissions.edit} or more karma.`)
  }

  // if no sort order was selected, try to use the tag page's default sort order for posts
  if (query.sortedBy || tag.postsDefaultSortOrder) {
    query.sortedBy = query.sortedBy || tag.postsDefaultSortOrder
  }

  const terms = {
    ...tagPostTerms(tag, query),
    limit: 15
  }

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }

  const htmlWithAnchors = tag.tableOfContents?.html ?? tag.description?.html ?? "";
  let description = htmlWithAnchors;
  // EA Forum wants to truncate much less than LW
  if (isEAForum) {
    description = truncated ? truncateTagDescription(htmlWithAnchors) : htmlWithAnchors;
  } else {
    description = (truncated && !tag.wikiOnly)
    ? truncate(htmlWithAnchors, tag.descriptionTruncationCount || 4, "paragraphs", "<span>...<p><a>(Read More)</a></p></span>")
    : htmlWithAnchors
  }

  const headTagDescription = tag.description?.plaintextDescription || `All posts related to ${tag.name}, sorted by relevance`
  
  const tagFlagItemType: AnyBecauseTodo = {
    allPages: "allPages",
    myPages: "userPages"
  }
  
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
    {hoveredContributorId && <style>
      {`.by_${hoveredContributorId} {background: rgba(95, 155, 101, 0.35);}`}
    </style>}
    {tag.bannerImageId && <div className={classes.imageContainer}>
      <CloudinaryImage2
        publicId={tag.bannerImageId}
        height={300}
        fullWidthHeader
      />
    </div>}
    <div className={tag.bannerImageId ? classes.rootGivenImage : ''}>
      <ToCColumn
        tableOfContents={
          <TagTableOfContents
            tag={tag} expandAll={expandAll} showContributors={true}
            onHoverContributor={onHoverContributor}
          />
        }
        header={<div className={classNames(classes.header,classes.centralColumn)}>
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
          <div className={classes.titleRow}>
            <Typography variant="display3" className={classes.title}>
              {tag.name}
            </Typography>
            <TagPageButtonRow tag={tag} editing={editing} setEditing={setEditing} className={classNames(classes.editMenu, classes.mobileButtonRow)} />
            {!tag.wikiOnly && !editing && userHasNewTagSubscriptions(currentUser) &&
              <SubscribeButton
                tag={tag}
                className={classes.notifyMeButton}
                subscribeMessage="Subscribe"
                unsubscribeMessage="Subscribed"
                subscriptionType={subscriptionTypes.newTagPosts}
              />
            }
          </div>
          <TagPageButtonRow tag={tag} editing={editing} setEditing={setEditing} className={classNames(classes.editMenu, classes.nonMobileButtonRow)} />
        </div>}
        welcomeBox={null}
      >
        {(tag.parentTag || tag.subTags.length) ?
        <div className={classNames(classes.subHeading,classes.centralColumn)}>
          <div className={classes.subHeadingInner}>
            {tag.parentTag && <div className={classes.relatedTag}>Parent {taggingNameCapitalSetting.get()}: <Link className={classes.relatedTagLink} to={tagGetUrl(tag.parentTag)}>{tag.parentTag.name}</Link></div>}
            {/* For subtags it would be better to:
                 - put them at the bottom of the page
                 - truncate the list
                for our first use case we only need a small number of subtags though, so I'm leaving it for now
             */}
            {tag.subTags.length ? <div className={classes.relatedTag}><span>Sub-{tag.subTags.length > 1 ? taggingNamePluralCapitalSetting.get() : taggingNameCapitalSetting.get()}:&nbsp;{
                tag.subTags.map((subTag, idx) => {
                return <Fragment key={idx}>
                  <Link className={classes.relatedTagLink} to={tagGetUrl(subTag)}>{subTag.name}</Link>
                  {idx < tag.subTags.length - 1 ? <>,&nbsp;</>: <></>}
                </Fragment>
              })}</span>
            </div> : <></>}
          </div>
        </div>: <></>}
        <div className={classNames(classes.wikiSection,classes.centralColumn)}>
          <AnalyticsContext pageSectionContext="wikiSection">
            { revision && tag.description && (tag.description as TagRevisionFragment_description).user && <div className={classes.pastRevisionNotice}>
              You are viewing revision {tag.description.version}, last edited by <UsersNameDisplay user={(tag.description as TagRevisionFragment_description).user}/>
            </div>}
            {editing ? <EditTagForm
              tag={tag}
              successCallback={ async () => {
                setEditing(false)
                await client.resetStore()
              }}
              cancelCallback={() => setEditing(false)}
            /> :
            <div onClick={clickReadMore}>
              <ContentStyles contentType="tag">
                <ContentItemBody
                  dangerouslySetInnerHTML={{__html: description||""}}
                  description={`tag ${tag.name}`}
                  className={classes.description}
                />
              </ContentStyles>
            </div>}
          </AnalyticsContext>
        </div>
        <div className={classes.centralColumn}>
          {editing && <TagDiscussionSection
            key={tag._id}
            tag={tag}
          />}
          {tag.sequence && <TagIntroSequence tag={tag} />}
          {!tag.wikiOnly && <AnalyticsContext pageSectionContext="tagsSection">
            {tag.sequence ?
              <SectionTitle title={`Posts tagged ${tag.name}`}>
                <PostsListSortDropdown value={query.sortedBy || "relevance"}/>
              </SectionTitle> :
              <div className={classes.tagHeader}>
                <div className={classes.postsTaggedTitle}>Posts tagged <em>{tag.name}</em></div>
                <PostsListSortDropdown value={query.sortedBy || "relevance"}/>
              </div>
            }
            <PostsList2
              terms={terms}
              enableTotal
              tagId={tag._id}
              itemsPerPage={200}
            >
              <AddPostsToTag tag={tag} />
            </PostsList2>
          </AnalyticsContext>}
        </div>
      </ToCColumn>
    </div>
  </AnalyticsContext>
}

const TagPageComponent = registerComponent("TagPage", TagPage, {styles});

declare global {
  interface ComponentTypes {
    TagPage: typeof TagPageComponent
  }
}
