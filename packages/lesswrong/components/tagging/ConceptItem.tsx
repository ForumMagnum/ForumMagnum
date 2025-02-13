import React, { useState } from 'react';
import classNames from 'classnames';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { ArbitalLogo } from '../icons/ArbitalLogo';
import { Link } from '@/lib/reactRouterWrapper';
import { tagGetUrl } from '@/lib/collections/tags/helpers';

const CONCEPT_ITEM_WIDTH = 280;

const styles = defineStyles("ConceptItem", (theme: ThemeType) => ({
  root: {
    maxWidth: CONCEPT_ITEM_WIDTH,
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  item: {
    cursor: "pointer",
    minHeight: 16,
    width: CONCEPT_ITEM_WIDTH,
    maxWidth: CONCEPT_ITEM_WIDTH,
    borderRadius: theme.borderRadius.default,
    padding: "2px 0px",
    paddingLeft: '2px',
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
  wikiItem: {},
  titleWikiItem: {},
  title: {
    fontWeight: 400,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 13,
    fontFamily: theme.palette.fonts.sansSerifStack,
    minWidth: 0,
    opacity: 0.95,
    marginBottom: 1,
    display: "flex",
    alignItems: "baseline",
    lineHeight: "1.4",
    overflow: "hidden",
  },
  titleText: {
    wordBreak: "break-all",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    overflow: "ellipsis",
  },
  maxScore: {
    fontSize: 12,
    color: theme.palette.grey[700],
    width: 20,
    marginBottom: 0,
    textAlign: "left",
  },
  postCount: {
    fontSize: 10,
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    gap: "2px",
    whiteSpace: "nowrap",
    marginLeft: 6,
    opacity: 0.9,
  },
  postCountNumber: {
    position: "relative",
    top: -1,
  },
  titleItemRoot: {
  },
  titleItem: {
    backgroundColor: "unset",
    width: '100%',
    display: "flex",
    alignItems: "center",
  },
  titleItemTitle: {
    fontWeight: 600,
    fontSize: 24,
    fontFamily: theme.palette.fonts.serifStack,
    fontVariant: "small-caps",
    whiteSpace: "nowrap",
    marginRight: 12,
    flexGrow: 1,
  },
  childrenContainer: {
    width: "100%",
    position: "relative",
  },
  childrenList: {
    width: "100%",
    display: "flex",
    gap: "8px",
    rowGap: "24px",
    maxWidth: (CONCEPT_ITEM_WIDTH * 4) + 36,
  },
  childrenListWrapped: {
    flexWrap: "wrap",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    width: CONCEPT_ITEM_WIDTH,
    flex: "0 0 auto",
  },
  showMoreChildren: {
    marginBottom: 8,
    marginTop: 8,
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontVariant: "normal",
    color: theme.palette.grey[600],
    fontWeight: 500,
    marginLeft: 8,
  },
  tooltipHoverPostCount: {},
  tooltipHoverTitle: {
    marginLeft: 16
  },
  tooltipHoverScore: {
    marginRight: 8
  },
  arbitalIcon: {
    height: 10,
    width: 10,
    marginLeft: 4,
    color: theme.palette.arbital.arbitalGreen,
    position: "relative",
    top: 1
  },
  arbitalGreenColor: {
    color: theme.palette.arbital.arbitalGreen,
  },
}));

interface ConceptItemProps {
  wikitag: ConceptItemFragment;
  isTitleItem?: boolean;
  showArbitalIcon?: boolean;
}

const ConceptItem = ({
  wikitag,
  isTitleItem,
  showArbitalIcon
}: ConceptItemProps) => {
  const classes = useStyles(styles);

  const { TagsTooltip, LWTooltip } = Components;

  const usersWhoLiked = wikitag.usersWhoLiked ?? [];
  const maxScore = wikitag.maxScore ?? 0;

  const titleItem = (
    <div className={classes.titleItem}>
      <div className={classes.titleItemTitle}>
        <TagsTooltip
          tagSlug={wikitag.slug}
          noPrefetch
          previewPostCount={0}
          placement='right-start'
        >
          <Link to={tagGetUrl({ slug: wikitag.slug })}>
            {wikitag.name}
          </Link>
        </TagsTooltip>
      </div>
    </div>
  );

  const usersWhoLikedTooltip = (
    <div>
      <div>Users who like this wikitag:</div>
      <div>
        {usersWhoLiked.slice(0, 10).map((user: { displayName: string }) => user.displayName).join(', ')}
        {usersWhoLiked.length > 10 && (
          <span> and {usersWhoLiked.length - 10} more</span>
        )}
      </div>
    </div>
  );

  const regularItem = (
    <div className={classes.item}>
      <LWTooltip
        title={usersWhoLikedTooltip}
        disabled={usersWhoLiked.length === 0}
        placement='bottom-end'
        popperClassName={classes.tooltipHoverScore}
      >
        <div className={classes.maxScore}>{maxScore}</div>
      </LWTooltip>
      <div className={classes.title}>
        <TagsTooltip
          tagSlug={wikitag.slug}
          noPrefetch
          previewPostCount={
            wikitag.description?.wordCount && wikitag.description.wordCount > 2
              ? 0
              : 6
          }
          placement='bottom-start'
          popperClassName={classes.tooltipHoverTitle}
        >
          <span
            className={classNames(classes.titleText, {
              [classes.arbitalGreenColor]:
                wikitag.isArbitalImport && showArbitalIcon,
            })}
          >
            <Link to={tagGetUrl({ slug: wikitag.slug })}>
              {wikitag.name}
            </Link>
          </span>
        </TagsTooltip>
        {showArbitalIcon && wikitag.isArbitalImport && (
          <LWTooltip
            title='This content was imported in part or entirely from Arbital.com'
            placement='right-start'
          >
            <ArbitalLogo className={classes.arbitalIcon} strokeWidth={0.7} />
          </LWTooltip>
        )}
        {wikitag.postCount > 0 && (
          <span className={classes.postCount}>
            <TagsTooltip
              tagSlug={wikitag.slug}
              noPrefetch
              previewPostCount={8}
              hideDescription
              placement='bottom-start'
              className={classes.postCountNumber}
              popperClassName={classes.tooltipHoverPostCount}
              inlineBlock={false}
            >
              ({wikitag.postCount})
            </TagsTooltip>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className={classNames(classes.root, { [classes.titleItemRoot]: isTitleItem })}>
      {isTitleItem ? titleItem : regularItem}
    </div>
  );
};

const ConceptItemComponent = registerComponent('ConceptItem', ConceptItem);

export default ConceptItemComponent;

declare global {
  interface ComponentTypes {
    ConceptItem: typeof ConceptItemComponent
  }
}
