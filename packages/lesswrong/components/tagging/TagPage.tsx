import { useApolloClient } from "@apollo/client";
import classNames from 'classnames';
import React, { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from "../../lib/betas";
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema';
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { useMulti } from '../../lib/crud/withMulti';
import { truncate } from '../../lib/editor/ellipsize';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { useOnSearchHotkey } from '../common/withGlobalKeydown';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { EditTagForm } from './EditTagPage';
import { useTagBySlug } from './useTag';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import truncateTagDescription from "../../lib/utils/truncateTagDescription";
import { getTagStructuredData } from "./TagPageRouter";
import { isFriendlyUI } from "../../themes/forumTheme";
import DeferRender from "../common/DeferRender";
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { RelevanceLabel, tagPageHeaderStyles, tagPostTerms } from "./TagPageExports";
import { useStyles, defineStyles } from "../hooks/useStyles";
import { HEADER_HEIGHT } from "../common/Header";
import { MAX_COLUMN_WIDTH } from "../posts/PostsPage/PostsPage";
import { ToCData } from "@/lib/tableOfContents";
import qs from "qs";

const styles = defineStyles("TagPage", (theme: ThemeType) => ({
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
    paddingLeft: 42,
    paddingRight: 42,
    background: theme.palette.background.paper,
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
    ...theme.typography[isFriendlyUI ? "display2" : "display3"],
    ...theme.typography[isFriendlyUI ? "headerStyle" : "commentStyle"],
    marginTop: 0,
    fontWeight: isFriendlyUI ? 700 : 600,
    ...theme.typography.smallCaps,
    fontSize: 90,
    letterSpacing: "0.04em",
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
    [theme.breakpoints.up('sm')]: {
      position: 'absolute',
      top: -36,
      right: 8,
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
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
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
  description: {
    lineHeight: "21px",
  },
  lensTabsContainer: {
    gap: '4px',
    [theme.breakpoints.down('sm')]: {
      gap: '2px',
      flexDirection: 'column',
    },
  },
  lensTab: {
    minWidth: 'unset',
    borderWidth: 1,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      alignSelf: 'center',
    },
  },
  tabLabelContainerOverride: {
    paddingLeft: 16,
    paddingRight: 16,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  lensLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    [theme.breakpoints.down('sm')]: {
      alignItems: 'center',
    },
  },
  lensTitle: {
    ...theme.typography.subtitle,
    textTransform: 'none',
    marginBottom: 0,
  },
  lensSubtitle: {
    ...theme.typography.subtitle,
    textTransform: 'none',
    fontSize: '1rem',
    fontWeight: 400,
    [theme.breakpoints.up('sm')]: {
      // minHeight: 19,
    },
  },
  selectedLens: {
    [theme.breakpoints.down('sm')]: {
      border: theme.palette.border.grey400,
    },
    [theme.breakpoints.up('sm')]: {
      borderStyle: 'solid',
      borderWidth: '1px 1px 0 1px',
      borderImageSource: `linear-gradient(to bottom, 
        ${theme.palette.grey[400]} 0%, 
        rgba(0,0,0,0) 100%
      )`,
      borderImageSlice: '1',
      // Needed to maintain solid top border
      borderTop: theme.palette.border.grey400
    },
  },
  nonSelectedLens: {
    // TODO: define custom background for tabs with dark mode override, since darken04 is basically not visible in dark mode
    background: theme.palette.panelBackground.darken04,
    borderStyle: 'solid',
    borderColor: theme.palette.background.transparent,
  },
  hideMuiTabIndicator: {
    display: 'none',
  },
  contributorRow: {
    ...theme.typography.body1,
    color: theme.palette.grey[600],
    display: 'flex',
    alignItems: 'end',
  },
  contributorNameWrapper: {
    flex: 1,
  },
  contributorName: {
    fontWeight: 600,
    // flex: 1,
  },
  lastUpdated: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
  },
  requirementsAndAlternatives: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
  },
  relationshipPill: {
    border: theme.palette.border.grey400,
    borderRadius: theme.borderRadius.small,
    padding: 8,
    textWrapMode: 'nowrap',
    width: 'max-content',
  },
  alternatives: {
    marginLeft: 16,
  },
  alternativeArrowIcon: {
    width: 16,
    height: 16,
  },
  ...tagPageHeaderStyles(theme),
  nestedListContainer: {
    marginTop: 32,
  },
}));

