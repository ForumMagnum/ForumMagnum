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
    [theme.breakpoints.up('md')]: {
      paddingLeft: 42,
      paddingRight: 42,
    },
  },
  header: {
    paddingTop: 19,
    paddingBottom: 5,
    [theme.breakpoints.up('md')]: {
      paddingLeft: 42,
      paddingRight: 42,
    },
    background: theme.palette.panelBackground.default,
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
  },
  titleRow: {
    [theme.breakpoints.up('md')]: {
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
    [theme.breakpoints.down('sm')]: {
      fontSize: '27px',
    },
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
    [theme.breakpoints.up('md')]: {
      display: 'none !important',
    },
  },
  editMenu: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 16,
      marginBottom: 8,
    },
    [theme.breakpoints.up('md')]: {
      position: 'absolute',
      top: -36,
      right: 8,
    },
  },
  wikiSection: {
    paddingTop: 5,
    [theme.breakpoints.up('md')]: {
      paddingLeft: 42,
      paddingRight: 42,
    },
    paddingBottom: 12,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
  },
  subHeading: {
    [theme.breakpoints.up('md')]: {
      paddingLeft: 42,
      paddingRight: 42,
    },
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
  description: {},
  lensTabsContainer: {
    gap: '4px',
    [theme.breakpoints.up('md')]: {
      alignItems: 'flex-end',
    },
    [theme.breakpoints.down('sm')]: {
      gap: '2px',
      padding: 2,
      flexWrap: 'wrap-reverse',
      display: 'flex',
      flexDirection: 'row',
    },
  },
  lensTabContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    [theme.breakpoints.down('sm')]: {
      minWidth: '25%',
      maxWidth: '40%',
      flexGrow: 1,
      gap: '0px',
    },
  },
  aboveLensTab: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    marginBottom: 4,
    color: theme.palette.grey[400],
    fontWeight: 700,
    alignSelf: 'center',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  lensTab: {
    minWidth: 'unset',
    borderWidth: 1,
    [theme.breakpoints.down('sm')]: {
      // width: '33%',
      // width: '100%',
      // alignSelf: 'center',
    },
  },
  lensTabRootOverride: {
    [theme.breakpoints.down('sm')]: {
      minHeight: 'unset',
      height: '100%',
      paddingTop: 2,
      paddingBottom: 2,
      borderTopLeftRadius: theme.borderRadius.small * 2,
      borderTopRightRadius: theme.borderRadius.small * 2,
    },
  },
  tabLabelContainerOverride: {
    paddingLeft: 16,
    paddingRight: 16,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 0,
      paddingBottom: 4,
      width: '100%',
    },
  },
  lensLabel: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 48,
    [theme.breakpoints.up('md')]: {
    },
    alignItems: 'start',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      height: 'min-content',
      gap: '4px',
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
    fontSize: '1em',
    fontWeight: 400,
    [theme.breakpoints.down('sm')]: {
      width: 'fit-content',
      display: 'block',
      textAlign: 'left',
      // marginBottom: 1,
      // '&::before': {
      //   content: '"("',
      // },
      // '&::after': {
      //   content: '")"'
      // }
    },
  },
  selectedLens: {
    [theme.breakpoints.down('sm')]: {
      // border: theme.palette.border.grey400,
    },
    [theme.breakpoints.up('md')]: {
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
    background: theme.palette.panelBackground.tagLensTab,
    // Needed to avoid annoying shifting of other tabs when one is selected
    [theme.breakpoints.up('md')]: {
      borderStyle: 'solid',
      borderColor: theme.palette.background.transparent,
    }
  },
  hideMuiTabIndicator: {
    display: 'none',
  },
  contributorRow: {
    ...theme.typography.body1,
    color: theme.palette.grey[600],
    display: 'flex',
    flexDirection: 'column',
    fontSize: '17px',
    lineHeight: 'inherit',
    marginBottom: 8,
  },
  contributorNameWrapper: {
    flex: 1,
    [theme.breakpoints.down('sm')]: {
      fontSize: '15px',
    },
  },
  contributorName: {
    fontWeight: 550,
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
  rightColumn: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
    marginTop: -32,
    '&:hover': {
      '& $rightColumnOverflowFade': {
        opacity: 0,
        pointerEvents: 'none',
      },
    },
  },
  rightColumnContent: {},
  rightColumnOverflowFade: {
    position: "relative",
    zIndex: 2,
    marginTop: -120,
    height: 140,
    width: "100%",
    background: `linear-gradient(0deg, 
      ${theme.palette.background.pageActiveAreaBackground} 30%,
      ${theme.palette.panelBackground.translucent} 70%,
      transparent 100%
    )`,
    opacity: 1,
  },
  subjectsContainer: {
    overflow: 'hidden',
    display: 'flex',
    marginTop: 0,
    marginBottom: 0,
  },
  subjectsHeader: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    marginBottom: 4,
    color: theme.palette.grey[600],
    minWidth: 'fit-content',
  },
  subjectsList: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  subject: {
    textWrap: 'nowrap',
    marginLeft: 6,
    // If it's not the last subject, add a comma
    '&:not(:last-child)::after': {
      content: '","',
    },
  },
  ...tagPageHeaderStyles(theme),
}));

