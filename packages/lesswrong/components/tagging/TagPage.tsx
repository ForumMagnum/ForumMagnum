import { useApolloClient } from "@apollo/client";
import classNames from 'classnames';
import React, { FC, Fragment, useCallback, useEffect, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from "../../lib/betas";
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema';
import { tagGetHistoryUrl, tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { useMulti, UseMultiOptions } from '../../lib/crud/withMulti';
import { truncate } from '../../lib/editor/ellipsize';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useGlobalKeydown, useOnSearchHotkey } from '../common/withGlobalKeydown';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { EditTagForm } from './EditTagPage';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import truncateTagDescription from "../../lib/utils/truncateTagDescription";
import { getTagStructuredData } from "./TagPageRouter";
import { isFriendlyUI } from "../../themes/forumTheme";
import DeferRender from "../common/DeferRender";
import { RelevanceLabel, tagPageHeaderStyles, tagPostTerms } from "./TagPageExports";
import { useStyles, defineStyles } from "../hooks/useStyles";
import { HEADER_HEIGHT } from "../common/Header";
import { MAX_COLUMN_WIDTH } from "../posts/PostsPage/PostsPage";
import { DocumentContributorsInfo, DocumentContributorWithStats, MAIN_TAB_ID, TagLens, useTagLenses } from "@/lib/arbital/useTagLenses";
import { quickTakesTagsEnabledSetting } from "@/lib/publicSettings";
import { isClient } from "@/lib/executionEnvironment";
import qs from "qs";
import { useTagOrLens } from "../hooks/useTagOrLens";
import { useTagEditingRestricted } from "./TagPageButtonRow";
import { useMultiClickHandler } from "../hooks/useMultiClickHandler";
import HistoryIcon from '@material-ui/icons/History';

const sidePaddingStyle = (theme: ThemeType) => ({
  paddingLeft: 42,
  paddingRight: 42,
  [theme.breakpoints.down('xs')]: {
    paddingLeft: '8px',
    paddingRight: '8px',
  },
})

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
    paddingBottom: 5,
    ...sidePaddingStyle(theme),
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
    [theme.breakpoints.down('sm')]: {
      // Ensure this takes priority over the properties in TagPageButtonRow
      display: 'none !important',
    },
    position: 'absolute',
    top: 74,
    right: 8,
  },
  mobileButtonRow: {
    [theme.breakpoints.up('md')]: {
      display: 'none !important',
    },
    marginTop: 8,
    marginBottom: 8,
  },
  editMenu: {},
  wikiSection: {
    paddingTop: 5,
    ...sidePaddingStyle(theme),
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
    fontWeight: 550,
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
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
    width: 300,
    '&:hover': {
      '& $rightColumnOverflowFade': {
        opacity: 0,
        pointerEvents: 'none',
      },
    },
    paddingRight: 30,
  },
  rightColumnContent: {},
  rightColumnOverflowFade: {
    position: "relative",
    zIndex: 2,
    height: 140,
    width: "100%",
    // background: `linear-gradient(0deg, 
    //   ${theme.palette.background.pageActiveAreaBackground} 30%,
    //   ${theme.palette.panelBackground.translucent} 70%,
    //   transparent 100%
    // )`,
    opacity: 1,
  },
  subjectsContainer: {
    // overflow: 'hidden',
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
  linkedTagsHeader: {
    position: 'relative',
    fontSize: '1.0rem',
    marginBottom: 4,
    color: theme.palette.grey[600],
    minWidth: 'fit-content',
    // whiteSpace: 'nowrap',
    display: 'block',
    cursor: 'pointer',
    '&:hover': {
      '& $linkedTagsList': {
        display: 'block',
      },
    },
    marginTop: -8,
  },
  linkedTagsTitle: {
    color: theme.palette.grey[600],
    fontWeight: 550,
    fontSize: '1.2rem',
    marginLeft: 4,
    display: 'inline',
  },
  linkedTagsList: {
    display: 'block',
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 1,
    width: '100%',
  },
  linkedTagsSection: {
    marginBottom: 20,
  },
  linkedTagsSectionTitle: {
    ...theme.typography.subtitle,
    fontWeight: 400,
    fontSize: '1.0rem',
    fontVariant: 'all-petite-caps',
    marginBottom: 2,
    whiteSpace: 'nowrap',
  },
  linkedTag: {
    display: 'block',
    fontSize: '1.0rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    // marginBottom: 4,
    // color: theme.palette.primary.main,
  },
  tocContributors: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: 12
  },
  tocContributor: {
    marginLeft: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.greyAlpha(0.5),
  },
  unselectedEditForm: {
    display: 'none',
  },
  selectedEditForm: {
    display: 'block',
  },
  descriptionContainerEditing: {
    display: 'none',
  },
  contributorRatio: {},
  ...tagPageHeaderStyles(theme),
  mobileRelationships: {
    [theme.breakpoints.up('lg')]: {
      display: 'none',
    },
    marginTop: 8,
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: '8px',
    rowGap: 0,
    ...theme.typography.body2,
    '& > div > span:first-child': {
      color: theme.palette.grey[600],
    },
    '& .break': {
      flexBasis: '100%',
      height: 0,
    },
  },
  relationshipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    width: 'fit-content',
    flex: '0 1 auto',
    minWidth: 'min-content',
    '& > span:first-child': {
      fontWeight: 550,
    },
    '& a': {
      color: theme.palette.primary.main,
    },
  },
  spaceAfterWord: {
    marginRight: 3,
  },
  parentsAndChildrenSmallScreensRoot: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  parentChildRelationships: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 'inherit',
    marginTop: 32,
    paddingTop: 20,
    gap: '4px',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  parentsOrChildrensSection: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  parentsOrChildrensSectionTitle: {
    fontWeight: 550,
    marginRight: 4,
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
  },
  parentOrChild: {
    fontSize: 'unset',
    fontWeight: 400,
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    '&:not(:last-child)::after': {
      content: '", "',
      marginRight: '4px',
    },
  },
  linkedTagMore: {
    color: theme.palette.grey[550],
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.7,
      },  
    },
    revisionNotice: {
      ...theme.typography.body2,
      display: 'flex',
      alignItems: 'center',
      color: theme.palette.error.dark,
      fontWeight: 550,
      marginBottom: 16,
    },
    historyIcon: {
      height: 18,
      width: 18,
      marginRight: 4,
    },
}));