interface TagLens {
  _id: string;
  collectionName: string;
  fieldName: string;
  index: number;
  contents: TagFragment_description | TagRevisionFragment_description | RevisionDisplay | null;
  tableOfContents: ToCData | null;
  parentDocumentId: string;
  title: string;
  preview: string | null;
  tabTitle: string;
  tabSubtitle: string | null;
  slug: string;
  userId: string;
}

const MAIN_TAB_ID = 'main-tab';

function getDefaultLens(tag: TagPageFragment | TagPageWithRevisionFragment): TagLens {
  return {
    _id: MAIN_TAB_ID,
    collectionName: 'Tags',
    fieldName: 'description',
    index: 0,
    contents: tag.description,
    tableOfContents: tag.tableOfContents,
    parentDocumentId: tag._id,
    title: tag.name,
    preview: null,
    tabTitle: 'Main',
    tabSubtitle: null,
    slug: 'main',
    userId: tag.userId
  }
}

interface TagLensInfo {
  selectedLens?: TagLens;
  selectedLensId: string;
  updateSelectedLens: (lensId: string) => void;
  lenses: TagLens[];
}

function getImputedSlug(lens: MultiDocumentEdit) {
  const slugComponents = lens.tabTitle.split(' ');

  if (lens.tabSubtitle) {
    slugComponents.push(...lens.tabSubtitle.split(' '));
  }

  return slugComponents.join('_').toLowerCase();
}

function useTagLenses(tag: TagPageFragment | TagPageWithRevisionFragment | null): TagLensInfo {
  const { query, location } = useLocation();
  const navigate = useNavigate();

  const availableLenses = useMemo(() => {
    if (!tag) return [];
    return [getDefaultLens(tag), ...tag.lenses.map(lens => ({ ...lens, index: lens.index + 1, title: lens.title ?? tag.name, slug: getImputedSlug(lens) }))];
  }, [tag]);

  const querySelectedLens = useMemo(() =>
    availableLenses.find(lens => lens.slug === query.lens),
    [availableLenses, query.lens]
  );

  const [selectedLensId, setSelectedLensId] = useState<string>(querySelectedLens?._id ?? MAIN_TAB_ID);

  const selectedLens = useMemo(() =>
    availableLenses.find(lens => lens._id === selectedLensId),
    [selectedLensId, availableLenses]
  );

  const updateSelectedLens = useCallback((lensId: string) => {
    setSelectedLensId(lensId);
    const selectedLensSlug = availableLenses.find(lens => lens._id === lensId)?.slug;
    if (selectedLensSlug) {
      const defaultLens = availableLenses.find(lens => lens._id === MAIN_TAB_ID);
      const navigatingToDefaultLens = selectedLensSlug === defaultLens?.slug;
      const newSearch = navigatingToDefaultLens
       ? ''
       : `?${qs.stringify({ lens: selectedLensSlug })}`;

      navigate({ ...location, search: newSearch });
    }
  }, [availableLenses, location, navigate]);

  useEffect(() => {
    if (query.lens) {
      if (querySelectedLens) {
        setSelectedLensId(querySelectedLens._id);
      } else {
        // If the lens doesn't exist, reset the search query
        navigate({ ...location, search: '' }, { replace: true });
      }
    }
  }, [query.lens, availableLenses, navigate, location, querySelectedLens]);

  return {
    selectedLens,
    selectedLensId,
    updateSelectedLens,
    lenses: availableLenses,
  };
}

/**
 * If we're on the main tab (or on a tag without any lenses), we want to display the tag name.
 * Otherwise, we want to display the selected lens title.
 */
function useDisplayedTagTitle(tag: TagPageFragment | TagPageWithRevisionFragment | null, lenses: TagLens[], selectedLens?: TagLens) {
  if (!tag) return '';

  if (!selectedLens || selectedLens._id === 'main-tab' || lenses.length === 0) {
    return tag.name;
  }

  return selectedLens.title;
}