export interface TagLens {
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

function getDefaultLens(tag: TagPageFragment|TagPageWithRevisionFragment|TagHistoryFragment): TagLens {
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

// TODO: get rid of this and use the lens slug when we fix the import to get the correct alias from lens.lensId's pageInfo
function getImputedSlug(lens: MultiDocumentEdit) {
  const slugComponents = lens.tabTitle.split(' ');

  if (lens.tabSubtitle) {
    slugComponents.push(...lens.tabSubtitle.split(' '));
  }

  return slugComponents.join('_').toLowerCase();
}

export function getAvailableLenses(tag: TagPageFragment|TagPageWithRevisionFragment|TagHistoryFragment|null) {
  if (!tag) return [];
  return [
    getDefaultLens(tag),
    ...tag.lenses.map(lens => ({
      ...lens,
      index: lens.index + 1,
      title: lens.title ?? tag.name,
      slug: getImputedSlug(lens)
    }))
  ];
}

function useTagLenses(tag: TagPageFragment | TagPageWithRevisionFragment | null): TagLensInfo {
  const { query, location } = useLocation();
  const navigate = useNavigate();
  const availableLenses = useMemo(() => getAvailableLenses(tag), [tag]);

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

// We need to pass through all of the props that Tab accepts in order to maintain the functionality of Tab switching/etc
const LensTab = ({ key, value, label, lens, isSelected, ...tabProps }: {
  key: string,
  value: string,
  label: React.ReactNode,
  lens: TagLens,
  isSelected: boolean,
} & Omit<React.ComponentProps<typeof Tab>, 'key' | 'value' | 'label'>) => {
  const classes = useStyles(styles);
  return (
    <div key={key} className={classes.lensTabContainer}>
      {lens.tabTitle === 'Loose Intro' && <div className={classes.aboveLensTab}>Less Technical</div>}
      <Tab
        className={classNames(classes.lensTab, isSelected && classes.selectedLens, !isSelected && classes.nonSelectedLens)}
        key={key}
        value={value}
        label={label}
        classes={{ root: classes.lensTabRootOverride, labelContainer: classes.tabLabelContainerOverride }}
        {...tabProps}
      ></Tab>
    </div>
  );
};

const TagPage = () => {
  const {
    PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404, Typography,
    PermanentRedirect, HeadTags, UsersNameDisplay, TagFlagItem, TagDiscussionSection,
    TagPageButtonRow, ToCColumn, SubscribeButton, CloudinaryImage2, TagIntroSequence,
    TagTableOfContents, TagVersionHistoryButton, ContentStyles, CommentsListCondensed,
    MultiToCLayout, TableOfContents, FormatDate, LWTooltip, HoverPreviewLink,
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
  
  useOnSearchHotkey(() => setTruncated(false));

  const { selectedLensId, selectedLens, updateSelectedLens, lenses } = useTagLenses(tag);
  const displayedTagTitle = useDisplayedTagTitle(tag, lenses, selectedLens);

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
  if (tag.oldSlugs?.filter(slug => slug !== tag.slug)?.includes(slug) && !tag.isArbitalImport) {
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
      {!tag.wikiOnly && <>
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
      </>}
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

  // const requirementsAndAlternatives = (
  //   <ContentStyles contentType="tag" className={classNames(classes.requirementsAndAlternatives)}>
  //     <div className={classes.relationshipPill}>
  //       {'Relies on: '}
  //       <HoverPreviewLink href={'/tag/reads_algebra'} >Ability to read algebra</HoverPreviewLink>
  //     </div>
  //   </ContentStyles>
  // );

  const requirementsAndAlternatives = (
    <ContentStyles contentType="tag" className={classes.subjectsContainer}> 
      <div className={classes.subjectsHeader}>Relies on: </div>
      <div className={classes.subjectsList}>
        <span className={classes.subject}><HoverPreviewLink href={'/tag/reads_algebra'} >Ability to read algebra</HoverPreviewLink></span>
      </div>
    </ContentStyles>
  );

  const subjects = (
    <ContentStyles contentType="tag" className={classes.subjectsContainer}> 
      <div className={classes.subjectsHeader}>Subjects: </div>
      <div className={classes.subjectsList}>
        <span className={classes.subject}><HoverPreviewLink href={'/tag/logical-decision-theories'}>Logical decision theories</HoverPreviewLink></span>
        <span className={classes.subject}><HoverPreviewLink href={'/tag/causal-decision-theories'}>Causal decision theories</HoverPreviewLink></span>
        <span className={classes.subject}><HoverPreviewLink href={'/tag/evidential-decision-theories'}>Evidential decision theories</HoverPreviewLink></span>
      </div>
    </ContentStyles>
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
                {lens.tabSubtitle && <span className={classes.lensSubtitle}>{lens.tabSubtitle}</span>}
              </div>;

              const isSelected = selectedLens?._id === lens._id;

              return <LensTab key={lens._id} value={lens._id} label={label} lens={lens} isSelected={isSelected} />;
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
        <div className={classes.contributorNameWrapper}>
          <span>Written by </span>
          {tag.contributors.contributors
            .map(({ user }: { user?: UsersMinimumInfo }, idx: number) => (<>
              <UsersNameDisplay key={user?._id} user={user} className={classes.contributorName} />
              {idx < (tag.contributors.contributors.length - 1) ? ', ' : ''}
            </>))
          }
        </div>
        <div className={classes.lastUpdated}>
          {'last updated '}
          {selectedLens?.contents?.editedAt && <FormatDate date={selectedLens.contents.editedAt} format="Do MMM YYYY" tooltip={false} />}
        </div>
      </div>}
      {/** Just hardcoding an example for now, since we haven't imported the necessary relationships to derive it dynamically */}
      {requirementsAndAlternatives}
      {subjects}
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

  const rightColumn = (<div className={classes.rightColumn}>
    <div className={classes.rightColumnContent}>
      <TagPageButtonRow
        tag={tag}
        editing={editing}
        setEditing={setEditing}
        hideLabels={true}
        className={classNames(classes.editMenu, classes.nonMobileButtonRow)}
      />
      {/* {requirementsAndAlternatives} */}
      {/* {subjects} */}
    </div>
    <div className={classes.rightColumnOverflowFade} />
  </div>);

  const multiColumnToc = (
    <MultiToCLayout
      segments={[
        {
          centralColumn: parentAndSubTags,
        },
        {
          centralColumn: tagHeader,
          toc: fixedPositionTagToc,
        },
        {
          centralColumn: tagBodySection,
          rightColumn
        },
        {
          centralColumn: tagPostsAndCommentsSection,
        },
      ]}
      tocRowMap={[0, 1, 1, 1]}
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
