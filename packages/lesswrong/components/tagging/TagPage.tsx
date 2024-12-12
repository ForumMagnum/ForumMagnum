import { useApolloClient } from "@apollo/client";
import classNames from 'classnames';
import React, { FC, Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from "../../lib/betas";
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema';
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { useMulti, UseMultiOptions } from '../../lib/crud/withMulti';
import { truncate } from '../../lib/editor/ellipsize';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { useGlobalKeydown, useOnSearchHotkey } from '../common/withGlobalKeydown';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { EditTagForm } from './EditTagPage';
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
import { DocumentContributorsInfo, DocumentContributorWithStats, MAIN_TAB_ID, TagLens, useTagLenses } from "@/lib/arbital/useTagLenses";
import { quickTakesTagsEnabledSetting } from "@/lib/publicSettings";
import { TagContributor } from "./arbitalTypes";
import { TagEditorContext, TagEditorProvider } from "./TagEditorContext";
import { isClient } from "@/lib/executionEnvironment";
import qs from "qs";
import { useTagOrLens } from "../hooks/useTagOrLens";
import { useTagEditingRestricted } from "./TagPageButtonRow";

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
  description: {},
  lensTabsContainer: {
    gap: '4px',
    [theme.breakpoints.up('md')]: {
      alignItems: 'flex-end',
    },
    [theme.breakpoints.down('sm')]: {
      gap: '2px',
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
      maxWidth: '40%',
      // TODO: maybe have a conditional flex-grow for 2 vs. 3+ lens tabs
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
    },
    borderTopLeftRadius: theme.borderRadius.small * 2,
    borderTopRightRadius: theme.borderRadius.small * 2,
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
      // These don't work with borderImageSource, maybe TODO
      // borderTopLeftRadius: theme.borderRadius.small * 2,
      // borderTopRightRadius: theme.borderRadius.small * 2,
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
    marginTop: -32,
    width: 300,
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
    whiteSpace: 'nowrap',
    display: 'inline-block',
    cursor: 'pointer',
    '&:hover': {
      '& $linkedTagsList': {
        display: 'block',
      },
    },
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
    background: theme.palette.background.paper,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: theme.borderRadius.default,
    padding: '16px',
    zIndex: 1,
    minWidth: 200,
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
    marginRight: 2,
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
}));

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
  if (!contributors.some(({ contributionVolume }) => contributionVolume)) {
    return { topContributors: contributors, smallContributors: [] };
  }
  const totalDiffVolume = contributors.reduce((acc: number, contributor: TagContributor) => acc + contributor.contributionVolume, 0);
  const sortedContributors = [...contributors].sort((a, b) => b.contributionVolume - a.contributionVolume);
  const topContributors = sortedContributors.filter(({ contributionVolume }) => contributionVolume / totalDiffVolume > 0.1);
  const smallContributors = sortedContributors.filter(({ contributionVolume }) => contributionVolume / totalDiffVolume <= 0.1);
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

