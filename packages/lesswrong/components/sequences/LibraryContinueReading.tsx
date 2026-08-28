import React from 'react';
import sortBy from 'lodash/sortBy';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { makeCloudinaryImageUrl } from '../common/cloudinaryHelpers';
import { useContinueReading } from '../recommendations/withContinueReading';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { Link } from '../../lib/reactRouterWrapper';
import LinkCard from "../common/LinkCard";
import SingleColumnSection from "../common/SingleColumnSection";
import LibrarySectionTitle from "./LibrarySectionTitle";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const MAX_ENTRIES = 3;

const styles = defineStyles('LibraryContinueReading', (theme: ThemeType) => ({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
    },
  },
  card: {
    ...theme.typography.postStyle,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    boxShadow: theme.palette.boxShadow.default,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    transition: "box-shadow .2s ease",
    "&:hover": {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    },
  },
  image: {
    height: 70,
    overflow: "hidden",
    backgroundColor: theme.palette.grey[200],
    "& img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
  },
  content: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    padding: "10px 14px 12px 14px",
  },
  sequenceTitle: {
    ...theme.typography.headerStyle,
    ...theme.typography.smallCaps,
    fontSize: 16,
    lineHeight: 1.25,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    "& a:hover": {
      color: "inherit",
    },
  },
  nextPost: {
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    marginTop: 6,
    color: theme.palette.primary.main,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  progressRow: {
    ...theme.typography.commentStyle,
    marginTop: "auto",
    paddingTop: 10,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: theme.palette.grey[500],
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
  },
  progressTrack: {
    flexGrow: 1,
    height: 3,
    borderRadius: 2,
    background: theme.palette.grey[200],
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    background: theme.palette.primary.light,
  },
}));

const LibraryContinueReading = () => {
  const classes = useStyles(styles);
  const { continueReading } = useContinueReading();

  const entries = sortBy(
    continueReading.filter(entry => entry.sequence && entry.nextPost),
    entry => entry.lastReadTime,
  ).reverse().slice(0, MAX_ENTRIES);

  if (!entries.length) {
    return null;
  }

  return <AnalyticsContext pageSubSectionContext="libraryContinueReading">
    <SingleColumnSection>
      <LibrarySectionTitle
        title="Continue Reading"
        anchor="continue-reading"
        description="Pick up where you left off."
      />
      <div className={classes.grid}>
        {entries.map(({sequence, nextPost, numRead, numTotal}) => {
          if (!sequence) return null;
          const nextPostUrl = postGetPageUrl(nextPost, false, sequence._id);
          const readCount = numRead ?? 0;
          const totalCount = numTotal ?? 0;
          return <LinkCard key={sequence._id} className={classes.card} to={nextPostUrl}>
            {sequence.gridImageId && <div className={classes.image}>
              <img
                src={makeCloudinaryImageUrl(sequence.gridImageId, {
                  c: "fill",
                  dpr: "2",
                  g: "custom",
                  h: "140",
                  w: "500",
                  q: "auto",
                })}
                alt=""
                loading="lazy"
              />
            </div>}
            <div className={classes.content}>
              <div className={classes.sequenceTitle}>
                <Link to={sequenceGetPageUrl(sequence)}>{sequence.title}</Link>
              </div>
              <div className={classes.nextPost}>
                <Link to={nextPostUrl}>Next: {nextPost.title}</Link>
              </div>
              <div className={classes.progressRow}>
                <div className={classes.progressTrack}>
                  <div
                    className={classes.progressFill}
                    style={{width: `${totalCount > 0 ? Math.min(100, Math.round(100 * readCount / totalCount)) : 0}%`}}
                  />
                </div>
                <span>{readCount}/{totalCount} read</span>
              </div>
            </div>
          </LinkCard>;
        })}
      </div>
    </SingleColumnSection>
  </AnalyticsContext>;
};

export default LibraryContinueReading;