type ArbitalTagPageFragmentNames =
  | "TagPageWithArbitalContentFragment"
  | "TagPageRevisionWithArbitalContentFragment"
  | "TagPageWithArbitalContentAndLensRevisionFragment";

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

// TODO: maybe move this to the server, so that the user doesn't have to wait for the hooks to run to see the contributors
function useDisplayedContributors(contributorsInfo: DocumentContributorsInfo | null) {
  const contributors: DocumentContributorWithStats[] = contributorsInfo?.contributors ?? [];
  if (!contributors.some(({ currentAttributionCharCount }) => currentAttributionCharCount)) {
    return { topContributors: contributors, smallContributors: [] };
  }

  const totalAttributionChars = contributors.reduce((acc: number, contributor: DocumentContributorWithStats) => acc + (contributor.currentAttributionCharCount ?? 0), 0);

  if (totalAttributionChars === 0) {
    return { topContributors: contributors, smallContributors: [] };
  }

  const sortedContributors = [...contributors].sort((a, b) => (b.currentAttributionCharCount ?? 0) - (a.currentAttributionCharCount ?? 0));
  const initialTopContributors = sortedContributors.filter(({ currentAttributionCharCount }) => ((currentAttributionCharCount ?? 0) / totalAttributionChars) > 0.1);
  const topContributors = initialTopContributors.length <= 3 
    ? sortedContributors.filter(({ currentAttributionCharCount }) => ((currentAttributionCharCount ?? 0) / totalAttributionChars) > 0.05)
    : initialTopContributors;
  const smallContributors = sortedContributors.filter(contributor => !topContributors.includes(contributor));

  return { topContributors, smallContributors };
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

const EditLensForm = ({lens, setFormDirty}: {
  lens: TagLens,
  setFormDirty: (dirty: boolean) => void,
}) => {
  const { WrappedSmartForm } = Components;
  return <WrappedSmartForm
    key={lens._id}
    collectionName="MultiDocuments"
    documentId={lens._id}
    queryFragmentName="MultiDocumentEdit"
    mutationFragmentName="MultiDocumentEdit"
    {...(lens.originalLensDocument ? { prefetchedDocument: lens.originalLensDocument } : {})}
    addFields={['summaries']}
    warnUnsavedChanges={true}
    changeCallback={() => {
      setFormDirty(true);
    }}
  />
}

interface ArbitalLinkedPage {
  _id: string,
  name: string,
  slug: string,
}

const LinkedPageDisplay = ({linkedPage, className}: {linkedPage: ArbitalLinkedPage, className?: string}) => {
  const { TagsTooltip } = Components;
  const classes = useStyles(styles);
  return <div key={linkedPage.slug} className={classNames(classes.linkedTag, className)}>
    <TagsTooltip placement="left" tagSlug={linkedPage.slug}>
      <Link to={tagGetUrl(linkedPage)}>{linkedPage.name}</Link>
    </TagsTooltip>
  </div>
}

function hasList(list: ArbitalLinkedPage[] | null): list is ArbitalLinkedPage[] {
  return !!(list && list?.length > 0);
}

const LinkedPageListSection = ({ title, linkedPages, children, limit }: {
  title: string,
  linkedPages: ArbitalLinkedPage[] | null,
  children?: React.ReactNode,
  limit?: number,
}) => {
  const classes = useStyles(styles);

  if (!hasList(linkedPages)) {
    return null;
  }

  return <div className={classes.linkedTagsSection}>
    <div className={classes.linkedTagsSectionTitle}>{title}</div>
    {linkedPages.slice(0, limit).map((linkedPage) => <LinkedPageDisplay key={linkedPage.slug} linkedPage={linkedPage} />)}
    {children}
  </div>
}

const ArbitalLinkedPagesRightSidebar = ({ tag, selectedLens, arbitalLinkedPages }: {
  tag: TagPageFragment,
  selectedLens?: TagLens,
  arbitalLinkedPages?: ArbitalLinkedPagesFragment,
}) => {
  const { ContentStyles } = Components;
  
  const classes = useStyles(styles);
  const [isChildrenExpanded, setIsChildrenExpanded] = useState(false);

  if (!arbitalLinkedPages) {
    return null;
  }

  const { requirements, teaches, lessTechnical, moreTechnical, slower, faster, parents, children } = arbitalLinkedPages;

  const teachesFiltered = teaches?.filter((linkedPage: ArbitalLinkedPage) => linkedPage.slug !== selectedLens?.slug && linkedPage.slug !== tag.slug);
  const childrenDefaultLimitToShow = 4;

  return <ContentStyles contentType="tag">
    <div className={classes.linkedTagsHeader}>
      <div className={classes.linkedTagsList}>
        <LinkedPageListSection title="Relies on" linkedPages={requirements} />
        <LinkedPageListSection title="Teaches" linkedPages={teachesFiltered} />
        <LinkedPageListSection title="Slower alternatives" linkedPages={slower} />
        <LinkedPageListSection title="Less technical alternatives" linkedPages={lessTechnical} />
        <LinkedPageListSection title="Faster alternatives" linkedPages={faster} />
        <LinkedPageListSection title="More technical alternatives" linkedPages={moreTechnical} />
        <LinkedPageListSection title="Parents" linkedPages={parents} />
        <LinkedPageListSection title="Children" linkedPages={children} limit={isChildrenExpanded ? undefined : childrenDefaultLimitToShow}>
          {!isChildrenExpanded && children?.length > childrenDefaultLimitToShow && (
            <div 
              className={classes.linkedTagMore} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsChildrenExpanded(true);
              }}
            >
              and {children.length - childrenDefaultLimitToShow} more
            </div>
          )}
        </LinkedPageListSection>

      </div>
    </div>
  </ContentStyles>;
}