const EditLensForm = ({lens}: {
  lens: TagLens,
}) => {
  const { WrappedSmartForm } = Components;
  return <WrappedSmartForm
    key={lens._id}
    collectionName="MultiDocuments"
    documentId={lens._id}
    queryFragmentName="MultiDocumentEdit"
    mutationFragmentName="MultiDocumentEdit"
    {...(lens.originalLensDocument ? { prefetchedDocument: lens.originalLensDocument } : {})}
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

const LinkedPageListSection = ({ title, linkedPages, children }: {
  title: string,
  linkedPages: ArbitalLinkedPage[] | null,
  children?: React.ReactNode,
}) => {
  const classes = useStyles(styles);

  if (!hasList(linkedPages)) {
    return null;
  }

  return <div className={classes.linkedTagsSection}>
    <div className={classes.linkedTagsSectionTitle}>{title}</div>
    {linkedPages.map((linkedPage) => <LinkedPageDisplay key={linkedPage.slug} linkedPage={linkedPage} />)}
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
        <LinkedPageListSection title="Children" linkedPages={parents}>
          {!isChildrenExpanded && children?.length > 2 && (
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

const bayesGuideScript = () => {
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

  let currentContainer: Element|null = null;

  function initializeRadioHandlers() {
    document.querySelectorAll('input[name="preference"]').forEach((radio: HTMLInputElement) => {
      radio.addEventListener("change", function() {
        handleRadioChange(this);
      });
    });

    const checkedRadio = document.querySelector('input[name="preference"]:checked') as HTMLInputElement|null;
    if (checkedRadio) {
      handleRadioChange(checkedRadio);
    }
  }

  if (isClient) {
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
  
    // Watch for our content being added to or removed from the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;
        
        // Check if our current container was removed
        if (currentContainer && !currentContainer.isConnected) {
          currentContainer = null;
        }
        
        // Only look for new container if we don't have one
        if (!currentContainer) {
          for (const node of htmlNodeListToArray(mutation.addedNodes)) {
            if (!(node instanceof Element)) continue;
            
            const container = node.matches('.question-container') 
              ? node 
              : node.querySelector('.question-container');
              
            if (container) {
              currentContainer = container;
              initializeRadioHandlers();
              break;
            }
          }
        }
      }
    });
  
    // Start observing from the document root
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  
    // Initial setup
    initializeRadioHandlers();
  
    Object.assign(window, { startPath });
    Object.assign(window, { handleRadioChange });
  }
};

function addBayesGuideScript() {
  if (isClient) {
    if (document.readyState === 'complete') {
      bayesGuideScript();
    } else {
      document.addEventListener('DOMContentLoaded', bayesGuideScript);
    }
  }
}

addBayesGuideScript();

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
  // const { onOpenEditor } = useContext(TagEditorContext);
  
  // Support URLs with ?version=1.2.3 or with ?revision=1.2.3 (we were previously inconsistent, ?version is now preferred)
  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? null;

  const contributorsLimit = 16;
  const tagQueryOptions: Partial<UseMultiOptions<"TagPageFragment" | "TagPageWithRevisionFragment", "Tags">> = {
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
  };

  const tagFragmentName = revision ? "TagPageWithRevisionFragment" : "TagPageFragment";

  const { tag, loadingTag, lens, loadingLens } = useTagOrLens(slug, tagFragmentName, tagQueryOptions);

  const [truncated, setTruncated] = useState(false)
  const [editing, setEditing] = useState(!!query.edit)
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);
  const { captureEvent } =  useTracking()
  const client = useApolloClient()

  const { canEdit } = useTagEditingRestricted(tag, editing, currentUser);

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
    return <Error404/>
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

  const openInlineEditor = () => {
    if (currentUser && canEdit) {
      setEditing(true);
    }
    // onOpenEditor();
  };

  const tagBodySection = (
    <div id="tagContent" className={classNames(classes.wikiSection,classes.centralColumn)}>
      <AnalyticsContext pageSectionContext="wikiSection">
        { revision && tag.description && (tag.description as TagRevisionFragment_description).user && <div className={classes.pastRevisionNotice}>
          You are viewing revision {tag.description.version}, last edited by <UsersNameDisplay user={(tag.description as TagRevisionFragment_description).user}/>
        </div>}
        {/* <TagEditorProvider> */}
          <span className={classNames(classes.unselectedEditForm, editing && selectedLens?._id === MAIN_TAB_ID && classes.selectedEditForm)}>
            <EditTagForm
              tag={tag}
              successCallback={ async () => {
                setEditing(false)
                await client.resetStore()
              }}
              cancelCallback={() => setEditing(false)}
            />
          </span>
          {lenses.filter(lens => lens._id !== MAIN_TAB_ID).map(lens => <span key={lens._id} className={classNames(classes.unselectedEditForm, editing && selectedLens?._id === lens._id && classes.selectedEditForm)}>
            <EditLensForm key={lens._id} lens={lens} />
          </span>)}
        {/* </TagEditorProvider> */}
        <div className={classNames(editing && classes.descriptionContainerEditing)} onClick={clickReadMore} onDoubleClick={openInlineEditor}>
          <ContentStyles contentType="tag">
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: description||""}}
              description={`tag ${tag.name}`}
              className={classes.description}
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
              const label = <div key={lens._id} className={classes.lensLabel}>
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
      {/** Just hardcoding an example for now, since we haven't imported the necessary relationships to derive it dynamically */}
      {/* {requirementsAndAlternatives} */}
      {/* {subjects} */}
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
      {/* {requirementsandalternatives}
      {subjects} */}
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