const PostsListHeading: FC<{
  tag: TagPageFragment|TagPageWithRevisionFragment,
  query: Record<string, string>,
  classes: ClassesType,
}> = ({tag, query, classes}) => {
  const {SectionTitle, PostsListSortDropdown} = Components;
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

const TagPage = () => {
  const {
    PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404, Typography,
    PermanentRedirect, HeadTags, UsersNameDisplay, TagFlagItem, TagDiscussionSection,
    TagPageButtonRow, ToCColumn, SubscribeButton, CloudinaryImage2, TagIntroSequence,
    TagTableOfContents, TagVersionHistoryButton, ContentStyles, CommentsListCondensed,
    MultiToCLayout, TableOfContents, FormatDate, LWTooltip, HoverPreviewLink, WikiTagNestedList
  } = Components;
  const classes = useStyles(styles);

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
  
  const [truncated, setTruncated] = useState(false)
  const [editing, setEditing] = useState(!!query.edit)
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);
  // const [selectedLens, setSelectedLens] = useState<string>('main-tab');
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


  const { tag: secondTabTag } = useTagBySlug("featured-arbital", "TagPageFragment")
  const { tag: thirdTabTag } = useTagBySlug("history-arbital", "TagPageFragment")

  console.log({ tag, secondTabTag, thirdTabTag })

  const lensTabs = [{
    _id: 'main-tab',
    collectionName: 'Tags',
    fieldName: 'description',
    index: 0,
    contents: tag?.description,
    tableOfContents: tag?.tableOfContents,
    parentDocumentId: tag?._id,
    title: 'Main',
    subtitle: null,
    userId: tag?.userId
  },
  {
    _id: secondTabTag?._id ?? 'featured-tab',
    collectionName: 'Tags',
    fieldName: 'description',
    index: 1,
    contents: secondTabTag?.description,
    tableOfContents: secondTabTag?.tableOfContents,
    parentDocumentId: secondTabTag?._id,
    title: 'Featured',
    // subtitle: 'Featured content from Arbital',
    userId: secondTabTag?.userId
  },
  {
    _id: thirdTabTag?._id ?? 'history-tab',
    collectionName: 'Tags',
    fieldName: 'description', 
    index: 2,
    contents: thirdTabTag?.description,
    tableOfContents: thirdTabTag?.tableOfContents,
    parentDocumentId: thirdTabTag?._id,
    title: 'History',
    // subtitle: 'Historical content from Arbital',
    userId: thirdTabTag?.userId
  }];
  
  useOnSearchHotkey(() => setTruncated(false));



  const { tag: secondTabTag } = useTagBySlug("featured-arbital", "TagPageFragment")
  const { tag: thirdTabTag } = useTagBySlug("history-arbital", "TagPageFragment")

  console.log({ tag, secondTabTag, thirdTabTag })



// interface TagLens {
//   _id: string;
//   collectionName: string;
//   fieldName: string;
//   index: number;
//   contents: TagFragment_description | TagRevisionFragment_description | RevisionDisplay | null;
//   tableOfContents: ToCData | null;
//   parentDocumentId: string;
//   title: string;
//   preview: string | null;
//   tabTitle: string;
//   tabSubtitle: string | null;
//   slug: string;
//   userId: string;
// }

  const lensTabs: TagLens[] = [
  {
    _id: secondTabTag?._id ?? 'featured-tab',
    collectionName: 'Tags',
    fieldName: 'description',
    index: 1,
    contents: secondTabTag?.description ?? null,
    tableOfContents: secondTabTag?.tableOfContents ?? null,
    parentDocumentId: tag?._id ?? '',
    title: 'Featured',
    userId: secondTabTag?.userId ?? '',
    preview: null,
    tabTitle: 'Featured',
    tabSubtitle: null,
    slug: 'featured',
  },
  {
    _id: thirdTabTag?._id ?? 'history-tab',
    collectionName: 'Tags',
    fieldName: 'description',
    index: 2,
    contents: thirdTabTag?.description ?? null,
    tableOfContents: thirdTabTag?.tableOfContents ?? null,
    parentDocumentId: tag?._id ?? '',
    title: 'History',
    userId: thirdTabTag?.userId ?? '',
    preview: null,
    tabTitle: 'History',
    tabSubtitle: null,
    slug: 'history',
  },
  ];

  const splicedTag = {...tag, lenses: lensTabs}

  const { selectedLensId, selectedLens, updateSelectedLens, lenses } = useTagLenses(splicedTag);
  const displayedTagTitle = useDisplayedTagTitle(tag, lenses, selectedLens);

  // if (!tag || !secondTabTag || !thirdTabTag) {
  //   return <Loading />
  // }

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

  const htmlWithAnchors = selectedLens?.tableOfContents?.html ?? selectedLens?.contents?.html ?? "";

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

  const headTagDescription = tag.description?.plaintextDescription || `All posts related to ${tag.name}, sorted by relevance`
  
  const tagFlagItemType: AnyBecauseTodo = {
    allPages: "allPages",
    myPages: "userPages"
  }

  const parentAndSubTags = (tag.parentTag || tag.subTags.length)
    ? (
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
      </div>
    )
    : <></>;

  const tagBodySection = (
    <div id="tagContent" className={classNames(classes.wikiSection,classes.centralColumn)}>
      <AnalyticsContext pageSectionContext="wikiSection">
        { revision && tag.description && (tag.description as TagRevisionFragment_description).user && <div className={classes.pastRevisionNotice}>
          You are viewing revision {tag.description.version}, last edited by <UsersNameDisplay user={(tag.description as TagRevisionFragment_description).user}/>
        </div>}
        {editing ? <div>
          <EditTagForm
            tag={tag}
            successCallback={ async () => {
              setEditing(false)
              await client.resetStore()
            }}
            cancelCallback={() => setEditing(false)}
          />
          <TagVersionHistoryButton tagId={tag._id} />
        </div> :
        <div onClick={clickReadMore}>
          <ContentStyles contentType="tag">
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: description||""}}
              description={`tag ${tag.name}`}
              className={classes.description}
            />
          </ContentStyles>
        </div>}
        <div className={classes.nestedListContainer}>
          <WikiTagNestedList />
        </div>
      </AnalyticsContext>
    </div>
  );

  const tagPostsAndCommentsSection = (
    <div className={classes.centralColumn}>
      {editing && <TagDiscussionSection
        key={tag._id}
        tag={tag}
      />}
      {tag.sequence && <TagIntroSequence tag={tag} />}
      {/* {!tag.wikiOnly && <>
        <AnalyticsContext pageSectionContext="tagsSection">
          <PostsListHeading tag={tag} query={query} classes={classes} />
          <PostsList2
            terms={terms}
            enableTotal
            tagId={tag._id}
            itemsPerPage={200}
          >
            <AddPostsToTag tag={tag} />
          </PostsList2>
        </AnalyticsContext>
        <DeferRender ssr={false}>
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
        </DeferRender>
      </>} */}
    </div>
  );

  const tagToc = (
    <TagTableOfContents
      tag={tag}
      expandAll={expandAll}
      showContributors={true}
      onHoverContributor={onHoverContributor}
    />
  );

  const fixedPositionTagToc = (
    <TableOfContents
      sectionData={selectedLens?.tableOfContents ?? tag.tableOfContents}
      title={tag.name}
      onClickSection={expandAll}
      fixedPositionToc
    />
  );

  const tagHeader = (
    <div className={classNames(classes.header,classes.centralColumn)}>
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
      {lenses.length > 1
        ?  (
          <Tabs
            value={selectedLens?._id}
            onChange={(e, newLensId) => updateSelectedLens(newLensId)}
            classes={{ flexContainer: classes.lensTabsContainer, indicator: classes.hideMuiTabIndicator }}
          >
            {lenses.map(lens => {
              const label = <div className={classes.lensLabel}>
                <span className={classes.lensTitle}>{lens.tabTitle}</span>
                <span className={classes.lensSubtitle}>{lens.tabSubtitle}</span>
              </div>;

              const isSelected = selectedLens?._id === lens._id;

              return <Tab
                className={classNames(classes.lensTab, isSelected && classes.selectedLens, !isSelected && classes.nonSelectedLens)}
                key={lens._id}
                value={lens._id}
                label={label}
                classes={{ labelContainer: classes.tabLabelContainerOverride }}
              />
            })}
          </Tabs>
        )
        : <></>}
      <div className={classes.titleRow}>
        <Typography variant="display3" className={classes.title}>
          {tag.deleted ? "[Deleted] " : ""}{displayedTagTitle}
        </Typography>
        <TagPageButtonRow tag={tag} editing={editing} setEditing={setEditing} hideLabels={true} className={classNames(classes.editMenu, classes.mobileButtonRow)} />
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
      {tag.contributors && <div className={classes.contributorRow}>
        {/* <div className={classes.contributorNameWrapper}>
          <span>Written by </span>
          {tag.contributors.contributors.map(({ user }: { user?: UsersMinimumInfo }) => <UsersNameDisplay key={user?._id} user={user} className={classes.contributorName} />)}
        </div> */}
        {/* <div className={classes.lastUpdated}>
          {'last updated '}
          {selectedLens?.contents?.editedAt && <FormatDate date={selectedLens.contents.editedAt} format="Do MMM YYYY" tooltip={false} />}
        </div> */}
      </div>}
      {/** Just hardcoding an example for now, since we haven't imported the necessary relationships to derive it dynamically */}
      {/* <ContentStyles contentType="tag" className={classes.requirementsAndAlternatives}>
        <div className={classes.relationshipPill}>
          {'Relies on: '}
          <HoverPreviewLink href={'/tag/reads_algebra'} >Ability to read algebra</HoverPreviewLink>
        </div>
        <div className={classes.relationshipPill}>
          <LWTooltip title={<HoverPreviewLink href={'/tag/logical-decision-theories?lens=loose_intro_everyone_else'}>An introduction to logical decision theories for everyone else</HoverPreviewLink>} clickable>
            Less Technical
          </LWTooltip>
        </div>
        <div className={classes.relationshipPill}>
          <LWTooltip title={<HoverPreviewLink href={'/tag/causal-decision-theories'}>Causal decision theories</HoverPreviewLink>} clickable>
            More Technical
          </LWTooltip>
        </div>
        <div className={classes.relationshipPill}>
          {'Teaches: '}
          <HoverPreviewLink href={'/tag/logical-decision-theories'}>Logical decision theories</HoverPreviewLink>
          {', '}
          <HoverPreviewLink href={'/tag/causal-decision-theories'}>Causal decision theories</HoverPreviewLink>
          {', '}
          <HoverPreviewLink href={'/tag/evidential-decision-theories'}>Evidential decision theories</HoverPreviewLink>
        </div>
      </ContentStyles> */}
    </div>
  );

  const originalToc = (
    <ToCColumn
      tableOfContents={tagToc}
      header={tagHeader}
    >
      {parentAndSubTags}
      {tagBodySection}
      {tagPostsAndCommentsSection}
    </ToCColumn>
  );

  const multiColumnToc = (
    <MultiToCLayout
      segments={[
        {
          centralColumn: parentAndSubTags,
        },
        {
          centralColumn: <>
            {tagHeader}
            {tagBodySection}
          </>,
          // toc: tagToc,
          toc: fixedPositionTagToc,
          rightColumn: <TagPageButtonRow tag={tag} editing={editing} setEditing={setEditing} hideLabels={true} className={classNames(classes.editMenu, classes.nonMobileButtonRow)} />
        },
        {
          centralColumn: tagPostsAndCommentsSection,
        },
      ]}
    />
  );
  
  return <AnalyticsContext
    pageContext='tagPage'
    tagName={tag.name}
    tagId={tag._id}
    sortedBy={query.sortedBy || "relevance"}
    limit={terms.limit}
  >
    <HeadTags
      description={headTagDescription}
      structuredData={getTagStructuredData(tag)}
      noIndex={tag.noindex}
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
      {/* {originalToc} */}
      {isFriendlyUI ? originalToc : multiColumnToc}
    </div>
  </AnalyticsContext>
}

const TagPageComponent = registerComponent("TagPage", TagPage);

export default TagPageComponent;

declare global {
  interface ComponentTypes {
    TagPage: typeof TagPageComponent
  }
}
