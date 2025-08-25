import { useApolloClient } from "@apollo/client/react";
import { useQuery } from "@/lib/crud/useQuery"
import classNames from 'classnames';
import React, { FC, Fragment, useCallback, useEffect, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from "../../lib/betas";
import { subscriptionTypes } from '../../lib/collections/subscriptions/helpers';
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { truncate } from '../../lib/editor/ellipsize';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useOnSearchHotkey } from '../common/withGlobalKeydown';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { MAX_COLUMN_WIDTH } from '../posts/PostsPage/constants';
import { EditTagForm } from './EditTagPage';
import { useTagBySlug } from './useTag';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting, quickTakesTagsEnabledSetting } from '@/lib/instanceSettings';
import truncateTagDescription from "../../lib/utils/truncateTagDescription";
import { getTagStructuredData } from "./TagPageRouter";
import { HEADER_HEIGHT } from "../common/Header";
import { isFriendlyUI } from "../../themes/forumTheme";
import DeferRender from "../common/DeferRender";
import { RelevanceLabel, tagPageHeaderStyles, tagPostTerms } from "./TagPageUtils";
import SectionTitle from "../common/SectionTitle";
import PostsListSortDropdown from "../posts/PostsListSortDropdown";
import PostsList2 from "../posts/PostsList2";
import { ContentItemBody } from "../contents/ContentItemBody";
import Loading from "../vulcan-core/Loading";
import AddPostsToTag from "./AddPostsToTag";
import Error404 from "../common/Error404";
import { Typography } from "../common/Typography";
import PermanentRedirect from "../common/PermanentRedirect";
import UsersNameDisplay from "../users/UsersNameDisplay";
import TagFlagItem from "./TagFlagItem";
import TagDiscussionSection from "./TagDiscussionSection";
import TagPageButtonRow from "./TagPageButtonRow";
import ToCColumn from "../posts/TableOfContents/ToCColumn";
import SubscribeButton from "./SubscribeButton";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import TagIntroSequence from "./TagIntroSequence";
import TagTableOfContents from "./TagTableOfContents";
import TagVersionHistoryButton from "../editor/TagVersionHistory";
import ContentStyles from "../common/ContentStyles";
import CommentsListCondensed from "../common/CommentsListCondensed";
import { StructuredData } from "../common/StructuredData";
import { gql } from "@/lib/generated/gql-codegen";

const TagWithFlagsFragmentMultiQuery = gql(`
  query multiTagEATagPageQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagWithFlagsFragment
      }
      totalCount
    }
  }
`);

const TagEditFragmentQuery = gql(`
  query EATagPage($documentId: String) {
    tag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagEditFragment
      }
    }
  }
`);

const sidePaddingStyle = (theme: ThemeType) => ({
  paddingLeft: 42,
  paddingRight: 42,
  [theme.breakpoints.down('xs')]: {
    paddingLeft: '8px',
    paddingRight: '8px',
  },
})