const ArbitalRelationshipsSmallScreen = ({arbitalLinkedPages}: {arbitalLinkedPages?: ArbitalLinkedPagesFragment}) => {
  const classes = useStyles(styles);

  if (!arbitalLinkedPages) {
    return null;
  }

  const { TagsTooltip, ContentStyles } = Components;
  const { requirements, teaches } = arbitalLinkedPages;
  
  return (
    <ContentStyles contentType="tag">
      <div className={classes.mobileRelationships}>
        {requirements.length > 0 && (
          <div className={classes.relationshipRow}>
            <span className={classes.spaceAfterWord}>{'Requires: '}</span>
            {requirements.map((req: ArbitalLinkedPage, i: number) => (
              <span key={req.slug} className={classes.spaceAfterWord}>
                <TagsTooltip tagSlug={req.slug}>
                  <Link to={tagGetUrl(req)}>{req.name}</Link>
                </TagsTooltip>
                {i < requirements.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
        {teaches.length > 0 && (
          <div className={classes.relationshipRow}>
            <span className={classes.spaceAfterWord}>{'Teaches: '}</span>
            {teaches.map((subject: ArbitalLinkedPage, i: number) => (
              <span key={subject.slug} className={classes.spaceAfterWord}>
                <TagsTooltip tagSlug={subject.slug}>
                  <Link to={tagGetUrl(subject)}>{subject.name}</Link>
                </TagsTooltip>
                {i < teaches.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
      </div>
    </ContentStyles>
  );
}

function htmlNodeListToArray(nodes: NodeList): Node[] {
  let ret: Node[] = [];
  for (let i=0; i<nodes.length; i++)
    ret.push(nodes.item(i)!);
  return ret;
}

const pathDescriptions = {
  basic_theoretical: {
    content: `
        <p>Your path will teach you the basic odds form of Bayes' rule at a reasonable pace. It will contain 3 pages:</p>
        <ul>
            <li>Frequency diagrams: A first look at Bayes</li>
            <li>Waterfall diagrams and relative odds</li>
            <li>Introduction to Bayes' rule: Odds form</li>
        </ul>
    `,
    pathId: "62c",
  },
  quick: {
    content: `
        <p>No time to waste! Let's plunge directly into <a href="/w/693">a single-page abbreviated introduction to Bayes' rule</a>.</p>
    `,
    // pathId: "693",
    pathId: null,
  },
  theoretical: {
    content: `
        <p>Your path will teach you the basic odds form of Bayes' rule at a reasonable pace and then delve into the deep mysteries of the Bayes' Rule! Your path will contain 8 pages:</p>
        <ul>
            <li>Frequency diagrams: A first look at Bayes</li>
            <li>Waterfall diagrams and relative odds</li>
            <li>Introduction to Bayes' rule: Odds form</li>
            <li>Belief revision as probability elimination</li>
            <li>Extraordinary claims require extraordinary evidence</li>
            <li>Ordinary claims require ordinary evidence</li>
            <li>Shift towards the hypothesis of least surprise</li>
            <li>Bayesian view of scientific virtues</li>
        </ul>
    `,
    pathId: "62f",
  },
  deep: {
    content: `
        <p>Your path will go over all forms of Bayes' Rule, along with developing deep appreciation for its scientific usefulness. Your path will contain 12 pages:</p>
        <ul>
            <li>Frequency diagrams: A first look at Bayes</li>
            <li>Waterfall diagrams and relative odds</li>
            <li>Introduction to Bayes' rule: Odds form</li>
            <li>Bayes' rule: Proportional form</li>
            <li>Extraordinary claims require extraordinary evidence</li>
            <li>Ordinary claims require ordinary evidence</li>
            <li>Bayes' rule: Log-odds form</li>
            <li>Shift towards the hypothesis of least surprise</li>
            <li>Bayes' rule: Vector form</li>
            <li>Belief revision as probability elimination</li>
            <li>Bayes' rule: Probability form</li>
            <li>Bayesian view of scientific virtues</li>
        </ul>
    `,
    pathId: "61b",
  },
};


let currentPathId: string | null = null;

function startPath() {
  if (currentPathId) {
    window.location.href = `/w/${currentPathId}/?startPath`;
  }
}

function handleRadioChange(radio: HTMLInputElement) {
  const wants = radio.dataset.wants?.split(",") || [];
  const notWants = radio.dataset.notWants?.split(",") || [];

  let pathKey;
  if (wants.includes("62d") && wants.includes("62f")) {
    pathKey = "deep";
  } else if (wants.includes("62d") && notWants.includes("62f")) {
    pathKey = "quick";
  } else if (wants.includes("62f") && notWants.includes("62d")) {
    pathKey = "theoretical";
  } else {
    pathKey = "basic_theoretical";
  }

  const pathDescription = document.getElementById("pathDescription");
  const content = pathDescription?.querySelector(".content");
  const startButton = pathDescription?.querySelector(".start-reading") as HTMLElement;

  if (content) {
    content.innerHTML = pathDescriptions[pathKey as keyof typeof pathDescriptions].content;
  }
  currentPathId = pathDescriptions[pathKey as keyof typeof pathDescriptions].pathId;

  if (pathDescription) {
    pathDescription.style.display = "block";
  }
  if (startButton) {
    if (currentPathId) {
      startButton.style.display = "block";
    } else {
      startButton.style.display = "none";
    }
  }
}

function initializeRadioHandlers() {
  const cleanupFunctions: (() => void)[] = [];
  const radioElements = Array.from(document.querySelectorAll('input[name="preference"]'));
  radioElements.forEach((radio: HTMLInputElement) => {
    const listenerFunction = function() {
      handleRadioChange(radio);
    }
    radio.addEventListener("change", listenerFunction);
    cleanupFunctions.push(() => radio.removeEventListener("change", listenerFunction));
  });

  const checkedRadio = document.querySelector('input[name="preference"]:checked') as HTMLInputElement|null;
  if (checkedRadio) {
    handleRadioChange(checkedRadio);
  }

  return () => cleanupFunctions.forEach((cleanup) => cleanup());
}

if (isClient) {
  Object.assign(window, { startPath });
  Object.assign(window, { handleRadioChange });
}

const ContributorsList = ({ contributors, onHoverContributor, endWithComma }: { contributors: DocumentContributorWithStats[], onHoverContributor: (userId: string | null) => void, endWithComma: boolean }) => {
  const { UsersNameDisplay } = Components;
  const classes = useStyles(styles);

  return <>{contributors.map(({ user }, idx) => (<span key={user._id} onMouseOver={() => onHoverContributor(user._id)} onMouseOut={() => onHoverContributor(null)}>
    <UsersNameDisplay user={user} tooltipPlacement="top" className={classes.contributorName} />
    {endWithComma || idx < contributors.length - 1 ? ', ' : ''}
  </span>))}</>;
}

const ParentsAndChildrenSmallScreen: FC<{ arbitalLinkedPages?: ArbitalLinkedPagesFragment, tagOrLensName: string }> = ({ arbitalLinkedPages, tagOrLensName }) => {
  const classes = useStyles(styles);
  const parents: ArbitalLinkedPage[] = arbitalLinkedPages?.parents ?? [];
  const children: ArbitalLinkedPage[] = arbitalLinkedPages?.children ?? [];
  const [isChildrenExpanded, setIsChildrenExpanded] = useState(false);

  const { ContentStyles } = Components;

  if (parents.length === 0 && children.length === 0) return null;

  return (
    <ContentStyles contentType="tag" className={classes.parentsAndChildrenSmallScreensRoot}>
      <div className={classes.parentChildRelationships}>
        {parents.length > 0 && <div className={classes.parentsOrChildrensSection}>
          <div className={classes.parentsOrChildrensSectionTitle}>Parents:</div>
          {parents.map((parent: ArbitalLinkedPage) => (
            <LinkedPageDisplay key={parent.slug} linkedPage={parent} className={classes.parentOrChild} />
          ))}
        </div>}
        {children.length > 0 && <div className={classes.parentsOrChildrensSection}>
          <div className={classes.parentsOrChildrensSectionTitle}>Children:</div>
          {children.slice(0, isChildrenExpanded ? undefined : 2).map((child: ArbitalLinkedPage) => (
            <LinkedPageDisplay key={child.slug} linkedPage={child} className={classes.parentOrChild} />
          ))}
          {!isChildrenExpanded && children.length > 2 && (
            <div 
              className={classes.linkedTagMore}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsChildrenExpanded(true);
              }}
            >
              and {children.length - 2} more
            </div>
          )}
        </div>}
      </div>
    </ContentStyles>
  );
};

function getTagQueryOptions(
  revision: string | null,
  lensSlug: string | null,
  contributorsLimit: number
): {
  tagFragmentName: ArbitalTagPageFragmentNames;
  tagQueryOptions: Partial<UseMultiOptions<ArbitalTagPageFragmentNames, "Tags">>;
} {
  let tagFragmentName: ArbitalTagPageFragmentNames = "TagPageWithArbitalContentFragment";
  let tagQueryOptions: Required<Pick<UseMultiOptions<ArbitalTagPageFragmentNames, "Tags">, "extraVariables" | "extraVariablesValues">> = {
    extraVariables: {
      contributorsLimit: 'Int',
    },
    extraVariablesValues: {
      contributorsLimit,
    },
  };

  if (revision && !lensSlug) {
    tagFragmentName = "TagPageRevisionWithArbitalContentFragment";

    tagQueryOptions.extraVariables.version = 'String';
    tagQueryOptions.extraVariablesValues.version = revision;
  }

  if (revision && lensSlug) {
    tagFragmentName = "TagPageWithArbitalContentAndLensRevisionFragment";
    
    tagQueryOptions.extraVariables.version = 'String';
    tagQueryOptions.extraVariables.lensSlug = 'String';

    tagQueryOptions.extraVariablesValues.version = revision;
    tagQueryOptions.extraVariablesValues.lensSlug = lensSlug;
  }

  return { tagFragmentName, tagQueryOptions };
}

const TagPage = () => {
  const {
    PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404, Typography,
    PermanentRedirect, HeadTags, UsersNameDisplay, TagFlagItem, TagDiscussionSection,
    TagPageButtonRow, ToCColumn, SubscribeButton, CloudinaryImage2, TagIntroSequence,
    TagTableOfContents, ContentStyles, CommentsListCondensed,
    MultiToCLayout, TableOfContents, FormatDate, LWTooltip, HoverPreviewLink, TagsTooltip,
    PathInfo
  } = Components;
  const classes = useStyles(styles);

  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const { lens: lensSlug } = query;
  // const { onOpenEditor } = useContext(TagEditorContext);
  
  // Support URLs with ?version=1.2.3 or with ?revision=1.2.3 (we were previously inconsistent, ?version is now preferred)
  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? null;
  const [editing, _setEditing] = useState(!!query.edit);
  const [formDirty, setFormDirty] = useState(false);

  // Usually, we want to warn the user before closing the editor when they have unsaved changes
  // There are some exceptions; in those cases, we can pass warnBeforeClosing=false
  const setEditing = useCallback((editing: boolean, warnBeforeClosing = true) => {
    _setEditing((previouslyEditing) => {
      if (!editing && previouslyEditing && warnBeforeClosing && formDirty) {
        const confirmed = confirm("Discard changes?");
        if (!confirmed) {
          return previouslyEditing;
        }
      }
      setFormDirty(false);
      return editing;
    })
  }, [formDirty]);

  const contributorsLimit = 16;

  const { tagFragmentName, tagQueryOptions } = getTagQueryOptions(revision, lensSlug, contributorsLimit);
  const { tag, loadingTag, tagError, lens, loadingLens } = useTagOrLens(slug, tagFragmentName, tagQueryOptions);

  const [truncated, setTruncated] = useState(false)
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);
  const { captureEvent } =  useTracking()
  const client = useApolloClient()

  const { canEdit } = useTagEditingRestricted(tag, editing, currentUser);

  const openInlineEditor = () => {
    if (currentUser && canEdit) {
      setEditing(true);
    }
    // onOpenEditor();
  };

  const handleTripleClick = useMultiClickHandler({
    clickCount: 3,
    timeout: 300,
    onMultiClick: openInlineEditor,
  });

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

  useGlobalKeydown((ev) => {
    // If the user presses escape while editing, we want to cancel the edit
    if (editing && ev.key === 'Escape') {
      setEditing(false);
    }
  });

  const { selectedLensId, selectedLens, updateSelectedLens, lenses } = useTagLenses(tag);
  const displayedTagTitle = useDisplayedTagTitle(tag, lenses, selectedLens);

  const switchLens = useCallback((lensId: string) => {
    // We don't want to warn before closing the editor using this mechanism when switching lenses
    // because we already do it inside of Form.tsx because of the route change
    setEditing(false, false);
    updateSelectedLens(lensId);
  }, [setEditing, updateSelectedLens]);

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

  const onHoverContributor = useCallback((userId: string | null) => {
    setHoveredContributorId(userId);
  }, []);

  const htmlWithAnchors = selectedLens?.tableOfContents?.html ?? selectedLens?.contents?.html ?? "";

  let description = htmlWithAnchors;
  // EA Forum wants to truncate much less than LW
  if (isFriendlyUI) {
    description = truncated
      ? truncateTagDescription(htmlWithAnchors, tag?.descriptionTruncationCount)
      : htmlWithAnchors;
  } else {
    description = (truncated && !tag?.wikiOnly)
    ? truncate(htmlWithAnchors, tag?.descriptionTruncationCount || 4, "paragraphs", "<span>...<p><a>(Read More)</a></p></span>")
    : htmlWithAnchors
  }

  const { topContributors, smallContributors } = useDisplayedContributors(selectedLens?.contributors ?? null);

  if (loadingTag && !tag)
    return <Loading/>
  if (tagError) {
    return <Loading/> //TODO
  }
  if (!tag) {
    if (loadingLens && !lens) {
      return <Loading/>
    }
    if (lens?.parentTag) {
      const baseTagUrl = tagGetUrl(lens.parentTag);
      const newQuery = {
        ...query,
        lens: lens.slug,
      }
      const newUrl = `${baseTagUrl}?${qs.stringify(newQuery)}`;
      return <PermanentRedirect url={newUrl} />
    }
  }
  if (!tag || tag.isPlaceholderPage) {
    return <Components.RedlinkTagPage tag={tag} slug={slug} />
  }

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

  let editForm;
  if (selectedLens?._id === MAIN_TAB_ID) {
    editForm = (
      <span className={classNames(classes.unselectedEditForm, editing && classes.selectedEditForm)}>
        <EditTagForm
          tag={tag}
          warnUnsavedChanges={true}
          successCallback={async () => {
            setEditing(false);
            await client.resetStore();
          }}
          cancelCallback={() => setEditing(false)}
          changeCallback={() => setFormDirty(true)}
        />
      </span>
    );
  } else if (selectedLens) {
    editForm = (
      <span className={classNames(classes.unselectedEditForm, editing && classes.selectedEditForm)}>
        <EditLensForm lens={selectedLens} setFormDirty={setFormDirty} />
      </span>
    );
  }

  const tagBodySection = (
    <div id="tagContent" className={classNames(classes.wikiSection,classes.centralColumn)}>
      <AnalyticsContext pageSectionContext="wikiSection">
        { revision && tag.description && (tag.description as TagRevisionFragment_description).user && <div className={classes.pastRevisionNotice}>
          You are viewing revision {tag.description.version}, last edited by <UsersNameDisplay user={(tag.description as TagRevisionFragment_description).user}/>
        </div>}
        {/* <TagEditorProvider> */}
        <DeferRender ssr={false}>
          {editForm}
        </DeferRender>
        {/* </TagEditorProvider> */}
        <div
          className={classNames(editing && classes.descriptionContainerEditing)}
          onClick={(e) => {
            handleTripleClick(e);
            clickReadMore();
          }}
        >
          <ContentStyles contentType="tag">
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: description||""}}
              description={`tag ${tag.name}`}
              className={classes.description}
              onContentReady={initializeRadioHandlers}
            />
            <PathInfo tag={tag} lens={selectedLens ?? null} />
          </ContentStyles>
        </div>
      </AnalyticsContext>
      <AnalyticsContext pageSectionContext="parentsAndChildrenSmallScreenNavigationButtons">
        <ParentsAndChildrenSmallScreen arbitalLinkedPages={selectedLens?.arbitalLinkedPages ?? undefined} tagOrLensName={selectedLens?.title ?? tag.name} />
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
          <PostsList2
            header={<PostsListHeading tag={tag} query={query} classes={classes} />}
            terms={terms}
            enableTotal
            tagId={tag._id}
            itemsPerPage={200}
            showNoResults={false}
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
  );

  const tagToc = (
    <TagTableOfContents
      tag={tag}
      expandAll={expandAll}
      showContributors={true}
      onHoverContributor={onHoverContributor}
    />
  );

  const tocContributors = <div className={classes.tocContributors}>
    {topContributors.map(({ user }: { user?: UsersMinimumInfo }, idx: number) => (
      <span className={classes.tocContributor} key={user?._id} onMouseOver={() => onHoverContributor(user?._id ?? null)} onMouseOut={() => onHoverContributor(null)}>
        <UsersNameDisplay key={user?._id} user={user} className={classes.contributorName} />
      </span>
    ))}
  </div>;

  const fixedPositionTagToc = (
    <TableOfContents
      sectionData={selectedLens?.tableOfContents ?? tag.tableOfContents}
      title={tag.name}
      heading={tocContributors}
      onClickSection={expandAll}
      fixedPositionToc
      hover
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
      {revision && <Link to={tagGetUrl(tag, {lens: selectedLens?.slug})} className={classes.revisionNotice}>
        <HistoryIcon className={classes.historyIcon} />
        You are viewing version {revision} of this page.
        Click here to view the latest version.
      </Link>}
      {(lenses.length > 1) && <Components.LensTabBar
        lenses={lenses}
        selectedLens={selectedLens}
        switchLens={switchLens}
      />}
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
          <ContributorsList 
            contributors={topContributors} 
            onHoverContributor={onHoverContributor} 
            endWithComma={smallContributors.length > 0} 
          />
          {smallContributors.length > 0 && <LWTooltip 
            title={<ContributorsList contributors={smallContributors} onHoverContributor={onHoverContributor} endWithComma={false} />} 
            clickable 
            placement="top"
          >
            et al.
          </LWTooltip>
          }
        </div>
        <div className={classes.lastUpdated}>
          {'last updated '}
          {selectedLens?.contents?.editedAt && <FormatDate date={selectedLens.contents.editedAt} format="Do MMM YYYY" tooltip={false} />}
        </div>
      </div>}
      <ArbitalRelationshipsSmallScreen arbitalLinkedPages={selectedLens?.arbitalLinkedPages ?? undefined} />
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
      <ArbitalLinkedPagesRightSidebar tag={tag} selectedLens={selectedLens} arbitalLinkedPages={selectedLens?.arbitalLinkedPages ?? undefined} />
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
      <TagPageButtonRow
        tag={tag}
        selectedLens={selectedLens}
        editing={editing}
        setEditing={setEditing}
        hideLabels={true}
        className={classNames(classes.editMenu, classes.nonMobileButtonRow)}
      />
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
