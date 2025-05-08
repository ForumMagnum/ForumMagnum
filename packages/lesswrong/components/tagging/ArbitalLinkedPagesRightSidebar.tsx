import React, { useState, FC } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import type { TagLens } from '@/lib/arbital/useTagLenses';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { SideItemsSidebar } from "../contents/SideItems";
import { ContentStyles } from "../common/ContentStyles";
import { TagsTooltip } from "./TagsTooltip";

const styles = defineStyles("ArbitalLinkedPages", (theme: ThemeType) => ({
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
    opacity: 1,
  },

  linkedTagsHeader: {
    position: 'relative',
    fontSize: '1.0rem',
    marginBottom: 4,
    color: theme.palette.grey[600],
    display: 'block',
    cursor: 'pointer',
    '&:hover': {
      '& $linkedTagsList': {
        display: 'block',
      },
    },
    marginTop: -8,
  },
  linkedTagsList: {},
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
}));

interface ArbitalLinkedPage {
  _id: string,
  name: string,
  slug: string,
}

const LWTagPageRightColumnInner = ({tag, selectedLens}: {
  tag: TagPageFragment
  selectedLens: TagLens|undefined,
}) => {
  const classes = useStyles(styles);

  return <div className={classes.rightColumn}>
    <div className={classes.rightColumnContent}>
      <SideItemsSidebar/>
    </div>
  </div>
}

const ArbitalLinkedPagesRightSidebarInner = ({ tag, selectedLens, arbitalLinkedPages }: {
  tag: TagPageFragment,
  selectedLens?: TagLens,
  arbitalLinkedPages?: ArbitalLinkedPagesFragment,
}) => {
  const classes = useStyles(styles);
  const [isChildrenExpanded, setIsChildrenExpanded] = useState(false);

  if (!arbitalLinkedPages) {
    return null;
  }

  const { requirements, teaches, lessTechnical, moreTechnical, slower, faster, parents, children } = arbitalLinkedPages;

  const teachesFiltered = teaches?.filter((linkedPage: ArbitalLinkedPage) => linkedPage.slug !== selectedLens?.slug && linkedPage.slug !== tag.slug);
  const childrenDefaultLimitToShow = 4;

  return <AnalyticsContext pageSectionContext="wikitagRelationshipsRightSidebar">
    <ContentStyles contentType="tag">
      <div className={classes.linkedTagsHeader}>
        <div className={classes.linkedTagsList}>
          <LinkedPageListSection title="Relies on" linkedPages={requirements} />
          <LinkedPageListSection title="Teaches" linkedPages={teachesFiltered} />
          <LinkedPageListSection title="Slower alternatives" linkedPages={slower} />
          <LinkedPageListSection title="Less technical alternatives" linkedPages={lessTechnical} />
          <LinkedPageListSection title="Faster alternatives" linkedPages={faster} />
          <LinkedPageListSection title="More technical alternatives" linkedPages={moreTechnical} />
          <LinkedPageListSection title="Parents" linkedPages={parents} />
          <LinkedPageListSection 
            title="Children" 
            linkedPages={children} 
            limit={isChildrenExpanded ? undefined : childrenDefaultLimitToShow}
          >
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
    </ContentStyles>
  </AnalyticsContext>;
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

const LinkedPageDisplay = ({linkedPage, className}: {linkedPage: ArbitalLinkedPage, className?: string}) => {
  const classes = useStyles(styles);
  return <div key={linkedPage.slug} className={classNames(classes.linkedTag, className)}>
    <TagsTooltip placement="left" tagSlug={linkedPage.slug}>
      <Link to={tagGetUrl(linkedPage)}>{linkedPage.name}</Link>
    </TagsTooltip>
  </div>
}

const ArbitalRelationshipsSmallScreenInner = ({arbitalLinkedPages, selectedLens, tag}: {
  arbitalLinkedPages?: ArbitalLinkedPagesFragment
  selectedLens?: TagLens,
  tag: TagPageFragment,
}) => {
  const classes = useStyles(styles);

  if (!arbitalLinkedPages) {
    return null;
  }
  const { requirements, teaches } = arbitalLinkedPages;
  const teachesFiltered = teaches?.filter((linkedPage: ArbitalLinkedPage) => linkedPage.slug !== selectedLens?.slug && linkedPage.slug !== tag.slug);
  
  return (
    <AnalyticsContext pageSectionContext="wikitagRelationshipsSmallScreen">
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
          {teachesFiltered.length > 0 && (
            <div className={classes.relationshipRow}>
              <span className={classes.spaceAfterWord}>{'Teaches: '}</span>
              {teachesFiltered.map((subject: ArbitalLinkedPage, i: number) => (
                <span key={subject.slug} className={classes.spaceAfterWord}>
                  <TagsTooltip tagSlug={subject.slug}>
                    <Link to={tagGetUrl(subject)}>{subject.name}</Link>
                  </TagsTooltip>
                  {i < teachesFiltered.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
        </div>
      </ContentStyles>
    </AnalyticsContext>
  );
}

const ParentsAndChildrenSmallScreenInner: FC<{ arbitalLinkedPages?: ArbitalLinkedPagesFragment, tagOrLensName: string }> = ({ arbitalLinkedPages, tagOrLensName }) => {
  const classes = useStyles(styles);
  const parents: ArbitalLinkedPage[] = arbitalLinkedPages?.parents ?? [];
  const children: ArbitalLinkedPage[] = arbitalLinkedPages?.children ?? [];
  const [isChildrenExpanded, setIsChildrenExpanded] = useState(false);
  if (parents.length === 0 && children.length === 0) return null;

  return (
    <AnalyticsContext pageSectionContext="wikitagParentsAndChildrenSmallScreens">
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
    </AnalyticsContext>
  );
};


function hasList(list: ArbitalLinkedPage[] | null): list is ArbitalLinkedPage[] {
  return !!(list && list?.length > 0);
}


export const LWTagPageRightColumn = registerComponent('LWTagPageRightColumn', LWTagPageRightColumnInner);
export const ArbitalLinkedPagesRightSidebar = registerComponent('ArbitalLinkedPagesRightSidebar', ArbitalLinkedPagesRightSidebarInner);
export const ArbitalRelationshipsSmallScreen = registerComponent('ArbitalRelationshipsSmallScreen', ArbitalRelationshipsSmallScreenInner);
export const ParentsAndChildrenSmallScreen = registerComponent('ParentsAndChildrenSmallScreen', ParentsAndChildrenSmallScreenInner);

declare global {
  interface ComponentTypes {
    LWTagPageRightColumn: typeof LWTagPageRightColumn
    ArbitalLinkedPagesRightSidebar: typeof ArbitalLinkedPagesRightSidebar
    ArbitalRelationshipsSmallScreen: typeof ArbitalRelationshipsSmallScreen
    ParentsAndChildrenSmallScreen: typeof ParentsAndChildrenSmallScreen
  }
}