const styles = (theme: ThemeType) => ({
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
    top: HEADER_HEIGHT,
    [theme.breakpoints.down('sm')]: {
      width: 'unset',
      '& > picture > img': {
        height: 200,
        width: '100%',
      },
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
    ...sidePaddingStyle(theme),
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
    ...theme.typography[theme.isFriendlyUI ? "display2" : "display3"],
    ...theme.typography[theme.isFriendlyUI ? "headerStyle" : "commentStyle"],
    marginTop: 0,
    fontWeight: theme.isFriendlyUI ? 700 : 600,
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
    ...sidePaddingStyle(theme),
    paddingBottom: 12,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
  },
  subHeading: {
    ...sidePaddingStyle(theme),
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
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
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
  ...tagPageHeaderStyles(theme),
});

const PostsListHeading: FC<{
  tag: TagPageFragment|TagPageWithRevisionFragment,
  query: Record<string, string>,
  classes: ClassesType<typeof styles>,
}> = ({tag, query, classes}) => {
  if (isFriendlyUI) {
    return (
      <>
        <SectionTitle title={`Posts tagged ${tag.name}`} />
        <div className={classes.postListMeta}>
          <PostsListSortDropdown value={query.sortedBy || "relevance"} />
          <div className={classes.relevance}>
            <RelevanceLabel />
          </div>
        </div>
      </>
    );
  }
  return (
    <div className={classes.tagHeader}>
      <div className={classes.postsTaggedTitle}>Posts tagged <em>{tag.name}</em></div>
      <PostsListSortDropdown value={query.sortedBy || "relevance"}/>
    </div>
  );
}

const EATagPage = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const [editing, setEditing] = useState(!!query.edit)
  
  // Support URLs with ?version=1.2.3 or with ?revision=1.2.3 (we were previously inconsistent, ?version is now preferred)
  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? null;
  
  const contributorsLimit = 7;
  const { tag, loading: loadingTag } = useTagBySlug(slug, revision ? "TagPageWithRevisionFragment" : "TagPageFragment", {
    extraVariables: revision ? {
      version: revision,
      contributorsLimit,
    } : {
      contributorsLimit,
    },
  });

  const { data } = useQuery(TagEditFragmentQuery, {
    variables: { documentId: tag?._id },
    skip: !tag || !editing,
    ssr: false,
  });
  const editableTag = data?.tag?.result;
  
  const [truncated, setTruncated] = useState(true)
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);
  const { captureEvent } =  useTracking()
  const client = useApolloClient()

  const multiTerms: AnyBecauseTodo = {
    allPages: {view: "allPagesByNewest"},
    myPages: {view: "userTags", userId: currentUser?._id},
    //tagFlagId handled as default case below
  }

  const { view, limit, ...selectorTerms } = ["allPages", "myPages"].includes(query.focus) ? multiTerms[query.focus] : { view: "tagsByTagFlag", tagFlagId: query.focus };
  const { data: dataTagWithFlags } = useQuery(TagWithFlagsFragmentMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 1500,
      enableTotal: false,
    },
    skip: !query.flagId,
    notifyOnNetworkStatusChange: true,
  });

  const otherTagsWithNavigation = dataTagWithFlags?.tags?.results;
  
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
    query.sortedBy = (query.sortedBy || tag.postsDefaultSortOrder) ?? query.sortedBy
  }

  const terms = {
    ...tagPostTerms(tag),
    ...(query.sortedBy ? {sortedBy: query.sortedBy as PostSortingModeWithRelevanceOption} : {}),
    limit: 15
  }

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }

  const htmlWithAnchors = tag.tableOfContents?.html ?? tag.description?.html ?? "";
  let description = htmlWithAnchors;
  // EA Forum wants to truncate much less than LW
  if (isFriendlyUI) {
    description = truncated
      ? truncateTagDescription(htmlWithAnchors, tag.descriptionTruncationCount)
      : htmlWithAnchors;
  } else {
    description = (truncated && !tag.wikiOnly)
    ? truncate(htmlWithAnchors, tag.descriptionTruncationCount || 4, "paragraphs", "<span>...<p><a>(Read More)</a></p></span>")
    : htmlWithAnchors
  }
  
  const tagFlagItemType: AnyBecauseTodo = {
    allPages: "allPages",
    myPages: "userPages"
  }

  const editTagForm = editableTag
    ? <EditTagForm
        tag={editableTag}
        successCallback={ async () => {
          setEditing(false)
          await client.resetStore()
        }}
        cancelCallback={() => setEditing(false)}
      />
  : <Loading />;
  
  return <AnalyticsContext
    pageContext='tagPage'
    tagName={tag.name}
    tagId={tag._id}
    sortedBy={query.sortedBy || "relevance"}
    limit={terms.limit}
  >
    <StructuredData generate={() => getTagStructuredData(tag)}/>
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
              {tag.deleted ? "[Deleted] " : ""}{tag.name}
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
            { revision && tag.description && 'user' in tag.description && <div className={classes.pastRevisionNotice}>
              You are viewing revision {tag.description.version}, last edited by <UsersNameDisplay user={tag.description.user}/>
            </div>}
            {editableTag ? <div>
              {editTagForm}
              <TagVersionHistoryButton tagId={tag._id} />
            </div> :
            <div onClick={clickReadMore}>
              <ContentStyles contentType="tag">
                <ContentItemBody
                  dangerouslySetInnerHTML={{__html: description||""}}
                  description={`tag ${tag.name}`}
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
          {!tag.wikiOnly && <>
            <AnalyticsContext pageSectionContext="tagsSection">
              <PostsList2
                header={<PostsListHeading tag={tag} query={query} classes={classes} />}
                terms={terms}
                enableTotal
                tagId={tag._id}
                itemsPerPage={200}
                showNoResults={true}
              >
                <AddPostsToTag tag={tag} />
              </PostsList2>
            </AnalyticsContext>
            {quickTakesTagsEnabledSetting.get() && <DeferRender ssr={false}>
              <AnalyticsContext pageSectionContext="quickTakesSection">
                <CommentsListCondensed
                  label="Quick takes"
                  terms={{
                    view: "tagSubforumComments" as const,
                    tagId: tag._id,
                    sortBy: 'new',
                  }}
                  initialLimit={8}
                  itemsPerPage={20}
                  showTotal
                  hideTag
                />
              </AnalyticsContext>
            </DeferRender>}
          </>}
        </div>
      </ToCColumn>
    </div>
  </AnalyticsContext>
}

export default registerComponent("EATagPage", EATagPage, {styles});


